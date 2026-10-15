import type { AmbientDialogue } from "./types";
const key = "sci_ambient_dialogue_state_v1";
export interface AmbientState { played: Record<string, number>; cooldowns: Record<string, number>; pending: Array<{ eventType: string; eventId?: string; data: Record<string, unknown> }>; lastAmbientId?: string; enabled: boolean; entry: number; entryPlayed: Record<string, number>; }
export function getAmbientState(): AmbientState { try { return { played: {}, cooldowns: {}, pending: [], enabled: true, entry: 0, entryPlayed: {}, ...JSON.parse(localStorage.getItem(key) || "{}") }; } catch { return { played: {}, cooldowns: {}, pending: [], enabled: true, entry: 0, entryPlayed: {} }; } }
export function saveAmbientState(state: AmbientState) { localStorage.setItem(key, JSON.stringify(state)); }
export function canPlay(dialogue: AmbientDialogue, state: AmbientState, now = Date.now()) { return dialogue.enabled && dialogue.lines.length > 0 && (!dialogue.maxTriggers || (state.played[dialogue.id] || 0) < dialogue.maxTriggers) && now >= (state.cooldowns[dialogue.id] || 0) && (!dialogue.oncePerLabEntry || state.entryPlayed[dialogue.id] !== state.entry); }
