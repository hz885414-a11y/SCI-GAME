import React from "react";
import { Character } from "../data/responses";
import { playSound } from "../utils/audio";
import { CharacterImage } from "./CharacterImage";
import { CharacterName, MOBILE_CHARACTER_DIALOGUE_IMAGES } from "../data/characterImages";
import type { CharacterLayoutValue } from "../config/types";

export type EmotionType = "dialog" | "happy" | "serious" | "sad" | "excited";

const CHARACTER_LAYOUT = {
  // imageScale/imageOffsetY compensate for unequal transparent PNG padding;
  // scale remains the actual in-world height relationship.
  claire: { scale: 0.94, x: 22, imageScale: 1.433, imageWidth: "clamp(720px, 76vw, 1080px)", imageOffsetX: 0, imageOffsetY: "clamp(-458px, -70vw, -280px)" },
  ethan: { scale: 1, x: 50, imageScale: 1.194, imageWidth: "auto", imageOffsetX: 0, imageOffsetY: "clamp(-322px, -45vw, -170px)" },
  leo: { scale: 1.06, x: 77, imageScale: 0.955, imageWidth: "auto", imageOffsetX: 0, imageOffsetY: "clamp(-144px, -15vw, -70px)" },
} as const;

export function detectEmotion(text: string, speakerId: string): EmotionType {
  const normalizedText = text.toLowerCase();
  
  // Specific indicators for "excited"
  if (
    normalizedText.includes("！") ||
    normalizedText.includes("!") ||
    normalizedText.includes("交給我") ||
    normalizedText.includes("衝啊") ||
    normalizedText.includes("太棒了") ||
    normalizedText.includes("哇") ||
    normalizedText.includes("居然") ||
    normalizedText.includes("竟然") ||
    normalizedText.includes("怎麼可能") ||
    normalizedText.includes("震撼") ||
    normalizedText.includes("哈哈") ||
    normalizedText.includes("對啊") ||
    normalizedText.includes("當然")
  ) {
    return "excited";
  }

  // Specific indicators for "sad" / "anxious" / "tender empathy"
  if (
    normalizedText.includes("難過") ||
    normalizedText.includes("焦慮") ||
    normalizedText.includes("痛") ||
    normalizedText.includes("哭") ||
    normalizedText.includes("心碎") ||
    normalizedText.includes("寂寞") ||
    normalizedText.includes("孤單") ||
    normalizedText.includes("委屈") ||
    normalizedText.includes("煎熬") ||
    normalizedText.includes("害怕") ||
    normalizedText.includes("受傷") ||
    normalizedText.includes("累") ||
    normalizedText.includes("對不起") ||
    normalizedText.includes("抱抱") ||
    normalizedText.includes("唉") ||
    normalizedText.includes("心疼")
  ) {
    return "sad";
  }

  // Specific indicators for "serious" / "analytical"
  if (
    normalizedText.includes("事實") ||
    normalizedText.includes("分析") ||
    normalizedText.includes("統計") ||
    normalizedText.includes("機率") ||
    normalizedText.includes("理智") ||
    normalizedText.includes("數據") ||
    normalizedText.includes("故障") ||
    normalizedText.includes("bug") ||
    normalizedText.includes("系統") ||
    normalizedText.includes("冷靜") ||
    normalizedText.includes("嚴肅") ||
    normalizedText.includes("公式") ||
    normalizedText.includes("定義") ||
    normalizedText.includes("規則") ||
    normalizedText.includes("理論") ||
    normalizedText.includes("百分之") ||
    normalizedText.includes("%") ||
    normalizedText.includes("統計學")
  ) {
    return "serious";
  }

  // Ordinary speech uses the dedicated, natural half-body dialogue artwork.
  return "dialog";
}

interface CharacterStandeeProps {
  character: Character;
  isActive: boolean;
  isSpeaking: boolean;
  isAnySpeaking: boolean;
  onInteraction: () => boolean;
  customImages: Record<EmotionType, string | null> | null;
  emotion: EmotionType;
  layout?: CharacterLayoutValue;
}

