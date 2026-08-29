export type KnowledgeCardCategory = "lighting" | "energy" | "materials" | "maintenance" | "marine" | "safety";

export interface KnowledgeCardDefinition {
  id: string;
  category: KnowledgeCardCategory;
  icon: string;
  title: string;
  description: string;
  industryNote: string;
  image: string;
}

export const CARD_DATABASE: KnowledgeCardDefinition[] = [
  {
    id: "card_ip66",
    category: "lighting",
    icon: "💡",
    title: "IP66 防護等級",
    description: "IP66 代表完全防塵，並可承受強力水柱沖洗。",
    industryNote: "戶外與工業照明通常會依安裝環境選擇適合的 IP 防護等級。",
    image: "/assets/cards/ip66.png",
  },
  {
    id: "card_lumen",
    category: "lighting",
    icon: "🔦",
    title: "流明與照明輸出",
    description: "流明（lm）用來描述光源發出的可見光總量。",
    industryNote: "高流明不一定等於適合所有工作，配光角度與眩光控制同樣重要。",
    image: "/assets/cards/lumen.png",
  },
  {
    id: "card_battery",
    category: "energy",
    icon: "🔋",
    title: "電池循環壽命",
    description: "充放電循環、溫度與放電深度都會影響電池可用壽命。",
    industryNote: "妥善的充電管理能降低停機時間並延長工作燈電池壽命。",
    image: "/assets/cards/battery.png",
  },
  {
    id: "card_alloy",
    category: "materials",
    icon: "⬡",
    title: "輕量合金材料",
    description: "鋁合金兼具重量輕、可加工與耐腐蝕等特性。",
    industryNote: "手持設備外殼常在強度、散熱、重量與成本之間取得平衡。",
    image: "/assets/cards/alloy.png",
  },
  {
    id: "card_maintenance",
    category: "maintenance",
    icon: "🔧",
    title: "預防性維護",
    description: "定期檢查能在故障發生前找出磨耗、鬆動或過熱問題。",
    industryNote: "預防性維護可提高設備妥善率並減少非預期停機。",
    image: "/assets/cards/maintenance.png",
  },
  {
    id: "card_marine",
    category: "marine",
    icon: "⚓",
    title: "海事設備防護",
    description: "鹽霧、濕氣與震動是海事設備常見的環境挑戰。",
    industryNote: "材料、密封與表面處理必須共同設計，才能提高耐候能力。",
    image: "/assets/cards/marine.png",
  },
  {
    id: "card_safety",
    category: "safety",
    icon: "🛡️",
    title: "工作區域照明安全",
    description: "均勻照度與清楚的陰影邊界可協助辨識障礙與危險。",
    industryNote: "良好照明能改善作業判斷，但仍須搭配正確的安全程序。",
    image: "/assets/cards/safety.png",
  },
  {
    id: "card_service",
    category: "maintenance",
    icon: "⚙️",
    title: "設備服務紀錄",
    description: "維修紀錄能追蹤零件更換、故障原因與設備狀態。",
    industryNote: "一致的紀錄格式有助於後續診斷與維護資源安排。",
    image: "/assets/cards/service.png",
  },
];

const CUSTOM_CARD_STORAGE_KEY = "sci_knowledge_custom_card_database";

export function getCustomCardDefinitions(): KnowledgeCardDefinition[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_CARD_STORAGE_KEY);
    return raw ? JSON.parse(raw) as KnowledgeCardDefinition[] : [];
  } catch {
    return [];
  }
}

export function getAllCardDefinitions(): KnowledgeCardDefinition[] {
  const cards = new Map(CARD_DATABASE.map((card) => [card.id, card]));
  getCustomCardDefinitions().forEach((card) => cards.set(card.id, card));
  return [...cards.values()];
}

export function saveCustomCardDefinition(card: KnowledgeCardDefinition): void {
  if (typeof window === "undefined") return;
  const customCards = getCustomCardDefinitions();
  const exists = customCards.some((item) => item.id === card.id);
  const next = exists
    ? customCards.map((item) => item.id === card.id ? card : item)
    : [...customCards, card];
  window.localStorage.setItem(CUSTOM_CARD_STORAGE_KEY, JSON.stringify(next));
}

export function getCardDefinition(cardId: string): KnowledgeCardDefinition | undefined {
  return getAllCardDefinitions().find((card) => card.id === cardId);
}
