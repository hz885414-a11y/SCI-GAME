import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircuitBoard } from "./CircuitBoard";
import { clearNoteAdjustments, getRhythmChart, getSourceNoteCount, saveNoteAdjustment } from "../rhythm/charts";
import { RhythmAudioController } from "../rhythm/audioController";
import { pauseBackgroundMusicForActivity, playSound, resumeBackgroundMusicAfterActivity } from "../utils/audio";
import { applyJudgement, calculateResult, judgementForDelta } from "../rhythm/resultCalculator";
import { createEmptyScore, RHYTHM_KEY_LABELS, RHYTHM_LANES, RHYTHM_RULES, type RhythmChart, type RhythmDifficulty, type RhythmJudgement, type RhythmLane, type RhythmNote, type RhythmResult, type RhythmScore } from "../rhythm/types";
import { useRhythmInput } from "../rhythm/useRhythmInput";
import { ChevronDown, ChevronUp, Pause, SlidersHorizontal, X, Zap } from "lucide-react";

type Phase = "select" | "countdown" | "playing" | "paused" | "result";
type PlayMode = "preview" | "full";
type NoteState = { started?: boolean; judged?: boolean; held?: boolean; lanes?: Set<RhythmLane> };

interface RhythmSolderingGameProps {
  equipmentName: string;
  onCompleted: () => void;
  onCancel: () => void;
}

const CALIBRATION_KEY = "c2_932_rhythm_audio_calibration_ms";
const PREVIEW_SECONDS = 15;
const JUDGEMENT_COLOR: Record<RhythmJudgement, string> = { perfect: "text-amber-200", great: "text-emerald-300", good: "text-cyan-300", miss: "text-rose-400" };
const JUDGEMENT_POP_STYLE: Record<RhythmJudgement, string> = {
  perfect: "text-amber-200 drop-shadow-[0_0_16px_#fbbf24]",
  great: "text-emerald-200 drop-shadow-[0_0_14px_#34d399]",
  good: "text-cyan-100 drop-shadow-[0_0_14px_#22d3ee]",
  miss: "text-rose-300 drop-shadow-[0_0_14px_#fb7185]",
};
const DEFAULT_TIMING = { perfectMs: RHYTHM_RULES.windowsMs.perfect, greatMs: RHYTHM_RULES.windowsMs.great, goodMs: RHYTHM_RULES.windowsMs.good };

function readCalibration() {
  try { return Math.max(-300, Math.min(300, Number(localStorage.getItem(CALIBRATION_KEY) ?? 0) || 0)); } catch { return 0; }
}

function NoteEditor({ difficulty, revision, onChanged }: { difficulty: RhythmDifficulty; revision: number; onChanged: () => void }) {
  const [showAll, setShowAll] = useState(false);
  const chart = useMemo(() => getRhythmChart(difficulty), [difficulty, revision]);
  const notes = showAll ? chart.notes : chart.notes.filter((note) => note.time <= PREVIEW_SECONDS);
  const save = (note: RhythmNote, patch: { timeMs?: number; lane?: RhythmLane; lanes?: RhythmLane[] }) => {
    saveNoteAdjustment(difficulty, note.id, {
      timeMs: Math.round(note.time * 1000),
      lane: note.lane,
      ...(note.type === "double" ? { lanes: note.lanes } : {}),
      ...patch,
    });
    onChanged();
  };

  return <div className="mt-3 border-2 border-cyan-900 bg-[#061416] p-2 text-left shadow-[inset_0_0_0_2px_#020909]">
    <div className="flex items-center justify-between gap-2"><p className="font-mono text-[10px] text-cyan-300">譜面校正 // timeMs 是音檔起點的絕對時間</p><button type="button" onClick={() => setShowAll((current) => !current)} className="border border-cyan-800 bg-black px-2 py-1 text-[10px] text-cyan-100">{showAll ? "僅前 15 秒" : "顯示全部"}</button></div>
    <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">來源 offset {chart.sourceOffsetMs ?? 0}ms 僅供格線參考，不會加到音符或判定。修改保存在此裝置。</p>
    <div className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1">
      {notes.map((note) => <div key={note.id} className="grid grid-cols-[58px_1fr_52px] items-center gap-1 border border-cyan-950 bg-black/70 p-1 text-[10px]">
        <span className="font-mono text-zinc-500">{note.id.replace(`${difficulty}_`, "#")}</span>
        <input aria-label={`${note.id} 時間毫秒`} type="number" step="1" min="0" defaultValue={Math.round(note.time * 1000)} onBlur={(event) => save(note, { timeMs: Math.max(0, Number(event.currentTarget.value) || 0) })} className="min-w-0 border border-cyan-900 bg-[#02090b] px-1 py-1 font-mono text-cyan-200" />
        {note.type === "double" ? <span className="flex gap-1">{[0, 1].map((index) => <select key={index} aria-label={`${note.id} 軌道 ${index + 1}`} value={note.lanes?.[index] ?? "A"} onChange={(event) => { const lanes = [...(note.lanes ?? ["A", "B"])] as RhythmLane[]; lanes[index] = event.target.value as RhythmLane; save(note, { lanes }); }} className="w-6 border border-cyan-900 bg-black px-0 py-1 text-cyan-200"><option>A</option><option>B</option><option>C</option><option>D</option></select>)}</span> : <select aria-label={`${note.id} 軌道`} value={note.lane} onChange={(event) => save(note, { lane: event.target.value as RhythmLane })} className="border border-cyan-900 bg-black py-1 text-center text-cyan-200"><option>A</option><option>B</option><option>C</option><option>D</option></select>}
      </div>)}
    </div>
    <button type="button" onClick={() => { clearNoteAdjustments(difficulty); onChanged(); }} className="mt-2 text-[10px] text-rose-300 underline">還原此難度的原始譜面</button>
  </div>;
}

