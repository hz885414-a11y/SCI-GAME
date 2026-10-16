import easySource from "./charts/DDDD_easy.json";
import normalSource from "./charts/DDDD_normal.json";
import hardSource from "./charts/DDDD_hard.json";
import { RHYTHM_LANES, type RhythmChart, type RhythmDifficulty, type RhythmLane, type RhythmNote, type RhythmNoteAdjustment } from "./types";
import type { RhythmChartEdits, RhythmEditsByDifficulty } from "../config/types";

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
type ChartEdits = RhythmChartEdits;
type AdjustmentStore = RhythmEditsByDifficulty | Partial<Record<RhythmDifficulty, Record<string, RhythmNoteAdjustment>>>;

function isLane(value: unknown): value is RhythmLane {
  return typeof value === "string" && RHYTHM_LANES.includes(value as RhythmLane);
}

function readAdjustments(): AdjustmentStore {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as AdjustmentStore; } catch { return {}; }
}
function writeAdjustments(store: AdjustmentStore) { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }

/** Used after the shared Firebase config loads. Keeping a local mirror means
 * offline editing remains possible, while the next explicit admin save writes
 * the same serializable data back to Firebase. */
export function syncRhythmEdits(edits: RhythmEditsByDifficulty | undefined): void {
  try { writeAdjustments(edits ?? {}); } catch { /* localStorage may be unavailable */ }
}

export function getAllRhythmEdits(): RhythmEditsByDifficulty {
  const store = readAdjustments();
  return Object.fromEntries((Object.keys(sources) as RhythmDifficulty[]).flatMap((difficulty) => {
    const edits = editsFor(store, difficulty);
    if (!Object.keys(edits.notes).length && !edits.added.length && !edits.removed.length) return [];
    return [[difficulty, { notes: { ...edits.notes }, added: edits.added.map((note) => ({ ...note, lanes: note.lanes ? [...note.lanes] : undefined })), removed: [...edits.removed] }]];
  })) as RhythmEditsByDifficulty;
}

function editsFor(store: AdjustmentStore, difficulty: RhythmDifficulty): Required<ChartEdits> {
  const stored = store[difficulty];
  if (!stored) return { notes: {}, added: [], removed: [] };
  if ("notes" in stored || "added" in stored || "removed" in stored) {
    const modern = stored as ChartEdits;
    return { notes: modern.notes ?? {}, added: modern.added ?? [], removed: modern.removed ?? [] };
  }
  // Older versions stored note patches directly under the difficulty key.
  return { notes: stored as Record<string, RhythmNoteAdjustment>, added: [], removed: [] };
}

/**
 * Imported timeMs is absolute from the audio playback origin. source offsetMs
 * is retained as editor metadata only and is never added to judgement timing.
 */
function toChart(source: SourceChart, edits: Required<ChartEdits> = { notes: {}, added: [], removed: [] }): RhythmChart {
  const sourceNotes: RhythmNote[] = source.notes.filter((entry) => !edits.removed.includes(entry.id)).map((entry) => {
    const adjustment = edits.notes[entry.id];
    const lane = isLane(adjustment?.lane) ? adjustment.lane : entry.lane ?? entry.lanes?.[0] ?? "A";
    const lanes = entry.type === "double"
      ? (adjustment?.lanes?.every(isLane) && adjustment.lanes.length === 2 ? adjustment.lanes : entry.lanes ?? [lane, lane])
      : undefined;
    return {
      id: entry.id,
      time: (adjustment?.timeMs ?? entry.timeMs) / 1000,
      lane,
      lanes,
      type: adjustment?.type ?? entry.type,
      duration: (adjustment?.durationMs ?? entry.durationMs) ? (adjustment?.durationMs ?? entry.durationMs)! / 1000 : undefined,
    } satisfies RhythmNote;
  });
  const customNotes = edits.added.map((note) => {
    const adjustment = edits.notes[note.id];
    return {
      ...note,
      time: (adjustment?.timeMs ?? note.time * 1000) / 1000,
      lane: isLane(adjustment?.lane) ? adjustment.lane : note.lane,
      type: adjustment?.type ?? note.type,
      duration: (adjustment?.durationMs ?? (note.duration ? note.duration * 1000 : undefined))
        ? (adjustment?.durationMs ?? note.duration! * 1000)! / 1000
        : undefined,
    };
  });
  const notes = [...sourceNotes, ...customNotes].sort((left, right) => left.time - right.time);
  return { id: `dddd-${source.difficulty}`, name: source.title, bpm: source.bpm, duration: source.durationMs / 1000, difficulty: source.difficulty, sourceOffsetMs: source.offsetMs, timing: source.timing, notes };
}

