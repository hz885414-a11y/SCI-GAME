import { useCallback, useEffect, useState } from "react";
import { getEventDefinition } from "../data/eventConfig";
import { getOwnedCards } from "./playerCollection";
import { getPendingEvents, getTriggeredEvents, initializeEventManager } from "./eventManager";
import { EVENT_SYSTEM_CHANGED } from "./eventStorage";
import { getPlayerStats } from "./playerStats";

export function getEventSystemSnapshot() {
  const pendingEventIds = getPendingEvents();
  return {
    stats: getPlayerStats(),
    triggeredEvents: getTriggeredEvents(),
    pendingEventIds,
    pendingEvent: pendingEventIds.length > 0 ? getEventDefinition(pendingEventIds[0]) : undefined,
    ownedCards: getOwnedCards(),
  };
}

export function useEventSystem() {
  const [snapshot, setSnapshot] = useState(getEventSystemSnapshot);
  const refresh = useCallback(() => setSnapshot(getEventSystemSnapshot()), []);

  useEffect(() => {
    const disposeManager = initializeEventManager();
    window.addEventListener(EVENT_SYSTEM_CHANGED, refresh);
    refresh();
    return () => {
      window.removeEventListener(EVENT_SYSTEM_CHANGED, refresh);
      disposeManager();
    };
  }, [refresh]);

  return { ...snapshot, refresh };
}
