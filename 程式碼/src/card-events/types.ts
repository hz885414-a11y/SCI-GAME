export const CARD_EVENT_TYPES = [
  "action", "dialogue", "areaVisit", "bossResult", "quizAnswer", "collectible",
] as const;

export type CardEventType = (typeof CARD_EVENT_TYPES)[number];
export type CardRarity = "common" | "rare" | "epic" | "legendary";

export interface ManagedCard {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: CardRarity;
  image: string;
  hidden: boolean;
  enabled: boolean;
}

/** Conditions are exact event-data matches, e.g. { "areaId": "lab" }.
 * `statKey` selects the counter used with requiredCount. */
export interface CardRule {
  id: string;
  cardId: string;
  triggerType: CardEventType;
  conditions: Record<string, string | number | boolean>;
  requiredCount: number;
  priority: number;
  enabled: boolean;
}

export interface CardEventPayload {
  eventId: string;
  uid: string;
  eventType: CardEventType;
  data: Record<string, string | number | boolean>;
  amount?: number;
}

export interface EarnedCard {
  cardId: string;
  earnedAt: string;
  ruleId: string;
}

export interface PendingCard extends EarnedCard {}

export interface UserCardState {
  stats: Record<string, number>;
  eventLog: Array<{ eventId: string; eventType: CardEventType; data: Record<string, string | number | boolean>; amount: number; receivedAt: string }>;
  earnedCards: Record<string, EarnedCard>;
  pendingCards: Record<string, PendingCard>;
  processedEventIds: Record<string, string>;
  /** Rule IDs qualified during the current mission; resolved only at mission end. */
  missionCandidateRuleIds: string[];
  missionCardGranted: boolean;
}

export interface CardEventResult {
  stats: Record<string, number>;
  awardedCard: ManagedCard | null;
  awardedCards: ManagedCard[];
  pendingCardIds: string[];
}
