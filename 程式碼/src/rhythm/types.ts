export const RHYTHM_LANES = ["A", "B", "C", "D"] as const;

export type RhythmLane = (typeof RHYTHM_LANES)[number];
export type RhythmNoteType = "tap" | "hold" | "double";
export type RhythmDifficulty = "easy" | "normal" | "hard";
export type RhythmJudgement = "perfect" | "great" | "good" | "miss";

export interface RhythmNote {
  id: string;
  /** Seconds from the audio clock start. */
  time: number;
  lane: RhythmLane;
  type: RhythmNoteType;
  duration?: number;
  lanes?: RhythmLane[];
}

export interface RhythmChart {
  id: string;
  name: string;
  bpm: number;
  duration: number;
  difficulty: RhythmDifficulty;
  /** Source-grid offset from the imported chart. Never applied to note timing. */
  sourceOffsetMs?: number;
  /** Per-chart windows supplied by the source data, in milliseconds. */
  timing?: { perfectMs: number; greatMs: number; goodMs: number };
  notes: RhythmNote[];
}

export interface RhythmNoteAdjustment {
  timeMs?: number;
  lane?: RhythmLane;
  lanes?: RhythmLane[];
}

export interface RhythmScore {
  perfect: number;
  great: number;
  good: number;
  miss: number;
  combo: number;
  maxCombo: number;
  score: number;
}

export interface RhythmResult extends RhythmScore {
  accuracy: number;
  grade: "S" | "A" | "B" | "C";
  totalNotes: number;
}

export const RHYTHM_RULES = {
  windowsMs: { perfect: 50, great: 100, good: 160 },
  points: { perfect: 100, great: 80, good: 50, miss: 0 },
  approachSeconds: 1.65,
  inputOffsetMs: 0,
} as const;

export const createEmptyScore = (): RhythmScore => ({
  perfect: 0,
  great: 0,
  good: 0,
  miss: 0,
  combo: 0,
  maxCombo: 0,
  score: 0,
});
