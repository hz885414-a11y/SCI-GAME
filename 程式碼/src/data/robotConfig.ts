import type { RobotUpgradeLevels } from "./modificationSystem";

export const BOSS_ROBOT_ID = "c2_932" as const;

export const ROBOT_CONFIG = {
  c2_932: {
    name: "C2-932",
    portrait: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/8BIT-robot-RB/G-C2-932.png",
    description: "唯一的主力戰鬥機器人。所有武器、護盾與被動技能都必須在實驗室安裝。",
  }
} as const;

export type RobotSelectionState = {
  robotId: typeof BOSS_ROBOT_ID;
  fullyUnlocked: boolean;
};

export function createC2932Deployment(upgrades: RobotUpgradeLevels): RobotSelectionState {
  return {
    robotId: BOSS_ROBOT_ID,
    fullyUnlocked: Object.values(upgrades).some((level) => level > 0)
  };
}