export const PROLOGUE_SEEN_KEY = "hasSeenPrologue";

export function hasSeenPrologue(): boolean {
  try {
    return localStorage.getItem(PROLOGUE_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function markPrologueSeen(): void {
  try {
    localStorage.setItem(PROLOGUE_SEEN_KEY, "true");
  } catch {
    // The current session can continue even when storage is unavailable.
  }
}

export function clearPrologueSeen(): void {
  try {
    localStorage.removeItem(PROLOGUE_SEEN_KEY);
  } catch {
    // The reset can continue even when storage is unavailable.
  }
}
