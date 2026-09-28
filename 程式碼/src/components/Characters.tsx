import React from "react";
import { Character } from "../data/responses";
import { playSound } from "../utils/audio";
import { CharacterImage } from "./CharacterImage";
import { characterImages, CharacterName, CharacterMood } from "../data/characterImages";
import type { CharacterLayoutValue } from "../config/types";
// @ts-ignore
import claireNormalImg from "../claire_normal.png";
// @ts-ignore
import claireHappyImg from "../claire_happy.png";
// @ts-ignore
import claireSadImg from "../claire_sad.png";
// @ts-ignore
import claireThinkImg from "../claire_think.png";
// @ts-ignore
import ethanImg from "../ethan.png";
// @ts-ignore
import leoImg from "../leo.png";

export type EmotionType = "dialog" | "happy" | "serious" | "sad" | "excited";

const CHARACTER_LAYOUT = {
  // imageScale/imageOffsetY compensate for unequal transparent PNG padding;
  // scale remains the actual in-world height relationship.
  claire: { scale: 0.94, x: 22, imageScale: 1.433, imageWidth: "clamp(720px, 76vw, 1080px)", imageOffsetX: 0, imageOffsetY: "clamp(-458px, -70vw, -280px)" },
  ethan: { scale: 1, x: 50, imageScale: 1.194, imageWidth: "auto", imageOffsetX: 0, imageOffsetY: "clamp(-322px, -45vw, -170px)" },
  leo: { scale: 1.06, x: 77, imageScale: 0.955, imageWidth: "auto", imageOffsetX: 0, imageOffsetY: "clamp(-144px, -15vw, -70px)" },
} as const;

/**
 * 🎨 預設人物情緒照片設定區 (自動對話串接表情)
 * 您可以將此處的網址或圖片，直接替換為您的本地圖片變數（例如 claireImg）或任何網路相片 URL。
 * 系統在讀取對話時，會根據情緒自動切換為對應的相片立繪。
 */
export const DEFAULT_CHARACTER_EMOTIONS: Record<string, Record<EmotionType, string>> = {
  claire: {
    dialog: characterImages.claire.dialog,
    happy: characterImages.claire.happy,
    serious: characterImages.claire.think,
    sad: characterImages.claire.normal,
    excited: characterImages.claire.surprise,
  },
  ethan: {
    dialog: characterImages.ethan.dialog,
    happy: characterImages.ethan.happy,
    serious: characterImages.ethan.think,
    sad: characterImages.ethan.normal,
    excited: characterImages.ethan.surprise,
  },
  leo: {
    dialog: characterImages.leo.dialog,
    happy: characterImages.leo.happy,
    serious: characterImages.leo.think,
    sad: characterImages.leo.normal,
    excited: characterImages.leo.surprise,
  },
};

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
  onInteraction: () => void;
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
  const [useFallback, setUseFallback] = React.useState(false);

  React.useEffect(() => {
    setUseFallback(false);
  }, [character.id, emotion, customImages]);

  const defaultLocal = character.id === "claire"
    ? (emotion === "sad"
        ? claireSadImg
        : emotion === "serious"
          ? claireThinkImg
          : emotion === "excited" || emotion === "happy"
            ? claireHappyImg
            : claireNormalImg)
    : character.id === "ethan"
      ? ethanImg
      : leoImg;
  
  // Choose source
  const customImgUrl = customImages ? customImages[emotion] : null;
  const configImgUrl = DEFAULT_CHARACTER_EMOTIONS[character.id]?.[emotion];
  const currentSrc = useFallback ? defaultLocal : (customImgUrl || configImgUrl || defaultLocal);

  const handleImageError = () => {
    setUseFallback(true);
  };

  const handleClick = () => {
    playSound("bubble");
    onInteraction();
  };

  const fallbackLayout = CHARACTER_LAYOUT[character.id as keyof typeof CHARACTER_LAYOUT] || CHARACTER_LAYOUT.ethan;
  const layout = configuredLayout ? { ...configuredLayout, imageWidth: character.id === "claire" ? "clamp(720px, 76vw, 1080px)" : "auto" } : fallbackLayout;
  const speakingScale = isSpeaking ? 1.045 : 1;
  const translateY = isSpeaking ? -12 : 0;
  const visualOpacity = isAnySpeaking && !isSpeaking ? 0.72 : 1;
  const visualBrightness = isAnySpeaking && !isSpeaking ? 0.65 : 1;

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
        filter: `brightness(${visualBrightness}) drop-shadow(0 18px 18px rgba(0,0,0,.62))`,
        transform: `translateX(-50%) translateY(${translateY}px) scale(${layout.scale * speakingScale})`,
        transformOrigin: "bottom center",
        transition: "transform 220ms ease, opacity 220ms ease, filter 220ms ease",
      }}
    >
      {/* Light Beam Effect under character */}
      {isSpeaking && (
        <div
          className={`absolute bottom-20 sm:bottom-24 w-20 sm:w-36 h-64 sm:h-96 bg-gradient-to-t blur-2xl opacity-40 -z-10 animate-pulse transition-all duration-500
            ${
              character.id === "claire"
                ? "from-rose-950 via-rose-900/30 to-transparent"
                : character.id === "ethan"
                  ? "from-sky-950 via-sky-900/30 to-transparent"
                  : "from-amber-950 via-amber-900/30 to-transparent"
            }
          `}
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
                width: layout.imageWidth,
                height: `${layout.imageScale * 100}%`,
                maxWidth: "none",
                left: `calc(50% + ${layout.imageOffsetX}px)`,
                bottom: typeof layout.imageOffsetY === "number" ? `${layout.imageOffsetY}px` : layout.imageOffsetY,
                objectFit: "contain",
                objectPosition: "center bottom",
                transform: "translateX(-50%)",
              }}
              src={customImages ? customImages[emotion] || undefined : undefined}
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
