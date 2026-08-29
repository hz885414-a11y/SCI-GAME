export type MissionEnemyType = "mote" | "clumper" | "stalker";

export const ENEMY_SPRITE_URLS: Record<MissionEnemyType, string> = {
  mote: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/2.Enemy%20confirmed/Enemy-Jellyfish-04.png",
  clumper: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/2.Enemy%20confirmed/Enemy-Spiky%20ball.png",
  stalker: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/2.Enemy%20confirmed/Enemy-ghost.png",
};

export const ROBOT_BATTLE_SPRITES = {
  walk: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/8BIT-robot/8BIT-C2-932-WALK-01.png",
  action: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/main/8BIT-robot/8BIT-C2-932-ACT.png",
} as const;

export const UI_IMAGE_ASSETS = {
  mainTitle: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/5.UI/Main%20Title.png",
  missionTitle: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/5.UI/Title.png",
} as const;
