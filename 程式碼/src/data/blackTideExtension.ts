/**
 * Dormant progression scaffold for future Black Tide time extensions.
 *
 * Nothing imports this module during gameplay yet, so the current 30-second
 * Shelter Perimeter countdown stays unchanged. When the story event and base
 * UI are designed, wire their result into this state and use
 * `getBlackTideCountdownSeconds` when a mission timer begins.
 */
export const BLACK_TIDE_EXTENSION_CONFIG = {
  /** Future event identifier; intentionally not registered until its story is approved. */
  unlockEventId: "black_tide_extension_unlocked",
  storageKey: "squad_black_tide_extension_progress",
  baseCountdownSeconds: 30,
  secondsPerBaseUpgradeLevel: 5,
  maxBaseUpgradeLevel: 5,
  secondsPerFieldItem: 10,
} as const;

export interface BlackTideExtensionProgress {
  /** Set only after the future story event is implemented. */
  unlocked: boolean;
  /** Future base upgrade level, clamped to the configured maximum. */
  baseUpgradeLevel: number;
  /** One-run item bonuses, reset by the caller at the next mission start. */
  pendingFieldItemSeconds: number;
}

export const createDefaultBlackTideExtensionProgress = (): BlackTideExtensionProgress => ({
  unlocked: false,
  baseUpgradeLevel: 0,
  pendingFieldItemSeconds: 0,
});

export function normalizeBlackTideExtensionProgress(value: Partial<BlackTideExtensionProgress> | null | undefined): BlackTideExtensionProgress {
  const defaults = createDefaultBlackTideExtensionProgress();
  return {
    unlocked: value?.unlocked === true,
    baseUpgradeLevel: Math.max(0, Math.min(
      BLACK_TIDE_EXTENSION_CONFIG.maxBaseUpgradeLevel,
      Math.floor(Number(value?.baseUpgradeLevel) || 0),
    )),
    pendingFieldItemSeconds: Math.max(0, Math.floor(Number(value?.pendingFieldItemSeconds) || 0)),
  };
}

export function loadBlackTideExtensionProgress(): BlackTideExtensionProgress {
  try {
    const raw = localStorage.getItem(BLACK_TIDE_EXTENSION_CONFIG.storageKey);
    return raw ? normalizeBlackTideExtensionProgress(JSON.parse(raw)) : createDefaultBlackTideExtensionProgress();
  } catch {
    return createDefaultBlackTideExtensionProgress();
  }
}

export function saveBlackTideExtensionProgress(progress: BlackTideExtensionProgress): BlackTideExtensionProgress {
  const normalized = normalizeBlackTideExtensionProgress(progress);
  try {
    localStorage.setItem(BLACK_TIDE_EXTENSION_CONFIG.storageKey, JSON.stringify(normalized));
  } catch {
    // Persistence is optional; callers retain the normalized in-memory state.
  }
  return normalized;
}

/**
 * Returns the length of a Black Tide countdown after future unlocks/upgrades.
 * Until `unlocked` becomes true, this deliberately returns the authored base.
 */
export function getBlackTideCountdownSeconds(
  baseSeconds: number,
  progress: BlackTideExtensionProgress,
): number {
  const normalized = normalizeBlackTideExtensionProgress(progress);
  if (!normalized.unlocked) return Math.max(1, Math.floor(baseSeconds));
  return Math.max(1, Math.floor(baseSeconds))
    + normalized.baseUpgradeLevel * BLACK_TIDE_EXTENSION_CONFIG.secondsPerBaseUpgradeLevel
    + normalized.pendingFieldItemSeconds;
}

/** Future field-item hook: grants one 10-second extension for the current run. */
export function applyBlackTideFieldItem(progress: BlackTideExtensionProgress): BlackTideExtensionProgress {
  const normalized = normalizeBlackTideExtensionProgress(progress);
  if (!normalized.unlocked) return normalized;
  return {
    ...normalized,
    pendingFieldItemSeconds: normalized.pendingFieldItemSeconds + BLACK_TIDE_EXTENSION_CONFIG.secondsPerFieldItem,
  };
}
