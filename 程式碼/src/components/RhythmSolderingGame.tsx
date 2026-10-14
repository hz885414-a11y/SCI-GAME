import React, { useCallback, useEffect, useRef, useState } from "react";
import { CircuitBoard } from "./CircuitBoard";
import { RHYTHM_CHARTS, validateChart } from "../rhythm/charts";
import { RhythmAudioController } from "../rhythm/audioController";
import { applyJudgement, calculateResult, judgementForDelta } from "../rhythm/resultCalculator";
import { createEmptyScore, RHYTHM_LANES, RHYTHM_RULES, type RhythmChart, type RhythmDifficulty, type RhythmJudgement, type RhythmLane, type RhythmNote, type RhythmResult, type RhythmScore } from "../rhythm/types";
import { useRhythmInput } from "../rhythm/useRhythmInput";
import { X, Zap } from "lucide-react";

type Phase = "select" | "countdown" | "playing" | "paused" | "result";
type NoteState = { started?: boolean; judged?: boolean; held?: boolean; lanes?: Set<RhythmLane> };

interface RhythmSolderingGameProps {
  equipmentName: string;
  onCompleted: () => void;
  onCancel: () => void;
}

const JUDGEMENT_COLOR: Record<RhythmJudgement, string> = { perfect: "text-amber-200", great: "text-emerald-300", good: "text-cyan-300", miss: "text-rose-400" };

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
  const chartRef = useRef<RhythmChart>(validateChart(RHYTHM_CHARTS.normal));
  const engineRef = useRef(new RhythmAudioController());
  const frameRef = useRef<number | null>(null);
  const statesRef = useRef<Map<string, NoteState>>(new Map());
  const scoreRef = useRef<RhythmScore>(createEmptyScore());
  const heldLanesRef = useRef(new Set<RhythmLane>());
  const completedRef = useRef(false);
  const lastUiTick = useRef(0);

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
      if (!statesRef.current.get(entry.id)?.judged) {
        statesRef.current.set(entry.id, { judged: true }); register("miss");
      }
    });
    window.setTimeout(() => { setResult(calculateResult(scoreRef.current, chart.notes.length)); setPhase("result"); }, 0);
  }, [register]);

  const inputDown = useCallback((lane: RhythmLane) => {
    if (phase !== "playing") return;
    const time = engineRef.current.getTime() + RHYTHM_RULES.inputOffsetMs / 1000;
    heldLanesRef.current.add(lane);
    setLitLanes(new Set(heldLanesRef.current));
    const candidates = chartRef.current.notes.filter((entry) => {
      const state = statesRef.current.get(entry.id);
      const lanes = entry.type === "double" ? entry.lanes ?? [] : [entry.lane];
      return !state?.judged && lanes.includes(lane) && Math.abs(time - entry.time) <= RHYTHM_RULES.windowsMs.good / 1000;
    }).sort((a, b) => Math.abs(time - a.time) - Math.abs(time - b.time));
    const entry = candidates[0];
    if (!entry) return;
    const state = statesRef.current.get(entry.id) ?? {};
    if (entry.type === "double") {
      const pressed = state.lanes ?? new Set<RhythmLane>();
      pressed.add(lane); state.lanes = pressed; statesRef.current.set(entry.id, state);
      if ((entry.lanes ?? []).every((required) => pressed.has(required))) {
        state.judged = true; register(judgementForDelta((time - entry.time) * 1000));
      }
      return;
    }
    if (entry.type === "hold") { state.started = true; state.held = true; statesRef.current.set(entry.id, state); return; }
    state.judged = true; statesRef.current.set(entry.id, state); register(judgementForDelta((time - entry.time) * 1000));
  }, [phase, register]);

  const inputUp = useCallback((lane: RhythmLane) => {
    heldLanesRef.current.delete(lane); setLitLanes(new Set(heldLanesRef.current));
    if (phase !== "playing") return;
    chartRef.current.notes.forEach((entry) => {
      if (entry.type !== "hold" || entry.lane !== lane) return;
      const state = statesRef.current.get(entry.id);
      if (state?.started && !state.judged && engineRef.current.getTime() < entry.time + (entry.duration ?? 0) - 0.04) {
        state.judged = true; register("miss");
      }
    });
  }, [phase, register]);

  useRhythmInput(phase === "playing", inputDown, inputUp);

  const start = useCallback(async () => {
    chartRef.current = validateChart(RHYTHM_CHARTS[difficulty]);
    statesRef.current = new Map(); scoreRef.current = createEmptyScore(); completedRef.current = false;
    setScore(scoreRef.current); setNow(0); setCountdown(3); setPhase("countdown");
    for (const remaining of [2, 1, 0]) await new Promise<void>((resolve) => window.setTimeout(() => { setCountdown(remaining); resolve(); }, 1000));
    await engineRef.current.start(); setPhase("playing");
  }, [difficulty]);

  useEffect(() => {
    if (phase !== "playing") return;
    const animate = (stamp: number) => {
      const time = engineRef.current.getTime();
      chartRef.current.notes.forEach((entry) => {
        const state = statesRef.current.get(entry.id);
        if (state?.judged) return;
        if (entry.type === "hold" && state?.started && state.held && heldLanesRef.current.has(entry.lane) && time >= entry.time + (entry.duration ?? 0)) {
          state.judged = true; register(judgementForDelta((time - (entry.time + (entry.duration ?? 0))) * 1000)); return;
        }
        const expiry = entry.type === "hold" && state?.started ? entry.time + (entry.duration ?? 0) + RHYTHM_RULES.windowsMs.good / 1000 : entry.time + RHYTHM_RULES.windowsMs.good / 1000;
        if (time > expiry) { statesRef.current.set(entry.id, { ...state, judged: true }); register("miss"); }
      });
      if (stamp - lastUiTick.current > 45) { lastUiTick.current = stamp; setNow(time); }
      if (time >= chartRef.current.duration) finish(); else frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    const hidden = () => {
      if (!document.hidden) return;
      engineRef.current.stop();
      setPhase("paused");
    };
    document.addEventListener("visibilitychange", hidden);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); document.removeEventListener("visibilitychange", hidden); };
  }, [phase, finish, register]);

  useEffect(() => () => engineRef.current.stop(), []);

  const chart = chartRef.current;
  return <div className="fixed inset-0 z-[150] flex min-h-0 flex-col bg-[#03090c] text-zinc-100 selection:bg-cyan-400/40" style={{ touchAction: "none" }} role="dialog" aria-modal="true" aria-label="電路板節奏焊接">
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-cyan-900/70 bg-black/80 px-3 py-2 sm:px-6"><div><p className="font-mono text-[9px] tracking-[.25em] text-cyan-400">RHYTHM SOLDERING // C2-932</p><h2 className="text-sm font-black sm:text-lg">{equipmentName}</h2></div><button type="button" onClick={onCancel} className="grid h-10 w-10 place-items-center border border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-rose-500 hover:text-rose-300" aria-label="離開改裝"><X className="h-5 w-5" /></button></header>
    {phase === "select" ? <section className="m-auto w-full max-w-xl p-5 text-center"><Zap className="mx-auto h-14 w-14 text-amber-300" /><h3 className="mt-4 text-2xl font-black">電路板節奏焊接</h3><p className="mt-2 text-sm leading-relaxed text-zinc-400">完成一首測試曲目後才會套用改裝。中途離開不扣任何素材。</p><div className="mt-7 grid grid-cols-3 gap-2">{(["easy", "normal", "hard"] as RhythmDifficulty[]).map((item) => <button key={item} type="button" onClick={() => setDifficulty(item)} className={`min-h-16 border font-black ${difficulty === item ? "border-cyan-300 bg-cyan-400/20 text-cyan-100" : "border-zinc-700 bg-zinc-950 text-zinc-500"}`}>{item.toUpperCase()}<small className="mt-1 block text-[9px]">{RHYTHM_CHARTS[item].notes.length} NOTES</small></button>)}</div><button type="button" onClick={() => void start()} className="mt-6 min-h-14 w-full bg-amber-400 font-black text-black hover:bg-amber-300">開始改裝 // 使用戰鬥 BGM</button><p className="mt-4 text-[10px] text-zinc-500">鍵盤 A / B / C / D 或下方觸控焊點。雙鍵音符請同時按下兩個對應按鈕。</p></section> : phase === "countdown" ? <div className="m-auto text-center"><p className="font-mono text-cyan-400">SYSTEM ARMED</p><b className="text-[120px] font-black leading-none text-amber-300">{countdown || "GO"}</b></div> : phase === "paused" ? <section className="m-auto w-full max-w-sm p-5 text-center"><p className="font-mono text-amber-300">RHYTHM PAUSED</p><h3 className="mt-3 text-2xl font-black">偵測到背景切換</h3><p className="mt-3 text-sm text-zinc-400">為避免音樂時鐘偏移，本次焊接已安全暫停。重新開始不會扣除素材。</p><button type="button" onClick={() => void start()} className="mt-6 min-h-14 w-full bg-amber-400 font-black text-black">重新開始焊接</button><button type="button" onClick={onCancel} className="mt-3 text-sm text-zinc-500 underline">返回改裝介面</button></section> : phase === "result" && result ? <section className="m-auto w-full max-w-xl p-5 text-center"><p className="font-mono text-cyan-400">SOLDERING REPORT</p><h3 className="mt-2 text-6xl font-black text-amber-300">{result.grade}</h3><p className="mt-2 text-xl font-black">同步率 {result.accuracy}% · {result.score} SCORE</p><div className="mt-6 grid grid-cols-4 gap-2 text-xs">{(["perfect", "great", "good", "miss"] as RhythmJudgement[]).map((item) => <div key={item} className="border border-zinc-700 bg-black/60 p-3"><b className={JUDGEMENT_COLOR[item]}>{item.toUpperCase()}</b><span className="mt-1 block text-xl font-black">{result[item]}</span></div>)}</div><p className="mt-4 text-sm text-zinc-400">MAX COMBO {result.maxCombo} · 改裝準備完成</p><button type="button" onClick={onCompleted} className="mt-6 min-h-14 w-full bg-emerald-400 font-black text-black hover:bg-emerald-300">套用改裝並扣除素材</button><button type="button" onClick={onCancel} className="mt-3 text-sm text-zinc-500 underline">放棄改裝（不扣素材）</button></section> : <><main className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-2 p-2 sm:p-4"><div className="grid grid-cols-4 gap-1 border border-zinc-800 bg-black/70 p-2 text-center font-mono text-[10px] sm:text-xs"><div><span className="block text-zinc-500">進度</span>{Math.min(100, Math.round(now / chart.duration * 100))}%</div><div><span className="block text-zinc-500">COMBO</span><b className="text-amber-300">{score.combo}</b></div><div><span className="block text-zinc-500">SCORE</span>{score.score}</div><div><span className="block text-zinc-500">SYNC</span>{calculateResult(score, chart.notes.length).accuracy}%</div></div><CircuitBoard now={now} notes={chart.notes.filter((entry) => !statesRef.current.get(entry.id)?.judged)} litLanes={litLanes} unstable={unstable} /></main><div className="shrink-0 border-t border-cyan-900/60 bg-black/90 px-2 pb-[max(12px,env(safe-area-inset-bottom))] pt-2"><div className="mx-auto grid max-w-2xl grid-cols-4 gap-2">{RHYTHM_LANES.map((lane) => <button key={lane} type="button" onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); inputDown(lane); }} onPointerUp={(event) => { event.preventDefault(); inputUp(lane); }} onPointerCancel={() => inputUp(lane)} className={`min-h-[72px] touch-none select-none border-2 font-mono text-2xl font-black transition active:scale-95 ${litLanes.has(lane) ? "border-amber-100 bg-amber-400 text-black" : "border-cyan-600 bg-cyan-950/70 text-cyan-200"}`}>{lane}</button>)}</div><div className="mt-1 h-5 text-center text-xs font-black uppercase"><span className={lastJudgement ? JUDGEMENT_COLOR[lastJudgement] : "text-zinc-600"}>{lastJudgement ?? "SYNC"}</span></div></div></>}</div>;
}
