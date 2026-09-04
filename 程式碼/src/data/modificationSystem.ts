export const MATERIAL_IDS = [
  "energy_core", "metal_material", "electronic_parts", "weapon_module",
  "defense_module", "mobility_module", "lighting_module", "rare_tech_chip"
] as const;

export type MaterialId = (typeof MATERIAL_IDS)[number];
export type MaterialInventory = Record<MaterialId, number>;

export const MATERIAL_CONFIG: Record<MaterialId, { name: string; icon: string; color: string }> = {
  energy_core: { name: "能量核心", icon: "⚡", color: "#22d3ee" },
  metal_material: { name: "金屬材料", icon: "⬡", color: "#a1a1aa" },
  electronic_parts: { name: "電子零件", icon: "▦", color: "#34d399" },
  weapon_module: { name: "武器模組", icon: "✦", color: "#fb7185" },
  defense_module: { name: "防禦模組", icon: "◆", color: "#60a5fa" },
  mobility_module: { name: "移動模組", icon: "➤", color: "#fbbf24" },
  lighting_module: { name: "燈具模組", icon: "☀", color: "#fde047" },
  rare_tech_chip: { name: "稀有科技晶片", icon: "◇", color: "#c084fc" }
};

export const ROBOT_UPGRADE_IDS = [
  "attack_power", "defense_power", "movement_speed", "laser_weapon", "tracking_weapon",
  "range_attack", "energy_shield", "special_lighting", "passive_skill"
] as const;

export type RobotUpgradeId = (typeof ROBOT_UPGRADE_IDS)[number];
export type RobotUpgradeLevels = Record<RobotUpgradeId, number>;
type UpgradeCost = Partial<Record<MaterialId, number>>;

export type RobotUpgradeConfig = {
  id: RobotUpgradeId;
  name: string;
  description: string;
  effect: string;
  icon: string;
  baseCost: UpgradeCost;
};

export const ROBOT_UPGRADE_CONFIG: Record<RobotUpgradeId, RobotUpgradeConfig> = {
  attack_power: { id: "attack_power", name: "攻擊能力", icon: "✦", description: "強化 C2-932 的主輸出核心。", effect: "每級提升 Boss 戰攻擊傷害 12%", baseCost: { metal_material: 2, weapon_module: 1 } },
  defense_power: { id: "defense_power", name: "防禦能力", icon: "◆", description: "強化 C2-932 的裝甲與耐久結構。", effect: "每級增加 Boss 戰生命 25", baseCost: { metal_material: 2, defense_module: 1 } },
  movement_speed: { id: "movement_speed", name: "移動速度", icon: "➤", description: "調整推進器與關節反應速度。", effect: "每級提升 Boss 戰移動速度 8%", baseCost: { mobility_module: 2, energy_core: 1 } },
  laser_weapon: { id: "laser_weapon", name: "雷射武器", icon: "━", description: "安裝高能脈衝雷射模組。", effect: "在 Boss 戰解鎖並升級高速雷射", baseCost: { weapon_module: 2, energy_core: 1, electronic_parts: 1 } },
  tracking_weapon: { id: "tracking_weapon", name: "追蹤武器", icon: "◎", description: "安裝自動鎖定與追蹤控制器。", effect: "在 Boss 戰解鎖並升級追蹤光束", baseCost: { electronic_parts: 2, weapon_module: 1 } },
  range_attack: { id: "range_attack", name: "範圍攻擊", icon: "◒", description: "擴充 C2-932 的廣域照明輸出。", effect: "在 Boss 戰解鎖並升級扇形範圍攻擊", baseCost: { lighting_module: 2, energy_core: 1 } },
  energy_shield: { id: "energy_shield", name: "能量護盾", icon: "◉", description: "安裝可反覆充能的防禦力場。", effect: "Boss 戰出拳 3 次後展開砲彈防禦力場", baseCost: { defense_module: 2, energy_core: 2 } },
  special_lighting: { id: "special_lighting", name: "特殊照明能力", icon: "☀", description: "部署持續淨化敵人的照明區域。", effect: "在 Boss 戰解鎖並升級地面照明力場", baseCost: { lighting_module: 2, electronic_parts: 1 } },
  passive_skill: { id: "passive_skill", name: "被動技能", icon: "◇", description: "使用稀有晶片強化 C2-932 的戰鬥演算。", effect: "每級提升 Boss 戰整體傷害 5%", baseCost: { rare_tech_chip: 1, electronic_parts: 2 } }
};

export const createEmptyMaterialInventory = (): MaterialInventory =>
  Object.fromEntries(MATERIAL_IDS.map((id) => [id, 0])) as MaterialInventory;

export const createDefaultRobotUpgrades = (): RobotUpgradeLevels =>
  Object.fromEntries(ROBOT_UPGRADE_IDS.map((id) => [id, 0])) as RobotUpgradeLevels;

export function getUpgradeCost(id: RobotUpgradeId, currentLevel: number): UpgradeCost {
  const multiplier = currentLevel + 1;
  return Object.fromEntries(Object.entries(ROBOT_UPGRADE_CONFIG[id].baseCost).map(([materialId, amount]) => [
    materialId, Math.max(1, Math.ceil((amount || 0) * multiplier))
  ])) as UpgradeCost;
}

export function canAffordUpgrade(inventory: MaterialInventory, cost: UpgradeCost) {
  return Object.entries(cost).every(([id, amount]) => inventory[id as MaterialId] >= (amount || 0));
}
