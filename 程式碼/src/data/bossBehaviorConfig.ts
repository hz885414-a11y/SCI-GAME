export interface BossBehaviorProfile {
  radius: number;
  moveSpeed: number;
  prefersMelee: boolean;
  meleeStopDistance: number;
  attackInterval: number;
  attackPatternWeights: number[];
  defenseDuration: number;
  defenseDamageMultiplier: number;
  dashTimer: number;
  dashExecutionThreshold: number;
  dashSpeed: number;
  usesRockProjectiles: boolean;
}

const DEFAULT_BOSS_BEHAVIOR: BossBehaviorProfile = {
  radius: 65,
  moveSpeed: 1.1,
  prefersMelee: false,
  meleeStopDistance: 150,
  attackInterval: 110,
  attackPatternWeights: [0, 1, 2, 3],
  defenseDuration: 0,
  defenseDamageMultiplier: 1,
  dashTimer: 70,
  dashExecutionThreshold: 30,
  dashSpeed: 4,
  usesRockProjectiles: false,
};

export const BOSS_BEHAVIOR_BY_CHAPTER: Partial<Record<number, BossBehaviorProfile>> = {
  // BAUMA: oversized mining guardian that closes distance, braces behind armor,
  // performs a long charge and throws chunks of rock at range.
  6: {
    radius: 84,
    moveSpeed: 1.65,
    prefersMelee: true,
    meleeStopDistance: 118,
    attackInterval: 96,
    attackPatternWeights: [0, 0, 1, 2, 2, 2, 3],
    defenseDuration: 110,
    defenseDamageMultiplier: 0.35,
    dashTimer: 62,
    dashExecutionThreshold: 38,
    dashSpeed: 7.2,
    usesRockProjectiles: true,
  },
};

export function getBossBehaviorProfile(chapter: number): BossBehaviorProfile {
  return BOSS_BEHAVIOR_BY_CHAPTER[chapter] || DEFAULT_BOSS_BEHAVIOR;
}
