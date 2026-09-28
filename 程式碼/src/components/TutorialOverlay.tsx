import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { characterImages } from "../data/characterImages";
import { CHARACTERS } from "../data/responses";
import { tutorialSteps, type TutorialSpeaker, type TutorialTarget } from "../data/tutorial";
import { playSound } from "../utils/audio";
import type { CharacterBreakpoint, CharacterId, CharacterLayoutConfig } from "../config/types";

interface TutorialOverlayProps {
  onComplete: () => void;
  characterLayouts: CharacterLayoutConfig;
  characterBreakpoint: CharacterBreakpoint;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const speakerNames: Record<TutorialSpeaker, string> = {
  claire: "Claire",
  ethan: "Ethan",
  leo: "Leo",
  all: "燈燈小隊",
};

const speakerStyles: Record<TutorialSpeaker, string> = {
  claire: "border-rose-500/70 text-rose-200 shadow-[0_0_28px_rgba(244,63,94,0.12)]",
  ethan: "border-sky-500/70 text-sky-200 shadow-[0_0_28px_rgba(14,165,233,0.12)]",
  leo: "border-amber-500/70 text-amber-200 shadow-[0_0_28px_rgba(245,158,11,0.12)]",
  all: "border-orange-500/70 text-orange-200 shadow-[0_0_28px_rgba(249,115,22,0.12)]",
};

function getSpotlightRect(target: TutorialTarget | null): SpotlightRect | null {
  if (!target) return null;
  const element = document.querySelector<HTMLElement>(`[data-tutorial-target="${target}"]`);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  const padding = 8;
  const left = Math.max(0, rect.left - padding);
  const top = Math.max(0, rect.top - padding);
  const right = Math.min(window.innerWidth, rect.right + padding);
  const bottom = Math.min(window.innerHeight, rect.bottom + padding);
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete, characterLayouts, characterBreakpoint }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const step = tutorialSteps[stepIndex];
  const line = step?.dialogue[lineIndex];
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [dialogueTop, setDialogueTop] = useState<number | null>(null);
  const dialogueButtonRef = useRef<HTMLButtonElement | null>(null);
  const speakerCharacter = useMemo(
    () => line?.speaker === "all" ? null : CHARACTERS.find((character) => character.id === line?.speaker) ?? null,
    [line?.speaker],
  );

  useEffect(() => {
    const base = document.getElementById("game-container");
    if (!base) return;
    const wasInert = base.inert;
    base.inert = true;
    return () => {
      base.inert = wasInert;
    };
  }, []);

