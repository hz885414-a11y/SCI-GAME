import { useCallback, useEffect, useRef, useState } from "react";
import { AMBIENT_GAME_EVENT, emitAmbientEvent } from "./events";
import { loadAmbientDialogues } from "./firebase";
import { canPlay, getAmbientState, saveAmbientState } from "./storage";
import type { AmbientDialogue, AmbientDialogueConfig, AmbientDialogueLine } from "./types";
import { DEFAULT_AMBIENT_DIALOGUES } from "./defaults";

export function useAmbientDialogues({ inLab, blocked }: { inLab: boolean; blocked: boolean }) {
  const [config, setConfig] = useState<AmbientDialogueConfig>(DEFAULT_AMBIENT_DIALOGUES);
  const [line, setLine] = useState<AmbientDialogueLine | null>(null);
  const [autoEnabled, setAutoEnabledState] = useState(() => getAmbientState().enabled);
  const configRef = useRef(config); const busy = useRef(false); const timer = useRef<number | null>(null); const idleTimer = useRef<number | null>(null); const advanceRef = useRef<(() => void) | null>(null);
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { const c = new AbortController(); const t = window.setTimeout(() => c.abort(), 4000); loadAmbientDialogues(c.signal).then(setConfig).catch(() => setConfig(DEFAULT_AMBIENT_DIALOGUES)).finally(() => window.clearTimeout(t)); return () => { c.abort(); window.clearTimeout(t); }; }, []);
  useEffect(() => { const onStorage = (e: StorageEvent) => { if (e.key === "sci_ambient_dialogues_updated") loadAmbientDialogues().then(setConfig).catch(() => undefined); }; window.addEventListener("storage", onStorage); return () => window.removeEventListener("storage", onStorage); }, []);
  const stop = useCallback(() => { if (timer.current) window.clearTimeout(timer.current); timer.current = null; advanceRef.current = null; busy.current = false; setLine(null); }, []);
  const play = useCallback((dialogue: AmbientDialogue) => { if (busy.current || blocked || !inLab) return false; busy.current = true; const state = getAmbientState(); state.played[dialogue.id] = (state.played[dialogue.id] || 0) + 1; state.cooldowns[dialogue.id] = Date.now() + Math.max(0, dialogue.cooldownMs); state.entryPlayed[dialogue.id] = state.entry; if (dialogue.category === "ambient") state.lastAmbientId = dialogue.id; saveAmbientState(state); let index = 0; const show = () => { const current = dialogue.lines[index]; setLine(current); timer.current = window.setTimeout(() => advanceRef.current?.(), Math.max(500, current.durationMs || configRef.current.defaultLineDurationMs)); }; advanceRef.current = () => { if (timer.current) window.clearTimeout(timer.current); index += 1; if (index < dialogue.lines.length && inLab && !blocked) show(); else stop(); }; show(); return true; }, [blocked, inLab, stop]);
  const choose = useCallback((eventType?: string, eventId?: string, data: Record<string, unknown> = {}) => { const state = getAmbientState(); const candidates = configRef.current.dialogues.filter((d) => { if (!canPlay(d, state)) return false; if (!eventType) return d.category === "ambient" && d.id !== state.lastAmbientId; const c = d.condition; return d.category === "event" && c?.eventType === eventType && (!c.eventId || c.eventId === eventId) && Object.entries(c.required || {}).every(([key, value]) => data[key] === value) && Math.random() <= (c.chance ?? 1); }); if (!candidates.length) return false; const top = Math.max(...candidates.map((d) => d.priority)); const ranked = candidates.filter((d) => d.priority === top); const total = ranked.reduce((sum, d) => sum + Math.max(1, d.weight), 0); let pick = Math.random() * total; return play(ranked.find((d) => (pick -= Math.max(1, d.weight)) <= 0) || ranked[0]); }, [play]);
  useEffect(() => { const onEvent = (event: Event) => { const detail = (event as CustomEvent<{ eventType: string; eventId?: string; data: Record<string, unknown> }>).detail; if (!detail) return; if (!inLab) { const state = getAmbientState(); state.pending.push(detail); saveAmbientState(state); return; } choose(detail.eventType, detail.eventId, detail.data); }; window.addEventListener(AMBIENT_GAME_EVENT, onEvent); return () => window.removeEventListener(AMBIENT_GAME_EVENT, onEvent); }, [choose, inLab]);
  useEffect(() => { if (!inLab) { stop(); return; } const state = getAmbientState(); state.entry += 1; saveAmbientState(state); emitAmbientEvent("lab_enter"); const pending = [...state.pending]; state.pending = []; saveAmbientState(state); pending.some((p) => choose(p.eventType, p.eventId, p.data)); return stop; }, [inLab, choose, stop]);
  useEffect(() => { if (!inLab || blocked || !autoEnabled || busy.current) return; idleTimer.current = window.setTimeout(() => { choose("lab_idle") || choose(); }, config.idleDelayMs); return () => { if (idleTimer.current) window.clearTimeout(idleTimer.current); }; }, [inLab, blocked, autoEnabled, config.idleDelayMs, choose, line]);
  const setAutoEnabled = (enabled: boolean) => { const state = getAmbientState(); state.enabled = enabled; saveAmbientState(state); setAutoEnabledState(enabled); if (!enabled) stop(); };
  // Character clicks first look for an editor-defined custom event such as
  // `character_leo`. Manual interaction intentionally bypasses *cooldown*
  // for ordinary banter, otherwise a click immediately after auto-play feels
  // broken; max-trigger and enabled limits still apply.
  const advance = () => { if (!busy.current || !advanceRef.current) return false; advanceRef.current(); return true; };
  const triggerCharacter = (characterId: string) => {
    if (choose("custom_event", `character_${characterId}`, { characterId })) return true;
    const state = getAmbientState();
    const candidates = configRef.current.dialogues.filter((dialogue) => dialogue.category === "ambient" && dialogue.enabled && dialogue.lines.length > 0 && (!dialogue.maxTriggers || (state.played[dialogue.id] || 0) < dialogue.maxTriggers));
    if (!candidates.length) return false;
    const top = Math.max(...candidates.map((dialogue) => dialogue.priority));
    const ranked = candidates.filter((dialogue) => dialogue.priority === top);
    return play(ranked[Math.floor(Math.random() * ranked.length)]);
  };
  return { line, autoEnabled, setAutoEnabled, stop, advance, triggerCharacter };
}
