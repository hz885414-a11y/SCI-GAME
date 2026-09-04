import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, LockKeyhole, X, ZoomIn } from "lucide-react";
import { getAllCardDefinitions, type KnowledgeCardDefinition } from "../../data/cardDatabase";

interface KnowledgeBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownedCards: string[];
  playSound: (soundName: string) => void;
}

const CARDS_PER_SPREAD = 4;

function CardSlot({ card, owned, onOpen }: { card: KnowledgeCardDefinition; owned: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      disabled={!owned}
      onClick={onOpen}
      className={`group relative flex min-h-[132px] w-full overflow-hidden border p-3 text-left transition-all sm:min-h-[160px] ${owned ? "border-amber-900/45 bg-[#f4e8c9]/70 text-stone-900 hover:-translate-y-0.5 hover:border-amber-700 hover:shadow-[0_8px_20px_rgba(70,40,15,.2)] active:scale-[0.98]" : "cursor-default border-stone-400/25 bg-stone-700/10 text-stone-500"}`}
    >
      <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#4b2e18_1px,transparent_1px)] [background-size:100%_18px]" />
      <div className="relative flex w-full gap-3">
        <div className={`relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden border text-3xl sm:h-20 sm:w-20 ${owned ? "border-amber-900/40 bg-stone-950/90" : "border-stone-500/30 bg-stone-700/20 grayscale"}`}>
          {owned ? (
            <>
              <span>{card.icon}</span>
              {card.image && <img src={card.image} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} className="absolute inset-0 h-full w-full object-cover" />}
            </>
          ) : <LockKeyhole className="h-6 w-6 opacity-45" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-amber-800/70">{owned ? card.category : "LOCKED ENTRY"}</p>
          <h3 className="mt-1 line-clamp-2 text-sm font-black leading-snug sm:text-base">{owned ? card.title : "尚未發現的知識"}</h3>
          <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed opacity-70 sm:text-xs">{owned ? card.description : "完成遊戲事件後，這一頁將會顯示新的產業知識。"}</p>
          {owned && card.bossEffect && <p className="mt-1 line-clamp-1 text-[9px] font-bold text-rose-800">⚔ {card.bossEffect.label}</p>}
        </div>
      </div>
      {owned && <ZoomIn className="absolute bottom-2 right-2 h-3.5 w-3.5 text-amber-800 opacity-45 transition group-hover:scale-125 group-hover:opacity-100" />}
    </button>
  );
}

