import type { AmbientDialogueConfig } from "./types";
const now = "local-default";
export const DEFAULT_AMBIENT_DIALOGUES: AmbientDialogueConfig = { version: 1, updatedAt: now, defaultLineDurationMs: 3000, idleDelayMs: 12000, dialogues: [
  { id: "ambient_warmup", name: "開工前的小默契", category: "ambient", enabled: true, priority: 0, weight: 1, cooldownMs: 90000, maxTriggers: 0, lines: [
    { speaker: "claire", text: "今天的實驗室好安靜喔。", expression: "normal", durationMs: 3000 },
    { speaker: "ethan", text: "安靜代表設備運轉效率正常。", expression: "happy", durationMs: 3000 },
    { speaker: "leo", text: "那就用我們的聲音把氣氛點亮吧！", expression: "surprised", durationMs: 3000 },
  ], createdAt: now, updatedAt: now },
  { id: "ambient_system_check", name: "系統例行檢查", category: "ambient", enabled: true, priority: 0, weight: 1, cooldownMs: 90000, maxTriggers: 0, lines: [
    { speaker: "ethan", text: "【系統】照明核心穩定，勇氣指數維持在安全範圍。", expression: "normal", durationMs: 3000 },
    { speaker: "claire", text: "聽起來很棒，但每個人也要記得好好休息喔。", expression: "happy", durationMs: 3000 },
    { speaker: "leo", text: "收到！燈燈小隊隨時可以出發！", expression: "surprised", durationMs: 3000 },
  ], createdAt: now, updatedAt: now },
  { id: "ambient_team_signal", name: "小隊同步訊號", category: "ambient", enabled: true, priority: 0, weight: 1, cooldownMs: 90000, maxTriggers: 0, lines: [
    { speaker: "leo", text: "【系統】偵測到勇氣能量波動！是有人準備挑戰新任務了嗎？", expression: "happy", durationMs: 3000 },
    { speaker: "ethan", text: "先完成裝備檢查，成功率會更高。", expression: "normal", durationMs: 3000 },
    { speaker: "claire", text: "不管結果如何，我們都會陪著你。", expression: "happy", durationMs: 3000 },
  ], createdAt: now, updatedAt: now },
  { id: "ambient_lab_lights", name: "實驗室燈光提示", category: "ambient", enabled: true, priority: 0, weight: 1, cooldownMs: 90000, maxTriggers: 0, lines: [
    { speaker: "claire", text: "【系統】實驗室照明已切換為勇氣模式。", expression: "normal", durationMs: 3000 },
    { speaker: "leo", text: "連燈光都在替我們加油，太熱血了吧！", expression: "surprised", durationMs: 3000 },
    { speaker: "ethan", text: "這是預設程序，不過確實能提升士氣。", expression: "happy", durationMs: 3000 },
  ], createdAt: now, updatedAt: now },
  { id: "welcome_back", name: "回到實驗室", category: "event", enabled: true, priority: 10, weight: 1, cooldownMs: 0, maxTriggers: 1, oncePerLabEntry: true, condition: { eventType: "lab_enter" }, lines: [
    { speaker: "leo", text: "歡迎回來！下一個任務也一起加油！", expression: "happy", durationMs: 3000 },
  ], createdAt: now, updatedAt: now },
] };
