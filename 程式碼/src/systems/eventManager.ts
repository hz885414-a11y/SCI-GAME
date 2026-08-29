import { getAllEventDefinitions, getEventDefinition } from "../data/eventConfig";
import { getPlayerStats } from "./playerStats";
import {
  EVENT_STORAGE_KEYS,
  PLAYER_ACTION_RECORDED,
  notifyEventSystemChanged,
  readStoredValue,
  writeStoredValue,
} from "./eventStorage";

let initialized = false;

export function getTriggeredEvents(): string[] {
  return readStoredValue<string[]>(EVENT_STORAGE_KEYS.triggeredEvents, []);
}

export function getPendingEvents(): string[] {
  return readStoredValue<string[]>(EVENT_STORAGE_KEYS.pendingEvents, []);
}

function saveQueue(queue: string[]): void {
  writeStoredValue(EVENT_STORAGE_KEYS.pendingEvents, queue);
}

export function evaluateEvents(): string[] {
  const stats = getPlayerStats();
  const triggered = getTriggeredEvents();
  const pending = getPendingEvents();
  const newEvents = getAllEventDefinitions().filter((event) => {
    if (event.once && triggered.includes(event.id)) return false;
    if (pending.includes(event.id)) return false;
    return event.triggerType === "actionCount" && stats[event.action] >= event.requiredCount;
  });

  if (newEvents.length > 0) {
    saveQueue([...pending, ...newEvents.map((event) => event.id)]);
    writeStoredValue(EVENT_STORAGE_KEYS.triggeredEvents, [...triggered, ...newEvents.map((event) => event.id)]);
    notifyEventSystemChanged();
  }
  return newEvents.map((event) => event.id);
}

export function triggerEvent(eventId: string): boolean {
  if (!getEventDefinition(eventId)) return false;
  const pending = getPendingEvents();
  if (!pending.includes(eventId)) saveQueue([...pending, eventId]);
  const triggered = getTriggeredEvents();
  if (!triggered.includes(eventId)) {
    writeStoredValue(EVENT_STORAGE_KEYS.triggeredEvents, [...triggered, eventId]);
  }
  notifyEventSystemChanged();
  return true;
}

export function completePendingEvent(eventId: string): void {
  saveQueue(getPendingEvents().filter((id) => id !== eventId));
  notifyEventSystemChanged();
}

export function clearEventRecords(): void {
  writeStoredValue(EVENT_STORAGE_KEYS.triggeredEvents, []);
  saveQueue([]);
  notifyEventSystemChanged();
}

export function removeEventRuntimeState(eventId: string): void {
  writeStoredValue(EVENT_STORAGE_KEYS.triggeredEvents, getTriggeredEvents().filter((id) => id !== eventId));
  saveQueue(getPendingEvents().filter((id) => id !== eventId));
  notifyEventSystemChanged();
}

export function initializeEventManager(): () => void {
  if (typeof window === "undefined" || initialized) return () => undefined;
  initialized = true;
  const handler = () => evaluateEvents();
  window.addEventListener(PLAYER_ACTION_RECORDED, handler);
  evaluateEvents();
  return () => {
    window.removeEventListener(PLAYER_ACTION_RECORDED, handler);
    initialized = false;
  };
}
