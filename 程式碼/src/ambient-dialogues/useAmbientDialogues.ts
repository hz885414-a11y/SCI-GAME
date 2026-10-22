import { useCallback, useEffect, useRef, useState } from "react";
import { AMBIENT_GAME_EVENT, emitAmbientEvent } from "./events";
import { loadAmbientDialogues } from "./firebase";
import { canPlay, getAmbientState, saveAmbientState } from "./storage";
import type { AmbientDialogue, AmbientDialogueConfig, AmbientDialogueLine } from "./types";
import { DEFAULT_AMBIENT_DIALOGUES } from "./defaults";

// Mobile touch can produce very dense repeated click events. Keeping one
// accepted action per 350ms makes dialogue readable and prevents rapid UI
// churn while large portrait images are still resident in mobile memory.
const MANUAL_TAP_GUARD_MS = 350;

export function useAmbientDialogues({ inLab, blocked }: { inLab: boolean; blocked: boolean }) {
  const [config, setConfig] = useState<AmbientDialogueConfig>(DEFAULT_AMBIENT_DIALOGUES);
  const [line, setLine] = useState<AmbientDialogueLine | null>(null);
  const [autoEnabled, setAutoEnabledState] = useState(() => getAmbientState().enabled);
  const configRef = useRef(config);
  const busy = useRef(false);
  const timer = useRef<number | null>(null);
  const idleTimer = useRef<number | null>(null);
  const advanceRef = useRef<(() => void) | null>(null);
  const playbackId = useRef(0);
  const lastManualTapAt = useRef(0);

  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4000);
    loadAmbientDialogues(controller.signal).then(setConfig).catch(() => setConfig(DEFAULT_AMBIENT_DIALOGUES)).finally(() => window.clearTimeout(timeout));
    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, []);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "sci_ambient_dialogues_updated") loadAmbientDialogues().then(setConfig).catch(() => undefined);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const stop = useCallback(() => {
    playbackId.current += 1;
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    advanceRef.current = null;
    busy.current = false;
    setLine(null);
  }, []);

  const play = useCallback((dialogue: AmbientDialogue) => {
    if (busy.current || blocked || !inLab || !Array.isArray(dialogue.lines) || dialogue.lines.length === 0) return false;
    const lines = dialogue.lines.filter((item): item is AmbientDialogueLine => Boolean(item?.speaker && typeof item.text === "string"));
    if (!lines.length) return false;
    busy.current = true;
    const currentPlayback = playbackId.current + 1;
    playbackId.current = currentPlayback;
    const state = getAmbientState();
    state.played[dialogue.id] = (state.played[dialogue.id] || 0) + 1;
    state.cooldowns[dialogue.id] = Date.now() + Math.max(0, Number(dialogue.cooldownMs) || 0);
    state.entryPlayed[dialogue.id] = state.entry;
    if (dialogue.category === "ambient") state.lastAmbientId = dialogue.id;
    saveAmbientState(state);
    let index = 0;
    const finish = () => { if (playbackId.current === currentPlayback) stop(); };
    const show = () => {
      if (playbackId.current !== currentPlayback) return;
      const current = lines[index];
      if (!current) { finish(); return; }
      setLine(current);
      const duration = Math.max(500, Number(current.durationMs) || configRef.current.defaultLineDurationMs || 3000);
      timer.current = window.setTimeout(() => advanceRef.current?.(), duration);
    };
    advanceRef.current = () => {
      if (playbackId.current !== currentPlayback) return;
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
      index += 1;
      if (index < lines.length && inLab && !blocked) show(); else finish();
    };
    show();
    return true;
  }, [blocked, inLab, stop]);

  const choose = useCallback((eventType?: string, eventId?: string, data: Record<string, unknown> = {}) => {
    const state = getAmbientState();
    const candidates = configRef.current.dialogues.filter((dialogue) => {
      if (!canPlay(dialogue, state)) return false;
      if (!eventType) return dialogue.category === "ambient" && dialogue.id !== state.lastAmbientId;
      const condition = dialogue.condition;
      return dialogue.category === "event" && condition?.eventType === eventType && (!condition.eventId || condition.eventId === eventId) && Object.entries(condition.required || {}).every(([key, value]) => condition.eventType === "character_click_count" && key === "clickCount" ? Number(data[key]) >= Number(value) : data[key] === value) && Math.random() <= (condition.chance ?? 1);
    });
    if (!candidates.length) return false;
    const priority = Math.max(...candidates.map((dialogue) => dialogue.priority));
    const ranked = candidates.filter((dialogue) => dialogue.priority === priority);
    const totalWeight = ranked.reduce((sum, dialogue) => sum + Math.max(1, dialogue.weight), 0);
    let pick = Math.random() * totalWeight;
    return play(ranked.find((dialogue) => (pick -= Math.max(1, dialogue.weight)) <= 0) || ranked[0]);
  }, [play]);

  useEffect(() => {
    const onEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ eventType: string; eventId?: string; data: Record<string, unknown> }>).detail;
      if (!detail) return;
      if (!inLab) {
        const state = getAmbientState();
        state.pending.push(detail);
        saveAmbientState(state);
        return;
      }
      choose(detail.eventType, detail.eventId, detail.data);
    };
    window.addEventListener(AMBIENT_GAME_EVENT, onEvent);
    return () => window.removeEventListener(AMBIENT_GAME_EVENT, onEvent);
  }, [choose, inLab]);
  useEffect(() => {
    if (!inLab) { stop(); return; }
    const state = getAmbientState();
    state.entry += 1;
    saveAmbientState(state);
    emitAmbientEvent("lab_enter");
    const pending = [...state.pending];
    state.pending = [];
    saveAmbientState(state);
    pending.some((item) => choose(item.eventType, item.eventId, item.data));
    return stop;
  }, [inLab, choose, stop]);
  useEffect(() => {
    if (!inLab || blocked || !autoEnabled || busy.current) return;
    // Keep the lab's daily chatter responsive even when an older remote
    // configuration still carries the former 12-second value.
    idleTimer.current = window.setTimeout(() => { choose("lab_idle") || choose(); }, 10_000);
    return () => { if (idleTimer.current !== null) window.clearTimeout(idleTimer.current); };
  }, [inLab, blocked, autoEnabled, config.idleDelayMs, choose, line]);

  const setAutoEnabled = (enabled: boolean) => {
    const state = getAmbientState();
    state.enabled = enabled;
    saveAmbientState(state);
    setAutoEnabledState(enabled);
    if (!enabled) stop();
  };
  const acceptManualTap = () => {
    const now = Date.now();
    if (now - lastManualTapAt.current < MANUAL_TAP_GUARD_MS) return false;
    lastManualTapAt.current = now;
    return true;
  };
  const advance = () => {
    if (!busy.current || !advanceRef.current || !acceptManualTap()) return false;
    advanceRef.current();
    return true;
  };
  const triggerCharacter = (characterId: string) => {
    // A character tap starts one complete ambient sequence. Do not let a
    // second tap skip lines or enqueue replacement dialogue while it is still
    // playing; this is the hard input lock needed for lower-memory phones.
    if (busy.current) return false;
    if (!acceptManualTap()) return false;
    const clickState = getAmbientState();
    clickState.characterClickCount = (clickState.characterClickCount || 0) + 1;
    saveAmbientState(clickState);
    if (choose("character_click_count", undefined, { clickCount: clickState.characterClickCount })) return true;
    if (choose("custom_event", `character_${characterId}`, { characterId })) return true;
    const state = getAmbientState();
    const candidates = configRef.current.dialogues.filter((dialogue) => dialogue.category === "ambient" && dialogue.enabled && dialogue.lines.length > 0 && (!dialogue.maxTriggers || (state.played[dialogue.id] || 0) < dialogue.maxTriggers));
    if (!candidates.length) return false;
    const priority = Math.max(...candidates.map((dialogue) => dialogue.priority));
    const ranked = candidates.filter((dialogue) => dialogue.priority === priority);
    const previousIds = state.manualAmbientHistory || [];
    // A manual tap draws from a shuffled-style pool: do not repeat a dialogue
    // until every currently eligible dialogue in this priority group was heard.
    let available = ranked.filter((dialogue) => !previousIds.includes(dialogue.id));
    if (!available.length) {
      state.manualAmbientHistory = [];
      available = ranked;
    }
    const selected = available[Math.floor(Math.random() * available.length)];
    state.manualAmbientHistory = [...(state.manualAmbientHistory || []), selected.id];
    saveAmbientState(state);
    return play(selected);
  };
  // Read the ref directly so an immediately following touch event cannot slip
  // through before React has painted `line` for the first accepted tap.
  const isPlaying = () => busy.current;
  return { line, autoEnabled, setAutoEnabled, stop, advance, triggerCharacter, isPlaying };
}