function PixelHeader({ equipmentName, onClose, onPause, playing }: { equipmentName: string; onClose: () => void; onPause?: () => void; playing: boolean }) {
  return <header className="shrink-0 border-b-2 border-[#1a4c55] bg-[#041215] shadow-[inset_0_-2px_0_#010506]">
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      <div className="min-w-0"><p className="font-mono text-[8px] tracking-[.2em] text-cyan-400">RHYTHM SOLDERING // PCB-01</p><h2 className="truncate font-mono text-xs font-black text-amber-100 sm:text-sm">{equipmentName}</h2></div>
      <div className="flex shrink-0 gap-1">{playing && <button type="button" onClick={onPause} className="grid h-8 w-8 place-items-center border-2 border-cyan-800 bg-[#08262a] text-cyan-100" aria-label="暫停焊接"><Pause className="h-4 w-4" /></button>}<button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center border-2 border-rose-950 bg-[#260b11] text-rose-200" aria-label="離開改裝"><X className="h-4 w-4" /></button></div>
    </div>
  </header>;
}

export function RhythmSolderingGame({ equipmentName, onCompleted, onCancel }: RhythmSolderingGameProps) {
  const [difficulty, setDifficulty] = useState<RhythmDifficulty>("normal");
  const [phase, setPhase] = useState<Phase>("select");
  const [countdown, setCountdown] = useState(3);
  const [now, setNow] = useState(0);
  const [score, setScore] = useState<RhythmScore>(createEmptyScore);
  const [lastJudgement, setLastJudgement] = useState<RhythmJudgement | null>(null);
  const [result, setResult] = useState<RhythmResult | null>(null);
  const [litLanes, setLitLanes] = useState<Set<RhythmLane>>(new Set());
  const [unstable, setUnstable] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>("full");
  const [calibrationMs, setCalibrationMs] = useState(readCalibration);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorRevision, setEditorRevision] = useState(0);
  const chartRef = useRef<RhythmChart>(getRhythmChart("normal"));
  const engineRef = useRef(new RhythmAudioController());
  const frameRef = useRef<number | null>(null);
  const statesRef = useRef<Map<string, NoteState>>(new Map());
  const scoreRef = useRef<RhythmScore>(createEmptyScore());
  const heldLanesRef = useRef(new Set<RhythmLane>());
  const completedRef = useRef(false);
  const lastUiTick = useRef(0);

  useEffect(() => { pauseBackgroundMusicForActivity(); return () => resumeBackgroundMusicAfterActivity(); }, []);

  const updateCalibration = (value: number) => {
    const next = Math.max(-300, Math.min(300, value));
    setCalibrationMs(next);
    localStorage.setItem(CALIBRATION_KEY, String(next));
  };

  const register = useCallback((judgement: RhythmJudgement) => {
    scoreRef.current = applyJudgement(scoreRef.current, judgement);
    setScore(scoreRef.current);
    setLastJudgement(judgement);
    window.setTimeout(() => setLastJudgement((current) => current === judgement ? null : current), 480);
    if (judgement === "miss") { setUnstable(true); window.setTimeout(() => setUnstable(false), 180); }
  }, []);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    engineRef.current.stop();
    const chart = chartRef.current;
    chart.notes.forEach((entry) => {
      if (!statesRef.current.get(entry.id)?.judged) { statesRef.current.set(entry.id, { judged: true }); register("miss"); }
    });
    window.setTimeout(() => { setResult(calculateResult(scoreRef.current, chart.notes.length)); setPhase("result"); }, 0);
  }, [register]);

  const inputDown = useCallback((lane: RhythmLane) => {
    if (phase !== "playing") return;
    const time = engineRef.current.getTime() + calibrationMs / 1000;
    const timing = chartRef.current.timing ?? DEFAULT_TIMING;
    heldLanesRef.current.add(lane); setLitLanes(new Set(heldLanesRef.current));
    const candidates = chartRef.current.notes.filter((entry) => {
      const state = statesRef.current.get(entry.id);
      const lanes = entry.type === "double" ? entry.lanes ?? [] : [entry.lane];
      return !state?.judged && lanes.includes(lane) && Math.abs(time - entry.time) <= timing.goodMs / 1000;
    }).sort((a, b) => Math.abs(time - a.time) - Math.abs(time - b.time));
    const entry = candidates[0]; if (!entry) return;
    const state = statesRef.current.get(entry.id) ?? {};
    if (entry.type === "double") {
      const pressed = state.lanes ?? new Set<RhythmLane>(); pressed.add(lane); state.lanes = pressed; statesRef.current.set(entry.id, state);
      if ((entry.lanes ?? []).every((required) => pressed.has(required))) { state.judged = true; register(judgementForDelta((time - entry.time) * 1000, timing)); }
      return;
    }
    if (entry.type === "hold") { state.started = true; state.held = true; statesRef.current.set(entry.id, state); return; }
    state.judged = true; statesRef.current.set(entry.id, state); register(judgementForDelta((time - entry.time) * 1000, timing));
  }, [calibrationMs, phase, register]);

  const inputUp = useCallback((lane: RhythmLane) => {
    heldLanesRef.current.delete(lane); setLitLanes(new Set(heldLanesRef.current));
    if (phase !== "playing") return;
    chartRef.current.notes.forEach((entry) => {
      if (entry.type !== "hold" || entry.lane !== lane) return;
      const state = statesRef.current.get(entry.id);
      if (state?.started && !state.judged && engineRef.current.getTime() < entry.time + (entry.duration ?? 0) - 0.04) { state.judged = true; register("miss"); }
    });
  }, [phase, register]);

  useRhythmInput(phase === "playing", inputDown, inputUp);

  const start = useCallback(async (mode: PlayMode) => {
    const sourceChart = getRhythmChart(difficulty);
    chartRef.current = mode === "preview"
      ? { ...sourceChart, id: `${sourceChart.id}-preview`, duration: PREVIEW_SECONDS, notes: sourceChart.notes.filter((entry) => entry.time <= PREVIEW_SECONDS) }
      : sourceChart;
    statesRef.current = new Map(); scoreRef.current = createEmptyScore(); completedRef.current = false; heldLanesRef.current = new Set();
    engineRef.current.prime();
    setPlayMode(mode); setScore(scoreRef.current); setNow(0); setResult(null); setLastJudgement(null); setCountdown(3); setPhase("countdown");
    playSound("countdown");
    for (const remaining of [2, 1, 0]) await new Promise<void>((resolve) => window.setTimeout(() => { setCountdown(remaining); playSound(remaining === 0 ? "countdownGo" : "countdown"); resolve(); }, 1000));
    await engineRef.current.start(); setPhase("playing");
  }, [difficulty]);

  const pauseGame = useCallback(() => {
    if (phase !== "playing") return;
    engineRef.current.stop();
    setPhase("paused");
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const animate = (stamp: number) => {
      const time = engineRef.current.getTime();
      chartRef.current.notes.forEach((entry) => {
        const state = statesRef.current.get(entry.id); if (state?.judged) return;
        const timing = chartRef.current.timing ?? DEFAULT_TIMING;
        if (entry.type === "hold" && state?.started && state.held && heldLanesRef.current.has(entry.lane) && time >= entry.time + (entry.duration ?? 0)) { state.judged = true; register(judgementForDelta((time - (entry.time + (entry.duration ?? 0))) * 1000, timing)); return; }
        const expiry = entry.type === "hold" && state?.started ? entry.time + (entry.duration ?? 0) + timing.goodMs / 1000 : entry.time + timing.goodMs / 1000;
        if (time > expiry) { statesRef.current.set(entry.id, { ...state, judged: true }); register("miss"); }
      });
      if (stamp - lastUiTick.current > 45) { lastUiTick.current = stamp; setNow(time); }
      if (time >= chartRef.current.duration) finish(); else frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    const hidden = () => { if (document.hidden) { engineRef.current.stop(); setPhase("paused"); } };
    document.addEventListener("visibilitychange", hidden);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); document.removeEventListener("visibilitychange", hidden); };
  }, [phase, finish, register]);

  useEffect(() => () => engineRef.current.stop(), []);

  const chart = chartRef.current;
  const accuracy = calculateResult(score, Math.max(chart.notes.length, 1)).accuracy;
  const isPlaying = phase === "playing";

  return createPortal(<div className="fixed inset-0 z-[150] flex items-center justify-center overflow-hidden p-0 text-zinc-100 selection:bg-cyan-400/40" style={{ zIndex: 9999, touchAction: "none", backgroundColor: "#010607", paddingTop: "env(safe-area-inset-top)", paddingRight: "env(safe-area-inset-right)", paddingBottom: "env(safe-area-inset-bottom)", paddingLeft: "env(safe-area-inset-left)" }} role="dialog" aria-modal="true" aria-label="電路板節奏焊接">
    <div className="relative flex shrink-0 flex-col overflow-hidden border-x-2 shadow-[0_0_0_3px_#000,0_0_60px_rgba(20,184,166,.2)]" style={{ width: "min(100vw, 56.25dvh, 540px)", height: "min(177.777vw, 100dvh, 960px)", backgroundColor: "#020b0d", borderColor: "#1e4d55" }}>
      <PixelHeader equipmentName={equipmentName} onClose={onCancel} onPause={pauseGame} playing={isPlaying} />
      {phase === "select" && <section className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgba(14,116,144,.24),transparent_45%),#020b0d] px-5 py-4 text-center"><Zap className="mx-auto h-12 w-12 text-amber-300 drop-shadow-[0_0_12px_#fbbf24]" /><p className="mt-3 font-mono text-[10px] tracking-[.24em] text-cyan-400">PCB RHYTHM PROTOCOL</p><h3 className="mt-1 font-pixel text-2xl font-black text-amber-100">焊接大作戰！</h3><p className="mt-3 text-sm leading-relaxed text-cyan-100/80">每個小細節都不能馬虎<br />但照著自己的節奏焊接也是很重要的呢！</p><div className="mt-6 grid grid-cols-3 gap-2">{(["easy", "normal", "hard"] as RhythmDifficulty[]).map((item) => <button key={item} type="button" onClick={() => setDifficulty(item)} className={`min-h-16 border-2 font-pixel font-black ${difficulty === item ? "border-amber-300 bg-amber-400/20 text-amber-100 shadow-[inset_0_0_0_2px_#5b3b08]" : "border-cyan-950 bg-[#031114] text-cyan-700"}`}>{item.toUpperCase()}<small className="mt-1 block text-[9px]">{getSourceNoteCount(item)} NOTES</small></button>)}</div><div className="mt-4 border-2 border-cyan-950 bg-black/65 p-3 text-left"><div className="flex items-center justify-between gap-3"><label className="font-mono text-xs font-bold text-cyan-200">音訊延遲校正 <b className="text-amber-300">{calibrationMs > 0 ? "+" : ""}{calibrationMs}ms</b></label><button type="button" onClick={() => updateCalibration(0)} className="font-mono text-[10px] text-cyan-400 underline">歸零</button></div><input aria-label="音訊延遲校正" type="range" min="-300" max="300" step="5" value={calibrationMs} onChange={(event) => updateCalibration(Number(event.target.value))} className="mt-2 w-full accent-amber-400" /><p className="mt-1 font-mono text-[9px] leading-relaxed text-zinc-500">只校正玩家輸入，不改動譜面 timeMs 或來源 offset。</p></div><button type="button" onClick={() => void start("full")} className="mt-5 min-h-14 w-full border-2 border-amber-100 bg-amber-400 font-mono font-black text-black shadow-[inset_0_0_0_3px_#a85c05]">開始焊接改裝</button><button type="button" onClick={() => void start("preview")} className="mt-2 min-h-11 w-full border-2 border-cyan-700 bg-[#062327] font-mono text-sm font-bold text-cyan-100">試玩前 15 秒（不套用改裝）</button><button type="button" onClick={() => setIsEditorOpen((open) => !open)} className="mt-3 flex w-full items-center justify-center gap-1 font-mono text-xs text-cyan-300 underline"><SlidersHorizontal className="h-3.5 w-3.5" />{isEditorOpen ? "收合譜面校正" : "開啟譜面校正與單音符編輯"}{isEditorOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</button>{isEditorOpen && <NoteEditor difficulty={difficulty} revision={editorRevision} onChanged={() => setEditorRevision((revision) => revision + 1)} />}<p className="mt-4 font-mono text-[10px] text-zinc-500">鍵盤 Z / X / C / V，或使用下方四個觸控焊點。</p></section>}
      {phase === "countdown" && <section className="relative min-h-0 flex-1 bg-[radial-gradient(ellipse,rgba(251,191,36,.15),transparent_55%),#020b0d] text-center"><div className="absolute inset-0 flex flex-col items-center justify-center"><p className="font-mono text-[10px] tracking-[.16em] text-cyan-300">SYSTEM ARMED // BGM STARTS AFTER COUNTDOWN</p><b key={countdown} className="mt-4 font-pixel text-[clamp(90px,25vw,140px)] leading-none text-amber-300 drop-shadow-[0_0_18px_#fbbf24] animate-[rhythmCountdownPop_.72s_ease-out_both]">{countdown || "GO"}</b></div></section>}
      {phase === "paused" && <section className="flex min-h-0 flex-1 flex-col items-center justify-center bg-[#020b0d] p-5 text-center"><p className="font-mono text-xs tracking-[.2em] text-amber-300">RHYTHM PAUSED</p><h3 className="mt-3 font-mono text-xl font-black">焊接已安全暫停</h3><p className="mt-3 text-sm leading-relaxed text-zinc-400">為避免音樂時鐘偏移，重新開始本次焊接。素材不會被扣除。</p><button type="button" onClick={() => void start(playMode)} className="mt-6 min-h-14 w-full border-2 border-amber-100 bg-amber-400 font-mono font-black text-black">重新開始焊接</button><button type="button" onClick={onCancel} className="mt-3 font-mono text-sm text-zinc-500 underline">返回改裝介面</button></section>}
      {phase === "result" && result && <section className="flex min-h-0 flex-1 flex-col justify-center bg-[radial-gradient(ellipse_at_top,rgba(14,116,144,.18),transparent_50%),#020b0d] p-5 text-center"><div className="mx-auto w-full max-w-[360px] border border-cyan-950 bg-[#041216]/75 px-5 py-6 shadow-[0_0_35px_rgba(6,182,212,.08)]"><p className="font-mono text-[11px] tracking-[.18em] text-cyan-300">{playMode === "preview" ? "CALIBRATION REPORT // PREVIEW" : "SOLDERING REPORT"}</p><h3 className="mt-2 font-pixel text-[clamp(96px,26vw,136px)] font-black leading-none text-amber-300 drop-shadow-[0_0_16px_#fbbf24]">{result.grade}</h3><p className="mt-4 flex items-baseline justify-center gap-2 text-2xl font-black"><span className="font-cjk-ui">同步率</span><span className="font-pixel">{result.accuracy}%</span></p><p className="mt-2 font-mono text-base font-bold tracking-wider text-zinc-400">{result.score} SCORE</p></div><div className="mt-6 grid grid-cols-4 gap-1 text-[10px]">{(["perfect", "great", "good", "miss"] as RhythmJudgement[]).map((item) => <div key={item} className="border-2 border-cyan-950 bg-black/75 p-2"><b className={`font-mono ${JUDGEMENT_COLOR[item]}`}>{item.toUpperCase()}</b><span className="mt-1 block font-mono text-xl font-black">{result[item]}</span></div>)}</div><p className="mt-4 font-mono text-xs text-zinc-400">MAX COMBO {result.maxCombo} · {playMode === "preview" ? "試玩不會套用改裝" : "改裝準備完成"}</p>{playMode === "full" ? <><button type="button" onClick={onCompleted} className="mt-6 min-h-14 w-full border-2 border-emerald-100 bg-emerald-400 font-mono font-black text-black">套用改裝並扣除素材</button><button type="button" onClick={onCancel} className="mt-3 font-mono text-sm text-zinc-500 underline">放棄改裝（不扣素材）</button></> : <button type="button" onClick={() => { setPhase("select"); setResult(null); }} className="mt-6 min-h-14 w-full border-2 border-cyan-100 bg-cyan-400 font-mono font-black text-black">返回校正與改裝</button>}</section>}
      {isPlaying && <><div className="grid shrink-0 grid-cols-4 border-b-2 border-[#1a4c55] bg-[#061719] font-mono text-center text-[9px] sm:text-[10px]"><div className="border-r border-cyan-950 py-1"><span className="block text-cyan-700">SCORE</span><b>{score.score}</b></div><div className="border-r border-cyan-950 py-1"><span className="block text-cyan-700">COMBO</span><b className="text-amber-200">{score.combo}</b></div><div className="border-r border-cyan-950 py-1"><span className="block text-cyan-700">SYNC</span><b>{accuracy}%</b></div><div className="py-1"><span className="block text-cyan-700">PROGRESS</span><b>{Math.min(100, Math.round(now / chart.duration * 100))}%</b></div></div><main className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(ellipse,rgba(6,78,59,.22),transparent_70%),#01090a] p-2"><CircuitBoard now={now} notes={chart.notes.filter((entry) => !statesRef.current.get(entry.id)?.judged)} litLanes={litLanes} unstable={unstable} lastJudgement={lastJudgement} />{lastJudgement && <div key={`${lastJudgement}-${score.score}`} className={`rhythm-judgement-pop pointer-events-none absolute left-1/2 top-[9%] z-20 font-pixel text-[clamp(30px,8vw,48px)] font-black tracking-[.08em] animate-[rhythmJudgementPop_.48s_ease-out_both] ${JUDGEMENT_POP_STYLE[lastJudgement]}`}>{lastJudgement.toUpperCase()}</div>}</main><div className="shrink-0 border-t-2 border-[#1a4c55] bg-[#030d0f] px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2"><div className="grid grid-cols-4 gap-1">{RHYTHM_LANES.map((lane) => <button key={lane} type="button" aria-label={`焊接點 ${RHYTHM_KEY_LABELS[lane]}（Lane ${lane}）`} onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); inputDown(lane); }} onPointerUp={(event) => { event.preventDefault(); inputUp(lane); }} onPointerCancel={() => inputUp(lane)} className={`min-h-[clamp(52px,11dvh,76px)] touch-none select-none border-2 font-mono text-[clamp(23px,6vw,34px)] font-black transition active:scale-95 ${litLanes.has(lane) ? "border-amber-100 bg-amber-300 text-black shadow-[0_0_16px_#fbbf24]" : "border-cyan-700 bg-[#06282b] text-cyan-100 shadow-[inset_0_0_0_2px_#031114]"}`}>{RHYTHM_KEY_LABELS[lane]}</button>)}</div><div className="mt-1 min-h-4 text-center font-mono text-xs font-black uppercase"><span className={lastJudgement ? JUDGEMENT_COLOR[lastJudgement] : "text-cyan-900"}>{lastJudgement ?? "SYNC READY"}</span></div></div></>}
    </div>
  </div>, document.body);
}
