import { useEffect, useMemo, useRef, useState } from "react";
import { effects } from "../third_party/pixelfx/src/fx/index.js";
import { categories } from "../third_party/pixelfx/src/fx/categories.js";
import { actBounds, actorAlphaOf, backdrop, clearFrame, composite, createAct, createFrame, createFx, drawActor, painterFor, stockActor } from "../third_party/pixelfx/src/core/index.js";
import "./pixelfx-showcase.css";

type FxMeta = { name?: string; desc?: string; tags?: string[]; size?: number[]; origin?: number[]; duration?: number; fps?: number; loop?: boolean; bg?: string; actor?: boolean };
type FxModule = { meta?: FxMeta; act?: unknown };
type ResolvedMeta = FxMeta & { name: string; size: number[]; origin: number[]; duration: number; fps: number; loop: boolean; bg: string; tags: string[] };
type Effect = { id: string; category: string; module: FxModule; meta: ResolvedMeta };

const CANDIDATES_KEY = "sci_pixelfx_candidates";
const categoryNames = new Map(categories.map((category: { id: string; name: string }) => [category.id, category.name]));
const allEffects: Effect[] = Object.entries(effects as unknown as Record<string, FxModule>).map(([id, module]) => ({
  id,
  category: id.split("/")[0],
  module,
  meta: { fps: 30, bg: "dark", loop: false, duration: 1, tags: [], size: [160, 120], origin: [80, 100], name: id.split("/")[1], ...(module.meta || {}) },
})).sort((a, b) => a.id.localeCompare(b.id));

function Preview({ effect }: { effect: Effect }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const meta = effect.meta;
    const acted = Boolean(effect.module.act);
    const bounds = acted ? actBounds(effect.module) : null;
    const [width, height] = bounds ? [Math.max(160, bounds.x1 - bounds.x0 + 32), Math.max(110, bounds.y1 - bounds.y0 + 32)] : [Math.max(160, meta.size[0] + 48), Math.max(110, meta.size[1] + 48)];
    node.width = width;
    node.height = height;
    const context = node.getContext("2d");
    if (!context) return;
    const frame = createFrame(width, height);
    const image = context.createImageData(width, height);
    const x = bounds ? 16 - bounds.x0 : Math.floor((width - meta.size[0]) / 2) + meta.origin[0];
    const y = bounds ? Math.max(8 - bounds.y0, height - bounds.y1 - 8) : Math.floor((height - meta.size[1]) / 2) + meta.origin[1];
    const background = backdrop(meta.bg, width, height, y);
    let instance: any = (acted ? createAct : createFx)(effect.module, { x, y });
    let last = performance.now(); let elapsed = 0; let raf = 0;
    const restart = () => { instance = (acted ? createAct : createFx)(effect.module, { x, y }); elapsed = 0; };
    const paint = (now: number) => {
      const delta = Math.min(.05, (now - last) / 1000); last = now; elapsed += delta;
      const finished = acted ? instance.done() : !meta.loop && instance.t >= meta.duration;
      if (finished && elapsed > meta.duration + .55) restart(); else instance.update(delta);
      clearFrame(frame);
      if (acted) instance.draw(frame);
      else {
        instance.draw(frame, "back");
        const time = meta.loop ? instance.t % meta.duration : Math.min(instance.t, meta.duration);
        if (meta.actor) drawActor(painterFor(frame).place(x, y, false), instance.options.actor ?? stockActor(), actorAlphaOf(effect.module, time, instance.options));
        instance.draw(frame, "front");
      }
      composite(frame, image.data, background); context.putImageData(image, 0, 0);
      raf = requestAnimationFrame(paint);
    };
    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [effect]);
  return <canvas className="pixelfx-preview" ref={canvas} aria-label={`${effect.meta.name} 動畫預覽`} />;
}

export function PixelfxShowcase() {
  const [category, setCategory] = useState("all"); const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(allEffects[0]?.id ?? "");
  const [candidates, setCandidates] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(CANDIDATES_KEY) || "[]"); } catch { return []; } });
  const selected = allEffects.find((effect) => effect.id === selectedId) || allEffects[0];
  const filtered = useMemo(() => allEffects.filter((effect) => (category === "all" || effect.category === category) && `${effect.id} ${effect.meta.name} ${effect.meta.desc || ""} ${effect.meta.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase().trim())), [category, query]);
  useEffect(() => { localStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates)); }, [candidates]);
  const toggleCandidate = (id: string) => setCandidates((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  if (!selected) return null;
  return <main className="pixelfx-shell">
    <header className="pixelfx-header"><div><p>SCI-GAME / PIXELFX LIBRARY</p><h1>特效展示與選擇</h1><span>已載入 {allEffects.length} 個特效；先預覽，再加入候選清單。</span></div><nav className="pixelfx-header-actions"><a href={`${import.meta.env.BASE_URL}admin`}>返回後台</a><a href={import.meta.env.BASE_URL}>返回遊戲</a></nav></header>
    <section className="pixelfx-toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋名稱、分類或標籤…" /><div className="pixelfx-chips"><button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>全部 <small>{allEffects.length}</small></button>{categories.map((item: { id: string; name: string }) => <button key={item.id} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}>{item.name} <small>{allEffects.filter((effect) => effect.category === item.id).length}</small></button>)}</div></section>
    <div className="pixelfx-layout"><section className="pixelfx-list"><div className="pixelfx-list-heading">顯示 {filtered.length} 個特效</div>{filtered.map((effect) => <button key={effect.id} className={`pixelfx-effect-row ${selected.id === effect.id ? "selected" : ""}`} onClick={() => setSelectedId(effect.id)}><span>{effect.meta.name}</span><small>{effect.id}</small>{candidates.includes(effect.id) && <i>已選</i>}</button>)}</section>
      <section className="pixelfx-detail"><div className="pixelfx-stage"><Preview effect={selected} /></div><div className="pixelfx-meta"><div><span className="pixelfx-kicker">{categoryNames.get(selected.category)} / {selected.id}</span><h2>{selected.meta.name}</h2><p>{selected.meta.desc || "可直接使用的程序化像素特效。"}</p></div><button className={`pixelfx-select ${candidates.includes(selected.id) ? "chosen" : ""}`} onClick={() => toggleCandidate(selected.id)}>{candidates.includes(selected.id) ? "✓ 已加入候選" : "+ 加入候選"}</button></div><dl><div><dt>動畫</dt><dd>{selected.meta.loop ? "循環" : "單次"} · {selected.meta.duration.toFixed(2)} 秒 · {selected.meta.fps} FPS</dd></div><div><dt>畫布</dt><dd>{selected.meta.size[0]} × {selected.meta.size[1]} px</dd></div><div><dt>標籤</dt><dd>{selected.meta.tags.length ? selected.meta.tags.join("、") : "—"}</dd></div></dl><p className="pixelfx-import">日後導入識別碼：<code>{selected.id}</code></p></section>
      <aside className="pixelfx-candidates"><div><span>候選清單</span><b>{candidates.length}</b></div>{candidates.length ? <ol>{candidates.map((id) => <li key={id}><button onClick={() => setSelectedId(id)}>{id}</button><button aria-label={`移除 ${id}`} onClick={() => toggleCandidate(id)}>×</button></li>)}</ol> : <p>點選左側特效後，按「加入候選」。你的清單會保存在此瀏覽器。</p>}</aside>
    </div>
  </main>;
}