  useEffect(() => {
    if (!step) return;
    const update = () => setSpotlight(getSpotlightRect(step.target));
    update();
    const observer = new ResizeObserver(update);
    const target = step.target
      ? document.querySelector<HTMLElement>(`[data-tutorial-target="${step.target}"]`)
      : null;
    if (target) observer.observe(target);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.addEventListener("scroll", update, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step]);

  useEffect(() => {
    const update = () => {
      const rect = dialogueButtonRef.current?.getBoundingClientRect();
      if (rect) setDialogueTop(rect.top);
    };
    update();
    const observer = new ResizeObserver(update);
    if (dialogueButtonRef.current) observer.observe(dialogueButtonRef.current);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [stepIndex, lineIndex]);

  if (!step || !line) return null;

  const advance = () => {
    playSound("click");
    if (lineIndex < step.dialogue.length - 1) {
      setLineIndex((index) => index + 1);
      return;
    }
    if (stepIndex < tutorialSteps.length - 1) {
      setStepIndex((index) => index + 1);
      setLineIndex(0);
      return;
    }
    onComplete();
  };

  const skipTutorial = () => {
    playSound("click");
    onComplete();
  };

  const spotlightStyle = spotlight
    ? {
        top: spotlight.top,
        left: spotlight.left,
        width: spotlight.width,
        height: spotlight.height,
      }
    : undefined;
  const shortViewport = typeof window !== "undefined" && window.innerHeight < 500;
  const portraitBottom = dialogueTop === null
    ? "max(0.75rem, env(safe-area-inset-bottom))"
    : `calc(100dvh - ${dialogueTop}px - ${shortViewport ? 18 : 32}px)`;
  const portraitStyle = (speaker: CharacterId, grouped = false): React.CSSProperties => {
    const layout = characterLayouts[speaker][characterBreakpoint];
    const baseHeight = layout.baseHeightPx ?? Math.round((layout.baseHeightVh ?? 88) * 9);
    const groupedLeft: Record<CharacterId, number> = { claire: 20, ethan: 50, leo: 80 };
    return {
      height: `${baseHeight * layout.scale * layout.imageScale}px`,
      width: "auto",
      maxWidth: "none",
      bottom: `calc(${portraitBottom} + ${layout.offsetY}px)`,
      left: `${grouped ? groupedLeft[speaker] : 22}%`,
      transform: "translateX(-50%)",
    };
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="燈燈小隊新手導覽"
      className="fixed inset-0 z-[120] select-none"
      onClick={(event) => event.stopPropagation()}
    >
      {!spotlight && <div className="absolute inset-0 bg-black/70" />}
      {spotlight && (
        <>
          <div className="absolute inset-x-0 top-0 bg-black/70" style={{ height: spotlight.top }} />
          <div
            className="absolute inset-x-0 bottom-0 bg-black/70"
            style={{ top: spotlight.top + spotlight.height }}
          />
          <div
            className="absolute left-0 bg-black/70"
            style={{ top: spotlight.top, width: spotlight.left, height: spotlight.height }}
          />
          <div
            className="absolute right-0 bg-black/70"
            style={{ top: spotlight.top, left: spotlight.left + spotlight.width, height: spotlight.height }}
          />
          <div
            aria-hidden="true"
            className="absolute rounded-sm border-2 border-amber-300 bg-transparent shadow-[0_0_22px_rgba(251,191,36,0.72)] animate-pulse"
            style={spotlightStyle}
          />
          {/* Keep the revealed element highlighted but non-interactive until the guide advances. */}
          <div aria-hidden="true" className="absolute cursor-default" style={spotlightStyle} />
        </>
      )}

      <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden" aria-hidden="true">
        {line.speaker === "all" ? (
          <>
            {(["claire", "ethan", "leo"] as const).map((speaker) => (
              <img key={speaker} src={characterImages[speaker].happy} alt="" className="absolute object-contain object-bottom drop-shadow-[0_10px_24px_rgba(0,0,0,0.75)]" style={portraitStyle(speaker, true)} />
            ))}
          </>
        ) : (
          <img
            key={`${step.id}-${line.speaker}`}
            src={characterImages[line.speaker][line.speaker === "claire" ? "happy" : "normal"]}
            alt=""
            className="absolute w-auto object-contain object-bottom drop-shadow-[0_10px_24px_rgba(0,0,0,0.75)]"
            style={portraitStyle(line.speaker)}
          />
        )}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto relative w-full">
            <button
              type="button"
              onClick={skipTutorial}
              className="absolute -top-12 right-0 z-40 min-h-10 border border-zinc-500 bg-zinc-950/95 px-4 font-mono text-[10px] font-black tracking-widest text-zinc-200 shadow-[0_0_18px_rgba(0,0,0,0.75)] backdrop-blur hover:border-amber-400 hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-amber-300 sm:-top-14 sm:min-h-11 sm:text-xs"
              aria-label="跳過新手教學"
            >
              跳過 <span className="text-amber-400">SKIP</span>
            </button>
            <button
              ref={dialogueButtonRef}
              type="button"
              onClick={advance}
              className={`relative min-h-28 w-full cursor-pointer border bg-zinc-950/95 px-3 pb-3 pt-4 text-left backdrop-blur-md transition-colors hover:bg-zinc-900/95 focus-visible:outline-2 focus-visible:outline-amber-300 sm:min-h-36 sm:px-6 sm:pb-4 sm:pt-5 ${speakerStyles[line.speaker]}`}
            >
              <span className="absolute -top-3 left-3 border border-current bg-zinc-950 px-2 py-1 text-[10px] font-black tracking-wider sm:left-6 sm:text-xs">
                {speakerNames[line.speaker]} <span className="opacity-50">// {step.title}</span>
              </span>
              <span aria-live="polite" className="block max-h-[22dvh] overflow-y-auto pr-1 text-sm font-medium leading-relaxed text-zinc-100 sm:text-lg">
                {line.text}
              </span>
              <span className="mt-2 flex items-center justify-between border-t border-zinc-800 pt-2 font-mono text-[9px] text-zinc-500 sm:text-[10px]">
                <span>{stepIndex + 1} / {tutorialSteps.length}　•　{lineIndex + 1} / {step.dialogue.length}</span>
                <span className="font-bold text-amber-400">{stepIndex === tutorialSteps.length - 1 && lineIndex === step.dialogue.length - 1 ? "完成導覽　▼" : "下一步　▼"}</span>
              </span>
            </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
