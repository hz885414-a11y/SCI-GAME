import React, { useEffect, useState } from "react";
import { useGameConfig } from "../../config/GameConfigContext";
import type { CardLayoutSlotKey } from "../../config/cardLayout";

// Keep a revision query so browsers immediately fetch the current GitHub asset
// when the art is replaced at the same source URL.
export const CARD_FRONT_IMAGE_URL = "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/9.card/Card%20-%20Front.png?v=20261017";

/** Static card artwork must retain Vite's GitHub Pages base path. */
export const resolveCardImageUrl = (imageUrl: string) =>
  imageUrl.startsWith("/assets/") ? `${import.meta.env.BASE_URL}${imageUrl.slice(1)}` : imageUrl;

export interface CardFrontData {
  cardTitle: string;
  titleAlign?: "left" | "center";
  category: string;
  description: string;
  extraText: string;
  cardId: string;
  imageUrl: string;
}

export function CardFront({ data }: { data: CardFrontData }) {
  const [imageFailed, setImageFailed] = useState(false);
  const { config } = useGameConfig();
  const position = (key: CardLayoutSlotKey) => {
    const rect = config.cardLayout[key];
    return { left: `${rect.left}%`, top: `${rect.top}%`, width: `${rect.width}%`, height: `${rect.height}%` };
  };

  useEffect(() => setImageFailed(false), [data.imageUrl]);

  return (
    <article className="card-flip-face card-flip-front text-zinc-100" aria-label={`${data.cardTitle}卡片正面`}>
      <img src={CARD_FRONT_IMAGE_URL} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      <div className="absolute overflow-hidden bg-[#13090a]" style={position("image")}>
        {data.imageUrl && !imageFailed ? (
          <img src={resolveCardImageUrl(data.imageUrl)} alt="" onError={() => setImageFailed(true)} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_center,rgba(127,29,29,.55),rgba(0,0,0,.92)_68%)] px-4 text-center">
            <div>
              <span className="text-4xl text-red-300/70">◇</span>
              <p className="mt-2 font-mono text-[8px] tracking-[0.18em] text-zinc-500 sm:text-[9px]">IMAGE DATA UNAVAILABLE</p>
            </div>
          </div>
        )}
      </div>

      <div className="absolute flex items-center justify-between gap-2 overflow-hidden" style={{ ...position("title"), width: "83%" }}>
        <h2 className={`min-w-0 break-words font-pixel text-[clamp(15px,4.6vw,25px)] font-black leading-none tracking-wide text-white ${config.cardLayout.titleAlign === "center" ? "flex-1 text-center" : ""}`}>{data.cardTitle}</h2>
      </div>
      <span className="absolute box-border overflow-hidden border border-red-500/80 bg-black/70 px-2 py-1 text-center font-mono text-[8px] font-black tracking-wider text-red-200 sm:text-[10px]" style={position("category")}>{data.category}</span>

      <h3 className="absolute flex items-center gap-1.5 overflow-hidden text-[10px] font-black tracking-wide text-white sm:text-xs" style={position("descriptionLabel")}><span aria-hidden="true">▣</span>卡片說明</h3>
      <p className="absolute overflow-y-auto overscroll-contain break-words text-[9px] leading-relaxed text-zinc-100 [scrollbar-width:thin] sm:text-[11px]" style={position("descriptionContent")}>{data.description}</p>
      <h3 className="absolute flex items-center gap-1.5 overflow-hidden text-[10px] font-black tracking-wide text-white sm:text-xs" style={position("extraLabel")}><span aria-hidden="true">⚙</span>補充</h3>
      <p className="absolute overflow-y-auto overscroll-contain whitespace-pre-line break-words text-[9px] leading-relaxed text-zinc-100 [scrollbar-width:thin] sm:text-[11px]" style={position("extraContent")}>{data.extraText || "—"}</p>

      <div className="absolute bottom-[3.5%] left-[12.5%] right-[12%] flex items-center gap-3 overflow-hidden font-mono text-[7px] tracking-[0.12em] sm:text-[9px]">
        <span className="shrink-0 text-red-400">CARD ID</span>
        <span className="truncate text-zinc-300">{data.cardId}</span>
      </div>
    </article>
  );
}
