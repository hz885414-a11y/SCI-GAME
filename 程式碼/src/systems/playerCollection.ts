import { getCardDefinition } from "../data/cardDatabase";
import { EVENT_STORAGE_KEYS, notifyEventSystemChanged, readStoredValue, writeStoredValue } from "./eventStorage";

export function getOwnedCards(): string[] {
  return readStoredValue<string[]>(EVENT_STORAGE_KEYS.ownedCards, []);
}

export function hasCard(cardId: string): boolean {
  return getOwnedCards().includes(cardId);
}

export function unlockCard(cardId: string): boolean {
  if (!getCardDefinition(cardId) || hasCard(cardId)) return false;
  writeStoredValue(EVENT_STORAGE_KEYS.ownedCards, [...getOwnedCards(), cardId]);
  notifyEventSystemChanged();
  return true;
}

export function clearCardCollection(): void {
  writeStoredValue(EVENT_STORAGE_KEYS.ownedCards, []);
  notifyEventSystemChanged();
}

