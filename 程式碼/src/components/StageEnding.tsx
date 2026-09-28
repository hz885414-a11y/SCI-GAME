import { useEffect, useMemo, useState } from "react";
import { playSound } from "../utils/audio";
import { useGameConfig } from "../config/GameConfigContext";

export interface StageEndingSummary {
  defeatedBosses: number;
  collectedMaterials: number;
  earnedCards: number;
  triggeredEvents: number;
  robotCompletion: number;
  totalPlaySeconds: number;
}

function formatPlayTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return hours > 0 ? `${hours} 小時 ${minutes} 分` : `${minutes} 分 ${remainingSeconds} 秒`;
}

export function StageEnding({ summary, onReturnToBase }: { summary: StageEndingSummary; onReturnToBase: () => void }) {
  const { config } = useGameConfig();
  const pages = config.ending;
  const [pageIndex, setPageIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [typedCharacters, setTypedCharacters] = useState(0);
  const page = pages[pageIndex];
  const pageParagraphs = (page?.segments ?? [{ paragraphs: page?.paragraphs ?? [] }]).flatMap((segment) => segment.paragraphs);
  const pageText = pageParagraphs.map((paragraph) => paragraph.text).join("");
  const totalCharacters = pageText.length;

  useEffect(() => {
    if (showSummary) return;
    setTypedCharacters(0);
    let nextCharacterIndex = 0;
    const timer = window.setInterval(() => {
      if (nextCharacterIndex >= totalCharacters) {
        window.clearInterval(timer);
        return;
      }
      const nextCharacter = pageText[nextCharacterIndex];
      if (nextCharacterIndex % 2 === 0 && nextCharacter && !/\s/.test(nextCharacter)) playSound("prologueTypewriter");
      nextCharacterIndex += 1;
      setTypedCharacters(nextCharacterIndex);
    }, 24);
    return () => window.clearInterval(timer);
  }, [page?.id, pageText, showSummary, totalCharacters]);
  const summaryItems = useMemo(() => [
    ["擊敗魔王數量", `${summary.defeatedBosses} / 6`],
    ["收集零件數量", String(summary.collectedMaterials)],
    ["獲得卡片數量", String(summary.earnedCards)],
    ["觸發事件數量", String(summary.triggeredEvents)],
    ["機器人完成度", `${summary.robotCompletion}%`],
    ["總遊玩時間", formatPlayTime(summary.totalPlaySeconds)],
  ], [summary]);

  if (!page) return null;
  return <div role="dialog" aria-modal="true" aria-label="階段性結局" className="fixed inset-0 z-[120] overflow-hidden bg-black text-zinc-100 font-sans">
    {!showSummary ? <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-amber-600/50 bg-zinc-950 px-4 py-3 sm:px-6"><span className="font-mono text-xs font-bold tracking-[.2em] text-amber-400">SCI // 階段性結局</span><span className="font-mono text-xs text-zinc-400">ENDING {pageIndex + 1} / {pages.length}</span></header>
      <main key={page.id} className="flex min-h-0 flex-1 flex-col animate-fade-in">
        <div className="relative min-h-[48vh] flex-1 overflow-hidden border-b border-amber-800/50 bg-[radial-gradient(circle_at_center,#422006_0%,#18181b_42%,#000_100%)]">
          {page.backgroundImage ? <img src={page.backgroundImage} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 grid place-items-center"><div className="text-center text-amber-500/35"><div className="text-7xl sm:text-9xl">✦</div><div className="mt-3 font-mono text-xs tracking-[.4em]">STORY IMAGE COMING SOON</div></div></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
          <span className="absolute bottom-3 left-4 border border-amber-600/50 bg-black/75 px-3 py-1 font-mono text-[10px] tracking-widest text-amber-300">ENDING STORY // {String(pageIndex + 1).padStart(2, "0")}</span>
        </div>
        <div className="max-h-[42vh] shrink-0 overflow-y-auto bg-black px-5 py-5 sm:px-10"><h2 className="border-l-4 border-amber-500 pl-3 text-xl font-black text-white sm:text-3xl">{page.title}</h2><div className="mt-4 space-y-3 text-sm leading-7 text-zinc-200 sm:text-base">{pageParagraphs.map((paragraph, index) => { const previousCharacters = pageParagraphs.slice(0, index).reduce((total, item) => total + item.text.length, 0); const visibleText = paragraph.text.slice(0, Math.max(0, typedCharacters - previousCharacters)); const isTyping = typedCharacters >= previousCharacters && typedCharacters < previousCharacters + paragraph.text.length; return <p key={`${page.id}-${index}`} className={paragraph.emphasis ? "border-l-2 border-amber-500 bg-amber-500/10 px-3 py-2 font-black text-amber-300" : ""}>{visibleText}{isTyping && <span className="ml-0.5 inline-block h-[1em] w-1 animate-pulse bg-amber-400 align-[-.12em]" aria-hidden="true" />}</p>; })}</div></div>
      </main>
      <footer className="flex shrink-0 items-center justify-between border-t border-amber-600/50 bg-zinc-950 px-4 py-3 sm:px-6"><button type="button" disabled={pageIndex === 0} onClick={() => setPageIndex((index) => index - 1)} className="min-h-11 border border-zinc-600 px-5 text-xs font-bold disabled:invisible">上一頁</button><button type="button" onClick={() => pageIndex === pages.length - 1 ? setShowSummary(true) : setPageIndex((index) => index + 1)} className="min-h-11 border-2 border-amber-400 bg-amber-500 px-7 text-xs font-black text-black hover:bg-amber-300">{pageIndex === pages.length - 1 ? "查看結算" : "下一頁"}</button></footer>
    </div> : <div className="flex h-full items-center justify-center overflow-y-auto bg-[radial-gradient(circle_at_top,#292524_0%,#09090b_50%,#000_100%)] p-5"><section className="w-full max-w-3xl border border-amber-500/50 bg-zinc-950/95 p-5 shadow-[0_0_60px_rgba(245,158,11,.18)] sm:p-8"><div className="text-center"><div className="text-5xl">🏆</div><p className="mt-3 font-mono text-xs tracking-[.3em] text-amber-400">STAGE CLEAR REPORT</p><h2 className="mt-2 text-3xl font-black text-white">燈燈小隊階段結算</h2></div><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">{summaryItems.map(([label, value]) => <div key={label} className="border border-zinc-800 bg-black/70 p-4 text-center"><div className="text-xs text-zinc-500">{label}</div><div className="mt-2 text-xl font-black text-amber-300 sm:text-2xl">{value}</div></div>)}</div><button type="button" onClick={onReturnToBase} className="mt-7 min-h-14 w-full bg-amber-500 text-base font-black text-black hover:bg-amber-300">回到基地</button></section></div>}
  </div>;
}
