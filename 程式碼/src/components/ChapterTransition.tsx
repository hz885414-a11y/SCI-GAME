import { ChevronRight } from "lucide-react";
import { gameCharacterSprites } from "../data/gameCharacterSprites";
import { prologuePages } from "../data/prologue";
import type { ChapterTransitionBeat, TransitionSpeaker } from "../data/chapterTransitions";

const SPEAKERS: Record<TransitionSpeaker, string> = {
  narrator: "旁白",
  researcher: "避難所研究員",
  claire: "Claire",
  ethan: "Ethan",
  leo: "Leo",
};

export function ChapterTransition({ beats, index, onAdvance, onChoose, choiceSelected, title = "CHAPTER 01 → 02", finishLabel = "返回基地・準備第二章" }: {
  beats: ChapterTransitionBeat[];
  index: number;
  onAdvance: () => void;
  onChoose?: (id: string) => void;
  choiceSelected?: boolean;
  title?: string;
  finishLabel?: string;
}) {
  const beat = beats[index];
  const characterImage = beat.speaker in gameCharacterSprites
    ? gameCharacterSprites[beat.speaker as keyof typeof gameCharacterSprites]
    : null;
  const backgroundImage = prologuePages[1]?.backgroundImage;
  const last = index === beats.length - 1;

  return (
    <div className="absolute inset-0 z-[90] flex items-end justify-center overflow-y-auto bg-[#030b13] p-3 pb-[max(18px,env(safe-area-inset-bottom))] sm:items-center sm:p-8" role="dialog" aria-modal="true" aria-label={title}>
      {backgroundImage && <div className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url("${backgroundImage}")` }} />}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#030b13]/25 via-[#030b13]/60 to-[#030b13]" />
      <div className="relative z-10 flex w-full max-w-3xl flex-col gap-4 rounded-xl border border-cyan-400/50 bg-slate-950/90 p-4 shadow-[0_0_50px_rgba(34,211,238,.17)] sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-black tracking-[.22em] text-cyan-300">{title}</span>
          <span className="font-mono text-xs text-cyan-100">{index + 1} / {beats.length}</span>
        </div>
        <div className="flex min-h-[200px] items-center gap-3 sm:gap-7">
          {characterImage ? (
            <img src={characterImage} alt={SPEAKERS[beat.speaker]} className="h-36 w-28 shrink-0 object-contain [image-rendering:pixelated] sm:h-52 sm:w-44" />
          ) : (
            <div className="flex h-36 w-28 shrink-0 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-950/20 text-center text-3xl text-cyan-200 sm:h-52 sm:w-44" aria-hidden="true">{beat.speaker === "researcher" ? "▣" : "✦"}</div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="mb-3 text-base font-black text-cyan-200 sm:text-lg">{SPEAKERS[beat.speaker]}</h2>
            <p className="text-sm leading-7 text-white sm:text-lg sm:leading-9">{beat.text}</p>
          </div>
        </div>
        {beat.clue && (
          <div className="flex items-center gap-4 rounded-lg border border-amber-300/55 bg-amber-950/25 p-3 sm:p-4">
            {beat.clue.image && <img src={beat.clue.image} alt="" className="h-20 w-20 shrink-0 object-contain [image-rendering:pixelated] sm:h-28 sm:w-28" />}
            <div><p className="text-[10px] font-black tracking-widest text-amber-300">{beat.clue.label}</p><h3 className="mt-1 text-base font-black text-white">{beat.clue.title}</h3><p className="mt-1 text-xs leading-5 text-amber-100/85 sm:text-sm">{beat.clue.detail}</p></div>
          </div>
        )}
        {beat.choice && !choiceSelected && onChoose ? (
          <div className="grid gap-2" role="group" aria-label="選擇小隊的下一步">
            {beat.choice.map((option) => <button key={option.id} type="button" onClick={() => onChoose(option.id)} className="min-h-12 rounded-lg border border-cyan-300/65 bg-cyan-950/70 px-4 py-3 text-left text-sm font-bold text-cyan-100 hover:bg-cyan-800/70">{option.label}</button>)}
          </div>
        ) : (
          <button type="button" onClick={onAdvance} autoFocus className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200">
            {last ? finishLabel : "繼續對話"}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
