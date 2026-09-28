import { CARD_DATABASE } from "../data/cardDatabase";
import { EVENT_CONFIG } from "../data/eventConfig";
import { RESPONSE_DATABASE, SCENARIOS } from "../data/responses";
import { prologuePages } from "../data/prologue";
import { BOSS_ADMIN_DEFAULTS } from "../data/bossAdminConfig";
import { SUPPLY_SHOP_DEFAULTS } from "../data/supplyShopConfig";
import { endingPages } from "../data/ending";
import type { GameConfig } from "./types";

const DEFAULT_DIALOGUE_PORTRAITS = Object.fromEntries(Object.entries(RESPONSE_DATABASE).map(([scenarioId, dialogue]) => [scenarioId, {
  claire: dialogue.claire.map(() => "auto"),
  ethan: dialogue.ethan.map(() => "auto"),
  leo: dialogue.leo.map(() => "auto"),
}])) as GameConfig["dialoguePortraits"];

const layout = (x: number, scale: number, imageScale: number, offsetY: number, baseHeightPx = 800) => ({ x, scale, imageScale, offsetX: 0, offsetY, baseHeightPx });

export const DEFAULT_GAME_CONFIG: GameConfig = {
  version: 1,
  updatedAt: "local-default",
  gameplay: {
    playerBaseAttack: 10,
    playerBaseHp: 3,
    mechaBaseHp: 100,
    mechaHpPerDefenseLevel: 25,
    bossBaseHp: 2800,
    bossHpPerChapter: 1200,
    monsterHpMultiplier: 1,
    moteBaseHp: 15,
    moteHpPerChapter: 12,
    stalkerBaseHp: 10,
    stalkerHpPerChapter: 8,
    clumperBaseHp: 50,
    clumperHpPerChapter: 20,
    spawnStartInterval: 35,
    spawnMinInterval: 10,
    maxEnemies: 90,
    rangeLowDamage: 18,
    rangeHighDamage: 45,
    laserHighDamage: 22,
    trackingLowDamage: 5,
    trackingHighDamage: 12,
    specialLowDamage: 1,
    specialHighDamage: 3,
    heavyLowDamage: 30,
    heavyHighDamage: 65,
    mechaPunchDamage: 110,
    mechaUltimateDamage: 450,
    robotRangeLowDamage: 18,
    robotRangeHighDamage: 45,
    robotLaserLowDamage: 10,
    robotLaserHighDamage: 22,
    robotTrackingLowDamage: 5,
    robotTrackingHighDamage: 12,
    robotSpecialLowDamage: 1,
    robotSpecialHighDamage: 3,
    robotHeavyLowDamage: 30,
    robotHeavyHighDamage: 65,
    coinDropChance: 0.35,
    coinDropMin: 1,
    coinDropMax: 3,
    batteryDropChance: 0.15,
    batteryRestoreAmount: 25,
    materialDropChance: 0.22,
    expGemBase: 15,
    expGemPerChapter: 3,
  },
  events: EVENT_CONFIG,
  cards: CARD_DATABASE,
  dialogues: RESPONSE_DATABASE,
  dialoguePortraits: DEFAULT_DIALOGUE_PORTRAITS,
  characterDefaultPortraits: {
    claire: "dialog",
    ethan: "dialog",
    leo: "dialog",
  },
  characterLayouts: {
    claire: { desktop: layout(20, 1, 1, 0, 630), tablet: layout(20, 1, 1, 0, 620), mobile: layout(18, 1, 1, 0, 660) },
    ethan: { desktop: layout(50, 1, 1, 0, 630), tablet: layout(50, 1, 1, 0, 620), mobile: layout(50, 1, 1, 0, 660) },
    leo: { desktop: layout(80, 1, 1, 0, 630), tablet: layout(80, 1, 1, 0, 620), mobile: layout(82, 1, 1, 0, 660) },
  },
  scenarios: SCENARIOS,
  prologue: prologuePages,
  ending: endingPages,
  bosses: BOSS_ADMIN_DEFAULTS,
  supplyShopItems: SUPPLY_SHOP_DEFAULTS,
};
