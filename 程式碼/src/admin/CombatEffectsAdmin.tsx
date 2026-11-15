import React, { useEffect, useRef, useState } from "react";
import type { CombatEffectAsset, CombatEffectBinding, CombatEffectEditorSettings } from "../config/types";
import { effects as pixelFxEffects } from "../vendor/pixelfx/fx/index.js";
import { actTiming, clearFrame, composite, createFrame, createFx, poseAt } from "../vendor/pixelfx/core/index.js";
import { ENEMY_SPRITE_URLS, ROBOT_BATTLE_SPRITES } from "../data/gameAssetUrls";
import { ROBOT_CONFIG } from "../data/robotConfig";
import { getBossVisualSet } from "../data/bossVisualConfig";
import "./combat-effects-admin.css";

type Part = "attacker" | "defender" | "effect";
const W = 640, H = 320, FPS = 30;
const defaults: CombatEffectEditorSettings = {
  attacker: { x: 125, y: 244, scale: 1 }, defender: { x: 510, y: 244, scale: 1 },
  effect: { x: 320, y: 175, scale: 1 }, releaseFrame: 10, hitFrame: 22, damageFrame: 22, totalFrames: 48,
  muzzle: { x: 30, y: -48 }, impact: { x: 0, y: -42 }, direction: "right", distance: 0, beamMode: "stretch", beamThickness: 20, interrupt: "stop", pierce: false,
};
type FrameKey = { at: number; spriteFrame: number };
const frameAt = (keys: FrameKey[] | undefined, at: number, fallback: number) => [...(keys || [])].sort((a, b) => a.at - b.at).filter((key) => key.at <= at).at(-1)?.spriteFrame ?? fallback;
const setFrameKey = (keys: FrameKey[] | undefined, at: number, spriteFrame: number) => [...(keys || []).filter((key) => key.at !== at), { at, spriteFrame }].sort((a, b) => a.at - b.at);
const readText = (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsText(file); });
const readImage = (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
function parseManifest(value: unknown) {
  const raw = value as { loop_mode?: string; frames?: Array<{ duration?: number | { numerator_ms?: number; denominator?: number }; sheet?: { x?: number; y?: number; width?: number; height?: number }; frame?: { x?: number; y?: number; w?: number; h?: number } }>; meta?: { pixelfx?: { loop?: boolean } } };
  if (!Array.isArray(raw.frames) || !raw.frames.length) throw new Error("JSON 找不到 frames 陣列");
  const frames = raw.frames.map((frame) => { const rect = frame.sheet || frame.frame; const duration = typeof frame.duration === "number" ? frame.duration : (Number(frame.duration?.numerator_ms) || 50) / (Number(frame.duration?.denominator) || 1); return { x: Number(rect?.x) || 0, y: Number(rect?.y) || 0, width: Number(frame.sheet?.width ?? frame.frame?.w) || 0, height: Number(frame.sheet?.height ?? frame.frame?.h) || 0, durationMs: Math.max(16, duration) }; }).filter((frame) => frame.width > 0 && frame.height > 0);
  if (!frames.length) throw new Error("JSON frames 沒有有效的裁切範圍");
  return { loopMode: raw.loop_mode === "loop" || raw.meta?.pixelfx?.loop ? "loop" as const : "none" as const, frames };
}
const getCandidates = () => { try { const ids = JSON.parse(localStorage.getItem("sci_pixelfx_candidates") || "[]"); return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : []; } catch { return []; } };

function Editor({ binding, update, uploadImage, uploadManifest, candidates }: {
  binding: CombatEffectBinding; update: (patch: Partial<CombatEffectBinding>) => void;
  uploadImage: (file?: File) => void; uploadManifest: (file?: File) => void; candidates: string[];
}) {
  const [frame, setFrame] = useState(0), [playing, setPlaying] = useState(true), [selected, setSelected] = useState<Part>("effect"), [imageRevision, setImageRevision] = useState(0);
  const [targetKind, setTargetKind] = useState<"mote" | "clumper" | "stalker" | "boss">("mote");
  const [bossChapter, setBossChapter] = useState(1);
  const [showGuides, setShowGuides] = useState(true);
  const canvas = useRef<HTMLCanvasElement>(null), sprite = useRef<HTMLImageElement | null>(null), beamImage = useRef<HTMLImageElement | null>(null);
  const pngInput = useRef<HTMLInputElement>(null), jsonInput = useRef<HTMLInputElement>(null);
  const settings = { ...defaults, ...binding.editor };
  const mod = (pixelFxEffects as Record<string, any>)[binding.sourceEffectId || ""];
  const timing = mod ? actTiming(mod) : null;
  const asset = binding.layers?.impact || binding.asset;
  const beamAsset = binding.id === "robot_laser" ? binding.layers?.travel : undefined;
  const hasSheet = !mod && !!(asset?.image && asset.manifest?.frames.length);
  const bossVisuals = getBossVisualSet(bossChapter);
  const bossFrames = [bossVisuals.idle, bossVisuals.area, bossVisuals.special, bossVisuals.tracking];
  const attackerSrc = binding.group === "robot" ? ROBOT_CONFIG.c2_932.portrait : bossVisuals.idle;
  const defenderSrc = binding.group === "robot" ? (targetKind === "boss" ? bossVisuals.idle : ENEMY_SPRITE_URLS[targetKind]) : ROBOT_CONFIG.c2_932.portrait;
  const activeSrc = binding.group === "robot" ? ROBOT_BATTLE_SPRITES.action : bossVisuals.special;
  const patchSettings = (part: Part, patch: Partial<CombatEffectEditorSettings[Part]>) => update({ editor: { ...settings, [part]: { ...settings[part], ...patch } } });
  const patchTiming = (patch: Partial<CombatEffectEditorSettings>) => update({ editor: { ...settings, ...patch } });

  useEffect(() => {
    if (!asset?.image) { sprite.current = null; return; }
    const image = new Image(); image.onload = () => { sprite.current = image; setImageRevision((old) => old + 1); }; image.src = asset.image;
    return () => { sprite.current = null; };
  }, [asset?.image]);
  useEffect(() => {
    if (!beamAsset?.image) { beamImage.current = null; return; }
    const image = new Image(); image.onload = () => { beamImage.current = image; setImageRevision((old) => old + 1); }; image.src = beamAsset.image;
    return () => { beamImage.current = null; };
  }, [beamAsset?.image]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0, last = performance.now(), carry = 0;
    const tick = (now: number) => { carry += Math.min(100, now - last); last = now; if (carry >= 1000 / FPS) { const steps = Math.floor(carry / (1000 / FPS)); carry -= steps * (1000 / FPS); setFrame((old) => (old + steps) % (Math.max(2, settings.totalFrames) + 1)); } raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [playing, settings.totalFrames]);

  useEffect(() => {
    const node = canvas.current, ctx = node?.getContext("2d"); if (!node || !ctx) return;
    node.width = W; node.height = H; ctx.clearRect(0, 0, W, H);
    const direction = settings.direction === "left" ? -1 : 1;
    const startX = settings.attacker.x + direction * (settings.muzzle?.x ?? 30);
    const startY = settings.attacker.y + (settings.muzzle?.y ?? -48);
    const endX = settings.defender.x + direction * (settings.distance ?? 0) + (settings.impact?.x ?? 0);
    const endY = settings.defender.y + (settings.impact?.y ?? -42);
    if (binding.id === "robot_laser" && frame >= settings.releaseFrame && frame <= settings.hitFrame && beamAsset?.manifest?.frames.length && beamImage.current) {
      const beamFrame = beamAsset.manifest.frames[frameAt(settings.effectKeys, frame, Math.floor((frame - settings.releaseFrame) / 2) % beamAsset.manifest.frames.length) % beamAsset.manifest.frames.length];
      const dx = endX - startX, dy = endY - startY;
      const grow = Math.min(1, (frame - settings.releaseFrame + 1) / Math.max(1, settings.hitFrame - settings.releaseFrame));
      ctx.save(); ctx.translate(startX, startY); ctx.rotate(Math.atan2(dy, dx)); ctx.imageSmoothingEnabled = false;
      const length = Math.hypot(dx, dy) * grow, thickness = settings.beamThickness ?? 20;
      if (settings.beamMode === "tile") {
        const tileWidth = Math.max(4, beamFrame.width * thickness / beamFrame.height);
        for (let x = 0; x < length; x += tileWidth) ctx.drawImage(beamImage.current, beamFrame.x, beamFrame.y, beamFrame.width, beamFrame.height, x, -thickness / 2, Math.min(tileWidth, length - x), thickness);
      } else ctx.drawImage(beamImage.current, beamFrame.x, beamFrame.y, beamFrame.width, beamFrame.height, 0, -thickness / 2, Math.max(1, length), thickness);
      ctx.restore();
    }
    if (hasSheet && sprite.current && asset?.manifest) {
      const frames = asset.manifest.frames;
      const elapsed = Math.max(0, frame - (binding.id === "robot_laser" ? settings.hitFrame : settings.releaseFrame)) * 1000 / FPS;
      const total = frames.reduce((sum, item) => sum + item.durationMs, 0);
      if (frame >= (binding.id === "robot_laser" ? settings.hitFrame : settings.releaseFrame) && (asset.manifest.loopMode === "loop" || elapsed < total)) {
        let time = total ? elapsed % total : 0, index = 0;
        while (index < frames.length - 1 && time >= frames[index].durationMs) { time -= frames[index].durationMs; index++; }
        index = Math.max(0, Math.min(frames.length - 1, frameAt(settings.effectKeys, frame, index)));
        const f = frames[index], scale = Math.max(.1, settings.effect.scale * binding.scale);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sprite.current, f.x, f.y, f.width, f.height, settings.effect.x - f.width * scale / 2, settings.effect.y - f.height * scale / 2, f.width * scale, f.height * scale);
      }
    } else if (mod && frame >= settings.releaseFrame) {
      const fxTime = (frame - settings.releaseFrame) / FPS;
      const fx = createFx(mod, { x: W / 2, y: H / 2, seed: 1 });
      for (let t = 0; t < fxTime; t += 1 / 30) fx.update(Math.min(1 / 30, fxTime - t));
      const render = createFrame(W, H), image = ctx.createImageData(W, H);
      clearFrame(render); fx.draw(render, "back"); fx.draw(render, "front"); composite(render, image.data, null);
      const offscreen = document.createElement("canvas"); offscreen.width = W; offscreen.height = H;
      offscreen.getContext("2d")?.putImageData(image, 0, 0);
      ctx.imageSmoothingEnabled = false;
      const s = settings.effect.scale * binding.scale;
      ctx.drawImage(offscreen, settings.effect.x - W * s / 2, settings.effect.y - H * s / 2, W * s, H * s);
    }
  }, [frame, mod, hasSheet, asset, beamAsset, settings, binding.id, binding.scale, imageRevision]);

  const poseTrack = mod?.act?.poses;
  const effectSeconds = (frame - settings.releaseFrame) / FPS;
  const pose = poseTrack ? poseAt(poseTrack, effectSeconds) as { x?: number; y?: number; lean?: number; crouch?: number } : null;
  const windup = frame < settings.releaseFrame && frame >= settings.releaseFrame - 7;
  const attack = frame >= settings.releaseFrame && frame < settings.releaseFrame + 9;
  const hit = Math.abs(frame - settings.hitFrame) <= 3;
  const actorX = settings.attacker.x + (pose?.x || 0) * 1.4 + (windup ? -8 : attack ? 10 : 0);
  const actorY = settings.attacker.y + (pose?.y || 0) * 1.4 + (pose?.crouch || 0) * 0.3;
  const direction = settings.direction === "left" ? -1 : 1;
  const targetX = settings.defender.x + direction * (settings.distance ?? 0) + (hit ? 8 * direction : 0);
  const actorSpriteFrame = frameAt(settings.actorKeys, frame, attack ? (binding.group === "boss" ? 2 : binding.id.includes("laser") ? 2 : binding.id.includes("punch") ? 1 : 0) : 0);
  const targetSpriteFrame = frameAt(settings.targetKeys, frame, hit ? (binding.group === "robot" && targetKind === "boss" ? 2 : 0) : 0);
  const robotActionIndex = Math.max(0, Math.min(3, actorSpriteFrame));
  const actorLabel = binding.group === "robot" ? "C2-932" : "Boss";
  const defenderLabel = binding.group === "robot" ? (targetKind === "boss" ? "Boss" : targetKind === "mote" ? "水母敵人" : targetKind === "clumper" ? "球形敵人" : "幽靈敵人") : "C2-932";
  const pointerStart = useRef<{ part: Part; x: number; y: number; baseX: number; baseY: number } | null>(null);
  const anchorStart = useRef<{ anchor: "muzzle" | "impact"; x: number; y: number; baseX: number; baseY: number } | null>(null);
  const onPointerDown = (event: React.PointerEvent, part: Part) => {
    event.preventDefault(); setPlaying(false); setSelected(part);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    pointerStart.current = { part, x: event.clientX, y: event.clientY, baseX: settings[part].x, baseY: settings[part].y };
  };
  const onPointerMove = (event: React.PointerEvent) => {
    const start = pointerStart.current; if (!start) return;
    const rect = (event.currentTarget.closest(".combat-editor-stage") as HTMLElement)?.getBoundingClientRect(); if (!rect) return;
    patchSettings(start.part, { x: Math.round(start.baseX + (event.clientX - start.x) * W / rect.width), y: Math.round(start.baseY + (event.clientY - start.y) * H / rect.height) });
  };
  const imageStyle = (part: "attacker" | "defender", x: number, y: number): React.CSSProperties => ({ left: `${x / W * 100}%`, top: `${y / H * 100}%`, width: `${(part === "attacker" ? 108 : 104) * settings[part].scale / W * 100}%` });
  const muzzleX = settings.attacker.x + direction * (settings.muzzle?.x ?? 30), muzzleY = settings.attacker.y + (settings.muzzle?.y ?? -48);
  const impactX = targetX + (settings.impact?.x ?? 0), impactY = settings.defender.y + (settings.impact?.y ?? -42);
  const moveAnchor = (event: React.PointerEvent) => {
    const start = anchorStart.current; if (!start) return;
    const rect = (event.currentTarget.closest(".combat-editor-stage") as HTMLElement)?.getBoundingClientRect(); if (!rect) return;
    patchTiming({ [start.anchor]: { x: Math.round(start.baseX + (event.clientX - start.x) * W / rect.width * (start.anchor === "muzzle" ? direction : 1)), y: Math.round(start.baseY + (event.clientY - start.y) * H / rect.height) } });
  };
  return <div className="combat-editor">
    <div className="combat-editor-top">
      <label>PixelFX 候選特效<select value={binding.sourceEffectId || ""} onChange={(e) => update({ sourceEffectId: e.target.value || undefined })}><option value="">未選擇</option>{candidates.map((id) => <option key={id} value={id}>{id}</option>)}</select></label>
      {binding.group === "robot" && <label>受擊角色<select value={targetKind} onChange={(e) => setTargetKind(e.target.value as "mote" | "clumper" | "stalker" | "boss")}><option value="mote">水母敵人</option><option value="clumper">球形敵人</option><option value="stalker">幽靈敵人</option><option value="boss">Boss</option></select></label>}
      {(binding.group === "boss" || targetKind === "boss") && <label>Boss 章節<select value={bossChapter} onChange={(e) => setBossChapter(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6].map((chapter) => <option key={chapter} value={chapter}>第 {chapter} 章</option>)}</select></label>}
    </div>
    <div className="combat-editor-stage">
      <div className="combat-editor-ground" />
      {binding.group === "robot" ? <div role="img" aria-label={actorLabel} className={`combat-editor-actor combat-editor-sprite ${selected === "attacker" ? "selected" : ""}`} style={{ ...imageStyle("attacker", actorX, actorY), backgroundImage: `url("${activeSrc}")`, backgroundPosition: `${robotActionIndex * 100 / 3}% 50%`, transform: `translate(-50%, -100%) scaleX(${direction}) rotate(${(pose?.lean || 0) * 0.3}deg)` }} onPointerDown={(e) => onPointerDown(e, "attacker")} onPointerMove={onPointerMove} onPointerUp={() => { pointerStart.current = null; }} /> : <img className={`combat-editor-actor ${selected === "attacker" ? "selected" : ""}`} src={bossFrames[Math.max(0, Math.min(3, actorSpriteFrame))] || attackerSrc} alt={actorLabel} style={{ ...imageStyle("attacker", actorX, actorY), transform: `translate(-50%, -100%) scaleX(${direction})` }} onPointerDown={(e) => onPointerDown(e, "attacker")} onPointerMove={onPointerMove} onPointerUp={() => { pointerStart.current = null; }} />}
      {binding.group === "boss" ? <div role="img" aria-label={defenderLabel} className={`combat-editor-actor combat-editor-sprite ${selected === "defender" ? "selected" : ""}`} style={{ ...imageStyle("defender", targetX, settings.defender.y), backgroundImage: `url("${ROBOT_BATTLE_SPRITES.action}")`, backgroundPosition: `${Math.max(0, Math.min(3, targetSpriteFrame)) * 100 / 3}% 50%`, transform: `translate(-50%, -100%) scaleX(${-direction}) ${hit ? "rotate(7deg)" : ""}` }} onPointerDown={(e) => onPointerDown(e, "defender")} onPointerMove={onPointerMove} onPointerUp={() => { pointerStart.current = null; }} /> : <img className={`combat-editor-actor ${selected === "defender" ? "selected" : ""}`} src={targetKind === "boss" ? bossFrames[Math.max(0, Math.min(3, targetSpriteFrame))] : defenderSrc} alt={defenderLabel} style={{ ...imageStyle("defender", targetX, settings.defender.y + (targetKind !== "boss" ? Math.sin(frame * .08 + settings.defender.x * .01) * 2 : 0)), transform: `translate(-50%, -100%) scaleX(${-direction}) ${hit ? "rotate(7deg)" : ""}`, filter: hit && targetKind !== "boss" ? "brightness(0) invert(1)" : undefined }} onPointerDown={(e) => onPointerDown(e, "defender")} onPointerMove={onPointerMove} onPointerUp={() => { pointerStart.current = null; }} />}
      <canvas ref={canvas} className="combat-editor-fx" aria-label="特效畫面" />
      <button type="button" className={`combat-editor-handle ${selected === "effect" ? "selected" : ""}`} style={{ left: `${settings.effect.x / W * 100}%`, top: `${settings.effect.y / H * 100}%` }} onPointerDown={(e) => onPointerDown(e, "effect")} onPointerMove={onPointerMove} onPointerUp={() => { pointerStart.current = null; }} aria-label="拖曳特效位置">✥</button>
      {binding.id === "robot_laser" && <>
        <button type="button" className="combat-editor-anchor" style={{ left: `${muzzleX / W * 100}%`, top: `${muzzleY / H * 100}%` }} onPointerDown={(e) => { setPlaying(false); e.currentTarget.setPointerCapture(e.pointerId); anchorStart.current = { anchor: "muzzle", x: e.clientX, y: e.clientY, baseX: settings.muzzle?.x ?? 30, baseY: settings.muzzle?.y ?? -48 }; }} onPointerMove={moveAnchor} onPointerUp={() => { anchorStart.current = null; }}>發</button>
        <button type="button" className="combat-editor-anchor" style={{ left: `${impactX / W * 100}%`, top: `${impactY / H * 100}%` }} onPointerDown={(e) => { setPlaying(false); e.currentTarget.setPointerCapture(e.pointerId); anchorStart.current = { anchor: "impact", x: e.clientX, y: e.clientY, baseX: settings.impact?.x ?? 0, baseY: settings.impact?.y ?? -42 }; }} onPointerMove={moveAnchor} onPointerUp={() => { anchorStart.current = null; }}>中</button>
      </>}
      {showGuides && <><span className="combat-editor-name" style={{ left: `${settings.attacker.x / W * 100}%` }}>{actorLabel}</span><span className="combat-editor-name" style={{ left: `${settings.defender.x / W * 100}%` }}>{defenderLabel}</span></>}
    </div>
    <div className="combat-editor-play"><button type="button" onClick={() => setPlaying((old) => !old)}>{playing ? "暫停" : "播放（循環）"}</button><button type="button" onClick={() => { setFrame(0); setPlaying(true); }}>從頭播放</button><button type="button" onClick={() => { setPlaying(false); setFrame((old) => Math.max(0, old - 1)); }}>上一格</button><button type="button" onClick={() => { setPlaying(false); setFrame((old) => Math.min(settings.totalFrames, old + 1)); }}>下一格</button><label><input type="checkbox" checked={showGuides} onChange={(e) => setShowGuides(e.target.checked)} />顯示標示</label><strong>影格 {frame} / {settings.totalFrames}</strong></div>
    <div className="combat-editor-timeline"><input type="range" min="0" max={settings.totalFrames} value={Math.min(frame, settings.totalFrames)} onChange={(e) => { setPlaying(false); setFrame(Number(e.target.value)); }} /><div className="combat-editor-markers"><span>0 起始</span><span>出手 {settings.releaseFrame}</span><span>命中 {settings.hitFrame}</span><span>傷害 {settings.damageFrame ?? settings.hitFrame}</span><span>{settings.totalFrames} 結束</span></div></div>
    <div className="combat-editor-tracks">{([
      { label: "攻擊方影格", key: "actorKeys" as const, value: actorSpriteFrame, max: 3 },
      { label: "特效影格", key: "effectKeys" as const, value: frameAt(settings.effectKeys, frame, 0), max: Math.max(0, (binding.id === "robot_laser" && frame < settings.hitFrame ? beamAsset?.manifest?.frames.length : asset?.manifest?.frames.length || 1)! - 1) },
      { label: "受擊方影格", key: "targetKeys" as const, value: targetSpriteFrame, max: binding.group === "boss" || targetKind === "boss" ? 3 : 0 },
    ]).map((track) => <div key={track.key}><strong>{track.label}</strong><span>目前第 {track.value + 1} 格</span><label>指定此時間點的圖片影格 <input type="number" min="1" max={track.max + 1} value={track.value + 1} onChange={(e) => { setPlaying(false); patchTiming({ [track.key]: setFrameKey(settings[track.key], frame, Math.max(0, Math.min(track.max, Number(e.target.value) - 1 || 0))) }); }} /></label><small>{(settings[track.key] || []).map((key) => `${key.at}→${key.spriteFrame + 1}`).join("、") || "使用預設時機"}{track.max === 0 ? "；此角色目前只有單張可用圖片" : ""}</small></div>)}</div>
    <div className="combat-editor-controls">
      <fieldset><legend>選取與拖曳</legend><div className="combat-editor-parts">{(["attacker", "effect", "defender"] as Part[]).map((part) => <button type="button" key={part} className={selected === part ? "active" : ""} onClick={() => setSelected(part)}>{part === "attacker" ? "攻擊方" : part === "defender" ? "受擊方" : "特效"}</button>)}</div><label>X <input type="number" value={settings[selected].x} onChange={(e) => patchSettings(selected, { x: Number(e.target.value) || 0 })} /></label><label>Y <input type="number" value={settings[selected].y} onChange={(e) => patchSettings(selected, { y: Number(e.target.value) || 0 })} /></label><label>大小 <input type="number" min=".1" max="5" step=".1" value={settings[selected].scale} onChange={(e) => patchSettings(selected, { scale: Math.max(.1, Math.min(5, Number(e.target.value) || 1)) })} /></label><button type="button" onClick={() => patchSettings(selected, defaults[selected])}>重設這一層</button></fieldset>
      <fieldset><legend>動作時間（30 FPS）</legend><label>出手格 <input type="number" min="0" max={settings.totalFrames} value={settings.releaseFrame} onChange={(e) => patchTiming({ releaseFrame: Math.max(0, Math.min(settings.totalFrames, Number(e.target.value) || 0)) })} /></label><label>命中格 <input type="number" min="0" max={settings.totalFrames} value={settings.hitFrame} onChange={(e) => patchTiming({ hitFrame: Math.max(0, Math.min(settings.totalFrames, Number(e.target.value) || 0)) })} /></label><label>傷害參考格 <input type="number" min="0" max={settings.totalFrames} value={settings.damageFrame ?? settings.hitFrame} onChange={(e) => patchTiming({ damageFrame: Math.max(0, Math.min(settings.totalFrames, Number(e.target.value) || 0)) })} /></label><label>總格數 <input type="number" min="2" max="300" value={settings.totalFrames} onChange={(e) => patchTiming({ totalFrames: Math.max(2, Math.min(300, Number(e.target.value) || 48)) })} /></label></fieldset>
      <fieldset><legend>場景與播放</legend><label>方向 <select value={settings.direction || "right"} onChange={(e) => patchTiming({ direction: e.target.value as "right" | "left" })}><option value="right">朝右</option><option value="left">朝左</option></select></label><label>目標距離 <input type="number" value={settings.distance ?? 0} onChange={(e) => patchTiming({ distance: Number(e.target.value) || 0 })} /></label><label>中斷時 <select value={settings.interrupt || "stop"} onChange={(e) => patchTiming({ interrupt: e.target.value as "stop" | "finish" })}><option value="stop">立即停止</option><option value="finish">播到結束</option></select></label><label className="combat-editor-check"><input type="checkbox" checked={!!settings.pierce} onChange={(e) => patchTiming({ pierce: e.target.checked })} />穿透多個目標</label></fieldset>
      {binding.id === "robot_laser" && <fieldset><legend>雷射與錨點</legend><label>光束接法 <select value={settings.beamMode || "stretch"} onChange={(e) => patchTiming({ beamMode: e.target.value as "stretch" | "tile" })}><option value="stretch">拉伸中段</option><option value="tile">重複中段</option></select></label><label>粗細 <input type="number" min="2" max="100" value={settings.beamThickness ?? 20} onChange={(e) => patchTiming({ beamThickness: Math.max(2, Number(e.target.value) || 20) })} /></label><label>發射 X <input type="number" value={settings.muzzle?.x ?? 30} onChange={(e) => patchTiming({ muzzle: { ...(settings.muzzle || defaults.muzzle!), x: Number(e.target.value) || 0 } })} /></label><label>發射 Y <input type="number" value={settings.muzzle?.y ?? -48} onChange={(e) => patchTiming({ muzzle: { ...(settings.muzzle || defaults.muzzle!), y: Number(e.target.value) || 0 } })} /></label><label>命中 X <input type="number" value={settings.impact?.x ?? 0} onChange={(e) => patchTiming({ impact: { ...(settings.impact || defaults.impact!), x: Number(e.target.value) || 0 } })} /></label><label>命中 Y <input type="number" value={settings.impact?.y ?? -42} onChange={(e) => patchTiming({ impact: { ...(settings.impact || defaults.impact!), y: Number(e.target.value) || 0 } })} /></label></fieldset>}
    </div>
    <p className="admin-card-event-note">機器人使用遊戲的四格動作圖；Boss 的第 1–4 格分別是待機、範圍、特殊、追蹤狀態。一般敵人沿用遊戲的漂浮與受擊閃白，並非四張不同圖片。雷射錨點、光束長度與命中切換會套用到 Boss 戰雷射；傷害參考格、穿透及中斷設定尚未改變遊戲判定。{timing ? `此 PixelFX 有動作資料：${timing.poses.length} 個姿勢節點、${timing.hits.length} 次命中。` : ""}</p>
    <div className="combat-editor-uploads"><button type="button" className="admin-add" onClick={() => pngInput.current?.click()}>上傳 PNG</button><button type="button" className="admin-add" onClick={() => jsonInput.current?.click()}>上傳 JSON</button><small>PNG：{asset?.imageName || "未上傳"}　JSON：{asset?.manifestName || "未上傳"}</small><input ref={pngInput} hidden type="file" accept="image/png" onChange={(e) => uploadImage(e.target.files?.[0])} /><input ref={jsonInput} hidden type="file" accept="application/json,.json" onChange={(e) => uploadManifest(e.target.files?.[0])} /></div>
  </div>;
}

export function CombatEffectsAdmin({ effects, onChange }: { effects: CombatEffectBinding[]; onChange: (effects: CombatEffectBinding[]) => void }) {
  const [notice, setNotice] = useState("調整後請用後台的「儲存到 Firebase」保存設定。");
  const [candidates, setCandidates] = useState<string[]>(getCandidates);
  const [opened, setOpened] = useState<string | null>("robot_laser");
  useEffect(() => { const refresh = () => setCandidates(getCandidates()); window.addEventListener("focus", refresh); window.addEventListener("storage", refresh); return () => { window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); }; }, []);
  const update = (id: string, patch: Partial<CombatEffectBinding>) => onChange(effects.map((effect) => effect.id === id ? { ...effect, ...patch } : effect));
  const uploadImage = async (effect: CombatEffectBinding, file?: File) => { if (!file) return; if (file.type !== "image/png") { setNotice("請選擇 PNG。"); return; } if (file.size > 900_000) { setNotice("PNG 請小於 900 KB。"); return; } const image = await readImage(file); const impact = { ...(effect.layers?.impact || effect.asset), image, imageName: file.name } as CombatEffectAsset; update(effect.id, { asset: impact, layers: { ...effect.layers, impact } }); setNotice(`${effect.label}：PNG 已載入。`); };
  const uploadManifest = async (effect: CombatEffectBinding, file?: File) => { if (!file) return; try { const manifest = parseManifest(JSON.parse(await readText(file))); const impact = { ...(effect.layers?.impact || effect.asset), image: effect.layers?.impact?.image || effect.asset?.image || "", manifest, manifestName: file.name } as CombatEffectAsset; update(effect.id, { asset: impact, layers: { ...effect.layers, impact } }); setNotice(`${effect.label}：已載入 ${manifest.frames.length} 格。`); } catch (error) { setNotice(error instanceof Error ? error.message : "JSON 無法解析"); } };
  return <div className="admin-stack"><p className="admin-card-event-note">在戰鬥畫面拖曳攻擊方、特效或受擊方；用時間軸逐格檢視並調整出手和命中時機。候選 PixelFX 可直接預覽。</p><p className="admin-card-event-note">{notice}</p>{(["robot", "boss"] as const).map((group) => <section className="admin-subsection" key={group}><h3>{group === "robot" ? "C2-932 機器人技能" : "Boss 技能"}</h3><div className="admin-stack">{effects.filter((effect) => effect.group === group).map((effect) => <details className="admin-record" key={effect.id} open={opened === effect.id} onToggle={(e) => { if (e.currentTarget.open) setOpened(effect.id); else if (opened === effect.id) setOpened(null); }}><summary><b>{effect.label}</b><span>{effect.sourceEffectId ? `候選：${effect.sourceEffectId}` : effect.asset?.manifest?.frames.length ? `${effect.asset.manifest.frames.length} 格｜${effect.asset.imageName || "PNG"}` : "尚未選擇特效"}</span></summary>{opened === effect.id && <Editor binding={effect} update={(patch) => update(effect.id, patch)} uploadImage={(file) => uploadImage(effect, file)} uploadManifest={(file) => uploadManifest(effect, file)} candidates={candidates} />}</details>)}</div></section>)}</div>;
}
