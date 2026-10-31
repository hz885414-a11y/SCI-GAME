/**
 * Boss access is intentionally tracked separately from the general chapter
 * progression: the task centre is a robot-only challenge flow.
 */
export const FIRST_ROBOT_UPGRADE_COMPLETE_KEY = "sci_first_robot_upgrade_complete";
export const AMPA_BOSS_VICTORY_KEY = "sci_ampa_boss_victory";
export const FIRST_BOSS_COMBAT_TUTORIAL_KEY = "sci_first_boss_combat_tutorial_seen";

const readFlag = (key: string) => {
  try { return localStorage.getItem(key) === "true"; } catch { return false; }
};

const writeFlag = (key: string) => {
  try { localStorage.setItem(key, "true"); } catch { /* Progress persistence is optional. */ }
};

export const markFirstRobotUpgradeComplete = () => writeFlag(FIRST_ROBOT_UPGRADE_COMPLETE_KEY);
export const hasCompletedFirstRobotUpgrade = () => readFlag(FIRST_ROBOT_UPGRADE_COMPLETE_KEY);
export const markAmpaBossDefeated = () => writeFlag(AMPA_BOSS_VICTORY_KEY);
export const markBossCombatTutorialSeen = () => writeFlag(FIRST_BOSS_COMBAT_TUTORIAL_KEY);

export const hasSeenBossCombatTutorial = () => readFlag(FIRST_BOSS_COMBAT_TUTORIAL_KEY);

export const canEnterExhibitionBoss = (chapter: number) =>
  readFlag(FIRST_ROBOT_UPGRADE_COMPLETE_KEY) && (chapter === 1 || readFlag(AMPA_BOSS_VICTORY_KEY));

export const getBossLockReason = (chapter: number) => {
  if (!readFlag(FIRST_ROBOT_UPGRADE_COMPLETE_KEY)) return "完成第一次機器人改裝後開放";
  if (chapter !== 1 && !readFlag(AMPA_BOSS_VICTORY_KEY)) return "擊敗 AMPA Boss 後開放";
  return "已開放";
};
