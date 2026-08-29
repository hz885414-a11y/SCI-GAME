import { BACKGROUND_ASSETS } from "./backgroundAssets";
import { BOSS_VISUALS_BY_CHAPTER } from "./bossVisualConfig";
import { characterImages } from "./characterImages";
import { EXHIBITION_MISSIONS } from "./exhibitionMissions";
import { ENEMY_SPRITE_URLS, ROBOT_BATTLE_SPRITES, UI_IMAGE_ASSETS } from "./gameAssetUrls";
import { gameCharacterSprites, walkSprites } from "./gameCharacterSprites";
import { BOSS_ARENA_CONFIG, MISSION_MAP_CONFIG } from "./missionMapConfig";
import { ROBOT_CONFIG } from "./robotConfig";

export interface CoreAssetItem {
  label: string;
  url: string;
}

const characterPortraits = Object.entries(characterImages).flatMap(([character, moods]) =>
  Object.entries(moods).map(([mood, url]) => ({
    label: `${character.toUpperCase()}_${mood.toUpperCase()} PORTRAIT`,
    url,
  })),
);

const missionSprites = Object.entries(gameCharacterSprites).map(([character, url]) => ({
  label: `${character.toUpperCase()} MISSION SPRITE`,
  url,
}));

const walkingSprites = Object.entries(walkSprites).map(([character, config]) => ({
  label: `${character.toUpperCase()} WALK CYCLE`,
  url: config.src,
}));

const enemySprites = Object.entries(ENEMY_SPRITE_URLS).map(([enemy, url]) => ({
  label: `${enemy.toUpperCase()} ENEMY`,
  url,
}));

const exhibitionArtwork = EXHIBITION_MISSIONS.map((exhibition) => ({
  label: `${exhibition.code} EXHIBITION ARTWORK`,
  url: exhibition.imageUrl,
}));

const bossArtwork = Object.entries(BOSS_VISUALS_BY_CHAPTER).flatMap(([chapter, visuals]) =>
  Object.entries(visuals).map(([state, url]) => ({
    label: `CHAPTER ${chapter} BOSS ${state.toUpperCase()}`,
    url,
  })),
);

const manifest: CoreAssetItem[] = [
  { label: "MAIN TITLE", url: UI_IMAGE_ASSETS.mainTitle },
  { label: "MISSION TITLE", url: UI_IMAGE_ASSETS.missionTitle },
  { label: "LAB BACKGROUND", url: BACKGROUND_ASSETS.lab },
  { label: "R&D BACKGROUND", url: BACKGROUND_ASSETS.tech },
  { label: "OPS BACKGROUND", url: BACKGROUND_ASSETS.business },
  { label: "SUPPLY BACKGROUND", url: BACKGROUND_ASSETS.purchase },
  ...characterPortraits,
  ...missionSprites,
  ...walkingSprites,
  ...enemySprites,
  ...exhibitionArtwork,
  { label: "MISSION MAP", url: MISSION_MAP_CONFIG.backgroundUrl },
  { label: "MISSION COLLISION MASK", url: MISSION_MAP_CONFIG.maskUrl },
  { label: "BOSS ARENA", url: BOSS_ARENA_CONFIG.backgroundUrl },
  { label: "BOSS COLLISION MASK", url: BOSS_ARENA_CONFIG.maskUrl },
  { label: "ROBOT PORTRAIT", url: ROBOT_CONFIG.c2_932.portrait },
  { label: "ROBOT WALK CYCLE", url: ROBOT_BATTLE_SPRITES.walk },
  { label: "ROBOT ACTION CYCLE", url: ROBOT_BATTLE_SPRITES.action },
  ...bossArtwork,
];

// Asset URLs may intentionally be reused by several chapters. Only fetch each URL once.
export const CORE_ASSET_MANIFEST = manifest.filter(
  (asset, index, assets) => assets.findIndex((candidate) => candidate.url === asset.url) === index,
);
