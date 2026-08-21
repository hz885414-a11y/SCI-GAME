export const MISSION_MAP_CONFIG = {
  backgroundUrl:
    "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/8f063dcab4e8cd6b99ff561c1ce3a7aeb484b013/3.%20background/8BIT-Background%20map-1.png",
  maskUrl:
    "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/8f063dcab4e8cd6b99ff561c1ce3a7aeb484b013/3.%20background/8BIT-Background%20map-1-mask.png",
  worldSize: { width: 1800, height: 1200 },
  playerSpawn: { x: 900, y: 600 },
  walkableColor: { r: 255, g: 255, b: 255 },
  colorTolerance: 8,
  collisionSamples: 12,
  spawnAttempts: 240,
} as const;

export interface MissionMaskData {
  width: number;
  height: number;
  walkable: Uint8Array;
}

export function getCoverPlacement(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
) {
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;

  return {
    x: (targetWidth - width) / 2,
    y: (targetHeight - height) / 2,
    width,
    height,
  };
}
