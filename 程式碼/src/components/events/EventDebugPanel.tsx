import React, { useMemo, useState } from "react";
import { EVENT_CONFIG, deleteEventDefinition, getAllEventDefinitions, getCustomEventDefinitions, saveCustomEventDefinition } from "../../data/eventConfig";
import { CARD_DATABASE, getAllCardDefinitions, getCustomCardDefinitions, saveCustomCardDefinition, type KnowledgeCardCategory, type KnowledgeCardDefinition } from "../../data/cardDatabase";
import { clearEventRecords, evaluateEvents, removeEventRuntimeState, triggerEvent } from "../../systems/eventManager";
import { notifyEventSystemChanged } from "../../systems/eventStorage";
import { clearCardCollection } from "../../systems/playerCollection";
import { PLAYER_ACTIONS, PLAYER_ACTION_INFO, recordAction, resetPlayerStats, type PlayerAction } from "../../systems/playerStats";
import { useEventSystem } from "../../systems/useEventSystem";

type DebugPage = "stats" | "cards" | "events" | "create" | "createCard";
type CardFilter = "all" | "configured" | "missing";
type EventSourceFilter = "all" | "builtIn" | "custom" | "overridden";
type DefinitionSource = "builtIn" | "custom" | "overridden";

function CardSetupRow({ card, configured, source, onEdit }: { card: KnowledgeCardDefinition; configured: boolean; source: DefinitionSource; onEdit: () => void }) {
  const [imageState, setImageState] = useState<"checking" | "ready" | "missing">(card.image ? "checking" : "missing");
  return (
    <article className={`relative flex gap-3 border p-3 ${configured ? "border-emerald-800/70 bg-emerald-950/15" : "border-dashed border-amber-600/80 bg-amber-950/15"}`}>
      <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden border border-zinc-700 bg-black text-2xl">
        <span>{card.icon}</span>
        {card.image && <img src={card.image} alt="" onLoad={() => setImageState("ready")} onError={(event) => { event.currentTarget.style.display = "none"; setImageState("missing"); }} className="absolute inset-0 h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <b className="text-sm text-white">{card.title}</b>
          <span className={`px-1.5 py-0.5 text-[8px] ${source === "custom" ? "bg-fuchsia-950 text-fuchsia-300" : source === "overridden" ? "bg-cyan-950 text-cyan-300" : "bg-zinc-900 text-zinc-500"}`}>{source === "custom" ? "自訂卡片" : source === "overridden" ? "已修改" : "內建卡片"}</span>
          <span className={`px-1.5 py-0.5 text-[8px] font-black ${configured ? "bg-emerald-900/60 text-emerald-300" : "bg-amber-900/60 text-amber-200"}`}>{configured ? "事件已設定" : "等待設定事件"}</span>
          <span className={`px-1.5 py-0.5 text-[8px] ${imageState === "ready" ? "bg-cyan-950 text-cyan-300" : imageState === "missing" ? "bg-red-950 text-red-300" : "bg-zinc-900 text-zinc-500"}`}>{imageState === "ready" ? "圖片正常" : imageState === "missing" ? "圖片待補" : "檢查圖片"}</span>
        </div>
        <p className="mt-1 font-mono text-[8px] text-zinc-600">{card.id} · {card.category}</p>
        <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-zinc-400">{card.description}</p>
        {!configured && <p className="mt-2 text-[9px] font-bold text-amber-400">請到「新增事件」頁選擇這張卡片並設定觸發條件。</p>}
        <button type="button" onClick={onEdit} className="mt-2 border border-cyan-800 px-2 py-1 text-[9px] font-bold text-cyan-300 hover:bg-cyan-950/40">編輯卡片</button>
      </div>
    </article>
  );
}

export function EventDebugPanel() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<DebugPage>("stats");
  const [cardFilter, setCardFilter] = useState<CardFilter>("all");
  const [selectedAction, setSelectedAction] = useState<PlayerAction>("killEnemy");
  const [selectedEvent, setSelectedEvent] = useState(EVENT_CONFIG[0]?.id || "");
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [eventSearch, setEventSearch] = useState("");
  const [eventActionFilter, setEventActionFilter] = useState<"all" | PlayerAction>("all");
  const [eventSourceFilter, setEventSourceFilter] = useState<EventSourceFilter>("all");
  const [notice, setNotice] = useState("");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [form, setForm] = useState({ id: "", title: "", content: "", icon: "✨", action: "killEnemy" as PlayerAction, requiredCount: 1, rewardCard: CARD_DATABASE[0]?.id || "" });
  const [cardForm, setCardForm] = useState({ id: "", category: "lighting" as KnowledgeCardCategory, icon: "💡", title: "", description: "", industryNote: "", image: "" });
  const snapshot = useEventSystem();
  const allEvents = getAllEventDefinitions();
  const allCards = getAllCardDefinitions();
  const customEventIds = new Set(getCustomEventDefinitions().map((event) => event.id));
  const customCardIds = new Set(getCustomCardDefinitions().map((card) => card.id));
  const builtInEventIds = new Set(EVENT_CONFIG.map((event) => event.id));
  const builtInCardIds = new Set(CARD_DATABASE.map((card) => card.id));
  const configuredCardIds = new Set(allEvents.map((event) => event.rewardCard));
  const filteredCards = useMemo(() => allCards.filter((card) => {
    if (cardFilter === "configured") return configuredCardIds.has(card.id);
    if (cardFilter === "missing") return !configuredCardIds.has(card.id);
    return true;
  }), [cardFilter, allEvents.length, allCards.length]);
  const filteredEvents = useMemo(() => allEvents.filter((gameEvent) => {
    const query = eventSearch.trim().toLowerCase();
    const matchesSearch = !query || `${gameEvent.title} ${gameEvent.id} ${gameEvent.rewardCard}`.toLowerCase().includes(query);
    const matchesAction = eventActionFilter === "all" || gameEvent.action === eventActionFilter;
    const isStoredCustom = customEventIds.has(gameEvent.id);
    const isBuiltIn = builtInEventIds.has(gameEvent.id);
    const source: DefinitionSource = isStoredCustom && isBuiltIn ? "overridden" : isStoredCustom ? "custom" : "builtIn";
    const matchesSource = eventSourceFilter === "all" || eventSourceFilter === source;
    return matchesSearch && matchesAction && matchesSource;
  }), [allEvents.length, customEventIds.size, eventActionFilter, eventSearch, eventSourceFilter]);

  const debugEnabled = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.localStorage.getItem("sci_event_debug") === "true");
  if (!debugEnabled) return null;

  const addAction = () => {
    recordAction(selectedAction);
    snapshot.refresh();
    setNotice(`已增加「${PLAYER_ACTION_INFO[selectedAction].label}」1 次`);
  };

  const startNewEvent = () => {
    setEditingEventId(null);
    setForm({ id: "", title: "", content: "", icon: "✨", action: "killEnemy", requiredCount: 1, rewardCard: allCards[0]?.id || "" });
    setNotice("");
    setPage("create");
  };

  const editEvent = (eventId: string) => {
    const gameEvent = allEvents.find((item) => item.id === eventId);
    if (!gameEvent) return;
    setEditingEventId(eventId);
    setForm({ id: gameEvent.id, title: gameEvent.title, content: gameEvent.content, icon: gameEvent.icon, action: gameEvent.action, requiredCount: gameEvent.requiredCount, rewardCard: gameEvent.rewardCard });
    setNotice(`正在編輯「${gameEvent.title}」。事件代碼會保留，避免產生重複資料。`);
    setPage("create");
  };

  const startNewCard = () => {
    setEditingCardId(null);
    setCardForm({ id: "", category: "lighting", icon: "💡", title: "", description: "", industryNote: "", image: "" });
    setNotice("");
    setPage("createCard");
  };

  const editCard = (cardId: string) => {
    const card = allCards.find((item) => item.id === cardId);
    if (!card) return;
    setEditingCardId(cardId);
    setCardForm({ id: card.id, category: card.category, icon: card.icon, title: card.title, description: card.description, industryNote: card.industryNote, image: card.image });
    setNotice(`正在編輯「${card.title}」。卡片代碼會保留，避免產生重複資料。`);
    setPage("createCard");
  };

  const createEvent = () => {
    const cleanId = form.id.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
    if (!cleanId || !form.title.trim() || !form.content.trim()) {
      setNotice("請填寫事件代碼、標題與事件內容。");
      return;
    }
    const eventId = cleanId.startsWith("event_") ? cleanId : `event_${cleanId}`;
    if (!editingEventId && allEvents.some((event) => event.id === eventId)) {
      setNotice("這個事件代碼已存在；請直接從事件列表按「編輯」，或使用另一個代碼。");
      return;
    }
    saveCustomEventDefinition({ id: eventId, title: form.title.trim(), content: form.content.trim(), icon: form.icon.trim() || "✨", triggerType: "actionCount", action: form.action, requiredCount: Math.max(1, Number(form.requiredCount) || 1), rewardCard: form.rewardCard, once: true });
    if (editingEventId) removeEventRuntimeState(eventId);
    evaluateEvents();
    notifyEventSystemChanged();
    snapshot.refresh();
    setSelectedEvent(eventId);
    setNotice(`事件「${form.title.trim()}」已${editingEventId ? "更新並重新開始監測" : "儲存並開始監測"}。`);
    setEditingEventId(null);
    setPage("events");
  };

  const deleteSingleEvent = (eventId: string) => {
    deleteEventDefinition(eventId);
    removeEventRuntimeState(eventId);
    setSelectedEventIds((ids) => ids.filter((id) => id !== eventId));
    snapshot.refresh();
    setNotice("事件已刪除，對應卡片會重新顯示為待設定。");
  };

  const deleteSelectedEvents = () => {
    selectedEventIds.forEach((eventId) => {
      deleteEventDefinition(eventId);
      removeEventRuntimeState(eventId);
    });
    setNotice(`已刪除 ${selectedEventIds.length} 個事件。`);
    setSelectedEventIds([]);
    snapshot.refresh();
  };

  const createCard = () => {
    const cleanId = cardForm.id.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
    if (!cleanId || !cardForm.title.trim() || !cardForm.description.trim()) {
      setNotice("請填寫卡片代碼、標題與主要說明。");
      return;
    }
    const cardId = cleanId.startsWith("card_") ? cleanId : `card_${cleanId}`;
    if (!editingCardId && allCards.some((card) => card.id === cardId)) {
      setNotice("這個卡片代碼已存在；請直接從卡片列表按「編輯」，或使用另一個代碼。");
      return;
    }
    saveCustomCardDefinition({ id: cardId, category: cardForm.category, icon: cardForm.icon.trim() || "📘", title: cardForm.title.trim(), description: cardForm.description.trim(), industryNote: cardForm.industryNote.trim() || "產業補充內容尚待完善。", image: cardForm.image.trim() });
    notifyEventSystemChanged();
    snapshot.refresh();
    if (editingCardId) {
      setNotice(`卡片「${cardForm.title.trim()}」已更新。`);
      setEditingCardId(null);
      setPage("cards");
    } else {
      setForm((current) => ({ ...current, rewardCard: cardId }));
      setNotice(`卡片「${cardForm.title.trim()}」已新增，請繼續設定對應事件。`);
      setPage("create");
    }
  };

  const tabs: Array<{ id: DebugPage; label: string }> = [
    { id: "stats", label: "玩家紀錄" }, { id: "cards", label: "卡片設定" }, { id: "events", label: "事件列表" }, { id: "createCard", label: "新增卡片" }, { id: "create", label: "新增事件" },
  ];

  return (
    <div className="fixed bottom-3 left-3 z-[100] font-mono text-[11px]">
      <button type="button" onClick={() => setOpen((value) => !value)} className="border border-fuchsia-500/70 bg-zinc-950 px-3 py-2 font-bold text-fuchsia-300 shadow-lg">{open ? "關閉事件管理" : "事件管理 DEBUG"}</button>
      {open && (
        <div className="mt-2 flex h-[min(760px,82vh)] w-[min(760px,calc(100vw-24px))] flex-col overflow-hidden border border-fuchsia-500/60 bg-zinc-950/97 text-zinc-300 shadow-2xl backdrop-blur">
          <div className="shrink-0 border-b border-zinc-800 p-3"><p className="font-black tracking-widest text-fuchsia-300">事件與知識卡管理中心</p><p className="mt-1 text-[9px] text-zinc-600">只在本機開發模式顯示，所有自訂事件會儲存在這台裝置。</p></div>
          <nav className="grid shrink-0 grid-cols-5 border-b border-zinc-800">{tabs.map((tab) => <button key={tab.id} type="button" onClick={() => { if (tab.id === "create") startNewEvent(); else if (tab.id === "createCard") startNewCard(); else { setPage(tab.id); setNotice(""); } }} className={`px-1 py-2 text-[8px] font-bold sm:px-2 sm:text-[11px] ${page === tab.id ? "bg-fuchsia-950/50 text-fuchsia-300" : "text-zinc-500 hover:bg-zinc-900"}`}>{tab.label}</button>)}</nav>
          {notice && <div className="shrink-0 border-b border-cyan-900/50 bg-cyan-950/20 px-3 py-2 text-[10px] text-cyan-300">{notice}</div>}
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {page === "stats" && <>
              <p className="mb-2 text-[10px] leading-relaxed text-zinc-500">行為次數會在實際遊戲中自動累積，也可以在此手動測試。</p>
              <div className="space-y-1 border border-zinc-800 bg-black/40 p-2">{PLAYER_ACTIONS.map((action) => <div key={action} className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-zinc-900 pb-1 last:border-0" title={PLAYER_ACTION_INFO[action].description}><span><b className="block text-zinc-300">{PLAYER_ACTION_INFO[action].label}</b><small className="text-[8px] text-zinc-600">{action} · {PLAYER_ACTION_INFO[action].group}</small></span><b className="text-cyan-300">{snapshot.stats[action]}</b></div>)}</div>
              <p className="mb-1 mt-3 font-bold text-zinc-400">手動增加行為次數</p>
              <div className="flex gap-2"><select value={selectedAction} onChange={(event) => setSelectedAction(event.target.value as PlayerAction)} className="min-w-0 flex-1 border border-zinc-700 bg-black p-2">{PLAYER_ACTIONS.map((action) => <option key={action} value={action}>{PLAYER_ACTION_INFO[action].label}</option>)}</select><button type="button" onClick={addAction} className="border border-cyan-700 px-4 text-cyan-300 hover:bg-cyan-950">增加 +1</button></div>
              <p className="mt-1 text-[9px] text-zinc-600">{PLAYER_ACTION_INFO[selectedAction].description}</p>
              <div className="mt-4 grid gap-1.5 sm:grid-cols-3"><button type="button" onClick={() => { resetPlayerStats(); snapshot.refresh(); }} className="border border-zinc-700 p-2 hover:bg-zinc-900">清除玩家行為統計</button><button type="button" onClick={() => { clearEventRecords(); snapshot.refresh(); }} className="border border-zinc-700 p-2 hover:bg-zinc-900">清除事件紀錄與佇列</button><button type="button" onClick={() => { clearCardCollection(); snapshot.refresh(); }} className="border border-zinc-700 p-2 hover:bg-zinc-900">清除卡片收藏</button></div>
            </>}

            {page === "cards" && <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><b className="text-zinc-200">全部知識卡設定狀態</b><p className="text-[9px] text-zinc-600">綠色代表已有觸發事件；橘色虛線代表尚未設定；藍色「已修改」代表覆寫過內建內容。</p></div><div className="flex flex-wrap gap-1">{(["all", "configured", "missing"] as CardFilter[]).map((filter) => <button key={filter} type="button" onClick={() => setCardFilter(filter)} className={`border px-2 py-1 ${cardFilter === filter ? "border-fuchsia-600 text-fuchsia-300" : "border-zinc-800 text-zinc-600"}`}>{filter === "all" ? "全部" : filter === "configured" ? "已設定" : "待設定"}</button>)}<button type="button" onClick={startNewCard} className="border border-cyan-700 px-2 py-1 text-cyan-300">＋新增卡片</button></div></div>
              <div className="grid gap-2 md:grid-cols-2">{filteredCards.map((card) => { const isStoredCustom = customCardIds.has(card.id); const source: DefinitionSource = isStoredCustom && builtInCardIds.has(card.id) ? "overridden" : isStoredCustom ? "custom" : "builtIn"; return <div key={card.id}><CardSetupRow card={card} configured={configuredCardIds.has(card.id)} source={source} onEdit={() => editCard(card.id)} /></div>; })}</div>
              {filteredCards.length === 0 && <div className="border border-dashed border-zinc-800 p-8 text-center text-zinc-600">目前沒有符合這個狀態的卡片。</div>}
            </>}

            {page === "events" && <>
              <div className="mb-3 flex items-center justify-between"><div><b className="text-zinc-200">全部事件</b><p className="text-[9px] text-zinc-600">可搜尋、篩選、修改條件或刪除；編輯不會建立重複事件。</p></div><button type="button" onClick={startNewEvent} className="border border-fuchsia-700 px-3 py-2 text-fuchsia-300">＋新增事件</button></div>
              <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input value={eventSearch} onChange={(event) => setEventSearch(event.target.value)} placeholder="搜尋標題、代碼或卡片…" className="border border-zinc-700 bg-black p-2" /><select value={eventActionFilter} onChange={(event) => setEventActionFilter(event.target.value as "all" | PlayerAction)} className="border border-zinc-700 bg-black p-2"><option value="all">全部觸發行為</option>{PLAYER_ACTIONS.map((action) => <option key={action} value={action}>{PLAYER_ACTION_INFO[action].label}</option>)}</select><select value={eventSourceFilter} onChange={(event) => setEventSourceFilter(event.target.value as EventSourceFilter)} className="border border-zinc-700 bg-black p-2"><option value="all">全部來源</option><option value="builtIn">內建</option><option value="overridden">已修改</option><option value="custom">自訂</option></select></div>
              <div className="mb-2 flex items-center justify-between"><span className="text-[9px] text-zinc-600">顯示 {filteredEvents.length} 個事件，已選 {selectedEventIds.length} 個</span><button type="button" disabled={selectedEventIds.length === 0} onClick={deleteSelectedEvents} className="border border-red-800 px-3 py-1.5 text-red-300 disabled:cursor-not-allowed disabled:opacity-30">刪除所選事件</button></div>
              <div className="space-y-2">{filteredEvents.map((gameEvent) => { const isStoredCustom = customEventIds.has(gameEvent.id); const source: DefinitionSource = isStoredCustom && builtInEventIds.has(gameEvent.id) ? "overridden" : isStoredCustom ? "custom" : "builtIn"; return <article key={gameEvent.id} className={`border bg-black/35 p-3 ${selectedEventIds.includes(gameEvent.id) ? "border-red-700/80" : "border-zinc-800"}`}><div className="flex items-start gap-3"><input type="checkbox" checked={selectedEventIds.includes(gameEvent.id)} onChange={(event) => setSelectedEventIds((ids) => event.target.checked ? [...ids, gameEvent.id] : ids.filter((id) => id !== gameEvent.id))} className="mt-1 h-4 w-4 accent-red-600" aria-label={`選擇 ${gameEvent.title}`} /><div className="min-w-0 flex-1"><b className="text-sm text-white">{gameEvent.icon} {gameEvent.title}</b><p className="mt-1.5 text-xs leading-relaxed text-zinc-400 sm:text-[13px]">當「{PLAYER_ACTION_INFO[gameEvent.action].label}」達 <b className="text-cyan-300">{gameEvent.requiredCount}</b> 次 → 獲得 <b className="text-amber-300">{gameEvent.rewardCard}</b></p><p className="mt-1.5 font-mono text-[10px] text-zinc-600 sm:text-[11px]">{gameEvent.id}</p></div><div className="flex flex-wrap items-center justify-end gap-1"><span className={`px-2 py-1 text-[10px] font-bold ${source === "custom" ? "bg-fuchsia-950 text-fuchsia-300" : source === "overridden" ? "bg-cyan-950 text-cyan-300" : "bg-zinc-900 text-zinc-400"}`}>{source === "custom" ? "自訂" : source === "overridden" ? "已修改" : "內建"}</span><button type="button" onClick={() => editEvent(gameEvent.id)} className="border border-cyan-800 px-2 py-1 text-[10px] text-cyan-300">編輯</button><button type="button" onClick={() => deleteSingleEvent(gameEvent.id)} className="border border-red-900 px-2 py-1 text-[10px] text-red-400">刪除</button></div></div></article>; })}</div>
              {filteredEvents.length === 0 && <div className="border border-dashed border-zinc-800 p-8 text-center text-zinc-600">沒有符合篩選條件的事件。</div>}
              <div className="mt-3 border border-orange-900/50 bg-orange-950/10 p-3"><p className="mb-2 text-[10px] leading-relaxed text-orange-200/70"><b>測試顯示：</b>不增加玩家紀錄，也不必達成條件；只把事件放入等待佇列，方便預覽事件視窗與卡片動畫。</p><div className="flex gap-2"><select value={selectedEvent} onChange={(event) => setSelectedEvent(event.target.value)} className="min-w-0 flex-1 border border-zinc-700 bg-black p-2">{allEvents.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select><button type="button" onClick={() => { triggerEvent(selectedEvent); snapshot.refresh(); setNotice("事件已加入等待顯示佇列。"); }} className="border border-orange-700 px-3 text-orange-300">測試顯示</button></div></div>
            </>}

            {page === "createCard" && <>
              <div className="mb-4"><b className="text-zinc-200">{editingCardId ? "編輯知識卡" : "新增知識卡"}</b><p className="mt-1 text-[9px] leading-relaxed text-zinc-600">{editingCardId ? "修改後會以相同代碼更新原卡片，不會增加重複項目。" : "卡片會保存到 localStorage。完成後會自動前往「新增事件」並選中這張卡片。"}</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1"><span>卡片代碼</span><input value={cardForm.id} disabled={Boolean(editingCardId)} onChange={(event) => setCardForm({ ...cardForm, id: event.target.value })} placeholder="例如：rock_safety" className="w-full border border-zinc-700 bg-black p-2 disabled:cursor-not-allowed disabled:bg-zinc-900 disabled:text-zinc-500" /></label>
                <label className="space-y-1"><span>卡片圖示</span><input value={cardForm.icon} onChange={(event) => setCardForm({ ...cardForm, icon: event.target.value })} className="w-full border border-zinc-700 bg-black p-2" /></label>
                <label className="space-y-1"><span>卡片分類</span><select value={cardForm.category} onChange={(event) => setCardForm({ ...cardForm, category: event.target.value as KnowledgeCardCategory })} className="w-full border border-zinc-700 bg-black p-2"><option value="lighting">照明 lighting</option><option value="energy">能源 energy</option><option value="materials">材料 materials</option><option value="maintenance">維護 maintenance</option><option value="marine">海事 marine</option><option value="safety">安全 safety</option></select></label>
                <label className="space-y-1"><span>圖片網址或路徑</span><input value={cardForm.image} onChange={(event) => setCardForm({ ...cardForm, image: event.target.value })} placeholder="/assets/cards/example.png" className="w-full border border-zinc-700 bg-black p-2" /></label>
                <label className="space-y-1 sm:col-span-2"><span>卡片標題</span><input value={cardForm.title} onChange={(event) => setCardForm({ ...cardForm, title: event.target.value })} placeholder="玩家在圖鑑中看到的名稱" className="w-full border border-zinc-700 bg-black p-2" /></label>
                <label className="space-y-1 sm:col-span-2"><span>主要知識說明</span><textarea value={cardForm.description} onChange={(event) => setCardForm({ ...cardForm, description: event.target.value })} placeholder="簡短說明這項產業知識" rows={3} className="w-full resize-none border border-zinc-700 bg-black p-2" /></label>
                <label className="space-y-1 sm:col-span-2"><span>產業補充內容</span><textarea value={cardForm.industryNote} onChange={(event) => setCardForm({ ...cardForm, industryNote: event.target.value })} placeholder="卡片放大後顯示的延伸說明" rows={3} className="w-full resize-none border border-zinc-700 bg-black p-2" /></label>
              </div>
              <div className="mt-4 border border-zinc-800 bg-black/30 p-3"><p className="text-[9px] text-zinc-600">卡片預覽</p><div className="mt-2 flex gap-3"><span className="grid h-14 w-14 place-items-center border border-cyan-800 bg-cyan-950/20 text-2xl">{cardForm.icon || "📘"}</span><div><b className="text-sm text-white">{cardForm.title || "尚未輸入卡片標題"}</b><p className="mt-1 text-[10px] text-zinc-500">{cardForm.description || "尚未輸入卡片說明"}</p></div></div></div>
              <div className="mt-4 flex gap-2">{editingCardId && <button type="button" onClick={() => { setEditingCardId(null); setPage("cards"); setNotice(""); }} className="border border-zinc-700 px-4 text-zinc-400">取消</button>}<button type="button" onClick={createCard} className="flex-1 border border-cyan-600 bg-cyan-950/40 p-3 font-black text-cyan-200 hover:bg-cyan-900/50">{editingCardId ? "儲存卡片修改" : "儲存卡片並設定事件"}</button></div>
            </>}

            {page === "create" && <>
              <div className="mb-4"><b className="text-zinc-200">{editingEventId ? "編輯事件" : "新增自訂事件"}</b><p className="mt-1 text-[9px] leading-relaxed text-zinc-600">{editingEventId ? "可調整標題、內容、觸發行為、累積次數與獎勵卡片；儲存後會重新監測條件。" : "設定完成後會立即加入 EventManager，重新整理頁面也不會消失。"}</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1"><span>事件代碼</span><input value={form.id} disabled={Boolean(editingEventId)} onChange={(event) => setForm({ ...form, id: event.target.value })} placeholder="例如：rock_safety" className="w-full border border-zinc-700 bg-black p-2 disabled:cursor-not-allowed disabled:bg-zinc-900 disabled:text-zinc-500" /></label>
                <label className="space-y-1"><span>事件圖示</span><input value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} className="w-full border border-zinc-700 bg-black p-2" /></label>
                <label className="space-y-1 sm:col-span-2"><span>事件標題</span><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="玩家看到的事件名稱" className="w-full border border-zinc-700 bg-black p-2" /></label>
                <label className="space-y-1 sm:col-span-2"><span>事件內容</span><textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="事件發生時顯示的故事內容" rows={4} className="w-full resize-none border border-zinc-700 bg-black p-2" /></label>
                <label className="space-y-1"><span>觸發行為</span><select value={form.action} onChange={(event) => setForm({ ...form, action: event.target.value as PlayerAction })} className="w-full border border-zinc-700 bg-black p-2">{PLAYER_ACTIONS.map((action) => <option key={action} value={action}>{PLAYER_ACTION_INFO[action].label}</option>)}</select></label>
                <label className="space-y-1"><span>需要累積次數</span><input type="number" min="1" value={form.requiredCount} onChange={(event) => setForm({ ...form, requiredCount: Number(event.target.value) })} className="w-full border border-zinc-700 bg-black p-2" /></label>
                <label className="space-y-1 sm:col-span-2"><span>完成後獲得的卡片</span><select value={form.rewardCard} onChange={(event) => setForm({ ...form, rewardCard: event.target.value })} className="w-full border border-zinc-700 bg-black p-2">{allCards.map((card) => <option key={card.id} value={card.id}>{card.title}（{configuredCardIds.has(card.id) ? "已有事件" : "尚未設定"}）</option>)}</select></label>
              </div>
              <div className="mt-4 border border-zinc-800 bg-black/30 p-3 text-[10px] leading-relaxed text-zinc-500"><b className="text-zinc-300">條件預覽：</b>當玩家「{PLAYER_ACTION_INFO[form.action].label}」累積達到 {Math.max(1, form.requiredCount || 1)} 次，顯示「{form.title || "尚未輸入標題"}」並解鎖 {form.rewardCard}。</div>
              <div className="mt-4 flex gap-2">{editingEventId && <button type="button" onClick={() => { setEditingEventId(null); setPage("events"); setNotice(""); }} className="border border-zinc-700 px-4 text-zinc-400">取消</button>}<button type="button" onClick={createEvent} className="flex-1 border border-fuchsia-600 bg-fuchsia-950/40 p-3 font-black text-fuchsia-200 hover:bg-fuchsia-900/50">{editingEventId ? "儲存事件修改" : "儲存並啟用事件"}</button></div>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}
