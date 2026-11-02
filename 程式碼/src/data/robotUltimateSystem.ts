/** Boss victories unlock permanent ultimate modules; one may be equipped at a time. */
export const ROBOT_ULTIMATE_IDS = ["orbital_strike", "solar_nova", "magnetic_tempest", "abyssal_lance", "terra_breaker", "thunder_rail", "core_singularity"] as const;
export type RobotUltimateId = (typeof ROBOT_ULTIMATE_IDS)[number];

export type RobotUltimateStyle = "orbital" | "nova" | "lockOnBombardment" | "toolBarrage" | "dashPunch" | "abyssalLance" | "singularity";
export type RobotUltimate = { id: RobotUltimateId; name: string; icon: string; description: string; effect: string; damageMultiplier: number; color: string; battleCall: string; style: RobotUltimateStyle; rewardChapter?: number; clearsProjectiles?: boolean; clearsMinions?: boolean; stunTicks?: number; invulnerabilityTicks?: number; ignoresDefense?: boolean; strikeCount?: number };
export const DEFAULT_ROBOT_ULTIMATE: RobotUltimateId = "orbital_strike";

export const ROBOT_ULTIMATES: Record<RobotUltimateId, RobotUltimate> = {
  orbital_strike: { id: "orbital_strike", name: "軌道巨炮", icon: "☄", description: "C2-932 的標準軌道轟擊協議。", effect: "清除彈幕後進行單發軌道轟擊", damageMultiplier: 1, color: "#38bdf8", battleCall: "OMNI-BEAM ORBITAL STRIKE", style: "orbital", clearsProjectiles: true, clearsMinions: true },
  solar_nova: { id: "solar_nova", name: "日冕新星", icon: "☀", description: "由 AMPA 停電核心反推的高熱淨化模組。", effect: "原地日冕爆發，清除彈幕並獲得短暫無敵", damageMultiplier: 0.9, color: "#facc15", battleCall: "SOLAR NOVA PURGE", style: "nova", rewardChapter: 1, clearsProjectiles: true, invulnerabilityTicks: 150 },
  magnetic_tempest: { id: "magnetic_tempest", name: "法蘭克福鎖定轟炸", icon: "🎯", description: "複製 Automechanika Frankfurt Boss 的瞄準轟炸系統。", effect: "鎖定 Boss 後連續五發空襲；每發穿透防禦", damageMultiplier: 0.28, color: "#f43f5e", battleCall: "FRANKFURT LOCK-ON BARRAGE", style: "lockOnBombardment", rewardChapter: 2, clearsProjectiles: true, ignoresDefense: true, strikeCount: 5 },
  abyssal_lance: { id: "abyssal_lance", name: "工具暴雨", icon: "🔧", description: "複製 TITE × IHT Boss 的磁力工具投擲系統。", effect: "掃出召喚硬體並以工具雨覆蓋 Boss", damageMultiplier: 0.9, color: "#22d3ee", battleCall: "TITE TOOL BARRAGE", style: "toolBarrage", rewardChapter: 3, clearsMinions: true, strikeCount: 3 },
  terra_breaker: { id: "terra_breaker", name: "Apex 衝刺重拳", icon: "👊", description: "複製 AAPEX Boss 的連鎖衝刺推進器。", effect: "無敵 1 秒衝刺撞擊，將 Boss 擊退並擊暈", damageMultiplier: 1.1, color: "#fb923c", battleCall: "APEX RAM PUNCH", style: "dashPunch", rewardChapter: 4, stunTicks: 120, invulnerabilityTicks: 60 },
  thunder_rail: { id: "thunder_rail", name: "深潛穿刺槍", icon: "🌊", description: "解析 METSTRADE Boss 的潛行伏擊與高壓構造。", effect: "高壓穿刺無視防禦；不會替你清除彈幕", damageMultiplier: 1.25, color: "#0ea5e9", battleCall: "DEEP DIVE LANCE", style: "abyssalLance", rewardChapter: 5, ignoresDefense: true },
  core_singularity: { id: "core_singularity", name: "核心奇點", icon: "✦", description: "bauma 終極黑暗核心壓縮而成的最終武裝。", effect: "吞沒彈幕與召喚物，無視防禦並長時間擊暈", damageMultiplier: 1.1, color: "#fb7185", battleCall: "CORE SINGULARITY", style: "singularity", rewardChapter: 6, clearsProjectiles: true, clearsMinions: true, stunTicks: 210, ignoresDefense: true },
};

export const getRobotUltimate = (id: RobotUltimateId | null | undefined) => ROBOT_ULTIMATES[id || DEFAULT_ROBOT_ULTIMATE] || ROBOT_ULTIMATES[DEFAULT_ROBOT_ULTIMATE];
export const getBossUltimateReward = (chapter: number): RobotUltimateId | null => ROBOT_ULTIMATE_IDS.find((id) => ROBOT_ULTIMATES[id].rewardChapter === chapter) || null;
