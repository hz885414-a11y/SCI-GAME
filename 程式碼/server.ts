import express from "express";
import path from "path";
import https from "https";
import { createServer as createViteServer, loadEnv } from "vite";
import type { GameEvent } from "./src/systems/gameEvents";
import { processCardEvent, validateCardEvent } from "./src/card-events/engine";
import { getDefaultCardRules, getDefaultManagedCards } from "./src/card-events/seed";
import type { CardEventPayload, CardRule, ManagedCard, UserCardState } from "./src/card-events/types";
import { DEFAULT_GAME_CONFIG } from "./src/config/defaults";
import type { GameConfig } from "./src/config/types";

const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
const firebaseDatabaseUrl = (env.VITE_FIREBASE_DATABASE_URL || "").replace(/\/$/, "");
const firebaseSecret = env.FIREBASE_DATABASE_SECRET || "";
const localUserState = new Map<string, UserCardState>();
const userEventLocks = new Map<string, Promise<void>>();
let firebaseRetryAt = 0;

async function withUserEventLock<T>(uid: string, task: () => Promise<T>): Promise<T> {
  const previous = userEventLocks.get(uid) || Promise.resolve();
  let release = () => undefined;
  const current = new Promise<void>((resolve) => { release = resolve; });
  const chain = previous.then(() => current);
  userEventLocks.set(uid, chain);
  await previous;
  try {
    return await task();
  } finally {
    release();
    if (userEventLocks.get(uid) === chain) userEventLocks.delete(uid);
  }
}

function firebaseEndpoint(pathname: string): string {
  if (!firebaseDatabaseUrl) throw new Error("伺服器尚未設定 VITE_FIREBASE_DATABASE_URL");
  return `${firebaseDatabaseUrl}/${pathname}.json${firebaseSecret ? `?auth=${encodeURIComponent(firebaseSecret)}` : ""}`;
}

async function firebaseRead<T>(pathname: string): Promise<T | null> {
  const response = await fetch(firebaseEndpoint(pathname), { cache: "no-store" });
  if (!response.ok) throw new Error(`Firebase 讀取失敗 (${response.status})`);
  return await response.json() as T | null;
}

