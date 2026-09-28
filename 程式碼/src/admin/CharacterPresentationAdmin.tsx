import type { CharacterBreakpoint, CharacterDefaultPortraitConfig, CharacterId, CharacterLayoutConfig, CharacterLayoutValue, DialoguePortrait } from "../config/types";

const CHARACTERS: Array<[CharacterId, string]> = [["claire", "Claire"], ["ethan", "Ethan"], ["leo", "Leo"]];
const BREAKPOINTS: Array<[CharacterBreakpoint, string, string]> = [["desktop", "桌機", "寬度 1024px 以上"], ["tablet", "平板", "寬度 640–1023px"], ["mobile", "手機", "寬度 639px 以下"]];
const PORTRAITS: Array<[Exclude<DialoguePortrait, "auto">, string]> = [["normal", "一般（COMMON）"], ["dialog", "自然說話"], ["happy", "開心"], ["think", "思考／懷疑"], ["surprise", "驚訝／激動"]];

export function CharacterPresentationAdmin({ value, defaultPortraits, onChange, onDefaultPortraitsChange, onReset }: { value: CharacterLayoutConfig; defaultPortraits: CharacterDefaultPortraitConfig; onChange: (value: CharacterLayoutConfig) => void; onDefaultPortraitsChange: (value: CharacterDefaultPortraitConfig) => void; onReset: () => void }) {
  const update = (character: CharacterId, breakpoint: CharacterBreakpoint, patch: Partial<CharacterLayoutValue>) => onChange({
    ...value,
    [character]: { ...value[character], [breakpoint]: { ...value[character][breakpoint], ...patch } },
  });

  return <div className="admin-stack">
    <div className="admin-section-title"><div><span>表情設定</span><h3>角色預設表情</h3><p>沒有針對單句對話指定圖片時，前台會使用這裡的表情；單句設定仍然優先。</p></div></div>
    <div className="admin-grid">
      {CHARACTERS.map(([character, characterLabel]) => <label className="admin-field-card" key={character}>
        <span>{characterLabel} 預設表情</span>
        <small>包含待機畫面與未指定圖片的角色對話。</small>
        <select value={defaultPortraits[character]} onChange={(event) => onDefaultPortraitsChange({ ...defaultPortraits, [character]: event.target.value as Exclude<DialoguePortrait, "auto"> })}>
          {PORTRAITS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </label>)}
    </div>
    <div className="admin-section-title"><div><span>版面工具</span><h3>角色立繪位置與尺寸</h3><p>如果調整後畫面失衡，可以一次恢復三位角色在所有裝置尺寸下的初始設定。</p></div><button type="button" className="admin-delete" onClick={onReset}>↺ 還原全部預設值</button></div>
    <p className="admin-card-event-note">分別調整桌機、平板與手機上的大型半身立繪。水平位置使用畫面百分比；整體比例保留角色身高差；圖片內容倍率與位移用來修正 PNG 透明留白。</p>
    {BREAKPOINTS.map(([breakpoint, label, hint]) => <details className="admin-record" key={breakpoint} open={breakpoint === "desktop"}>
      <summary><b>{label}角色構圖</b><span>{hint}</span></summary>
      <div className="admin-record-body">
        {CHARACTERS.map(([character, characterLabel]) => { const current = value[character][breakpoint]; return <div className="admin-subsection" key={character}>
          <h3>{characterLabel}</h3>
          <div className="admin-grid">
            <label className="admin-field-card"><span>水平位置（%）</span><small>0 是最左側，100 是最右側。</small><input type="number" min="0" max="100" step="1" value={current.x} onChange={(e) => update(character, breakpoint, { x: Number(e.target.value) })} /></label>
            <label className="admin-field-card"><span>角色整體比例</span><small>角色設定身高；建議 Claire 0.94、Ethan 1、Leo 1.06。</small><input type="number" min=".5" max="2" step=".01" value={current.scale} onChange={(e) => update(character, breakpoint, { scale: Number(e.target.value) })} /></label>
            <label className="admin-field-card"><span>圖片內容倍率</span><small>校正 PNG 透明留白，不會改變角色位置。</small><input type="number" min=".5" max="2.5" step=".01" value={current.imageScale} onChange={(e) => update(character, breakpoint, { imageScale: Number(e.target.value) })} /></label>
            <label className="admin-field-card"><span>水平微調（px）</span><small>正數往右、負數往左。</small><input type="number" step="1" value={current.offsetX} onChange={(e) => update(character, breakpoint, { offsetX: Number(e.target.value) })} /></label>
            <label className="admin-field-card"><span>垂直微調（px）</span><small>正數往上、負數往下並藏到對話框後。</small><input type="number" step="1" value={current.offsetY} onChange={(e) => update(character, breakpoint, { offsetY: Number(e.target.value) })} /></label>
            <label className="admin-field-card"><span>角色基礎高度（px）</span><small>直接控制角色容器高度；數值越大，人物越大。建議桌機 700–1100、手機 600–900。</small><input type="number" min="200" max="1800" step="10" value={current.baseHeightPx ?? Math.round((current.baseHeightVh ?? 88) * 9)} onChange={(e) => update(character, breakpoint, { baseHeightPx: Number(e.target.value), baseHeightVh: undefined })} /></label>
          </div>
        </div>; })}
      </div>
    </details>)}
  </div>;
}
