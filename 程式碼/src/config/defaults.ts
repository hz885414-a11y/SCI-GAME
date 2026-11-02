import { CARD_DATABASE } from "../data/cardDatabase";
import { EVENT_CONFIG } from "../data/eventConfig";
import { RESPONSE_DATABASE, SCENARIOS } from "../data/responses";
import { prologuePages } from "../data/prologue";
import { BOSS_ADMIN_DEFAULTS } from "../data/bossAdminConfig";
import { SUPPLY_SHOP_DEFAULTS } from "../data/supplyShopConfig";
import { endingPages } from "../data/ending";
import type { GameConfig } from "./types";
import { DEFAULT_CARD_LAYOUT } from "./cardLayout";

const DEFAULT_DIALOGUE_PORTRAITS = Object.fromEntries(Object.entries(RESPONSE_DATABASE).map(([scenarioId, dialogue]) => [scenarioId, {
  claire: dialogue.claire.map(() => "auto"),
  ethan: dialogue.ethan.map(() => "auto"),
  leo: dialogue.leo.map(() => "auto"),
}])) as GameConfig["dialoguePortraits"];

const layout = (x: number, scale: number, imageScale: number, offsetY: number, baseHeightPx = 800) => ({ x, scale, imageScale, offsetX: 0, offsetY, baseHeightPx });
const vfxAsset = (id: string, frames = 14, loopMode: "none" | "loop" = "none") => ({ image: `/assets/vfx/library/${id}/sprite-sheet.png`, manifest: { loopMode, frames: Array.from({ length: frames }, (_, index) => ({ x: (index % 5) * 96, y: Math.floor(index / 5) * 96, width: 96, height: 96, durationMs: 50 })) }, imageName: "sprite-sheet.png", manifestName: "manifest.json" });

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
    stealthLowLightDetectionRange: 230,
    stealthHighLightDetectionRange: 360,
    stealthProximityDetectionRange: 72,
    stealthAlertDelayTicks: 24,
    stealthLostSightTicks: 90,
    stealthSearchTicks: 150,
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
  cardLayout: DEFAULT_CARD_LAYOUT,
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
  rhythmEdits: {},
  combatEffects: [
    { id: "robot_laser", label: "C2-932｜雷射", group: "robot", scale: 1.65, layers: { charge: vfxAsset("focus-charge"), travel: vfxAsset("lattice-beam", 16, "loop"), impact: { image: "/assets/vfx/beam-cutoff-burst/sprite-sheet.png", manifest: { loopMode: "none", frames: Array.from({ length: 14 }, (_, index) => ({ x: (index % 5) * 96, y: Math.floor(index / 5) * 96, width: 96, height: 96, durationMs: 50 })) }, imageName: "sprite-sheet.png", manifestName: "manifest.json" } } },
    { id: "robot_punch", label: "C2-932｜重拳", group: "robot", scale: 1, layers: { charge: vfxAsset("focus-charge"), impact: vfxAsset("electric-impact") } }, { id: "robot_shield", label: "C2-932｜防禦力場", group: "robot", scale: 1 }, { id: "robot_ultimate", label: "C2-932｜特殊大招", group: "robot", scale: 1, layers: { impact: vfxAsset("void-implosion"), residue: vfxAsset("solar-shrapnel") } },
    { id: "battle_destruction", label: "戰場｜擊破／爆炸", group: "boss", scale: 1, layers: { impact: vfxAsset("warm-explosion", 15), residue: vfxAsset("smoke-puff") } },
    { id: "boss_projectile", label: "Boss 共通｜彈幕／射擊", group: "boss", scale: 1 }, { id: "boss_dash", label: "Boss 共通｜衝刺／碰撞", group: "boss", scale: 1 }, { id: "boss_area", label: "Boss 共通｜範圍攻擊", group: "boss", scale: 1 }, { id: "boss_defense", label: "Boss 共通｜防禦／護盾", group: "boss", scale: 1 },
    { id: "ampa_blackout", label: "AMPA｜停電核心", group: "boss", scale: 1, layers: { travel: vfxAsset("magical-projectile"), impact: vfxAsset("electric-impact") } }, { id: "frankfurt_bombing", label: "Frankfurt｜鎖定轟炸／雷射", group: "boss", scale: 1, layers: { charge: vfxAsset("focus-charge"), impact: vfxAsset("warm-explosion") } }, { id: "tite_tools", label: "TITE｜工具暴雨／硬體召喚", group: "boss", scale: 1, layers: { impact: vfxAsset("electric-impact") } }, { id: "aapex_charge", label: "AAPEX｜連鎖衝刺／怒吼", group: "boss", scale: 1, layers: { travel: vfxAsset("ember-jet"), impact: vfxAsset("electric-impact") } }, { id: "metstrade_water", label: "METSTRADE｜潛行／水柱／觸手", group: "boss", scale: 1, layers: { impact: vfxAsset("splash-crown"), residue: vfxAsset("dripping-runoff", 16, "loop") } }, { id: "bauma_mining", label: "bauma｜岩塊／礦業裝甲", group: "boss", scale: 1, layers: { impact: vfxAsset("warm-explosion"), residue: vfxAsset("smoke-puff") } },
  ],
};

