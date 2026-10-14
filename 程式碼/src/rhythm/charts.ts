import easySource from "./charts/DDDD_easy.json";
import normalSource from "./charts/DDDD_normal.json";
import hardSource from "./charts/DDDD_hard.json";
import { RHYTHM_LANES, type RhythmChart, type RhythmDifficulty, type RhythmLane, type RhythmNote, type RhythmNoteAdjustment } from "./types";

type SourceNote = { id: string; timeMs: number; type: RhythmNote["type"]; lane?: RhythmLane; lanes?: RhythmLane[]; durationMs?: number };
type SourceChart = {
  schemaVersion: number; title: string; durationMs: number; bpm: number; offsetMs: number;
  difficulty: RhythmDifficulty; timing: { perfectMs: number; greatMs: number; goodMs: number }; notes: SourceNote[];
};

const sources: Record<RhythmDifficulty, SourceChart> = {
  easy: easySource as SourceChart,
  normal: normalSource as SourceChart,
  hard: hardSource as SourceChart,
};
const STORAGE_KEY = "c2_932_rhythm_note_adjustments_v1";
type AdjustmentStore = Partial<Record<RhythmDifficulty, Record<string, RhythmNoteAdjustment>>>;

function isLane(value: unknown): value is RhythmLane {
  return typeof value === "string" && RHYTHM_LANES.includes(value as RhythmLane);
}

function readAdjustments(): AdjustmentStore {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as AdjustmentStore; } catch { return {}; }
}
function writeAdjustments(store: AdjustmentStore) { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }

/**
 * Imported timeMs is absolute from the audio playback origin. source offsetMs
 * is retained as editor metadata only and is never added to judgement timing.
 */
function toChart(source: SourceChart, adjustments: Record<string, RhythmNoteAdjustment> = {}): RhythmChart {
  const notes = source.notes.map((entry) => {
    const adjustment = adjustments[entry.id];
    const lane = isLane(adjustment?.lane) ? adjustment.lane : entry.lane ?? entry.lanes?.[0] ?? "A";
    const lanes = entry.type === "double"
      ? (adjustment?.lanes?.every(isLane) && adjustment.lanes.length === 2 ? adjustment.lanes : entry.lanes ?? [lane, lane])
      : undefined;
    return {
      id: entry.id,
      time: (adjustment?.timeMs ?? entry.timeMs) / 1000,
      lane,
      lanes,
      type: entry.type,
      duration: entry.durationMs ? entry.durationMs / 1000 : undefined,
    } satisfies RhythmNote;
  }).sort((left, right) => left.time - right.time);
  return { id: `dddd-${source.difficulty}`, name: source.title, bpm: source.bpm, duration: source.durationMs / 1000, difficulty: source.difficulty, sourceOffsetMs: source.offsetMs, timing: source.timing, notes };
}

export const RHYTHM_CHARTS: Record<RhythmDifficulty, RhythmChart> = {
  easy: toChart(sources.easy), normal: toChart(sources.normal), hard: toChart(sources.hard),
};

export function getRhythmChart(difficulty: RhythmDifficulty): RhythmChart {
  return validateChart(toChart(sources[difficulty], readAdjustments()[difficulty]));
}
export function getSourceNoteCount(difficulty: RhythmDifficulty) { return sources[difficulty].notes.length; }
export function saveNoteAdjustment(difficulty: RhythmDifficulty, noteId: string, adjustment: RhythmNoteAdjustment) {
  const store = readAdjustments();
  store[difficulty] = { ...store[difficulty], [noteId]: adjustment };
  writeAdjustments(store);
}
export function clearNoteAdjustments(difficulty: RhythmDifficulty) {
  const store = readAdjustments(); delete store[difficulty]; writeAdjustments(store);
}

export function validateChart(chart: RhythmChart): RhythmChart {
  const ids = new Set<string>();
  chart.notes.forEach((entry) => {
    if (ids.has(entry.id)) throw new Error(`Duplicate rhythm note id: ${entry.id}`);
    if (entry.time < 0 || !Number.isFinite(entry.time)) throw new Error(`Invalid rhythm note time: ${entry.id}`);
    if (!isLane(entry.lane)) throw new Error(`Invalid rhythm lane: ${entry.id}`);
    if (entry.type === "hold" && (!entry.duration || entry.duration <= 0)) throw new Error(`Hold needs duration: ${entry.id}`);
    if (entry.type === "double" && (!entry.lanes || entry.lanes.length !== 2 || !entry.lanes.every(isLane))) throw new Error(`Double needs two lanes: ${entry.id}`);
    ids.add(entry.id);
  });
  return chart;
}
