import React from "react";

export const CARD_BACK_IMAGE_URL = "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/9.card/Card%20-%20Back.png";

export function CardBack() {
  return (
    <div className="card-flip-face card-flip-back" aria-label="事件卡片背面">
      <img src={CARD_BACK_IMAGE_URL} alt="" draggable={false} className="h-full w-full object-cover" />
    </div>
  );
}

