import React, { useState, useEffect } from "react";
import {
  characterImages,
  CharacterName,
  CharacterMood
} from "../data/characterImages";

interface CharacterImageProps {
  character: CharacterName;
  mood?: CharacterMood;
  alt?: string;
  className?: string;
  priority?: boolean;
  style?: React.CSSProperties;
  src?: string;
}

export const CharacterImage: React.FC<CharacterImageProps> = ({
  character,
  mood = "normal",
  alt,
  className,
  priority = false,
  style,
  src
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state if character, mood, or src changes
  useEffect(() => {
    setHasError(false);
  }, [character, mood, src]);

  const characterSet = characterImages[character];

  // If explicit src is provided, use it. Otherwise, resolve via character and mood
  const imageUrl = src || (characterSet ? (characterSet[mood] ?? characterSet.normal) : "");

  // Safely fallback if character isn't found and no explicit src is provided
  if (!characterSet && !src) {
    return (
      <div className={`${className} flex items-center justify-center bg-zinc-950 text-zinc-500 text-[10px] font-mono border border-zinc-800`}>
        角色不存在
      </div>
    );
  }

  if (hasError) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-zinc-950 text-zinc-500 text-[10px] font-mono border border-zinc-800`}
        aria-label={alt ?? `${character} ${mood}`}
        style={style}
      >
        圖片載入失敗
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt ?? `${character} ${mood}`}
      className={className}
      style={style}
      loading={priority ? "eager" : "lazy"}
      {...({ fetchPriority: priority ? "high" : "auto" })}
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
    />
  );
}
