import React, { useEffect, useMemo, useState } from "react";
import { Archive, BookOpen, ChevronLeft, ChevronRight, LockKeyhole, ScanLine, X, ZoomIn } from "lucide-react";
import { getAllCardDefinitions, type KnowledgeCardDefinition } from "../../data/cardDatabase";
import { CardFlip } from "../cards/CardFlip";

interface KnowledgeBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownedCards: string[];
  playSound: (soundName: string) => void;
}

const CARDS_PER_SPREAD = 4;
const CATEGORY_STYLE: Record<KnowledgeCardDefinition["category"], { label: string; accent: string; glow: string }> = {
  lighting: { label: "LIGHTING", accent: "text-amber-300", glow: "from-amber-400/25" },
  energy: { label: "ENERGY", accent: "text-yellow-300", glow: "from-yellow-400/25" },
  materials: { label: "MATERIALS", accent: "text-orange-300", glow: "from-orange-400/25" },
  maintenance: { label: "MAINTENANCE", accent: "text-cyan-300", glow: "from-cyan-400/25" },
  marine: { label: "MARINE", accent: "text-sky-300", glow: "from-sky-400/25" },
  safety: { label: "SAFETY", accent: "text-rose-300", glow: "from-rose-400/25" },
};

function CardSlot({ card, owned, onOpen, number }: { card: KnowledgeCardDefinition; owned: boolean; onOpen: () => void; number: number }) {
  const style = CATEGORY_STYLE[card.category];
  return (
    <button
      type="button"
      disabled={!owned}
      onClick={onOpen}
      className={`group relative min-h-[142px] overflow-hidden rounded-md border text-left transition-all sm:min-h-[170px] ${owned ? "border-white/15 bg-[#101827] hover:-translate-y-1 hover:border-cyan-300/60 hover:shadow-[0_12px_32px_rgba(0,0,0,.45)] active:scale-[.985]" : "cursor-default border-white/[.07] bg-[#090d14]"}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${owned ? style.glow : "from-zinc-700/40"} to-transparent`} />
      <div className="absolute inset-0 opacity-[.13] [background-image:linear-gradient(rgba(255,255,255,.17)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.13)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative flex h-full gap-3 p-3 sm:p-4">
        <div className={`relative grid h-[66px] w-[66px] shrink-0 place-items-center overflow-hidden rounded border sm:h-[82px] sm:w-[82px] ${owned ? "border-white/15 bg-black/45" : "border-white/[.08] bg-black/20"}`}>
          {owned ? <>
            <span className="text-3xl sm:text-4xl">{card.icon}</span>
            {card.image && <img src={card.image} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-110" />}
          </> : <LockKeyhole className="h-6 w-6 text-zinc-600" />}
          <span className="absolute bottom-1 left-1 font-mono text-[7px] text-white/35">#{String(number).padStart(2, "0")}</span>
        </div>
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center justify-between gap-2">
            <p className={`font-mono text-[8px] font-black tracking-[.16em] ${owned ? style.accent : "text-zinc-600"}`}>{owned ? style.label : "ENCRYPTED"}</p>
            {owned && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_9px_#4ade80]" />}
          </div>
          <h3 className={`mt-2 line-clamp-2 text-[13px] font-black leading-snug sm:text-[15px] ${owned ? "text-slate-100" : "text-zinc-500"}`}>{owned ? card.title : "未解鎖資料檔"}</h3>
          <p className={`mt-2 line-clamp-2 text-[10px] leading-relaxed sm:text-[11px] ${owned ? "text-slate-400" : "text-zinc-600"}`}>{owned ? card.description : "完成遊戲事件後，這筆產業知識將同步至資料庫。"}</p>
          {owned && card.bossEffect && <p className="mt-2 line-clamp-1 font-mono text-[8px] font-bold text-rose-300">BOSS MOD · {card.bossEffect.label}</p>}
        </div>
      </div>
      {owned && <ZoomIn className="absolute bottom-2 right-2 h-3.5 w-3.5 text-slate-500 transition group-hover:scale-125 group-hover:text-cyan-300" />}
    </button>
  );
}

export function KnowledgeBookModal({ isOpen, onClose, ownedCards, playSound }: KnowledgeBookModalProps) {
  const cards = getAllCardDefinitions();
  const [spread, setSpread] = useState(0);
  const [selectedCard, setSelectedCard] = useState<KnowledgeCardDefinition | null>(null);
  const totalSpreads = Math.max(1, Math.ceil(cards.length / CARDS_PER_SPREAD));
  const visibleCards = useMemo(() => cards.slice(spread * CARDS_PER_SPREAD, spread * CARDS_PER_SPREAD + CARDS_PER_SPREAD), [spread, cards.length]);
  const collectedPercent = cards.length ? Math.round((ownedCards.length / cards.length) * 100) : 0;

  useEffect(() => {
    if (!isOpen) { setSpread(0); setSelectedCard(null); }
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

  return <div className="fixed inset-0 z-[80] grid place-items-center bg-[#02050b]/90 p-2 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" aria-label="產業知識卡圖鑑">
    <div className="relative flex h-[min(760px,94vh)] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-cyan-300/20 bg-[#070d17] shadow-[0_0_80px_rgba(0,0,0,.9)]">
      <div className="absolute inset-0 pointer-events-none opacity-20 [background-image:linear-gradient(rgba(53,198,255,.13)_1px,transparent_1px),linear-gradient(90deg,rgba(53,198,255,.1)_1px,transparent_1px)] [background-size:32px_32px]" />
      <header className="relative flex shrink-0 items-center justify-between border-b border-cyan-300/15 bg-[#0b1422]/90 px-3 py-3 text-slate-100 sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded border border-cyan-300/35 bg-cyan-400/10"><Archive className="h-5 w-5 text-cyan-300" /></span>
          <div className="min-w-0">
            <div className="flex items-center gap-2"><h2 className="truncate text-sm font-black tracking-[.12em] sm:text-xl">產業知識卡圖鑑</h2><span className="hidden border border-cyan-300/25 px-1.5 py-0.5 font-mono text-[8px] text-cyan-200 sm:block">FW ARCHIVE</span></div>
            <p className="mt-1 font-mono text-[8px] tracking-[.16em] text-slate-500 sm:text-[10px]">KNOWLEDGE DATABASE · SYNCHRONIZED</p>
          </div>
        </div>
        <button type="button" onClick={() => { playSound("click"); onClose(); }} className="ml-3 grid h-9 w-9 shrink-0 place-items-center rounded border border-white/10 bg-white/[.03] text-slate-400 transition hover:border-rose-400/70 hover:bg-rose-500/10 hover:text-white" aria-label="關閉知識卡圖鑑"><X className="h-5 w-5" /></button>
      </header>

      <div className="relative shrink-0 border-b border-white/[.07] bg-black/20 px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between font-mono text-[9px] tracking-[.12em]"><span className="text-slate-400">ARCHIVE COMPLETION</span><span className="text-cyan-300">{ownedCards.length} / {cards.length} · {collectedPercent}%</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.08]"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-300 shadow-[0_0_12px_rgba(34,211,238,.7)] transition-all duration-500" style={{ width: `${collectedPercent}%` }} /></div>
      </div>

      <main className="relative min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 md:overflow-hidden">
        <div className="mb-3 flex items-center justify-between px-1"><p className="font-mono text-[9px] tracking-[.16em] text-cyan-200/65">DATA SHEET {String(spread + 1).padStart(2, "0")}</p><p className="flex items-center gap-1 font-mono text-[8px] text-slate-500"><ScanLine className="h-3 w-3" /> TAP UNLOCKED CARD TO INSPECT</p></div>
        <div className="grid gap-3 md:h-[calc(100%-28px)] md:grid-cols-2 md:grid-rows-2">
          {visibleCards.map((card, index) => <React.Fragment key={card.id}><CardSlot card={card} number={spread * CARDS_PER_SPREAD + index + 1} owned={ownedCards.includes(card.id)} onOpen={() => { playSound("click"); setSelectedCard(card); }} /></React.Fragment>)}
        </div>
      </main>

      <footer className="relative flex shrink-0 items-center justify-between border-t border-cyan-300/15 bg-[#0b1422]/80 px-3 py-3 text-slate-100 sm:px-5">
        <button type="button" disabled={spread === 0} onClick={() => turnPage(-1)} className="flex items-center gap-1 rounded border border-white/10 bg-white/[.03] px-3 py-2 text-xs font-bold transition hover:border-cyan-300/60 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-25"><ChevronLeft className="h-4 w-4" />上一頁</button>
        <span className="font-mono text-[10px] text-slate-500">{String(spread + 1).padStart(2, "0")} / {String(totalSpreads).padStart(2, "0")}</span>
        <button type="button" disabled={spread >= totalSpreads - 1} onClick={() => turnPage(1)} className="flex items-center gap-1 rounded border border-white/10 bg-white/[.03] px-3 py-2 text-xs font-bold transition hover:border-cyan-300/60 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-25">下一頁<ChevronRight className="h-4 w-4" /></button>
      </footer>
    </div>

    {selectedCard && ownedCards.includes(selectedCard.id) && <div className="absolute inset-0 z-20 grid place-items-center bg-black/80 p-4" onClick={() => setSelectedCard(null)}>
      <div className="relative flex w-full max-w-md flex-col items-center gap-3" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={() => setSelectedCard(null)} className="absolute right-0 top-0 z-10 grid h-8 w-8 place-items-center rounded border border-rose-400/60 bg-black/75 text-zinc-200 hover:bg-rose-950" aria-label="關閉卡片內容"><X className="h-4 w-4" /></button>
        <CardFlip data={{ cardTitle: selectedCard.title, category: selectedCard.category.toUpperCase(), description: selectedCard.description, extraText: [selectedCard.industryNote, selectedCard.bossEffect ? `知識應用：${selectedCard.bossEffect.label}` : ""].filter(Boolean).join("\n"), cardId: selectedCard.id, imageUrl: selectedCard.image }} resetKey={`knowledge-book-${selectedCard.id}`} storyEffect={selectedCard.storyEffect} initialFlipped />
        <p className="font-mono text-[10px] tracking-[.16em] text-zinc-400">CARD DATA ARCHIVED</p>
      </div>
    </div>}
  </div>;
}