export const CharacterStandee: React.FC<CharacterStandeeProps> = ({
  character,
  isActive,
  isSpeaking,
  isAnySpeaking,
  onInteraction,
  customImages,
  emotion,
  layout: configuredLayout,
}) => {
  const [isMobileViewport, setIsMobileViewport] = React.useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767.98px)").matches,
  );

  React.useEffect(() => {
    const media = window.matchMedia("(max-width: 767.98px)");
    const syncViewport = () => setIsMobileViewport(media.matches);
    syncViewport();
    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, []);

  // `customImages` is always a settings object, even before the user uploads
  // anything. Check this individual emotion instead of the object itself.
  // Otherwise phones never receive their compact WebP source and decode the
  // original multi-megapixel PNGs for all three characters.
  const customImgUrl = customImages?.[emotion] ?? null;

  const handleClick = () => {
    // Only play a sound for an accepted dialogue action. In particular this
    // prevents a rapid mobile tap stream from allocating many Web Audio nodes
    // after the dialogue throttle has already rejected those taps.
    if (onInteraction()) playSound("bubble");
  };

  const fallbackLayout = CHARACTER_LAYOUT[character.id as keyof typeof CHARACTER_LAYOUT] || CHARACTER_LAYOUT.ethan;
  const layout = configuredLayout ?? fallbackLayout;
  // Firebase layout values use offsetX / offsetY. The original static layout
  // used imageOffsetX / imageOffsetY, so reading only the latter produced an
  // invalid `calc(... undefinedpx)` declaration on mobile. Browsers then fell
  // back to their static image placement and cropped each portrait into a
  // narrow column. Support both field names for legacy local layouts.
  const imageOffsetX = configuredLayout?.offsetX ?? fallbackLayout.imageOffsetX ?? 0;
  const imageOffsetY = configuredLayout?.offsetY ?? fallbackLayout.imageOffsetY ?? 0;
  const imageWidth = configuredLayout ? "auto" : fallbackLayout.imageWidth;
  const speakingScale = isSpeaking ? 1.045 : 1;
  const translateY = isSpeaking ? -12 : 0;
  const visualOpacity = isAnySpeaking && !isSpeaking ? (isMobileViewport ? 0.66 : 0.72) : 1;
  const visualBrightness = isAnySpeaking && !isSpeaking ? 0.65 : 1;
  const mobileSrc = customImgUrl
    ? undefined
    : MOBILE_CHARACTER_DIALOGUE_IMAGES[character.id as CharacterName];
  const beamColor = character.id === "claire"
    ? "from-rose-950 via-rose-900/30 to-transparent"
    : character.id === "ethan"
      ? "from-sky-950 via-sky-900/30 to-transparent"
      : "from-amber-950 via-amber-900/30 to-transparent";

  return (
    <div
      onClick={handleClick}
      className="dialogue-character pointer-events-auto absolute bottom-[-210px] sm:bottom-[-155px] cursor-pointer select-none"
      style={{
        left: `${layout.x}%`,
        width: "clamp(280px, 31vw, 460px)",
        height: `${layout.baseHeightPx ?? Math.round((layout.baseHeightVh ?? 88) * 9)}px`,
        zIndex: isSpeaking ? 30 : 10,
        opacity: visualOpacity,
        // Filters can promote each large transparent portrait to a costly GPU
        // layer. On mobile opacity and transform retain the speaking cue.
        filter: isMobileViewport ? "none" : `brightness(${visualBrightness}) drop-shadow(0 18px 18px rgba(0,0,0,.62))`,
        transform: `translateX(-50%) translateY(${translateY}px) scale(${layout.scale * speakingScale})`,
        transformOrigin: "bottom center",
        transition: isMobileViewport
          ? "transform 160ms ease, opacity 160ms ease"
          : "transform 220ms ease, opacity 220ms ease, filter 220ms ease",
      }}
    >
      {/* Light Beam Effect under character */}
      {isSpeaking && (
        <div
          className={isMobileViewport
            ? `absolute bottom-24 h-20 w-16 bg-gradient-to-t opacity-35 -z-10 ${beamColor}`
            : `absolute bottom-20 sm:bottom-24 w-20 sm:w-36 h-64 sm:h-96 bg-gradient-to-t blur-2xl opacity-40 -z-10 animate-pulse transition-all duration-500 ${beamColor}`}
        />
      )}

      <div className="character-sprite absolute inset-0 overflow-visible">
            <CharacterImage
              character={character.id as CharacterName}
              mood={
                emotion === "sad"
                  ? "normal"
                  : emotion === "serious"
                  ? "think"
                  : emotion === "excited"
                  ? "surprise"
                  : emotion === "happy"
                  ? "happy"
                  : emotion === "dialog"
                  ? "dialog"
                  : "normal"
              }
              alt={`${character.name} (${emotion})`}
              className="absolute max-w-none"
              style={{
                width: imageWidth,
                height: `${layout.imageScale * 100}%`,
                maxWidth: "none",
                left: `calc(50% + ${imageOffsetX}px)`,
                bottom: `${imageOffsetY}px`,
                objectFit: "contain",
                objectPosition: "center bottom",
                transform: "translateX(-50%)",
              }}
              src={customImgUrl || undefined}
              mobileSrc={mobileSrc}
              priority={isSpeaking}
            />
      </div>

    </div>
  );
};

interface CustomSpeechBubbleProps {
  characterId: string;
  text: string;
}

export const CustomSpeechBubble: React.FC<CustomSpeechBubbleProps> = ({ characterId, text }) => {
  const getBubbleTheme = () => {
    switch (characterId) {
      case "claire":
        return "bg-rose-950/80 border-rose-500/60 text-rose-200";
      case "ethan":
        return "bg-sky-950/80 border-sky-500/60 text-sky-200";
      case "leo":
        return "bg-amber-950/80 border-amber-500/60 text-amber-200";
      default:
        return "bg-zinc-900/80 border-zinc-600/60 text-zinc-200";
    }
  };

  const getBubblePosition = () => {
    switch (characterId) {
      case "claire":
        return "left-[16.6%]";
      case "ethan":
        return "left-1/2";
      case "leo":
        return "left-[83.3%]";
      default:
        return "left-1/2";
    }
  };

  return (
    <div
      className={`hidden md:block absolute bottom-[270px] sm:bottom-[360px] md:bottom-[390px] lg:bottom-[410px] -translate-x-1/2 max-w-[200px] w-[180px] p-2.5 rounded-xl border backdrop-blur-md shadow-lg z-30 text-xs text-center font-medium leading-relaxed select-none animate-fade-in-up
        ${getBubblePosition()}
        ${getBubbleTheme()}
      `}
    >
      {text}
      {/* Speech pointer bubble triangle */}
      <div
        className={`absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r border-b backdrop-blur-md
          ${getBubbleTheme()}
        `}
      />
    </div>
  );
};
