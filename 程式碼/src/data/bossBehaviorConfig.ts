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
  usesDiveAmbush: boolean;
  usesTentacleArea: boolean;
  usesChainDash: boolean;
  usesKnockbackRoar: boolean;
  usesHardwareSummons: boolean;
  usesToolBarrage: boolean;
  usesBombingRun: boolean;
  usesAimedLaser: boolean;
  usesStrafingBurst: boolean;
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
  usesDiveAmbush: false,
  usesTentacleArea: false,
  usesChainDash: false,
  usesKnockbackRoar: false,
  usesHardwareSummons: false,
  usesToolBarrage: false,
  usesBombingRun: false,
  usesAimedLaser: false,
  usesStrafingBurst: false,
};

export const BOSS_BEHAVIOR_BY_CHAPTER: Partial<Record<number, BossBehaviorProfile>> = {
  // Automechanika Frankfurt: a twin-headed eagle bomber that crosses the
  // entire arena, marks missile impact zones, and alternates aimed lasers
  // with dense machine-gun strafing fire.
  2: {
    radius: 68,
    moveSpeed: 1.35,
    prefersMelee: false,
    meleeStopDistance: 170,
    attackInterval: 98,
    attackPatternWeights: [0, 1, 9, 9, 10, 10, 11, 11],
    defenseDuration: 0,
    defenseDamageMultiplier: 1,
    dashTimer: 70,
    dashExecutionThreshold: 30,
    dashSpeed: 4.5,
    usesRockProjectiles: false,
    usesDiveAmbush: false,
    usesTentacleArea: false,
    usesChainDash: false,
    usesKnockbackRoar: false,
    usesHardwareSummons: false,
    usesToolBarrage: false,
    usesBombingRun: true,
    usesAimedLaser: true,
    usesStrafingBurst: true,
  },
  // TITE × IHT: a hardware commander that calls screw-and-tool minions,
  // then controls lanes with a rotating magnetic tool barrage.
  3: {
    radius: 70,
    moveSpeed: 1.15,
    prefersMelee: false,
    meleeStopDistance: 150,
    attackInterval: 106,
    attackPatternWeights: [1, 3, 7, 7, 8, 8],
    defenseDuration: 0,
    defenseDamageMultiplier: 1,
    dashTimer: 70,
    dashExecutionThreshold: 30,
    dashSpeed: 4,
    usesRockProjectiles: false,
    usesDiveAmbush: false,
    usesTentacleArea: false,
    usesChainDash: false,
    usesKnockbackRoar: false,
    usesHardwareSummons: true,
    usesToolBarrage: true,
    usesBombingRun: false,
    usesAimedLaser: false,
    usesStrafingBurst: false,
  },
  // AAPEX: a relentless pursuit Boss that chains several aimed rushes,
  // knocks the robot away on impact, and uses a roar to control nearby space.
  4: {
    radius: 72,
    moveSpeed: 1.5,
    prefersMelee: true,
    meleeStopDistance: 145,
    attackInterval: 102,
    attackPatternWeights: [1, 2, 2, 2, 3, 6, 6],
    defenseDuration: 0,
    defenseDamageMultiplier: 1,
    dashTimer: 64,
    dashExecutionThreshold: 34,
    dashSpeed: 8.4,
    usesRockProjectiles: false,
    usesDiveAmbush: false,
    usesTentacleArea: false,
    usesChainDash: true,
    usesKnockbackRoar: true,
    usesHardwareSummons: false,
    usesToolBarrage: false,
    usesBombingRun: false,
    usesAimedLaser: false,
    usesStrafingBurst: false,
  },
  // METSTRADE: an aquatic ambusher that dives out of sight before surfacing
  // near the player and controls space with telegraphed tentacle strikes.
  5: {
    radius: 72,
    moveSpeed: 1.2,
    prefersMelee: false,
    meleeStopDistance: 150,
    attackInterval: 104,
    attackPatternWeights: [1, 3, 4, 4, 5, 5],
    defenseDuration: 0,
    defenseDamageMultiplier: 1,
    dashTimer: 70,
    dashExecutionThreshold: 30,
    dashSpeed: 4,
    usesRockProjectiles: false,
    usesDiveAmbush: true,
    usesTentacleArea: true,
    usesChainDash: false,
    usesKnockbackRoar: false,
    usesHardwareSummons: false,
    usesToolBarrage: false,
    usesBombingRun: false,
    usesAimedLaser: false,
    usesStrafingBurst: false,
  },
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
    usesDiveAmbush: false,
    usesTentacleArea: false,
    usesChainDash: false,
    usesKnockbackRoar: false,
    usesHardwareSummons: false,
    usesToolBarrage: false,
    usesBombingRun: false,
    usesAimedLaser: false,
    usesStrafingBurst: false,
  },
};

export function getBossBehaviorProfile(chapter: number): BossBehaviorProfile {
  return BOSS_BEHAVIOR_BY_CHAPTER[chapter] || DEFAULT_BOSS_BEHAVIOR;
}
