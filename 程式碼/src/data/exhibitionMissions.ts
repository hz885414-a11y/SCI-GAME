export interface ExhibitionMission {
  id: string;
  name: string;
  url: string;
  location: string;
  code: string;
  imageUrl: string;
  bossMission: {
    chapter: number;
    bossName: string;
    difficulty: number;
    rewardLabel: string;
  };
}

export const EXHIBITION_MISSIONS: ExhibitionMission[] = [
  {
    id: "ampa",
    name: "AMPA",
    url: "https://www.sci.com.tw/2026-ampa-online-exhibition/",
    location: "台北 (Taipei)",
    code: "TW-AMPA",
    imageUrl: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/5.UI/exhibition-AMPA.png",
    bossMission: { chapter: 1, bossName: "停電核心", difficulty: 1, rewardLabel: "基礎改裝素材" },
  },
  {
    id: "frankfurt",
    name: "Automechanika Frankfurt",
    url: "https://www.sci.com.tw/automechanika-frankfurt-2026-1/",
    location: "法蘭克福 (Frankfurt)",
    code: "DE-AMF",
    imageUrl: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/5.UI/exhibition-automechanika.png",
    bossMission: { chapter: 2, bossName: "黑暗工程機甲", difficulty: 2, rewardLabel: "金屬與武器素材" },
  },
  {
    id: "tite",
    name: "TITE × IHT",
    url: "https://www.sci.com.tw/titexiht2026/",
    location: "台中 (Taichung)",
    code: "TW-TITE",
    imageUrl: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/5.UI/exhibition-IHTxTITE.png",
    bossMission: { chapter: 3, bossName: "深海黑影", difficulty: 3, rewardLabel: "能源與照明素材" },
  },
  {
    id: "aapex",
    name: "AAPEX",
    url: "https://www.sci.com.tw/aapex-2026/",
    location: "拉斯維加斯 (Las Vegas)",
    code: "US-AAPEX",
    imageUrl: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/5.UI/exhibition-AAPEX.png",
    bossMission: { chapter: 4, bossName: "山神黑獸", difficulty: 3, rewardLabel: "防禦與移動素材" },
  },
  {
    id: "metstrade",
    name: "Metstrade",
    url: "https://www.sci.com.tw/metstrade-2026/",
    location: "阿姆斯特丹 (Amsterdam)",
    code: "NL-METS",
    imageUrl: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/5.UI/exhibition-METSTRADE.png",
    bossMission: { chapter: 5, bossName: "暗影列車", difficulty: 4, rewardLabel: "高階改裝素材" },
  },
  {
    id: "bauma",
    name: "bauma CHINA",
    url: "https://www.sci.com.tw/bauma-china-2026/",
    location: "上海 (Shanghai)",
    code: "CN-BAUMA",
    imageUrl: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/5.UI/exhibition-BAUMA.png",
    bossMission: { chapter: 6, bossName: "終極黑暗核心", difficulty: 5, rewardLabel: "稀有科技素材" },
  },
];
