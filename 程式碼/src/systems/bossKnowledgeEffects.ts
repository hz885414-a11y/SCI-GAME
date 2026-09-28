import { getAllCardDefinitions } from "../data/cardDatabase";
import { getBossBehaviorProfile, type BossBehaviorProfile } from "../data/bossBehaviorConfig";
import { getOwnedCards } from "./playerCollection";
import { getRuntimeConfig } from "../config/runtimeStore";
import { BOSS_ADMIN_DEFAULTS } from "../data/bossAdminConfig";

export interface ActiveBossKnowledgeModifiers {
  bossHpMultiplier: number;
  moveSpeedMultiplier: number;
  dashSpeedMultiplier: number;
  attackIntervalMultiplier: number;
  labels: string[];
}

export function getBossKnowledgeModifiers(chapter: number): ActiveBossKnowledgeModifiers {
  const ownedCards = new Set(getOwnedCards());
  return getAllCardDefinitions().reduce<ActiveBossKnowledgeModifiers>((modifiers, card) => {
    const effect = card.bossEffect;
    if (!ownedCards.has(card.id) || !effect || effect.chapter !== chapter) return modifiers;
    modifiers.bossHpMultiplier *= effect.bossHpMultiplier ?? 1;
    modifiers.moveSpeedMultiplier *= effect.moveSpeedMultiplier ?? 1;
    modifiers.dashSpeedMultiplier *= effect.dashSpeedMultiplier ?? 1;
    modifiers.attackIntervalMultiplier *= effect.attackIntervalMultiplier ?? 1;
    modifiers.labels.push(effect.label);
    return modifiers;
  }, {
    bossHpMultiplier: 1,
    moveSpeedMultiplier: 1,
    dashSpeedMultiplier: 1,
    attackIntervalMultiplier: 1,
    labels: [],
  });
}

export function getEffectiveBossBehaviorProfile(chapter: number): BossBehaviorProfile {
  const runtimeBoss = (getRuntimeConfig()?.bosses || BOSS_ADMIN_DEFAULTS).find((boss) => boss.chapter === chapter);
  const base = runtimeBoss?.behavior || getBossBehaviorProfile(chapter);
  const modifiers = getBossKnowledgeModifiers(chapter);
  return {
    ...base,
    moveSpeed: base.moveSpeed * modifiers.moveSpeedMultiplier,
    dashSpeed: base.dashSpeed * modifiers.dashSpeedMultiplier,
    attackInterval: Math.round(base.attackInterval * modifiers.attackIntervalMultiplier),
  };
}

export function getEffectiveBossDefinition(chapter: number) {
  return (getRuntimeConfig()?.bosses || BOSS_ADMIN_DEFAULTS).find((boss) => boss.chapter === chapter) || BOSS_ADMIN_DEFAULTS[0];
}
