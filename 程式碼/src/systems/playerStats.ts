import {
  EVENT_STORAGE_KEYS,
  PLAYER_ACTION_RECORDED,
  notifyEventSystemChanged,
  readStoredValue,
  writeStoredValue,
} from "./eventStorage";

export const PLAYER_ACTIONS = [
  "startMission",
  "killEnemy",
  "killJellyfish",
  "killSpikyBall",
  "killGhost",
  "collectCoin",
  "collectBattery",
  "collectMaterial",
  "levelUp",
  "openShop",
  "purchaseHumanUpgrade",
  "repairRobot",
  "upgradeRobotModule",
  "useWorkLight",
  "highBeamActivated",
  "takeDamage",
  "gameOver",
  "startBossBattle",
  "exhibitionBossBattle",
  "marineBattle",
  "useMechaPunch",
  "useMechaLaser",
  "useMechaShield",
  "useMechaUltimate",
  "bossDefeated",
  "stagesCleared",
] as const;

export type PlayerAction = (typeof PLAYER_ACTIONS)[number];
export type PlayerStats = Record<PlayerAction, number>;

export const PLAYER_ACTION_INFO: Record<PlayerAction, { label: string; description: string; group: string }> = {
  startMission: { label: "開始一般任務", description: "玩家正式進入一次小隊冒險關卡。", group: "任務" },
  killEnemy: { label: "擊敗任意敵人", description: "累計擊敗所有種類的一般敵人。", group: "戰鬥" },
  killJellyfish: { label: "擊敗水母敵人", description: "擊敗水母型陰影怪物。", group: "戰鬥" },
  killSpikyBall: { label: "擊敗刺球敵人", description: "擊敗尖刺球型陰影怪物。", group: "戰鬥" },
  killGhost: { label: "擊敗鬼魂敵人", description: "擊敗鬼魂型陰影怪物。", group: "戰鬥" },
  collectCoin: { label: "收集金幣", description: "紀錄實際拾取的金幣數量。", group: "收集" },
  collectBattery: { label: "收集電池", description: "拾取任務中的電池補給。", group: "收集" },
  collectMaterial: { label: "收集機器人素材", description: "紀錄拾取的機器人改裝素材數量。", group: "收集" },
  levelUp: { label: "任務中升級", description: "角色在冒險關卡中提升一次等級。", group: "成長" },
  openShop: { label: "進入後勤補給部", description: "玩家開啟一次人類角色升級商店。", group: "基地" },
  purchaseHumanUpgrade: { label: "採購角色升級", description: "使用金幣成功購買一次人類角色強化。", group: "成長" },
  repairRobot: { label: "維修／改裝機器人", description: "在技術研發部完成一次機器人改裝。", group: "基地" },
  upgradeRobotModule: { label: "升級機器人模組", description: "成功提升一級永久機器人模組。", group: "成長" },
  useWorkLight: { label: "操作工作燈", description: "玩家切換一次工作燈照明模式。", group: "照明" },
  highBeamActivated: { label: "啟動高亮模式", description: "工作燈由 LOW 切換至 HIGH。", group: "照明" },
  takeDamage: { label: "玩家受到傷害", description: "小隊或機器人在戰鬥中受到一次傷害。", group: "戰鬥" },
  gameOver: { label: "任務失敗", description: "玩家生命歸零並進入任務失敗畫面。", group: "任務" },
  startBossBattle: { label: "開始魔王戰", description: "正式進入任意展覽的魔王戰。", group: "魔王" },
  exhibitionBossBattle: { label: "由展覽進入魔王戰", description: "從線上展覽入口直接開始魔王作戰。", group: "魔王" },
  marineBattle: { label: "進入海事戰區", description: "開始 TITE × IHT 海事主題魔王戰。", group: "魔王" },
  useMechaPunch: { label: "機器人使用重拳", description: "在魔王戰中發動一次機器人近戰拳擊。", group: "機器人技能" },
  useMechaLaser: { label: "機器人使用雷射", description: "在魔王戰中發射一次雷射攻擊。", group: "機器人技能" },
  useMechaShield: { label: "機器人啟動防禦", description: "在魔王戰中啟動一次機器人防禦護盾。", group: "機器人技能" },
  useMechaUltimate: { label: "機器人使用終極技能", description: "在魔王戰中成功發動一次終極技能。", group: "機器人技能" },
  bossDefeated: { label: "擊敗魔王", description: "完成最後一擊並擊敗任意魔王。", group: "魔王" },
  stagesCleared: { label: "完成關卡", description: "累計完成的完整關卡數量。", group: "任務" },
};

export const EMPTY_PLAYER_STATS = Object.fromEntries(
  PLAYER_ACTIONS.map((action) => [action, 0]),
) as PlayerStats;

export function getPlayerStats(): PlayerStats {
  return {
    ...EMPTY_PLAYER_STATS,
    ...readStoredValue<Partial<PlayerStats>>(EVENT_STORAGE_KEYS.playerStats, {}),
  };
}

export function recordAction(action: PlayerAction, amount = 1): PlayerStats {
  const safeAmount = Math.max(0, Math.floor(amount));
  const next = getPlayerStats();
  next[action] += safeAmount;
  writeStoredValue(EVENT_STORAGE_KEYS.playerStats, next);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PLAYER_ACTION_RECORDED, { detail: { action, amount: safeAmount } }));
  }
  notifyEventSystemChanged();
  return next;
}

const ENEMY_DEFEAT_ACTIONS = {
  mote: "killJellyfish",
  clumper: "killSpikyBall",
  stalker: "killGhost",
} as const satisfies Record<string, PlayerAction>;

export function recordEnemyDefeated(enemyType: keyof typeof ENEMY_DEFEAT_ACTIONS): void {
  recordAction("killEnemy");
  recordAction(ENEMY_DEFEAT_ACTIONS[enemyType]);
}

export function resetPlayerStats(): void {
  writeStoredValue(EVENT_STORAGE_KEYS.playerStats, EMPTY_PLAYER_STATS);
  notifyEventSystemChanged();
}
