import type { GameEventDefinition } from "../data/eventConfig";

const OPTIONS = [
  ["none", "無：只看原本累積行為"],
  ["prologueCompleted", "完整看完前情提要"],
  ["prologueSkipped", "跳過前情提要"],
  ["dialogueScenarioFirst", "首次分類為戀愛煩惱情境"],
  ["exhibitionClicked", "點擊線上展覽按鈕"],
  ["coinTotal", "金幣累積達指定數量"],
  ["dialogueTotal", "輸入戀愛煩惱累積達指定次數"],
] as const;

export function KnowledgeRuleControls({ events, onUpdate }: { events: GameEventDefinition[]; onUpdate: (index: number, patch: Partial<GameEventDefinition>) => void }) {
  return <section className="admin-knowledge-section admin-priority-rules"><div className="admin-section-title"><div><span>觸發順序與特殊條件</span><h3>進階發卡規則</h3><p>同次符合多個事件時，只觸發優先級最高的一個；同分依目前事件排序。</p></div></div><div className="admin-stack">{events.map((event, index) => <details className="admin-record" key={event.id}><summary><b>{event.icon} {event.title}</b><span>優先級：{event.priority || 0}｜{event.specialCondition ? "有特殊條件" : "一般累積事件"}</span></summary><div className="admin-record-body two-col"><label>觸發優先級<input type="number" value={event.priority || 0} onChange={(e) => onUpdate(index, { priority: Number(e.target.value) })} /><small>數字越高越優先。未選中的事件等待下一次相同行為再重新判斷。</small></label><label>特殊觸發條件<select value={event.specialCondition || "none"} onChange={(e) => onUpdate(index, { specialCondition: e.target.value === "none" ? undefined : e.target.value as GameEventDefinition["specialCondition"], specialValue: undefined })}>{OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><small>未選擇時，完全沿用原本的行為與累積次數。</small></label>{event.specialCondition && <label>條件值<input value={event.specialValue || ""} onChange={(e) => onUpdate(index, { specialValue: e.target.value })} placeholder={event.specialCondition === "coinTotal" ? "例如 1000" : event.specialCondition === "dialogueTotal" ? "例如 5" : "情境或展覽 ID（如需指定）"} /></label>}</div></details>)}</div></section>;
}
