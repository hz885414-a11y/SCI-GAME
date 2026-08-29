import React from "react";
import { Character } from "../data/responses";
import { playSound } from "../utils/audio";
import { CharacterImage } from "./CharacterImage";
import { CharacterName, CharacterMood } from "../data/characterImages";
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

export type EmotionType = "happy" | "serious" | "sad" | "excited";

/**
 * 🎨 預設人物情緒照片設定區 (自動對話串接表情)
 * 您可以將此處的網址或圖片，直接替換為您的本地圖片變數（例如 claireImg）或任何網路相片 URL。
 * 系統在讀取對話時，會根據情緒自動切換為對應的相片立繪。
 */
export const DEFAULT_CHARACTER_EMOTIONS: Record<string, Record<EmotionType, string>> = {
  claire: {
    happy: claireHappyImg,
    serious: claireThinkImg,
    sad: claireSadImg,
    excited: claireHappyImg,
  },
  ethan: {
    happy: ethanImg, // 預設 Ethan
    serious: ethanImg, // 認真
    sad: ethanImg, // 難過
    excited: ethanImg, // 興奮
  },
  leo: {
    happy: leoImg, // 預設 Leo
    serious: leoImg, // 認真
    sad: leoImg, // 難過
    excited: leoImg, // 興奮
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

  // Default based on speaker typical state
  if (speakerId === "ethan") {
    return "serious";
  }
  return "happy";
}

interface CharacterStandeeProps {
  character: Character;
  isActive: boolean;
  isSpeaking: boolean;
  isAnySpeaking: boolean;
  onInteraction: () => void;
  customImages: Record<EmotionType, string | null> | null;
  emotion: EmotionType;
}

export const CharacterStandee: React.FC<CharacterStandeeProps> = ({
  character,
  isActive,
  isSpeaking,
  isAnySpeaking,
  onInteraction,
  customImages,
  emotion,
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

  // Determine elegant responsive stacking styles
  let stateClasses = "";
  if (isAnySpeaking) {
    if (isSpeaking) {
      stateClasses = "scale-[1.06] translate-y-1 z-30 opacity-100 grayscale-0 filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]";
    } else {
      stateClasses = "scale-[0.88] translate-y-6 z-10 opacity-30 grayscale pointer-events-none";
    }
  } else {
    // Idle mode (no active speaker): middle card (Ethan) starts slightly in front
    const defaultZ = character.id === "ethan" ? "z-20" : "z-10";
    stateClasses = `scale-[0.96] translate-y-4 ${defaultZ} opacity-90 hover:opacity-100 hover:scale-[1.04] hover:z-30 hover:translate-y-1 hover:grayscale-0 transition-all duration-300`;
  }

  return (
    <div
      onClick={handleClick}
      className={`relative flex flex-col items-center justify-end transition-all duration-500 cursor-pointer select-none transform mx-auto
        w-[110px] xs:w-[135px] sm:w-full sm:max-w-[180px] md:max-w-[200px] -mx-3 xs:-mx-4 sm:mx-auto
        ${stateClasses}
      `}
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

      {/* Character Card / Artwork container */}
      <div className="relative w-full h-[140px] xs:h-[180px] sm:h-[280px] md:h-[320px] lg:h-[350px] flex items-end justify-center">
        {/* Standard outline of the card */}
        <div
          className={`absolute inset-0 rounded-t-full border-x border-t transition-all duration-300 shadow-2xl overflow-hidden
            ${
              character.id === "claire"
                ? `bg-gradient-to-t from-rose-950/40 to-zinc-900 ${isSpeaking ? "border-rose-500/80 shadow-[0_0_40px_rgba(244,63,94,0.15)]" : "border-zinc-800"}`
                : character.id === "ethan"
                  ? `bg-gradient-to-t from-sky-950/40 to-zinc-900 ${isSpeaking ? "border-sky-500/80 shadow-[0_0_40px_rgba(14,165,233,0.15)]" : "border-zinc-800"}`
                  : `bg-gradient-to-t from-amber-950/40 to-zinc-900 ${isSpeaking ? "border-amber-500/80 shadow-[0_0_40px_rgba(245,158,11,0.15)]" : "border-zinc-800"}`
            }
          `}
        >
          {/* Photorealistic Portrait Mode */}
          <div className="absolute inset-0 w-full h-full overflow-hidden flex items-end justify-center">
            <CharacterImage
              character={character.id as CharacterName}
              mood={
                emotion === "sad"
                  ? "sad"
                  : emotion === "serious"
                  ? "think"
                  : emotion === "excited" || emotion === "happy"
                  ? "happy"
                  : "normal"
              }
              alt={`${character.name} (${emotion})`}
              className={`absolute max-w-none transition-all duration-500
                ${isSpeaking ? "scale-[1.05] brightness-110 contrast-105" : "brightness-[0.35] grayscale-[20%]"}`}
              style={{
                width: "100%",
                height: "100%",
                bottom: "0",
                objectFit: "cover",
                objectPosition: character.id === "claire" ? "47% top" : "center top",
              }}
              src={customImages ? customImages[emotion] || undefined : undefined}
              priority={isSpeaking}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/40 opacity-85 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Info labels below card */}
      <div className="mt-1 sm:mt-3 text-center z-10 w-full">
        <span
          className={`block text-[8px] sm:text-[10px] font-mono tracking-tight sm:tracking-widest uppercase transition-colors duration-300 truncate px-1
            ${
              isSpeaking
                ? character.id === "claire"
                  ? "text-rose-400"
                  : character.id === "ethan"
                    ? "text-sky-400"
                    : "text-amber-400"
                : "text-zinc-500"
            }
          `}
        >
          {character.role}
        </span>
        <h3 className="text-xs sm:text-sm font-sans font-black text-white tracking-wide mt-0.5 flex items-center justify-center gap-1">
          {character.englishName}
          {isSpeaking && (
            <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                character.id === "claire" ? "bg-rose-400" : character.id === "ethan" ? "bg-sky-400" : "bg-amber-400"
              }`} />
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 ${
                character.id === "claire" ? "bg-rose-500" : character.id === "ethan" ? "bg-sky-500" : "bg-amber-500"
              }`} />
            </span>
          )}
        </h3>
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
