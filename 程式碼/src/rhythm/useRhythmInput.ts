import { useEffect } from "react";
import type { RhythmLane } from "./types";

const KEY_TO_LANE: Record<string, RhythmLane> = { a: "A", b: "B", c: "C", d: "D" };

/** Keyboard input controller kept separate from the game renderer. */
export function useRhythmInput(enabled: boolean, onDown: (lane: RhythmLane) => void, onUp: (lane: RhythmLane) => void) {
  useEffect(() => {
    if (!enabled) return;
    const down = (event: KeyboardEvent) => {
      const lane = KEY_TO_LANE[event.key.toLowerCase()];
      if (!lane || event.repeat) return;
      event.preventDefault();
      onDown(lane);
    };
    const up = (event: KeyboardEvent) => {
      const lane = KEY_TO_LANE[event.key.toLowerCase()];
      if (!lane) return;
      event.preventDefault();
      onUp(lane);
    };
    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up, { passive: false });
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [enabled, onDown, onUp]);
}
