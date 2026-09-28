import { useCallback, useEffect, useState } from "react";
import { getOwnedCards } from "./playerCollection";
import { getPendingCardRewards, getTriggeredEvents, initializeEventManager } from "./eventManager";
import { EVENT_SYSTEM_CHANGED } from "./eventStorage";
import { getPlayerStats } from "./playerStats";

export function getEventSystemSnapshot() {
  const pendingRewards = getPendingCardRewards();
  return {
    stats: getPlayerStats(),
    triggeredEvents: getTriggeredEvents(),
    pendingEventIds: pendingRewards.map((reward) => reward.event.id),
    pendingReward: pendingRewards[0],
    pendingEvent: pendingRewards[0]?.event,
    ownedCards: getOwnedCards(),
  };
}

export function useEventSystem() {
  const [snapshot, setSnapshot] = useState(getEventSystemSnapshot);
  const refresh = useCallback(() => setSnapshot(getEventSystemSnapshot()), []);

  useEffect(() => {
    const disposeManager = initializeEventManager();
    window.addEventListener(EVENT_SYSTEM_CHANGED, refresh);
    window.addEventListener("game-config-updated", refresh);
    refresh();
    return () => {
      window.removeEventListener(EVENT_SYSTEM_CHANGED, refresh);
      window.removeEventListener("game-config-updated", refresh);
      disposeManager();
    };
  }, [refresh]);

  return { ...snapshot, refresh };
}
