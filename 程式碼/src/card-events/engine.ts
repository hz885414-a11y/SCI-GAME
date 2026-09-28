import { CARD_EVENT_TYPES, type CardEventPayload, type CardEventResult, type CardRule, type ManagedCard, type UserCardState } from "./types";

const emptyUser = (): UserCardState => ({ stats: {}, eventLog: [], earnedCards: {}, pendingCards: {}, processedEventIds: {}, missionCandidateRuleIds: [], missionCardGranted: false });
const isScalar = (value: unknown): value is string | number | boolean => ["string", "number", "boolean"].includes(typeof value);

export function validateCardEvent(input: unknown): CardEventPayload {
  if (!input || typeof input !== "object") throw new Error("事件格式不正確");
  const event = input as Partial<CardEventPayload>;
  if (!event.eventId || !/^[A-Za-z0-9:_-]{8,160}$/.test(event.eventId)) throw new Error("無效的事件識別碼");
  if (!event.uid || !/^[A-Za-z0-9_-]{8,128}$/.test(event.uid)) throw new Error("無效的玩家識別碼");
  if (!CARD_EVENT_TYPES.includes(event.eventType as typeof CARD_EVENT_TYPES[number])) throw new Error("不支援的事件類型");
  if (!event.data || typeof event.data !== "object" || Array.isArray(event.data) || Object.values(event.data).some((value) => !isScalar(value))) throw new Error("事件資料只可包含文字、數字或布林值");
  const amount = event.amount === undefined ? 1 : Math.floor(Number(event.amount));
  if (!Number.isFinite(amount) || amount < 1 || amount > 1000) throw new Error("事件累積量必須介於 1 到 1000");
  return { eventId: event.eventId, uid: event.uid, eventType: event.eventType as CardEventPayload["eventType"], data: event.data as CardEventPayload["data"], amount };
}

function statUpdates(event: CardEventPayload): Record<string, number> {
  const key = (name: string) => ({ [name]: event.amount || 1 });
  if (event.eventType === "action") return { ...key(`action.${String(event.data.action || "unknown")}`), ...key("actions.total") };
  if (event.eventType === "dialogue") return { ...key("dialogues.total"), ...key(`dialogue.${String(event.data.scenarioId || "unknown")}`) };
  if (event.eventType === "areaVisit") return { ...key("areas.total"), ...key(`area.${String(event.data.areaId || "unknown")}`) };
  if (event.eventType === "bossResult") return { ...key("boss.total"), ...key(event.data.outcome === "victory" ? "boss.wins" : "boss.losses"), ...key(`boss.${String(event.data.bossId || "unknown")}.${String(event.data.outcome || "unknown")}`) };
  if (event.eventType === "quizAnswer") return { ...key("quiz.total"), ...key(event.data.correct === true ? "quiz.correct" : "quiz.incorrect") };
  return { ...key("collectibles.total"), ...key(`collectible.${String(event.data.itemId || "unknown")}`) };
}

function matchesConditions(rule: CardRule, event: CardEventPayload, stats: Record<string, number>): boolean {
  return Object.entries(rule.conditions || {}).every(([key, value]) => {
    if (key === "statKey" || key === "minStat") return true;
    if (key.startsWith("stat.")) return stats[key.slice(5)] >= Number(value);
    return event.data[key] === value;
  });
}

export function processCardEvent(input: CardEventPayload, cards: ManagedCard[], rules: CardRule[], stored?: Partial<UserCardState>): { state: UserCardState; result: CardEventResult } {
  const state: UserCardState = {
    ...emptyUser(), ...stored,
    stats: { ...(stored?.stats || {}) }, eventLog: [...(stored?.eventLog || [])].slice(-99), earnedCards: { ...(stored?.earnedCards || {}) }, pendingCards: { ...(stored?.pendingCards || {}) }, processedEventIds: { ...(stored?.processedEventIds || {}) }, missionCandidateRuleIds: [...(stored?.missionCandidateRuleIds || [])], missionCardGranted: Boolean(stored?.missionCardGranted),
  };
  if (state.processedEventIds[input.eventId]) {
    return { state, result: { stats: state.stats, awardedCard: null, awardedCards: [], pendingCardIds: Object.keys(state.pendingCards) } };
  }
  state.processedEventIds[input.eventId] = new Date().toISOString();
  const processedIds = Object.keys(state.processedEventIds);
  if (processedIds.length > 500) delete state.processedEventIds[processedIds[0]];
  state.eventLog.push({ eventId: input.eventId, eventType: input.eventType, data: input.data, amount: input.amount || 1, receivedAt: new Date().toISOString() });
  for (const [key, value] of Object.entries(statUpdates(input))) state.stats[key] = (state.stats[key] || 0) + value;
  const action = String(input.data.action || "");
  if (input.eventType === "action" && action === "startMission") {
    state.missionCandidateRuleIds = [];
    state.missionCardGranted = false;
  }
  const cardById = new Map(cards.filter((card) => card.enabled).map((card) => [card.id, card]));
  const candidates = rules.filter((rule) => {
    const statKey = String(rule.conditions?.statKey || `event.${input.eventType}`);
    return rule.enabled && rule.triggerType === input.eventType && cardById.has(rule.cardId)
      && !state.earnedCards[rule.cardId]
      && (state.stats[statKey] || 0) >= Math.max(1, rule.requiredCount)
      && matchesConditions(rule, input, state.stats);
  }).sort((a, b) => b.priority - a.priority || a.cardId.localeCompare(b.cardId));
  for (const candidate of candidates) if (!state.missionCandidateRuleIds.includes(candidate.id)) state.missionCandidateRuleIds.push(candidate.id);
  const missionEnded = input.eventType === "action" && (action === "gameOver" || action === "stagesCleared");
  const missionCandidates = state.missionCandidateRuleIds.map((id) => rules.find((rule) => rule.id === id)).filter((rule): rule is CardRule => Boolean(rule) && !state.earnedCards[rule!.cardId] && cardById.has(rule!.cardId)).sort((a, b) => b.priority - a.priority || a.cardId.localeCompare(b.cardId));
  const now = new Date().toISOString();
  const winner = missionEnded && !state.missionCardGranted ? missionCandidates[0] : undefined;
  const awardedCard = winner ? cardById.get(winner.cardId)! : null;
  if (winner) { state.earnedCards[winner.cardId] = { cardId: winner.cardId, ruleId: winner.id, earnedAt: now }; state.missionCardGranted = true; }
  return {
    state,
    result: {
      stats: state.stats,
      awardedCard,
      awardedCards: awardedCard ? [awardedCard] : [],
      pendingCardIds: Object.keys(state.pendingCards),
    },
  };
}
