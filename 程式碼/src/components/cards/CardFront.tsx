import React, { useEffect, useState } from "react";

export const CARD_FRONT_IMAGE_URL = "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/9.card/Card%20-%20Front.png";

export interface CardFrontData {
  eventTitle: string;
  eventContent: string;
  cardTitle: string;
  category: string;
  description: string;
  extraText: string;
  cardId: string;
  imageUrl: string;
}

export function CardFront({ data }: { data: CardFrontData }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [data.imageUrl]);

  return (
    <article className="card-flip-face card-flip-front text-zinc-100" aria-label={`${data.cardTitle}卡片正面`}>
      <img src={CARD_FRONT_IMAGE_URL} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      <div className="absolute left-[6.6%] right-[6.6%] top-[7%] h-[31%] overflow-hidden bg-[#13090a]">
        {data.imageUrl && !imageFailed ? (
          <img src={data.imageUrl} alt="" onError={() => setImageFailed(true)} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_center,rgba(127,29,29,.55),rgba(0,0,0,.92)_68%)] px-4 text-center">
            <div>
              <span className="text-4xl text-red-300/70">◇</span>
              <p className="mt-2 font-mono text-[8px] tracking-[0.18em] text-zinc-500 sm:text-[9px]">IMAGE DATA UNAVAILABLE</p>
            </div>
          </div>
        )}
      </div>

      <div className="absolute left-[9%] right-[8%] top-[39.4%] flex h-[6.8%] items-center justify-between gap-2 overflow-hidden">
        <h2 className="min-w-0 break-words text-[clamp(15px,4.6vw,25px)] font-black leading-none tracking-wide text-white">{data.cardTitle}</h2>
        <span className="shrink-0 border border-red-500/80 bg-black/70 px-2 py-1 font-mono text-[8px] font-black tracking-wider text-red-200 sm:text-[10px]">{data.category}</span>
      </div>

      <section className="absolute left-[7.2%] right-[7.2%] top-[48%] h-[15.6%] overflow-hidden px-[5.5%] pb-[2%] pt-[6%]">
        <h3 className="absolute left-[5%] top-[1.6%] flex items-center gap-1.5 text-[10px] font-black tracking-wide text-white sm:text-xs"><span aria-hidden="true">⚑</span>取得事件</h3>
        <div className="h-full overflow-y-auto overscroll-contain [scrollbar-width:thin]">
          <p className="break-words text-[10px] font-black leading-snug text-amber-300 sm:text-[12px]">{data.eventTitle}</p>
          <p className="mt-1 break-words text-[9px] leading-relaxed text-zinc-100 sm:text-[11px]">{data.eventContent}</p>
        </div>
      </section>

      <section className="absolute left-[7.2%] right-[7.2%] top-[65.5%] h-[12.5%] overflow-hidden px-[5.5%] pb-[2%] pt-[6%]">
        <h3 className="absolute left-[5%] top-[1.5%] flex items-center gap-1.5 text-[10px] font-black tracking-wide text-white sm:text-xs"><span aria-hidden="true">▣</span>卡片說明</h3>
        <p className="h-full overflow-y-auto overscroll-contain break-words text-[9px] leading-relaxed text-zinc-100 [scrollbar-width:thin] sm:text-[11px]">{data.description}</p>
      </section>

      <section className="absolute left-[7.2%] right-[7.2%] top-[80%] h-[10.8%] overflow-hidden px-[5.5%] pb-[2%] pt-[6%]">
        <h3 className="absolute left-[5%] top-[1.5%] flex items-center gap-1.5 text-[10px] font-black tracking-wide text-white sm:text-xs"><span aria-hidden="true">⚙</span>產業補充</h3>
        <p className="h-full overflow-y-auto overscroll-contain whitespace-pre-line break-words text-[9px] leading-relaxed text-zinc-100 [scrollbar-width:thin] sm:text-[11px]">{data.extraText || "—"}</p>
      </section>

      <div className="absolute bottom-[3.5%] left-[12.5%] right-[12%] flex items-center gap-3 overflow-hidden font-mono text-[7px] tracking-[0.12em] sm:text-[9px]">
        <span className="shrink-0 text-red-400">CARD ID</span>
        <span className="truncate text-zinc-300">{data.cardId}</span>
      </div>
    </article>
  );
}
