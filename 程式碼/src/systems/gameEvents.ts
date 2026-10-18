import type { KnowledgeCardDefinition } from "../data/cardDatabase";
import type { GameEventDefinition } from "../data/eventConfig";
import { enqueueCardRewards } from "./eventManager";
import type { ManagedCard } from "../card-events/types";
import { getAllCardDefinitions, saveCustomCardDefinition } from "../data/cardDatabase";
import { getAllEventDefinitions } from "../data/eventConfig";
import { getPlayerStats } from "./playerStats";
import { emitAmbientEvent } from "../ambient-dialogues/events";

export type GameEventType =
  | "enter_area"
  | "talk_to_character"
  | "quiz_correct"
  | "quiz_wrong"
  | "boss_defeated"
  | "boss_failed"
  | "item_collected"
  | "mission_completed"
  | "mission_failed"
  | "player_action"
  | "debug_trigger";

export interface GameEvent<TData extends Record<string, unknown> = Record<string, unknown>> {
  eventId: string;
  eventType: GameEventType | (string & {});
  timestamp: string;
  data: TData;
}

export interface CardReward {
  rewardId: string;
  event: GameEventDefinition;
  card: KnowledgeCardDefinition;
}

const UID_KEY = "sci_card_event_uid";
// Card eligibility is evaluated on the server as events arrive. Keep one
// client-side lane so a terminal event (gameOver/stagesCleared) can never
// overtake the Boss outcome or another action that happened just before it.
let eventSubmissionQueue: Promise<void> = Promise.resolve();

function getCardEventUid(): string {
  const current = window.localStorage.getItem(UID_KEY);
  if (current) return current;
  const uid = `anon_${crypto.randomUUID().replace(/-/g, "")}`;
  window.localStorage.setItem(UID_KEY, uid);
  return uid;
}

export async function resetCardEventPlayer(): Promise<void> {
  const uid = getCardEventUid();
  try {
    await fetch(`/api/card-events/${encodeURIComponent(uid)}`, { method: "DELETE" });
  } catch (error) {
    console.warn("Unable to reset server card-event state.", error);
  }
}

function legacyReward(card: ManagedCard, event: GameEvent): CardReward | null {
  let legacyCard = getAllCardDefinitions().find((candidate) => candidate.id === card.id);
  // A newly managed card may not exist in the old visual catalogue yet. Cache a
  // compatible visual definition locally so the reveal and knowledge book work.
  if (!legacyCard) {
    saveCustomCardDefinition({ id: card.id, category: card.category as KnowledgeCardDefinition["category"], icon: card.rarity === "legendary" ? "🏆" : card.rarity === "epic" ? "✨" : "📘", title: card.name, description: card.description, industryNote: "由 Card Event System 解鎖。", image: card.image });
    legacyCard = getAllCardDefinitions().find((candidate) => candidate.id === card.id);
  }
  if (!legacyCard) return null;
  return {
    rewardId: `server:${card.id}`,
    event: { id: `server_${card.id}`, title: "新知識解鎖", content: `你完成了卡片條件：「${card.name}」。`, icon: "✨", triggerType: "actionCount", action: "killEnemy", requiredCount: 1, rewardCard: card.id, once: true },
    card: legacyCard,
  };
}

/**
 * GitHub Pages hosts only static assets, so there is no /api/game-events
 * process there. Cards and event rules still come from the public Firebase
 * game-config document; this evaluator makes that exact configuration usable
 * in the static build and keeps player progress in this browser.
 */
function isStaticPublicBuild(): boolean {
  return typeof window !== "undefined" && window.location.hostname.endsWith("github.io");
}

