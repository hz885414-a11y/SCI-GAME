import React, { useEffect, useState } from "react";
import type { GameEventDefinition } from "../../data/eventConfig";
import { getCardDefinition } from "../../data/cardDatabase";
import { completePendingEvent } from "../../systems/eventManager";
import { unlockCard } from "../../systems/playerCollection";

interface EventPopupProps {
  event: GameEventDefinition;
  playSound: (soundName: string) => void;
}

export function EventPopup({ event, playSound }: EventPopupProps) {
  const [phase, setPhase] = useState<"event" | "card">("event");
  const [imageFailed, setImageFailed] = useState(false);
  const card = getCardDefinition(event.rewardCard);

  useEffect(() => {
    setPhase("event");
    setImageFailed(false);
  }, [event.id]);

  if (!card) return null;

  const revealCard = () => {
    unlockCard(card.id);
    playSound("success");
    setPhase("card");
  };

  const finish = () => {
    playSound("click");
    completePendingEvent(event.id);
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="knowledge-event-title">
      <div className={`relative w-full max-w-lg overflow-hidden border bg-[#080c10] shadow-[0_0_55px_rgba(249,115,22,0.2)] ${phase === "card" ? "animate-scale-up border-cyan-500/70" : "animate-fade-in border-orange-500/70"}`}>
        <div className="h-1 bg-gradient-to-r from-orange-600 via-amber-300 to-cyan-400" />
        <div className="p-5 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <p className="font-mono text-[10px] font-bold tracking-[0.24em] text-orange-400">
                {phase === "event" ? "INDUSTRY EVENT DETECTED" : "KNOWLEDGE CARD UNLOCKED"}
              </p>
              <h2 id="knowledge-event-title" className="mt-1 text-xl font-black tracking-wider text-white sm:text-2xl">
                {phase === "event" ? event.title : card.title}
              </h2>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center border border-zinc-700 bg-zinc-950 text-2xl shadow-inner">
              {phase === "event" ? event.icon : card.icon}
            </span>
          </div>

          {phase === "event" ? (
            <>
              <div className="mb-5 border border-zinc-800 bg-zinc-950/80 p-4 text-sm leading-relaxed text-zinc-300">
                {event.content}
              </div>
              <p className="mb-5 font-mono text-[10px] text-zinc-500">REWARD // {card.title}</p>
              <button type="button" onClick={revealCard} className="w-full border border-orange-400 bg-orange-600 px-5 py-3 text-sm font-black tracking-widest text-white transition hover:bg-orange-500 active:scale-[0.98]">
                獲得知識卡
              </button>
            </>
          ) : (
            <>
              <div className="knowledge-card-reveal relative mb-5 overflow-hidden border border-cyan-500/40 bg-gradient-to-br from-cyan-950/35 via-zinc-950 to-orange-950/25 p-4">
                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(34,211,238,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.15)_1px,transparent_1px)] [background-size:18px_18px]" />
                <div className="relative flex min-h-36 items-center justify-center border border-zinc-700 bg-black/35">
                  {card.image && !imageFailed && (
                    <img src={card.image} alt="" onError={() => setImageFailed(true)} className="absolute inset-0 h-full w-full object-cover opacity-70" />
                  )}
                  <span className="relative text-6xl drop-shadow-[0_0_18px_rgba(255,255,255,.35)]">{card.icon}</span>
                </div>
                <div className="relative mt-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-400">CATEGORY // {card.category}</p>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-zinc-100">{card.description}</p>
                  <p className="mt-3 border-t border-zinc-800 pt-3 text-xs leading-relaxed text-zinc-400">{card.industryNote}</p>
                </div>
              </div>
              <button type="button" onClick={finish} className="w-full border border-cyan-500/70 bg-cyan-950/50 px-5 py-3 text-sm font-black tracking-widest text-cyan-100 transition hover:bg-cyan-900/60 active:scale-[0.98]">
                收入收藏並繼續
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
