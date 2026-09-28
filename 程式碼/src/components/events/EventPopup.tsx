import React, { useEffect, useRef, useState } from "react";
import type { CardReward } from "../../systems/gameEvents";
import { completePendingReward } from "../../systems/eventManager";
import { unlockCard } from "../../systems/playerCollection";
import { CardFlip } from "../cards/CardFlip";

interface EventPopupProps {
  reward: CardReward;
  playSound: (soundName: string) => void;
}

export function EventPopup({ reward, playSound }: EventPopupProps) {
  const { event, card } = reward;
  const [phase, setPhase] = useState<"event" | "card">("event");
  const [cardFlipped, setCardFlipped] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const cardSceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPhase("event");
    setCardFlipped(false);
    setIsCollecting(false);
  }, [event.id]);

  const revealCard = () => {
    playSound("success");
    setPhase("card");
  };

  const finish = async () => {
    if (isCollecting) return;
    setIsCollecting(true);
    playSound("click");
    const cardScene = cardSceneRef.current;
    const collectionButton = document.querySelector<HTMLElement>("[data-knowledge-book]");
    if (cardScene) {
      const cardRect = cardScene.getBoundingClientRect();
      const targetRect = collectionButton?.getBoundingClientRect();
      const translateX = targetRect
        ? targetRect.left + targetRect.width / 2 - (cardRect.left + cardRect.width / 2)
        : window.innerWidth * 0.42;
      const translateY = targetRect
        ? targetRect.top + targetRect.height / 2 - (cardRect.top + cardRect.height / 2)
        : -window.innerHeight * 0.55;
      const animation = cardScene.animate([
        { transform: "translate3d(0,0,0) scale(1) rotate(0deg)", opacity: 1, offset: 0 },
        { transform: "translate3d(0,-18px,0) scale(1.03) rotate(-1deg)", opacity: 1, offset: 0.16 },
        { transform: `translate3d(${translateX}px,${translateY}px,0) scale(0.08) rotate(10deg)`, opacity: 0.15, offset: 1 },
      ], { duration: 780, easing: "cubic-bezier(.55,.02,.2,1)", fill: "forwards" });
      await animation.finished.catch(() => undefined);
    }
    unlockCard(card.id);
    playSound("success");
    completePendingReward(reward.rewardId);
  };

  const cardData = {
    eventTitle: event.title,
    eventContent: event.content,
    cardTitle: card.title,
    category: card.category.toUpperCase(),
    description: card.description,
    extraText: [card.industryNote, card.bossEffect ? `知識應用：${card.bossEffect.label}` : ""].filter(Boolean).join("\n"),
    cardId: card.id,
    imageUrl: card.image,
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="knowledge-event-title">
      <div className={`relative w-full ${phase === "card" ? "max-w-md bg-transparent" : "max-w-lg overflow-hidden border border-orange-500/70 bg-[#080c10] shadow-[0_0_55px_rgba(249,115,22,0.2)] animate-fade-in"}`}>
        {phase === "event" && <>
        <div className="h-1 bg-gradient-to-r from-orange-600 via-amber-300 to-cyan-400" />
        <div className="p-5 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <p className="font-mono text-[10px] font-bold tracking-[0.24em] text-orange-400">
                INDUSTRY EVENT DETECTED
              </p>
              <h2 id="knowledge-event-title" className="mt-1 text-xl font-black tracking-wider text-white sm:text-2xl">
                {event.title}
              </h2>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center border border-zinc-700 bg-zinc-950 text-2xl shadow-inner">
              {event.icon}
            </span>
          </div>

          <>
              <div className="mb-5 border border-zinc-800 bg-zinc-950/80 p-4 text-sm leading-relaxed text-zinc-300">
                {event.content}
              </div>
              <p className="mb-5 font-mono text-[10px] text-zinc-500">REWARD // {card.title}</p>
              <button type="button" onClick={revealCard} className="w-full border border-orange-400 bg-orange-600 px-5 py-3 text-sm font-black tracking-widest text-white transition hover:bg-orange-500 active:scale-[0.98]">
                獲得知識卡
              </button>
            </>
        </div>
        </>}
        {phase === "card" && (
          <div ref={cardSceneRef} className="flex flex-col items-center gap-3 animate-scale-up will-change-transform">
            <CardFlip data={cardData} resetKey={reward.rewardId} onFlip={() => playSound("click")} onFlippedChange={setCardFlipped} />
            <p className="font-mono text-[10px] tracking-[0.18em] text-zinc-400">{cardFlipped ? "CARD DATA DECODED" : "點擊卡片翻面"}</p>
            {cardFlipped && <button type="button" onClick={finish} disabled={isCollecting} className="w-full max-w-[400px] border border-red-500/80 bg-red-950/80 px-5 py-3 text-sm font-black tracking-widest text-red-100 transition hover:bg-red-900 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60">{isCollecting ? "收納中…" : "收入收藏並繼續"}</button>}
          </div>
        )}
      </div>
    </div>
  );
}
