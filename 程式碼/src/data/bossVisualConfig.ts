export type BossVisualState = "idle" | "area" | "special" | "tracking";

export interface BossVisualSet {
  idle: string;
  area: string;
  special: string;
  tracking: string;
}

const SHARED_BOSS_VISUALS: BossVisualSet = {
  idle: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/01-_BOSS-special%20.png",
  area: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/01-_BOSS-Area.png",
  special: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/01-_BOSS-special.png",
  tracking: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/01-_BOSS-track.png",
};

// Each chapter has its own slot so future Boss artwork can be replaced one chapter at a time.
export const BOSS_VISUALS_BY_CHAPTER: Record<number, BossVisualSet> = {
  1: { ...SHARED_BOSS_VISUALS },
  2: {
    idle: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/BOSS_06-BOSS-normal.png",
    area: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/BOSS_06-BOSS-bombing.png",
    special: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/BOSS_06-BOSS-laser.png",
    tracking: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/BOSS_06-BOSS-strafing.png",
  },
  3: {
    idle: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/BOSS_04-BOSS-normal.png",
    area: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/BOSS_04-BOSS-Area.png",
    special: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/BOSS_O4-BOSS-special.png",
    tracking: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/BOSS_04-BOSS-track.png",
  },
  4: {
    idle: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/BOSS_05-BOSS-normal.png",
    area: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/BOSS_05-BOSS-Area.png",
    special: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/BOSS_05-BOSS-special.png",
    tracking: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/BOSS_05-BOSS-track.png",
  },
  5: {
    idle: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/BOSS_03-BOSS-normal.png",
    area: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/BOSS_03-BOSS-Area.png",
    special: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/BOSS_03-BOSS-special.png",
    tracking: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/BOSS_03-BOSS-track.png",
  },
  6: {
    idle: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/Enemy_02-BOSS-normal.png",
    area: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/Enemy_02-BOSS-Area.png",
    special: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/Enemy_02-BOSS-special.png",
    tracking: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/Enemy_02-BOSS-track.png",
  },
};

export function getBossVisualSet(chapter: number): BossVisualSet {
  return BOSS_VISUALS_BY_CHAPTER[chapter] || BOSS_VISUALS_BY_CHAPTER[1];
}
