import { useEffect } from "react";
import type { RhythmLane } from "./types";

const KEY_TO_LANE: Record<string, RhythmLane> = { z: "A", x: "B", c: "C", v: "D" };

/** Keyboard input controller kept separate from the game renderer. */
export function useRhythmInput(enabled: boolean, onDown: (lane: RhythmLane) => void, onUp: (lane: RhythmLane) => void) {
  useEffect(() => {
    if (!enabled) return;
    const down = (event: KeyboardEvent) => {
      const lane = KEY_TO_LANE[event.key.toLowerCase()];
      if (!lane || event.repeat) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      onDown(lane);
    };
    const up = (event: KeyboardEvent) => {
      const lane = KEY_TO_LANE[event.key.toLowerCase()];
      if (!lane) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      onUp(lane);
    };
    const options = { capture: true, passive: false };
    window.addEventListener("keydown", down, options);
    window.addEventListener("keyup", up, options);
    return () => { window.removeEventListener("keydown", down, options); window.removeEventListener("keyup", up, options); };
  }, [enabled, onDown, onUp]);
}