export const RHYTHM_CHARTS: Record<RhythmDifficulty, RhythmChart> = {
  easy: toChart(sources.easy), normal: toChart(sources.normal), hard: toChart(sources.hard),
};

export function getRhythmChart(difficulty: RhythmDifficulty): RhythmChart {
  return validateChart(toChart(sources[difficulty], editsFor(readAdjustments(), difficulty)));
}
export function getSourceNoteCount(difficulty: RhythmDifficulty) { return sources[difficulty].notes.length; }
export function saveNoteAdjustment(difficulty: RhythmDifficulty, noteId: string, adjustment: RhythmNoteAdjustment) {
  const store = readAdjustments();
  const edits = editsFor(store, difficulty);
  store[difficulty] = { ...edits, notes: { ...edits.notes, [noteId]: { ...edits.notes[noteId], ...adjustment } } };
  writeAdjustments(store);
}
/** Apply an atomic batch of timestamp adjustments, for waveform-assisted
 * chart alignment. Other note properties remain untouched. */
export function saveRhythmTimeAdjustments(difficulty: RhythmDifficulty, timeMsById: Record<string, number>) {
  const store = readAdjustments();
  const edits = editsFor(store, difficulty);
  const notes = { ...edits.notes };
  Object.entries(timeMsById).forEach(([id, timeMs]) => { notes[id] = { ...notes[id], timeMs: Math.max(0, Math.round(timeMs)) }; });
  store[difficulty] = { ...edits, notes };
  writeAdjustments(store);
}
export function addCustomNote(difficulty: RhythmDifficulty, lane: RhythmLane, timeMs: number): RhythmNote {
  const store = readAdjustments();
  const edits = editsFor(store, difficulty);
  const note: RhythmNote = { id: `custom_${difficulty}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, time: Math.max(0, timeMs) / 1000, lane, type: "tap" };
  store[difficulty] = { ...edits, added: [...edits.added, note] };
  writeAdjustments(store);
  return note;
}
export function deleteRhythmNote(difficulty: RhythmDifficulty, noteId: string) {
  const store = readAdjustments();
  const edits = editsFor(store, difficulty);
  const added = edits.added.filter((note) => note.id !== noteId);
  const isCustom = added.length !== edits.added.length;
  store[difficulty] = { ...edits, added, removed: isCustom ? edits.removed : [...new Set([...edits.removed, noteId])], notes: Object.fromEntries(Object.entries(edits.notes).filter(([id]) => id !== noteId)) };
  writeAdjustments(store);
}
export function clearNoteAdjustments(difficulty: RhythmDifficulty) {
  const store = readAdjustments(); delete store[difficulty]; writeAdjustments(store);
}
export function getRhythmEditsSnapshot(difficulty: RhythmDifficulty): Required<ChartEdits> {
  const edits = editsFor(readAdjustments(), difficulty);
  return { notes: { ...edits.notes }, added: edits.added.map((note) => ({ ...note, lanes: note.lanes ? [...note.lanes] : undefined })), removed: [...edits.removed] };
}
export function restoreRhythmEditsSnapshot(difficulty: RhythmDifficulty, snapshot: Required<ChartEdits>) {
  const store = readAdjustments();
  store[difficulty] = { notes: { ...snapshot.notes }, added: snapshot.added.map((note) => ({ ...note, lanes: note.lanes ? [...note.lanes] : undefined })), removed: [...snapshot.removed] };
  writeAdjustments(store);
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