async function firebaseWrite(pathname: string, value: unknown): Promise<void> {
  const response = await fetch(firebaseEndpoint(pathname), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
  if (!response.ok) throw new Error(`Firebase 儲存失敗 (${response.status})`);
}

function asList<T>(value: T[] | Record<string, T> | null | undefined): T[] {
  return Array.isArray(value) ? value : Object.values(value || {});
}

/** The established Knowledge Events & Cards editor is the single source of truth.
 * It is adapted here into the lower-level priority rule engine. */
function toKnowledgeRules(config: GameConfig): { cards: ManagedCard[]; rules: CardRule[] } {
  return {
    cards: config.cards.map((card) => ({ id: card.id, name: card.title, description: card.description, category: card.category, rarity: "common", image: card.image, hidden: false, enabled: true })),
    rules: config.events.map((event) => {
      // The normal action remains the primary trigger. A special condition is
      // stored as another accumulated stat and is therefore an AND condition,
      // not a replacement trigger.
      const conditions: CardRule["conditions"] = { action: event.action, statKey: `action.${event.action}` };
      if (event.specialCondition === "prologueCompleted") conditions["stat.action.special.prologueCompleted"] = 1;
      if (event.specialCondition === "prologueSkipped") conditions["stat.action.special.prologueSkipped"] = 1;
      if (event.specialCondition === "coinTotal") conditions["stat.action.collectCoin"] = Math.max(1, Number(event.specialValue) || 1);
      if (event.specialCondition === "dialogueTotal") conditions["stat.action.special.dialogueSubmitted"] = Math.max(1, Number(event.specialValue) || 1);
      // Scenario / exhibition values are represented by explicit special event
      // actions, allowing future UI options without changing every card rule.
      if (event.specialCondition === "dialogueScenarioFirst" && event.specialValue) conditions[`stat.action.special.dialogueScenarioFirst.${event.specialValue}`] = 1;
      if (event.specialCondition === "exhibitionClicked" && event.specialValue) conditions[`stat.action.special.exhibitionClicked.${event.specialValue}`] = 1;
      return { id: event.id, cardId: event.rewardCard, triggerType: "action" as const, conditions, requiredCount: event.requiredCount, priority: event.priority || 0, enabled: true };
    }),
  };
}

async function loadKnowledgeConfig(): Promise<GameConfig> {
  if (!firebaseDatabaseUrl) return DEFAULT_GAME_CONFIG;
  try {
    const remote = await firebaseRead<Partial<GameConfig>>("gameConfig/v1");
    return remote ? { ...DEFAULT_GAME_CONFIG, ...remote, cards: remote.cards || DEFAULT_GAME_CONFIG.cards, events: remote.events || DEFAULT_GAME_CONFIG.events } : DEFAULT_GAME_CONFIG;
  } catch { return DEFAULT_GAME_CONFIG; }
}

async function loadCardEventState(uid: string): Promise<{ cards: ManagedCard[]; rules: CardRule[]; user?: UserCardState; remote: boolean }> {
  const knowledge = toKnowledgeRules(await loadKnowledgeConfig());
  if (!firebaseDatabaseUrl || Date.now() < firebaseRetryAt) {
    return { ...knowledge, user: localUserState.get(uid), remote: false };
  }
  try {
    const [remoteCards, remoteRules, user] = await Promise.all([
      firebaseRead<ManagedCard[] | Record<string, ManagedCard>>("cards"),
      firebaseRead<CardRule[] | Record<string, CardRule>>("cardRules"),
      firebaseRead<UserCardState>(`users/${uid}`),
    ]);
    const cards = asList(remoteCards);
    const rules = asList(remoteRules);
    return {
      cards: knowledge.cards.length ? knowledge.cards : (cards.length ? cards : getDefaultManagedCards()),
      rules: knowledge.rules.length ? knowledge.rules : (rules.length ? rules : getDefaultCardRules()),
      user: user || undefined,
      remote: true,
    };
  } catch (error) {
    firebaseRetryAt = Date.now() + 30_000;
    console.warn("[Card Event System] Firebase unavailable; using server fallback state.", error);
    return { ...knowledge, user: localUserState.get(uid), remote: false };
  }
}

async function saveCardEventState(uid: string, state: UserCardState, remote: boolean): Promise<void> {
  if (remote) {
    try {
      await firebaseWrite(`users/${uid}`, state);
      return;
    } catch (error) {
      console.warn("[Card Event System] Could not persist Firebase state; keeping a server fallback.", error);
    }
  }
  localUserState.set(uid, state);
}

function adaptGameEvent(uid: unknown, event: GameEvent): CardEventPayload {
  const data = Object.fromEntries(
    Object.entries(event.data).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)),
  ) as Record<string, string | number | boolean>;
  const amount = typeof data.amount === "number" ? data.amount : 1;
  const base = { eventId: event.eventId, uid, amount };
  if (typeof data.action === "string") return validateCardEvent({ ...base, eventType: "action", data });
  if (event.eventType === "talk_to_character") return validateCardEvent({ ...base, eventType: "dialogue", data });
  if (event.eventType === "enter_area") return validateCardEvent({ ...base, eventType: "areaVisit", data: { ...data, areaId: String(data.area || data.areaId || "unknown") } });
  if (event.eventType === "boss_defeated" || event.eventType === "boss_failed") return validateCardEvent({ ...base, eventType: "bossResult", data: { ...data, outcome: event.eventType === "boss_defeated" ? "victory" : "failure" } });
  if (event.eventType === "quiz_correct" || event.eventType === "quiz_wrong") return validateCardEvent({ ...base, eventType: "quizAnswer", data: { ...data, correct: event.eventType === "quiz_correct" } });
  if (event.eventType === "item_collected") return validateCardEvent({ ...base, eventType: "collectible", data: { ...data, itemId: String(data.itemId || data.action || "unknown") } });
  return validateCardEvent({ ...base, eventType: "action", data: { ...data, action: String(data.action || event.eventType) } });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  app.use(express.json({ limit: "64kb" }));

  app.get("/api/card-event-admin/config", async (_req, res) => {
    try {
      const [remoteCards, remoteRules] = await Promise.all([
        firebaseRead<ManagedCard[] | Record<string, ManagedCard>>("cards"),
        firebaseRead<CardRule[] | Record<string, CardRule>>("cardRules"),
      ]);
      const cards = asList(remoteCards);
      const cardRules = asList(remoteRules);
      res.json({ cards: cards.length ? cards : getDefaultManagedCards(), cardRules: cardRules.length ? cardRules : getDefaultCardRules(), source: cards.length || cardRules.length ? "firebase" : "defaults" });
    } catch (error) {
      res.status(503).json({ error: error instanceof Error ? error.message : "無法連線 Firebase" });
    }
  });

  app.put("/api/card-event-admin/config", async (req, res) => {
    const cards = asList<ManagedCard>(req.body?.cards);
    const cardRules = asList<CardRule>(req.body?.cardRules);
    const validCards = cards.every((card) => card.id && card.name && card.category && typeof card.enabled === "boolean" && typeof card.hidden === "boolean");
    const validRules = cardRules.every((rule) => rule.id && rule.cardId && rule.triggerType && Number.isFinite(rule.requiredCount) && Number.isFinite(rule.priority));
    if (!validCards || !validRules) return res.status(400).json({ error: "卡片或規則資料不完整" });
    try {
      await Promise.all([firebaseWrite("cards", cards), firebaseWrite("cardRules", cardRules)]);
      res.json({ ok: true });
    } catch (error) {
      res.status(503).json({ error: error instanceof Error ? error.message : "無法儲存 Firebase" });
    }
  });

  app.post("/api/card-events", async (req, res) => {
    try {
      const event = validateCardEvent({ ...req.body, eventId: req.body?.eventId || `legacy_${crypto.randomUUID()}` });
      const processed = await withUserEventLock(event.uid, async () => {
        const source = await loadCardEventState(event.uid);
        const result = processCardEvent(event, source.cards, source.rules, source.user);
        await saveCardEventState(event.uid, result.state, source.remote);
        return result;
      });
      res.json(processed.result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "事件處理失敗" });
    }
  });

  app.delete("/api/card-events/:uid", async (req, res) => {
    const uid = req.params.uid;
    if (!/^[A-Za-z0-9_-]{8,128}$/.test(uid)) return res.status(400).json({ error: "無效的玩家識別碼" });
    localUserState.delete(uid);
    try {
      if (firebaseDatabaseUrl) await firebaseWrite(`users/${uid}`, null);
      res.json({ ok: true });
    } catch (error) {
      // The local state is still reset, so an exhibition reset remains reliable
      // even if the protected Firebase user path is temporarily unavailable.
      res.json({ ok: true, offline: true });
    }
  });

  app.post("/api/game-events", async (req, res) => {
    try {
      const event = req.body?.event as GameEvent | undefined;
      if (!event || typeof event.eventId !== "string" || typeof event.eventType !== "string" || typeof event.timestamp !== "string" || Number.isNaN(Date.parse(event.timestamp)) || !event.data || typeof event.data !== "object" || Array.isArray(event.data)) {
        throw new Error("事件格式必須包含 eventId、eventType、timestamp 與 data");
      }
      const adapted = adaptGameEvent(req.body?.uid, event);
      const processed = await withUserEventLock(adapted.uid, async () => {
        const source = await loadCardEventState(adapted.uid);
        const result = processCardEvent(adapted, source.cards, source.rules, source.user);
        await saveCardEventState(adapted.uid, result.state, source.remote);
        return result;
      });
      res.json({ event, ...processed.result });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "事件處理失敗" });
    }
  });

  // Google Drive Streaming Proxy
  app.get("/api/video", async (req, res) => {
    const fileId = "1-Q1dUSPAawrpB7tCZjOSUAq4A7VDbX0o";
    const rangeHeader = req.headers.range;

    console.log(`[Video Proxy] Request for file ${fileId}, Range: ${rangeHeader || 'None'}`);

    try {
      const getGoogleDriveStream = (fId: string, range: string | undefined): Promise<{ headers: any; stream: any; status: number }> => {
        return new Promise((resolve, reject) => {
          const url = `https://drive.google.com/uc?export=download&id=${fId}`;
          const options: any = {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
          };
          if (range) {
            options.headers['Range'] = range;
          }

          https.get(url, options, (response) => {
            if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
              followRedirect(response.headers.location, range, resolve, reject);
            } else {
              handleResponse(response, fId, range, resolve, reject);
            }
          }).on('error', reject);
        });
      };

      const followRedirect = (url: string, range: string | undefined, resolve: any, reject: any) => {
        const options: any = {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          }
        };
        if (range) {
          options.headers['Range'] = range;
        }
        https.get(url, options, (response) => {
          if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            followRedirect(response.headers.location, range, resolve, reject);
          } else {
            resolve({ headers: response.headers, stream: response, status: response.statusCode || 200 });
          }
        }).on('error', reject);
      };

      const handleResponse = (response: any, fId: string, range: string | undefined, resolve: any, reject: any) => {
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('text/html')) {
          let body = '';
          response.on('data', (chunk: any) => { body += chunk; });
          response.on('end', () => {
            const match = body.match(/confirm=([A-Za-z0-9_-]+)/);
            if (match && match[1]) {
              const confirmCode = match[1];
              const confirmUrl = `https://drive.google.com/uc?export=download&confirm=${confirmCode}&id=${fId}`;
              followRedirect(confirmUrl, range, resolve, reject);
            } else {
              resolve({ headers: response.headers, stream: response, status: response.statusCode || 200 });
            }
          });
        } else {
          resolve({ headers: response.headers, stream: response, status: response.statusCode || 200 });
        }
      };

      const result = await getGoogleDriveStream(fileId, rangeHeader);

      // Copy key headers back to client
      const headersToCopy = [
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges',
        'cache-control',
      ];

      res.status(result.status);
      headersToCopy.forEach(header => {
        if (result.headers[header]) {
          res.setHeader(header, result.headers[header]);
        }
      });

      // Ensure appropriate content-type if missing
      if (!res.getHeader('content-type')) {
        res.setHeader('content-type', 'video/mp4');
      }

      result.stream.pipe(res);

    } catch (error: any) {
      console.error("[Video Proxy Error]", error);
      res.status(500).send("Video streaming failed: " + error.message);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
