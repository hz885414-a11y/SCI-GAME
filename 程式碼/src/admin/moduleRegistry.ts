export interface AdminModule {
  id: "gameplay" | "bosses" | "effects" | "pixelfx" | "supply" | "timeline" | "prologue" | "ending" | "knowledge" | "cardEvents" | "characters" | "dialogues" | "ambientDialogues" | "rhythm";
  label: string;
  description: string;
}

export const ADMIN_MODULES: AdminModule[] = [
  { id: "gameplay", label: "戰鬥與掉落", description: "任務戰鬥中的攻擊力、血量與掉落率" },
  { id: "bosses", label: "Boss 管理", description: "六個展覽 Boss 的名稱、生命、技能與行為數據" },
  { id: "effects", label: "戰鬥特效庫", description: "為機器人與每個 Boss 技能上傳 PNG sprite sheet 與 JSON manifest" },
  { id: "pixelfx", label: "PixelFX 特效展示", description: "逐一預覽 244 個像素特效，建立日後導入的候選清單" },
  { id: "supply", label: "後勤補給部", description: "補給商品、價格、最高等級與升級效果" },
  { id: "timeline", label: "劇情時間線", description: "序章、新手教學、章節對話選擇與三種結局，逐段查看和修改" },
  { id: "ending", label: "階段結局", description: "擊敗六個魔王後播放的三頁故事文字與圖片" },
  { id: "knowledge", label: "知識事件與卡片", description: "統整觸發條件、事件彈窗與獎勵知識卡片" },
  { id: "cardEvents", label: "Card Event System", description: "伺服器發卡規則、優先級、待發卡與卡片狀態" },
  { id: "characters", label: "角色立繪設定", description: "依桌機、平板、手機調整角色位置與大小" },
  { id: "dialogues", label: "基地角色對話", description: "研發實驗室輸入煩惱後，三位角色的回覆" },
  { id: "ambientDialogues", label: "角色對話管理", description: "實驗室日常聊天與遊戲事件觸發對話" },
  { id: "rhythm", label: "焊接音樂編輯器", description: "調整焊接小遊戲音符的時間點與 Z／X／C／V 軌道" },
];
