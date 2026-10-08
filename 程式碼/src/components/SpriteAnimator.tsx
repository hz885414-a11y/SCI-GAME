import React, { useState, useEffect } from "react";

export interface SpriteAnimatorProps {
  src: string;
  totalFrames: number;
  idleFrame: number;
  animationFrames: number[];
  fps?: number;
  playing: boolean;
  facing?: "left" | "right";
  className?: string;
  width?: number;
  height?: number;
  /** Per-frame horizontal correction in source pixels, used to keep the subject centered. */
  frameXOffsets?: readonly number[];
  /**
   * Optional authored image sequence.  Unlike a sprite sheet, each entry is a
   * complete PNG for that pose (for example: idle + four walking poses).
   */
  individualFrames?: readonly string[];
}

export const SpriteAnimator: React.FC<SpriteAnimatorProps> = ({
  src,
  totalFrames,
  idleFrame,
  animationFrames,
  fps = 7,
  playing,
  facing = "right",
  className = "",
  width,
  height,
  frameXOffsets,
  individualFrames,
}) => {
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number; originalWidth: number; originalHeight: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    const img = new Image();
    // A full-frame sequence is sized from its idle pose. This keeps the
    // component's layout stable while the walking pose changes.
    img.src = individualFrames?.[idleFrame] ?? src;
    img.onload = () => {
      setDimensions({
        width: img.naturalWidth / totalFrames,
        height: img.naturalHeight,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
      });
      setImageLoaded(true);
    };
    img.onerror = () => {
      setImageError(true);
    };
  }, [src, totalFrames, idleFrame, individualFrames]);

  useEffect(() => {
    if (!playing) {
      setCurrentAnimationIndex(0);
      return;
    }

    const intervalMs = 1000 / fps;
    const interval = setInterval(() => {
      setCurrentAnimationIndex((prev) => (prev + 1) % animationFrames.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [playing, fps, animationFrames.length]);

  const activeFrame = playing
    ? animationFrames[currentAnimationIndex]
    : idleFrame;
  const isIndividualSequence = Boolean(individualFrames?.length);
  const activeImageSrc = isIndividualSequence
    ? (individualFrames?.[activeFrame] ?? individualFrames?.[idleFrame] ?? src)
    : src;

  // Full-frame animation PNGs should be rendered as real images instead of
  // CSS backgrounds. This avoids relying on a sprite-sheet crop and lets
  // browsers load each authored walking pose independently.
  if (isIndividualSequence) {
    const individualStyle: React.CSSProperties = {
      width: width !== undefined ? `${width}px` : undefined,
      height: height !== undefined ? `${height}px` : undefined,
      maxWidth: "none",
      objectFit: "contain",
      imageRendering: "pixelated",
      transform: facing === "left" ? "scaleX(-1)" : "none",
      transition: "transform 0.1s ease-out",
    };

    return (
      <img
        src={activeImageSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={`inline-block select-none ${className}`}
        style={individualStyle}
      />
    );
  }

  if (imageError) {
    return (
      <div 
        className={`flex items-center justify-center border border-dashed border-zinc-700 bg-zinc-900 rounded select-none ${className}`}
        style={{ width: width ? `${width}px` : "64px", height: height ? `${height}px` : "64px" }}
      >
        <span className="text-xs text-zinc-500 font-bold font-mono">ERR</span>
      </div>
    );
  }

  if (!imageLoaded || !dimensions) {
    return (
      <div 
        className={`flex items-center justify-center bg-zinc-950 border border-zinc-900 rounded animate-pulse ${className}`}
        style={{ width: width ? `${width}px` : "64px", height: height ? `${height}px` : "64px" }}
      >
        <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-orange-500 animate-spin" />
      </div>
    );
  }

  // Calculate displayed size and background scaling
  let displayWidth = dimensions.width;
  let displayHeight = dimensions.height;
  let bgWidth = dimensions.originalWidth;
  let bgHeight = dimensions.originalHeight;
  let bgPosX = isIndividualSequence ? 0 : -(activeFrame * displayWidth);

  if (width !== undefined && height !== undefined) {
    displayWidth = width;
    displayHeight = height;
    const scaleX = width / dimensions.width;
    const scaleY = height / dimensions.height;
    bgWidth = dimensions.originalWidth * scaleX;
    bgHeight = dimensions.originalHeight * scaleY;
    bgPosX = isIndividualSequence ? 0 : -(activeFrame * width);
  } else if (width !== undefined) {
    const scale = width / dimensions.width;
    displayWidth = width;
    displayHeight = dimensions.height * scale;
    bgWidth = dimensions.originalWidth * scale;
    bgHeight = dimensions.originalHeight * scale;
    bgPosX = isIndividualSequence ? 0 : -(activeFrame * width);
  } else if (height !== undefined) {
    const scale = height / dimensions.height;
    displayWidth = dimensions.width * scale;
    displayHeight = height;
    bgWidth = dimensions.originalWidth * scale;
    bgHeight = dimensions.originalHeight * scale;
    bgPosX = isIndividualSequence ? 0 : -(activeFrame * displayWidth);
  }

  const style: React.CSSProperties = {
    width: `${displayWidth}px`,
    height: `${displayHeight}px`,
    backgroundImage: `url(${activeImageSrc})`,
    backgroundRepeat: "no-repeat",
    backgroundPositionX: `${bgPosX + (isIndividualSequence ? 0 : (frameXOffsets?.[activeFrame] ?? 0) * (displayWidth / dimensions.width))}px`,
    backgroundPositionY: "0px",
    backgroundSize: `${bgWidth}px ${bgHeight}px`,
    imageRendering: "pixelated",
    transform: facing === "left" ? "scaleX(-1)" : "none",
    transition: "transform 0.1s ease-out",
  };

  return (
    <div 
      className={`inline-block select-none ${className}`} 
      style={style} 
    />
  );
};
