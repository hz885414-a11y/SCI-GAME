import type { PlayerAction } from "../systems/playerStats";

export interface GameEventDefinition {
  id: string;
  title: string;
  content: string;
  icon: string;
  triggerType: "actionCount";
  action: PlayerAction;
  requiredCount: number;
  rewardCard: string;
  once: boolean;
}

export const EVENT_CONFIG: GameEventDefinition[] = [
  {
    id: "event_ip66",
    title: "防水等級的秘密",
    content: "連續使用工作燈後，燈具外殼上的防護標示引起了你的注意。",
    icon: "🌧️",
    triggerType: "actionCount",
    action: "useWorkLight",
    requiredCount: 5,
    rewardCard: "card_ip66",
    once: true,
  },
  {
    id: "event_lumen",
    title: "驅散黑暗的光量",
    content: "小隊累積清除了大量陰影怪物，也開始理解光輸出與配光的差別。",
    icon: "✨",
    triggerType: "actionCount",
    action: "killEnemy",
    requiredCount: 10,
    rewardCard: "card_lumen",
    once: true,
  },
  {
    id: "event_alloy",
    title: "素材的重量與強度",
    content: "帶回基地的材料各有不同重量與特性，研發部提出了新的分析報告。",
    icon: "📦",
    triggerType: "actionCount",
    action: "collectMaterial",
    requiredCount: 3,
    rewardCard: "card_alloy",
    once: true,
  },
  {
    id: "event_battery",
    title: "補給部的電力課題",
    content: "造訪補給部後，你注意到工作設備的續航不只取決於容量。",
    icon: "🔋",
    triggerType: "actionCount",
    action: "openShop",
    requiredCount: 1,
    rewardCard: "card_battery",
    once: true,
  },
  {
    id: "event_maintenance",
    title: "修理之前的檢查",
    content: "機器人完成一次改裝，維修紀錄也揭示了預防性檢查的重要性。",
    icon: "🔧",
    triggerType: "actionCount",
    action: "repairRobot",
    requiredCount: 1,
    rewardCard: "card_maintenance",
    once: true,
  },
  {
    id: "event_marine",
    title: "鹽霧中的設備",
    content: "海事戰區的濕氣與鹽分，讓小隊重新思考設備的環境耐受能力。",
    icon: "⚓",
    triggerType: "actionCount",
    action: "marineBattle",
    requiredCount: 1,
    rewardCard: "card_marine",
    once: true,
  },
  {
    id: "event_safety",
    title: "最終照明檢查",
    content: "擊敗魔王後，小隊回顧戰場中的視線、陰影與安全距離。",
    icon: "🛡️",
    triggerType: "actionCount",
    action: "bossDefeated",
    requiredCount: 1,
    rewardCard: "card_safety",
    once: true,
  },
  {
    id: "event_service",
    title: "任務後的服務紀錄",
    content: "完成關卡後，基地將作戰資料整理成可追蹤的設備服務紀錄。",
    icon: "🗂️",
    triggerType: "actionCount",
    action: "stagesCleared",
    requiredCount: 2,
    rewardCard: "card_service",
    once: true,
  },
];

const CUSTOM_EVENT_STORAGE_KEY = "sci_knowledge_custom_event_config";
const DELETED_EVENT_STORAGE_KEY = "sci_knowledge_deleted_event_ids";

export function getDeletedEventIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DELETED_EVENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) as string[] : [];
  } catch {
    return [];
  }
}

export function getCustomEventDefinitions(): GameEventDefinition[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_EVENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) as GameEventDefinition[] : [];
  } catch {
    return [];
  }
}

export function getAllEventDefinitions(): GameEventDefinition[] {
  const deleted = new Set(getDeletedEventIds());
  const events = new Map(EVENT_CONFIG.map((event) => [event.id, event]));
  getCustomEventDefinitions().forEach((event) => events.set(event.id, event));
  return [...events.values()].filter((event) => !deleted.has(event.id));
}

export function saveCustomEventDefinition(event: GameEventDefinition): void {
  if (typeof window === "undefined") return;
  const customEvents = getCustomEventDefinitions();
  const index = customEvents.findIndex((item) => item.id === event.id);
  const next = index >= 0
    ? customEvents.map((item) => item.id === event.id ? event : item)
    : [...customEvents, event];
  window.localStorage.setItem(CUSTOM_EVENT_STORAGE_KEY, JSON.stringify(next));
}

export function removeCustomEventDefinition(eventId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    CUSTOM_EVENT_STORAGE_KEY,
    JSON.stringify(getCustomEventDefinitions().filter((event) => event.id !== eventId)),
  );
}

export function deleteEventDefinition(eventId: string): void {
  if (typeof window === "undefined") return;
  const isBuiltIn = EVENT_CONFIG.some((event) => event.id === eventId);
  if (!isBuiltIn && getCustomEventDefinitions().some((event) => event.id === eventId)) {
    removeCustomEventDefinition(eventId);
    return;
  }
  if (isBuiltIn) removeCustomEventDefinition(eventId);
  const deleted = getDeletedEventIds();
  if (!deleted.includes(eventId)) {
    window.localStorage.setItem(DELETED_EVENT_STORAGE_KEY, JSON.stringify([...deleted, eventId]));
  }
}

export function getEventDefinition(eventId: string): GameEventDefinition | undefined {
  return getAllEventDefinitions().find((event) => event.id === eventId);
}
