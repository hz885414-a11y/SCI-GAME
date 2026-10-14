import { type RhythmChart, type RhythmDifficulty, type RhythmLane, type RhythmNote } from "./types";

const lanes: RhythmLane[] = ["A", "B", "C", "D"];

const note = (id: string, time: number, lane: RhythmLane): RhythmNote => ({ id, time, lane, type: "tap" });
const hold = (id: string, time: number, lane: RhythmLane, duration: number): RhythmNote => ({ id, time, lane, type: "hold", duration });
const double = (id: string, time: number, first: RhythmLane, second: RhythmLane): RhythmNote => ({ id, time, lane: first, lanes: [first, second], type: "double" });

/**
 * First built-in test track. Times are data rather than UI logic so new songs
 * can be added by registering another chart (or eventually loading JSON).
 */
const buildChart = (difficulty: RhythmDifficulty): RhythmChart => {
  const notes: RhythmNote[] = [];
  const step = difficulty === "easy" ? 0.78 : difficulty === "normal" ? 0.52 : 0.36;
  const count = difficulty === "easy" ? 22 : difficulty === "normal" ? 34 : 52;
  for (let index = 0; index < count; index += 1) {
    const time = 2 + index * step;
    const lane = lanes[(index * (difficulty === "hard" ? 3 : 1) + Math.floor(index / 5)) % lanes.length];
    if (difficulty !== "easy" && index > 0 && index % 9 === 0) {
      notes.push(double(`double-${index}`, time, lane, lanes[(lanes.indexOf(lane) + 2) % lanes.length]));
    } else if (difficulty !== "easy" && index > 2 && index % 7 === 0) {
      notes.push(hold(`hold-${index}`, time, lane, difficulty === "hard" ? 0.72 : 0.62));
    } else {
      notes.push(note(`tap-${index}`, time, lane));
    }
  }
  const last = notes.at(-1);
  return {
    id: `solder-test-${difficulty}`,
    name: "C2-932 // Circuit Pulse Test",
    bpm: difficulty === "easy" ? 96 : difficulty === "normal" ? 116 : 138,
    difficulty,
    duration: (last?.time ?? 0) + (last?.duration ?? 0) + 2.5,
    notes,
  };
};

export const RHYTHM_CHARTS: Record<RhythmDifficulty, RhythmChart> = {
  easy: buildChart("easy"),
  normal: buildChart("normal"),
  hard: buildChart("hard"),
};

export function validateChart(chart: RhythmChart): RhythmChart {
  const ids = new Set<string>();
  chart.notes.forEach((entry) => {
    if (ids.has(entry.id)) throw new Error(`Duplicate rhythm note id: ${entry.id}`);
    if (entry.time < 0 || !Number.isFinite(entry.time)) throw new Error(`Invalid rhythm note time: ${entry.id}`);
    if (entry.type === "hold" && (!entry.duration || entry.duration <= 0)) throw new Error(`Hold needs duration: ${entry.id}`);
    if (entry.type === "double" && (!entry.lanes || entry.lanes.length !== 2)) throw new Error(`Double needs two lanes: ${entry.id}`);
    ids.add(entry.id);
  });
  return chart;
}
