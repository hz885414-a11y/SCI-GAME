const BASE_URL =
  "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/8bit-images/";

export const gameCharacterSprites = {
  claire: `${BASE_URL}8BIT-Claire.png`,
  ethan: `${BASE_URL}8BIT-Ethan.png`,
  leo: `${BASE_URL}8BIT-Leo.png`
} as const;

const WALK_BASE_URL =
  "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/main/WALK/";

export const walkSprites = {
  claire: {
    src: `${WALK_BASE_URL}Claire.png`
  },
  ethan: {
    src: `${WALK_BASE_URL}Ethan.png`
  },
  leo: {
    src: `${WALK_BASE_URL}Leo.png`
  }
} as const;

export const spriteConfig = {
  claire: {
    src: gameCharacterSprites.claire,
    rows: {
      walk: 0,
      hurt: 1,
      fail: 2,
      victory: 3
    },
    frameCount: 4
  },
  ethan: {
    src: gameCharacterSprites.ethan,
    rows: {
      walk: 0,
      hurt: 1,
      fail: 2,
      victory: 3
    },
    frameCount: 4
  },
  leo: {
    src: gameCharacterSprites.leo,
    rows: {
      walk: 0,
      hurt: 1,
      fail: 2,
      victory: 3
    },
    frameCount: 4
  }
} as const;
