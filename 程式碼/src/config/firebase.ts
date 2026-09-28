import type { GameConfig } from "./types";

const databaseUrl = (import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined)?.replace(/\/$/, "");
const configPath = (import.meta.env.VITE_FIREBASE_CONFIG_PATH as string | undefined) || "gameConfig/v1";

export function isFirebaseConfigured(): boolean {
  return Boolean(databaseUrl);
}

function endpoint(): string {
  if (!databaseUrl) throw new Error("尚未設定 VITE_FIREBASE_DATABASE_URL");
  return `${databaseUrl}/${configPath}.json`;
}

export async function loadFirebaseConfig(signal?: AbortSignal): Promise<GameConfig | null> {
  const response = await fetch(endpoint(), { signal, cache: "no-store" });
  if (!response.ok) throw new Error(`Firebase 讀取失敗 (${response.status})`);
  return await response.json() as GameConfig | null;
}

export async function saveFirebaseConfig(config: GameConfig): Promise<void> {
  const response = await fetch(endpoint(), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error(`Firebase 儲存失敗 (${response.status})`);
}
