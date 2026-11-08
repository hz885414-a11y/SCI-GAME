import { useMemo, useRef, useState } from "react";
import "./pixel-art-studio.css";
import "./pixel-art-ai.css";

const PALETTE = ["#101827", "#26364e", "#4b6a88", "#85b7c9", "#e9fbff", "#ffb64b", "#f06455", "#a84567", "#5fc9a7", "#9fe870"];
type Pixel = string | null;

const createPixels = (size: number): Pixel[] => Array.from({ length: size * size }, () => null);
const shelterTemplate = (size: number): Pixel[] => {
  const pixels = createPixels(size); const put = (x: number, y: number, color: string) => { if (x >= 0 && x < size && y >= 0 && y < size) pixels[y * size + x] = color; };
  const mid = Math.floor(size / 2);
  for (let y = 4; y < size - 2; y++) for (let x = Math.max(1, mid - (y - 2)); x <= Math.min(size - 2, mid + (y - 2)); x++) put(x, y, "#4b6a88");
  for (let x = 2; x < size - 2; x++) put(x, size - 3, "#26364e");
  for (let x = mid - 2; x <= mid + 2; x++) for (let y = size - 7; y < size - 3; y++) put(x, y, "#101827");
  put(mid, 5, "#e9fbff"); put(mid - 1, 6, "#85b7c9"); put(mid + 1, 6, "#85b7c9");
  return pixels;
};

