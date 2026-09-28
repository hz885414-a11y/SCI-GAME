export type SupplyEffectType = "battery" | "shield" | "damage" | "speed";
export type SupplyProductType = "ability" | "videoReward" | "discountCode";

export interface SupplyShopItem {
  id: string;
  code: string;
  name: string;
  icon: string;
  description: string;
  effectType: SupplyEffectType;
  effectPerLevel: number;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  enabled: boolean;
  category?: string;
  productType?: SupplyProductType;
  videoUrl?: string;
  requiredWatchSeconds?: number;
  discountCode?: string;
}

export const SUPPLY_EFFECT_LABELS: Record<SupplyEffectType, string> = {
  battery: "初始與最大電量",
  shield: "任務初始生命值",
  damage: "所有光能武器傷害",
  speed: "小隊移動速度",
};

export const SUPPLY_SHOP_DEFAULTS: SupplyShopItem[] = [
  { id: "start_battery", code: "SCI-BATT-01", name: "起點高能蓄電池", icon: "🔋", category: "能力強化", description: "為特工初始機動工作燈注入超高容量。升級可提升關卡初始電量與總上限。", effectType: "battery", effectPerLevel: 20, baseCost: 80, costMultiplier: 1.5, maxLevel: 5, enabled: true },
  { id: "shield_boost", code: "SCI-SHLD-02", name: "SCI 複合裝甲盾", icon: "🛡️", category: "能力強化", description: "強化小隊冒險用的複合防護裝備，提高面對陰影怪物時的容錯率。", effectType: "shield", effectPerLevel: 1, baseCost: 100, costMultiplier: 1.6, maxLevel: 5, enabled: true },
  { id: "damage_boost", code: "SCI-DMG-03", name: "光子折射聚焦鏡", icon: "🔥", category: "能力強化", description: "通過折射聚焦鏡片使光束能量翻倍，特工所有光能武器的燃燒與淨化傷害大幅提升。", effectType: "damage", effectPerLevel: 0.15, baseCost: 120, costMultiplier: 1.5, maxLevel: 5, enabled: true },
  { id: "speed_boost", code: "SCI-ENG-04", name: "超導微型引擎", icon: "⚡", category: "能力強化", description: "裝配高頻率磁懸浮微型發動引擎，使特工走位更加敏捷靈活。", effectType: "speed", effectPerLevel: 0.1, baseCost: 80, costMultiplier: 1.4, maxLevel: 5, enabled: true },
];

export function getSupplyCategory(item: SupplyShopItem) {
  if (item.category?.trim()) return item.category.trim();
  if (item.productType === "videoReward") return "影片任務";
  if (item.productType === "discountCode") return "優惠與兌換";
  return "能力強化";
}

export function formatSupplyEffect(item: SupplyShopItem) {
  const amount = item.effectType === "damage" || item.effectType === "speed" ? `${Math.round(item.effectPerLevel * 100)}%` : String(item.effectPerLevel);
  return `${SUPPLY_EFFECT_LABELS[item.effectType]} +${amount}／級`;
}

export function getSupplyEffectTotals(items: SupplyShopItem[], levels: Record<string, number>) {
  return items.reduce<Record<SupplyEffectType, number>>((totals, item) => {
    if ((item.productType || "ability") === "discountCode") return totals;
    totals[item.effectType] += (levels[item.id] || 0) * item.effectPerLevel;
    return totals;
  }, { battery: 0, shield: 0, damage: 0, speed: 0 });
}
