import React, { useEffect, useMemo, useState } from "react";
import { playSound } from "../utils/audio";
import { useGameConfig } from "../config/GameConfigContext";

interface PrologueProps {
  onComplete: (skipped: boolean) => void;
}

export const Prologue: React.FC<PrologueProps> = ({ onComplete }) => {
  const { config } = useGameConfig();
  const prologuePages = config.prologue;
  const [pageIndex, setPageIndex] = useState(0);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const page = prologuePages[pageIndex];
  const [typedCharacters, setTypedCharacters] = useState(0);
  if (!page) return null;

  const isLastPage = pageIndex === prologuePages.length - 1;
  const segments = page.segments ?? [{ paragraphs: page.paragraphs }];
  const currentSegment = segments[segmentIndex] ?? segments[0];
  const hasMoreSegments = segmentIndex < segments.length - 1;
  const totalCharacters = useMemo(
    () => currentSegment.paragraphs.reduce((total, paragraph) => total + paragraph.text.length, 0),
    [currentSegment],
  );
  const segmentText = useMemo(
    () => currentSegment.paragraphs.map((paragraph) => paragraph.text).join(""),
    [currentSegment],
  );

  useEffect(() => {
    setTypedCharacters(0);
    let nextCharacterIndex = 0;
    const timer = window.setInterval(() => {
      if (nextCharacterIndex >= totalCharacters) {
        window.clearInterval(timer);
        return;
      }
      const nextCharacter = segmentText[nextCharacterIndex];
      // The visual cadence is 24ms per character. Play a short tick every
      // other visible character so the sound stays crisp without stacking.
      if (nextCharacterIndex % 2 === 0 && nextCharacter && !/\s/.test(nextCharacter)) {
        playSound("prologueTypewriter");
      }
      nextCharacterIndex += 1;
      setTypedCharacters(nextCharacterIndex);
    }, 24);

    return () => window.clearInterval(timer);
  }, [page.id, segmentIndex, segmentText, totalCharacters]);

  const moveToPage = (nextPageIndex: number) => {
    setPageIndex(nextPageIndex);
    setSegmentIndex(0);
  };

  const showNextSegment = () => {
    if (hasMoreSegments) setSegmentIndex((index) => index + 1);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="前情提要"
      className="fixed inset-0 z-[100] overflow-hidden bg-black text-zinc-100 font-sans"
    >
      <div className="relative flex h-full w-full min-h-0 flex-col overflow-hidden bg-black">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-600/50 bg-zinc-950 px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-6">
          <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-amber-400 sm:text-xs">SCI // 前情提要</span>
          <button
            type="button"
            onClick={() => onComplete(true)}
            className="min-h-11 min-w-16 border border-zinc-600 px-3 text-xs font-bold text-zinc-200 hover:border-amber-400 hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            跳過
          </button>
        </header>

        <div
          key={page.id}
          className="flex min-h-0 flex-1 flex-col animate-fade-in"
          onClick={hasMoreSegments ? showNextSegment : undefined}
        >
          <div className="relative h-[400px] min-h-[400px] w-full shrink-0 overflow-hidden border-b border-amber-800/50 bg-[linear-gradient(135deg,#18181b_25%,#27272a_25%,#27272a_50%,#18181b_50%,#18181b_75%,#27272a_75%)] bg-[length:24px_24px] sm:h-[500px] sm:min-h-[500px]">
            {page.backgroundImage && (
              <img
                src={page.backgroundImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading={pageIndex === 0 ? "eager" : "lazy"}
                fetchPriority={pageIndex === 0 ? "high" : "auto"}
                decoding="async"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-black/30" />
            {page.characterImage && (
              <img src={page.characterImage} alt="" className="absolute bottom-0 left-1/2 h-full max-w-[65%] -translate-x-1/2 object-contain object-bottom" />
            )}
            {!page.backgroundImage && !page.characterImage && (
              <div className="absolute inset-0 grid place-items-center font-mono text-4xl font-black tracking-widest text-amber-700/50 select-none sm:text-6xl" aria-hidden="true">✦ SCI ✦</div>
            )}
            <span className="absolute bottom-2 left-4 border border-amber-600/50 bg-black/70 px-2 py-1 font-mono text-[10px] tracking-widest text-amber-300">STORY // {String(pageIndex + 1).padStart(2, "0")}</span>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-black px-4 py-4 sm:px-7 sm:py-6 lg:px-9"
            tabIndex={hasMoreSegments ? 0 : undefined}
            role={hasMoreSegments ? "button" : undefined}
            aria-label={hasMoreSegments ? "顯示下一段故事" : undefined}
            onKeyDown={hasMoreSegments ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                showNextSegment();
              }
            } : undefined}
          >
            <h2 className="mb-4 break-words border-l-4 border-amber-500 pl-3 text-xl font-black leading-snug tracking-wide text-white sm:text-3xl">{page.title}</h2>
            <div key={`${page.id}-${segmentIndex}`} className="space-y-3 pb-2 text-sm leading-[1.8] text-zinc-200 animate-fade-in sm:text-base">
              {currentSegment.paragraphs.map((paragraph, index) => {
                const previousCharacters = currentSegment.paragraphs
                  .slice(0, index)
                  .reduce((total, previousParagraph) => total + previousParagraph.text.length, 0);
                const visibleText = paragraph.text.slice(0, Math.max(0, typedCharacters - previousCharacters));
                const isTypingThisParagraph = typedCharacters >= previousCharacters
                  && typedCharacters < previousCharacters + paragraph.text.length;

                return (
                  <p
                    key={`${page.id}-${index}`}
                    className={paragraph.emphasis
                      ? "border-l-2 border-amber-500 bg-amber-500/10 px-3 py-2 text-base font-black leading-relaxed text-amber-300 sm:text-xl"
                      : ""}
                  >
                    {visibleText}
                    {isTypingThisParagraph && <span className="ml-0.5 inline-block h-[1em] w-1 animate-pulse bg-amber-400 align-[-0.12em]" aria-hidden="true" />}
                  </p>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-amber-600/50 bg-zinc-950 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-3">
          <div className="min-w-20">
            {pageIndex > 0 && (
              <button type="button" onClick={() => moveToPage(pageIndex - 1)} className="min-h-11 border border-zinc-600 px-3 text-xs font-bold hover:border-amber-400 focus-visible:outline-2 focus-visible:outline-amber-400 sm:px-5">上一頁</button>
            )}
          </div>
          <span className="shrink-0 font-mono text-xs font-bold text-amber-400" aria-label={`第 ${pageIndex + 1} 頁，共 ${prologuePages.length} 頁`}>{pageIndex + 1} / {prologuePages.length}</span>
          <button
            type="button"
            onClick={hasMoreSegments ? showNextSegment : (isLastPage ? () => onComplete(false) : () => moveToPage(pageIndex + 1))}
            className="min-h-11 min-w-24 border-2 border-amber-400 bg-amber-500 px-3 text-xs font-black text-black hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-white sm:px-6"
          >
            {hasMoreSegments ? "下一段" : (isLastPage ? "開始任務" : "下一頁")}
          </button>
        </footer>
      </div>
    </div>
  );
};
