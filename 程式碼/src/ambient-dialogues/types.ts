export type AmbientCharacterId = "claire" | "ethan" | "leo" | (string & {});
export type AmbientExpression = "normal" | "happy" | "angry" | "sad" | "surprised";
export type AmbientEventType = "lab_enter" | "lab_idle" | "research_start" | "research_success" | "research_fail" | "boss_defeated" | "card_obtained" | "item_obtained" | "quest_completed" | "player_return" | "custom_event" | (string & {});

export interface AmbientDialogueLine { speaker: AmbientCharacterId; text: string; expression: AmbientExpression; durationMs: number; }
export interface AmbientDialogueCondition { eventType?: AmbientEventType; eventId?: string; required?: Record<string, string | number | boolean>; chance?: number; }
export interface AmbientDialogue { id: string; name: string; category: "ambient" | "event"; enabled: boolean; priority: number; weight: number; cooldownMs: number; maxTriggers: number; oncePerLabEntry?: boolean; condition?: AmbientDialogueCondition; lines: AmbientDialogueLine[]; createdAt: string; updatedAt: string; }
export interface AmbientDialogueConfig { version: 1; updatedAt: string; defaultLineDurationMs: number; idleDelayMs: number; dialogues: AmbientDialogue[]; }
