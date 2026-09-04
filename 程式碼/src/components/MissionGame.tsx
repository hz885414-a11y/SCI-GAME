import React, { useState, useEffect, useRef } from "react";
import { 
  Gamepad2, Play, RotateCcw, Heart, Zap, Lightbulb, 
  ShieldAlert, X, HelpCircle, Trophy, ChevronRight, 
  Flame, Battery, BatteryCharging, Cpu, Award, Sparkles, AlertTriangle, Clock
} from "lucide-react";
import { SpriteAnimator } from "./SpriteAnimator";
import { BossWarningTransition } from "./BossWarningTransition";
import { gameCharacterSprites, walkSprites } from "../data/gameCharacterSprites";
import { getBossVisualSet, type BossVisualState } from "../data/bossVisualConfig";
import { getEffectiveBossBehaviorProfile, getBossKnowledgeModifiers } from "../systems/bossKnowledgeEffects";
import { recordAction, recordEnemyDefeated, recordExhibitionBossOutcome } from "../systems/playerStats";
import { ENEMY_SPRITE_URLS, ROBOT_BATTLE_SPRITES, type MissionEnemyType } from "../data/gameAssetUrls";

import { ROBOT_CONFIG, createC2932Deployment, type RobotSelectionState } from "../data/robotConfig";
import {
  BOSS_ARENA_CONFIG,
  MISSION_MAP_CONFIG,
  getCoverPlacement,
  type MissionMaskData,
} from "../data/missionMapConfig";
import {
  MATERIAL_CONFIG,
  MATERIAL_IDS,
  ROBOT_UPGRADE_CONFIG,
  ROBOT_UPGRADE_IDS,
  createEmptyMaterialInventory,
  type MaterialId,
  type MaterialInventory,
  type RobotUpgradeLevels
} from "../data/modificationSystem";
import {
  applyCollectFeedback,
  applyDeathFeedback,
  applyHitFeedback,
  getHitRenderOffset,
  triggerCameraShake,
} from "../utils/gameFeedback";
interface MissionGameProps {
  onClose: () => void;
  onReturnToLab: (chapter: number) => void;
  onReturnToExhibition: () => void;
  entrySource?: "adventure" | "exhibition";
  resumeBossChapter?: number | null;
  affectionPoints: Record<string, number>;
  setAffectionPoints: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  playSound: (sound: string) => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  purchasedUpgrades: Record<string, number>;
  robotUpgrades: RobotUpgradeLevels;
  onMaterialsEarned: (materials: MaterialInventory) => void;
  unlockedChapters: number[];
  setUnlockedChapters: React.Dispatch<React.SetStateAction<number[]>>;
}

type GameStage = "START" | "PLAYING" | "REPORT" | "ASSEMBLY" | "ROBOT_DEPLOYMENT" | "BOSS_WARNING" | "BOSSBATTLE" | "VICTORY" | "GAMEOVER";
type EnemyType = MissionEnemyType;

interface EnemyEntity {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  color: string;
  type: EnemyType;
  points: number;
  facingLeft: boolean;
  isBossMinion?: boolean;
  bossMinionKind?: "bolt" | "nut" | "wrench";
  hitFlashUntil?: number;
  hitOffsetX?: number;
  hitOffsetY?: number;
}

interface EnemyDeathEffect {
  x: number;
  y: number;
  radius: number;
  type: EnemyType;
  facingLeft: boolean;
  life: number;
  maxLife: number;
}

interface BombingZone {
  x: number;
  y: number;
  radius: number;
  timer: number;
}

const C2_932_PUNCHES_REQUIRED = 3;
const C2_932_FIELD_DURATION_MS = 3000;
const C2_932_FIELD_RADIUS = 145;

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  desc: string;
  color: string;
  speed: number;
  maxBattery: number;
  defense: number;
}

const AGENTS: Agent[] = [
  {
    id: "claire",
    name: "Claire",
    role: "機動分析官 (ANALYSIS)",
    avatar: "👩‍💻",
    desc: "燈光分析專家。移動速度 +20%，電池充能效率 +30%！",
    color: "#38bdf8",
    speed: 3.6,
    maxBattery: 130,
    defense: 1.0,
  },
  {
    id: "ethan",
    name: "Ethan",
    role: "前線突擊手 (STRIKER)",
    avatar: "⚡",
    desc: "敏捷突擊手。High Mode 耗電率降低 25%，光束傷害 +15%！",
    color: "#f97316",
    speed: 3.2,
    maxBattery: 100,
    defense: 1.0,
  },
  {
    id: "leo",
    name: "Leo",
    role: "重裝工程師 (ENGINEER)",
    avatar: "🛠️",
    desc: "工程大師。初始生命值為 4（其餘為 3），High Mode 護盾減傷 20%！",
    color: "#eab308",
    speed: 2.7,
    maxBattery: 100,
    defense: 1.2,
  }
];

interface Chapter {
  id: number;
  name: string;
  subtitle: string;
  bossName: string;
  themeColor: string;
  groundColor: string;
  gridColor: string;
  obstaclesType: string;
  desc: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    name: "第一章：都市停電區",
    subtitle: "City Blackout",
    bossName: "停電核心 (Blackout Core)",
    themeColor: "#f97316",
    groundColor: "#1e293b",
    gridColor: "rgba(249, 115, 22, 0.12)",
    obstaclesType: "streetlamp",
    desc: "高樓、便利商店與路燈全部熄滅，黑暗在此處凝聚產生了最初的吞光核心。"
  },
  {
    id: 2,
    name: "第二章：夜間施工工地",
    subtitle: "Night Construction Site",
    bossName: "黑暗工程機甲 (Dark Mech)",
    themeColor: "#eab308",
    groundColor: "#27272a",
    gridColor: "rgba(234, 179, 8, 0.12)",
    obstaclesType: "cone",
    desc: "施工到一半的工地被黑暗吞噬，重型機具在陰影中暴走，急需工作燈照亮。"
  },
  {
    id: 3,
    name: "第三章：港口貨櫃碼頭",
    subtitle: "Port Terminal",
    bossName: "深海黑影 (Ocean Shadow)",
    themeColor: "#06b6d4",
    groundColor: "#1c2541",
    gridColor: "rgba(6, 182, 212, 0.12)",
    obstaclesType: "container",
    desc: "濃霧瀰漫的碼頭上，貨櫃層層堆疊，深海的暗影正悄悄沿著探照燈盲區登陸。"
  },
  {
    id: 4,
    name: "第四章：山區道路搶修",
    subtitle: "Mountain Path",
    bossName: "山神黑獸 (Mountain Deity)",
    themeColor: "#10b981",
    groundColor: "#0b2b1a",
    gridColor: "rgba(16, 185, 129, 0.12)",
    obstaclesType: "boulder",
    desc: "颱風過後的碎石山路。落石與枯木阻擋了去路，林中的野獸已化作黑暗的爪牙。"
  },
  {
    id: 5,
    name: "第五章：地下捷運",
    subtitle: "Metro Subway",
    bossName: "暗影列車 (Shadow Train)",
    themeColor: "#8b5cf6",
    groundColor: "#2c2523",
    gridColor: "rgba(139, 92, 246, 0.12)",
    obstaclesType: "pillar",
    desc: "不見天日的地下捷運軌道完全斷電，一輛失控的漆黑列車正在暗影中疾馳前行。"
  },
  {
    id: 6,
    name: "第六章：SCI 實驗室",
    subtitle: "SCI Laboratory",
    bossName: "終極黑暗核心 (Dark Core)",
    themeColor: "#ec4899",
    groundColor: "#25172b",
    gridColor: "rgba(236, 72, 153, 0.12)",
    obstaclesType: "server",
    desc: "燈燈小隊的科學研發基地遭受黑暗主力入侵！這是奪回光明與科技的最終一戰。"
  }
];

interface WeaponInfo {
  id: string;
  name: string;
  desc: string;
  lowEffect: string;
  highEffect: string;
}

const WEAPONS_INFO: Record<string, WeaponInfo> = {
  range_attack: { id: "range_attack", name: "廣域照明", desc: "C2-932 的扇形範圍攻擊。", lowEffect: "中距離扇形照射", highEffect: "廣角高傷害照射" },
  laser_weapon: { id: "laser_weapon", name: "脈衝雷射", desc: "C2-932 的高速雷射武器。", lowEffect: "單發凝聚光束", highEffect: "高速散射光束" },
  tracking_weapon: { id: "tracking_weapon", name: "追蹤光束", desc: "C2-932 的自動追蹤武器。", lowEffect: "鎖定最近目標", highEffect: "同時追蹤多個目標" },
  special_lighting: { id: "special_lighting", name: "特殊照明", desc: "C2-932 的地面淨化光圈。", lowEffect: "小型持續照明區", highEffect: "大型淨化力場" },
  heavy_beam: { id: "heavy_beam", name: "重型光砲", desc: "C2-932 的高能聚焦光束。", lowEffect: "單體聚焦光柱", highEffect: "重型穿透光砲" }
};

const LIGHT_ATTACK_PROFILES = {
  LOW: {
    range: 140,
    fanSize: Math.PI / 2.4,
    lightRange: 300,
    lightFanSize: Math.PI / 2.2,
  },
  HIGH: {
    range: 280,
    fanSize: Math.PI * 0.75,
    lightRange: 460,
    lightFanSize: Math.PI * 0.8,
  },
} as const;