function isConfiguredEventSatisfied(definition: GameEventDefinition, event: GameEvent): boolean {
  if (event.eventType === "debug_trigger") return event.data.eventId === definition.id;
  if (event.data.action !== definition.action) return false;

  const stats = getPlayerStats() as Record<string, number>;
  if ((stats[definition.action] || 0) < Math.max(1, definition.requiredCount)) return false;

  switch (definition.specialCondition) {
    case "prologueCompleted":
      return (stats["special.prologueCompleted"] || 0) > 0;
    case "prologueSkipped":
      return (stats["special.prologueSkipped"] || 0) > 0;
    case "coinTotal":
      return (stats.collectCoin || 0) >= Math.max(1, Number(definition.specialValue) || 1);
    case "dialogueTotal":
      return (stats["special.dialogueSubmitted"] || 0) >= Math.max(1, Number(definition.specialValue) || 1);
    case "dialogueScenarioFirst":
      return (stats[`special.dialogueScenarioFirst.${String(definition.specialValue || "")}`] || 0) > 0;
    case "exhibitionClicked":
      return (stats[`special.exhibitionClicked.${String(definition.specialValue || "")}`] || 0) > 0;
    default:
      return true;
  }
}

function evaluateFirebaseConfiguredEvent(event: GameEvent): CardReward[] {
  const cards = new Map(getAllCardDefinitions().map((card) => [card.id, card]));
  return getAllEventDefinitions()
    .filter((definition) => isConfiguredEventSatisfied(definition, event))
    .map((definition) => {
      const card = cards.get(definition.rewardCard);
      return card ? {
        rewardId: `firebase-config:${definition.id}:${card.id}`,
        event: definition,
        card,
      } : null;
    })
    .filter((reward): reward is CardReward => Boolean(reward));
}

export async function emitGameEvent<TData extends Record<string, unknown>>(
  eventType: GameEvent["eventType"],
  data: TData,
): Promise<CardReward[]> {
  const event: GameEvent<TData> = {
    eventId: crypto.randomUUID(),
    eventType,
    timestamp: new Date().toISOString(),
    data,
  };
  // This is an observer only: ambient dialogue never participates in card
  // processing and can therefore not change established event outcomes.
  const ambientType = eventType === "enter_area" && data.area === "lab" ? "lab_enter"
    : eventType === "boss_defeated" ? "boss_defeated"
    : eventType === "item_collected" ? "item_obtained"
    : eventType === "mission_completed" ? "quest_completed"
    : eventType;
  // Existing producers identify Bosses/items through `action`; expose it as
  // the optional ambient eventId while preserving the complete original data.
  const ambientEventId = typeof data.eventId === "string" ? data.eventId
    : typeof data.bossId === "string" ? data.bossId
    : typeof data.itemId === "string" ? data.itemId
    : typeof data.action === "string" ? data.action : undefined;
  emitAmbientEvent(ambientType, { ...data, eventId: ambientEventId });

  // Reserve this slot synchronously, before waiting. Calls made during the
  // same animation frame therefore retain their original gameplay order.
  const previousSubmission = eventSubmissionQueue;
  let releaseQueue!: () => void;
  eventSubmissionQueue = new Promise<void>((resolve) => { releaseQueue = resolve; });
  await previousSubmission;

  try {
    if (isStaticPublicBuild()) {
      const rewards = evaluateFirebaseConfiguredEvent(event);
      enqueueCardRewards(rewards);
      return rewards;
    }
    const response = await fetch("/api/game-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: getCardEventUid(), event }),
    });
    if (!response.ok) throw new Error(`Game event failed (${response.status})`);
    const result = await response.json() as { awardedCard?: ManagedCard | null; awardedCards?: ManagedCard[] };
    const cards = Array.isArray(result.awardedCards)
      ? result.awardedCards
      : result.awardedCard ? [result.awardedCard] : [];
    const rewards = cards
      .map((card) => legacyReward(card, event))
      .filter((reward): reward is CardReward => Boolean(reward));
    enqueueCardRewards(rewards);
    return rewards;
  } catch (error) {
    // A temporary server outage should not stop a public Firebase-configured
    // card from being earned. This is also useful for preview hosts which do
    // not expose the optional Express API.
    const rewards = evaluateFirebaseConfiguredEvent(event);
    if (rewards.length > 0) {
      console.warn("Game-event API unavailable; using Firebase-configured browser evaluation.", error);
      enqueueCardRewards(rewards);
      return rewards;
    }
    console.warn("Unable to submit game event.", event, error);
    return [];
  } finally {
    releaseQueue();
  }
}
