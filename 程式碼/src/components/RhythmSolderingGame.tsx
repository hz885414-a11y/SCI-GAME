import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircuitBoard } from "./CircuitBoard";
import { clearNoteAdjustments, getRhythmChart, getSourceNoteCount, saveNoteAdjustment } from "../rhythm/charts";
import { RhythmAudioController } from "../rhythm/audioController";
import { pauseBackgroundMusicForActivity, resumeBackgroundMusicAfterActivity } from "../utils/audio";
import { applyJudgement, calculateResult, judgementForDelta } from "../rhythm/resultCalculator";
import { createEmptyScore, RHYTHM_LANES, RHYTHM_RULES, type RhythmChart, type RhythmDifficulty, type RhythmJudgement, type RhythmLane, type RhythmNote, type RhythmResult, type RhythmScore } from "../rhythm/types";
import { useRhythmInput } from "../rhythm/useRhythmInput";
import { ChevronDown, ChevronUp, SlidersHorizontal, X, Zap } from "lucide-react";

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
  return <div className="mt-3 border border-cyan-900/70 bg-black/55 p-2 text-left">
    <div className="flex items-center justify-between gap-2"><p className="font-mono text-[10px] text-cyan-300">譜面校正 // timeMs 為音檔起點的絕對時間</p><button type="button" onClick={() => setShowAll((current) => !current)} className="border border-zinc-700 px-2 py-1 text-[10px] text-zinc-300">{showAll ? "僅前 15 秒" : "顯示全部"}</button></div>
    <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">來源 offset {chart.sourceOffsetMs ?? 0}ms 只用於格線，不會加到音符或判定。修改會保存在此裝置。</p>
    <div className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1">
      {notes.map((note) => <div key={note.id} className="grid grid-cols-[64px_1fr_52px] items-center gap-1 border border-zinc-800 bg-zinc-950/80 p-1 text-[10px]">
        <span className="font-mono text-zinc-500">{note.id.replace(`${difficulty}_`, "#")}</span>
        <input aria-label={`${note.id} 時間毫秒`} type="number" step="1" min="0" defaultValue={Math.round(note.time * 1000)} onBlur={(event) => save(note, { timeMs: Math.max(0, Number(event.currentTarget.value) || 0) })} className="min-w-0 border border-zinc-700 bg-black px-1 py-1 font-mono text-cyan-200" />
        {note.type === "double" ? <span className="flex gap-1">{[0, 1].map((index) => <select key={index} aria-label={`${note.id} 按鍵 ${index + 1}`} value={note.lanes?.[index] ?? "A"} onChange={(event) => { const lanes = [...(note.lanes ?? ["A", "B"])] as RhythmLane[]; lanes[index] = event.target.value as RhythmLane; save(note, { lanes }); }} className="w-6 border border-zinc-700 bg-black px-0 py-1 text-cyan-200"><option>A</option><option>B</option><option>C</option><option>D</option></select>)}</span> : <select aria-label={`${note.id} 按鍵`} value={note.lane} onChange={(event) => save(note, { lane: event.target.value as RhythmLane })} className="border border-zinc-700 bg-black py-1 text-center text-cyan-200"><option>A</option><option>B</option><option>C</option><option>D</option></select>}
      </div>)}
    </div>
    <button type="button" onClick={() => { clearNoteAdjustments(difficulty); onChanged(); }} className="mt-2 text-[10px] text-rose-300 underline">還原此難度的原始譜面</button>
  </div>;
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
    // Player calibration is the only runtime offset; source offsetMs is not used here.
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
    setPlayMode(mode); setScore(scoreRef.current); setNow(0); setResult(null); setCountdown(3); setPhase("countdown");
    for (const remaining of [2, 1, 0]) await new Promise<void>((resolve) => window.setTimeout(() => { setCountdown(remaining); resolve(); }, 1000));
    await engineRef.current.start(); setPhase("playing");
  }, [difficulty]);

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
  return <div className="fixed inset-0 z-[150] flex min-h-0 flex-col bg-[#03090c] text-zinc-100 selection:bg-cyan-400/40" style={{ touchAction: "none" }} role="dialog" aria-modal="true" aria-label="電路板節奏焊接">
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-cyan-900/70 bg-black/80 px-3 py-2 sm:px-6"><div><p className="font-mono text-[9px] tracking-[.25em] text-cyan-400">RHYTHM SOLDERING // C2-932</p><h2 className="text-sm font-black sm:text-lg">{equipmentName}</h2></div><button type="button" onClick={onCancel} className="grid h-10 w-10 place-items-center border border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-rose-500 hover:text-rose-300" aria-label="離開改裝"><X className="h-5 w-5" /></button></header>
    {phase === "select" ? <section className="m-auto w-full max-w-xl p-5 text-center"><Zap className="mx-auto h-14 w-14 text-amber-300" /><h3 className="mt-4 text-2xl font-black">焊接大作戰！</h3><p className="mt-2 text-sm leading-relaxed text-zinc-400">每個小細節都不能馬虎<br />但照著自己的節奏焊接也是很重要的呢！</p><div className="mt-7 grid grid-cols-3 gap-2">{(["easy", "normal", "hard"] as RhythmDifficulty[]).map((item) => <button key={item} type="button" onClick={() => setDifficulty(item)} className={`min-h-16 border font-black ${difficulty === item ? "border-cyan-300 bg-cyan-400/20 text-cyan-100" : "border-zinc-700 bg-zinc-950 text-zinc-500"}`}>{item.toUpperCase()}<small className="mt-1 block text-[9px]">{getSourceNoteCount(item)} NOTES</small></button>)}</div><div className="mt-5 border border-zinc-800 bg-black/50 p-3 text-left"><div className="flex items-center justify-between gap-3"><label className="font-mono text-xs font-bold text-cyan-200">音訊延遲校正 <b className="text-amber-300">{calibrationMs > 0 ? "+" : ""}{calibrationMs}ms</b></label><button type="button" onClick={() => updateCalibration(0)} className="text-[10px] text-zinc-400 underline">歸零</button></div><input aria-label="音訊延遲校正" type="range" min="-300" max="300" step="5" value={calibrationMs} onChange={(event) => updateCalibration(Number(event.target.value))} className="mt-2 w-full accent-cyan-400" /><p className="mt-1 text-[10px] leading-relaxed text-zinc-500">此數值只會套用一次到玩家輸入判定。譜面 timeMs 不會加上來源 offset 70ms。</p></div><button type="button" onClick={() => void start("full")} className="mt-5 min-h-14 w-full bg-amber-400 font-black text-black hover:bg-amber-300">開始焊接改裝</button><button type="button" onClick={() => void start("preview")} className="mt-2 min-h-11 w-full border border-cyan-700 bg-cyan-950/50 text-sm font-bold text-cyan-200">試玩前 15 秒（不套用改裝）</button><button type="button" onClick={() => setIsEditorOpen((open) => !open)} className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-cyan-300 underline"><SlidersHorizontal className="h-3.5 w-3.5" />{isEditorOpen ? "收合譜面校正" : "開啟譜面校正與單音符編輯"}{isEditorOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</button>{isEditorOpen && <NoteEditor difficulty={difficulty} revision={editorRevision} onChanged={() => setEditorRevision((revision) => revision + 1)} />}<p className="mt-4 text-[10px] text-zinc-500">鍵盤 A / B / C / D 或下方觸控焊點。雙鍵音符請同時按下兩個對應按鈕。</p></section> : phase === "countdown" ? <div className="m-auto text-center"><p className="font-mono text-cyan-400">SYSTEM ARMED // BGM STARTS AFTER COUNTDOWN</p><b className="text-[120px] font-black leading-none text-amber-300">{countdown || "GO"}</b></div> : phase === "paused" ? <section className="m-auto w-full max-w-sm p-5 text-center"><p className="font-mono text-amber-300">RHYTHM PAUSED</p><h3 className="mt-3 text-2xl font-black">偵測到背景切換</h3><p className="mt-3 text-sm text-zinc-400">為避免音樂時鐘偏移，本次焊接已安全暫停。重新開始不會扣除素材。</p><button type="button" onClick={() => void start(playMode)} className="mt-6 min-h-14 w-full bg-amber-400 font-black text-black">重新開始焊接</button><button type="button" onClick={onCancel} className="mt-3 text-sm text-zinc-500 underline">返回改裝介面</button></section> : phase === "result" && result ? <section className="m-auto w-full max-w-xl p-5 text-center"><p className="font-mono text-cyan-400">{playMode === "preview" ? "CALIBRATION REPORT // PREVIEW" : "SOLDERING REPORT"}</p><h3 className="mt-2 text-6xl font-black text-amber-300">{result.grade}</h3><div className="mt-2"><p className="text-xl font-black">同步率 {result.accuracy}%</p><p className="mt-1 text-sm font-bold tracking-wider text-zinc-400">{result.score} SCORE</p></div><div className="mt-6 grid grid-cols-4 gap-2 text-xs">{(["perfect", "great", "good", "miss"] as RhythmJudgement[]).map((item) => <div key={item} className="border border-zinc-700 bg-black/60 p-3"><b className={JUDGEMENT_COLOR[item]}>{item.toUpperCase()}</b><span className="mt-1 block text-xl font-black">{result[item]}</span></div>)}</div><p className="mt-4 text-sm text-zinc-400">MAX COMBO {result.maxCombo} · {playMode === "preview" ? "試玩不會套用改裝" : "改裝準備完成"}</p>{playMode === "full" ? <><button type="button" onClick={onCompleted} className="mt-6 min-h-14 w-full bg-emerald-400 font-black text-black hover:bg-emerald-300">套用改裝並扣除素材</button><button type="button" onClick={onCancel} className="mt-3 text-sm text-zinc-500 underline">放棄改裝（不扣素材）</button></> : <button type="button" onClick={() => { setPhase("select"); setResult(null); }} className="mt-6 min-h-14 w-full bg-cyan-400 font-black text-black">返回校正與改裝</button>}</section> : <><main className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-2 p-2 sm:p-4"><div className="grid grid-cols-4 gap-1 border border-zinc-800 bg-black/70 p-2 text-center font-mono text-[10px] sm:text-xs"><div><span className="block text-zinc-500">進度</span>{Math.min(100, Math.round(now / chart.duration * 100))}%</div><div><span className="block text-zinc-500">COMBO</span><b className="text-amber-300">{score.combo}</b></div><div><span className="block text-zinc-500">SCORE</span>{score.score}</div><div><span className="block text-zinc-500">SYNC</span>{calculateResult(score, chart.notes.length).accuracy}%</div></div><CircuitBoard now={now} notes={chart.notes.filter((entry) => !statesRef.current.get(entry.id)?.judged)} litLanes={litLanes} unstable={unstable} /></main><div className="shrink-0 border-t border-cyan-900/60 bg-black/90 px-2 pb-[max(12px,env(safe-area-inset-bottom))] pt-2"><div className="mx-auto grid max-w-2xl grid-cols-4 gap-2">{RHYTHM_LANES.map((lane) => <button key={lane} type="button" onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); inputDown(lane); }} onPointerUp={(event) => { event.preventDefault(); inputUp(lane); }} onPointerCancel={() => inputUp(lane)} className={`min-h-[72px] touch-none select-none border-2 font-mono text-2xl font-black transition active:scale-95 ${litLanes.has(lane) ? "border-amber-100 bg-amber-400 text-black" : "border-cyan-600 bg-cyan-950/70 text-cyan-200"}`}>{lane}</button>)}</div><div className="mt-1 h-5 text-center text-xs font-black uppercase"><span className={lastJudgement ? JUDGEMENT_COLOR[lastJudgement] : "text-zinc-600"}>{lastJudgement ?? "SYNC"}</span></div></div></>}</div>;
}
