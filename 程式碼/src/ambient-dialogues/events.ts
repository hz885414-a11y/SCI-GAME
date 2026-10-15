export const AMBIENT_GAME_EVENT = "sci:ambient-game-event";
export function emitAmbientEvent(eventType: string, data: Record<string, unknown> = {}) { window.dispatchEvent(new CustomEvent(AMBIENT_GAME_EVENT, { detail: { eventType, eventId: typeof data.eventId === "string" ? data.eventId : undefined, data } })); }
