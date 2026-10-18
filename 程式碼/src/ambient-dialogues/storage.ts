import type { AmbientDialogue } from "./types";
const key = "sci_ambient_dialogue_state_v1";
export interface AmbientState { played: Record<string, number>; cooldowns: Record<string, number>; pending: Array<{ eventType: string; eventId?: string; data: Record<string, unknown> }>; lastAmbientId?: string; manualAmbientHistory: string[]; characterClickCount: number; enabled: boolean; entry: number; entryPlayed: Record<string, number>; }
const createDefaultState = (): AmbientState => ({
  played: {}, cooldowns: {}, pending: [], manualAmbientHistory: [],
  characterClickCount: 0, enabled: true, entry: 0, entryPlayed: {},
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const numberRecord = (value: unknown): Record<string, number> => {
  if (!isRecord(value)) return {};
  const result: Record<string, number> = {};
  for (const [name, item] of Object.entries(value)) {
    if (typeof item === "number" && Number.isFinite(item)) result[name] = item;
  }
  return result;
};

// Dialogue state survives deployments. Older experiments or partially written
// mobile localStorage entries must not be allowed to throw inside a character
// click handler: if persistence is unavailable, dialogue still works for the
// current session without remembering its history.
export function getAmbientState(): AmbientState {
  const defaults = createDefaultState();
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) || "{}");
    if (!isRecord(parsed)) return defaults;
    const pending = Array.isArray(parsed.pending)
      ? parsed.pending.filter((item): item is AmbientState["pending"][number] =>
          isRecord(item) && typeof item.eventType === "string" && isRecord(item.data),
        )
      : [];
    return {
      played: numberRecord(parsed.played),
      cooldowns: numberRecord(parsed.cooldowns),
      pending,
      lastAmbientId: typeof parsed.lastAmbientId === "string" ? parsed.lastAmbientId : undefined,
      manualAmbientHistory: Array.isArray(parsed.manualAmbientHistory)
        ? parsed.manualAmbientHistory.filter((item): item is string => typeof item === "string")
        : [],
      characterClickCount: typeof parsed.characterClickCount === "number" && Number.isFinite(parsed.characterClickCount)
        ? parsed.characterClickCount : 0,
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : true,
      entry: typeof parsed.entry === "number" && Number.isFinite(parsed.entry) ? parsed.entry : 0,
      entryPlayed: numberRecord(parsed.entryPlayed),
    };
  } catch {
    return defaults;
  }
}

export function saveAmbientState(state: AmbientState) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Safari private mode, quota pressure, and blocked storage are non-fatal.
    // The current dialogue remains playable; only its history is not saved.
  }
}
export function canPlay(dialogue: AmbientDialogue, state: AmbientState, now = Date.now()) { return dialogue.enabled && dialogue.lines.length > 0 && (!dialogue.maxTriggers || (state.played[dialogue.id] || 0) < dialogue.maxTriggers) && now >= (state.cooldowns[dialogue.id] || 0) && (!dialogue.oncePerLabEntry || state.entryPlayed[dialogue.id] !== state.entry); }
