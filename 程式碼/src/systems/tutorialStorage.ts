export const TUTORIAL_COMPLETE_KEY = "hasCompletedTutorial";

export function hasCompletedTutorial(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_COMPLETE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markTutorialCompleted(): void {
  try {
    localStorage.setItem(TUTORIAL_COMPLETE_KEY, "true");
  } catch {
    // The tutorial can still finish in restricted storage environments.
  }
}

export function clearTutorialCompleted(): void {
  try {
    localStorage.removeItem(TUTORIAL_COMPLETE_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}
