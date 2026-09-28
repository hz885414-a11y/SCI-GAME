import type { CardReward } from "./gameEvents";
import {
  EVENT_STORAGE_KEYS,
  notifyEventSystemChanged,
  readStoredValue,
  writeStoredValue,
} from "./eventStorage";

export function getTriggeredEvents(): string[] {
  return readStoredValue<string[]>(EVENT_STORAGE_KEYS.triggeredEvents, []);
}

export function getPendingCardRewards(): CardReward[] {
  return readStoredValue<CardReward[]>(EVENT_STORAGE_KEYS.pendingCardRewards, []);
}

export function getPendingEvents(): string[] {
  return getPendingCardRewards().map((reward) => reward.event.id);
}

export function enqueueCardRewards(rewards: CardReward[]): void {
  if (rewards.length === 0) return;
  const queue = getPendingCardRewards();
  const triggered = getTriggeredEvents();
  const queuedRewardIds = new Set(queue.map((reward) => reward.rewardId));
  const triggeredEventIds = new Set(triggered);
  const additions = rewards.filter((reward) => (
    !queuedRewardIds.has(reward.rewardId) && !triggeredEventIds.has(reward.event.id)
  ));
  if (additions.length === 0) return;

  writeStoredValue(EVENT_STORAGE_KEYS.pendingCardRewards, [...queue, ...additions]);
  writeStoredValue(EVENT_STORAGE_KEYS.triggeredEvents, [
    ...triggered,
    ...additions.map((reward) => reward.event.id),
  ]);
  notifyEventSystemChanged();
}

export function completePendingReward(rewardId: string): void {
  writeStoredValue(
    EVENT_STORAGE_KEYS.pendingCardRewards,
    getPendingCardRewards().filter((reward) => reward.rewardId !== rewardId),
  );
  notifyEventSystemChanged();
}

export function completePendingEvent(eventId: string): void {
  const reward = getPendingCardRewards().find((item) => item.event.id === eventId);
  if (reward) completePendingReward(reward.rewardId);
}

export function triggerEvent(eventId: string): boolean {
  void import("./gameEvents").then(({ emitGameEvent }) => (
    emitGameEvent("debug_trigger", { eventId })
  ));
  return Boolean(eventId);
}

// Compatibility hook for the retired local rule evaluator. Reward decisions
// now happen only in POST /api/game-events.
export function evaluateEvents(): string[] {
  return [];
}

export function clearEventRecords(): void {
  writeStoredValue(EVENT_STORAGE_KEYS.triggeredEvents, []);
  writeStoredValue(EVENT_STORAGE_KEYS.pendingEvents, []);
  writeStoredValue(EVENT_STORAGE_KEYS.pendingCardRewards, []);
  notifyEventSystemChanged();
}

export function removeEventRuntimeState(eventId: string): void {
  writeStoredValue(
    EVENT_STORAGE_KEYS.triggeredEvents,
    getTriggeredEvents().filter((id) => id !== eventId),
  );
  writeStoredValue(
    EVENT_STORAGE_KEYS.pendingCardRewards,
    getPendingCardRewards().filter((reward) => reward.event.id !== eventId),
  );
  notifyEventSystemChanged();
}

export function initializeEventManager(): () => void {
  return () => undefined;
}
