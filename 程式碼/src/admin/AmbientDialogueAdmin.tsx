import React, { useEffect, useRef, useState } from "react";
import { DEFAULT_AMBIENT_DIALOGUES } from "../ambient-dialogues/defaults";
import { loadAmbientDialogues, saveAmbientDialogues } from "../ambient-dialogues/firebase";
import type { AmbientDialogue, AmbientDialogueConfig, AmbientDialogueLine, AmbientEventType } from "../ambient-dialogues/types";

const eventTypes: AmbientEventType[] = ["lab_enter", "lab_idle", "research_start", "research_success", "research_fail", "boss_defeated", "card_obtained", "item_obtained", "quest_completed", "player_return", "character_click_count", "custom_event"];
const newLine = (): AmbientDialogueLine => ({ speaker: "claire", text: "請輸入對話內容", expression: "normal", durationMs: 3000 });
const newDialogue = (): AmbientDialogue => ({ id: `ambient_${Date.now()}`, name: "新角色對話", category: "ambient", enabled: true, priority: 0, weight: 1, cooldownMs: 60000, maxTriggers: 0, lines: [newLine()], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

interface DialogueRecordProps {
  dialogue: AmbientDialogue;
  index: number;
  update: (index: number, patch: Partial<AmbientDialogue>) => void;
  setConfig: React.Dispatch<React.SetStateAction<AmbientDialogueConfig>>;
  startPreview: (dialogue: AmbientDialogue) => void;
}

function DialogueRecord({ dialogue, index, update, setConfig, startPreview }: DialogueRecordProps) {
  return <details className="admin-record">
    <summary>
      <b>{dialogue.enabled ? "●" : "○"} {dialogue.name}</b>
      <span>{dialogue.category === "ambient" ? "日常" : "特殊事件"}｜{dialogue.lines.length} 句｜優先 {dialogue.priority}</span>
    </summary>
    <div className="admin-record-body two-col">
      <label>對話名稱<input value={dialogue.name} onChange={(event) => update(index, { name: event.target.value })} /></label>
      <label>對話 ID<input value={dialogue.id} onChange={(event) => update(index, { id: event.target.value })} /></label>
      <label>分類
        <select value={dialogue.category} onChange={(event) => {
          const category = event.target.value as AmbientDialogue["category"];
          update(index, { category, condition: category === "event" ? dialogue.condition || { eventType: "lab_enter", chance: 1 } : dialogue.condition });
        }}>
          <option value="ambient">日常</option><option value="event">特殊事件</option>
        </select>
      </label>
      <label className="admin-check"><input type="checkbox" checked={dialogue.enabled} onChange={(event) => update(index, { enabled: event.target.checked })} />啟用此對話</label>
      <label>優先級<input type="number" value={dialogue.priority} onChange={(event) => update(index, { priority: Number(event.target.value) })} /></label>
      <label>隨機權重<input type="number" min="1" value={dialogue.weight} onChange={(event) => update(index, { weight: Number(event.target.value) })} /></label>
      <label>冷卻時間（秒）<input type="number" min="0" value={dialogue.cooldownMs / 1000} onChange={(event) => update(index, { cooldownMs: Number(event.target.value) * 1000 })} /></label>
      <label>最大觸發次數（0=不限）<input type="number" min="0" value={dialogue.maxTriggers} onChange={(event) => update(index, { maxTriggers: Number(event.target.value) })} /></label>

      {dialogue.category === "event" && <>
        <label>事件類型
          <select value={dialogue.condition?.eventType || "lab_enter"} onChange={(event) => {
            const eventType = event.target.value;
            update(index, { condition: { ...dialogue.condition, eventType, required: eventType === "character_click_count" ? { ...dialogue.condition?.required, clickCount: dialogue.condition?.required?.clickCount || 10 } : dialogue.condition?.required } });
          }}>
            {eventTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        {dialogue.condition?.eventType === "character_click_count" && <label>累積角色點擊次數
          <input type="number" min="1" value={Number(dialogue.condition?.required?.clickCount || 10)} onChange={(event) => update(index, { condition: { ...dialogue.condition, required: { ...dialogue.condition?.required, clickCount: Math.max(1, Number(event.target.value)) } } })} />
          <small>不分角色；累積點擊達到此數字後即可播放。若只想出現一次，最大觸發次數設為 1。</small>
        </label>}
        <label>指定事件 ID（選填）<input value={dialogue.condition?.eventId || ""} onChange={(event) => update(index, { condition: { ...dialogue.condition, eventId: event.target.value } })} /></label>
        <label>觸發機率（0–1）<input type="number" min="0" max="1" step=".05" value={dialogue.condition?.chance ?? 1} onChange={(event) => update(index, { condition: { ...dialogue.condition, chance: Number(event.target.value) } })} /></label>
        <label className="admin-check"><input type="checkbox" checked={Boolean(dialogue.oncePerLabEntry)} onChange={(event) => update(index, { oncePerLabEntry: event.target.checked })} />每次進入實驗室只播一次</label>
      </>}

      <div className="wide">
        <b>對話句子（1～10 句）</b>
        {dialogue.lines.map((line, lineIndex) => <div className="admin-dialogue-row" key={lineIndex}>
          <select value={line.speaker} onChange={(event) => update(index, { lines: dialogue.lines.map((item, itemIndex) => itemIndex === lineIndex ? { ...item, speaker: event.target.value } : item) })}><option>claire</option><option>ethan</option><option>leo</option></select>
          <textarea value={line.text} onChange={(event) => update(index, { lines: dialogue.lines.map((item, itemIndex) => itemIndex === lineIndex ? { ...item, text: event.target.value } : item) })} />
          <select value={line.expression} onChange={(event) => update(index, { lines: dialogue.lines.map((item, itemIndex) => itemIndex === lineIndex ? { ...item, expression: event.target.value as AmbientDialogueLine["expression"] } : item) })}>{["normal", "happy", "angry", "sad", "surprised"].map((expression) => <option key={expression}>{expression}</option>)}</select>
          <input type="number" min="500" step="500" value={line.durationMs} onChange={(event) => update(index, { lines: dialogue.lines.map((item, itemIndex) => itemIndex === lineIndex ? { ...item, durationMs: Number(event.target.value) } : item) })} />
          <button type="button" onClick={() => update(index, { lines: dialogue.lines.filter((_, itemIndex) => itemIndex !== lineIndex) })}>刪除</button>
        </div>)}
        <button type="button" className="admin-add" disabled={dialogue.lines.length >= 10} onClick={() => update(index, { lines: [...dialogue.lines, newLine()] })}>＋ 新增句子</button>
      </div>
      <div className="wide admin-record-actions">
        <button type="button" onClick={() => startPreview(dialogue)}>▶ 預覽整組對話</button>
        <button type="button" onClick={() => setConfig((value) => ({ ...value, dialogues: [...value.dialogues, { ...structuredClone(dialogue), id: `${dialogue.id}_copy_${Date.now()}`, name: `${dialogue.name}（副本）` }] }))}>複製</button>
        <button type="button" className="admin-delete" onClick={() => setConfig((value) => ({ ...value, dialogues: value.dialogues.filter((_, itemIndex) => itemIndex !== index) }))}>刪除</button>
      </div>
    </div>
  </details>;
}

export function AmbientDialogueAdmin() {
  const [config, setConfig] = useState<AmbientDialogueConfig>(DEFAULT_AMBIENT_DIALOGUES);
  const [status, setStatus] = useState("載入中…");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ dialogue: AmbientDialogue; index: number } | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    loadAmbientDialogues().then((value) => { setConfig(value); setStatus("已載入角色對話設定"); }).catch(() => setStatus("Firebase 無法讀取，使用本地預設值"));
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, []);

  const update = (index: number, patch: Partial<AmbientDialogue>) => setConfig((value) => ({ ...value, dialogues: value.dialogues.map((dialogue, itemIndex) => itemIndex === index ? { ...dialogue, ...patch, updatedAt: new Date().toISOString() } : dialogue) }));
  const save = async () => {
    if (saveState === "saving") return;
    setSaveState("saving"); setStatus("正在儲存角色對話至 Firebase…");
    try {
      const next = { ...config, updatedAt: new Date().toISOString() };
      await saveAmbientDialogues(next);
      setConfig(next); localStorage.setItem("sci_ambient_dialogues_updated", String(Date.now()));
      setSavedAt(new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setSaveState("success"); setStatus("已成功儲存到 Firebase；前台下次進入實驗室或重新讀取後套用");
    } catch (error) {
      setSaveState("error"); setStatus(error instanceof Error ? error.message : "儲存失敗，請稍後再試");
    }
  };
  const startPreview = (dialogue: AmbientDialogue) => {
    if (timer.current) window.clearTimeout(timer.current);
    let index = 0;
    const next = () => {
      setPreview({ dialogue, index });
      timer.current = window.setTimeout(() => { index += 1; if (index < dialogue.lines.length) next(); else setPreview(null); }, dialogue.lines[index].durationMs);
    };
    next();
  };

  const categories: Array<{ id: AmbientDialogue["category"]; title: string; description: string }> = [
    { id: "ambient", title: "日常對話", description: "角色待機或玩家點擊時的隨機聊天" },
    { id: "event", title: "特殊事件對話", description: "由遊戲事件、回到基地或累積點擊條件觸發" },
  ];

  return <div className="admin-stack">
    <div className="admin-section-title">
      <div><span>AMBIENT DIALOGUE SYSTEM</span><h3>角色日常對話管理</h3><p aria-live="polite" className={`ambient-save-status ${saveState}`}>{status}｜資料獨立儲存在 <code>ambientDialogues/v1</code>，不會覆蓋 gameConfig 或卡片事件。</p></div>
      <div className="ambient-dialogue-actions">
        <button className="admin-add" onClick={() => setConfig((value) => ({ ...value, dialogues: [...value.dialogues, newDialogue()] }))}>＋ 新增對話</button>
        <button className={`ambient-save-button ${saveState}`} onClick={save} disabled={saveState === "saving"}>{saveState === "saving" ? "儲存中…" : saveState === "success" ? "✓ 已儲存" : saveState === "error" ? "重新儲存" : "儲存到 Firebase"}</button>
        {savedAt && <small className="ambient-save-time">最後儲存：{savedAt}</small>}
      </div>
    </div>
    <label>預設每句秒數<input type="number" min="500" step="500" value={config.defaultLineDurationMs} onChange={(event) => setConfig({ ...config, defaultLineDurationMs: Number(event.target.value) })} /></label>
    {preview && <div className="admin-record"><b>預覽｜{preview.dialogue.name}</b><p><strong>{preview.dialogue.lines[preview.index].speaker}</strong>：{preview.dialogue.lines[preview.index].text}</p><small>{preview.dialogue.lines[preview.index].durationMs / 1000} 秒｜第 {preview.index + 1} / {preview.dialogue.lines.length} 句</small></div>}
    {categories.map((category) => {
      const entries = config.dialogues.map((dialogue, index) => ({ dialogue, index })).filter(({ dialogue }) => dialogue.category === category.id);
      return <details className="admin-dialogue-category" key={category.id}>
        <summary><div><b>{category.title}</b><small>{category.description}</small></div><span>{entries.length} 組</span></summary>
        <div className="admin-dialogue-category-list">{entries.map(({ dialogue, index }) => <React.Fragment key={dialogue.id}><DialogueRecord dialogue={dialogue} index={index} update={update} setConfig={setConfig} startPreview={startPreview} /></React.Fragment>)}</div>
      </details>;
    })}
  </div>;
}
