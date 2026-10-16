import React, { useState } from "react";
import pcbBackground from "../../assets/soldering-pcb-bg.png";
import { RHYTHM_KEY_LABELS, RHYTHM_LANES, type RhythmJudgement, type RhythmLane, type RhythmNote } from "../rhythm/types";

interface CircuitBoardProps {
  now: number;
  notes: RhythmNote[];
  litLanes: Set<RhythmLane>;
  unstable: boolean;
  lastJudgement: RhythmJudgement | null;
  hitEffect: { id: number; lane: RhythmLane; judgement: Exclude<RhythmJudgement, "miss"> } | null;
}

// Percentages are measured from the uncropped 471 × 836 PCB artwork.
const lanePosition: Record<RhythmLane, number> = { A: 17.1, B: 38.9, C: 61, D: 83.2 };
const APPROACH_SECONDS = 1.65;
const TARGET_BOTTOM = 12.1;
const TRACK_HEIGHT = 58;

const judgementEffects: Record<Exclude<RhythmJudgement, "miss">, string> = {
  perfect: "border-amber-100 bg-amber-200/25 shadow-[0_0_26px_#fbbf24]",
  great: "border-cyan-100 bg-cyan-300/15 shadow-[0_0_18px_#22d3ee]",
  good: "border-emerald-100 bg-emerald-300/10 shadow-[0_0_12px_#6ee7b7]",
};

const sparkOffsets = [[0, -25], [16, -17], [25, 0], [16, 17], [0, 25], [-16, 17], [-25, 0], [-16, -17]];
const shardOffsets = [[0, -36, -8], [28, -27, 22], [39, -4, -18], [29, 26, 35], [0, 38, -24], [-30, 25, 18], [-40, -3, -35], [-28, -28, 28]];

export function CircuitBoard({ now, notes, litLanes, unstable, lastJudgement, hitEffect }: CircuitBoardProps) {
  const [backgroundFailed, setBackgroundFailed] = useState(false);
  const targetGlow = lastJudgement && lastJudgement !== "miss" ? judgementEffects[lastJudgement] : "";

  return <div className={`relative aspect-[471/836] h-full max-w-full overflow-hidden border-2 border-[#173d45] bg-[#041b1c] shadow-[0_0_0_2px_#010607,0_0_26px_rgba(34,211,238,.2)] ${unstable ? "animate-[pulse_.22s_ease-in-out_2]" : ""}`}>
    {!backgroundFailed ? <img src={pcbBackground} alt="電路板焊接軌道" onError={() => setBackgroundFailed(true)} className="absolute inset-0 h-full w-full select-none object-contain [image-rendering:pixelated]" draggable={false} /> : <div className="absolute inset-0 bg-[#052221] [background-image:linear-gradient(90deg,transparent_49%,rgba(45,212,191,.28)_50%,transparent_51%),linear-gradient(0deg,transparent_49%,rgba(45,212,191,.18)_50%,transparent_51%)] [background-size:22%_100%,100%_8%]" />}
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.04),rgba(0,0,0,.16))]" />

    {RHYTHM_LANES.map((lane) => <React.Fragment key={lane}>
      <div className={`pointer-events-none absolute bottom-[12.1%] top-[31%] w-[3px] -translate-x-1/2 bg-cyan-300/15 ${litLanes.has(lane) ? "bg-cyan-200/70 shadow-[0_0_16px_#2dd4bf]" : ""}`} style={{ left: `${lanePosition[lane]}%` }} />
      <span className={`pointer-events-none absolute bottom-[12.1%] -translate-x-1/2 translate-y-1/2 font-pixel text-[clamp(14px,4vw,24px)] font-black text-cyan-100 drop-shadow-[2px_2px_0_#06201e] ${litLanes.has(lane) ? "text-amber-100 drop-shadow-[0_0_12px_#fbbf24]" : ""} ${targetGlow}`} style={{ left: `${lanePosition[lane]}%` }}>{RHYTHM_KEY_LABELS[lane]}</span>
    </React.Fragment>)}

    {notes.flatMap((entry) => {
      const lanes = entry.type === "double" ? entry.lanes ?? [entry.lane] : [entry.lane];
      const progress = (entry.time - now) / APPROACH_SECONDS;
      if (progress < -0.09 || progress > 1.04) return [];
      const bottom = TARGET_BOTTOM + progress * TRACK_HEIGHT;
      const holdHeight = entry.type === "hold" ? Math.max(9, Math.min(29, ((entry.duration ?? 0.6) / APPROACH_SECONDS) * TRACK_HEIGHT)) : 0;
      return lanes.map((lane) => <div key={`${entry.id}-${lane}`} className={`pointer-events-none absolute -translate-x-1/2 border-2 [image-rendering:pixelated] ${entry.type === "hold" ? `border-fuchsia-100 bg-fuchsia-500/75 shadow-[0_0_18px_#d946ef] ${litLanes.has(lane) && now >= entry.time ? "scale-110 border-amber-100 bg-amber-300 shadow-[0_0_32px_8px_#fbbf24] animate-pulse" : ""}` : entry.type === "double" ? "h-[4.2%] w-[9%] border-orange-100 bg-amber-400 shadow-[0_0_14px_#f59e0b]" : "h-[4.2%] w-[9%] border-cyan-50 bg-cyan-400 shadow-[0_0_14px_#22d3ee]"}`} style={{ left: `${lanePosition[lane]}%`, bottom: `${bottom}%`, ...(entry.type === "hold" ? { height: `${holdHeight}%` } : {}) }}>
        <span className="grid h-full w-full place-items-center font-mono text-[clamp(7px,1.6vw,10px)] font-black text-black">{entry.type === "hold" ? "HOLD" : entry.type === "double" ? "×2" : "●"}</span>
      </div>);
    })}

    {unstable && <div className="pointer-events-none absolute inset-x-[8%] bottom-[10.8%] h-[2px] bg-rose-400 shadow-[0_0_18px_#fb7185]" />}
    {hitEffect && <div key={hitEffect.id} className="pointer-events-none absolute bottom-[12.1%] h-0 w-0 -translate-x-1/2 translate-y-1/2" style={{ left: `${lanePosition[hitEffect.lane]}%` }} aria-hidden="true">
      <span className={`rhythm-impact rhythm-impact-${hitEffect.judgement}`}>
        <i className="rhythm-impact-core" />
      </span>
      <span className={`rhythm-rupture-ring rhythm-rupture-ring-${hitEffect.judgement}`} />
      {sparkOffsets.map(([x, y], index) => <i key={index} className={`rhythm-spark rhythm-spark-${hitEffect.judgement}`} style={{ "--spark-x": `${x}px`, "--spark-y": `${y}px`, animationDelay: `${index * 4}ms` } as React.CSSProperties} />)}
      {shardOffsets.map(([x, y, rotation], index) => <i key={`shard-${index}`} className={`rhythm-shard rhythm-shard-${hitEffect.judgement}`} style={{ "--shard-x": `${x}px`, "--shard-y": `${y}px`, "--shard-rotate": `${rotation}deg`, animationDelay: `${index * 3}ms` } as React.CSSProperties} />)}
    </div>}
  </div>;
}
