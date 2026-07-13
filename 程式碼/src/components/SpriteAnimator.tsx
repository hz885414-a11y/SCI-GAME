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
}) => {
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number; originalWidth: number; originalHeight: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    const img = new Image();
    img.src = src;
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
  }, [src, totalFrames]);

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
  let bgPosX = -(activeFrame * displayWidth);

  if (width !== undefined && height !== undefined) {
    displayWidth = width;
    displayHeight = height;
    const scaleX = width / dimensions.width;
    const scaleY = height / dimensions.height;
    bgWidth = dimensions.originalWidth * scaleX;
    bgHeight = dimensions.originalHeight * scaleY;
    bgPosX = -(activeFrame * width);
  } else if (width !== undefined) {
    const scale = width / dimensions.width;
    displayWidth = width;
    displayHeight = dimensions.height * scale;
    bgWidth = dimensions.originalWidth * scale;
    bgHeight = dimensions.originalHeight * scale;
    bgPosX = -(activeFrame * width);
  } else if (height !== undefined) {
    const scale = height / dimensions.height;
    displayWidth = dimensions.width * scale;
    displayHeight = height;
    bgWidth = dimensions.originalWidth * scale;
    bgHeight = dimensions.originalHeight * scale;
    bgPosX = -(activeFrame * displayWidth);
  }

  const style: React.CSSProperties = {
    width: `${displayWidth}px`,
    height: `${displayHeight}px`,
    backgroundImage: `url(${src})`,
    backgroundRepeat: "no-repeat",
    backgroundPositionX: `${bgPosX}px`,
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
