import React, { useEffect, useState } from "react";
import { CardBack } from "./CardBack";
import { CardFront, type CardFrontData } from "./CardFront";

export const CARD_FLIP_MOCK_DATA: CardFrontData = {
  eventTitle: "防水等級的秘密-02",
  eventContent: "工程師跟你說明了 IP rating 防水數字代表的意義",
  cardTitle: "IP67 防護等級",
  category: "LIGHTING",
  description: "通常會把產品測試約 1 m 水深並且放置 30 分鐘後也可以使用",
  extraText: "所以可以拿去游泳池玩 (?",
  cardId: "card_1790221942661",
  imageUrl: "",
};

interface CardFlipProps {
  data: CardFrontData;
  resetKey: string;
  initialFlipped?: boolean;
  onFlip?: () => void;
  onFlippedChange?: (flipped: boolean) => void;
}

export function CardFlip({ data, resetKey, initialFlipped = false, onFlip, onFlippedChange }: CardFlipProps) {
  const [flipped, setFlipped] = useState(initialFlipped);

  useEffect(() => {
    setFlipped(initialFlipped);
    onFlippedChange?.(initialFlipped);
  }, [resetKey, initialFlipped]);

  const flip = () => {
    if (flipped) return;
    setFlipped(true);
    onFlippedChange?.(true);
    onFlip?.();
  };

  return (
    <div role="button" tabIndex={0} onClick={flip} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); flip(); } }} className="card-flip" aria-label={flipped ? `${data.cardTitle}卡片正面` : "翻開事件卡片"}>
      <span className={`card-flip-inner ${flipped ? "is-flipped" : ""}`}>
        <CardBack />
        <CardFront data={data} />
      </span>
    </div>
  );
}
