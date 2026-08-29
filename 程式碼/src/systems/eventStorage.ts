export const EVENT_STORAGE_KEYS = {
  playerStats: "sci_knowledge_player_stats",
  triggeredEvents: "sci_knowledge_triggered_events",
  ownedCards: "sci_knowledge_owned_cards",
  pendingEvents: "sci_knowledge_pending_events",
} as const;

export const EVENT_SYSTEM_CHANGED = "sci:event-system-changed";
export const PLAYER_ACTION_RECORDED = "sci:player-action-recorded";

export function readStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredValue<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Unable to save event-system progress.", error);
  }
}

export function notifyEventSystemChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_SYSTEM_CHANGED));
}