// These operator-created cards predate the artwork field.  Preserve any
// explicit Firebase image, while giving the known cards a shipped fallback.
const LEGACY_CUSTOM_CARD_ART: Record<string, string> = {
  "五月雨測試": "/assets/cards/may-rain-test.png",
  "IP67 防護等級": "/assets/cards/ip67-waterproof.png",
  "IP68 防護等級": "/assets/cards/ip68-deep-waterproof.png",
  "勇氣の證明": "/assets/cards/courage-proof.png",
  "BOM表": "/assets/cards/bom-parts.png",
};

// The original shipped Boss values were balanced before the robot's full
// enhancement system existed. Upgrade only those exact legacy values so a
// deliberately tuned operator value is never overwritten.
const LEGACY_BOSS_HP: Record<number, number> = {
  1: 4000,
  2: 5200,
  3: 6400,
  4: 7600,
  5: 8800,
  6: 10000,
};

/** Adds newly shipped default cards/events to older Firebase documents while
 * retaining every operator edit that already exists under the same id. */
export function mergeGameConfig(remote: Partial<GameConfig> | null | undefined): GameConfig {
  const mergeById = <T extends { id: string }>(defaults: T[], saved: T[] | undefined) => {
    const overrides = new Map((saved || []).map((entry) => [entry.id, entry]));
    // Older Firebase records often contain image: "" from before card artwork
    // existed. Keep an intentionally supplied image, but inherit newly shipped
    // default art when that legacy field is empty.
    const known = defaults.map((entry) => {
      const override = overrides.get(entry.id);
      const overrideWithImage = override as T & { image?: string };
      return override ? { ...entry, ...override, image: overrideWithImage.image || (entry as T & { image?: string }).image } : entry;
    });
    const additions = (saved || [])
      .filter((entry) => !defaults.some((defaultEntry) => defaultEntry.id === entry.id))
      .map((entry) => {
        const card = entry as T & { title?: string; image?: string };
        return card.image || !card.title || !LEGACY_CUSTOM_CARD_ART[card.title]
          ? entry
          : { ...entry, image: LEGACY_CUSTOM_CARD_ART[card.title] };
      });
    return [...known, ...additions];
  };
  const savedBosses = new Map((remote?.bosses || []).map((boss) => [boss.chapter, boss]));
  const bosses = BOSS_ADMIN_DEFAULTS.map((defaultBoss) => {
    const savedBoss = savedBosses.get(defaultBoss.chapter);
    if (!savedBoss) return defaultBoss;
    const usesLegacyHp = savedBoss.hp === LEGACY_BOSS_HP[defaultBoss.chapter];
    return {
      ...defaultBoss,
      ...savedBoss,
      hp: usesLegacyHp ? defaultBoss.hp : savedBoss.hp,
      behavior: { ...defaultBoss.behavior, ...savedBoss.behavior },
    };
  });
  // Combat effects are intentionally layered.  Preserve an operator's
  // uploaded layer while inheriting newly shipped phases (for example a new
  // muzzle charge on an existing laser), instead of replacing the whole
  // layer map with an older Firebase record.
  const savedCombatEffects = new Map((remote?.combatEffects || []).map((effect) => [effect.id, effect]));
  const combatEffects = [
    ...DEFAULT_GAME_CONFIG.combatEffects.map((defaultEffect) => {
      const savedEffect = savedCombatEffects.get(defaultEffect.id);
      return savedEffect
        ? { ...defaultEffect, ...savedEffect, layers: { ...defaultEffect.layers, ...savedEffect.layers } }
        : defaultEffect;
    }),
    ...(remote?.combatEffects || []).filter((effect) => !DEFAULT_GAME_CONFIG.combatEffects.some((defaultEffect) => defaultEffect.id === effect.id)),
  ];
  return {
    ...DEFAULT_GAME_CONFIG,
    ...remote,
    gameplay: { ...DEFAULT_GAME_CONFIG.gameplay, ...remote?.gameplay },
    cards: mergeById(DEFAULT_GAME_CONFIG.cards, remote?.cards),
    cardLayout: {
      ...DEFAULT_CARD_LAYOUT,
      ...remote?.cardLayout,
      titleAlign: remote?.cardLayout?.titleAlign || DEFAULT_CARD_LAYOUT.titleAlign,
      textScale: { ...DEFAULT_CARD_LAYOUT.textScale, ...remote?.cardLayout?.textScale },
      // Existing Firebase configurations predate the adjustable octagonal image frame.
      imageCornerCut: Number.isFinite(remote?.cardLayout?.imageCornerCut)
        ? Math.max(0, Math.min(24, Number(remote?.cardLayout?.imageCornerCut)))
        : DEFAULT_CARD_LAYOUT.imageCornerCut,
    },
    events: mergeById(DEFAULT_GAME_CONFIG.events, remote?.events),
    bosses,
    combatEffects,
  };
}
