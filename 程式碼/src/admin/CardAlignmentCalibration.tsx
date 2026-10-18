import React, { useMemo, useRef, useState } from "react";
import { CARD_FRONT_IMAGE_URL } from "../components/cards/CardFront";
import type { CardLayoutConfig, CardLayoutSlotKey } from "../config/cardLayout";
import type { GameConfig } from "../config/types";

type Card = GameConfig["cards"][number];
const slots: Array<{ key: CardLayoutSlotKey; label: string }> = [
  { key: "image", label: "卡片圖片" }, { key: "title", label: "標題" }, { key: "category", label: "分類標籤" }, { key: "descriptionLabel", label: "說明欄位" }, { key: "descriptionContent", label: "說明內容" }, { key: "extraLabel", label: "補充欄位" }, { key: "extraContent", label: "補充內容" },
];
const clone = (layout: CardLayoutConfig) => structuredClone(layout);
const styleOf = (layout: CardLayoutConfig, key: CardLayoutSlotKey) => { const rect = layout[key]; return { left: `${rect.left}%`, top: `${rect.top}%`, width: `${rect.width}%`, height: `${rect.height}%` }; };

export function CardAlignmentCalibration({ cards, layout, onChange, onApplyLayout }: { cards: GameConfig["cards"]; layout: CardLayoutConfig; onChange: (cardId: string, patch: Partial<Card>) => void; onApplyLayout: (layout: CardLayoutConfig) => void }) {
  const [selectedId, setSelectedId] = useState(cards[0]?.id || "");
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [draft, setDraft] = useState<CardLayoutConfig>(() => clone(layout));
  const previewRef = useRef<HTMLDivElement>(null);
  const drag = useRef<null | { pointerId: number; key: CardLayoutSlotKey; mode: "move" | "resize"; x: number; y: number; rect: CardLayoutConfig[CardLayoutSlotKey] }>(null);
  const selectedCard = useMemo(() => cards.find((card) => card.id === selectedId) || cards[0], [cards, selectedId]);
  if (!selectedCard) return null;
  const activeLayout = editingTemplate ? draft : layout;
  const beginDrag = (event: React.PointerEvent<HTMLDivElement | HTMLButtonElement>, key: CardLayoutSlotKey, mode: "move" | "resize") => {
    event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, key, mode, x: event.clientX, y: event.clientY, rect: { ...draft[key] } };
  };
  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current; const bounds = previewRef.current?.getBoundingClientRect();
    if (!state || state.pointerId !== event.pointerId || !bounds) return;
    const dx = (event.clientX - state.x) / bounds.width * 100; const dy = (event.clientY - state.y) / bounds.height * 100;
    setDraft((current) => { const rect = { ...state.rect }; if (state.mode === "move") { rect.left = Math.max(0, Math.min(100 - rect.width, rect.left + dx)); rect.top = Math.max(0, Math.min(100 - rect.height, rect.top + dy)); } else { rect.width = Math.max(5, Math.min(100 - rect.left, rect.width + dx)); rect.height = Math.max(2, Math.min(100 - rect.top, rect.height + dy)); } return { ...current, [state.key]: rect }; });
  };
  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => { if (drag.current?.pointerId === event.pointerId) drag.current = null; };
  const applyTemplate = () => { onApplyLayout(draft); setEditingTemplate(false); };

  return <section className="admin-knowledge-section card-alignment-calibration">
    <div className="admin-section-title"><div><span>LIVE CARD EDITOR</span><h3>卡片即時預覽與文字校正</h3><p>一般模式只編輯目前這張卡的文字與換行。公版位置模式則調整所有卡片共用的欄位位置。</p></div></div>
    <div className="admin-filter-bar"><label>預覽卡片<select value={selectedCard.id} onChange={(event) => setSelectedId(event.target.value)}>{cards.map((card) => <option key={card.id} value={card.id}>{card.icon} {card.title}</option>)}</select></label><label>公版標題對齊<select value={layout.titleAlign} onChange={(event) => onApplyLayout({ ...layout, titleAlign: event.target.value as "left" | "center" })}><option value="left">靠左</option><option value="center">置中（全部卡片）</option></select></label><label>劇情特效<select value={selectedCard.storyEffect || "standard"} onChange={(event) => onChange(selectedCard.id, { storyEffect: event.target.value as "standard" | "important" | "critical" })}><option value="standard">一般｜無額外特效</option><option value="important">重要｜金色脈衝</option><option value="critical">核心劇情｜紅金爆發</option></select></label><button type="button" className="admin-add" onClick={() => { setDraft(clone(layout)); setEditingTemplate(true); }}>調整公版位置</button>{editingTemplate && <><button type="button" className="admin-add" onClick={applyTemplate}>套用公版到全部卡片</button><button type="button" className="admin-delete" onClick={() => setEditingTemplate(false)}>取消公版調整</button></>}<span>{editingTemplate ? "拖曳各框移動；拖曳右下角圓點可縮放。尚未套用前不會改動正式卡片。" : "直接點擊卡片內文字框編輯；Enter 可新增換行。"}</span></div>
    <div ref={previewRef} className={`card-live-preview ${editingTemplate ? "is-adjusting" : ""}`} aria-label="即時卡片預覽" onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={finishDrag}>
      <img src={CARD_FRONT_IMAGE_URL} alt="卡片背景" draggable={false} />
      <div className="card-live-image" style={styleOf(activeLayout, "image")}>{selectedCard.image ? <img src={selectedCard.image} alt="" draggable={false} /> : <span>IMAGE DATA UNAVAILABLE</span>}</div>
      <input className={`card-live-title ${activeLayout.titleAlign === "center" ? "is-centered" : ""}`} style={styleOf(activeLayout, "title")} aria-label="卡片標題" value={selectedCard.title} onChange={(event) => onChange(selectedCard.id, { title: event.target.value })} />
      <span className="card-live-category" style={styleOf(activeLayout, "category")}>{selectedCard.category}</span>
      <div className="card-live-label" style={styleOf(activeLayout, "descriptionLabel")}>▣ 卡片說明</div>
      <textarea className="card-live-content" style={styleOf(activeLayout, "descriptionContent")} aria-label="卡片說明" value={selectedCard.description} onChange={(event) => onChange(selectedCard.id, { description: event.target.value })} />
      <div className="card-live-label" style={styleOf(activeLayout, "extraLabel")}>⚙ 補充</div>
      <textarea className="card-live-content" style={styleOf(activeLayout, "extraContent")} aria-label="卡片補充" value={selectedCard.industryNote} onChange={(event) => onChange(selectedCard.id, { industryNote: event.target.value })} />
      <span className="card-live-id">CARD ID&nbsp;&nbsp;{selectedCard.id}</span>
      {editingTemplate && slots.map(({ key, label }) => <div key={key} className="card-template-slot" style={styleOf(draft, key)} onPointerDown={(event) => beginDrag(event, key, "move")}><span>{label}</span><button type="button" aria-label={`縮放${label}`} onPointerDown={(event) => beginDrag(event, key, "resize")} /></div>)}
    </div>
  </section>;
}
