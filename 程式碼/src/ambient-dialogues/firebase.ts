import { isFirebaseConfigured } from "../config/firebase";
import { DEFAULT_AMBIENT_DIALOGUES } from "./defaults";
import type { AmbientDialogueConfig } from "./types";
const url = (import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined)?.replace(/\/$/, "");
const path = (import.meta.env.VITE_AMBIENT_DIALOGUES_PATH as string | undefined) || "ambientDialogues/v1";
const endpoint = () => { if (!url) throw new Error("尚未設定 VITE_FIREBASE_DATABASE_URL"); return `${url}/${path}.json`; };
export async function loadAmbientDialogues(signal?: AbortSignal): Promise<AmbientDialogueConfig> { if (!isFirebaseConfigured()) return DEFAULT_AMBIENT_DIALOGUES; const response = await fetch(endpoint(), { signal, cache: "no-store" }); if (!response.ok) throw new Error(`Firebase 讀取失敗 (${response.status})`); const remote = await response.json() as Partial<AmbientDialogueConfig> | null; return remote ? { ...DEFAULT_AMBIENT_DIALOGUES, ...remote, dialogues: remote.dialogues?.length ? remote.dialogues : DEFAULT_AMBIENT_DIALOGUES.dialogues } : DEFAULT_AMBIENT_DIALOGUES; }
export async function saveAmbientDialogues(config: AmbientDialogueConfig): Promise<void> { const response = await fetch(endpoint(), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) }); if (!response.ok) throw new Error(`Firebase 儲存失敗 (${response.status})`); }