export function PixelArtStudio() {
  const [size, setSize] = useState(16);
  const [pixels, setPixels] = useState<Pixel[]>(() => createPixels(16));
  const [color, setColor] = useState(PALETTE[5]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [name, setName] = useState("my-sprite");
  const [zoom, setZoom] = useState(24);
  const [concept, setConcept] = useState("穿橘色防護服、手持維修扳手的年輕工程師");
  const [assetType, setAssetType] = useState("角色");
  const [style, setStyle] = useState("科幻像素遊戲");
  const [pose, setPose] = useState("正面待機");
  const [generating, setGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const filledCount = useMemo(() => pixels.filter(Boolean).length, [pixels]);

  const resize = (nextSize: number) => { setSize(nextSize); setPixels(createPixels(nextSize)); };
  const paint = (index: number) => setPixels((current) => current.map((pixel, i) => i === index ? color : pixel));
  const erase = (index: number) => setPixels((current) => current.map((pixel, i) => i === index ? null : pixel));
  const downloadPng = () => {
    const canvas = canvasRef.current || document.createElement("canvas"); canvas.width = size; canvas.height = size;
    const context = canvas.getContext("2d"); if (!context) return;
    context.clearRect(0, 0, size, size); pixels.forEach((pixel, index) => { if (pixel) { context.fillStyle = pixel; context.fillRect(index % size, Math.floor(index / size), 1, 1); } });
    const link = document.createElement("a"); link.href = canvas.toDataURL("image/png"); link.download = `${name.trim() || "sprite"}.png`; link.click();
  };
  const copyPxl = async () => {
    const used = [...new Set(pixels.filter((pixel): pixel is string => Boolean(pixel)))];
    const keys = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const colorKeys = new Map(used.map((value, index) => [value, keys[index]]));
    const palette = used.map((value, index) => `${keys[index]}: "${value}"`).join(", ");
    const rows = Array.from({ length: size }, (_, y) => pixels.slice(y * size, y * size + size).map((pixel) => pixel ? colorKeys.get(pixel) : ".").join(""));
    const source = `pal({ ${palette} })\n\nsprite("${(name.trim() || "sprite").replace(/[^a-z0-9_-]/gi, "-")}", \`\n${rows.map((row) => `  ${row}`).join("\n")}\`)\n`;
    try { await navigator.clipboard.writeText(source); alert("pxl 程式碼已複製到剪貼簿"); } catch { prompt("複製以下 pxl 程式碼：", source); }
  };
  const generateCharacter = async () => {
    setGenerating(true); setGenerationMessage("");
    try {
      const response = await fetch("/api/pixel-character", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: concept, size, style, pose, assetType }) });
      const result = await response.json() as { name?: string; pixels?: Pixel[]; error?: string };
      if (!response.ok || !result.pixels || result.pixels.length !== size * size) throw new Error(result.error || "角色生成失敗，請再試一次。");
      setPixels(result.pixels); setName(result.name || "generated-character"); setGenerationMessage("角色已生成；你現在可以在畫布上繼續修改。");
    } catch (error) { setGenerationMessage(error instanceof Error ? error.message : "角色生成失敗，請再試一次。"); }
    finally { setGenerating(false); }
  };

  return <main className="pixel-studio">
    <canvas ref={canvasRef} className="pixel-studio-export-canvas" aria-hidden="true" />
    <header className="pixel-studio-header"><div><p>SCI-GAME / PIXEL ASSET STUDIO</p><h1>像素素材工作台</h1><span>直接在格子上畫，完成後可下載 PNG 或複製成 pxl 程式碼。</span></div><nav><a href={import.meta.env.BASE_URL}>返回遊戲</a><a href={`${import.meta.env.BASE_URL}effects`}>特效庫</a></nav></header>
    <section className="pixel-studio-toolbar">
      <label>素材名稱<input value={name} onChange={(event) => setName(event.target.value)} maxLength={32} /></label>
      <label>畫布尺寸<select value={size} onChange={(event) => resize(Number(event.target.value))}><option value={16}>16 × 16</option><option value={24}>24 × 24</option><option value={32}>32 × 32</option></select></label>
      <label>格子大小<input type="range" min="14" max="32" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
      <button type="button" onClick={() => setPixels(createPixels(size))}>清空畫布</button><button type="button" onClick={() => setPixels(shelterTemplate(size))}>載入避難所範本</button>
    </section>
    <section className="pixel-studio-ai">
      <div><p className="pixel-studio-kicker">AI ASSET GENERATOR</p><h2>用一句話生成遊戲素材</h2><span>角色、道具、地圖瓦片、場景物件、特效與圖示都能生成，之後仍可逐格調整。</span></div>
      <div className="pixel-studio-ai-controls"><label>素材類型<select value={assetType} onChange={(event) => setAssetType(event.target.value)}><option>角色</option><option>道具</option><option>地圖瓦片</option><option>場景物件</option><option>特效</option><option>介面圖示</option></select></label><label>素材概念<textarea value={concept} onChange={(event) => setConcept(event.target.value)} maxLength={600} placeholder="例如：戴護目鏡的深海探勘員，藍色潛水裝、拿探照燈" /></label><label>風格<select value={style} onChange={(event) => setStyle(event.target.value)}><option>科幻像素遊戲</option><option>可愛復古 RPG</option><option>暗黑末日風</option></select></label><label>姿勢／構圖<select value={pose} onChange={(event) => setPose(event.target.value)}><option>正面待機</option><option>側面行走</option><option>揮舞武器</option><option>置中單件物品</option><option>可無縫重複</option></select></label><button type="button" className="pixel-studio-generate" disabled={generating || !concept.trim()} onClick={generateCharacter}>{generating ? "生成中…" : "生成素材"}</button></div>
      {generationMessage && <p className="pixel-studio-message" role="status">{generationMessage}</p>}
    </section>
    <div className="pixel-studio-layout">
      <aside className="pixel-studio-panel"><h2>工具與顏色</h2><p className="pixel-studio-tip">左鍵拖曳繪製；右鍵拖曳可擦除。</p><div className="pixel-studio-swatches">{PALETTE.map((swatch) => <button key={swatch} type="button" title={swatch} aria-label={`選擇 ${swatch}`} className={color === swatch ? "selected" : ""} style={{ background: swatch }} onClick={() => setColor(swatch)} />)}</div><label className="pixel-studio-picker">自訂顏色<input type="color" value={color} onChange={(event) => setColor(event.target.value)} /><code>{color}</code></label><div className="pixel-studio-current" style={{ background: color }} /><p>已繪製 <b>{filledCount}</b> / {size * size} 格</p></aside>
      <section className="pixel-studio-canvas-wrap"><div className="pixel-studio-canvas" style={{ gridTemplateColumns: `repeat(${size}, ${zoom}px)` }} onPointerLeave={() => setIsDrawing(false)} onPointerUp={() => setIsDrawing(false)} onContextMenu={(event) => event.preventDefault()}>{pixels.map((pixel, index) => <button key={index} type="button" aria-label={`像素 ${index + 1}`} className="pixel-studio-cell" style={{ width: zoom, height: zoom, backgroundColor: pixel || "transparent" }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setIsDrawing(true); event.button === 2 ? erase(index) : paint(index); }} onPointerEnter={(event) => { if (isDrawing) event.buttons === 2 ? erase(index) : paint(index); }} />)}</div></section>
      <aside className="pixel-studio-panel pixel-studio-export"><h2>輸出素材</h2><p>PNG 可直接用於遊戲；pxl 程式碼可貼進 claude-pxl 後繼續調整或產出多個版本。</p><button type="button" className="pixel-studio-primary" onClick={downloadPng}>下載 PNG</button><button type="button" onClick={copyPxl}>複製 pxl 程式碼</button><div className="pixel-studio-checker"><div style={{ width: size * 6, height: size * 6, display: "grid", gridTemplateColumns: `repeat(${size}, 6px)` }}>{pixels.map((pixel, index) => <i key={index} style={{ background: pixel || "transparent" }} />)}</div></div></aside>
    </div>
  </main>;
}
