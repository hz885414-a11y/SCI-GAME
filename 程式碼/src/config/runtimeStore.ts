import type { GameConfig } from "./types";

let runtimeConfig: GameConfig | null = null;

export function setRuntimeConfig(config: GameConfig): void {
  runtimeConfig = config;
  if (typeof window !== "undefined") window.dispatchEvent(new Event("game-config-updated"));
}

export function getRuntimeConfig(): GameConfig | null {
  return runtimeConfig;
}