export function KnowledgeBookModal({ isOpen, onClose, ownedCards, playSound }: KnowledgeBookModalProps) {
  const cards = getAllCardDefinitions();
  const [spread, setSpread] = useState(0);
  const [selectedCard, setSelectedCard] = useState<KnowledgeCardDefinition | null>(null);
  const totalSpreads = Math.max(1, Math.ceil(cards.length / CARDS_PER_SPREAD));
  const visibleCards = useMemo(
    () => cards.slice(spread * CARDS_PER_SPREAD, spread * CARDS_PER_SPREAD + CARDS_PER_SPREAD),
    [spread, cards.length],
  );

  useEffect(() => {
    if (!isOpen) {
      setSpread(0);
      setSelectedCard(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") selectedCard ? setSelectedCard(null) : onClose();
      if (!selectedCard && event.key === "ArrowLeft") setSpread((page) => Math.max(0, page - 1));
      if (!selectedCard && event.key === "ArrowRight") setSpread((page) => Math.min(totalSpreads - 1, page + 1));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, selectedCard, totalSpreads]);

  if (!isOpen) return null;

  const turnPage = (direction: -1 | 1) => {
    playSound("click");
    setSpread((page) => Math.max(0, Math.min(totalSpreads - 1, page + direction)));
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/85 p-2 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" aria-label="產業知識卡圖鑑">
      <div className="relative flex h-[min(760px,94vh)] w-full max-w-5xl flex-col overflow-hidden border border-amber-900/70 bg-[#24170e] p-2 shadow-[0_0_70px_rgba(0,0,0,.9)] sm:p-4">
        <div className="flex shrink-0 items-center justify-between border-b border-amber-900/50 px-2 pb-3 text-[#f6e8c5]">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center border border-amber-700/60 bg-black/30"><BookOpen className="h-5 w-5 text-amber-400" /></span>
            <div>
              <h2 className="text-base font-black tracking-widest sm:text-xl">產業知識卡圖鑑</h2>
              <p className="font-mono text-[8px] tracking-[0.18em] text-amber-300/55 sm:text-[10px]">INDUSTRY KNOWLEDGE ARCHIVE // {ownedCards.length}/{cards.length}</p>
            </div>
          </div>
          <button type="button" onClick={() => { playSound("click"); onClose(); }} className="border border-amber-900/50 p-2 text-stone-400 transition hover:border-amber-500 hover:text-white" aria-label="關閉知識卡圖鑑"><X className="h-5 w-5" /></button>
        </div>

        <div className="relative mt-3 grid min-h-0 flex-1 grid-cols-1 overflow-y-auto border-[10px] border-[#4b2c18] bg-[#ead9b2] shadow-[inset_0_0_40px_rgba(74,45,23,.5)] md:grid-cols-2 md:overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 hidden w-8 -translate-x-1/2 bg-gradient-to-r from-black/15 via-white/20 to-black/15 md:block" />
          {[0, 1].map((bookPage) => (
            <section key={bookPage} className={`relative min-h-full space-y-3 p-4 sm:p-6 ${bookPage === 0 ? "border-b border-stone-500/30 md:border-b-0 md:border-r" : ""}`}>
              <p className="border-b border-amber-900/25 pb-2 text-center font-serif text-xs font-bold tracking-[0.2em] text-stone-600">
                ARCHIVE PAGE {spread * 2 + bookPage + 1}
              </p>
              {visibleCards.slice(bookPage * 2, bookPage * 2 + 2).map((card) => (
                <div key={card.id} className="contents">
                  <CardSlot card={card} owned={ownedCards.includes(card.id)} onOpen={() => { playSound("click"); setSelectedCard(card); }} />
                </div>
              ))}
            </section>
          ))}
        </div>

        <div className="flex shrink-0 items-center justify-between pt-3 text-[#f6e8c5]">
          <button type="button" disabled={spread === 0} onClick={() => turnPage(-1)} className="flex items-center gap-1 border border-amber-900/50 px-3 py-2 text-xs font-bold transition hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-25"><ChevronLeft className="h-4 w-4" />上一頁</button>
          <span className="font-mono text-[10px] text-amber-300/60">{spread + 1} / {totalSpreads}</span>
          <button type="button" disabled={spread >= totalSpreads - 1} onClick={() => turnPage(1)} className="flex items-center gap-1 border border-amber-900/50 px-3 py-2 text-xs font-bold transition hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-25">下一頁<ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {selectedCard && ownedCards.includes(selectedCard.id) && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/75 p-4" onClick={() => setSelectedCard(null)}>
          <article className="knowledge-card-reveal relative w-full max-w-md border border-amber-500/70 bg-gradient-to-br from-[#f4e8c9] via-[#e9d5a8] to-[#cda66c] p-5 text-stone-900 shadow-[0_0_70px_rgba(245,158,11,.25)] sm:p-7" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setSelectedCard(null)} className="absolute right-3 top-3 z-10 border border-stone-700/30 bg-stone-950/10 p-1.5 hover:bg-stone-950/20" aria-label="關閉卡片內容"><X className="h-4 w-4" /></button>
            <div className="relative mb-5 grid h-52 place-items-center overflow-hidden border-4 border-double border-amber-900/45 bg-stone-950 text-7xl">
              <span>{selectedCard.icon}</span>
              {selectedCard.image && <img src={selectedCard.image} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} className="absolute inset-0 h-full w-full object-cover" />}
            </div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-amber-900/70">{selectedCard.category} // KNOWLEDGE CARD</p>
            <h3 className="mt-1 text-2xl font-black tracking-wider">{selectedCard.title}</h3>
            <p className="mt-4 border-y border-amber-900/25 py-4 text-sm font-bold leading-relaxed">{selectedCard.description}</p>
            <p className="mt-4 text-sm leading-relaxed text-stone-700">{selectedCard.industryNote}</p>
            {selectedCard.bossEffect && <p className="mt-4 border border-rose-900/35 bg-rose-950/10 p-3 text-sm font-black leading-relaxed text-rose-900">⚔ 知識應用：{selectedCard.bossEffect.label}</p>}
          </article>
        </div>
      )}
    </div>
  );
}
