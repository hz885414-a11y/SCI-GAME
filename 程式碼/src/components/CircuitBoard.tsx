import React from "react";
import { RHYTHM_KEY_LABELS, RHYTHM_LANES, type RhythmLane, type RhythmNote } from "../rhythm/types";

interface CircuitBoardProps {
  now: number;
  notes: RhythmNote[];
  litLanes: Set<RhythmLane>;
  unstable: boolean;
}

const lanePosition: Record<RhythmLane, string> = { A: "left-[14%]", B: "left-[37%]", C: "left-[60%]", D: "left-[83%]" };

export function CircuitBoard({ now, notes, litLanes, unstable }: CircuitBoardProps) {
  const approach = 1.65;
  return <div className={`relative h-full min-h-[310px] overflow-hidden border border-cyan-700/60 bg-[#041216] shadow-[inset_0_0_70px_rgba(8,145,178,.15)] ${unstable ? "animate-[pulse_.22s_ease-in-out_2]" : ""}`}>
    <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,transparent_49%,rgba(34,211,238,.3)_50%,transparent_51%),linear-gradient(0deg,transparent_49%,rgba(34,211,238,.15)_50%,transparent_51%)] [background-size:23%_100%,100%_34%]" />
    <div className="absolute inset-x-[8%] top-[14%] h-10 border-y border-cyan-600/35 bg-cyan-950/30" />
    <div className="absolute inset-x-[8%] bottom-[21%] h-1 bg-amber-300 shadow-[0_0_18px_#fbbf24]" />
    <div className="absolute left-[8%] top-[14%] h-[66%] w-px bg-cyan-600/50" />
    <div className="absolute right-[8%] top-[14%] h-[66%] w-px bg-cyan-600/50" />
    <div className="absolute left-1/2 top-[14%] h-[22%] w-32 -translate-x-1/2 border border-cyan-300/50 bg-[#071b20] shadow-[0_0_25px_rgba(34,211,238,.18)]"><span className="absolute inset-0 grid place-items-center font-mono text-[11px] tracking-[.35em] text-cyan-300">C2-932</span></div>
    {RHYTHM_LANES.map((lane) => <React.Fragment key={lane}>
      <div className={`absolute ${lanePosition[lane]} top-[36%] h-[43%] w-px bg-cyan-500/30`} />
      <div className={`absolute ${lanePosition[lane]} bottom-[14%] flex h-16 w-16 -translate-x-1/2 flex-col items-center justify-center rounded-full border-4 transition-all ${litLanes.has(lane) ? "border-amber-200 bg-amber-400 text-black shadow-[0_0_35px_#fbbf24]" : "border-cyan-700 bg-[#0b2428] text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,.3)]"}`}><b className="font-mono text-2xl">{RHYTHM_KEY_LABELS[lane]}</b><span className="font-mono text-[8px] opacity-70">L{lane}</span></div>
    </React.Fragment>)}
    {notes.map((entry) => {
      const target = entry.type === "hold" ? entry.time + (entry.duration ?? 0) / 2 : entry.time;
      const progress = (target - now) / approach;
      if (progress < -0.12 || progress > 1.08) return null;
      const bottom = 21 + progress * 54;
      const displayLanes = entry.type === "double" ? entry.lanes ?? [entry.lane] : [entry.lane];
      return displayLanes.map((lane) => <div key={`${entry.id}-${lane}`} className={`absolute ${lanePosition[lane]} -translate-x-1/2 rounded border-2 ${entry.type === "hold" ? "h-16 border-fuchsia-300 bg-fuchsia-500/60" : entry.type === "double" ? "h-8 w-8 border-orange-200 bg-orange-500" : "h-8 w-8 border-cyan-100 bg-cyan-400"} shadow-[0_0_18px_currentColor]`} style={{ bottom: `${bottom}%` }}><span className="grid h-full w-full place-items-center font-mono text-[9px] font-black text-black">{entry.type === "hold" ? "HOLD" : entry.type === "double" ? "×2" : "●"}</span></div>);
    })}
    <div className="absolute bottom-[20%] left-[7%] right-[7%] h-2 border-y border-amber-100/70 bg-amber-400/40 shadow-[0_0_22px_#fbbf24]" />
  </div>;
}
