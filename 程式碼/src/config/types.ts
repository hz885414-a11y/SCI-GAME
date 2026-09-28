import type { KnowledgeCardDefinition } from "../data/cardDatabase";
import type { GameEventDefinition } from "../data/eventConfig";
import type { DialogueLine, Scenario } from "../data/responses";
import type { ProloguePage } from "../data/prologue";
import type { BossAdminDefinition } from "../data/bossAdminConfig";
import type { SupplyShopItem } from "../data/supplyShopConfig";

export interface GameplayConfig {
  playerBaseAttack: number;
  playerBaseHp: number;
  mechaBaseHp: number;
  mechaHpPerDefenseLevel: number;
  bossBaseHp: number;
  bossHpPerChapter: number;
  monsterHpMultiplier: number;
  moteBaseHp: number;
  moteHpPerChapter: number;
  stalkerBaseHp: number;
  stalkerHpPerChapter: number;
  clumperBaseHp: number;
  clumperHpPerChapter: number;
  spawnStartInterval: number;
  spawnMinInterval: number;
  maxEnemies: number;
  rangeLowDamage: number;
  rangeHighDamage: number;
  laserHighDamage: number;
  trackingLowDamage: number;
  trackingHighDamage: number;
  specialLowDamage: number;
  specialHighDamage: number;
  heavyLowDamage: number;
  heavyHighDamage: number;
  mechaPunchDamage: number;
  mechaUltimateDamage: number;
  robotRangeLowDamage: number;
  robotRangeHighDamage: number;
  robotLaserLowDamage: number;
  robotLaserHighDamage: number;
  robotTrackingLowDamage: number;
  robotTrackingHighDamage: number;
  robotSpecialLowDamage: number;
  robotSpecialHighDamage: number;
  robotHeavyLowDamage: number;
  robotHeavyHighDamage: number;
  coinDropChance: number;
  coinDropMin: number;
  coinDropMax: number;
  batteryDropChance: number;
  batteryRestoreAmount: number;
  materialDropChance: number;
  expGemBase: number;
  expGemPerChapter: number;
}

export interface DialogueConfig {
  [scenarioId: string]: {
    claire: string[];
    ethan: string[];
    leo: string[];
    banter: DialogueLine[][];
  };
}

export type CharacterId = "claire" | "ethan" | "leo";
export type CharacterBreakpoint = "desktop" | "tablet" | "mobile";
export type DialoguePortrait = "auto" | "normal" | "dialog" | "happy" | "think" | "surprise";

export interface CharacterLayoutValue {
  x: number;
  scale: number;
  imageScale: number;
  offsetX: number;
  offsetY: number;
  baseHeightPx: number;
  /** Legacy Firebase field, read only for automatic migration. */
  baseHeightVh?: number;
}

export type CharacterLayoutConfig = Record<CharacterId, Record<CharacterBreakpoint, CharacterLayoutValue>>;
export type DialoguePortraitConfig = Record<string, Record<CharacterId, DialoguePortrait[]>>;
export type CharacterDefaultPortraitConfig = Record<CharacterId, Exclude<DialoguePortrait, "auto">>;

export interface GameConfig {
  version: number;
  updatedAt: string;
  gameplay: GameplayConfig;
  events: GameEventDefinition[];
  cards: KnowledgeCardDefinition[];
  dialogues: DialogueConfig;
  dialoguePortraits: DialoguePortraitConfig;
  characterDefaultPortraits: CharacterDefaultPortraitConfig;
  characterLayouts: CharacterLayoutConfig;
  scenarios: Scenario[];
  prologue: ProloguePage[];
  ending: ProloguePage[];
  bosses: BossAdminDefinition[];
  supplyShopItems: SupplyShopItem[];
}

export type ConfigSource = "firebase" | "local-default";
