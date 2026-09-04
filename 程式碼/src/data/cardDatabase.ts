export type KnowledgeCardCategory = "lighting" | "energy" | "materials" | "maintenance" | "marine" | "safety";

export interface BossWeakeningEffect {
  type: "bossWeakening";
  chapter: number;
  label: string;
  bossHpMultiplier?: number;
  moveSpeedMultiplier?: number;
  dashSpeedMultiplier?: number;
  attackIntervalMultiplier?: number;
}

export interface KnowledgeCardDefinition {
  id: string;
  category: KnowledgeCardCategory;
  icon: string;
  title: string;
  description: string;
  industryNote: string;
  image: string;
  bossEffect?: BossWeakeningEffect;
}

const EXHIBITION_BOSS_CARDS: KnowledgeCardDefinition[] = [
  {
    id: "card_ampa_failure", category: "energy", icon: "⚡", title: "AMPA：停電核心弱點紀錄",
    description: "挑戰失敗留下的電力波形，揭露核心過載前的短暫空檔。",
    industryNote: "辨識異常電流與負載變化，是電力設備故障診斷的重要環節。", image: "",
    bossEffect: { type: "bossWeakening", chapter: 1, label: "再戰 AMPA：魔王生命 -12%、移動 -10%", bossHpMultiplier: 0.88, moveSpeedMultiplier: 0.9 },
  },
  {
    id: "card_ampa_victory", category: "lighting", icon: "🏆", title: "AMPA：穩定供電驗證",
    description: "成功壓制停電核心後，取得負載平衡與備援照明的實戰資料。",
    industryNote: "備援電力可讓關鍵照明在主電源異常時維持運作。", image: "",
    bossEffect: { type: "bossWeakening", chapter: 1, label: "重複挑戰 AMPA：魔王生命 -5%", bossHpMultiplier: 0.95 },
  },
  {
    id: "card_frankfurt_failure", category: "maintenance", icon: "🔩", title: "Automechanika：機甲關節分析",
    description: "敗退時記錄了工程機甲轉向前的關節延遲，可用來預判攻勢。",
    industryNote: "車用與工業機構的關節負載，會影響磨耗、精度與維修週期。", image: "",
    bossEffect: { type: "bossWeakening", chapter: 2, label: "再戰 Automechanika：魔王生命 -12%、攻擊間隔 +12%", bossHpMultiplier: 0.88, attackIntervalMultiplier: 1.12 },
  },
  {
    id: "card_frankfurt_victory", category: "maintenance", icon: "🏆", title: "Automechanika：預防維護戰報",
    description: "成功拆解黑暗工程機甲的攻擊循環，完成一份預防維護戰報。",
    industryNote: "以狀態資料安排維護，有助於降低突發故障與非預期停機。", image: "",
    bossEffect: { type: "bossWeakening", chapter: 2, label: "重複挑戰 Automechanika：魔王生命 -5%", bossHpMultiplier: 0.95 },
  },
  {
    id: "card_tite_failure", category: "marine", icon: "🌊", title: "TITE × IHT：水下陰影聲納",
    description: "小隊從失敗航跡中辨識出深海黑影接近前的水流變化。",
    industryNote: "海事設備常利用聲納與環境感測補足水下能見度限制。", image: "",
    bossEffect: { type: "bossWeakening", chapter: 3, label: "再戰 TITE × IHT：魔王移動 -12%、攻擊間隔 +10%", moveSpeedMultiplier: 0.88, attackIntervalMultiplier: 1.1 },
  },
  {
    id: "card_tite_victory", category: "marine", icon: "🏆", title: "TITE × IHT：海事防護完成",
    description: "成功驅散深海黑影，驗證密封、耐蝕與水下照明的協同效果。",
    industryNote: "海事裝備的可靠度來自密封、材料與維護制度的整體設計。", image: "",
    bossEffect: { type: "bossWeakening", chapter: 3, label: "重複挑戰 TITE × IHT：魔王生命 -5%", bossHpMultiplier: 0.95 },
  },
  {
    id: "card_aapex_failure", category: "safety", icon: "💨", title: "AAPEX：高速衝刺軌跡",
    description: "挑戰失敗仍留下完整輪跡，讓小隊能提早判斷連續衝刺方向。",
    industryNote: "高速移動系統需要同時考量制動距離、抓地力與碰撞安全。", image: "",
    bossEffect: { type: "bossWeakening", chapter: 4, label: "再戰 AAPEX：魔王生命 -10%、衝刺速度 -14%", bossHpMultiplier: 0.9, dashSpeedMultiplier: 0.86 },
  },
  {
    id: "card_aapex_victory", category: "maintenance", icon: "🏆", title: "AAPEX：動力控制校準",
    description: "擊破山神黑獸後，取得連續加速與制動控制的完整資料。",
    industryNote: "穩定的動力控制必須讓輸出、循跡與熱管理共同運作。", image: "",
    bossEffect: { type: "bossWeakening", chapter: 4, label: "重複挑戰 AAPEX：魔王衝刺速度 -6%", dashSpeedMultiplier: 0.94 },
  },
  {
    id: "card_metstrade_failure", category: "marine", icon: "🐙", title: "METSTRADE：觸手壓力警報",
    description: "潛水突襲造成的壓力變化，揭露觸手攻擊前的安全區域。",
    industryNote: "水下壓力與流場監測可協助設備避開突發負載。", image: "",
    bossEffect: { type: "bossWeakening", chapter: 5, label: "再戰 METSTRADE：魔王生命 -12%、攻擊間隔 +12%", bossHpMultiplier: 0.88, attackIntervalMultiplier: 1.12 },
  },
  {
    id: "card_metstrade_victory", category: "marine", icon: "🏆", title: "METSTRADE：深潛作業規範",
    description: "完成暗影列車討伐後，整理出潛水作業與水下視認的安全規範。",
    industryNote: "水下作業需要清楚的程序、通訊與備援照明。", image: "",
    bossEffect: { type: "bossWeakening", chapter: 5, label: "重複挑戰 METSTRADE：魔王生命 -5%", bossHpMultiplier: 0.95 },
  },
  {
    id: "card_bauma_failure", category: "materials", icon: "🪨", title: "BAUMA：礦石衝擊破綻",
    description: "從敗退現場取得的碎石樣本，顯示重裝魔王投擲與防禦的節奏。",
    industryNote: "礦業設備需針對衝擊、粉塵與高負載環境設計結構防護。", image: "",
    bossEffect: { type: "bossWeakening", chapter: 6, label: "再戰 BAUMA：魔王生命 -14%、移動 -10%", bossHpMultiplier: 0.86, moveSpeedMultiplier: 0.9 },
  },
  {
    id: "card_bauma_victory", category: "materials", icon: "🏆", title: "BAUMA：重型設備耐久驗證",
    description: "成功突破終極黑暗核心，完成重型設備的衝擊與耐久驗證。",
    industryNote: "重型機具的可靠性取決於材料、結構、安全係數與定期檢查。", image: "",
    bossEffect: { type: "bossWeakening", chapter: 6, label: "重複挑戰 BAUMA：魔王生命 -5%", bossHpMultiplier: 0.95 },
  },
];

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
  ...EXHIBITION_BOSS_CARDS,
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
