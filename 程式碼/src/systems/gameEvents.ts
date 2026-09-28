import type { KnowledgeCardDefinition } from "../data/cardDatabase";
import type { GameEventDefinition } from "../data/eventConfig";
import { enqueueCardRewards } from "./eventManager";
import type { ManagedCard } from "../card-events/types";
import { getAllCardDefinitions, saveCustomCardDefinition } from "../data/cardDatabase";

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

  // Reserve this slot synchronously, before waiting. Calls made during the
  // same animation frame therefore retain their original gameplay order.
  const previousSubmission = eventSubmissionQueue;
  let releaseQueue!: () => void;
  eventSubmissionQueue = new Promise<void>((resolve) => { releaseQueue = resolve; });
  await previousSubmission;

  try {
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
    console.warn("Unable to submit game event.", event, error);
    return [];
  } finally {
    releaseQueue();
  }
}
