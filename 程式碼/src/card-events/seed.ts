import { CARD_DATABASE } from "../data/cardDatabase";
import { EVENT_CONFIG } from "../data/eventConfig";
import type { CardRule, ManagedCard } from "./types";

export function getDefaultManagedCards(): ManagedCard[] {
  return CARD_DATABASE.map((card) => ({
    id: card.id, name: card.title, description: card.description,
    category: card.category, rarity: "common", image: card.image,
    hidden: false, enabled: true,
  }));
}

export function getDefaultCardRules(): CardRule[] {
  return EVENT_CONFIG.map((event) => ({
    id: `rule_${event.id}`,
    cardId: event.rewardCard,
    triggerType: "action",
    conditions: { action: event.action, statKey: `action.${event.action}` },
    requiredCount: event.requiredCount,
    priority: 0,
    enabled: true,
  }));
}