export function MissionGame({ 
  onClose, 
  onReturnToLab,
  onReturnToExhibition,
  entrySource = "adventure",
  resumeBossChapter = null,
  affectionPoints, 
  setAffectionPoints, 
  playSound,
  coins,
  setCoins,
  purchasedUpgrades,
  robotUpgrades,
  onMaterialsEarned,
  unlockedChapters,
  setUnlockedChapters
}: MissionGameProps) {
  // Screens state
  const [stage, setStage] = useState<GameStage>(resumeBossChapter ? "BOSS_WARNING" : "START");
  const [selectedAgent, setSelectedAgent] = useState<Agent>(AGENTS[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(resumeBossChapter || 1);
  const [startStep, setStartStep] = useState<number>(1);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true); // Demo mode enabled by default (30s round) for faster testing
  const [assemblyTab, setAssemblyTab] = useState<"lamps" | "specs">("lamps");

  // Touch controls state for mobile/tablets
  const [showTouchControls, setShowTouchControls] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  const [showTipModal, setShowTipModal] = useState<boolean>(false);
  const [showBossTipModal, setShowBossTipModal] = useState<boolean>(false);
  const [startTitleActive, setStartTitleActive] = useState<boolean>(false);
  const [bossIntroPhase, setBossIntroPhase] = useState<"entrance" | "start" | null>(null);

  const handleConfirmTip = () => {
    keysRef.current = {};
    setShowTipModal(false);
    setStartTitleActive(true);
    triggerSound("click");
    window.requestAnimationFrame(() => canvasRef.current?.focus({ preventScroll: true }));
    setTimeout(() => {
      setStartTitleActive(false);
    }, 1500);
  };

  useEffect(() => {
    const isTouchDevice = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth < 1024);
    setShowTouchControls(isTouchDevice);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Core gameplay states synced with UI
  const [hp, setHp] = useState<number>(3);
  const [maxHp, setMaxHp] = useState<number>(3);
  const [level, setLevel] = useState<number>(1);
  const [exp, setExp] = useState<number>(0);
  const [expNeeded, setExpNeeded] = useState<number>(100);
  const [batteryPercent, setBatteryPercent] = useState<number>(100);
  const [batteryMode, setBatteryMode] = useState<"LOW" | "HIGH">("LOW");
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [score, setScore] = useState<number>(0);
  const [sessionCoins, setSessionCoins] = useState<number>(0);

  // Adventure technology always starts from the squad's basic work light.
  // It must never inherit permanent C2-932 laboratory modules.
  const getAdventureWeaponLevels = () => ({
    range_attack: 1,
    laser_weapon: 0,
    tracking_weapon: 0,
    special_lighting: 0,
    heavy_beam: 0
  });
  const getRobotWeaponLevels = () => ({
    range_attack: Math.max(1, robotUpgrades.range_attack || 0),
    laser_weapon: robotUpgrades.laser_weapon || 0,
    tracking_weapon: robotUpgrades.tracking_weapon || 0,
    special_lighting: robotUpgrades.special_lighting || 0,
    heavy_beam: robotUpgrades.attack_power || 0
  });
  const [weaponLevels, setWeaponLevels] = useState<Record<string, number>>(() =>
    resumeBossChapter ? getRobotWeaponLevels() : getAdventureWeaponLevels()
  );
  const [collectedMaterials, setCollectedMaterials] = useState<MaterialInventory>(createEmptyMaterialInventory);
  const materialsBankedRef = useRef(false);

  // Upgrades overlay choice
  const [showUpgradeChoice, setShowUpgradeChoice] = useState<boolean>(false);
  const [upgradeChoices, setUpgradeChoices] = useState<Array<{ id: string; type: "weapon" | "stat"; name: string; desc: string; icon: string }>>([]);
  const [selectedUpgradeIndex, setSelectedUpgradeIndex] = useState(0);

  // Boss Battle HUD States
  const [bossHp, setBossHp] = useState<number>(100);
  const [bossMaxHp, setBossMaxHp] = useState<number>(100);
  const [bossActiveName, setBossActiveName] = useState<string>("");
  const [mechaUltEnergy, setMechaUltEnergy] = useState<number>(0);
  const [mechaActiveShield, setMechaActiveShield] = useState<boolean>(false);
  const [mechaLaserBattery, setMechaLaserBattery] = useState<number>(100);
  const [mechaShieldDurability, setMechaShieldDurability] = useState<number>(4);
  const [mechaShieldBroken, setMechaShieldBroken] = useState<boolean>(false);
  const [bossStunActive, setBossStunActive] = useState<boolean>(false);
  const [robotSelection, setRobotSelection] = useState<RobotSelectionState | null>(() =>
    resumeBossChapter ? createC2932Deployment(robotUpgrades) : null
  );
  const [c2932PunchCount, setC2932PunchCount] = useState<number>(0);
  const [c2932FieldRemainingMs, setC2932FieldRemainingMs] = useState<number>(0);

  const robotSelectionRef = useRef<RobotSelectionState | null>(
    resumeBossChapter ? createC2932Deployment(robotUpgrades) : null
  );
  const c2932SkillRef = useRef({ punchCount: 0, fieldEndsAt: 0 });
  const victoryPendingRef = useRef(false);
  const bossOutcomeRecordedRef = useRef(false);

  useEffect(() => {
    robotSelectionRef.current = robotSelection;
  }, [robotSelection]);


  // Refs for low latency canvas rendering and keyboard management
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRootRef = useRef<HTMLDivElement | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef<{ x: number; y: number; clicked: boolean }>({ x: 0, y: 0, clicked: false });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const missionBackgroundImgRef = useRef<HTMLImageElement | null>(null);
  const missionMaskDataRef = useRef<MissionMaskData | null>(null);
  const bossArenaBackgroundImgRef = useRef<HTMLImageElement | null>(null);
  const bossArenaMaskDataRef = useRef<MissionMaskData | null>(null);
  const bossVisualImagesRef = useRef<Partial<Record<BossVisualState, HTMLImageElement>>>({});
  const [missionMapReady, setMissionMapReady] = useState(false);

  const playerSpriteImgRef = useRef<HTMLImageElement | null>(null);
  const [spriteLoaded, setSpriteLoaded] = useState<boolean>(false);
  const playerFacingLeftRef = useRef<boolean>(false);
  const enemySpriteImagesRef = useRef<Partial<Record<EnemyType, HTMLImageElement>>>({});

  const bossRobotSpriteImgRef = useRef<HTMLImageElement | null>(null);
  const [bossRobotSpriteLoaded, setBossRobotSpriteLoaded] = useState<boolean>(false);

  const bossRobotActImgRef = useRef<HTMLImageElement | null>(null);
  const [bossRobotActLoaded, setBossRobotActLoaded] = useState<boolean>(false);

  const companionRobotImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const [companionsLoaded, setCompanionsLoaded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let disposed = false;
    const loadedImages: HTMLImageElement[] = [];

    (Object.entries(ENEMY_SPRITE_URLS) as Array<[EnemyType, string]>).forEach(([type, url]) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = url;
      image.onload = () => {
        if (!disposed) enemySpriteImagesRef.current[type] = image;
      };
      image.onerror = () => {
        if (!disposed) delete enemySpriteImagesRef.current[type];
      };
      loadedImages.push(image);
    });

    return () => {
      disposed = true;
      loadedImages.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    const loadedImages: HTMLImageElement[] = [];
    bossVisualImagesRef.current = {};

    const visualSet = getBossVisualSet(selectedChapter);
    (Object.entries(visualSet) as Array<[BossVisualState, string]>).forEach(([state, url]) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = url;
      image.onload = () => {
        if (!disposed) bossVisualImagesRef.current[state] = image;
      };
      image.onerror = () => {
        if (!disposed) delete bossVisualImagesRef.current[state];
      };
      loadedImages.push(image);
    });

    return () => {
      disposed = true;
      loadedImages.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [selectedChapter]);

  useEffect(() => {
    let disposed = false;

    const backgroundImage = new Image();
    backgroundImage.crossOrigin = "anonymous";
    backgroundImage.src = MISSION_MAP_CONFIG.backgroundUrl;
    backgroundImage.onload = () => {
      if (!disposed) missionBackgroundImgRef.current = backgroundImage;
    };
    backgroundImage.onerror = () => {
      if (!disposed) missionBackgroundImgRef.current = null;
    };

    const bossArenaBackgroundImage = new Image();
    bossArenaBackgroundImage.crossOrigin = "anonymous";
    bossArenaBackgroundImage.src = BOSS_ARENA_CONFIG.backgroundUrl;
    bossArenaBackgroundImage.onload = () => {
      if (!disposed) bossArenaBackgroundImgRef.current = bossArenaBackgroundImage;
    };
    bossArenaBackgroundImage.onerror = () => {
      if (!disposed) bossArenaBackgroundImgRef.current = null;
    };

    const maskImage = new Image();
    maskImage.crossOrigin = "anonymous";
    maskImage.src = MISSION_MAP_CONFIG.maskUrl;
    maskImage.onload = () => {
      if (disposed) return;

      const { width, height } = MISSION_MAP_CONFIG.worldSize;
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
      if (!maskContext) return;

      const placement = getCoverPlacement(
        maskImage.naturalWidth,
        maskImage.naturalHeight,
        width,
        height,
      );
      maskContext.imageSmoothingEnabled = false;
      maskContext.drawImage(
        maskImage,
        placement.x,
        placement.y,
        placement.width,
        placement.height,
      );

      try {
        const pixels = maskContext.getImageData(0, 0, width, height).data;
        const walkable = new Uint8Array(width * height);
        const { walkableColor, colorTolerance } = MISSION_MAP_CONFIG;

        for (let pixelIndex = 0, mapIndex = 0; pixelIndex < pixels.length; pixelIndex += 4, mapIndex++) {
          const matchesWalkableColor =
            Math.abs(pixels[pixelIndex] - walkableColor.r) <= colorTolerance &&
            Math.abs(pixels[pixelIndex + 1] - walkableColor.g) <= colorTolerance &&
            Math.abs(pixels[pixelIndex + 2] - walkableColor.b) <= colorTolerance;
          walkable[mapIndex] = matchesWalkableColor ? 1 : 0;
        }

        missionMaskDataRef.current = { width, height, walkable };
        setMissionMapReady(true);
      } catch (error) {
        console.error("Failed to read mission collision mask", error);
        missionMaskDataRef.current = null;
        setMissionMapReady(false);
      }
    };
    maskImage.onerror = () => {
      if (!disposed) {
        missionMaskDataRef.current = null;
        setMissionMapReady(false);
      }
    };

    const bossArenaMaskImage = new Image();
    bossArenaMaskImage.crossOrigin = "anonymous";
    bossArenaMaskImage.src = BOSS_ARENA_CONFIG.maskUrl;
    bossArenaMaskImage.onload = () => {
      if (disposed) return;

      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = bossArenaMaskImage.naturalWidth;
      maskCanvas.height = bossArenaMaskImage.naturalHeight;
      const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
      if (!maskContext) return;

      maskContext.imageSmoothingEnabled = false;
      maskContext.drawImage(bossArenaMaskImage, 0, 0);

      try {
        const pixels = maskContext.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;
        const walkable = new Uint8Array(maskCanvas.width * maskCanvas.height);
        const { walkableColor, colorTolerance } = BOSS_ARENA_CONFIG;

        for (let pixelIndex = 0, mapIndex = 0; pixelIndex < pixels.length; pixelIndex += 4, mapIndex++) {
          const matchesWalkableColor =
            Math.abs(pixels[pixelIndex] - walkableColor.r) <= colorTolerance &&
            Math.abs(pixels[pixelIndex + 1] - walkableColor.g) <= colorTolerance &&
            Math.abs(pixels[pixelIndex + 2] - walkableColor.b) <= colorTolerance;
          walkable[mapIndex] = matchesWalkableColor ? 1 : 0;
        }

        bossArenaMaskDataRef.current = {
          width: maskCanvas.width,
          height: maskCanvas.height,
          walkable,
        };
      } catch (error) {
        console.error("Failed to read boss arena collision mask", error);
        bossArenaMaskDataRef.current = null;
      }
    };
    bossArenaMaskImage.onerror = () => {
      if (!disposed) bossArenaMaskDataRef.current = null;
    };

    return () => {
      disposed = true;
    };
  }, []);

  const isMissionPositionWalkable = (x: number, y: number, radius = 0) => {
    const mask = missionMaskDataRef.current;
    if (!mask) return false;

    const samplePoint = (sampleX: number, sampleY: number) => {
      const pixelX = Math.floor(sampleX);
      const pixelY = Math.floor(sampleY);
      if (pixelX < 0 || pixelX >= mask.width || pixelY < 0 || pixelY >= mask.height) return false;
      return mask.walkable[pixelY * mask.width + pixelX] === 1;
    };

    if (!samplePoint(x, y)) return false;
    if (radius <= 0) return true;

    for (let index = 0; index < MISSION_MAP_CONFIG.collisionSamples; index++) {
      const angle = (index / MISSION_MAP_CONFIG.collisionSamples) * Math.PI * 2;
      if (!samplePoint(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)) return false;
    }
    return true;
  };

  const findWalkableSpawn = (radius: number, center?: { x: number; y: number }, distance = 0) => {
    const { width, height } = MISSION_MAP_CONFIG.worldSize;
    for (let attempt = 0; attempt < MISSION_MAP_CONFIG.spawnAttempts; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const candidateDistance = center ? distance * (0.8 + Math.random() * 0.4) : 0;
      const x = center
        ? center.x + Math.cos(angle) * candidateDistance
        : radius + Math.random() * (width - radius * 2);
      const y = center
        ? center.y + Math.sin(angle) * candidateDistance
        : radius + Math.random() * (height - radius * 2);
      if (isMissionPositionWalkable(x, y, radius)) return { x, y };
    }
    return null;
  };

  const moveWithinMissionMask = (
    entity: { x: number; y: number },
    deltaX: number,
    deltaY: number,
    radius: number,
  ) => {
    const nextX = entity.x + deltaX;
    if (isMissionPositionWalkable(nextX, entity.y, radius)) entity.x = nextX;

    const nextY = entity.y + deltaY;
    if (isMissionPositionWalkable(entity.x, nextY, radius)) entity.y = nextY;
  };

  const isBossArenaPositionWalkable = (
    x: number,
    y: number,
    radius: number,
    mapSize: { width: number; height: number },
  ) => {
    const mask = bossArenaMaskDataRef.current;
    if (!mask) return true;

    const placement = getCoverPlacement(mask.width, mask.height, mapSize.width, mapSize.height);
    const samplePoint = (sampleX: number, sampleY: number) => {
      const pixelX = Math.floor(((sampleX - placement.x) / placement.width) * mask.width);
      const pixelY = Math.floor(((sampleY - placement.y) / placement.height) * mask.height);
      if (pixelX < 0 || pixelX >= mask.width || pixelY < 0 || pixelY >= mask.height) return false;
      return mask.walkable[pixelY * mask.width + pixelX] === 1;
    };

    if (!samplePoint(x, y)) return false;
    for (let index = 0; index < BOSS_ARENA_CONFIG.collisionSamples; index++) {
      const angle = (index / BOSS_ARENA_CONFIG.collisionSamples) * Math.PI * 2;
      if (!samplePoint(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)) return false;
    }
    return true;
  };

  const findNearestBossArenaSpawn = (
    desired: { x: number; y: number },
    radius: number,
    mapSize: { width: number; height: number },
  ) => {
    if (isBossArenaPositionWalkable(desired.x, desired.y, radius, mapSize)) return desired;

    const maxDistance = Math.hypot(mapSize.width, mapSize.height);
    for (let distance = BOSS_ARENA_CONFIG.spawnSearchStep; distance <= maxDistance; distance += BOSS_ARENA_CONFIG.spawnSearchStep) {
      const samples = Math.max(12, Math.ceil((Math.PI * 2 * distance) / BOSS_ARENA_CONFIG.spawnSearchStep));
      for (let index = 0; index < samples; index++) {
        const angle = (index / samples) * Math.PI * 2;
        const x = desired.x + Math.cos(angle) * distance;
        const y = desired.y + Math.sin(angle) * distance;
        if (isBossArenaPositionWalkable(x, y, radius, mapSize)) return { x, y };
      }
    }
    return desired;
  };

  const moveWithinBossArenaMask = (
    entity: { x: number; y: number },
    deltaX: number,
    deltaY: number,
    radius: number,
    mapSize: { width: number; height: number },
  ) => {
    let movedX = false;
    let movedY = false;
    const nextX = entity.x + deltaX;
    if (isBossArenaPositionWalkable(nextX, entity.y, radius, mapSize)) {
      entity.x = nextX;
      movedX = true;
    }
    const nextY = entity.y + deltaY;
    if (isBossArenaPositionWalkable(entity.x, nextY, radius, mapSize)) {
      entity.y = nextY;
      movedY = true;
    }
    return { movedX, movedY };
  };

  useEffect(() => {
    const img = new Image();
    img.src = ROBOT_CONFIG.c2_932.portrait;
    img.onload = () => {
      companionRobotImagesRef.current["C2-932"] = img;
      setCompanionsLoaded({ "C2-932": true });
    };
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = ROBOT_BATTLE_SPRITES.walk;
    img.onload = () => {
      bossRobotSpriteImgRef.current = img;
      setBossRobotSpriteLoaded(true);
    };
    img.onerror = () => {
      bossRobotSpriteImgRef.current = null;
      setBossRobotSpriteLoaded(false);
    };

    const imgAct = new Image();
    imgAct.src = ROBOT_BATTLE_SPRITES.action;
    imgAct.onload = () => {
      bossRobotActImgRef.current = imgAct;
      setBossRobotActLoaded(true);
    };
    imgAct.onerror = () => {
      bossRobotActImgRef.current = null;
      setBossRobotActLoaded(false);
    };
  }, []);

  useEffect(() => {
    const spriteUrl = walkSprites[selectedAgent.id as "claire" | "ethan" | "leo"]?.src;
    if (!spriteUrl) return;

    setSpriteLoaded(false);
    const img = new Image();
    img.src = spriteUrl;
    img.onload = () => {
      playerSpriteImgRef.current = img;
      setSpriteLoaded(true);
    };
    img.onerror = () => {
      playerSpriteImgRef.current = null;
      setSpriteLoaded(false);
    };
  }, [selectedAgent.id]);

  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Ref-based Game Engine Variables (to run at 60fps independent of React state lags)
  const engineRef = useRef({
    player: { 
      x: 450, 
      y: 225, 
      radius: 14, 
      vx: 0, 
      vy: 0, 
      invincibleTime: 0, 
      batteryVal: 100, 
      hp: 3, 
      maxHp: 3, 
      level: 1, 
      exp: 0, 
      expNeeded: 100,
      punchCooldown: 0,
      laserCooldown: 0,
      ultEnergy: 0,
      isShieldActive: false,
      shieldDurability: 4,
      maxShieldDurability: 4,
      shieldBrokenTimer: 0,
      laserBattery: 100,
      maxLaserBattery: 100,
      lastRobotDir: "down" as "down" | "up" | "right" | "left",
      lastAimX: 1,
      lastAimY: 0,
      hasMoved: false,
      actionType: "defend" as "defend" | "punch" | "laser" | "ult",
      actionEndTime: 0
    },
    enemies: [] as EnemyEntity[],
    enemyDeathEffects: [] as EnemyDeathEffect[],
    collectibles: [] as Array<{ x: number; y: number; type: "battery" | "gem" | "material" | "coin"; amount: number; materialType?: string; radius: number; pulse: number }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; radius: number; color: string; life: number; maxLife: number; alpha: number; text?: string }>,
    bullets: [] as Array<{ x: number; y: number; vx: number; vy: number; damage: number; radius: number; color: string; isLaserBeam?: boolean; laserEndX?: number; laserEndY?: number; maxLife?: number; life?: number; isEnemy?: boolean; isHoming?: boolean; visual?: "rock" | "tool"; rotation?: number; angularVelocity?: number }>,
    lightZones: [] as Array<{ x: number; y: number; radius: number; damage: number; duration: number; maxDuration: number; highMode: boolean }>,
    bombingZones: [] as BombingZone[],
    boss: null as { 
      x: number; 
      y: number; 
      vx: number; 
      vy: number; 
      hp: number; 
      maxHp: number; 
      radius: number; 
      attackCooldown: number; 
      name: string; 
      targetY?: number; 
      currentPattern?: number; 
      visualTimer?: number;
      dashTimer?: number; 
      dashVx?: number; 
      dashVy?: number;
      stunTimer?: number;
      stunMeter?: number;
      defenseTimer?: number;
      diveTimer?: number;
      diveTargetX?: number;
      diveTargetY?: number;
      submerged?: boolean;
      tentacleTimer?: number;
      tentacleTargetX?: number;
      tentacleTargetY?: number;
      chainDashRemaining?: number;
      roarTimer?: number;
      roarX?: number;
      roarY?: number;
      summonTimer?: number;
      airRaidTimer?: number;
      airRaidStartX?: number;
      airRaidEndX?: number;
      airRaidY?: number;
      airRaidReturnTimer?: number;
      airRaidReturnY?: number;
      laserAttackTimer?: number;
      laserTargetX?: number;
      laserTargetY?: number;
      strafeTimer?: number;
      facingX?: number;
      introOriginX?: number;
      introOriginY?: number;
      hitFlashUntil?: number;
      hitOffsetX?: number;
      hitOffsetY?: number;
    } | null,
    ticks: 0,
    spawnTimer: 0,
    mapSize: { ...MISSION_MAP_CONFIG.worldSize },
    camera: { x: 0, y: 0 },
    lowBatteryCooldown: 0,
    screenShake: 0,
    companionSkills: {} as Record<string, number>
  });

  useEffect(() => {
    if (bossIntroPhase === "entrance") {
      const timer = window.setTimeout(() => setBossIntroPhase("start"), 950);
      return () => window.clearTimeout(timer);
    }
    if (bossIntroPhase === "start") {
      const timer = window.setTimeout(() => {
        setBossIntroPhase(null);
        window.requestAnimationFrame(() => canvasRef.current?.focus({ preventScroll: true }));
      }, 1150);
      return () => window.clearTimeout(timer);
    }
  }, [bossIntroPhase]);

  // Sound triggering helper wrapper
  const triggerSound = (s: string) => {
    try {
      playSound(s);
    } catch (e) {
      // safe fallback
    }
  };

  // Switch Low/High Battery Mode manually
  const toggleBatteryMode = () => {
    setBatteryMode((prev) => {
      const next = prev === "LOW" ? "HIGH" : "LOW";
      recordAction("useWorkLight");
      if (next === "HIGH") recordAction("highBeamActivated");
      triggerSound(next === "HIGH" ? "power" : "click");
      return next;
    });
  };

  // Keyboard and mouse handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (showUpgradeChoice) {
        if (["ArrowUp", "ArrowDown", "Space"].includes(e.code)) e.preventDefault();
        return;
      }

      // Modal actions take priority over the combat hotkeys underneath them.
      if (showTipModal && (e.code === "Enter" || e.code === "Space")) {
        e.preventDefault();
        if (!e.repeat) handleConfirmTip();
        return;
      }

      const isCombatStage = stage === "PLAYING" || stage === "BOSSBATTLE";
      if (!isCombatStage && stage !== "BOSS_WARNING") {
        const root = gameRootRef.current;
        if (!root) return;

        const controls = (Array.from(
          root.querySelectorAll('button:not([disabled]), input[type="checkbox"]:not([disabled])'),
        ) as HTMLElement[]).filter((element) => element.offsetParent !== null);

        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.code)) {
          e.preventDefault();
          if (e.repeat || controls.length === 0) return;
          const activeIndex = controls.findIndex((element) => element === document.activeElement);
          const direction = e.code === "ArrowUp" || e.code === "ArrowLeft" ? -1 : 1;
          const nextIndex = e.code === "Home"
            ? 0
            : e.code === "End"
            ? controls.length - 1
            : activeIndex < 0
            ? direction > 0 ? 0 : controls.length - 1
            : (activeIndex + direction + controls.length) % controls.length;
          controls[nextIndex]?.focus({ preventScroll: true });
          triggerSound("click");
          return;
        }

        if (e.code === "Enter" || e.code === "Space") {
          e.preventDefault();
          if (e.repeat || controls.length === 0) return;
          const activeControl = controls.find((element) => element === document.activeElement) || controls[0];
          activeControl.focus({ preventScroll: true });
          activeControl.click();
          return;
        }
        return;
      }

      keysRef.current[e.key.toLowerCase()] = true;
      keysRef.current[e.code] = true;

      // Prevent scrolling
      if (["space", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase()) || e.code === "Space") {
        e.preventDefault();
      }

      // SPACE to toggle Mode
      if (e.code === "Space" && stage === "PLAYING") {
        toggleBatteryMode();
      }

      if (e.code === "KeyR" && !e.repeat) {
        e.preventDefault();
        startGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (showUpgradeChoice) return;
      keysRef.current[e.key.toLowerCase()] = false;
      keysRef.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [stage, showUpgradeChoice, showTipModal, onClose]);

  useEffect(() => {
    if (stage === "PLAYING" || stage === "BOSSBATTLE" || stage === "BOSS_WARNING" || showUpgradeChoice) return;
    const timer = window.setTimeout(() => {
      const firstControl = gameRootRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), input[type="checkbox"]:not([disabled])',
      );
      firstControl?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [stage, startStep, showTipModal, showUpgradeChoice]);

  // Generate random upgrades when leveling up
  const triggerLevelUpUpgrade = (currentWeapons: Record<string, number>) => {
    triggerSound("upgrade");
    const options: Array<{ id: string; type: "weapon" | "stat"; name: string; desc: string; icon: string }> = [];

    // Mission level-ups are temporary character stats only. Permanent C2-932 modules are laboratory-only.

    // Stat options
    options.push({
      id: "stat_hp",
      type: "stat",
      name: "增加生命上限 (+1 ❤️)",
      desc: "強化燈小隊防護服裝，提升一格生命心型容量，並補滿生命。",
      icon: "❤️"
    });
    options.push({
      id: "stat_battery",
      type: "stat",
      name: "超能電容擴容 (+20 🔋)",
      desc: "配備高性能固態電池，提升儲能上限，延長高亮模式續航力。",
      icon: "🔋"
    });
    options.push({
      id: "stat_speed",
      type: "stat",
      name: "奈米推進組件 (速度 +15%)",
      desc: "提升本次冒險的小隊移動速度，更加靈活躲避怪物夾擊。",
      icon: "🏃"
    });

    // Pick 3 random distinct options
    const shuffled = options.sort(() => 0.5 - Math.random());
    setUpgradeChoices(shuffled.slice(0, 3));
    setSelectedUpgradeIndex(0);
    setShowUpgradeChoice(true);
  };

  const handleSelectUpgrade = (choice: { id: string; type: "weapon" | "stat"; name: string }) => {
    triggerSound("click");
    recordAction("levelUp");
    if (choice.id === "stat_hp") {
      setMaxHp((maximum) => {
        const nextMaximum = maximum + 1;
        setHp(nextMaximum);
        return nextMaximum;
      });
    } else if (choice.id === "stat_battery") {
      setSelectedAgent((previous) => ({ ...previous, maxBattery: previous.maxBattery + 20 }));
      engineRef.current.player.batteryVal = Math.min(engineRef.current.player.batteryVal + 50, selectedAgent.maxBattery + 20);
    } else if (choice.id === "stat_speed") {
      setSelectedAgent((previous) => ({ ...previous, speed: previous.speed * 1.15 }));
    }
    setShowUpgradeChoice(false);
  };

  useEffect(() => {
    if (!showUpgradeChoice || upgradeChoices.length === 0) return;
    keysRef.current = {};

    const handleUpgradeKeyboard = (event: KeyboardEvent) => {
      if (event.code === "ArrowUp" || event.code === "ArrowDown") {
        event.preventDefault();
        if (event.repeat) return;
        triggerSound("click");
        const direction = event.code === "ArrowUp" ? -1 : 1;
        setSelectedUpgradeIndex((current) => (current + direction + upgradeChoices.length) % upgradeChoices.length);
      } else if (event.code === "Space") {
        event.preventDefault();
        if (event.repeat) return;
        const selectedChoice = upgradeChoices[selectedUpgradeIndex];
        if (selectedChoice) handleSelectUpgrade(selectedChoice);
      }
    };

    window.addEventListener("keydown", handleUpgradeKeyboard);
    return () => window.removeEventListener("keydown", handleUpgradeKeyboard);
  }, [showUpgradeChoice, upgradeChoices, selectedUpgradeIndex]);

  // Setup / reset game for survivors stage
  const getPlayerMaxBattery = (agent = selectedAgent) => {
    const bonus = (purchasedUpgrades.start_battery || 0) * 20;
    return agent.maxBattery + bonus;
  };

  const handleGameOver = () => {
    recordAction("gameOver");
    if (stage === "BOSSBATTLE" && !bossOutcomeRecordedRef.current) {
      bossOutcomeRecordedRef.current = true;
      recordExhibitionBossOutcome(selectedChapter, "failure");
    }
    setStage("GAMEOVER");
    triggerSound("game_over");
    setCoins((prev) => {
      const updated = prev + sessionCoins;
      localStorage.setItem("light_crew_coins", String(updated));
      return updated;
    });
  };

  const startGame = () => {
    if (!missionMapReady) return;
    // Restore the selected character's authored base stats before every run so
    // level-up choices remain temporary to the adventure in which they occur.
    const baseAgent = AGENTS.find((agent) => agent.id === selectedAgent.id) || AGENTS[0];
    setSelectedAgent(baseAgent);
    recordAction("startMission");
    triggerSound("click");
    setSessionCoins(0);
    const bonusHp = purchasedUpgrades.shield_boost || 0;
    const initialHp = (baseAgent.id === "leo" ? 4 : 3) + bonusHp;
    setHp(initialHp);
    setMaxHp(initialHp);
    setLevel(1);
    setExp(0);
    setExpNeeded(100);
    setBatteryPercent(100);
    setBatteryMode("LOW");
    setTimeLeft(isDemoMode ? 30 : 90);
    setScore(0);
    setWeaponLevels(getAdventureWeaponLevels());
    setCollectedMaterials(createEmptyMaterialInventory());
    materialsBankedRef.current = false;
    setRobotSelection(null);
    robotSelectionRef.current = null;

    const initMaxBattery = getPlayerMaxBattery(baseAgent);
    const configuredSpawn = MISSION_MAP_CONFIG.playerSpawn;
    const initialPlayerPosition = isMissionPositionWalkable(configuredSpawn.x, configuredSpawn.y, 14)
      ? configuredSpawn
      : findWalkableSpawn(14) || configuredSpawn;

    // Reset loop engine state
    engineRef.current = {
      player: { 
        x: initialPlayerPosition.x,
        y: initialPlayerPosition.y,
        radius: 14, 
        vx: 0, 
        vy: 0, 
        invincibleTime: 0, 
        batteryVal: initMaxBattery,
        hp: initialHp,
        maxHp: initialHp,
        level: 1,
        exp: 0,
        expNeeded: 100,
        lastRobotDir: "down" as "down" | "up" | "right" | "left",
        lastAimX: 1,
        lastAimY: 0,
        hasMoved: false,
        actionType: "defend" as "defend" | "punch" | "laser" | "ult",
        actionEndTime: 0
      },
      enemies: [],
      enemyDeathEffects: [],
      collectibles: [],
      particles: [],
      bullets: [],
      lightZones: [],
      bombingZones: [],
      boss: null,
      ticks: 0,
      spawnTimer: 0,
      mapSize: { ...MISSION_MAP_CONFIG.worldSize },
      camera: { x: 375, y: 375 },
      lowBatteryCooldown: 0
    };

    // Spawn initial items & decorations
    for (let i = 0; i < 15; i++) {
      const spawn = findWalkableSpawn(8);
      if (!spawn) continue;
      engineRef.current.collectibles.push({
        x: spawn.x,
        y: spawn.y,
        type: "battery",
        amount: 30,
        radius: 8,
        pulse: Math.random() * Math.PI
      });
    }

    // Spawn initial gold coins for a welcoming feedback loop!
    for (let i = 0; i < 12; i++) {
      const spawn = findWalkableSpawn(6);
      if (!spawn) continue;
      engineRef.current.collectibles.push({
        x: spawn.x,
        y: spawn.y,
        type: "coin",
        amount: Math.floor(Math.random() * 3) + 1,
        radius: 6,
        pulse: Math.random() * Math.PI
      });
    }
    // Spawn modification materials. They are banked after the stage and never alter combat during the mission.
    MATERIAL_IDS.forEach((materialId) => {
      const spawn = findWalkableSpawn(12);
      if (!spawn) return;
      engineRef.current.collectibles.push({
        x: spawn.x,
        y: spawn.y,
        type: "material",
        amount: 1,
        materialType: materialId,
        radius: 12,
        pulse: Math.random() * Math.PI
      });
    });

    setStage("PLAYING");
    setShowTipModal(true);
    setStartTitleActive(false);
  };

  // Assembly Sequence transition
  const enterAssembly = () => {
    triggerSound("power");
    setStage("ASSEMBLY");
  };

  // Report Sequence transition
  const enterReport = () => {
    triggerSound("victory");
    setStage("REPORT");
  };


  const bankCollectedMaterials = () => {
    if (materialsBankedRef.current) return;
    materialsBankedRef.current = true;
    onMaterialsEarned(collectedMaterials);
  };

  const prepareRobotDeployment = () => {
    triggerSound("click");
    bankCollectedMaterials();
    const selection = createC2932Deployment(robotUpgrades);
    robotSelectionRef.current = selection;
    setRobotSelection(selection);
    setStage("ROBOT_DEPLOYMENT");
  };
  const startBossWarning = () => {
    triggerSound("click");
    const selection = createC2932Deployment(robotUpgrades);
    robotSelectionRef.current = selection;
    setRobotSelection(selection);
    setStage("BOSS_WARNING");
  };

  // Set up Boss Battle
  const startBossBattle = () => {
    triggerSound("click");
    recordAction("startBossBattle");
    if (entrySource === "exhibition") recordAction("exhibitionBossBattle");
    if (selectedChapter === 3) recordAction("marineBattle");
    setStage("BOSSBATTLE");
    setBossIntroPhase("entrance");
    setWeaponLevels(getRobotWeaponLevels());

    // Boss combat uses laboratory robot upgrades only. Human supply upgrades
    // belong exclusively to the squad's adventure mode.

    c2932SkillRef.current = { punchCount: 0, fieldEndsAt: 0 };
    setC2932PunchCount(0);
    setC2932FieldRemainingMs(0);

    const activeRobotSelection = robotSelectionRef.current;
    if (!activeRobotSelection) return;
    const calculatedMechaHp = 100 + (robotUpgrades.defense_power || 0) * 25;
    setHp(calculatedMechaHp);
    setMaxHp(calculatedMechaHp);

    const ch = CHAPTERS.find((c) => c.id === selectedChapter) || CHAPTERS[0];
    const bossBehavior = getEffectiveBossBehaviorProfile(selectedChapter);
    const bossKnowledgeModifiers = getBossKnowledgeModifiers(selectedChapter);
    setBossActiveName(ch.bossName);
    // Substantially higher Boss HP for an epic combat challenge!
    const calculatedBossHp = Math.round((2800 + selectedChapter * 1200) * bossKnowledgeModifiers.bossHpMultiplier);
    setBossHp(calculatedBossHp);
    setBossMaxHp(calculatedBossHp);

    const isMobileDevice = window.innerWidth < 640;
    const arenaWidth = isMobileDevice ? 500 : 1400;
    const arenaHeight = isMobileDevice ? 750 : 700;
    const arenaMapSize = { width: arenaWidth, height: arenaHeight };
    const playerSpawn = findNearestBossArenaSpawn(
      {
        x: arenaWidth * BOSS_ARENA_CONFIG.playerSpawn.xRatio,
        y: arenaHeight * BOSS_ARENA_CONFIG.playerSpawn.yRatio,
      },
      22,
      arenaMapSize,
    );
    const bossSpawn = findNearestBossArenaSpawn(
      {
        x: arenaWidth * BOSS_ARENA_CONFIG.bossSpawn.xRatio,
        y: arenaHeight * BOSS_ARENA_CONFIG.bossSpawn.yRatio,
      },
      bossBehavior.radius,
      arenaMapSize,
    );

    // Reset Engine references for boss fight in bounded arena
    engineRef.current = {
      player: { 
        x: playerSpawn.x,
        y: playerSpawn.y,
        radius: 22, 
        vx: 0, 
        vy: 0, 
        invincibleTime: 0, 
        batteryVal: 100,
        hp: calculatedMechaHp,
        maxHp: calculatedMechaHp,
        punchCooldown: 0,
        laserCooldown: 0,
        ultEnergy: 0,
        isShieldActive: false,
        shieldDurability: 4,
        maxShieldDurability: 4,
        shieldBrokenTimer: 0,
        laserBattery: 100,
        maxLaserBattery: 100,
        lastRobotDir: "down" as "down" | "up" | "right" | "left",
        lastAimX: 1,
        lastAimY: 0,
        hasMoved: false,
        actionType: "defend" as "defend" | "punch" | "laser" | "ult",
        actionEndTime: 0
      }, // Mecha is bigger
      enemies: [],
      enemyDeathEffects: [],
      collectibles: [],
      particles: [],
      bullets: [],
      lightZones: [],
      bombingZones: [],
      boss: {
        x: bossSpawn.x,
        y: bossSpawn.y,
        vx: bossBehavior.moveSpeed,
        vy: 0,
        hp: calculatedBossHp,
        maxHp: calculatedBossHp,
        radius: bossBehavior.radius,
        attackCooldown: 0,
        name: ch.bossName,
        targetY: 130,
        currentPattern: 0,
        visualTimer: 0,
        dashTimer: 0,
        dashVx: 0,
        dashVy: 0,
        stunTimer: 0,
        stunMeter: 0,
        defenseTimer: 0,
        diveTimer: 0,
        submerged: false,
        tentacleTimer: 0,
        chainDashRemaining: 0,
        roarTimer: 0,
        summonTimer: 0,
        airRaidTimer: 0,
        airRaidReturnTimer: 0,
        laserAttackTimer: 0,
        strafeTimer: 0,
        facingX: -1,
        introOriginX: bossSpawn.x,
        introOriginY: bossSpawn.y
      },
      ticks: 0,
      spawnTimer: 0,
      mapSize: arenaMapSize, // Bounded Arena size matches responsive canvas
      camera: { x: 0, y: 0 },
      lowBatteryCooldown: 0,
      screenShake: 18,
      companionSkills: {}
    };
    victoryPendingRef.current = false;
    bossOutcomeRecordedRef.current = false;
    triggerSound("bossImpact");
  };

  // Main game loop (delta physics and rendering)
  useEffect(() => {
    if (stage !== "PLAYING" && stage !== "BOSSBATTLE") return;
    if (showUpgradeChoice) return; // Pause game during level-up popup

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const activeChapter = CHAPTERS.find((c) => c.id === selectedChapter) || CHAPTERS[0];
    const bossBehavior = getEffectiveBossBehaviorProfile(selectedChapter);

    const isMobileDevice = window.innerWidth < 640;
    const spawnParticle = (st: any, p: any) => {
      const maxAllowed = isMobileDevice ? 40 : 120;
      if (st.particles.length < maxAllowed) {
        st.particles.push(p);
      } else if (Math.random() < 0.2) {
        const idx = st.particles.findIndex((x: any) => !x.text);
        if (idx !== -1) {
          st.particles[idx] = p;
        }
      }
    };

    const gameLoop = () => {
      const state = engineRef.current as any;
      const player = state.player;
      
      // Initialize or reset sync markers
      if (state.ticks === 1 || state.lastBatteryPercent === undefined) {
        state.lastBatteryPercent = -1;
        state.lastLaserBattery = -1;
        state.lastUltEnergy = -1;
        state.lastBossHp = -1;
        state.lastBossStunActive = false;
        state.lastShieldActive = false;
        state.lastExp = -1;
        state.score = state.score ?? 0;
        state.lastScoreSynced = -1;
        state.sessionCoins = state.sessionCoins ?? 0;
        state.lastSessionCoinsSynced = -1;
      }
      
      const isPaused = showTipModal || startTitleActive || bossIntroPhase !== null;

      if (stage === "BOSSBATTLE" && state.boss && bossIntroPhase) {
        const boss = state.boss;
        const originX = boss.introOriginX ?? boss.x;
        const originY = boss.introOriginY ?? boss.y;
        if (bossIntroPhase === "entrance") {
          state.bossIntroFrame = (state.bossIntroFrame || 0) + 1;
          const entranceProgress = Math.min(1, state.bossIntroFrame / 54);
          boss.x = originX + Math.sin(state.bossIntroFrame * 0.22) * 12;
          boss.y = originY + Math.sin(entranceProgress * Math.PI) * 34;
          boss.currentPattern = 3;
          boss.visualTimer = 2;
          if (state.bossIntroFrame === 1) state.screenShake = 12;
        } else {
          boss.x = originX;
          boss.y = originY;
          boss.currentPattern = 0;
          boss.visualTimer = 0;
        }
      }
      
      let dx = 0;
      let dy = 0;
      const isHigh = batteryMode === "HIGH";

      if (!isPaused) {
        state.ticks++;
        if (stage === "BOSSBATTLE") {
          const selectedRobot = robotSelectionRef.current;
          const fieldRemainingMs = Math.max(0, c2932SkillRef.current.fieldEndsAt - Date.now());
          if (selectedRobot?.robotId === "c2_932" && (robotUpgrades.energy_shield || 0) > 0 && selectedRobot.fullyUnlocked) {
            if (state.ticks % 6 === 0) setC2932FieldRemainingMs(fieldRemainingMs);
            if (fieldRemainingMs === 0 && c2932SkillRef.current.fieldEndsAt !== 0) {
              c2932SkillRef.current.fieldEndsAt = 0;
              setC2932FieldRemainingMs(0);
            }
          }
        }


        // Decrement companion skills active duration
        if (state.companionSkills) {
          Object.keys(state.companionSkills).forEach((key) => {
            if (state.companionSkills[key] > 0) {
              state.companionSkills[key]--;
            }
          });
        }

      // 1. UPDATE GAME TIMER (For Survivors mode only)
      if (stage === "PLAYING" && state.ticks % 60 === 0) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            enterReport();
            return 0;
          }
          return prev - 1;
        });
      }

      // Handle invincible frames
      if (player.invincibleTime > 0) {
        player.invincibleTime--;
      }

       // 2. INPUT & PLAYER MOVEMENT
       let isStaggered = false;
       if (stage === "BOSSBATTLE") {
         if (player.shieldBrokenTimer === undefined) player.shieldBrokenTimer = 0;
         if (player.shieldBrokenTimer > 0) {
           player.shieldBrokenTimer--;
           isStaggered = true;
           dx = 0;
           dy = 0;
           
           // Spawn sparks showing error or disruption on the player
           if (state.ticks % 4 === 0) {
             state.particles.push({
               x: player.x + (Math.random() - 0.5) * 30,
               y: player.y + (Math.random() - 0.5) * 30,
               vx: (Math.random() - 0.5) * 3,
               vy: (Math.random() - 0.5) * 3,
               radius: 1.5 + Math.random() * 1.5,
               color: "#ef4444", // red error sparks
               life: 0,
               maxLife: 15,
               alpha: 1
             });
           }
           
           if (player.shieldBrokenTimer === 0) {
             player.shieldDurability = 4;
             setMechaShieldBroken(false);
             setMechaShieldDurability(4);
           }
         }
       }

       if (!isStaggered) {
         if (keysRef.current["w"] || keysRef.current["arrowup"]) dy -= 1;
         if (keysRef.current["s"] || keysRef.current["arrowdown"]) dy += 1;
         if (keysRef.current["a"] || keysRef.current["arrowleft"]) dx -= 1;
         if (keysRef.current["d"] || keysRef.current["arrowright"]) dx += 1;
       }

       // Normalize diagonal speed
       if (dx !== 0 && dy !== 0) {
         dx *= 0.7071;
         dy *= 0.7071;
       }

       // Preserve the last intentional movement direction so directional
       // attacks and the light cone do not snap back to the right when idle.
       if (dx !== 0 || dy !== 0) {
         player.lastAimX = dx;
         player.lastAimY = dy;
       }

       const speedMultiplier = stage === "BOSSBATTLE"
         ? 1 + (robotUpgrades.movement_speed || 0) * 0.08
         : 1 + (purchasedUpgrades.speed_boost || 0) * 0.1;
       const currentSpeed = (stage === "BOSSBATTLE" ? 2.5 : selectedAgent.speed) * speedMultiplier;
       if (stage === "PLAYING") {
         moveWithinMissionMask(player, dx * currentSpeed, dy * currentSpeed, player.radius);
       } else if (stage === "BOSSBATTLE") {
         if (!isBossArenaPositionWalkable(player.x, player.y, player.radius, state.mapSize)) {
           const correctedSpawn = findNearestBossArenaSpawn(player, player.radius, state.mapSize);
           player.x = correctedSpawn.x;
           player.y = correctedSpawn.y;
         }
         moveWithinBossArenaMask(player, dx * currentSpeed, dy * currentSpeed, player.radius, state.mapSize);
       } else {
         player.x += dx * currentSpeed;
         player.y += dy * currentSpeed;
       }

       if (stage === "BOSSBATTLE") {
         if (dx > 0) {
           player.lastRobotDir = "right";
           player.hasMoved = true;
         } else if (dx < 0) {
           player.lastRobotDir = "left";
           player.hasMoved = true;
         } else if (dy > 0) {
           player.lastRobotDir = "down";
           player.hasMoved = true;
         } else if (dy < 0) {
           player.lastRobotDir = "up";
           player.hasMoved = true;
         }
       }

      if (dx < 0) {
        playerFacingLeftRef.current = true;
      } else if (dx > 0) {
        playerFacingLeftRef.current = false;
      }

      // Bound player inside map boundaries
      player.x = Math.max(player.radius, Math.min(state.mapSize.width - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(state.mapSize.height - player.radius, player.y));

      // Camera Tracking (Survivors Mode has scrolling)
      if (stage === "PLAYING") {
        state.camera.x = player.x - canvas.width / 2;
        state.camera.y = player.y - canvas.height / 2;
        // Clamp camera to map bounds
        state.camera.x = Math.max(0, Math.min(state.mapSize.width - canvas.width, state.camera.x));
        state.camera.y = Math.max(0, Math.min(state.mapSize.height - canvas.height, state.camera.y));
      } else {
        // Boss Arena camera stays locked at center/origin
        state.camera.x = 0;
        state.camera.y = 0;
      }

      // 3. BATTERY DEPLETION (Survivors Mode Only)
      if (stage === "PLAYING") {
        const drainRate = batteryMode === "HIGH" 
          ? (selectedAgent.id === "ethan" ? 0.22 : 0.3) 
          : 0.03;

        const maxBatLimit = getPlayerMaxBattery();
        player.batteryVal = Math.max(0, player.batteryVal - drainRate);
        const nextBatPercent = Math.ceil((player.batteryVal / maxBatLimit) * 100);
        if (state.lastBatteryPercent !== nextBatPercent) {
          state.lastBatteryPercent = nextBatPercent;
          setBatteryPercent(nextBatPercent);
        }

        if (player.batteryVal <= 0.1 && batteryMode === "HIGH") {
          setBatteryMode("LOW");
          triggerSound("low_battery");
          // Low battery protection spark
          for (let i = 0; i < 5; i++) {
            state.particles.push({
              x: player.x,
              y: player.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              radius: 2,
              color: "#ef4444",
              life: 0,
              maxLife: 20,
              alpha: 1
            });
          }
        }
      }

      // -- MECHA BOSSBATTLE CUSTOM SKILL CONTROLS --
      if (stage === "BOSSBATTLE") {
        const priorities: Record<string, number> = { defend: 1, laser: 2, punch: 3, ult: 4 };
        const setMechaAction = (action: "defend" | "punch" | "laser" | "ult", duration: number) => {
          const now = Date.now();
          const currentActive = player.actionEndTime && now < player.actionEndTime;
          const currentPriority = currentActive ? (priorities[player.actionType as string] || 0) : 0;
          const newPriority = priorities[action] || 0;
          if (!currentActive || newPriority >= currentPriority) {
            player.actionType = action;
            player.actionEndTime = now + duration;
          }
        };

        // Decrease punch cooldown
        if (player.punchCooldown === undefined) player.punchCooldown = 0;
        if (player.punchCooldown > 0) player.punchCooldown--;
        
        // Decrease laser cooldown
        if (player.laserCooldown === undefined) player.laserCooldown = 0;
        if (player.laserCooldown > 0) player.laserCooldown--;

        // 1. Defend Shield (X)
        const shieldActive = !!(keysRef.current["x"] || keysRef.current["keyx"]);
        if (shieldActive && !(player as any).wasShieldHeld) recordAction("useMechaShield");
        (player as any).wasShieldHeld = shieldActive;
        player.isShieldActive = shieldActive;
        if (shieldActive) {
          setMechaAction("defend", 120);
        }
        if (shieldActive !== mechaActiveShield) {
          setMechaActiveShield(shieldActive);
        }

        // Adjust speed if shield is active
        if (shieldActive && (dx !== 0 || dy !== 0)) {
          // Subtract half of the movement added earlier to slow down mecha to ~45% speed
          player.x -= dx * currentSpeed * 0.55;
          player.y -= dy * currentSpeed * 0.55;
          // Re-clamp
          player.x = Math.max(player.radius, Math.min(state.mapSize.width - player.radius, player.x));
          player.y = Math.max(player.radius, Math.min(state.mapSize.height - player.radius, player.y));
        }

        // Charge Ultimate Energy over time and hits
        if (player.ultEnergy === undefined) player.ultEnergy = 0;
        if (player.ultEnergy < 100) {
          player.ultEnergy = Math.min(100, player.ultEnergy + 0.12); // Standard automatic charge over ~14 seconds
          if (state.ticks % 10 === 0) {
            setMechaUltEnergy(Math.floor(player.ultEnergy));
          }
        }

        // 2. Punch (Z)
        if ((keysRef.current["z"] || keysRef.current["keyz"]) && player.punchCooldown === 0) {
          recordAction("useMechaPunch");
          player.punchCooldown = 22; // 0.36s cooldown
          setMechaAction("punch", 90);

          // Aim at Boss or facing direction
          const targetX = state.boss ? state.boss.x : player.x;
          const targetY = state.boss ? state.boss.y : player.y - 100;
          const punchAngle = Math.atan2(targetY - player.y, targetX - player.x);
          
          // Generous melee reach keeps the large robot sprite and the actual
          // collision zone aligned, especially on smaller touch screens.
          const punchRange = 200;
          const distanceToBoss = state.boss ? Math.hypot(state.boss.x - player.x, state.boss.y - player.y) : 999;
          
          if (state.boss && !state.boss.submerged && distanceToBoss <= punchRange + state.boss.radius) {
            const punchDamage = 110; // High single hit damage
            state.boss.hp -= punchDamage * ((state.boss.defenseTimer || 0) > 0 ? bossBehavior.defenseDamageMultiplier : 1);
            setBossHp(Math.max(0, Math.ceil(state.boss.hp)));
            applyHitFeedback(state, state.boss, triggerSound, {
              strength: 5,
              angle: punchAngle,
              color: bossBehavior.usesRockProjectiles ? "#d6a35d" : "#fbbf24",
              heavy: true,
            });

            // The punch wave and C2-932 combo feedback only exist after a confirmed melee hit.
            // This keeps the visual language consistent with the actual effective range.
            state.bullets.push({
              x: player.x + Math.cos(punchAngle) * 25,
              y: player.y + Math.sin(punchAngle) * 25,
              vx: Math.cos(punchAngle) * 9,
              vy: Math.sin(punchAngle) * 9,
              damage: 0,
              radius: 42,
              color: "rgba(251, 146, 60, 0.35)",
              maxLife: 6,
              life: 0
            });

            const selectedRobot = robotSelectionRef.current;
            if (selectedRobot?.robotId === "c2_932" && (robotUpgrades.energy_shield || 0) > 0 && selectedRobot.fullyUnlocked) {
              const nextPunchCount = c2932SkillRef.current.punchCount + 1;
              if (nextPunchCount >= C2_932_PUNCHES_REQUIRED) {
                c2932SkillRef.current.punchCount = 0;
                c2932SkillRef.current.fieldEndsAt = Date.now() + C2_932_FIELD_DURATION_MS;
                setC2932PunchCount(0);
                setC2932FieldRemainingMs(C2_932_FIELD_DURATION_MS);
                for (let i = 0; i < 28; i++) {
                  const angle = (i / 28) * Math.PI * 2;
                  state.particles.push({
                    x: player.x + Math.cos(angle) * C2_932_FIELD_RADIUS,
                    y: player.y + Math.sin(angle) * C2_932_FIELD_RADIUS,
                    vx: Math.cos(angle) * 1.5,
                    vy: Math.sin(angle) * 1.5,
                    radius: 3,
                    color: "#22d3ee",
                    life: 0,
                    maxLife: 28,
                    alpha: 1,
                    text: i === 0 ? "\u9632\u79a6\u529b\u5834\u555f\u52d5" : undefined
                  });
                }
              } else {
                c2932SkillRef.current.punchCount = nextPunchCount;
                setC2932PunchCount(nextPunchCount);
              }
            }
            
            // Gain extra ultimate charge on successful hit!
            player.ultEnergy = Math.min(100, player.ultEnergy + 9);
            setMechaUltEnergy(Math.floor(player.ultEnergy));

            // Heavy strike impact screen shake
            state.screenShake = 16;

            // Increment stun meter
            if (state.boss.stunMeter === undefined) state.boss.stunMeter = 0;
            state.boss.stunMeter++;

            if (state.boss.stunMeter >= 4) {
              state.boss.stunTimer = 60; // 1 second stun
              state.boss.stunMeter = 0;
              setBossStunActive(true);
              triggerSound("power");

              // Spawn dizzy stars and STUNNED indicator
              for (let i = 0; i < 20; i++) {
                const a = Math.random() * Math.PI * 2;
                const spd = 2 + Math.random() * 4;
                state.particles.push({
                  x: state.boss.x,
                  y: state.boss.y - 15,
                  vx: Math.cos(a) * spd,
                  vy: Math.sin(a) * spd,
                  radius: 3 + Math.random() * 2,
                  color: "#facc15", // yellow stars
                  life: 0,
                  maxLife: 30,
                  alpha: 1,
                  text: i === 0 ? "💫 BOSS STUNNED! 💫" : undefined
                });
              }
            } else {
              // Standard hit indicator
              state.particles.push({
                x: state.boss.x,
                y: state.boss.y - 50,
                vx: 0,
                vy: -1.2,
                radius: 1,
                color: "#f59e0b",
                life: 0,
                maxLife: 35,
                alpha: 1,
                text: `💥 CRIT STRIKE [STUN: ${state.boss.stunMeter}/4]`
              });
            }

            // Heavy strike sparks
            for (let i = 0; i < 15; i++) {
              const a = punchAngle + (Math.random() - 0.5) * 1.2;
              const spd = 4 + Math.random() * 7;
              state.particles.push({
                x: state.boss.x + (Math.random() - 0.5) * 15,
                y: state.boss.y + (Math.random() - 0.5) * 15,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                radius: 3 + Math.random() * 3,
                color: "#f97316", // Punch orange sparks
                life: 0,
                maxLife: 18,
                alpha: 1
              });
            }

            if (state.boss.hp <= 0) {
              handleVictory();
            }
          }
        }

        // 3. Fire Laser Beam (C) with Battery Consumption
        if (player.laserBattery === undefined) player.laserBattery = 100;
        const isHoldingLaserKey = keysRef.current["c"] || keysRef.current["keyc"];
        if (isHoldingLaserKey && !(player as any).wasLaserHeld) recordAction("useMechaLaser");
        (player as any).wasLaserHeld = !!isHoldingLaserKey;

        if (isHoldingLaserKey && player.laserBattery >= 10 && player.shieldBrokenTimer === 0) {
          if (player.laserCooldown === 0) {
            player.laserCooldown = 5; // Fast tick rate
            setMechaAction("laser", 110);
            triggerSound("shoot");

            // Consume laser battery
            player.laserBattery = Math.max(0, player.laserBattery - 4.5);
            const nextLaserBattery = Math.floor(player.laserBattery);
            if (state.lastLaserBattery !== nextLaserBattery) {
              state.lastLaserBattery = nextLaserBattery;
              setMechaLaserBattery(nextLaserBattery);
            }

            const targetBoss = state.boss && !state.boss.submerged ? state.boss : null;
            const targetX = targetBoss ? targetBoss.x : player.x + player.lastAimX * 300;
            const targetY = targetBoss ? targetBoss.y : player.y + player.lastAimY * 300;
            
            if (targetBoss) {
              const laserDmg = 9; // Good continuous damage
              targetBoss.hp -= laserDmg * ((targetBoss.defenseTimer || 0) > 0 ? bossBehavior.defenseDamageMultiplier : 1);
              setBossHp(Math.max(0, Math.ceil(targetBoss.hp)));
              applyHitFeedback(state, targetBoss, triggerSound, {
                strength: 0.7,
                angle: Math.atan2(targetY - player.y, targetX - player.x),
                color: "#e0f2fe",
              });

              // Gain very slight ult energy on laser hit
              player.ultEnergy = Math.min(100, player.ultEnergy + 0.8);
              const nextUltOnLaser = Math.floor(player.ultEnergy);
              if (state.lastUltEnergy !== nextUltOnLaser) {
                state.lastUltEnergy = nextUltOnLaser;
                setMechaUltEnergy(nextUltOnLaser);
              }

              if (targetBoss.hp <= 0) {
                handleVictory();
              }
            }

            // High brightness laser line bullets
            state.bullets.push({
              x: player.x,
              y: player.y,
              vx: 0,
              vy: 0,
              damage: 0,
              radius: 5,
              color: "#38bdf8",
              isLaserBeam: true,
              laserEndX: targetX,
              laserEndY: targetY,
              maxLife: 4,
              life: 0
            });

            // Double sparks on target point
            if (targetBoss) {
              for (let i = 0; i < 2; i++) {
                state.particles.push({
                  x: targetBoss.x + (Math.random() - 0.5) * 20,
                  y: targetBoss.y + (Math.random() - 0.5) * 20,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  radius: 2,
                  color: "#0284c7",
                  life: 0,
                  maxLife: 12,
                  alpha: 1
                });
              }
            }
          }
        } else {
          // Recharging laser battery when not firing or key is released
          player.laserBattery = Math.min(100, player.laserBattery + 0.42);
          const nextLaserBattery = Math.floor(player.laserBattery);
          if (state.lastLaserBattery !== nextLaserBattery) {
            state.lastLaserBattery = nextLaserBattery;
            setMechaLaserBattery(nextLaserBattery);
          }

          if (isHoldingLaserKey && player.laserBattery < 10) {
            if (state.ticks % 25 === 0) {
              state.particles.push({
                x: player.x,
                y: player.y - 45,
                vx: 0,
                vy: -0.8,
                radius: 1,
                color: "#eab308", // Yellow color
                life: 0,
                maxLife: 30,
                alpha: 1,
                text: "⚡ DEPLETED! RECHARGING... ⚡"
              });
            }
          }
        }

        // 4. Ultimate Special Skill (V)
        if ((keysRef.current["v"] || keysRef.current["keyv"]) && player.ultEnergy >= 99.5) {
          recordAction("useMechaUltimate");
          player.ultEnergy = 0;
          setMechaUltEnergy(0);
          setMechaAction("ult", 140);
          triggerSound("power");
          triggerSound("explosion");

          // Ultra Heavy screen shake for complete immersion!
          state.screenShake = 35;

          // Clear all hostile bullets
          state.bullets = state.bullets.filter(b => !b.isEnemy);

          // Clear any common enemies
          state.enemies = [];

          // Deal colossal damage to Boss
          if (state.boss && !state.boss.submerged) {
            const ultDamage = 450;
            state.boss.hp -= ultDamage * ((state.boss.defenseTimer || 0) > 0 ? bossBehavior.defenseDamageMultiplier : 1);
            setBossHp(Math.max(0, Math.ceil(state.boss.hp)));
            applyHitFeedback(state, state.boss, triggerSound, {
              strength: 8,
              color: "#67e8f9",
              heavy: true,
            });

            if (state.boss.hp <= 0) {
              handleVictory();
            }

            // Orbital Strike Column visualizer
            // Particles spawning all along the vertical column from Y=0 down to Boss.y
            for (let yOffset = 0; yOffset < state.boss.y; yOffset += 20) {
              for (let j = 0; j < 3; j++) {
                state.particles.push({
                  x: state.boss.x + (Math.random() - 0.5) * 50,
                  y: yOffset + (Math.random() - 0.5) * 15,
                  vx: (Math.random() - 0.5) * 2,
                  vy: 2 + Math.random() * 4,
                  radius: 3 + Math.random() * 4,
                  color: "#06b6d4", // Electric cyan column
                  life: 0,
                  maxLife: 20,
                  alpha: 1
                });
              }
            }

            // Massive boss explosion visual burst!
            for (let i = 0; i < 45; i++) {
              const theta = Math.random() * Math.PI * 2;
              const spd = 4 + Math.random() * 8;
              state.particles.push({
                x: state.boss.x,
                y: state.boss.y,
                vx: Math.cos(theta) * spd,
                vy: Math.sin(theta) * spd,
                radius: 4 + Math.random() * 5,
                color: i % 2 === 0 ? "#38bdf8" : "#facc15", // Cyan & Gold plasma
                life: 0,
                maxLife: 30,
                alpha: 1,
                text: i === 0 ? "⚡ OMNI-BEAM ORBITAL STRIKE!!! ⚡" : undefined
              });
            }
          }

          // Massive radial expanding bubble sparks! (Magenta blast wave)
          for (let angle = 0; angle < Math.PI * 2; angle += 0.08) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            state.particles.push({
              x: player.x,
              y: player.y,
              vx: cos * 11,
              vy: sin * 11,
              radius: 5 + Math.random() * 4,
              color: "#d946ef", // Vibrant Pink-Fuchsia
              life: 0,
              maxLife: 35,
              alpha: 1,
              text: angle === 0 ? "⚡ MECHA ULTIMATE BLAST!!! ⚡" : undefined
            });
          }

          // Outer golden electrical ring sparks
          for (let angle = 0; angle < Math.PI * 2; angle += 0.16) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            state.particles.push({
              x: player.x,
              y: player.y,
              vx: cos * 6,
              vy: sin * 6,
              radius: 3,
              color: "#eab308",
              life: 0,
              maxLife: 25,
              alpha: 0.9
            });
          }
        }
      }

      // 4. WEAPONS AUTO-FIRE LOGIC
      
      // -- range_attack Sector Sweep --
      if (weaponLevels["range_attack"] > 0) {
        const rate = isHigh ? 25 : 45;
        const lightAttackProfile = isHigh ? LIGHT_ATTACK_PROFILES.HIGH : LIGHT_ATTACK_PROFILES.LOW;
        if (state.ticks % rate === 0) {
          if (stage === "BOSSBATTLE" && state.companionSkills) {
            state.companionSkills["range_attack"] = 30;
          }
          let srcX = player.x;
          let srcY = player.y;
          const angle = dx === 0 && dy === 0
            ? Math.atan2(player.lastAimY, player.lastAimX)
            : Math.atan2(dy, dx);

          const fanSize = lightAttackProfile.fanSize;
          const dist = lightAttackProfile.range;
          const bonusDamageMult = stage === "BOSSBATTLE"
            ? 1 + (robotUpgrades.attack_power || 0) * 0.12 + (robotUpgrades.passive_skill || 0) * 0.05
            : 1 + (purchasedUpgrades.damage_boost || 0) * 0.15;
          const damage = (isHigh ? 45 : 18) * (1 + weaponLevels["range_attack"] * 0.15) * bonusDamageMult;

          // Purify enemies in sector
          state.enemies.forEach((enemy) => {
            const edx = enemy.x - srcX;
            const edy = enemy.y - srcY;
            const eDist = Math.hypot(edx, edy);
            if (eDist <= dist) {
              const eAngle = Math.atan2(edy, edx);
              let diff = Math.abs(eAngle - angle);
              if (diff > Math.PI) diff = Math.PI * 2 - diff;
              if (diff <= fanSize / 2) {
                enemy.hp -= damage;
                applyHitFeedback(state, enemy, triggerSound, {
                  strength: isHigh ? 2.2 : 1,
                  angle: eAngle,
                  color: "#ffffff",
                });
                // pushback
                const push = isHigh ? 35 : 12;
                if (enemy.isBossMinion && stage === "BOSSBATTLE") {
                  moveWithinBossArenaMask(enemy, Math.cos(eAngle) * push, Math.sin(eAngle) * push, enemy.radius, state.mapSize);
                } else {
                  moveWithinMissionMask(enemy, Math.cos(eAngle) * push, Math.sin(eAngle) * push, enemy.radius);
                }
                // sparks
                for (let i = 0; i < 3; i++) {
                  state.particles.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    radius: 2,
                    color: "#f97316",
                    life: 0,
                    maxLife: 15,
                    alpha: 1
                  });
                }
              }
            }
          });

          // If Boss Battle: Deal damage to boss too!
          if (state.boss && !state.boss.submerged) {
            const bdx = state.boss.x - srcX;
            const bdy = state.boss.y - srcY;
            const bDist = Math.hypot(bdx, bdy);
            if (bDist <= dist) {
              state.boss.hp -= damage * 0.5 * ((state.boss.defenseTimer || 0) > 0 ? bossBehavior.defenseDamageMultiplier : 1);
              setBossHp(Math.max(0, Math.ceil(state.boss.hp)));
              applyHitFeedback(state, state.boss, triggerSound, {
                strength: isHigh ? 2.8 : 1.4,
                angle: Math.atan2(bdy, bdx),
                color: "#ffffff",
                heavy: isHigh,
              });
            }
          }

          // sector particles
          for (let a = angle - fanSize/2; a <= angle + fanSize/2; a += 0.2) {
            state.particles.push({
              x: srcX,
              y: srcY,
              vx: Math.cos(a) * (isHigh ? 6 : 4),
              vy: Math.sin(a) * (isHigh ? 6 : 4),
              radius: isHigh ? 4 : 2,
                color: "rgba(255, 255, 255, 0.58)",
              life: 0,
              maxLife: isHigh ? 24 : 15,
              alpha: 0.8
            });
          }
        }
      }

      // -- laser_weapon Slim Beam Laser --
      if (weaponLevels["laser_weapon"] > 0) {
        const rate = isHigh ? 12 : 25;
        if (state.ticks % rate === 0) {
          if (stage === "BOSSBATTLE" && state.companionSkills) {
            state.companionSkills["laser_weapon"] = 25;
          }
          let srcX = player.x;
          let srcY = player.y;

          // Find closest target
          let target: { x: number; y: number } | null = null;
          if (stage === "BOSSBATTLE" && state.boss) {
            target = state.boss;
          } else if (state.enemies.length > 0) {
            let minDist = 9999;
            state.enemies.forEach((e) => {
              const d = Math.hypot(e.x - srcX, e.y - srcY);
              if (d < minDist) {
                minDist = d;
                target = e;
              }
            });
          }

          if (target) {
            const angle = Math.atan2(target.y - srcY, target.x - srcX);
            const bonusDamageMult = stage === "BOSSBATTLE"
              ? 1 + (robotUpgrades.attack_power || 0) * 0.12 + (robotUpgrades.passive_skill || 0) * 0.05
              : 1 + (purchasedUpgrades.damage_boost || 0) * 0.15;
            const bulletDamage = (isHigh ? 22 : 10) * (1 + weaponLevels["laser_weapon"] * 0.2) * bonusDamageMult;
            
            if (isHigh) {
              // 3-way spread lasers
              for (let i = -1; i <= 1; i++) {
                const a = angle + i * 0.25;
                state.bullets.push({
                  x: srcX,
                  y: srcY,
                  vx: Math.cos(a) * 8,
                  vy: Math.sin(a) * 8,
                  damage: bulletDamage,
                  radius: 5,
                  color: "#06b6d4"
                });
              }
            } else {
              // single beam bullet
              state.bullets.push({
                x: srcX,
                y: srcY,
                vx: Math.cos(angle) * 7,
                vy: Math.sin(angle) * 7,
                damage: bulletDamage,
                radius: 4,
                color: "#22d3ee"
              });
            }
          }
        }
      }

      // -- tracking_weapon Flexible Gooseneck Tracking --
      if (weaponLevels["tracking_weapon"] > 0) {
        // Periodically tick electrical laser connection links
        if (state.ticks % 10 === 0) {
          if (stage === "BOSSBATTLE" && state.companionSkills) {
            state.companionSkills["tracking_weapon"] = 15;
          }
          let srcX = player.x;
          let srcY = player.y;

          let targets: Array<{ x: number; y: number; hp: number }> = [];
          if (stage === "BOSSBATTLE" && state.boss) {
            targets = [state.boss];
          } else if (state.enemies.length > 0) {
            // Sort by distance and take up to (1 or 3)
            const count = isHigh ? 3 : 1;
            targets = [...state.enemies]
              .sort((a, b) => Math.hypot(a.x - srcX, a.y - srcY) - Math.hypot(b.x - srcX, b.y - srcY))
              .slice(0, count);
          }

          targets.forEach((t) => {
            const dist = Math.hypot(t.x - srcX, t.y - srcY);
            if (dist < (isHigh ? 240 : 130)) {
              const bonusDamageMult = stage === "BOSSBATTLE"
                ? 1 + (robotUpgrades.attack_power || 0) * 0.12 + (robotUpgrades.passive_skill || 0) * 0.05
                : 1 + (purchasedUpgrades.damage_boost || 0) * 0.15;
              const dmg = (isHigh ? 12 : 5) * (1 + weaponLevels["tracking_weapon"] * 0.25) * bonusDamageMult;
              t.hp -= dmg;
              applyHitFeedback(state, t as any, triggerSound, {
                strength: isHigh ? 1.4 : 0.7,
                angle: Math.atan2(t.y - srcY, t.x - srcX),
                color: "#a7f3d0",
              });
              if (stage === "BOSSBATTLE") {
                setBossHp(Math.max(0, Math.ceil(state.boss!.hp)));
              }
              // Spawn tracing laser beam bullet on canvas for render
              state.bullets.push({
                x: srcX,
                y: srcY,
                vx: 0,
                vy: 0,
                damage: 0,
                radius: 1,
                color: "rgba(16, 185, 129, 0.7)",
                isLaserBeam: true,
                laserEndX: t.x,
                laserEndY: t.y,
                maxLife: 6,
                life: 0
              });
            }
          });
        }
      }

      // -- C2-932 Work Ground Lamp Light Circles --
      if (weaponLevels["special_lighting"] > 0) {
        const rate = isHigh ? 80 : 140;
        if (state.ticks % rate === 0) {
          if (stage === "BOSSBATTLE" && state.companionSkills) {
            state.companionSkills["special_lighting"] = 40;
          }
          let srcX = player.x;
          let srcY = player.y;

          const zoneRadius = isHigh ? 110 : 60;
          const bonusDamageMult = stage === "BOSSBATTLE"
            ? 1 + (robotUpgrades.attack_power || 0) * 0.12 + (robotUpgrades.passive_skill || 0) * 0.05
            : 1 + (purchasedUpgrades.damage_boost || 0) * 0.15;
          const damage = (isHigh ? 3 : 1) * (1 + weaponLevels["special_lighting"] * 0.3) * bonusDamageMult;
          // Deploy behind/centered
          state.lightZones.push({
            x: srcX - dx * 40,
            y: srcY - dy * 40,
            radius: zoneRadius,
            damage: damage,
            duration: 0,
            maxDuration: isHigh ? 180 : 300,
            highMode: isHigh
          });
          triggerSound("click");
        }
      }

      // -- heavy_beam Heavy Precision Handheld Flashlight Beam --
      if (weaponLevels["heavy_beam"] > 0) {
        const rate = isHigh ? 35 : 60;
        if (state.ticks % rate === 0) {
          if (stage === "BOSSBATTLE" && state.companionSkills) {
            state.companionSkills["heavy_beam"] = 35;
          }
          let srcX = player.x;
          let srcY = player.y;

          // Find closest target
          let target: { x: number; y: number; hp: number } | null = null;
          if (stage === "BOSSBATTLE" && state.boss) {
            target = state.boss;
          } else if (state.enemies.length > 0) {
            let minDist = 9999;
            state.enemies.forEach((e) => {
              const d = Math.hypot(e.x - srcX, e.y - srcY);
              if (d < minDist) {
                minDist = d;
                target = e;
              }
            });
          }

          if (target) {
            const angle = Math.atan2(target.y - srcY, target.x - srcX);
            const bonusDamageMult = stage === "BOSSBATTLE"
              ? 1 + (robotUpgrades.attack_power || 0) * 0.12 + (robotUpgrades.passive_skill || 0) * 0.05
              : 1 + (purchasedUpgrades.damage_boost || 0) * 0.15;
            const dmg = (isHigh ? 65 : 30) * (1 + weaponLevels["heavy_beam"] * 0.3) * bonusDamageMult;
            
            // Deal damage
            target.hp -= dmg;
            applyHitFeedback(state, target as any, triggerSound, {
              strength: isHigh ? 4 : 2,
              angle,
              color: "#fb7185",
              heavy: isHigh,
            });
            if (stage === "BOSSBATTLE") {
              setBossHp(Math.max(0, Math.ceil(state.boss!.hp)));
            }

            // Spawn heavy laser ray on canvas for gorgeous visual feedback
            state.bullets.push({
              x: srcX,
              y: srcY,
              vx: 0,
              vy: 0,
              damage: 0,
              radius: isHigh ? 7 : 4,
              color: "#fb7185", // beautiful rose laser
              isLaserBeam: true,
              laserEndX: target.x,
              laserEndY: target.y,
              maxLife: 10,
              life: 0
            });

            // If High mode, deal area blast damage around target
            if (isHigh) {
              const blastRadius = 80;
              state.enemies.forEach((e) => {
                if (e !== target && Math.hypot(e.x - target!.x, e.y - target!.y) < blastRadius) {
                  e.hp -= dmg * 0.4;
                }
              });

              // Shockwave circle animation
              state.particles.push({
                x: target.x,
                y: target.y,
                vx: 0,
                vy: 0,
                radius: blastRadius,
                color: "rgba(251, 113, 133, 0.25)",
                life: 0,
                maxLife: 15,
                alpha: 0.6
              });
            }

            triggerSound("shoot");
          }
        }
      }

      // 5. UPDATE ENEMIES
      // Spawn enemies in survivors mode
      if (stage === "PLAYING") {
        state.spawnTimer++;
        const spawnLimit = 35 - Math.min(25, Math.floor(state.ticks / 150)); // speed up spawn rate over time
        if (state.spawnTimer >= spawnLimit && state.enemies.length < 90) {
          state.spawnTimer = 0;
          
          // Spawn near the edge of the visible area, but only on white mask pixels.
          const spawnDist = 480;
          const spawn = findWalkableSpawn(18, player, spawnDist);

          if (spawn) {
            const rand = Math.random();
            let type: EnemyType = "mote";
            let hpVal = 15 + selectedChapter * 12;
            let spd = 0.6 + Math.random() * 0.3; // Slower walking
            let radius = 10;
            let col = "rgba(168, 85, 247, 0.7)"; // purple blob

            if (rand > 0.8) {
              type = "clumper";
              hpVal = 50 + selectedChapter * 20;
              spd = 0.35; // Slower walking
              radius = 18;
              col = "rgba(107, 114, 128, 0.85)"; // heavy grey blob
            } else if (rand > 0.6) {
              type = "stalker";
              hpVal = 10 + selectedChapter * 8;
              spd = 1.1; // Slower walking
              radius = 8;
              col = "rgba(239, 68, 68, 0.8)"; // red shadow crawler
            }

            state.enemies.push({
              x: spawn.x,
              y: spawn.y,
              hp: hpVal,
              maxHp: hpVal,
              speed: spd,
              radius: radius,
              color: col,
              type: type,
              points: type === "clumper" ? 30 : type === "stalker" ? 20 : 10,
              facingLeft: spawn.x > player.x,
            });
          }
        }
      }

      // Update light zones on the ground
      state.lightZones = state.lightZones.filter((zone) => {
        zone.duration++;
        
        // Slower movement and continuous light-burn on monsters inside zones
        state.enemies.forEach((enemy) => {
          const d = Math.hypot(enemy.x - zone.x, enemy.y - zone.y);
          if (d <= zone.radius + enemy.radius) {
            enemy.hp -= zone.damage;
            if (state.ticks % 12 === 0) {
              applyHitFeedback(state, enemy, triggerSound, {
                strength: 0.5,
                angle: Math.atan2(enemy.y - zone.y, enemy.x - zone.x),
                color: "#fef3c7",
              });
            }
            // apply temporary speed debuff during this frame
            const pullStrength = zone.highMode ? 0.05 : 0.01;
            moveWithinMissionMask(
              enemy,
              -(enemy.x - zone.x) * pullStrength,
              -(enemy.y - zone.y) * pullStrength,
              enemy.radius,
            );
          }
        });

        // Slow down Boss if inside work lamp zone
        if (state.boss && !state.boss.submerged) {
          const d = Math.hypot(state.boss.x - zone.x, state.boss.y - zone.y);
          if (d <= zone.radius + state.boss.radius) {
            state.boss.hp -= zone.damage * 0.4 * ((state.boss.defenseTimer || 0) > 0 ? bossBehavior.defenseDamageMultiplier : 1);
            setBossHp(Math.max(0, Math.ceil(state.boss.hp)));
            if (state.ticks % 12 === 0) {
              applyHitFeedback(state, state.boss, triggerSound, {
                strength: 0.7,
                color: "#fef3c7",
              });
            }
          }
        }

        return zone.duration < zone.maxDuration;
      });

      // Update and move enemies
      state.enemies = state.enemies.filter((enemy) => {
        // Move towards player
        const dxToPlayer = player.x - enemy.x;
        const dyToPlayer = player.y - enemy.y;
        const d = Math.hypot(dxToPlayer, dyToPlayer);

        if (d > 0.1) {
          if (Math.abs(dxToPlayer) > 0.1) enemy.facingLeft = dxToPlayer < 0;
          if (enemy.isBossMinion && stage === "BOSSBATTLE") {
            moveWithinBossArenaMask(
              enemy,
              (dxToPlayer / d) * enemy.speed,
              (dyToPlayer / d) * enemy.speed,
              enemy.radius,
              state.mapSize,
            );
          } else {
            moveWithinMissionMask(
              enemy,
              (dxToPlayer / d) * enemy.speed,
              (dyToPlayer / d) * enemy.speed,
              enemy.radius,
            );
          }
        }

        // Deal contact damage to player
        if (d <= player.radius + enemy.radius && player.invincibleTime === 0) {
          recordAction("takeDamage");
          const contactDamage = enemy.isBossMinion
            ? enemy.bossMinionKind === "nut" ? 16 : 11
            : 1;
          const actualDamage = player.isShieldActive ? Math.ceil(contactDamage * 0.2) : contactDamage;
          player.hp = Math.max(0, (player.hp ?? 3) - actualDamage);
          setHp(player.hp);
          if (player.hp <= 0) {
            handleGameOver();
          }
          player.invincibleTime = 45; // invincible for 45 frames (~0.75s)
          triggerSound("hit");

          // Knockback player slightly
          if (enemy.isBossMinion && stage === "BOSSBATTLE") {
            moveWithinBossArenaMask(player, (dxToPlayer / d) * -24, (dyToPlayer / d) * -24, player.radius, state.mapSize);
          } else {
            moveWithinMissionMask(player, (dxToPlayer / d) * -15, (dyToPlayer / d) * -15, player.radius);
          }
        }

        // Check if enemy died
        if (enemy.hp <= 0) {
          if (enemy.isBossMinion) {
            recordAction("defeatBossSummon");
            applyDeathFeedback(state, enemy, triggerSound);
            setScore((scoreValue) => scoreValue + enemy.points);
            for (let i = 0; i < 12; i++) {
              const angle = (i / 12) * Math.PI * 2;
              spawnParticle(state, {
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * (1.5 + Math.random() * 3),
                vy: Math.sin(angle) * (1.5 + Math.random() * 3),
                radius: 2 + Math.random() * 2,
                color: i % 2 === 0 ? "#fbbf24" : "#cbd5e1",
                life: 0,
                maxLife: 20,
                alpha: 1,
                text: i === 0 ? "PARTS PURIFIED" : undefined,
              });
            }
            return false;
          }
          recordEnemyDefeated(enemy.type);
          applyDeathFeedback(state, enemy, triggerSound);
          state.enemyDeathEffects.push({
            x: enemy.x,
            y: enemy.y,
            radius: enemy.radius,
            type: enemy.type,
            facingLeft: enemy.facingLeft,
            life: 0,
            maxLife: 24,
          });

          // Spawn Exp crystals (gems) or battery
          setScore((s) => s + enemy.points);
          
          // 35% chance to drop a shiny gold coin
          if (Math.random() < 0.35) {
            const coinSpawn = findWalkableSpawn(6, enemy, 10) || enemy;
            state.collectibles.push({
              x: coinSpawn.x,
              y: coinSpawn.y,
              type: "coin",
              amount: Math.floor(Math.random() * 3) + 1,
              radius: 6,
              pulse: Math.random() * Math.PI
            });
          }

          const dropChance = Math.random();
          if (dropChance > 0.85) {
            // Drop battery
            state.collectibles.push({
              x: enemy.x,
              y: enemy.y,
              type: "battery",
              amount: 25,
              radius: 8,
              pulse: 0
            });
          } else {
            // Drop Exp gem
            state.collectibles.push({
              x: enemy.x,
              y: enemy.y,
              type: "gem",
              amount: 15 + selectedChapter * 3,
              radius: 5,
              pulse: 0
            });
          }

          // Modification materials are mission rewards only; they do not change the current loadout.
          if (Math.random() < 0.22) {
            const materialId = MATERIAL_IDS[Math.floor(Math.random() * MATERIAL_IDS.length)];
            const materialSpawn = findWalkableSpawn(10, enemy, 16) || enemy;
            state.collectibles.push({
              x: materialSpawn.x,
              y: materialSpawn.y,
              type: "material",
              amount: materialId === "rare_tech_chip" ? 1 : Math.floor(Math.random() * 2) + 1,
              materialType: materialId,
              radius: 10,
              pulse: 0
            });
          }

          // Sparks
          for (let i = 0; i < 6; i++) {
            state.particles.push({
              x: enemy.x,
              y: enemy.y,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              radius: 2 + Math.random() * 2,
              color: "rgba(168, 85, 247, 0.5)",
              life: 0,
              maxLife: 20,
              alpha: 1
            });
          }
          return false; // remove
        }

        return true;
      });

      state.enemyDeathEffects = state.enemyDeathEffects.filter((effect) => {
        effect.life += 1;
        return effect.life < effect.maxLife;
      });

      // 6. UPDATE BULLETS / LIGHT SHOTS
      state.bullets = state.bullets.filter((b) => {
        if (b.isLaserBeam) {
          b.life = (b.life || 0) + 1;
          return b.life < (b.maxLife || 5);
        }

        // Homing behavior for enemy tracking bullets
        if (b.isEnemy && b.isHoming) {
          b.life = (b.life || 0) + 1;
          const limit = b.maxLife || 180; // disappear after 3 seconds (~180 frames)
          if (b.life >= limit) {
            // Dissipate with pink particles
            for (let i = 0; i < 4; i++) {
              state.particles.push({
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: 2,
                color: b.color || "#ec4899",
                life: 0,
                maxLife: 12,
                alpha: 0.8
              });
            }
            return false; // remove from game loop
          }

          const dxToPlayer = player.x - b.x;
          const dyToPlayer = player.y - b.y;
          const distToPlayer = Math.hypot(dxToPlayer, dyToPlayer);
          if (distToPlayer > 1) {
            const targetVx = (dxToPlayer / distToPlayer) * 1.4; // Slower tracking
            const targetVy = (dyToPlayer / distToPlayer) * 1.4; // Slower tracking
            b.vx = b.vx * 0.94 + targetVx * 0.06;
            b.vy = b.vy * 0.94 + targetVy * 0.06;
          }
        }

        if (b.visual === "rock" || b.visual === "tool") {
          b.rotation = (b.rotation || 0) + (b.angularVelocity || 0.12);
        }

        b.x += b.vx;
        b.y += b.vy;

        const selectedRobot = robotSelectionRef.current;
        const c2932FieldActive =
          selectedRobot?.robotId === "c2_932" &&
          (robotUpgrades.energy_shield || 0) > 0 &&
          selectedRobot.fullyUnlocked &&
          c2932SkillRef.current.fieldEndsAt > Date.now();
        if (
          b.isEnemy &&
          c2932FieldActive &&
          Math.hypot(player.x - b.x, player.y - b.y) <= C2_932_FIELD_RADIUS + b.radius
        ) {
          for (let i = 0; i < 5; i++) {
            state.particles.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              radius: 2,
              color: "#67e8f9",
              life: 0,
              maxLife: 18,
              alpha: 1
            });
          }
          return false;
        }

        // Collision detection
        let hit = false;

        if (b.isEnemy) {
          // Collision with player
          const dToP = Math.hypot(player.x - b.x, player.y - b.y);
          if (dToP <= player.radius + b.radius && player.invincibleTime === 0) {
            const actualDamage = player.isShieldActive ? Math.ceil(b.damage * 0.2) : b.damage;
            recordAction("takeDamage");
            player.hp = Math.max(0, (player.hp ?? 3) - actualDamage);
            setHp(player.hp);
            if (player.hp <= 0) {
              handleGameOver();
            }
            player.invincibleTime = player.isShieldActive ? 15 : 40; // less recovery lock when shielded
            triggerSound(player.isShieldActive ? "click" : "hit");
            hit = true;

            // defensive force-field particles if shielded
            if (player.isShieldActive) {
              if (player.shieldDurability === undefined) player.shieldDurability = 4;
              player.shieldDurability--;
              setMechaShieldDurability(player.shieldDurability);

              if (player.shieldDurability <= 0) {
                player.shieldBrokenTimer = 90; // 1.5 seconds broken stagger
                player.isShieldActive = false;
                setMechaActiveShield(false);
                setMechaShieldBroken(true);
                triggerSound("explosion");
                state.screenShake = 15;

                // SHIELD BROKEN massive visual burst
                for (let i = 0; i < 25; i++) {
                  const theta = Math.random() * Math.PI * 2;
                  const spd = 3 + Math.random() * 5;
                  state.particles.push({
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(theta) * spd,
                    vy: Math.sin(theta) * spd,
                    radius: 3 + Math.random() * 3,
                    color: "#ef4444", // Red warning sparks
                    life: 0,
                    maxLife: 25,
                    alpha: 1,
                    text: i === 0 ? "⚡ SHIELD BROKEN! ⚡" : undefined
                  });
                }
              } else {
                // Standard shield impact sparks
                for (let i = 0; i < 15; i++) {
                  const theta = Math.random() * Math.PI * 2;
                  state.particles.push({
                    x: player.x + Math.cos(theta) * player.radius,
                    y: player.y + Math.sin(theta) * player.radius,
                    vx: Math.cos(theta) * 2.5,
                    vy: Math.sin(theta) * 2.5,
                    radius: 2,
                    color: "#06b6d4",
                    life: 0,
                    maxLife: 14,
                    alpha: 1
                  });
                }
              }
            }

            // impact sparks on player
            for (let i = 0; i < 6; i++) {
              state.particles.push({
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                radius: 2,
                color: "#ec4899",
                life: 0,
                maxLife: 15,
                alpha: 1
              });
            }
          }
        } else {
          // Collision with enemies
          state.enemies.forEach((enemy) => {
            if (!hit && Math.hypot(enemy.x - b.x, enemy.y - b.y) <= enemy.radius + b.radius) {
              enemy.hp -= b.damage;
              hit = true;
              applyHitFeedback(state, enemy, triggerSound, {
                strength: 1.2,
                angle: Math.atan2(b.vy, b.vx),
                color: b.color,
              });
              // impact sparks
              for (let i = 0; i < 3; i++) {
                state.particles.push({
                  x: b.x,
                  y: b.y,
                  vx: (Math.random() - 0.5) * 3,
                  vy: (Math.random() - 0.5) * 3,
                  radius: 2,
                  color: b.color,
                  life: 0,
                  maxLife: 10,
                  alpha: 1
                });
              }
            }
          });

          // Collision with Boss
          if (state.boss && !state.boss.submerged && !hit && Math.hypot(state.boss.x - b.x, state.boss.y - b.y) <= state.boss.radius + b.radius) {
            state.boss.hp -= b.damage * ((state.boss.defenseTimer || 0) > 0 ? bossBehavior.defenseDamageMultiplier : 1);
            setBossHp(Math.max(0, Math.ceil(state.boss.hp)));
            hit = true;
            applyHitFeedback(state, state.boss, triggerSound, {
              strength: Math.min(4, Math.max(1, b.damage / 20)),
              angle: Math.atan2(b.vy, b.vx),
              color: b.color,
              heavy: b.damage >= 60,
            });
            // sparks
            for (let i = 0; i < 4; i++) {
              state.particles.push({
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                radius: 2,
                color: b.color,
                life: 0,
                maxLife: 12,
                alpha: 1
              });
            }
            if (state.boss.hp <= 0) {
              handleVictory();
            }
          }
        }

        // Out of bounds
        if (b.x < 0 || b.x > state.mapSize.width || b.y < 0 || b.y > state.mapSize.height) {
          return false;
        }

        return !hit;
      });

      // 7. COLLECTIBLES & PLAYER EXP LEVELS
      state.collectibles = state.collectibles.filter((col) => {
        col.pulse += 0.05;
        const dist = Math.hypot(col.x - player.x, col.y - player.y);

        // Magentic pull to player when reasonably close
        if (dist <= 120) {
          const dxToP = player.x - col.x;
          const dyToP = player.y - col.y;
          col.x += (dxToP / dist) * 4;
          col.y += (dyToP / dist) * 4;
        }

        if (dist <= player.radius + col.radius + 5) {
          // Collected!
          if (col.type === "battery") {
            recordAction("collectBattery");
            const maxBatLimit = getPlayerMaxBattery();
            const chargeEfficiency = selectedAgent.id === "claire" ? 1.3 : 1.0;
            player.batteryVal = Math.min(maxBatLimit, player.batteryVal + col.amount * chargeEfficiency);
            const nextBatPercent = Math.ceil((player.batteryVal / maxBatLimit) * 100);
            if (state.lastBatteryPercent !== nextBatPercent) {
              state.lastBatteryPercent = nextBatPercent;
              setBatteryPercent(nextBatPercent);
            }
            applyCollectFeedback(state, col.x, col.y, "battery", triggerSound);
            // restore sparks
            for (let i = 0; i < 5; i++) {
              state.particles.push({
                x: col.x,
                y: col.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                radius: 2,
                color: "#10b981",
                life: 0,
                maxLife: 15,
                alpha: 1
              });
            }
          } else if (col.type === "gem") {
            const p = player as any;
            p.exp = (p.exp ?? 0) + col.amount;
            const currentExpNeeded = p.expNeeded ?? 100;
            if (p.exp >= currentExpNeeded) {
              p.level = (p.level ?? 1) + 1;
              p.exp = p.exp - currentExpNeeded;
              p.expNeeded = Math.floor(currentExpNeeded * 1.3);
              
              setLevel(p.level);
              setExp(p.exp);
              setExpNeeded(p.expNeeded);
              triggerLevelUpUpgrade(weaponLevels);
            } else {
              setExp(p.exp);
            }
            applyCollectFeedback(state, col.x, col.y, "experience", triggerSound);
          } else if (col.type === "material") {
            const materialId = (col.materialType || "metal_material") as MaterialId;
            recordAction("collectMaterial", col.amount);
            setCollectedMaterials((previous) => ({
              ...previous,
              [materialId]: previous[materialId] + col.amount
            }));
            applyCollectFeedback(
              state,
              col.x,
              col.y,
              "material",
              triggerSound,
              { x: state.camera.x + canvas.width - 38, y: state.camera.y + 28 },
            );
            for (let i = 0; i < 15; i++) {
              state.particles.push({
                x: col.x,
                y: col.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                radius: 3,
                color: MATERIAL_CONFIG[materialId].color,
                life: 0,
                maxLife: 25,
                alpha: 1,
                text: i === 0 ? MATERIAL_CONFIG[materialId].name : undefined
              });
            }
          } else if (col.type === "coin") {
            const coinAmount = col.amount || 1;
            recordAction("collectCoin", coinAmount);
            setSessionCoins((prev) => prev + coinAmount);
            applyCollectFeedback(
              state,
              col.x,
              col.y,
              "coin",
              triggerSound,
              { x: state.camera.x + canvas.width - 38, y: state.camera.y + 28 },
            );
            
            // Golden circular burst sparks
            for (let i = 0; i < 8; i++) {
              state.particles.push({
                x: col.x,
                y: col.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3 - 1.2,
                radius: 1.5 + Math.random() * 1.5,
                color: "#fbbf24",
                life: 0,
                maxLife: 20,
                alpha: 1
              });
            }

            // Rising floating text showing coin count collected!
            state.particles.push({
              x: col.x,
              y: col.y - 8,
              vx: (Math.random() - 0.5) * 0.8,
              vy: -1.4, // float upwards
              radius: 0,
              color: "#fbbf24",
              life: 0,
              maxLife: 45,
              alpha: 1,
              text: `+${coinAmount} 🪙`
            });
          }
          return false; // remove from list
        }
        return true;
      });

      // 8. UPDATE PARTICLES
      const hardParticleLimit = isMobileDevice ? 48 : 128;
      if (state.particles.length > hardParticleLimit) {
        state.particles = state.particles.slice(-hardParticleLimit);
      }
      state.particles = state.particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;
        return p.life < p.maxLife;
      });

      // 9. UPDATE BOSS LOGIC (For Boss Battle Stage)
      if (stage === "BOSSBATTLE" && state.boss) {
        const boss = state.boss;

        if ((boss.airRaidTimer || 0) <= 0 && (boss.airRaidReturnTimer || 0) <= 0 && !isBossArenaPositionWalkable(boss.x, boss.y, boss.radius, state.mapSize)) {
          const correctedSpawn = findNearestBossArenaSpawn(boss, boss.radius, state.mapSize);
          boss.x = correctedSpawn.x;
          boss.y = correctedSpawn.y;
        }

        if (boss.stunTimer === undefined) boss.stunTimer = 0;
        if (boss.visualTimer === undefined) boss.visualTimer = 0;
        if (boss.visualTimer > 0) boss.visualTimer--;
        if (boss.defenseTimer === undefined) boss.defenseTimer = 0;
        if (boss.defenseTimer > 0) boss.defenseTimer--;

        // METSTRADE aquatic attacks are timed independently from the standard
        // projectile patterns so their warning, impact, and recovery stay readable.
        if (boss.diveTimer === undefined) boss.diveTimer = 0;
        if (boss.tentacleTimer === undefined) boss.tentacleTimer = 0;
        if (boss.chainDashRemaining === undefined) boss.chainDashRemaining = 0;
        if (boss.roarTimer === undefined) boss.roarTimer = 0;
        if (boss.summonTimer === undefined) boss.summonTimer = 0;
        if (boss.airRaidTimer === undefined) boss.airRaidTimer = 0;
        if (boss.airRaidReturnTimer === undefined) boss.airRaidReturnTimer = 0;
        if (boss.laserAttackTimer === undefined) boss.laserAttackTimer = 0;
        if (boss.strafeTimer === undefined) boss.strafeTimer = 0;
        if (!Array.isArray(state.bombingZones)) state.bombingZones = [];

        // AUTOMECHANIKA bombing zones remain visible after the aircraft exits.
        // Their timers are deliberately staggered so the player can read and
        // escape each marked impact instead of taking unavoidable burst damage.
        state.bombingZones = state.bombingZones.filter((zone: BombingZone) => {
          zone.timer--;
          if (zone.timer === 0) {
            state.screenShake = 15;
            triggerSound("bossImpact");
            for (let i = 0; i < 22; i++) {
              const angle = (i / 22) * Math.PI * 2;
              const speed = 2.5 + Math.random() * 5.5;
              spawnParticle(state, {
                x: zone.x + (Math.random() - 0.5) * zone.radius * 0.45,
                y: zone.y + (Math.random() - 0.5) * zone.radius * 0.45,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 5,
                color: i % 3 === 0 ? "#fef3c7" : i % 2 === 0 ? "#f97316" : "#ef4444",
                life: 0,
                maxLife: 25,
                alpha: 1,
                text: i === 0 ? "💥 MISSILE IMPACT 💥" : undefined,
              });
            }
            const impactDistance = Math.hypot(player.x - zone.x, player.y - zone.y);
            if (impactDistance <= zone.radius + player.radius && player.invincibleTime === 0) {
              const actualDamage = player.isShieldActive ? Math.ceil(28 * 0.2) : 28;
              recordAction("takeDamage");
              player.hp = Math.max(0, (player.hp ?? 100) - actualDamage);
              setHp(player.hp);
              player.invincibleTime = player.isShieldActive ? 20 : 54;
              if (player.hp <= 0) handleGameOver();
            }
          }
          return zone.timer > -18;
        });

        if (boss.airRaidTimer > 0) {
          boss.airRaidTimer--;
          boss.attackCooldown = 0;
          boss.visualTimer = Math.max(boss.visualTimer || 0, boss.airRaidTimer);
          const flightEndsAt = 92;
          if (boss.airRaidTimer > flightEndsAt) {
            const progress = Math.min(1, (150 - boss.airRaidTimer) / (150 - flightEndsAt));
            boss.x = (boss.airRaidStartX ?? -boss.radius * 2)
              + ((boss.airRaidEndX ?? state.mapSize.width + boss.radius * 2) - (boss.airRaidStartX ?? -boss.radius * 2)) * progress;
            boss.y = (boss.airRaidY ?? state.mapSize.height * 0.25) + Math.sin(progress * Math.PI * 3) * 18;
            boss.submerged = false;
          } else {
            boss.submerged = true;
          }
          if (boss.airRaidTimer === 0) {
            const returnPoint = findNearestBossArenaSpawn(
              { x: state.mapSize.width * 0.5, y: state.mapSize.height * 0.2 },
              boss.radius,
              state.mapSize,
            );
            boss.x = returnPoint.x;
            boss.y = -boss.radius * 1.8;
            boss.airRaidReturnY = returnPoint.y;
            boss.airRaidReturnTimer = 58;
            boss.submerged = false;
            boss.currentPattern = 0;
            boss.visualTimer = 0;
          }
        }

        if (boss.airRaidReturnTimer > 0) {
          boss.airRaidReturnTimer--;
          boss.attackCooldown = 0;
          boss.submerged = false;
          boss.currentPattern = 0;
          boss.visualTimer = 0;
          const progress = 1 - boss.airRaidReturnTimer / 58;
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          const targetY = boss.airRaidReturnY ?? state.mapSize.height * 0.2;
          boss.x = state.mapSize.width * 0.5 + Math.sin(progress * Math.PI * 2) * 14;
          boss.y = -boss.radius * 1.8 + (targetY + boss.radius * 1.8) * easedProgress;
          if (boss.airRaidReturnTimer === 0) {
            boss.x = state.mapSize.width * 0.5;
            boss.y = targetY;
            boss.vx = bossBehavior.moveSpeed * (boss.facingX || -1);
            boss.vy = 0;
            triggerSound("power");
          }
        }

        if (boss.laserAttackTimer > 0) {
          boss.laserAttackTimer--;
          boss.attackCooldown = 0;
          boss.visualTimer = Math.max(boss.visualTimer || 0, boss.laserAttackTimer);
          if (boss.laserAttackTimer > 32) {
            boss.laserTargetX = player.x;
            boss.laserTargetY = player.y;
            boss.facingX = Math.sign(player.x - boss.x) || boss.facingX || 1;
          }
          if (boss.laserAttackTimer === 28) {
            const targetX = boss.laserTargetX ?? player.x;
            const targetY = boss.laserTargetY ?? player.y;
            const beamDx = targetX - boss.x;
            const beamDy = targetY - boss.y;
            const beamLengthSq = Math.max(1, beamDx * beamDx + beamDy * beamDy);
            const projection = Math.max(0, Math.min(1, ((player.x - boss.x) * beamDx + (player.y - boss.y) * beamDy) / beamLengthSq));
            const closestX = boss.x + beamDx * projection;
            const closestY = boss.y + beamDy * projection;
            if (Math.hypot(player.x - closestX, player.y - closestY) <= player.radius + 24 && player.invincibleTime === 0) {
              const actualDamage = player.isShieldActive ? Math.ceil(32 * 0.2) : 32;
              recordAction("takeDamage");
              player.hp = Math.max(0, (player.hp ?? 100) - actualDamage);
              setHp(player.hp);
              player.invincibleTime = player.isShieldActive ? 20 : 58;
              if (player.hp <= 0) handleGameOver();
            }
            state.screenShake = 17;
            triggerSound("bossImpact");
          }
        }

        if (boss.strafeTimer > 0) {
          boss.strafeTimer--;
          boss.attackCooldown = 0;
          boss.visualTimer = Math.max(boss.visualTimer || 0, boss.strafeTimer);
          if (boss.strafeTimer >= 18 && boss.strafeTimer % 8 === 0) {
            const aimAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
            boss.facingX = Math.sign(player.x - boss.x) || boss.facingX || 1;
            triggerSound("shoot");
            for (let lane = -1; lane <= 1; lane++) {
              const angle = aimAngle + lane * 0.11;
              state.bullets.push({
                x: boss.x + Math.cos(angle) * boss.radius * 0.55,
                y: boss.y + Math.sin(angle) * boss.radius * 0.55,
                vx: Math.cos(angle) * 5.4,
                vy: Math.sin(angle) * 5.4,
                damage: 10,
                radius: 5,
                color: lane === 0 ? "#fef3c7" : "#fb923c",
                isEnemy: true,
              });
            }
          }
        }

        if (boss.summonTimer > 0) {
          boss.summonTimer--;
          boss.attackCooldown = 0;
          boss.visualTimer = Math.max(boss.visualTimer || 0, boss.summonTimer);

          if (boss.summonTimer === 22) {
            const currentSummons = state.enemies.filter((enemy: EnemyEntity) => enemy.isBossMinion).length;
            const summonCount = Math.max(0, Math.min(5, 8 - currentSummons));
            const kinds: Array<"bolt" | "nut" | "wrench"> = ["bolt", "nut", "wrench"];
            triggerSound("bossImpact");
            state.screenShake = 9;

            for (let i = 0; i < summonCount; i++) {
              const angle = (i / Math.max(1, summonCount)) * Math.PI * 2 + state.ticks * 0.02;
              const spawn = findNearestBossArenaSpawn(
                { x: boss.x + Math.cos(angle) * 105, y: boss.y + Math.sin(angle) * 105 },
                16,
                state.mapSize,
              );
              const kind = kinds[i % kinds.length];
              const hpValue = kind === "nut" ? 135 : kind === "wrench" ? 105 : 85;
              state.enemies.push({
                x: spawn.x,
                y: spawn.y,
                hp: hpValue,
                maxHp: hpValue,
                speed: kind === "bolt" ? 1.45 : kind === "wrench" ? 1.15 : 0.82,
                radius: kind === "nut" ? 18 : 14,
                color: kind === "bolt" ? "#94a3b8" : kind === "nut" ? "#f59e0b" : "#38bdf8",
                type: kind === "nut" ? "clumper" : kind === "wrench" ? "stalker" : "mote",
                points: 35,
                facingLeft: player.x < spawn.x,
                isBossMinion: true,
                bossMinionKind: kind,
              });
            }
          }
        }

        if (boss.diveTimer > 0) {
          boss.diveTimer--;
          boss.attackCooldown = 0;
          boss.visualTimer = Math.max(boss.visualTimer || 0, boss.diveTimer);

          if (boss.diveTimer === 38) {
            boss.diveTargetX = player.x;
            boss.diveTargetY = player.y;
          }

          if (boss.diveTimer === 1) {
            const surfacePoint = findNearestBossArenaSpawn(
              { x: boss.diveTargetX ?? player.x, y: boss.diveTargetY ?? player.y },
              boss.radius,
              state.mapSize,
            );
            boss.x = surfacePoint.x;
            boss.y = surfacePoint.y;
            boss.vx = bossBehavior.moveSpeed;
            boss.vy = 0;
            boss.submerged = false;
            boss.visualTimer = 28;
            state.screenShake = 18;
            triggerSound("bossImpact");

            for (let i = 0; i < 28; i++) {
              const angle = (i / 28) * Math.PI * 2;
              const speed = 2.5 + Math.random() * 5;
              spawnParticle(state, {
                x: boss.x + Math.cos(angle) * boss.radius * 0.35,
                y: boss.y + Math.sin(angle) * boss.radius * 0.35,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 2 + Math.random() * 4,
                color: i % 2 === 0 ? "#22d3ee" : "#0e7490",
                life: 0,
                maxLife: 24,
                alpha: 1,
                text: i === 0 ? "🌊 DIVE AMBUSH! 🌊" : undefined
              });
            }

            const ambushDistance = Math.hypot(player.x - boss.x, player.y - boss.y);
            if (ambushDistance <= boss.radius + 64 && player.invincibleTime === 0) {
              const actualDamage = player.isShieldActive ? Math.ceil(34 * 0.2) : 34;
              recordAction("takeDamage");
              player.hp = Math.max(0, (player.hp ?? 100) - actualDamage);
              setHp(player.hp);
              player.invincibleTime = player.isShieldActive ? 20 : 58;
              if (player.hp <= 0) handleGameOver();
            }
          }
        }

        if (boss.tentacleTimer > 0) {
          boss.tentacleTimer--;
          boss.attackCooldown = 0;
          boss.visualTimer = Math.max(boss.visualTimer || 0, boss.tentacleTimer);

          if (boss.tentacleTimer === 24) {
            const strikeX = boss.tentacleTargetX ?? player.x;
            const strikeY = boss.tentacleTargetY ?? player.y;
            state.screenShake = 13;
            triggerSound("bossImpact");

            for (let i = 0; i < 24; i++) {
              const angle = (i / 24) * Math.PI * 2;
              const distance = 28 + Math.random() * 82;
              spawnParticle(state, {
                x: strikeX + Math.cos(angle) * distance,
                y: strikeY + Math.sin(angle) * distance,
                vx: -Math.cos(angle) * (1.2 + Math.random() * 2),
                vy: -Math.sin(angle) * (1.2 + Math.random() * 2),
                radius: 3 + Math.random() * 4,
                color: i % 2 === 0 ? "#c026d3" : "#7e22ce",
                life: 0,
                maxLife: 28,
                alpha: 1,
                text: i === 0 ? "🐙 TENTACLE FIELD! 🐙" : undefined
              });
            }

            const tentacleDistance = Math.hypot(player.x - strikeX, player.y - strikeY);
            if (tentacleDistance <= 118 + player.radius && player.invincibleTime === 0) {
              const actualDamage = player.isShieldActive ? Math.ceil(26 * 0.2) : 26;
              recordAction("takeDamage");
              player.hp = Math.max(0, (player.hp ?? 100) - actualDamage);
              setHp(player.hp);
              player.invincibleTime = player.isShieldActive ? 20 : 52;
              if (player.hp <= 0) handleGameOver();
            }
          }
        }

        if (boss.roarTimer > 0) {
          boss.roarTimer--;
          boss.attackCooldown = 0;
          boss.visualTimer = Math.max(boss.visualTimer || 0, boss.roarTimer);

          if (boss.roarTimer === 18) {
            const roarX = boss.roarX ?? boss.x;
            const roarY = boss.roarY ?? boss.y;
            state.screenShake = 16;
            triggerSound("bossImpact");

            for (let i = 0; i < 30; i++) {
              const angle = (i / 30) * Math.PI * 2;
              const speed = 3 + Math.random() * 5;
              spawnParticle(state, {
                x: roarX + Math.cos(angle) * 26,
                y: roarY + Math.sin(angle) * 26,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 3,
                color: i % 2 === 0 ? "#fb7185" : "#f59e0b",
                life: 0,
                maxLife: 24,
                alpha: 1,
                text: i === 0 ? "🦁 IMPACT ROAR! 🦁" : undefined
              });
            }

            const dxFromRoar = player.x - roarX;
            const dyFromRoar = player.y - roarY;
            const distanceFromRoar = Math.max(1, Math.hypot(dxFromRoar, dyFromRoar));
            if (distanceFromRoar <= 220 + player.radius && player.invincibleTime === 0) {
              const actualDamage = player.isShieldActive ? Math.ceil(18 * 0.2) : 18;
              recordAction("takeDamage");
              player.hp = Math.max(0, (player.hp ?? 100) - actualDamage);
              setHp(player.hp);
              moveWithinBossArenaMask(
                player,
                (dxFromRoar / distanceFromRoar) * 145,
                (dyFromRoar / distanceFromRoar) * 145,
                player.radius,
                state.mapSize,
              );
              player.invincibleTime = player.isShieldActive ? 20 : 48;
              if (player.hp <= 0) handleGameOver();
            }
          }
        }

        if (
          bossBehavior.usesChainDash
          && boss.dashTimer === 0
          && boss.chainDashRemaining > 0
          && boss.roarTimer <= 0
        ) {
          const dashNumber = 4 - boss.chainDashRemaining;
          boss.chainDashRemaining--;
          boss.dashTimer = bossBehavior.dashExecutionThreshold + 14;
          boss.visualTimer = boss.dashTimer;
          triggerSound("power");
          state.particles.push({
            x: boss.x,
            y: boss.y - boss.radius - 10,
            vx: 0,
            vy: -1,
            radius: 1,
            color: "#fb7185",
            life: 0,
            maxLife: 26,
            alpha: 1,
            text: `⚡ CHAIN DASH ${dashNumber}/3 ⚡`
          });
        }
        
        const isStunnedNow = boss.stunTimer > 0;
        if (state.lastBossStunActive !== isStunnedNow) {
          state.lastBossStunActive = isStunnedNow;
          setBossStunActive(isStunnedNow);
        }

        if (boss.stunTimer > 0) {
          boss.stunTimer--;

          // Swirling dizzy stars around the boss
          if (state.ticks % 3 === 0) {
            const angle = (state.ticks * 0.18) + (Math.PI * 0.5) * Math.sin(state.ticks * 0.05);
            spawnParticle(state, {
              x: boss.x + Math.cos(angle) * (boss.radius + 12),
              y: boss.y + Math.sin(angle) * (boss.radius + 12) - 10,
              vx: 0,
              vy: -0.4,
              radius: 3,
              color: "#eab308", // Yellow stars
              life: 0,
              maxLife: 15,
              alpha: 1
            });
          }
        } else {

        // Check if boss is currently in dash mode
        if (boss.submerged) {
          boss.vx = 0;
          boss.vy = 0;
        } else if (boss.airRaidReturnTimer > 0 || boss.laserAttackTimer > 0 || boss.strafeTimer > 0) {
          boss.vx = 0;
          boss.vy = 0;
        } else if (boss.roarTimer > 0) {
          boss.vx = 0;
          boss.vy = 0;
        } else if (boss.dashTimer && boss.dashTimer > 0) {
          boss.dashTimer--;
          
          if (boss.dashTimer > bossBehavior.dashExecutionThreshold) {
            // Dash preparation (charging up, shaking)
            // Gently orient dash velocity towards player
            const dxToP = player.x - boss.x;
            const dyToP = player.y - boss.y;
            const d = Math.hypot(dxToP, dyToP);
            if (d > 0.1) {
              boss.dashVx = (dxToP / d) * bossBehavior.dashSpeed;
              boss.dashVy = (dyToP / d) * bossBehavior.dashSpeed;
            }

            // Spawn bright charging particles towards boss center
            if (state.ticks % 2 === 0) {
              const theta = Math.random() * Math.PI * 2;
              const dist = 60 + Math.random() * 40;
              spawnParticle(state, {
                x: boss.x + Math.cos(theta) * dist,
                y: boss.y + Math.sin(theta) * dist,
                vx: -Math.cos(theta) * 3,
                vy: -Math.sin(theta) * 3,
                radius: 2,
                color: bossBehavior.usesRockProjectiles ? "#d6a35d" : "#f43f5e",
                life: 0,
                maxLife: 20,
                alpha: 1
              });
            }
          } else {
            // Executing Dash
            const dashMovement = moveWithinBossArenaMask(
              boss,
              boss.dashVx || 0,
              boss.dashVy || 0,
              boss.radius,
              state.mapSize,
            );
            if (!dashMovement.movedX) boss.dashVx = -(boss.dashVx || 0);
            if (!dashMovement.movedY) boss.dashVy = -(boss.dashVy || 0);

            // Spawn dark trailing sparks
            spawnParticle(state, {
              x: boss.x + (Math.random() - 0.5) * 15,
              y: boss.y + (Math.random() - 0.5) * 15,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5,
              radius: 3,
              color: bossBehavior.usesRockProjectiles ? "#78716c" : "#a855f7",
              life: 0,
              maxLife: 15,
              alpha: 0.8
            });

            // Keep boss in screen bounds during dash
            if (boss.x <= boss.radius || boss.x >= state.mapSize.width - boss.radius) {
              boss.dashVx = -(boss.dashVx || 0);
            }
            if (boss.y <= boss.radius || boss.y >= state.mapSize.height - boss.radius) {
              boss.dashVy = -(boss.dashVy || 0);
            }
          }
        } else {
          if (bossBehavior.prefersMelee) {
            // BAUMA closes the gap like a heavy mining machine instead of hovering at range.
            const dxToPlayer = player.x - boss.x;
            const dyToPlayer = player.y - boss.y;
            const distanceToPlayer = Math.max(1, Math.hypot(dxToPlayer, dyToPlayer));
            const shouldAdvance = distanceToPlayer > bossBehavior.meleeStopDistance;
            const movementScale = shouldAdvance ? bossBehavior.moveSpeed : bossBehavior.moveSpeed * 0.22;
            const bossMovement = moveWithinBossArenaMask(
              boss,
              (dxToPlayer / distanceToPlayer) * movementScale,
              (dyToPlayer / distanceToPlayer) * movementScale,
              boss.radius,
              state.mapSize,
            );
            if (!bossMovement.movedX || !bossMovement.movedY) boss.vx *= -1;
          } else {
            // Default bosses hover and drift through the upper half of the arena.
            if (boss.targetY === undefined) boss.targetY = 130;
            const dy = boss.targetY - boss.y;
            let driftY = boss.vy;
            if (Math.abs(dy) > 2) {
              driftY += Math.sign(dy) * 0.45;
            } else {
              boss.targetY = 80 + Math.random() * (state.mapSize.height * 0.35);
            }

            const bossMovement = moveWithinBossArenaMask(
              boss,
              boss.vx,
              driftY,
              boss.radius,
              state.mapSize,
            );
            if (!bossMovement.movedX) boss.vx *= -1;
            if (!bossMovement.movedY) boss.targetY = 80 + Math.random() * (state.mapSize.height * 0.35);
          }
        }

        // Keep boss within overall screen bounds
        if (boss.airRaidTimer <= 0 && boss.airRaidReturnTimer <= 0) {
          boss.x = Math.max(boss.radius, Math.min(state.mapSize.width - boss.radius, boss.x));
          boss.y = Math.max(boss.radius, Math.min(state.mapSize.height - boss.radius, boss.y));
        }

        // Active Attack timer
        const bossSpecialBusy = boss.submerged
          || boss.tentacleTimer > 0
          || boss.roarTimer > 0
          || boss.summonTimer > 0
          || boss.airRaidTimer > 0
          || boss.airRaidReturnTimer > 0
          || boss.laserAttackTimer > 0
          || boss.strafeTimer > 0
          || state.bombingZones.length > 0
          || (boss.dashTimer || 0) > 0
          || boss.chainDashRemaining > 0;
        if (!bossSpecialBusy) boss.attackCooldown++;
        if (!bossSpecialBusy && boss.attackCooldown >= bossBehavior.attackInterval) {
          boss.attackCooldown = 0;
          
          // Randomly select 1 of 4 powerful attack patterns
          const pattern = bossBehavior.attackPatternWeights[
            Math.floor(Math.random() * bossBehavior.attackPatternWeights.length)
          ];
          boss.currentPattern = pattern;
          boss.visualTimer = 48;
          
          if (pattern === 0 && bossBehavior.defenseDuration > 0) {
            // BAUMA deploys mining armor: highly visible and strongly damage resistant.
            triggerSound("power");
            boss.defenseTimer = bossBehavior.defenseDuration;
            boss.visualTimer = bossBehavior.defenseDuration;
            state.screenShake = 7;
            state.particles.push({
              x: boss.x,
              y: boss.y - boss.radius - 10,
              vx: 0,
              vy: -1,
              radius: 1,
              color: "#fbbf24",
              life: 0,
              maxLife: 55,
              alpha: 1,
              text: "⛏️ MINING ARMOR // DAMAGE -65% ⛏️"
            });
            for (let i = 0; i < 22; i++) {
              const angle = (i / 22) * Math.PI * 2;
              state.particles.push({
                x: boss.x + Math.cos(angle) * (boss.radius + 8),
                y: boss.y + Math.sin(angle) * (boss.radius + 8),
                vx: Math.cos(angle) * 0.8,
                vy: Math.sin(angle) * 0.8,
                radius: 3 + Math.random() * 2,
                color: i % 2 === 0 ? "#f59e0b" : "#a8a29e",
                life: 0,
                maxLife: 28,
                alpha: 1
              });
            }
          } else if (pattern === 0) {
            // Pattern 0: Radial Dark Shadow Blast (12 projectiles outwards)
            triggerSound("hit");
            state.screenShake = 8;

            // Spawn action text particle
            state.particles.push({
              x: boss.x,
              y: boss.y - boss.radius - 10,
              vx: 0,
              vy: -1,
              radius: 1,
              color: "#a855f7",
              life: 0,
              maxLife: 40,
              alpha: 1,
              text: "🔥 RADIAL SHADOW BLAST! 🔥"
            });

            // Extra blast ring particles
            for (let i = 0; i < 18; i++) {
              const angle = (Math.PI / 9) * i;
              state.particles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angle) * 4.5,
                vy: Math.sin(angle) * 4.5,
                radius: 3 + Math.random() * 2,
                color: "rgba(168, 85, 247, 0.6)",
                life: 0,
                maxLife: 20,
                alpha: 1
              });
            }

            for (let i = 0; i < 12; i++) {
              const angle = (Math.PI / 6) * i;
              state.bullets.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angle) * 2.2, // Slower bullet
                vy: Math.sin(angle) * 2.2, // Slower bullet
                damage: 15,
                radius: 8,
                color: "#a855f7", // Purple dark bullet
                isEnemy: true
              });
            }
          } else if (pattern === 1) {
            // Pattern 1: Targeted Narrow Spread (3 high-speed yellow shadow bolts)
            triggerSound("shoot");
            state.screenShake = 5;

            // Spawn action text particle
            state.particles.push({
              x: boss.x,
              y: boss.y - boss.radius - 10,
              vx: 0,
              vy: -1,
              radius: 1,
              color: bossBehavior.usesRockProjectiles ? "#d6a35d" : "#fbbf24",
              life: 0,
              maxLife: 40,
              alpha: 1,
              text: bossBehavior.usesRockProjectiles ? "🪨 TRIPLE BOULDER THROW! 🪨" : "⚡ TRIPLE TARGETED NOVA! ⚡"
            });

            const dx = player.x - boss.x;
            const dy = player.y - boss.y;
            const d = Math.hypot(dx, dy);
            if (d > 0.1) {
              const baseAngle = Math.atan2(dy, dx);
              for (let offset = -0.15; offset <= 0.15; offset += 0.15) {
                const angle = baseAngle + offset;
                state.bullets.push({
                  x: boss.x,
                  y: boss.y,
                  vx: Math.cos(angle) * 3.0, // Slower bullet
                  vy: Math.sin(angle) * 3.0, // Slower bullet
                  damage: bossBehavior.usesRockProjectiles ? 22 : 18,
                  radius: bossBehavior.usesRockProjectiles ? 13 : 7,
                  color: bossBehavior.usesRockProjectiles ? "#78716c" : "#eab308",
                  isEnemy: true,
                  visual: bossBehavior.usesRockProjectiles ? "rock" : undefined,
                  rotation: Math.random() * Math.PI * 2,
                  angularVelocity: (Math.random() - 0.5) * 0.22
                });
              }
            }
          } else if (pattern === 2) {
            // Pattern 2: Heavy Charging Dash Attack
            triggerSound("power");
            state.screenShake = 12; // Shake immediately to announce the doom dash!
            boss.dashTimer = bossBehavior.dashTimer;
            boss.chainDashRemaining = bossBehavior.usesChainDash ? 2 : 0;

            // Spawn action text particle
            state.particles.push({
              x: boss.x,
              y: boss.y - boss.radius - 10,
              vx: 0,
              vy: -1.2,
              radius: 1,
              color: "#ef4444",
              life: 0,
              maxLife: 45,
              alpha: 1,
              text: bossBehavior.usesRockProjectiles
                ? "🚨 LONG-RANGE EXCAVATOR CHARGE!!! 🚨"
                : bossBehavior.usesChainDash
                  ? "🚨 TRIPLE CHAIN DASH INCOMING!!! 🚨"
                : "🚨 MECHA-CRUSH DASH CHARGE!!! 🚨"
            });
          } else if (pattern === 3) {
            // Pattern 3: Homing Pink Shadow Fireflies (4 slow tracking seekers)
            triggerSound("power");
            state.screenShake = 6;

            // Spawn action text particle
            state.particles.push({
              x: boss.x,
              y: boss.y - boss.radius - 10,
              vx: 0,
              vy: -1,
              radius: 1,
              color: bossBehavior.usesRockProjectiles ? "#a8a29e" : "#ec4899",
              life: 0,
              maxLife: 40,
              alpha: 1,
              text: bossBehavior.usesRockProjectiles ? "🪨 MAGNETIC ORE BARRAGE! 🪨" : "👾 HOMING BIO-FLUX BULLETS! 👾"
            });

            for (let i = 0; i < 4; i++) {
              const angle = (Math.PI / 2) * i + Math.random() * 0.3;
              state.bullets.push({
                x: boss.x + Math.cos(angle) * 35,
                y: boss.y + Math.sin(angle) * 35,
                vx: Math.cos(angle) * 0.9, // Slower initial homing velocity
                vy: Math.sin(angle) * 0.9, // Slower initial homing velocity
                damage: bossBehavior.usesRockProjectiles ? 17 : 12,
                radius: bossBehavior.usesRockProjectiles ? 12 : 9,
                color: bossBehavior.usesRockProjectiles ? "#57534e" : "#ec4899",
                isEnemy: true,
                isHoming: true,
                visual: bossBehavior.usesRockProjectiles ? "rock" : undefined,
                rotation: Math.random() * Math.PI * 2,
                angularVelocity: (Math.random() - 0.5) * 0.18
              });
            }
          } else if (pattern === 4 && bossBehavior.usesDiveAmbush) {
            // METSTRADE: disappear below the surface, lock a late target point,
            // then burst back into the arena for a close-range impact.
            triggerSound("power");
            boss.diveTimer = 78;
            boss.diveTargetX = player.x;
            boss.diveTargetY = player.y;
            boss.submerged = true;
            boss.visualTimer = 78;
            state.screenShake = 6;
            state.particles.push({
              x: boss.x,
              y: boss.y - boss.radius - 10,
              vx: 0,
              vy: -1,
              radius: 1,
              color: "#22d3ee",
              life: 0,
              maxLife: 42,
              alpha: 1,
              text: "🌊 SUBMERGED // AMBUSH INCOMING 🌊"
            });
            for (let i = 0; i < 18; i++) {
              const angle = (i / 18) * Math.PI * 2;
              spawnParticle(state, {
                x: boss.x + Math.cos(angle) * boss.radius,
                y: boss.y + Math.sin(angle) * boss.radius,
                vx: -Math.cos(angle) * 1.8,
                vy: -Math.sin(angle) * 1.8,
                radius: 2 + Math.random() * 3,
                color: i % 2 === 0 ? "#67e8f9" : "#155e75",
                life: 0,
                maxLife: 24,
                alpha: 1
              });
            }
          } else if (pattern === 5 && bossBehavior.usesTentacleArea) {
            // METSTRADE: lock a circular zone and give the player a clear
            // telegraph before the tentacles converge and deal area damage.
            triggerSound("power");
            boss.tentacleTimer = 70;
            boss.tentacleTargetX = player.x;
            boss.tentacleTargetY = player.y;
            boss.visualTimer = 70;
            state.particles.push({
              x: player.x,
              y: player.y - 132,
              vx: 0,
              vy: -0.4,
              radius: 1,
              color: "#e879f9",
              life: 0,
              maxLife: 46,
              alpha: 1,
              text: "🐙 TENTACLE ZONE // MOVE! 🐙"
            });
          } else if (pattern === 6 && bossBehavior.usesKnockbackRoar) {
            // AAPEX: a telegraphed radial roar that creates space before the
            // next pursuit sequence and pushes nearby robots toward the edge.
            triggerSound("power");
            boss.roarTimer = 56;
            boss.roarX = boss.x;
            boss.roarY = boss.y;
            boss.visualTimer = 56;
            state.screenShake = 5;
            state.particles.push({
              x: boss.x,
              y: boss.y - boss.radius - 12,
              vx: 0,
              vy: -0.6,
              radius: 1,
              color: "#fb7185",
              life: 0,
              maxLife: 38,
              alpha: 1,
              text: "🦁 SHOCKWAVE ROAR // RETREAT! 🦁"
            });
          } else if (pattern === 7 && bossBehavior.usesHardwareSummons) {
            // TITE × IHT: telegraph a hardware reinforcement call before
            // spawning a capped group of bolt, nut, and wrench minions.
            triggerSound("power");
            boss.summonTimer = 62;
            boss.visualTimer = 62;
            state.particles.push({
              x: boss.x,
              y: boss.y - boss.radius - 12,
              vx: 0,
              vy: -0.7,
              radius: 1,
              color: "#fbbf24",
              life: 0,
              maxLife: 44,
              alpha: 1,
              text: "🔩 HARDWARE SUPPORT INCOMING! 🔧"
            });
          } else if (pattern === 8 && bossBehavior.usesToolBarrage) {
            // TITE × IHT: fan-shaped magnetic tool throw. The rotating tool
            // silhouettes make its lanes distinct from regular projectiles.
            triggerSound("shoot");
            state.screenShake = 7;
            const aimAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
            for (let i = -3; i <= 3; i++) {
              const angle = aimAngle + i * 0.18;
              state.bullets.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angle) * (3.1 + Math.abs(i) * 0.08),
                vy: Math.sin(angle) * (3.1 + Math.abs(i) * 0.08),
                damage: 16,
                radius: 10,
                color: i % 2 === 0 ? "#f59e0b" : "#94a3b8",
                isEnemy: true,
                visual: "tool",
                rotation: i * 0.35,
                angularVelocity: i % 2 === 0 ? 0.2 : -0.2,
              });
            }
            state.particles.push({
              x: boss.x,
              y: boss.y - boss.radius - 12,
              vx: 0,
              vy: -0.8,
              radius: 1,
              color: "#38bdf8",
              life: 0,
              maxLife: 42,
              alpha: 1,
              text: "🔧 MAGNETIC TOOL BARRAGE! 🔧"
            });
          } else if (pattern === 9 && bossBehavior.usesBombingRun) {
            // AUTOMECHANIKA: cross the full screen, disappear beyond the edge,
            // then detonate a staggered chain of clearly marked missile zones.
            triggerSound("power");
            const flightDirection = player.x >= state.mapSize.width * 0.5 ? 1 : -1;
            boss.facingX = flightDirection;
            boss.airRaidStartX = flightDirection > 0 ? -boss.radius * 2.4 : state.mapSize.width + boss.radius * 2.4;
            boss.airRaidEndX = flightDirection > 0 ? state.mapSize.width + boss.radius * 2.4 : -boss.radius * 2.4;
            boss.airRaidY = Math.max(boss.radius, Math.min(state.mapSize.height * 0.4, player.y - 150));
            boss.x = boss.airRaidStartX;
            boss.y = boss.airRaidY;
            boss.airRaidTimer = 150;
            boss.visualTimer = 150;
            state.screenShake = 7;
            state.bombingZones = Array.from({ length: 5 }, (_, index) => {
              const spreadAngle = (index / 5) * Math.PI * 2 + state.ticks * 0.03;
              const desired = {
                x: player.x + Math.cos(spreadAngle) * (48 + index * 24),
                y: player.y + Math.sin(spreadAngle) * (42 + index * 20),
              };
              const strike = findNearestBossArenaSpawn(desired, 24, state.mapSize);
              return { x: strike.x, y: strike.y, radius: 58, timer: 76 + index * 13 };
            });
            state.particles.push({
              x: state.mapSize.width * 0.5,
              y: 90,
              vx: 0,
              vy: -0.4,
              radius: 1,
              color: "#fb923c",
              life: 0,
              maxLife: 52,
              alpha: 1,
              text: "✈️ EAGLE BOMBING RUN // WATCH THE GROUND! ✈️",
            });
          } else if (pattern === 10 && bossBehavior.usesAimedLaser) {
            // AUTOMECHANIKA: track briefly, lock the robot's last position,
            // then fire a single high-damage beam along that readable line.
            triggerSound("power");
            boss.laserAttackTimer = 72;
            boss.laserTargetX = player.x;
            boss.laserTargetY = player.y;
            boss.facingX = Math.sign(player.x - boss.x) || boss.facingX || 1;
            boss.visualTimer = 72;
            state.particles.push({
              x: boss.x,
              y: boss.y - boss.radius - 12,
              vx: 0,
              vy: -0.6,
              radius: 1,
              color: "#ef4444",
              life: 0,
              maxLife: 44,
              alpha: 1,
              text: "🔻 TWIN-EAGLE LASER LOCK // EVADE! 🔻",
            });
          } else if (pattern === 11 && bossBehavior.usesStrafingBurst) {
            // AUTOMECHANIKA: repeated three-lane machine-gun bursts. Each burst
            // re-aims, rewarding continuous movement without filling the screen.
            triggerSound("shoot");
            boss.strafeTimer = 88;
            boss.facingX = Math.sign(player.x - boss.x) || boss.facingX || 1;
            boss.visualTimer = 88;
            state.particles.push({
              x: boss.x,
              y: boss.y - boss.radius - 12,
              vx: 0,
              vy: -0.6,
              radius: 1,
              color: "#fbbf24",
              life: 0,
              maxLife: 42,
              alpha: 1,
              text: "⚠️ MACHINE-GUN STRAFING BURST! ⚠️",
            });
          }
        }
        } // End of stunTimer else block

        // Contact damage to Mecha (from direct contact with the Boss)
        const distToPlayer = Math.hypot(player.x - boss.x, player.y - boss.y);
        if (!boss.submerged && boss.airRaidTimer <= 0 && boss.airRaidReturnTimer <= 0 && distToPlayer <= player.radius + boss.radius && player.invincibleTime === 0) {
          const isChainDashImpact = bossBehavior.usesChainDash
            && (boss.dashTimer || 0) > 0
            && (boss.dashTimer || 0) <= bossBehavior.dashExecutionThreshold;
          const contactDamage = isChainDashImpact ? 30 : 22;
          const actualDamage = player.isShieldActive ? Math.ceil(contactDamage * 0.2) : contactDamage;
          recordAction("takeDamage");
          player.hp = Math.max(0, (player.hp ?? 100) - actualDamage);
          setHp(player.hp);
          if (player.hp <= 0) {
            handleGameOver();
          }
          player.invincibleTime = player.isShieldActive ? 20 : 55; // Shorter invincibility if shielded
          triggerSound(player.isShieldActive ? "click" : "hit");

          if (isChainDashImpact) {
            const impactVx = boss.dashVx || (player.x - boss.x);
            const impactVy = boss.dashVy || (player.y - boss.y);
            const impactLength = Math.max(1, Math.hypot(impactVx, impactVy));
            moveWithinBossArenaMask(
              player,
              (impactVx / impactLength) * 165,
              (impactVy / impactLength) * 165,
              player.radius,
              state.mapSize,
            );
            boss.dashTimer = 0;
            state.screenShake = 18;
            for (let i = 0; i < 18; i++) {
              const spread = (Math.random() - 0.5) * 1.4;
              const angle = Math.atan2(impactVy, impactVx) + spread;
              const speed = 3 + Math.random() * 6;
              spawnParticle(state, {
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 2 + Math.random() * 4,
                color: i % 2 === 0 ? "#fb7185" : "#fbbf24",
                life: 0,
                maxLife: 22,
                alpha: 1,
                text: i === 0 ? "💥 LAUNCH IMPACT! 💥" : undefined
              });
            }
          }
          
          if (player.isShieldActive) {
            if (player.shieldDurability === undefined) player.shieldDurability = 4;
            player.shieldDurability--;
            setMechaShieldDurability(player.shieldDurability);

            if (player.shieldDurability <= 0) {
              player.shieldBrokenTimer = 90; // 1.5 seconds broken stagger
              player.isShieldActive = false;
              setMechaActiveShield(false);
              setMechaShieldBroken(true);
              triggerSound("explosion");
              state.screenShake = 15;

              // SHIELD BROKEN massive visual burst
              for (let i = 0; i < 25; i++) {
                const theta = Math.random() * Math.PI * 2;
                const spd = 3 + Math.random() * 5;
                state.particles.push({
                  x: player.x,
                  y: player.y,
                  vx: Math.cos(theta) * spd,
                  vy: Math.sin(theta) * spd,
                  radius: 3 + Math.random() * 3,
                  color: "#ef4444",
                  life: 0,
                  maxLife: 25,
                  alpha: 1,
                  text: i === 0 ? "⚡ SHIELD BROKEN! ⚡" : undefined
                });
              }
            } else {
              // Shield contact sparks
              for (let i = 0; i < 15; i++) {
                const theta = Math.random() * Math.PI * 2;
                state.particles.push({
                  x: player.x + Math.cos(theta) * player.radius,
                  y: player.y + Math.sin(theta) * player.radius,
                  vx: Math.cos(theta) * 3,
                  vy: Math.sin(theta) * 3,
                  radius: 2,
                  color: "#06b6d4",
                  life: 0,
                  maxLife: 15,
                  alpha: 1
                });
              }
            }
          } else {
            // Generate heavy damage sparks
            for (let i = 0; i < 12; i++) {
              state.particles.push({
                x: player.x,
                y: player.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                radius: 3,
                color: "#f43f5e",
                life: 0,
                maxLife: 20,
                alpha: 1
              });
            }
          }
        }
      }
      } // End of !isPaused updates

      // ==========================================
      // 10. RENDERING TO CANVAS
      // ==========================================
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // A. Draw Background Terrain / Grid
      ctx.save();
      const shakeStrength = Math.max(0, state.screenShake || 0);
      const shakeX = shakeStrength > 0.15 ? (Math.random() - 0.5) * shakeStrength : 0;
      const shakeY = shakeStrength > 0.15 ? (Math.random() - 0.5) * shakeStrength : 0;
      state.screenShake = shakeStrength > 0.15 ? shakeStrength * 0.78 : 0;
      ctx.translate(-state.camera.x + shakeX, -state.camera.y + shakeY);

      ctx.fillStyle = activeChapter.groundColor;
      ctx.fillRect(0, 0, state.mapSize.width, state.mapSize.height);

      if (stage === "PLAYING" || stage === "BOSSBATTLE") {
        const backgroundImage = stage === "BOSSBATTLE"
          ? bossArenaBackgroundImgRef.current
          : missionBackgroundImgRef.current;
        if (backgroundImage?.complete && backgroundImage.naturalWidth > 0) {
          const placement = getCoverPlacement(
            backgroundImage.naturalWidth,
            backgroundImage.naturalHeight,
            state.mapSize.width,
            state.mapSize.height,
          );

          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(
            backgroundImage,
            placement.x,
            placement.y,
            placement.width,
            placement.height,
          );
          ctx.restore();
        }
      }

      // Grid lines remain exclusive to the exploration map so the boss artwork stays unobstructed.
      if (stage === "PLAYING") {
        ctx.strokeStyle = activeChapter.gridColor;
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < state.mapSize.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, state.mapSize.height);
          ctx.stroke();
        }
        for (let y = 0; y < state.mapSize.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(state.mapSize.width, y);
          ctx.stroke();
        }
      }

      // Draw active Ground Light Zones (C2-932 deployed areas)
      state.lightZones.forEach((z) => {
        const radG = ctx.createRadialGradient(z.x, z.y, 10, z.x, z.y, z.radius);
        radG.addColorStop(0, z.highMode ? "rgba(253, 224, 71, 0.35)" : "rgba(253, 224, 71, 0.15)");
        radG.addColorStop(1, "rgba(253, 224, 71, 0)");
        ctx.fillStyle = radG;
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
        ctx.fill();

        // Border circle line
        ctx.strokeStyle = z.highMode ? "rgba(253, 224, 71, 0.6)" : "rgba(253, 224, 71, 0.25)";
        ctx.lineWidth = z.highMode ? 2 : 1;
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // B. Draw Collectibles
      state.collectibles.forEach((col) => {
        const floatOffset = Math.sin(col.pulse) * 3;
        ctx.fillStyle = col.type === "battery" ? "#10b981" : col.type === "gem" ? "#38bdf8" : col.type === "coin" ? "#fbbf24" : "#f59e0b";
        
        ctx.beginPath();
        if (col.type === "battery") {
          // Draw cute little rectangular battery casing
          ctx.fillRect(col.x - 5, col.y - 7 + floatOffset, 10, 14);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(col.x - 2, col.y - 9 + floatOffset, 4, 2); // terminal cap
        } else if (col.type === "gem") {
          // Draw diamond shape
          ctx.moveTo(col.x, col.y - 6 + floatOffset);
          ctx.lineTo(col.x + 5, col.y + floatOffset);
          ctx.lineTo(col.x, col.y + 6 + floatOffset);
          ctx.lineTo(col.x - 5, col.y + floatOffset);
          ctx.closePath();
          ctx.fill();
        } else if (col.type === "coin") {
          // Beautiful shiny gold coin
          ctx.beginPath();
          ctx.arc(col.x, col.y + floatOffset, 6, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.strokeStyle = "#d97706";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(col.x, col.y + floatOffset, 6, 0, Math.PI * 2);
          ctx.stroke();

          // C character inside
          ctx.fillStyle = "#78350f";
          ctx.font = "bold 6px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("C", col.x, col.y + floatOffset + 0.5);
        } else {
          // Draw a small briefcase with glowing handles
          ctx.fillRect(col.x - 8, col.y - 6 + floatOffset, 16, 12);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(col.x - 4, col.y - 9 + floatOffset, 8, 3);
        }
        
        // Add subtle halo glowing under the items
        ctx.fillStyle = col.type === "battery" ? "rgba(16, 185, 129, 0.25)" : col.type === "gem" ? "rgba(56, 189, 248, 0.25)" : col.type === "coin" ? "rgba(251, 191, 36, 0.3)" : "rgba(245, 158, 11, 0.25)";
        ctx.beginPath();
        ctx.arc(col.x, col.y + floatOffset, col.radius + 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // C. Draw Bullets / Beam Tracks
      state.bullets.forEach((b) => {
        if (b.isLaserBeam) {
          ctx.strokeStyle = b.color;
          ctx.lineWidth = isHigh ? 3 : 1.5;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.laserEndX!, b.laserEndY!);
          ctx.stroke();
        } else if (b.visual === "rock") {
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(b.rotation || 0);
          ctx.fillStyle = b.color;
          ctx.strokeStyle = "#d6a35d";
          ctx.lineWidth = 2;
          ctx.shadowColor = "rgba(245, 158, 11, 0.45)";
          ctx.shadowBlur = 7;
          ctx.beginPath();
          for (let i = 0; i < 7; i++) {
            const angle = (i / 7) * Math.PI * 2;
            const jaggedRadius = b.radius * (i % 2 === 0 ? 1 : 0.72);
            const px = Math.cos(angle) * jaggedRadius;
            const py = Math.sin(angle) * jaggedRadius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,0.24)";
          ctx.beginPath();
          ctx.arc(-b.radius * 0.25, -b.radius * 0.2, Math.max(2, b.radius * 0.18), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (b.visual === "tool") {
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(b.rotation || 0);
          ctx.fillStyle = b.color;
          ctx.strokeStyle = "#e2e8f0";
          ctx.lineWidth = 3;
          ctx.shadowColor = b.color;
          ctx.shadowBlur = 8;
          ctx.fillRect(-3, -b.radius, 6, b.radius * 1.6);
          ctx.beginPath();
          ctx.arc(0, -b.radius * 0.72, b.radius * 0.55, 0.2 * Math.PI, 0.8 * Math.PI, true);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, b.radius * 0.72, b.radius * 0.34, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // D. Draw Enemies (Shadow monsters)
      state.enemies.forEach((enemy) => {
        const hitFeedback = getHitRenderOffset(enemy);
        if (enemy.isBossMinion) {
          const pulse = 1 + Math.sin(state.ticks * 0.12 + enemy.x) * 0.06;
          ctx.save();
          ctx.translate(enemy.x + hitFeedback.x, enemy.y + hitFeedback.y);
          ctx.rotate(state.ticks * (enemy.bossMinionKind === "wrench" ? -0.035 : 0.028));
          ctx.scale(pulse, pulse);
          ctx.imageSmoothingEnabled = false;
          ctx.shadowColor = hitFeedback.active ? "#ffffff" : enemy.color;
          ctx.shadowBlur = hitFeedback.active ? 18 : 9;
          ctx.strokeStyle = hitFeedback.active ? "#ffffff" : "#e2e8f0";
          ctx.fillStyle = hitFeedback.active ? "#ffffff" : enemy.color;
          ctx.lineWidth = 4;

          if (enemy.bossMinionKind === "nut") {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = i * Math.PI / 3;
              const x = Math.cos(angle) * 17;
              const y = Math.sin(angle) * 17;
              if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.stroke();
          } else if (enemy.bossMinionKind === "wrench") {
            ctx.fillRect(-5, -17, 10, 28);
            ctx.beginPath();
            ctx.arc(0, -15, 10, 0.2 * Math.PI, 0.8 * Math.PI, true);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 14, 6, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.fillRect(-4, -15, 8, 30);
            ctx.fillRect(-12, -16, 24, 9);
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(-2, -5, 4, 4);
            ctx.fillRect(-2, 3, 4, 4);
          }
          ctx.restore();

          ctx.fillStyle = "rgba(0,0,0,0.72)";
          ctx.fillRect(enemy.x - 18, enemy.y - enemy.radius - 10, 36, 4);
          ctx.fillStyle = "#f59e0b";
          ctx.fillRect(enemy.x - 18, enemy.y - enemy.radius - 10, Math.max(0, enemy.hp / enemy.maxHp) * 36, 4);
          return;
        }

        const enemyImage = enemySpriteImagesRef.current[enemy.type];
        if (enemyImage?.complete && enemyImage.naturalWidth > 0) {
          const spriteSize = enemy.type === "clumper" ? 64 : enemy.type === "stalker" ? 52 : 50;
          const aspectRatio = enemyImage.naturalWidth / enemyImage.naturalHeight;
          const drawWidth = aspectRatio >= 1 ? spriteSize : spriteSize * aspectRatio;
          const drawHeight = aspectRatio >= 1 ? spriteSize / aspectRatio : spriteSize;
          const hoverOffset = Math.sin(state.ticks * 0.08 + enemy.x * 0.01) * 2;

          ctx.save();
          ctx.translate(enemy.x + hitFeedback.x, enemy.y + hoverOffset + hitFeedback.y);
          const shouldMirror = enemy.type === "stalker" ? !enemy.facingLeft : enemy.facingLeft;
          if (shouldMirror) ctx.scale(-1, 1);
          ctx.imageSmoothingEnabled = false;
          ctx.shadowColor = "rgba(139, 92, 246, 0.45)";
          ctx.shadowBlur = 8;
          if (hitFeedback.active) ctx.filter = "brightness(0) invert(1)";
          ctx.drawImage(enemyImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
          ctx.restore();
        } else {
          ctx.fillStyle = hitFeedback.active ? "#ffffff" : enemy.color;
          ctx.beginPath();
          ctx.arc(enemy.x + hitFeedback.x, enemy.y + hitFeedback.y, enemy.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw shadow health bar above larger clumpers
        if (enemy.type === "clumper") {
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(enemy.x - 12, enemy.y - enemy.radius - 8, 24, 4);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(enemy.x - 12, enemy.y - enemy.radius - 8, (enemy.hp / enemy.maxHp) * 24, 4);
        }
      });

      // Keep defeated enemies visible for a brief shrink-and-fade dissolve.
      state.enemyDeathEffects.forEach((effect) => {
        const enemyImage = enemySpriteImagesRef.current[effect.type];
        if (!enemyImage?.complete || enemyImage.naturalWidth <= 0) return;

        const progress = effect.life / effect.maxLife;
        const scale = Math.max(0.12, 1 - progress * 0.88);
        const spriteSize = (effect.type === "clumper" ? 64 : effect.type === "stalker" ? 52 : 50) * scale;
        const aspectRatio = enemyImage.naturalWidth / enemyImage.naturalHeight;
        const drawWidth = aspectRatio >= 1 ? spriteSize : spriteSize * aspectRatio;
        const drawHeight = aspectRatio >= 1 ? spriteSize / aspectRatio : spriteSize;

        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.translate(effect.x, effect.y - progress * 10);
        const shouldMirror = effect.type === "stalker" ? !effect.facingLeft : effect.facingLeft;
        if (shouldMirror) ctx.scale(-1, 1);
        ctx.imageSmoothingEnabled = false;
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 12 + progress * 16;
        ctx.drawImage(enemyImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = (1 - progress) * 0.65;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.radius + progress * 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // E. Draw Boss (if active)
      // AUTOMECHANIKA missile targets render independently from the aircraft,
      // so warnings and impacts stay visible while it is beyond the screen.
      state.bombingZones.forEach((zone: BombingZone) => {
        ctx.save();
        if (zone.timer > 0) {
          const pulse = 1 + Math.sin(state.ticks * 0.32 + zone.x * 0.01) * 0.08;
          ctx.fillStyle = "rgba(127, 29, 29, 0.2)";
          ctx.strokeStyle = zone.timer < 25 ? "rgba(254, 243, 199, 0.98)" : "rgba(248, 113, 113, 0.88)";
          ctx.lineWidth = zone.timer < 25 ? 6 : 3;
          ctx.setLineDash(zone.timer < 25 ? [] : [10, 7]);
          ctx.beginPath();
          ctx.arc(zone.x, zone.y, zone.radius * pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.strokeStyle = "rgba(251, 191, 36, 0.75)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(zone.x - 15, zone.y);
          ctx.lineTo(zone.x + 15, zone.y);
          ctx.moveTo(zone.x, zone.y - 15);
          ctx.lineTo(zone.x, zone.y + 15);
          ctx.stroke();
        } else {
          const impactProgress = Math.min(1, Math.abs(zone.timer) / 18);
          ctx.globalAlpha = 1 - impactProgress;
          ctx.fillStyle = "rgba(255, 237, 213, 0.9)";
          ctx.strokeStyle = "#f97316";
          ctx.lineWidth = 8 * (1 - impactProgress) + 2;
          ctx.beginPath();
          ctx.arc(zone.x, zone.y, zone.radius * (0.45 + impactProgress * 1.25), 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      });

      if (state.boss) {
        const boss = state.boss;
        const bossHitFeedback = getHitRenderOffset(boss);
        
        let bx = boss.x + bossHitFeedback.x;
        let by = boss.y + bossHitFeedback.y;

        if ((boss.laserAttackTimer || 0) > 0 && boss.laserTargetX !== undefined && boss.laserTargetY !== undefined) {
          const firing = (boss.laserAttackTimer || 0) <= 28;
          ctx.save();
          ctx.strokeStyle = firing ? "rgba(254, 242, 242, 0.98)" : "rgba(248, 113, 113, 0.72)";
          ctx.lineWidth = firing ? 15 : 3;
          ctx.shadowColor = firing ? "#ef4444" : "transparent";
          ctx.shadowBlur = firing ? 24 : 0;
          ctx.setLineDash(firing ? [] : [12, 8]);
          ctx.beginPath();
          ctx.moveTo(boss.x, boss.y);
          ctx.lineTo(boss.laserTargetX, boss.laserTargetY);
          ctx.stroke();
          if (firing) {
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 5;
            ctx.shadowBlur = 10;
            ctx.stroke();
          }
          ctx.setLineDash([]);
          ctx.restore();
        }

        // METSTRADE attack telegraphs remain visible even while the Boss body
        // is submerged, giving the player a fair and readable escape window.
        if ((boss.diveTimer || 0) > 0 && boss.diveTargetX !== undefined && boss.diveTargetY !== undefined) {
          const warningProgress = 1 - Math.min(1, (boss.diveTimer || 0) / 78);
          const warningRadius = 42 + warningProgress * 34 + Math.sin(state.ticks * 0.35) * 6;
          ctx.save();
          ctx.strokeStyle = `rgba(34, 211, 238, ${0.45 + warningProgress * 0.4})`;
          ctx.fillStyle = `rgba(8, 145, 178, ${0.08 + warningProgress * 0.16})`;
          ctx.lineWidth = 3 + warningProgress * 3;
          ctx.setLineDash([10, 7]);
          ctx.beginPath();
          ctx.arc(boss.diveTargetX, boss.diveTargetY, warningRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);
          for (let ring = 0; ring < 3; ring++) {
            ctx.globalAlpha = 0.5 - ring * 0.12;
            ctx.beginPath();
            ctx.arc(boss.diveTargetX, boss.diveTargetY, 20 + ring * 18 + (state.ticks % 18), 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        }

        if ((boss.tentacleTimer || 0) > 0 && boss.tentacleTargetX !== undefined && boss.tentacleTargetY !== undefined) {
          const strikeX = boss.tentacleTargetX;
          const strikeY = boss.tentacleTargetY;
          const beforeImpact = (boss.tentacleTimer || 0) > 24;
          const warningProgress = beforeImpact ? 1 - ((boss.tentacleTimer || 0) - 24) / 46 : 1;
          ctx.save();
          ctx.fillStyle = beforeImpact ? "rgba(126, 34, 206, 0.12)" : "rgba(217, 70, 239, 0.25)";
          ctx.strokeStyle = beforeImpact ? "rgba(232, 121, 249, 0.8)" : "rgba(250, 232, 255, 0.95)";
          ctx.lineWidth = beforeImpact ? 3 : 6;
          ctx.setLineDash(beforeImpact ? [8, 6] : []);
          ctx.beginPath();
          ctx.arc(strikeX, strikeY, 118, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);

          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + state.ticks * 0.018;
            const outerRadius = 145;
            const innerRadius = beforeImpact ? 92 - warningProgress * 58 : 18;
            const startX = strikeX + Math.cos(angle) * outerRadius;
            const startY = strikeY + Math.sin(angle) * outerRadius;
            const endX = strikeX + Math.cos(angle + 0.45) * innerRadius;
            const endY = strikeY + Math.sin(angle + 0.45) * innerRadius;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(
              strikeX + Math.cos(angle + 0.8) * 76,
              strikeY + Math.sin(angle + 0.8) * 76,
              endX,
              endY,
            );
            ctx.stroke();
          }
          ctx.restore();
        }

        if ((boss.roarTimer || 0) > 0 && boss.roarX !== undefined && boss.roarY !== undefined) {
          const beforeImpact = (boss.roarTimer || 0) > 18;
          const warningProgress = beforeImpact ? 1 - ((boss.roarTimer || 0) - 18) / 38 : 1;
          const roarRadius = 55 + warningProgress * 165;
          ctx.save();
          ctx.strokeStyle = beforeImpact ? "rgba(251, 113, 133, 0.82)" : "rgba(254, 243, 199, 0.98)";
          ctx.fillStyle = beforeImpact ? "rgba(159, 18, 57, 0.08)" : "rgba(245, 158, 11, 0.2)";
          ctx.lineWidth = beforeImpact ? 4 : 8;
          ctx.setLineDash(beforeImpact ? [12, 8] : []);
          ctx.beginPath();
          ctx.arc(boss.roarX, boss.roarY, roarRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);
          for (let ring = 0; ring < 2; ring++) {
            ctx.globalAlpha = 0.5 - ring * 0.18;
            ctx.beginPath();
            ctx.arc(boss.roarX, boss.roarY, Math.max(20, roarRadius - 28 - ring * 30), 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        }

        ctx.save();
        if (boss.submerged) ctx.globalAlpha = 0;
        
        // Shake boss and draw charging visuals when preparing a dash
        if (boss.dashTimer && boss.dashTimer > bossBehavior.dashExecutionThreshold) {
          bx += (Math.random() - 0.5) * 6;
          by += (Math.random() - 0.5) * 6;

          // Drawing dynamic warning guide laser line to player
          ctx.save();
          ctx.strokeStyle = "rgba(239, 68, 68, 0.65)";
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(boss.x, boss.y);
          ctx.lineTo(player.x, player.y);
          ctx.stroke();
          ctx.restore();

          // Outer warning energy circle
          ctx.strokeStyle = "rgba(244, 63, 94, 0.5)";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(bx, by, boss.radius + 15 + Math.sin(state.ticks * 0.3) * 5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Pulse size calculation
        const pulse = 1 + Math.sin(state.ticks * 0.05) * 0.08;
        const rad = boss.radius * pulse;

        // Visual enhancement: Massive rotating background octagram / majestic runic halo
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(state.ticks * 0.012);
        ctx.strokeStyle = "rgba(168, 85, 247, 0.45)"; // glowing purple halo line
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI / 4) * i;
          const rOuter = rad + 35 + Math.sin(state.ticks * 0.08 + i) * 6;
          ctx.lineTo(Math.cos(angle) * rOuter, Math.sin(angle) * rOuter);
        }
        ctx.closePath();
        ctx.stroke();

        // Additional rotating circular shield barrier
        ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 12]);
        ctx.beginPath();
        ctx.arc(0, 0, rad + 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash

        // Orbiting glowing plasma orbs (planetary style protection shield nodes)
        for (let i = 0; i < 3; i++) {
          const angle = (Math.PI * 2 / 3) * i + (state.ticks * 0.025);
          const orbX = Math.cos(angle) * (rad + 26);
          const orbY = Math.sin(angle) * (rad + 26);
          ctx.fillStyle = i === 0 ? "#ef4444" : i === 1 ? "#38bdf8" : "#fbbf24";
          
          ctx.save();
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(orbX, orbY, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();

        if ((boss.defenseTimer || 0) > 0) {
          // Heavy amber mining shield with rotating segmented armor plates.
          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(-state.ticks * 0.018);
          ctx.strokeStyle = "rgba(245, 158, 11, 0.92)";
          ctx.lineWidth = 7;
          ctx.setLineDash([18, 8]);
          ctx.beginPath();
          ctx.arc(0, 0, rad + 16, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.strokeStyle = "rgba(214, 163, 93, 0.42)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, rad + 27 + Math.sin(state.ticks * 0.2) * 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        let bossVisualState: BossVisualState = "idle";
        if ((boss.defenseTimer || 0) > 0) {
          bossVisualState = "area";
        } else if ((boss.visualTimer || 0) > 0) {
          if (boss.currentPattern === 0) bossVisualState = "area";
          else if (boss.currentPattern === 1 || boss.currentPattern === 3) bossVisualState = "tracking";
          else if (boss.currentPattern === 2 || boss.currentPattern === 4) bossVisualState = "special";
          else if (boss.currentPattern === 5 || boss.currentPattern === 6) bossVisualState = "area";
          else if (boss.currentPattern === 7) bossVisualState = "area";
          else if (boss.currentPattern === 8) bossVisualState = "tracking";
          else if (boss.currentPattern === 9) bossVisualState = "area";
          else if (boss.currentPattern === 10) bossVisualState = "special";
          else if (boss.currentPattern === 11) bossVisualState = "tracking";
        }

        const bossVisualImage = bossVisualImagesRef.current[bossVisualState]
          || bossVisualImagesRef.current.idle;

        if (bossVisualImage?.complete && bossVisualImage.naturalWidth > 0) {
          const spriteDrawSize = rad * (selectedChapter === 2 ? 5 : 4.2);
          const hoverOffset = Math.sin(state.ticks * 0.075) * 3;
          const directionalVelocityX = (boss.dashTimer || 0) > 0 ? boss.dashVx : boss.vx;
          if (Math.abs(directionalVelocityX || 0) > 0.05) boss.facingX = Math.sign(directionalVelocityX);
          // AAPEX artwork faces left by default. Flip its full sprite set whenever
          // the Boss is travelling right so chained dashes always read correctly.
          const mirrorAapexSprite = selectedChapter === 4 && (boss.facingX || -1) > 0;
          // AUTOMECHANIKA uses different source-facing directions: the laser
          // and strafing art face left, while the bombing art faces right.
          // Keep the frontal idle frame untouched and mirror each attack from
          // its own authored direction.
          const mirrorAutomechanikaSprite = selectedChapter === 2
            && bossVisualState !== "idle"
            && (bossVisualState === "tracking" || bossVisualState === "special"
              ? (boss.facingX || -1) > 0
              : (boss.facingX || 1) < 0);
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.shadowColor = bossHitFeedback.active ? "#ffffff" : activeChapter.themeColor;
          ctx.shadowBlur = bossHitFeedback.active ? 26 : 18 + Math.sin(state.ticks * 0.08) * 6;
          ctx.filter = bossHitFeedback.active ? "brightness(0) invert(1)" : "none";
          ctx.translate(bx, by + hoverOffset);
          ctx.scale(mirrorAapexSprite || mirrorAutomechanikaSprite ? -1 : 1, 1);
          ctx.drawImage(
            bossVisualImage,
            -spriteDrawSize / 2,
            -spriteDrawSize / 2,
            spriteDrawSize,
            spriteDrawSize,
          );
          ctx.restore();
        } else {
          // Keep a lightweight fallback visible while a remote sprite is still loading.
          ctx.save();
          const grad = ctx.createRadialGradient(bx, by, 8, bx, by, rad);
          grad.addColorStop(0, bossHitFeedback.active ? "#ffffff" : "#4c1d95");
          grad.addColorStop(0.5, bossHitFeedback.active ? "#f4f4f5" : "#1e1b4b");
          grad.addColorStop(1, bossHitFeedback.active ? "#d4d4d8" : "rgba(9, 9, 11, 0.98)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(bx, by, rad, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Outer neon aura ring
        ctx.strokeStyle = bossHitFeedback.active ? "#ffffff" : activeChapter.themeColor;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.arc(bx, by, rad, 0, Math.PI * 2);
        ctx.stroke();

        // Electric arc visual leakage from the core
        if (state.ticks % 6 === 0) {
          ctx.save();
          ctx.strokeStyle = "rgba(6, 182, 212, 0.7)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const arcAngle = Math.random() * Math.PI * 2;
          ctx.moveTo(bx + Math.cos(arcAngle) * (rad - 15), by + Math.sin(arcAngle) * (rad - 15));
          ctx.lineTo(bx + Math.cos(arcAngle + 0.3) * (rad + 12), by + Math.sin(arcAngle + 0.3) * (rad + 12));
          ctx.stroke();
          ctx.restore();
        }

        // Core name text banner & Combat Status Indicators
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(boss.name, bx, by - boss.radius - 20);

        // Display Active Action Alert
        let statusText = "⚔️ SYSTEM ONLINE / COMBAT OPTIMIZATION ⚔️";
        let statusColor = "text-zinc-400";
        if ((boss.airRaidReturnTimer || 0) > 0) {
          statusText = "✈️ TWIN-EAGLE RETURNING FROM ABOVE ✈️";
          statusColor = "text-orange-300 animate-pulse";
        } else if ((boss.airRaidTimer || 0) > 0) {
          statusText = boss.submerged
            ? "✈️ AIRCRAFT OFF-SCREEN // MISSILE IMPACTS ACTIVE ✈️"
            : "✈️ TWIN-EAGLE BOMBING RUN ✈️";
          statusColor = "text-orange-400 animate-pulse";
        } else if ((boss.laserAttackTimer || 0) > 0) {
          statusText = (boss.laserAttackTimer || 0) > 28
            ? "🔻 LASER TARGET LOCK // KEEP MOVING 🔻"
            : "🔴 HIGH-ENERGY LASER FIRING 🔴";
          statusColor = "text-rose-500 animate-pulse";
        } else if ((boss.strafeTimer || 0) > 0) {
          statusText = "⚠️ MACHINE-GUN STRAFING // BREAK THE AIM ⚠️";
          statusColor = "text-amber-400 animate-pulse";
        } else if (boss.dashTimer && boss.dashTimer > bossBehavior.dashExecutionThreshold) {
          statusText = bossBehavior.usesChainDash
            ? `⚠️ CHAIN DASH // ${boss.chainDashRemaining || 0} FOLLOW-UP(S) ⚠️`
            : "⚠️ WARNING: ENGINE CHARGING [OVERDRIVE DANGER] ⚠️";
          statusColor = "text-rose-500 animate-pulse";
        } else if ((boss.roarTimer || 0) > 0) {
          statusText = "🦁 SHOCKWAVE ROAR CHARGING // LEAVE THE RADIUS 🦁";
          statusColor = "text-rose-400 animate-pulse";
        } else if ((boss.defenseTimer || 0) > 0) {
          statusText = "⛏️ MINING ARMOR ACTIVE // DAMAGE REDUCTION 65% ⛏️";
          statusColor = "text-amber-400";
        } else if (boss.stunTimer && boss.stunTimer > 0) {
          statusText = "💫 CRITICAL FAILURE: SYSTEM SHUTDOWN 💫";
          statusColor = "text-yellow-400";
        }
        
        ctx.save();
        ctx.fillStyle = statusText.includes("LASER") || statusText.includes("WARNING") || statusText.includes("CHAIN DASH") || statusText.includes("SHOCKWAVE")
          ? "#ef4444"
          : statusText.includes("BOMBING") || statusText.includes("MISSILE") || statusText.includes("STRAFING") || statusText.includes("MINING ARMOR")
            ? "#f59e0b"
            : statusText.includes("CRITICAL") ? "#fbbf24" : "#a1a1aa";
        ctx.font = "bold 8px monospace";
        ctx.fillText(statusText, bx, by - boss.radius - 8);
        ctx.restore();
        ctx.restore();
      }

      // F. Draw Player Character / Assembled Robot Mecha
      ctx.save();
      if (player.invincibleTime % 4 > 2) {
        ctx.globalAlpha = 0.3; // flash visual when invuln
      }

      if (stage === "PLAYING") {
        const spriteImg = playerSpriteImgRef.current;
        if (spriteImg && spriteLoaded) {
          const fw = spriteImg.width / 6;
          const fh = spriteImg.height;
          
          // Decide animation frame based on movement
          const isMoving = dx !== 0 || dy !== 0;
          let frameIndex = 0; // idle frame (index 0)
          if (isMoving) {
            // 7 fps walking animation cycling through frames 1 to 5 (index 1 to 5)
            const walkIndex = Math.floor(state.ticks / 8.57) % 5;
            frameIndex = 1 + walkIndex;
          }
          
          ctx.save();
          ctx.translate(player.x, player.y);
          if (playerFacingLeftRef.current) {
            ctx.scale(-1, 1);
          }
          
          const drawWidth = windowWidth >= 640 ? 110 : windowWidth >= 480 ? 90 : 76;
          const drawHeight = drawWidth * (fh / fw);
          ctx.drawImage(
            spriteImg,
            frameIndex * fw,
            0,
            fw,
            fh,
            -drawWidth / 2,
            -drawHeight / 2 - 2,
            drawWidth,
            drawHeight
          );
          ctx.restore();
        } else {
          // Draw the Cute chosen Agent
          ctx.fillStyle = selectedAgent.color;
          ctx.beginPath();
          // Capsule body
          const baseSize = windowWidth >= 640 ? 110 : windowWidth >= 480 ? 90 : 76;
          const capsuleRadius = baseSize * 0.25; // proportional radius
          ctx.arc(player.x, player.y - 2, capsuleRadius, 0, Math.PI * 2);
          ctx.fill();

          // Draw cute tech visor
          ctx.fillStyle = "#0f172a"; // dark background
          ctx.fillRect(player.x - baseSize * 0.15, player.y - baseSize * 0.12, baseSize * 0.3, baseSize * 0.12);
          ctx.fillStyle = "#22d3ee"; // cyan visor light
          ctx.fillRect(player.x - baseSize * 0.11, player.y - baseSize * 0.1, baseSize * 0.22, baseSize * 0.08);

          // Draw equipped inspection lamp in hands
          ctx.fillStyle = "#374151";
          ctx.fillRect(player.x + baseSize * 0.11, player.y - baseSize * 0.01, baseSize * 0.07, baseSize * 0.18); // lamp casing
          ctx.fillStyle = batteryMode === "HIGH" ? "#fef08a" : "#fef9c3"; // glowing bulb
          ctx.beginPath();
          ctx.arc(player.x + baseSize * 0.15, player.y + baseSize * 0.2, baseSize * 0.06, 0, Math.PI * 2);
          ctx.fill();
        }

      } else {
        const bossRobotImg = bossRobotSpriteImgRef.current;
        if (robotSelectionRef.current?.robotId === "c2_932" && bossRobotImg && bossRobotSpriteLoaded) {
          const now = Date.now();
          const isActionActive = player.actionEndTime && now < player.actionEndTime;
          
          let drawImg = bossRobotImg;
          let fw = bossRobotImg.width / 4;
          let fh = bossRobotImg.height;
          let frameIndex = 0;

          if (isActionActive && bossRobotActImgRef.current && bossRobotActLoaded) {
            drawImg = bossRobotActImgRef.current;
            fw = drawImg.width / 4;
            fh = drawImg.height;
            if (player.actionType === "defend") {
              frameIndex = 0;
            } else if (player.actionType === "punch") {
              frameIndex = 1;
            } else if (player.actionType === "laser") {
              frameIndex = 2;
            } else if (player.actionType === "ult") {
              frameIndex = 3;
            }
          } else {
            // Decide animation frame based on movement rules
            const isMoving = dx !== 0 || dy !== 0;
            
            if (!player.hasMoved) {
              frameIndex = 0; // 第 1 格
            } else {
              if (isMoving) {
                if (player.lastRobotDir === "left") {
                  frameIndex = 3; // 第 4 格
                } else if (player.lastRobotDir === "right") {
                  frameIndex = 2; // 第 3 格
                } else {
                  // "1. 玩家往下移動時，第 1 格與第 2 格交替播放，形成走路動畫。
                  // 2. 玩家往上移動時，也使用第 1 格與第 2 格交替播放。"
                  const walkFrame = Math.floor(state.ticks / 8) % 2;
                  frameIndex = walkFrame; // 0 or 1
                }
              } else {
                // stopped, "6. 玩家停止移動時，保留最後一次面向的方向。"
                if (player.lastRobotDir === "left") {
                  frameIndex = 3; // 第 4 格
                } else if (player.lastRobotDir === "right") {
                  frameIndex = 2; // 第 3 格
                } else {
                  frameIndex = 0; // 第 1 格
                }
              }
            }
          }

          // Draw the 8-BIT robot centered at player's position
          ctx.save();
          const drawWidth = windowWidth >= 640 ? 110 : windowWidth >= 480 ? 90 : 76;
          const drawHeight = drawWidth * (fh / fw);
          const mirrorPunch = Boolean(
            isActionActive
            && player.actionType === "punch"
            && player.lastRobotDir === "left"
          );
          ctx.translate(player.x, player.y - 4);
          if (mirrorPunch) ctx.scale(-1, 1);

          ctx.drawImage(
            drawImg,
            frameIndex * fw,
            0,
            fw,
            fh,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
          );
          ctx.restore();

          // Draw cyber defensive shield if active!
          if (player.isShieldActive) {
            ctx.save();
            const shieldRadius = player.radius + 40;
            
            // Outer neon cyan glowing ring
            ctx.strokeStyle = "rgba(6, 182, 212, 0.85)";
            ctx.lineWidth = 3 + Math.sin(state.ticks / 4) * 1.5; // pulsating glow!
            ctx.shadowColor = "#22d3ee";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(player.x, player.y, shieldRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Translucent neon cyan filled field with hexagon wireframe grid overlay
            ctx.shadowBlur = 0; // reset shadow
            ctx.fillStyle = "rgba(6, 182, 212, 0.12)";
            ctx.beginPath();
            ctx.arc(player.x, player.y, shieldRadius, 0, Math.PI * 2);
            ctx.fill();

            // Hexagonal lines overlay
            ctx.strokeStyle = "rgba(34, 211, 238, 0.38)";
            ctx.lineWidth = 1.3;
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
              const hx1 = player.x + Math.cos(angle) * shieldRadius;
              const hy1 = player.y + Math.sin(angle) * shieldRadius;
              const hx2 = player.x + Math.cos(angle + Math.PI / 3) * shieldRadius;
              const hy2 = player.y + Math.sin(angle + Math.PI / 3) * shieldRadius;
              ctx.beginPath();
              ctx.moveTo(hx1, hy1);
              ctx.lineTo(hx2, hy2);
              ctx.stroke();

              // inner connector hubs to mecha body
              ctx.beginPath();
              ctx.moveTo(player.x, player.y);
              ctx.lineTo(hx1, hy1);
              ctx.strokeStyle = "rgba(34, 211, 238, 0.08)";
              ctx.stroke();
            }
            
            ctx.restore();
          }

        } else if (robotSelectionRef.current) {
          const selectedRobotImage =
            companionRobotImagesRef.current["C2-932"];
          if (selectedRobotImage) {
            const maxWidth = windowWidth >= 640 ? 110 : windowWidth >= 480 ? 90 : 76;
            const maxHeight = maxWidth * 1.15;
            const scale = Math.min(
              maxWidth / selectedRobotImage.width,
              maxHeight / selectedRobotImage.height
            );
            const drawWidth = selectedRobotImage.width * scale;
            const drawHeight = selectedRobotImage.height * scale;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
              selectedRobotImage,
              player.x - drawWidth / 2,
              player.y - drawHeight / 2,
              drawWidth,
              drawHeight
            );
          }
        } else {
          // Draw the assembled LAMPI ROBOT MECHA! (FALLBACK)
          ctx.save();
          ctx.translate(player.x, player.y);
          ctx.scale(1.35, 1.35); // Scale Mecha up by 35%
          ctx.translate(-player.x, -player.y);

          const armFloodlights = robotUpgrades.range_attack || 1;
          const armLasers = robotUpgrades.laser_weapon || 0;
          const antennaGoose = robotUpgrades.tracking_weapon || 0;
          const hoverBase = robotUpgrades.special_lighting || 0;

          // Draw metal hover pad / legs
          if (hoverBase > 1) {
            ctx.fillStyle = "rgba(253, 224, 71, 0.4)";
            ctx.beginPath();
            ctx.ellipse(player.x, player.y + 24, 25, 8, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = "#4b5563"; // Steel grey mecha legs/base
          ctx.fillRect(player.x - 10, player.y + 10, 20, 10);

          // Core central mechanical pod
          ctx.fillStyle = "#1e293b"; // heavy chassis
          ctx.beginPath();
          ctx.roundRect(player.x - 20, player.y - 22, 40, 36, 6);
          ctx.fill();

          // Draw central atomic energy battery indicator core
          ctx.fillStyle = "#eab308"; // glowing reactor core
          ctx.beginPath();
          ctx.arc(player.x, player.y - 4, 7, 0, Math.PI * 2);
          ctx.fill();

          // Visor glass face
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(player.x - 14, player.y - 18, 28, 7);
          ctx.fillStyle = "#38bdf8"; // bright sky visor
          ctx.fillRect(player.x - 12, player.y - 17, 24, 5);

          // Arms matching weapons collections
          // range_attack: Large Floodlight arms
          if (armFloodlights > 0) {
            ctx.fillStyle = "#64748b";
            ctx.fillRect(player.x - 30, player.y - 12, 10, 15); // left arm casing
            ctx.fillRect(player.x + 20, player.y - 12, 10, 15); // right arm casing
            // Bulbs
            ctx.fillStyle = "#fef08a";
            ctx.beginPath();
            ctx.arc(player.x - 25, player.y + 5, 4.5, 0, Math.PI * 2);
            ctx.arc(player.x + 25, player.y + 5, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // laser_weapon: Sleek slim double-lasers
          if (armLasers > 0) {
            ctx.fillStyle = "#06b6d4"; // blue blaster muzzle
            ctx.fillRect(player.x - 34, player.y - 2, 6, 4);
            ctx.fillRect(player.x + 28, player.y - 2, 6, 4);
          }

          // tracking_weapon: Flexible gooseneck radar antennas waving
          if (antennaGoose > 0) {
            ctx.strokeStyle = "#10b981"; // green flexible tube lines
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(player.x - 10, player.y - 22);
            ctx.bezierCurveTo(player.x - 15, player.y - 32, player.x - 5, player.y - 36, player.x - 12, player.y - 42);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(player.x + 10, player.y - 22);
            ctx.bezierCurveTo(player.x + 15, player.y - 32, player.x + 5, player.y - 36, player.x + 12, player.y - 42);
            ctx.stroke();

            // Green sensor tips
            ctx.fillStyle = "#34d399";
            ctx.beginPath();
            ctx.arc(player.x - 12, player.y - 44, 3, 0, Math.PI * 2);
            ctx.arc(player.x + 12, player.y - 44, 3, 0, Math.PI * 2);
            ctx.fill();
          }

          // Draw cyber defensive shield if active!
          if (player.isShieldActive) {
            ctx.save();
            const shieldRadius = player.radius + 40;
            
            // Outer neon cyan glowing ring
            ctx.strokeStyle = "rgba(6, 182, 212, 0.85)";
            ctx.lineWidth = 3 + Math.sin(state.ticks / 4) * 1.5; // pulsating glow!
            ctx.shadowColor = "#22d3ee";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(player.x, player.y, shieldRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Translucent neon cyan filled field with hexagon wireframe grid overlay
            ctx.shadowBlur = 0; // reset shadow
            ctx.fillStyle = "rgba(6, 182, 212, 0.12)";
            ctx.beginPath();
            ctx.arc(player.x, player.y, shieldRadius, 0, Math.PI * 2);
            ctx.fill();

            // Hexagonal lines overlay
            ctx.strokeStyle = "rgba(34, 211, 238, 0.38)";
            ctx.lineWidth = 1.3;
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
              const hx1 = player.x + Math.cos(angle) * shieldRadius;
              const hy1 = player.y + Math.sin(angle) * shieldRadius;
              const hx2 = player.x + Math.cos(angle + Math.PI / 3) * shieldRadius;
              const hy2 = player.y + Math.sin(angle + Math.PI / 3) * shieldRadius;
              ctx.beginPath();
              ctx.moveTo(hx1, hy1);
              ctx.lineTo(hx2, hy2);
              ctx.stroke();

              // inner connector hubs to mecha body
              ctx.beginPath();
              ctx.moveTo(player.x, player.y);
              ctx.lineTo(hx1, hy1);
              ctx.strokeStyle = "rgba(34, 211, 238, 0.08)";
              ctx.stroke();
            }
            
            ctx.restore();
          }

          ctx.restore(); // Restore Mecha scaling matrix
        }
      }

      ctx.restore();

      if (
        stage === "BOSSBATTLE" &&
        robotSelectionRef.current?.robotId === "c2_932" &&
        (robotUpgrades.energy_shield || 0) > 0 &&
        robotSelectionRef.current.fullyUnlocked &&
        c2932SkillRef.current.fieldEndsAt > Date.now()
      ) {
        const remainingSeconds = Math.max(0, c2932SkillRef.current.fieldEndsAt - Date.now()) / 1000;
        ctx.save();
        ctx.fillStyle = "rgba(34, 211, 238, 0.13)";
        ctx.strokeStyle = "rgba(103, 232, 249, 0.95)";
        ctx.lineWidth = 4 + Math.sin(state.ticks / 4) * 1.5;
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(player.x, player.y, C2_932_FIELD_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#cffafe";
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`\u9632\u79a6\u529b\u5834 ${remainingSeconds.toFixed(1)}s`, player.x, player.y - C2_932_FIELD_RADIUS - 10);
        ctx.restore();
      }


      // G. Draw Particles
      state.particles.forEach((p) => {
        ctx.globalAlpha = p.alpha;
        if (p.text) {
          ctx.fillStyle = p.color;
          ctx.font = "bold 13px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          // High contrast dark stroke outline for flawless visibility against light/dark floors
          ctx.strokeStyle = "rgba(7, 8, 12, 0.9)";
          ctx.lineWidth = 3;
          ctx.strokeText(p.text, p.x, p.y);
          ctx.fillText(p.text, p.x, p.y);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1.0; // reset alpha

      ctx.restore(); // matches camera translate

      // ==========================================
      // H. REAL-TIME SUBTRACTIVE LIGHTING FOG OF WAR
      // ==========================================
      if (stage === "PLAYING") {
        ctx.save();
        // Use cached offscreen canvas to avoid expensive DOM allocations on every frame (60fps)
        if (!offscreenCanvasRef.current) {
          offscreenCanvasRef.current = document.createElement("canvas");
        }
        const maskCanvas = offscreenCanvasRef.current;
        if (maskCanvas.width !== canvas.width || maskCanvas.height !== canvas.height) {
          maskCanvas.width = canvas.width;
          maskCanvas.height = canvas.height;
        }
        const mctx = maskCanvas.getContext("2d");
        
        if (mctx) {
          // Clear cached canvas before redrawing
          mctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
          
          // Fill with darkness (changed from 0.94 opacity to 0.70 for a brighter, more playable screen)
          mctx.fillStyle = "rgba(7, 8, 12, 0.70)";
          mctx.fillRect(0, 0, canvas.width, canvas.height);

          // Subtraction mode - cut holes in dark fog
          mctx.globalCompositeOperation = "destination-out";

          // Cut hole around player light aura
          const camX = state.camera.x;
          const camY = state.camera.y;
          const px = player.x - camX;
          const py = player.y - camY;

          // Expanded light radii for brighter visuals
          const baseRadius = isHigh ? 330 : 180;
          const radGrad = mctx.createRadialGradient(px, py, 15, px, py, baseRadius);
          radGrad.addColorStop(0, "rgba(0,0,0,1)");
          radGrad.addColorStop(0.35, "rgba(0,0,0,0.85)");
          radGrad.addColorStop(1, "rgba(0,0,0,0)");
          
          mctx.fillStyle = radGrad;
          mctx.beginPath();
          mctx.arc(px, py, baseRadius, 0, Math.PI * 2);
          mctx.fill();

          // Cut extra sector cone if range_attack sweep is active and in High Mode
          const angle = dx === 0 && dy === 0
            ? Math.atan2(player.lastAimY, player.lastAimX)
            : Math.atan2(dy, dx);
          const lightAttackProfile = isHigh ? LIGHT_ATTACK_PROFILES.HIGH : LIGHT_ATTACK_PROFILES.LOW;
          const fanSize = lightAttackProfile.lightFanSize;
          const sweepDist = lightAttackProfile.lightRange;

          const sectorGrad = mctx.createRadialGradient(px, py, 10, px, py, sweepDist);
          sectorGrad.addColorStop(0, "rgba(0,0,0,1)");
          sectorGrad.addColorStop(0.5, "rgba(0,0,0,0.8)");
          sectorGrad.addColorStop(1, "rgba(0,0,0,0)");
          mctx.fillStyle = sectorGrad;

          mctx.beginPath();
          mctx.moveTo(px, py);
          mctx.arc(px, py, sweepDist, angle - fanSize/2, angle + fanSize/2);
          mctx.closePath();
          mctx.fill();

          // Draw the completed mask onto our visual canvas
          ctx.drawImage(maskCanvas, 0, 0);

          // Draw the true damage area as a white work-light fan. This makes the
          // difference between LOW and HIGH visible without overstating range.
          const attackRange = lightAttackProfile.range;
          const attackFanSize = lightAttackProfile.fanSize;
          const attackPulse = 0.72 + Math.sin(state.ticks * 0.16) * 0.16;
          const attackGradient = ctx.createRadialGradient(px, py, 12, px, py, attackRange);
          attackGradient.addColorStop(0, isHigh ? "rgba(255, 255, 255, 0.48)" : "rgba(255, 255, 255, 0.32)");
          attackGradient.addColorStop(0.62, isHigh ? "rgba(255, 255, 255, 0.24)" : "rgba(255, 255, 255, 0.16)");
          attackGradient.addColorStop(1, "rgba(255, 255, 255, 0.02)");

          ctx.save();
          ctx.globalAlpha = attackPulse;
          ctx.fillStyle = attackGradient;
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = isHigh ? 10 : 6;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.arc(px, py, attackRange, angle - attackFanSize / 2, angle + attackFanSize / 2);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }

      // Sync Score and Session Coins to React State at a controlled rate (throttled to avoid 60fps re-renders)
      if (state.ticks % 10 === 0) {
        if (state.lastScoreSynced !== state.score) {
          state.lastScoreSynced = state.score;
          setScore(state.score);
        }
        if (state.lastSessionCoinsSynced !== state.sessionCoins) {
          state.lastSessionCoinsSynced = state.sessionCoins;
          setSessionCoins(state.sessionCoins);
        }
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [stage, selectedChapter, batteryMode, weaponLevels, showUpgradeChoice, showTipModal, startTitleActive, bossIntroPhase]);

  // Handle Level-up/Success actions
  const handleVictory = () => {
    if (victoryPendingRef.current) return;
    victoryPendingRef.current = true;
    recordAction("bossDefeated");
    if (!bossOutcomeRecordedRef.current) {
      bossOutcomeRecordedRef.current = true;
      recordExhibitionBossOutcome(selectedChapter, "victory");
    }
    recordAction("stagesCleared");
    const feedbackState = engineRef.current as any;
    if (feedbackState.boss) {
      feedbackState.boss.hp = 0;
      applyDeathFeedback(feedbackState, feedbackState.boss, triggerSound, true);
    } else {
      triggerCameraShake(feedbackState, 18);
      triggerSound("bossDeath");
    }

    // Hold the final impact for a few frames before revealing the victory screen.
    window.setTimeout(() => {
      triggerSound("victory");
      setStage("VICTORY");

    // Unlock next chapter if available
    const nextCh = selectedChapter + 1;
    if (nextCh <= 6) {
      setUnlockedChapters((prev) => {
        if (!prev.includes(nextCh)) {
          const next = [...prev, nextCh].sort((a, b) => a - b);
          try {
            localStorage.setItem("squad_unlocked_chapters", JSON.stringify(next));
          } catch (e) {
            // fallback
          }
          return next;
        }
        return prev;
      });
    }

    // Award squad affection points +150 points to selected agent!
    setAffectionPoints((prev) => {
      const next = { ...prev };
      next[selectedAgent.id] = (next[selectedAgent.id] || 0) + 150;
      return next;
    });

    // Credit coins with clean chapter completion bonus multiplier
    const completionBonus = selectedChapter * 50 + 100;
    const totalAwarded = sessionCoins + completionBonus;
    setCoins((prev) => {
      const updated = prev + totalAwarded;
      localStorage.setItem("light_crew_coins", String(updated));
      return updated;
    });
    }, 140);
  };

  return (
    <div ref={gameRootRef} className="mission-game-shell fixed inset-0 bg-zinc-950/95 z-50 flex flex-col justify-between overflow-hidden font-mono text-zinc-100">
      <BossWarningTransition
        active={stage === "BOSS_WARNING"}
        onComplete={startBossBattle}
      />
      
      {/* 1. START SCREEN */}
      {stage === "START" && (
        <div className="flex-1 w-full overflow-hidden p-2 xs:p-3 sm:p-6 select-none animate-fade-in flex flex-col justify-center items-center">
          
          {/* Progress / Step indicator at the top */}
          <div className="w-full max-w-lg sm:max-w-3xl mx-auto mb-2 xs:mb-4 sm:mb-8 flex items-center justify-between px-2 xs:px-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${startStep >= 1 ? 'bg-amber-500 text-zinc-950 font-black' : 'bg-zinc-850 text-zinc-600'}`}>1</div>
              <span className={`text-[10px] sm:text-xs ${startStep === 1 ? 'text-amber-500 font-bold' : 'text-zinc-500 font-medium'}`}>故事背景</span>
            </div>
            <div className={`flex-1 h-0.5 mx-1.5 sm:mx-3 ${startStep >= 2 ? 'bg-amber-500/50' : 'bg-zinc-800'}`} />
            
            <div className="flex items-center gap-1 sm:gap-2">
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${startStep >= 2 ? 'bg-amber-500 text-zinc-950 font-black' : 'bg-zinc-850 text-zinc-600'}`}>2</div>
              <span className={`text-[10px] sm:text-xs ${startStep === 2 ? 'text-amber-500 font-bold' : 'text-zinc-500 font-medium'}`}>選擇特工</span>
            </div>
            <div className={`flex-1 h-0.5 mx-1.5 sm:mx-3 ${startStep >= 3 ? 'bg-amber-500/50' : 'bg-zinc-800'}`} />
            
            <div className="flex items-center gap-1 sm:gap-2">
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${startStep >= 3 ? 'bg-amber-500 text-zinc-950 font-black' : 'bg-zinc-850 text-zinc-600'}`}>3</div>
              <span className={`text-[10px] sm:text-xs ${startStep === 3 ? 'text-amber-500 font-bold' : 'text-zinc-500 font-medium'}`}>選擇關卡</span>
            </div>
          </div>

          <div className="w-full max-w-xl sm:max-w-3xl mx-auto bg-zinc-900/40 border border-zinc-800/80 p-3 xs:p-4 sm:p-6 rounded-lg shadow-xl backdrop-blur-sm">
            {/* STEP 1: Worldview & Storyboard Intro */}
            {startStep === 1 && (
              <div className="space-y-2 sm:space-y-4 animate-fade-in">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] sm:text-xs font-black uppercase tracking-wider">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>SQUAD ACTION GAME • STEP 1/3</span>
                </div>
                
                <img
                  src="https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/5.UI/Title.png"
                  alt="勇敢の燈燈小隊"
                  className="mx-auto w-full max-w-[460px] h-auto max-h-[16vh] sm:max-h-[20vh] object-contain object-center"
                  loading="eager"
                  draggable={false}
                />

                <p className="text-[10px] sm:text-xs text-zinc-400 leading-relaxed font-sans">
                  世界被<b>「Dark Core（黑暗核心）」</b>侵蝕，所有城市失去電源，陰影中滋生了吞噬光源的暗黑魔怪。
                  玩家扮演<b>「燈燈小隊」</b>，必須巧妙善用 SCI 高精密工業檢修燈，驅散四周蠕動的陰影生物，收集電池維持核心儲能，最後組裝成<b>「大型燈燈機器人」</b>強勢淨化章節 Boss！
                </p>

                {/* Quick Mechanics Guide */}
                <div className="bg-zinc-900/50 border border-zinc-800 p-2 sm:p-3 rounded-md space-y-1 sm:space-y-2 text-[10px] sm:text-[11px] text-zinc-300 font-sans">
                  <h3 className="font-bold text-amber-400 flex items-center gap-1 text-[10px] sm:text-[11px]">
                    <Lightbulb className="w-3.5 h-3.5" /> 核心操作秘笈
                  </h3>
                  <ul className="list-disc pl-3.5 space-y-0.5 sm:space-y-1 text-[9.5px] sm:text-[10.5px]">
                    <li><b>選單：</b>使用 <kbd className="px-1 bg-zinc-800 border border-zinc-700 text-white rounded font-mono text-[8px] sm:text-[9px]">方向鍵</kbd> 切換，<kbd className="px-1 bg-zinc-800 border border-zinc-700 text-white rounded font-mono text-[8px] sm:text-[9px]">Enter / Space</kbd> 確認。</li>
                    <li><b>移動：</b>使用 <kbd className="px-1 bg-zinc-800 border border-zinc-700 text-white rounded font-mono text-[8px] sm:text-[9px]">WASD</kbd> 鍵在全方向移動。</li>
                    <li><b>調光：</b>點擊或按下 <kbd className="px-1 bg-zinc-800 border border-zinc-700 text-white rounded font-mono text-[8px] sm:text-[9px]">Space 空白鍵</kbd> 切換 Low / High。</li>
                    <li><b>電力：</b>工作燈高亮度下極耗電，請收集 <b>綠色電池 🔋</b>。</li>
                    <li><b>收集：</b>拾取 <b>金色工具箱 💼</b> 收集工作燈組裝機甲！</li>
                  </ul>
                </div>

                <button 
                  onClick={() => { setStartStep(2); triggerSound("click"); }}
                  className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-[10px] sm:text-xs tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-transform rounded"
                >
                  <span>下一步：選擇出勤特工</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-950" />
                </button>
              </div>
            )}

            {/* STEP 2: Agent Selection */}
            {startStep === 2 && (
              <div className="space-y-4 sm:space-y-6 animate-fade-in">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] sm:text-sm font-black uppercase tracking-wider">
                  <Cpu className="w-4 h-4" />
                  <span>CHOOSE AGENT • STEP 2/3</span>
                </div>

                <div className="space-y-2 sm:space-y-3.5">
                  <h3 className="text-[11px] sm:text-sm font-bold text-zinc-400 flex items-center gap-1">
                    選擇出勤特工 (CHOOSE AGENT)
                  </h3>
                  <div className="grid grid-cols-3 gap-3 sm:gap-5">
                    {AGENTS.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => { setSelectedAgent(agent); triggerSound("click"); }}
                        className={`p-2 sm:p-4 border text-left flex flex-col justify-between items-center h-[140px] xs:h-[180px] sm:h-[240px] transition-all cursor-pointer rounded-lg relative overflow-hidden ${
                          selectedAgent.id === agent.id 
                            ? "bg-zinc-900/90 border-orange-500 shadow-lg shadow-orange-500/20 scale-102" 
                            : "bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50"
                        }`}
                      >
                        <div className="absolute top-1.5 right-2 sm:top-2 sm:right-3">
                          <span className="text-[9px] sm:text-[11px] text-zinc-500 font-black tracking-wider">{agent.id.toUpperCase()}</span>
                        </div>

                        <div className="flex-1 flex items-center justify-center mt-2 w-full">
                          <SpriteAnimator
                            src={walkSprites[agent.id as "claire" | "ethan" | "leo"].src}
                            totalFrames={6}
                            idleFrame={0}
                            animationFrames={[1, 2, 3, 4, 5]}
                            fps={3}
                            playing={true}
                            width={windowWidth >= 640 ? 110 : windowWidth >= 480 ? 90 : 76}
                          />
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Agent details */}
                  <div className="p-3 sm:p-4 bg-zinc-900/30 border border-zinc-800 text-[11px] sm:text-sm text-zinc-300 font-sans leading-relaxed min-h-[50px] sm:min-h-[70px] rounded-lg">
                    <div className="mb-1 text-[12px] sm:text-base">
                      <span className="text-white font-black">{selectedAgent.name}</span>
                      <span className="text-zinc-500 text-[10px] sm:text-xs ml-2 font-mono">({selectedAgent.role})</span>
                    </div>
                    <div>
                      <span className="font-bold text-orange-400">特工天賦技能：</span>
                      {selectedAgent.desc}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 pt-1">
                  <button
                    onClick={() => { setStartStep(1); triggerSound("click"); }}
                    className="px-5 py-3 sm:px-6 sm:py-3.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 text-[11px] sm:text-sm font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                  >
                    上一步
                  </button>
                  <button 
                    onClick={() => { setStartStep(3); triggerSound("click"); }}
                    className="flex-1 py-3 sm:py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-[11px] sm:text-sm tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-transform rounded-lg"
                  >
                    <span>下一步：選擇淨化戰區</span>
                    <ChevronRight className="w-4 h-4 text-zinc-950" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Chapter Selection */}
            {startStep === 3 && (
              <div className="space-y-3 sm:space-y-4 animate-fade-in">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] sm:text-xs font-black uppercase tracking-wider">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>CHOOSE CHAPTER • STEP 3/3</span>
                </div>

                {/* Chapter Selection */}
                <div className="space-y-1.5 sm:space-y-2">
                  <h3 className="text-[10px] sm:text-xs font-bold text-zinc-400 flex items-center gap-1">
                    選擇淨化戰區 (CHOOSE CHAPTER)
                  </h3>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2 max-h-[110px] sm:max-h-[160px] overflow-y-auto pr-1">
                    {CHAPTERS.map((ch) => {
                      const isLocked = !unlockedChapters.includes(ch.id);
                      return (
                        <button
                          key={ch.id}
                          disabled={isLocked}
                          onClick={() => { 
                            if (!isLocked) {
                              setSelectedChapter(ch.id); 
                              triggerSound("click"); 
                            }
                          }}
                          className={`p-1.5 sm:p-2.5 border text-left transition-all select-none ${
                            isLocked 
                              ? "bg-zinc-950/40 border-zinc-900/60 text-zinc-600 opacity-40 cursor-not-allowed" 
                              : selectedChapter === ch.id 
                                ? "bg-zinc-900 border-amber-500 cursor-pointer shadow-md shadow-amber-500/10" 
                                : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 cursor-pointer"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] sm:text-[10px] font-bold ${isLocked ? "text-zinc-600" : "text-zinc-400"}`}>{ch.subtitle}</span>
                            {isLocked ? (
                              <span className="text-[8px] sm:text-[9px] px-1 bg-zinc-900 border border-zinc-850 text-zinc-500 rounded flex items-center gap-0.5">
                                🔒 鎖定
                              </span>
                            ) : (
                              <span className="text-[8px] sm:text-[9px] px-1 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded">CH.{ch.id}</span>
                            )}
                          </div>
                          <h4 className={`text-[10px] sm:text-xs font-black mt-0.5 ${isLocked ? "text-zinc-500" : "text-white"}`}>{ch.name}</h4>
                          {isLocked && (
                            <div className="text-[8px] text-orange-500/90 font-bold font-sans mt-0.5">
                              需通關 CH.{ch.id - 1} 解鎖
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Notice about locked chapters matching screenshot */}
                  <div className="text-[9px] sm:text-[10px] text-orange-500 font-bold flex items-center gap-1 mt-0.5 px-1">
                    <span>⚠️ 需要解鎖第一章才可以玩第二章 (需依序通關解鎖)</span>
                  </div>

                  {/* Chapter details */}
                  <div className="p-2 sm:p-3 bg-zinc-900/40 border border-zinc-800/80 rounded">
                    <div className="text-[9px] sm:text-[10px] text-zinc-400">關卡情報與首領</div>
                    <div className="text-[10px] sm:text-xs font-bold text-white mt-0.5">
                      首領：{CHAPTERS[selectedChapter - 1].bossName}
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-zinc-400 mt-1 font-sans line-clamp-1 sm:line-clamp-none">
                      {CHAPTERS[selectedChapter - 1].desc}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center gap-4">
                    {/* Demo toggle */}
                    <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-2.5 py-1 rounded">
                      <span className="text-[10px] sm:text-xs font-sans text-zinc-400 font-medium">快速測試模式:</span>
                      <input 
                        type="checkbox" 
                        checked={isDemoMode}
                        onChange={(e) => setIsDemoMode(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-zinc-700 text-orange-500 accent-orange-500 cursor-pointer"
                      />
                      <span className="text-[10px] sm:text-[11px] font-bold text-orange-400">{isDemoMode ? "30秒快速" : "90秒常規"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => { setStartStep(2); triggerSound("click"); }}
                      className="px-4 py-2.5 sm:px-5 sm:py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors"
                    >
                      上一步
                    </button>
                    <button 
                      onClick={startGame}
                      disabled={!missionMapReady}
                      className={`flex-1 py-2.5 sm:py-3.5 text-zinc-950 font-black text-[10px] sm:text-xs tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform rounded ${
                        missionMapReady
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 cursor-pointer shadow-orange-500/20"
                          : "bg-zinc-700 text-zinc-400 cursor-wait shadow-none"
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-zinc-950" />
                      <span>{missionMapReady ? "出發驅散黑暗" : "載入地圖判定中…"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 2. SURVIVORS PLAYING STATE */}
      {stage === "PLAYING" && (
        <div className="flex-1 flex flex-col relative w-full h-full select-none" ref={containerRef}>
          {/* Streamlined, Compact Top Status Bar */}
          <div className="absolute left-2 right-2 top-2 z-30 flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-700/60 bg-zinc-950/75 px-3 py-1.5 shadow-xl backdrop-blur-md select-none">
            {/* Left Column: Player Status & Mini Stats */}
            <div className="flex items-center gap-2 xs:gap-3 flex-wrap">
              {/* Agent mini badge */}
              <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800/60 rounded px-2 py-1">
                <div className="scale-75 -mx-1.5 flex-shrink-0">
                  <SpriteAnimator
                    src={walkSprites[selectedAgent.id as "claire" | "ethan" | "leo"].src}
                    totalFrames={6}
                    idleFrame={0}
                    animationFrames={[1, 2, 3, 4, 5]}
                    fps={7}
                    playing={true}
                    width={28}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-200 leading-none">{selectedAgent.name}</span>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {Array.from({ length: maxHp }).map((_, i) => (
                      <Heart 
                        key={i} 
                        className={`w-2.5 h-2.5 ${
                          i < hp ? "text-rose-500 fill-rose-500" : "text-zinc-800"
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Coins & Score Badges */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 bg-zinc-900/80 border border-zinc-800/60 rounded px-2 py-1 text-[10px] font-mono">
                  <span>🪙</span>
                  <span className="font-bold text-amber-400">{sessionCoins}</span>
                </div>
                <div className="flex items-center gap-1 bg-zinc-900/80 border border-zinc-800/60 rounded px-2 py-1 text-[10px] font-mono">
                  <Award className="w-3 h-3 text-orange-400" />
                  <span className="font-bold text-zinc-300">{score}</span>
                </div>
              </div>

              {/* Exp Bar */}
              <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800/60 rounded px-2 py-1 text-[10px]">
                <span className="text-zinc-500 font-bold">LV.{level}</span>
                <div className="w-12 bg-zinc-950 h-1 rounded-full overflow-hidden">
                  <div className="bg-cyan-400 h-full transition-all duration-300" style={{ width: `${Math.min(100, (exp/expNeeded)*100)}%` }} />
                </div>
              </div>
            </div>

            {/* Center Column: Timer Countdown */}
            <div className="flex items-center justify-center">
              <div className="px-3 py-1 bg-zinc-900/90 border border-zinc-800 rounded flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider hidden sm:inline">核心集結倒數:</span>
                <span className="text-xs sm:text-sm font-black text-white tracking-widest font-mono">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                </span>
              </div>
            </div>

            {/* Right Column: Battery Meter & Mode Controls */}
            <div className="flex items-center gap-2">
              {/* Battery Charge */}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900/80 border border-zinc-800/60 rounded text-[10px] font-mono">
                <span className="text-zinc-500">🔋</span>
                <span className="font-bold text-zinc-300">{batteryPercent}%</span>
                <div className="w-8 bg-zinc-950 h-1 rounded-full overflow-hidden hidden xs:block">
                  <div 
                    className={`h-full ${
                      batteryPercent > 50 ? "bg-emerald-500" : batteryPercent > 20 ? "bg-amber-500" : "bg-rose-600 animate-pulse"
                    }`} 
                    style={{ width: `${batteryPercent}%` }} 
                  />
                </div>
              </div>

              {/* Battery Mode Switch */}
              <button 
                onClick={toggleBatteryMode}
                className={`px-2 py-1 text-[9px] font-bold uppercase rounded border cursor-pointer transition-all flex items-center gap-1 ${
                  batteryMode === "HIGH" 
                    ? "bg-amber-500 text-zinc-950 border-amber-400 font-black" 
                    : "bg-zinc-900 text-zinc-400 border-zinc-800"
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>{batteryMode}</span>
              </button>

              {/* Virtual Control Switch */}
              <button 
                onClick={() => {
                  triggerSound("click");
                  setShowTouchControls(!showTouchControls);
                }}
                className={`px-2 py-1 text-[9px] font-bold uppercase rounded border cursor-pointer transition-all flex items-center gap-1 ${
                  showTouchControls 
                    ? "bg-orange-500 text-zinc-950 border-orange-400" 
                    : "bg-zinc-900 text-zinc-500 border-zinc-800"
                }`}
              >
                <span>搖桿</span>
              </button>
              <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded border border-zinc-700 bg-black/35 text-zinc-400 hover:border-orange-500 hover:text-orange-300" aria-label="離開任務"><X className="h-3.5 w-3.5" /></button>
            </div>
          </div>

          {/* Core Interactive Web Game Canvas (Responsive vertical / horizontal) */}
          <div className="flex-1 w-full bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
            <div
              className="relative flex h-full w-full items-center justify-center"
              style={{
                width: isMobile
                  ? "100%"
                  : "min(1400px, 100%, calc(100vh * 14 / 9))"
              }}
            >
              <canvas 
                ref={canvasRef} 
                tabIndex={-1}
                width={isMobile ? 500 : 1400}
                height={isMobile ? 750 : 900}
                className={
                  isMobile 
                    ? "w-full max-w-[420px] aspect-[5/7.5] border border-zinc-800 bg-zinc-950 shadow-2xl rounded" 
                    : "h-auto w-full max-h-full max-w-[1400px] aspect-[14/9] border border-zinc-800 bg-zinc-950 shadow-2xl rounded"
                }
              />
            </div>
          </div>

          {/* Bottom Game Controls Dock (Positioned at the very bottom, non-blocking) */}
          {showTouchControls && (
            <div className="absolute bottom-2 left-2 right-2 z-30 flex flex-col items-center justify-between gap-3 rounded border border-zinc-700/60 bg-zinc-950/75 p-2 shadow-xl backdrop-blur-md xs:flex-row sm:px-3">
              {/* Left Side: Joystick D-pad */}
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider hidden sm:block">移動方向 Control:</span>
                <div className="flex items-center gap-1 select-none">
                  {/* Left */}
                  <button
                    onMouseDown={() => { keysRef.current["arrowleft"] = true; }}
                    onMouseUp={() => { keysRef.current["arrowleft"] = false; }}
                    onMouseLeave={() => { keysRef.current["arrowleft"] = false; }}
                    onTouchStart={(e) => { e.preventDefault(); keysRef.current["arrowleft"] = true; }}
                    onTouchEnd={(e) => { e.preventDefault(); keysRef.current["arrowleft"] = false; }}
                    className="w-12 h-12 bg-zinc-900 border border-orange-500/50 hover:border-orange-500 active:bg-orange-500 active:text-zinc-950 text-orange-400 flex items-center justify-center font-bold text-lg rounded shadow transition-all cursor-pointer"
                  >
                    ◀
                  </button>
                  <div className="flex flex-col gap-1">
                    {/* Up */}
                    <button
                      onMouseDown={() => { keysRef.current["arrowup"] = true; }}
                      onMouseUp={() => { keysRef.current["arrowup"] = false; }}
                      onMouseLeave={() => { keysRef.current["arrowup"] = false; }}
                      onTouchStart={(e) => { e.preventDefault(); keysRef.current["arrowup"] = true; }}
                      onTouchEnd={(e) => { e.preventDefault(); keysRef.current["arrowup"] = false; }}
                      className="w-12 h-12 bg-zinc-900 border border-orange-500/50 hover:border-orange-500 active:bg-orange-500 active:text-zinc-950 text-orange-400 flex items-center justify-center font-bold text-lg rounded-t-lg shadow transition-all cursor-pointer"
                    >
                      ▲
                    </button>
                    {/* Down */}
                    <button
                      onMouseDown={() => { keysRef.current["arrowdown"] = true; }}
                      onMouseUp={() => { keysRef.current["arrowdown"] = false; }}
                      onMouseLeave={() => { keysRef.current["arrowdown"] = false; }}
                      onTouchStart={(e) => { e.preventDefault(); keysRef.current["arrowdown"] = true; }}
                      onTouchEnd={(e) => { e.preventDefault(); keysRef.current["arrowdown"] = false; }}
                      className="w-12 h-12 bg-zinc-900 border border-orange-500/50 hover:border-orange-500 active:bg-orange-500 active:text-zinc-950 text-orange-400 flex items-center justify-center font-bold text-lg rounded-b-lg shadow transition-all cursor-pointer"
                    >
                      ▼
                    </button>
                  </div>
                  {/* Right */}
                  <button
                    onMouseDown={() => { keysRef.current["arrowright"] = true; }}
                    onMouseUp={() => { keysRef.current["arrowright"] = false; }}
                    onMouseLeave={() => { keysRef.current["arrowright"] = false; }}
                    onTouchStart={(e) => { e.preventDefault(); keysRef.current["arrowright"] = true; }}
                    onTouchEnd={(e) => { e.preventDefault(); keysRef.current["arrowright"] = false; }}
                    className="w-12 h-12 bg-zinc-900 border border-orange-500/50 hover:border-orange-500 active:bg-orange-500 active:text-zinc-950 text-orange-400 flex items-center justify-center font-bold text-lg rounded shadow transition-all cursor-pointer"
                  >
                    ▶
                  </button>
                </div>
              </div>

              {/* Center Help tips */}
              <div className="hidden md:block text-[11px] text-zinc-500 max-w-sm text-center leading-relaxed">
                💡 <span className="text-zinc-400">行動提示：</span>利用移動方向調整強光方向，收集金色手提箱 💼 升級新工作燈！
              </div>

              {/* Right Side Mode Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider hidden sm:block">強度切換 Intensity:</span>
                <button
                  onTouchStart={(e) => { e.preventDefault(); toggleBatteryMode(); }}
                  onClick={() => { toggleBatteryMode(); }}
                  className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 active:from-amber-400 active:to-orange-500 hover:brightness-110 text-zinc-950 font-black text-xs tracking-wider rounded border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer flex items-center gap-2 select-none"
                >
                  <Zap className="w-4 h-4 fill-zinc-950 text-zinc-950 animate-pulse" />
                  <span>切換強光/省電模式</span>
                </button>
                <button
                  onClick={startGame}
                  className="px-4 py-3 bg-rose-950 hover:bg-rose-900 border border-rose-500 text-rose-400 font-bold text-xs tracking-wider rounded cursor-pointer flex items-center gap-1.5 select-none"
                  title="重新開始此關卡"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重新挑戰</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Mobile Control Toolbar for touch fallback */}
          <div className="absolute bottom-4 inset-x-0 p-4 flex items-center justify-between pointer-events-none z-10 opacity-0 select-none">
            {/* Quick tips */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 max-w-xs text-[10px] text-zinc-400 font-sans pointer-events-auto leading-relaxed">
              💡 <span className="text-zinc-200">提示：</span>利用移動方向調整 range_attack 扇形強光方向。收集金色手提箱 💼 會直接升級或增加新的工作燈零件！
            </div>

            {/* Score */}
            <div className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded pointer-events-auto flex items-center gap-1.5 text-xs">
              <Award className="w-4 h-4 text-orange-400" />
              <span> score: <strong className="text-white font-bold font-mono">{score}</strong></span>
            </div>
          </div>

          {/* Upgrade Choice Dialog (Blocking Roguelike Choice) */}
          {showUpgradeChoice && (
            <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
              <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg p-3.5 sm:p-5 rounded space-y-3 sm:space-y-4 animate-scale-up">
                <div className="border-b border-zinc-800 pb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 sm:w-5 h-5 text-amber-500" />
                    <span className="font-extrabold text-xs sm:text-sm text-white tracking-widest uppercase">
                      SCI SYSTEM LEVEL UP (科技升級)
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-zinc-400 font-mono">LEVEL {level}</div>
                </div>

                <p className="text-[10px] sm:text-xs text-zinc-400 leading-relaxed font-sans">
                  獲得了足夠的光子核心！請選擇一項 SCI 工業照明科技進行升級：
                </p>

                <div className="flex w-full flex-col gap-1.5 sm:gap-2.5" role="listbox" aria-label="科技升級選項">
                  {upgradeChoices.map((choice, i) => (
                    <button
                      key={choice.id}
                      onClick={() => handleSelectUpgrade(choice)}
                      onMouseEnter={() => setSelectedUpgradeIndex(i)}
                      onFocus={() => setSelectedUpgradeIndex(i)}
                      role="option"
                      aria-selected={selectedUpgradeIndex === i}
                      aria-current={selectedUpgradeIndex === i ? "true" : undefined}
                      className={`flex w-full shrink-0 items-center gap-2 border p-2 text-left transition-all duration-200 cursor-pointer sm:gap-3.5 sm:p-3 group rounded-none ${
                        selectedUpgradeIndex === i
                          ? "bg-orange-500/10 border-orange-400 shadow-[inset_3px_0_0_#fb923c,0_0_14px_rgba(249,115,22,0.12)]"
                          : "bg-zinc-950/80 border-zinc-800 hover:border-orange-500/80"
                      }`}
                    >
                      <div className={`text-xl sm:text-2xl p-1.5 sm:p-2 bg-zinc-900 border rounded group-hover:bg-orange-500/10 group-hover:border-orange-500/30 transition-colors ${
                        selectedUpgradeIndex === i ? "border-orange-500/60" : "border-zinc-800"
                      }`}>
                        {choice.icon}
                      </div>
                      <div className="flex-1">
                        <div className={`text-[11px] sm:text-xs font-black group-hover:text-orange-400 transition-colors ${
                          selectedUpgradeIndex === i ? "text-orange-300" : "text-white"
                        }`}>{choice.name}</div>
                        <div className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5 font-sans leading-tight">{choice.desc}</div>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 group-hover:text-orange-400 transition-colors ${
                        selectedUpgradeIndex === i ? "text-orange-400" : "text-zinc-600"
                      }`} />
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-3 border-t border-zinc-800 pt-2 text-[9px] sm:text-[10px] font-mono text-zinc-500">
                  <span><b className="text-orange-400">↑ ↓</b> 切換選項</span>
                  <span><b className="text-orange-400">SPACE</b> 確認升級</span>
                </div>
              </div>
            </div>
          )}

          {/* Start Game Tips Modal Overlay */}
          {showTipModal && (
            <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-orange-500/80 max-w-sm w-full p-5 sm:p-6 rounded text-center animate-scale-up space-y-4 shadow-xl shadow-orange-500/10">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-4xl animate-bounce">💡</div>
                  <h3 className="text-base sm:text-lg font-black text-orange-400 tracking-wider">
                    【 行動任務提示 】
                  </h3>
                </div>
                <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded text-[11px] sm:text-xs text-zinc-300 leading-relaxed text-left space-y-2 font-sans">
                  <p>
                    • 利用移動方向調整角色的標準照明攻擊，驅散陰影怪物。
                  </p>
                  <p>
                    • 收集改裝素材並帶回實驗室；素材不會在關卡中直接改變裝備。
                  </p>
                </div>
                <button
                  type="button"
                  autoFocus
                  aria-keyshortcuts="Enter Space"
                  onClick={handleConfirmTip}
                  className="px-6 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-xs tracking-widest uppercase rounded shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer w-full"
                >
                  確定開始 <span className="ml-1 text-[9px] opacity-70">[ ENTER / SPACE ]</span>
                </button>
              </div>
            </div>
          )}

          {/* START Game Countdown / Title Overlay */}
          {startTitleActive && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none select-none bg-zinc-950/40 backdrop-blur-[1px]">
              <div className="text-center animate-scale-up">
                <h1 className="text-6xl sm:text-8xl font-black text-orange-500 tracking-widest drop-shadow-[0_0_20px_rgba(249,115,22,0.8)] animate-pulse">
                  START!
                </h1>
                <p className="text-[10px] sm:text-xs text-zinc-400 tracking-widest uppercase mt-2 font-bold font-mono">
                  ACTION PROTOCOL ACTIVE
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2.5 MODIFICATION MATERIAL REPORT */}
      {stage === "REPORT" && (
        <div className="flex-1 w-full overflow-hidden p-3 sm:p-6 select-none">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-emerald-500/25 bg-zinc-950/95 p-4 sm:p-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300"><Award className="h-4 w-4" />改裝素材回收完成</div>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-4xl">C2-932 素材結算</h2>
              <p className="mt-2 text-xs text-zinc-400">本次取得的素材不會在關卡中直接改變機器人；返回實驗室後才能安裝或升級模組。</p>
            </div>

            <div className="mt-4 grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-4">
              {MATERIAL_IDS.map((id) => (
                <div key={id} className="flex min-h-20 flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/55 p-3 text-center">
                  <span className="text-2xl" style={{ color: MATERIAL_CONFIG[id].color }}>{MATERIAL_CONFIG[id].icon}</span>
                  <span className="mt-1 text-xs font-bold text-zinc-300">{MATERIAL_CONFIG[id].name}</span>
                  <b className="mt-1 text-xl text-white">× {collectedMaterials[id]}</b>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                onClick={() => { bankCollectedMaterials(); onReturnToLab(selectedChapter); }}
                className="min-h-12 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 text-sm font-black text-cyan-200"
              >
                儲存素材並返回實驗室
              </button>
              <button
                onClick={() => { bankCollectedMaterials(); startBossWarning(); }}
                className="min-h-12 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 text-sm font-black text-zinc-950"
              >
                使用目前實驗室改裝繼續挑戰
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. C2-932 INSTALLED LOADOUT */}
      {stage === "ASSEMBLY" && (
        <div className="flex-1 w-full overflow-hidden p-3 sm:p-6">
          <div className="mx-auto grid h-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-cyan-500/25 bg-zinc-950/95 md:grid-cols-[38%_1fr]">
            <div className="flex items-center justify-center border-b border-zinc-800 bg-cyan-950/15 p-4 md:border-b-0 md:border-r">
              <img src={ROBOT_CONFIG.c2_932.portrait} alt="C2-932" className="h-full max-h-[420px] w-full object-contain [image-rendering:pixelated]" />
            </div>
            <div className="flex min-h-0 flex-col p-4 sm:p-6">
              <div><span className="text-xs font-black tracking-widest text-cyan-400">LAB LOADOUT</span><h2 className="text-3xl font-black text-white">C2-932 已安裝改裝</h2><p className="mt-1 text-xs text-zinc-400">Boss 戰只會套用出發前已在實驗室完成的改裝。</p></div>
              <div className="mt-4 grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto">
                {ROBOT_UPGRADE_IDS.map((id) => (
                  <div key={id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                    <div className="text-xs font-bold text-zinc-300">{ROBOT_UPGRADE_CONFIG[id].icon} {ROBOT_UPGRADE_CONFIG[id].name}</div>
                    <div className="mt-1 text-sm font-black text-cyan-300">Lv.{robotUpgrades[id]}</div>
                  </div>
                ))}
              </div>
              <button onClick={prepareRobotDeployment} className="mt-4 min-h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-sm font-black text-zinc-950">確認 C2-932 出擊配置</button>
            </div>
          </div>
        </div>
      )}

      {stage === "ROBOT_DEPLOYMENT" && robotSelection && (
        <div className="flex-1 w-full min-h-0 overflow-hidden bg-zinc-950 p-3 sm:p-6">
          <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-cyan-500/35 bg-zinc-950 md:flex-row">
            <div className="flex h-[38vh] items-center justify-center border-b border-cyan-500/20 bg-cyan-950/20 p-4 md:h-full md:w-[43%] md:border-b-0 md:border-r">
              <img src={ROBOT_CONFIG.c2_932.portrait} alt="C2-932" className="h-full w-full object-contain [image-rendering:pixelated]" />
            </div>
            <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-7">
              <span className="text-xs font-black tracking-[0.25em] text-cyan-400">ROBOT DEPLOYMENT</span>
              <h2 className="mt-1 text-4xl font-black text-white">C2-932</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">{ROBOT_CONFIG.c2_932.description}</p>
              <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                <h3 className="text-xs font-black text-cyan-300">實驗室改裝狀態</h3>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {ROBOT_UPGRADE_IDS.filter((id) => robotUpgrades[id] > 0).map((id) => (
                    <div key={id} className="rounded border border-zinc-700 bg-zinc-950 p-2 text-xs text-zinc-300">{ROBOT_UPGRADE_CONFIG[id].name} <b className="text-cyan-300">Lv.{robotUpgrades[id]}</b></div>
                  ))}
                </div>
                {!robotSelection.fullyUnlocked && <p className="mt-3 text-xs text-amber-300">尚未安裝改裝模組，將使用 C2-932 標準配置出擊。</p>}
              </div>
              <button onClick={startBossWarning} className="mt-4 min-h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-base font-black text-zinc-950">確定出擊</button>
            </div>
          </div>
        </div>
      )}
      {/* 4. BOSS BATTLE STATE */}
      {stage === "BOSSBATTLE" && (
        <div className="flex-1 flex flex-col relative w-full h-full select-none">
          {/* Streamlined, Compact Top Status Bar for Boss Battle */}
          <div className="absolute left-2 right-2 top-2 z-30 flex flex-wrap items-center justify-between gap-3 rounded border border-zinc-700/60 bg-zinc-950/75 px-3 py-2 shadow-xl backdrop-blur-md select-none">
            {/* Left Side: Encounter info, Mecha HP & Coins */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded px-1.5 py-0.5">
                <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse" />
                <span className="uppercase tracking-wider font-sans">首領: {bossActiveName}</span>
              </div>
              
              {/* Mecha HP Mini Badge */}
              <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800/80 rounded px-1.5 py-0.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span className="text-[9px] text-zinc-400 font-bold hidden xs:inline">MECHA HP</span>
                <span className="text-xs font-black text-rose-500 font-mono ml-0.5">{hp} / {maxHp}</span>
              </div>

              {/* Coins Mini Badge */}
              <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800/80 rounded px-1.5 py-0.5 text-[11px] font-mono">
                <span>🪙</span>
                <span className="font-bold text-amber-400">{sessionCoins}</span>
              </div>
            </div>

            {/* Center: Boss HP Progress bar */}
            <div className="flex-1 max-w-xs sm:max-w-sm px-1.5">
              <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400 mb-0.5">
                <span className="font-bold text-rose-400/90 tracking-wider">BOSS HEALTH</span>
                <span className="font-black text-rose-500">{bossHp} / {bossMaxHp} HP</span>
              </div>
              <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-900">
                <div className="bg-gradient-to-r from-rose-700 to-rose-500 h-full transition-all duration-150" style={{ width: `${Math.max(0, (bossHp/bossMaxHp)*100)}%` }} />
              </div>
            </div>

            {/* Right Side: Virtual Control Switch */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => {
                  triggerSound("click");
                  setShowTouchControls(!showTouchControls);
                }}
                className={`px-2 py-1 text-[10px] font-black uppercase rounded border cursor-pointer transition-all flex items-center gap-1.5 ${
                  showTouchControls 
                    ? "bg-orange-500 text-zinc-950 border-orange-400 shadow-md shadow-orange-500/20" 
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                }`}
              >
                <span>搖桿</span>
              </button>
              <button
                onClick={startBossBattle}
                className="px-2 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-500 text-rose-400 text-[10px] font-bold uppercase rounded cursor-pointer flex items-center gap-1"
                title="重新開始挑戰"
              >
                <RotateCcw className="w-3 h-3" />
                <span>重新挑戰</span>
              </button>
              <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded border border-zinc-700 bg-black/35 text-zinc-400 hover:border-rose-500 hover:text-rose-300" aria-label="離開魔王戰"><X className="h-3.5 w-3.5" /></button>
            </div>
          </div>

          {/* Expanded Boss Arena */}
          <div className="absolute inset-0 w-full bg-zinc-950 flex flex-col items-center justify-center overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center relative">
                <canvas
                  ref={canvasRef}
                  width={isMobile ? 500 : 1400}
                  height={isMobile ? 750 : 700}
                  className={
                    isMobile
                      ? "w-full max-w-[420px] aspect-[5/7.5] border border-zinc-800 bg-zinc-950 shadow-2xl rounded"
                      : "w-full h-auto max-w-[1400px] max-h-full border border-zinc-800 bg-zinc-950 aspect-[2/1] shadow-2xl rounded"
                  }
                />
                {bossIntroPhase && (
                  <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center overflow-hidden bg-black/20 backdrop-blur-[0.5px]">
                    {bossIntroPhase === "entrance" ? (
                      <div className="absolute inset-x-0 top-[14%] text-center">
                        <p className="animate-pulse font-mono text-xs font-black tracking-[0.45em] text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,.9)] sm:text-base">BOSS SIGNAL DETECTED</p>
                        <div className="mx-auto mt-2 h-px w-48 animate-pulse bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
                      </div>
                    ) : (
                      <div className="text-center animate-scale-up">
                        <h1 className="text-6xl font-black tracking-[0.16em] text-orange-400 drop-shadow-[0_0_26px_rgba(249,115,22,.95)] sm:text-9xl">START!</h1>
                        <p className="mt-2 font-mono text-[10px] font-bold tracking-[0.35em] text-zinc-200 sm:text-sm">BOSS COMBAT PROTOCOL ACTIVE</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Game Controls Dock for Boss Battle */}
          <div className="absolute bottom-2 left-2 right-2 z-30 rounded border border-zinc-700/60 bg-zinc-950/75 p-2.5 shadow-xl backdrop-blur-md sm:p-3">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-stretch justify-between gap-3 sm:gap-4">
              
              {/* Controls Section */}
              <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                {/* Left Side: Joystick D-pad */}
                {showTouchControls ? (
                  <div className="flex items-center gap-2 select-none flex-shrink-0 bg-zinc-900/40 p-1.5 rounded-lg border border-zinc-900">
                    <span className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider hidden lg:block">移動 Control:</span>
                    <div className="flex items-center gap-1">
                      {/* Left */}
                      <button
                        onMouseDown={() => { keysRef.current["arrowleft"] = true; }}
                        onMouseUp={() => { keysRef.current["arrowleft"] = false; }}
                        onMouseLeave={() => { keysRef.current["arrowleft"] = false; }}
                        onTouchStart={(e) => { e.preventDefault(); keysRef.current["arrowleft"] = true; }}
                        onTouchEnd={(e) => { e.preventDefault(); keysRef.current["arrowleft"] = false; }}
                        className="w-10 h-10 bg-zinc-950 border border-orange-500/25 hover:border-orange-500 active:bg-orange-500 active:text-zinc-950 text-orange-400 flex items-center justify-center font-bold text-sm rounded shadow transition-all cursor-pointer"
                      >
                        ◀
                      </button>
                      <div className="flex flex-col gap-1">
                        {/* Up */}
                        <button
                          onMouseDown={() => { keysRef.current["arrowup"] = true; }}
                          onMouseUp={() => { keysRef.current["arrowup"] = false; }}
                          onMouseLeave={() => { keysRef.current["arrowup"] = false; }}
                          onTouchStart={(e) => { e.preventDefault(); keysRef.current["arrowup"] = true; }}
                          onTouchEnd={(e) => { e.preventDefault(); keysRef.current["arrowup"] = false; }}
                          className="w-10 h-10 bg-zinc-950 border border-orange-500/25 hover:border-orange-500 active:bg-orange-500 active:text-zinc-950 text-orange-400 flex items-center justify-center font-bold text-sm rounded-t-lg shadow transition-all cursor-pointer"
                        >
                          ▲
                        </button>
                        {/* Down */}
                        <button
                          onMouseDown={() => { keysRef.current["arrowdown"] = true; }}
                          onMouseUp={() => { keysRef.current["arrowdown"] = false; }}
                          onMouseLeave={() => { keysRef.current["arrowdown"] = false; }}
                          onTouchStart={(e) => { e.preventDefault(); keysRef.current["arrowdown"] = true; }}
                          onTouchEnd={(e) => { e.preventDefault(); keysRef.current["arrowdown"] = false; }}
                          className="w-10 h-10 bg-zinc-955 border border-orange-500/25 hover:border-orange-500 active:bg-orange-500 active:text-zinc-950 text-orange-400 flex items-center justify-center font-bold text-sm rounded-b-lg shadow transition-all cursor-pointer"
                        >
                          ▼
                        </button>
                      </div>
                      {/* Right */}
                      <button
                        onMouseDown={() => { keysRef.current["arrowright"] = true; }}
                        onMouseUp={() => { keysRef.current["arrowright"] = false; }}
                        onMouseLeave={() => { keysRef.current["arrowright"] = false; }}
                        onTouchStart={(e) => { e.preventDefault(); keysRef.current["arrowright"] = true; }}
                        onTouchEnd={(e) => { e.preventDefault(); keysRef.current["arrowright"] = false; }}
                        className="w-10 h-10 bg-zinc-950 border border-orange-500/25 hover:border-orange-500 active:bg-orange-500 active:text-zinc-950 text-orange-400 flex items-center justify-center font-bold text-sm rounded shadow transition-all cursor-pointer"
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="hidden sm:flex flex-col text-left font-mono text-[9px] text-zinc-500 border border-zinc-850/50 p-2 bg-zinc-900/35 rounded max-w-[150px] flex-shrink-0">
                    <div className="text-zinc-400 font-bold mb-0.5">WASD / ◀▲▼▶</div>
                    <div>鍵盤方向鍵控制機甲移動，避開首領攻擊</div>
                  </div>
                )}

                {/* Mecha Active Combat Actions */}
                <div className="flex-1 w-full flex flex-col gap-2">
                  <div className="grid grid-cols-4 gap-1.5 w-full">
                    {/* Z: Punch */}
                    <button
                      onMouseDown={() => { keysRef.current["z"] = true; }}
                      onMouseUp={() => { keysRef.current["z"] = false; }}
                      onMouseLeave={() => { keysRef.current["z"] = false; }}
                      onTouchStart={(e) => { e.preventDefault(); keysRef.current["z"] = true; }}
                      onTouchEnd={(e) => { e.preventDefault(); keysRef.current["z"] = false; }}
                      className="bg-zinc-900 hover:bg-zinc-850 border border-orange-500/40 hover:border-orange-500 rounded px-1.5 py-1 flex flex-col items-center justify-center gap-0.5 transition-all group cursor-pointer active:scale-95 text-white"
                    >
                      <div className="text-sm">👊</div>
                      <div className="text-[8px] xs:text-[9px] font-extrabold text-orange-400">重拳 [Z]</div>
                      <div className="text-[8px] text-zinc-500 hidden xs:block">近戰打擊</div>
                    </button>

                    {/* X: Defend */}
                    <button
                      onMouseDown={() => { keysRef.current["x"] = true; }}
                      onMouseUp={() => { keysRef.current["x"] = false; }}
                      onMouseLeave={() => { keysRef.current["x"] = false; }}
                      onTouchStart={(e) => { e.preventDefault(); keysRef.current["x"] = true; }}
                      onTouchEnd={(e) => { e.preventDefault(); keysRef.current["x"] = false; }}
                      className={`border rounded px-1.5 py-1 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-95 text-white ${
                        mechaActiveShield 
                          ? "bg-cyan-950 border-cyan-400 shadow shadow-cyan-500/10 text-cyan-300 scale-102 font-black" 
                          : "bg-zinc-900 border-cyan-500/30 hover:border-cyan-400 hover:bg-zinc-850"
                      }`}
                    >
                      <div className="text-sm">🛡️</div>
                      <div className="text-[8px] xs:text-[9px] font-extrabold text-cyan-400">防禦 [X]</div>
                      <div className="text-[8px] text-zinc-500 hidden xs:block">
                        {mechaShieldBroken ? "💥 損壞!" : `護盾 ${mechaShieldDurability}/4`}
                      </div>
                    </button>

                    {/* C: Laser */}
                    <button
                      onMouseDown={() => { keysRef.current["c"] = true; }}
                      onMouseUp={() => { keysRef.current["c"] = false; }}
                      onMouseLeave={() => { keysRef.current["c"] = false; }}
                      onTouchStart={(e) => { e.preventDefault(); keysRef.current["c"] = true; }}
                      onTouchEnd={(e) => { e.preventDefault(); keysRef.current["c"] = false; }}
                      className="bg-zinc-900 hover:bg-zinc-850 border border-sky-500/40 hover:border-sky-400 rounded px-1.5 py-1 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-95 text-white"
                    >
                      <div className="text-sm text-sky-400">⚡</div>
                      <div className="text-[8px] xs:text-[9px] font-extrabold text-sky-400">雷射 [C]</div>
                      <div className="text-[8px] text-zinc-500 hidden xs:block">
                        {Math.floor(mechaLaserBattery)}% 電量
                      </div>
                    </button>

                    {/* V: Ultimate */}
                    <button
                      onMouseDown={() => { keysRef.current["v"] = true; }}
                      onMouseUp={() => { keysRef.current["v"] = false; }}
                      onMouseLeave={() => { keysRef.current["v"] = false; }}
                      onTouchStart={(e) => { e.preventDefault(); keysRef.current["v"] = true; }}
                      onTouchEnd={(e) => { e.preventDefault(); keysRef.current["v"] = false; }}
                      disabled={mechaUltEnergy < 100}
                      className={`border rounded px-1.5 py-1 flex flex-col items-center justify-center gap-0.5 transition-all text-white ${
                        mechaUltEnergy >= 100 
                          ? "bg-fuchsia-950 border-fuchsia-500 hover:bg-fuchsia-900 text-fuchsia-300 animate-pulse shadow shadow-fuchsia-500/20 cursor-pointer active:scale-95" 
                          : "bg-zinc-950 border-zinc-850 text-zinc-600 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <div className="text-sm">💥</div>
                      <div className="text-[8px] xs:text-[9px] font-extrabold text-fuchsia-400">大招 [V]</div>
                      <div className="text-[8px] text-zinc-500 hidden xs:block">超載爆裂</div>
                    </button>
                  </div>

                  {/* Ultimate Charging Progress Bar */}
                  <div className="w-full bg-zinc-900 border border-zinc-850 h-5 rounded overflow-hidden flex items-center relative select-none">
                    <div 
                      className={`h-full transition-all duration-100 ${
                        mechaUltEnergy >= 100 
                          ? "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 animate-pulse" 
                          : "bg-gradient-to-r from-orange-500 to-amber-500"
                      }`}
                      style={{ width: `${mechaUltEnergy}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[8px] sm:text-[9px] font-black tracking-widest uppercase text-white drop-shadow">
                      {mechaUltEnergy >= 100 ? (
                        <span className="animate-bounce text-fuchsia-200">💥 READY (超載核心已蓄滿！按 V 或點擊釋放大招) 💥</span>
                      ) : (
                        <span>機甲大招能量: {mechaUltEnergy}% (造成傷害加速充能)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side Column: Robot Telemetry (Visible on large screens, hides on mobile to give maximum height to the canvas!) */}
              <div className="hidden lg:flex flex-col justify-between w-[210px] bg-zinc-950/80 border border-zinc-850 p-2 rounded font-mono text-[9px] space-y-1 text-left shadow-md flex-shrink-0">
                <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-900 pb-0.5 flex justify-between">
                  <span>🛰️ MECHA TELEMETRY</span>
                  <span className="text-emerald-400 animate-pulse">● ONLINE</span>
                </div>
                
                {/* 1. Laser Power battery block */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[8px] text-zinc-400">
                    <span>⚡ 雷射電力 (LASER BATTERY)</span>
                    <span className={mechaLaserBattery < 10 ? "text-rose-500 font-bold animate-pulse" : "text-sky-400"}>
                      {Math.floor(mechaLaserBattery)}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden border border-zinc-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-100 ${
                        mechaLaserBattery < 10 ? "bg-rose-500 animate-pulse" : "bg-sky-400"
                      }`}
                      style={{ width: `${mechaLaserBattery}%` }}
                    />
                  </div>
                </div>

                {/* 2. Shield durability & Damage State */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[8px] text-zinc-400">
                    <span>🛡️ 護盾強度 (SHIELD INTEGRITY)</span>
                    <span>
                      {mechaShieldBroken ? (
                        <span className="text-rose-500 font-black animate-pulse">STAGGERED</span>
                      ) : (
                        <span className="text-cyan-400 font-bold">{mechaShieldDurability} / 4</span>
                      )}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((pip) => {
                      const isActive = !mechaShieldBroken && mechaShieldDurability >= pip;
                      return (
                        <div 
                          key={pip}
                          className={`h-1 flex-1 rounded transition-colors duration-150 ${
                            mechaShieldBroken 
                              ? "bg-rose-500/20 border border-rose-500 animate-pulse" 
                              : isActive 
                                ? "bg-cyan-400 shadow-[0_0_4px_#22d3ee]" 
                                : "bg-zinc-900 border border-zinc-850"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* 3. Mecha Core Status / Damage Mode */}
                <div className="flex justify-between text-[8px] pt-0.5 border-t border-zinc-900">
                  <span className="text-zinc-500">⚙️ 損傷狀態 (STATUS)</span>
                  {mechaShieldBroken ? (
                    <span className="text-rose-500 font-black animate-pulse">⚠️ OVERHEAT</span>
                  ) : hp < maxHp * 0.35 ? (
                    <span className="text-orange-500 font-bold animate-pulse">⚠️ WARNING</span>
                  ) : (
                    <span className="text-emerald-400">✅ ACTIVE</span>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 5. VICTORY SCREEN */}
      {stage === "VICTORY" && (
        <div className="flex-1 w-full overflow-hidden p-3 sm:p-6 select-none animate-fade-in text-center flex flex-col justify-center">
          <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-6 max-w-md mx-auto py-1">
            <div className="text-4xl sm:text-6xl animate-bounce">🏆</div>
            <SpriteAnimator
              src={walkSprites[selectedAgent.id as "claire" | "ethan" | "leo"].src}
              totalFrames={6}
              idleFrame={0}
              animationFrames={[1, 2, 3, 4, 5]}
              fps={7}
              playing={true}
              width={80}
              className="my-2"
            />
            <div className="space-y-1">
              <h1 className="text-xl sm:text-3xl font-black text-green-400 tracking-wider">
                黑暗核心已被驅除！
              </h1>
              <p className="text-[9px] sm:text-xs text-zinc-400 tracking-widest uppercase">
                CHAPTER PURIFIED SUCCESSFULLY
              </p>
            </div>

            <p className="text-[11px] sm:text-xs text-zinc-300 leading-relaxed font-sans max-w-xs sm:max-w-none">
              做得好！{selectedAgent.name} 駕駛燈燈機器人成功部署了完美的 SCI 全光能防護網，完全照亮並淨化了 <b>{CHAPTERS[selectedChapter - 1].name}</b>，驅散了暗影首領！
            </p>

            {/* Stats card */}
            <div className="w-full bg-zinc-900 border border-zinc-800 p-2.5 sm:p-4 space-y-1.5 sm:space-y-2 rounded text-left font-mono text-[11px] sm:text-xs text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-500">出勤特工 (Agent):</span>
                <span className="text-white">{selectedAgent.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">驅逐暗黑積分 (Score):</span>
                <span className="text-amber-400 font-bold">{score} 分</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">隊伍好感度獎勵 (Affection):</span>
                <span className="text-emerald-400 font-bold">+150 點</span>
              </div>
              <div className="border-t border-zinc-800/80 my-1 pt-1.5 flex justify-between">
                <span className="text-zinc-500">戰區收集金幣 (Earned Coins):</span>
                <span className="text-yellow-400 font-black">🪙 +{sessionCoins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">通關額外加成 (Purify Bonus):</span>
                <span className="text-yellow-400 font-black">🪙 +{selectedChapter * 50 + 100}</span>
              </div>
              <div className="border-t border-dashed border-zinc-800/80 my-1 pt-1.5 flex justify-between font-bold text-amber-400">
                <span>本局累計獲得 (Total Gained):</span>
                <span>🪙 +{sessionCoins + (selectedChapter * 50 + 100)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full">
              <button
                onClick={() => {
                  if (entrySource === "exhibition") {
                    onReturnToExhibition();
                    return;
                  }
                  setStage("START");
                  setStartStep(1);
                }}
                className="flex-1 py-2 sm:py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[10px] sm:text-xs font-bold tracking-widest uppercase cursor-pointer rounded"
              >
                {entrySource === "exhibition" ? "返回展覽任務中心" : "返回大廳 (RETURN)"}
              </button>
              <button
                onClick={entrySource === "exhibition" ? startBossBattle : startGame}
                className="flex-1 py-2 sm:py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] sm:text-xs tracking-widest uppercase cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20 rounded"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重新挑戰</span>
              </button>
              {entrySource !== "exhibition" && (
                <button
                  onClick={() => {
                    const nextCh = Math.min(6, selectedChapter + 1);
                    setSelectedChapter(nextCh);
                    setStage("START");
                    setStartStep(1);
                  }}
                  className="flex-1 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-[10px] sm:text-xs tracking-widest uppercase cursor-pointer flex items-center justify-center gap-1.5 rounded"
                >
                  <span>下一個章節</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-950" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. GAME OVER SCREEN */}
      {stage === "GAMEOVER" && (
        <div className="flex-1 w-full overflow-hidden p-3 sm:p-6 select-none animate-fade-in text-center flex flex-col justify-center">
          <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-6 max-w-md mx-auto py-1">
            <div className="text-4xl sm:text-6xl animate-pulse">💀</div>
            <SpriteAnimator
              src={walkSprites[selectedAgent.id as "claire" | "ethan" | "leo"].src}
              totalFrames={6}
              idleFrame={0}
              animationFrames={[1, 2, 3, 4, 5]}
              fps={7}
              playing={false}
              width={80}
              className="my-2"
            />
            <div className="space-y-1">
              <h1 className="text-xl sm:text-3xl font-black text-rose-500 tracking-wider">
                小隊光源被吞噬...
              </h1>
              <p className="text-[9px] sm:text-xs text-zinc-500 tracking-widest uppercase">
                YOUR LIGHT WAS EXTINGUISHED
              </p>
            </div>

            <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed font-sans max-w-xs sm:max-w-none">
              黑暗魔怪的暗影遮蔽了您的工業工作燈。在失去能量核心前，請及時更換戰略、管理電力，並多加收集金色工具箱來強化武器喔！
            </p>

            {/* GameOver Stats card */}
            <div className="w-full bg-zinc-900 border border-zinc-800 p-2.5 sm:p-4 space-y-1.5 sm:space-y-2 rounded text-left font-mono text-[11px] sm:text-xs text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-500">出勤特工 (Agent):</span>
                <span className="text-white">{selectedAgent.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">本場驅逐積分 (Score):</span>
                <span className="text-rose-400 font-bold">{score} 分</span>
              </div>
              <div className="border-t border-zinc-800/80 my-1 pt-1.5 flex justify-between">
                <span className="text-zinc-500">已救回並帶回金幣 (Saved Coins):</span>
                <span className="text-yellow-400 font-black">🪙 +{sessionCoins}</span>
              </div>
              <div className="text-[10px] text-zinc-500 font-sans mt-1 text-center">
                金幣已安全儲存回科學部。快前往後勤補給部升級裝備再度出擊吧！
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full">
              <button
                onClick={() => {
                  if (entrySource === "exhibition") {
                    onReturnToExhibition();
                    return;
                  }
                  setStage("START");
                  setStartStep(1);
                }}
                className="flex-1 py-2 sm:py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[10px] sm:text-xs font-bold tracking-widest uppercase cursor-pointer rounded"
              >
                {entrySource === "exhibition" ? "返回展覽任務中心" : "返回基地 (BASE)"}
              </button>
              <button
                onClick={entrySource === "exhibition" ? startBossBattle : startGame}
                className="flex-1 py-2 sm:py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] sm:text-xs tracking-widest uppercase cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20 rounded"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重新挑戰</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Bottom Back Bar */}
      {stage !== "PLAYING" && stage !== "BOSSBATTLE" && <div className="bg-zinc-950 border-t border-zinc-900 p-3.5 flex justify-between items-center text-[10px] text-zinc-500 font-sans z-10">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="hidden md:inline">勇敢の燈燈小隊 ── 攜手 SCI 工業照明科技 驅散一切未知的暗影</span>
          <span className="font-mono text-zinc-400">⌨ 方向鍵/WASD 移動・Enter/Space 確認・R 重試・Esc 離開</span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1 hover:text-orange-400 transition-colors cursor-pointer text-zinc-400 uppercase font-mono tracking-widest text-[10px]"
        >
          <X className="w-3.5 h-3.5" />
          <span>返回事業組基地 (EXIT MISSION)</span>
        </button>
      </div>}

      {/* 🛠️ BOSS CONTROL OPERATIONS MODAL OVERLAY */}
      {false && showBossTipModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-55 flex items-center justify-center p-3 sm:p-5 select-none animate-fade-in">
          <div className="bg-zinc-950 border border-cyan-500/50 w-full max-w-xl p-5 sm:p-6 rounded-lg shadow-[0_0_40px_rgba(6,182,212,0.15)] space-y-4 max-h-[95vh] overflow-y-auto z-[100]">
            
            {/* Header */}
            <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
              <div className="flex flex-col text-left">
                <span className="font-sans font-extrabold text-sm text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Cpu className="w-5 h-5 text-cyan-500 animate-pulse" />
                  <span>燈燈機甲戰鬥控制台 (PILOT MECHA PROTOCOL)</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mt-0.5">
                  SYSTEM READY // MECHA DEPLOYMENT MANIFEST
                </span>
              </div>
              <button 
                onClick={() => {
                  triggerSound("click");
                  setShowBossTipModal(false);
                }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-intro text */}
            <p className="text-[11px] sm:text-xs text-zinc-400 font-sans leading-relaxed text-left">
              檢測到高能黑暗首領 <span className="text-rose-500 font-bold">{bossActiveName}</span> 正在侵入黑暗核心！機甲組裝完畢，請熟練掌握下列核心技能與戰鬥控制：
            </p>

            {/* Side by side layout for Keyboard & Touch/Mobile Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Keyboard Controls Box */}
              <div className="bg-zinc-900/50 border border-zinc-850 p-3.5 rounded-lg space-y-2.5 text-left">
                <div className="flex items-center gap-1.5 border-b border-zinc-800/60 pb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1">💻 鍵盤操控方式</span>
                </div>
                
                <div className="space-y-2 text-[11px] text-zinc-300 font-sans">
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 bg-zinc-950 border border-zinc-700 text-zinc-200 font-mono text-[9px] rounded font-bold shrink-0">W A S D</span>
                    <span>或 <span className="font-mono text-[9px] border border-zinc-700 px-1 py-0.5 rounded bg-zinc-950 font-bold">方向鍵</span> 移動機甲</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 bg-zinc-950 border border-orange-500/40 text-orange-400 font-mono text-[9px] rounded font-bold shrink-0">Z</span>
                    <span><strong>近戰重拳</strong> (快速打擊並擊退怪物)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 bg-zinc-950 border border-cyan-500/40 text-cyan-400 font-mono text-[9px] rounded font-bold shrink-0">X (按住)</span>
                    <span><strong>能量護盾</strong> (抵擋並吸收傷害，有冷卻)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 bg-zinc-950 border border-sky-500/40 text-sky-400 font-mono text-[9px] rounded font-bold shrink-0">C (按住)</span>
                    <span><strong>持續激光</strong> (消耗右下雷射電量)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 bg-zinc-950 border border-emerald-500/40 text-emerald-400 font-mono text-[9px] rounded font-bold shrink-0">V</span>
                    <span><strong>軌道巨炮終極轟炸</strong> (充能達 100% 時釋放)</span>
                  </div>
                </div>
              </div>

              {/* Mobile / Screen Controls Box */}
              <div className="bg-zinc-900/50 border border-zinc-850 p-3.5 rounded-lg space-y-2.5 text-left">
                <div className="flex items-center gap-1.5 border-b border-zinc-800/60 pb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1">📱 觸控/行動端操控</span>
                </div>
                
                <div className="space-y-2 text-[11px] text-zinc-300 font-sans">
                  <div className="flex items-start gap-2">
                    <span className="px-1 py-0.5 bg-orange-500/20 border border-orange-500/40 text-orange-400 font-mono text-[9px] rounded font-bold shrink-0">搖桿開關</span>
                    <span>點擊畫面右上角 <strong className="text-orange-400">「搖桿」</strong> 開啟或隱藏虛擬移動方向盤。</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-1 py-0.5 bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-[9px] rounded font-bold shrink-0">觸控按鈕</span>
                    <span>直接點擊畫面最下方的 <strong>「👊 重拳」、「🛡️ 防禦」、「⚡ 雷射」 與 「🌟 終極技」</strong> 發射技能！</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-1 py-0.5 bg-cyan-950/40 border border-cyan-800 text-cyan-400 font-mono text-[9px] rounded font-bold shrink-0">觸控優化</span>
                    <span>雙手並行操控：左手控制移動方向盤，右手點擊右下技能。</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Tactical Tip Box */}
            <div className="bg-zinc-900/40 border border-amber-500/20 p-3 rounded-lg flex items-start gap-2 text-left">
              <span className="text-base select-none mt-0.5">💡</span>
              <div className="space-y-0.5">
                <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">戰場機甲作戰手冊 (TACTICAL GUIDELINE)</h4>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 font-sans leading-relaxed">
                  首領蓄力衝鋒或發射大範圍彈幕時，<b>請務必按住 [X] 進行護盾防禦</b>！當右側的 <b>ULT Energy 達到 100%</b> 時，迅速按下 <b>[V]</b> 召喚太空軌道巨炮，將瞬間對首領造成毀滅性重創！
                </p>
              </div>
            </div>

            {/* Button Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  triggerSound("click");
                  setShowBossTipModal(false);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition active:scale-95 cursor-pointer"
              >
                取消部署 (CANCEL)
              </button>
              <button
                onClick={() => {
                  setShowBossTipModal(false);
                  startBossWarning();
                }}
                className="flex-1 py-2.5 text-xs font-bold text-zinc-950 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-none rounded transition active:scale-95 cursor-pointer shadow-lg shadow-cyan-500/20 text-center flex items-center justify-center gap-1"
              >
                <Cpu className="w-4 h-4 text-zinc-950 shrink-0" />
                <span>部署機甲・開始決戰 (LAUNCH SYSTEM)</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
