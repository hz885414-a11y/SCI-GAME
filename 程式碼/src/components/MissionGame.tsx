import React, { useState, useEffect, useRef } from "react";
import { 
  Gamepad2, Play, RotateCcw, Heart, Zap, Lightbulb, 
  ShieldAlert, X, HelpCircle, Trophy, ChevronRight, 
  Flame, Battery, BatteryCharging, Cpu, Award, Sparkles, AlertTriangle, Clock
} from "lucide-react";
import { SpriteAnimator } from "./SpriteAnimator";
import { gameCharacterSprites, walkSprites } from "../data/gameCharacterSprites";

interface MissionGameProps {
  onClose: () => void;
  affectionPoints: Record<string, number>;
  setAffectionPoints: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  playSound: (sound: string) => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  purchasedUpgrades: Record<string, number>;
  unlockedChapters: number[];
  setUnlockedChapters: React.Dispatch<React.SetStateAction<number[]>>;
}

type GameStage = "START" | "PLAYING" | "REPORT" | "ASSEMBLY" | "BOSSBATTLE" | "VICTORY" | "GAMEOVER";

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
    name: "林語晴 (Claire)",
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
    name: "許晨曦 (Ethan)",
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
    name: "張煦然 (Leo)",
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
  "C2-927": {
    id: "C2-927",
    name: "C2-927 摺疊式手持檢修燈",
    desc: "主力扇形泛光照明裝置，驅散前方大範圍陰影。",
    lowEffect: "前進方向 45° 扇形中距離低耗能照射",
    highEffect: "前方 90° 超廣角高傷害，擊退效果強烈"
  },
  "C2-928": {
    id: "C2-928",
    name: "C2-928 輕薄型手持檢修燈",
    desc: "高攻速光束投射。快速穿透發射多道光波射線。",
    lowEffect: "快速朝最近敵人發射單發凝聚光束",
    highEffect: "超高速散射 3 道強光射線，穿透多個敵人"
  },
  "C2-929": {
    id: "C2-929",
    name: "C2-929 萬向蛇管檢修燈",
    desc: "萬向曲折追蹤。光束自動追蹤連接附近的黑霧。",
    lowEffect: "釋放 1 條光斑雷射鎖定最近敵人持續燃燒",
    highEffect: "同時釋放 3 條追蹤雷射連結鎖定多名目標"
  },
  "C2-932": {
    id: "C2-932",
    name: "C2-932 工地工作燈",
    desc: "區域防守型燈具。在地面佈署大型防護性光圈。",
    lowEffect: "在身後佈署一個小型光圈，緩慢燒灼敵人",
    highEffect: "佈署巨型強光力場，敵人進入緩速 60% 並重創"
  },
  "C2-934": {
    id: "C2-934",
    name: "C2-934 精準契合工作手電筒",
    desc: "精準聚焦契合光源。發射超高能聚焦電漿炮，穿透多重阻礙並強化裝備。",
    lowEffect: "向最近的單體目標發射高能聚焦光柱",
    highEffect: "釋放全方位脈衝光波，並附帶短暫自我修復與充能"
  }
};

export function MissionGame({ 
  onClose, 
  affectionPoints, 
  setAffectionPoints, 
  playSound,
  coins,
  setCoins,
  purchasedUpgrades,
  unlockedChapters,
  setUnlockedChapters
}: MissionGameProps) {
  // Screens state
  const [stage, setStage] = useState<GameStage>("START");
  const [selectedAgent, setSelectedAgent] = useState<Agent>(AGENTS[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [startStep, setStartStep] = useState<number>(1);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true); // Demo mode enabled by default (30s round) for faster testing
  const [assemblyTab, setAssemblyTab] = useState<"lamps" | "specs">("lamps");

  // Touch controls state for mobile/tablets
  const [showTouchControls, setShowTouchControls] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  const [showTipModal, setShowTipModal] = useState<boolean>(false);
  const [showBossTipModal, setShowBossTipModal] = useState<boolean>(false);
  const [startTitleActive, setStartTitleActive] = useState<boolean>(false);

  const handleConfirmTip = () => {
    setShowTipModal(false);
    setStartTitleActive(true);
    triggerSound("click");
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

  // Weapon levels and collected parts count (influences assembly)
  const [weaponLevels, setWeaponLevels] = useState<Record<string, number>>({
    "C2-927": 1,
    "C2-928": 0,
    "C2-929": 0,
    "C2-932": 0,
    "C2-934": 0
  });
  const [collectedLamps, setCollectedLamps] = useState<Record<string, number>>({
    "C2-927": 1,
    "C2-928": 0,
    "C2-929": 0,
    "C2-932": 0,
    "C2-934": 0
  });

  const totalCollectedCount = Object.keys(collectedLamps).reduce((acc, key) => acc + (collectedLamps[key] || 0), 0);

  // Upgrades overlay choice
  const [showUpgradeChoice, setShowUpgradeChoice] = useState<boolean>(false);
  const [upgradeChoices, setUpgradeChoices] = useState<Array<{ id: string; type: "weapon" | "stat"; name: string; desc: string; icon: string }>>([]);

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

  // Refs for low latency canvas rendering and keyboard management
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef<{ x: number; y: number; clicked: boolean }>({ x: 0, y: 0, clicked: false });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const playerSpriteImgRef = useRef<HTMLImageElement | null>(null);
  const [spriteLoaded, setSpriteLoaded] = useState<boolean>(false);
  const playerFacingLeftRef = useRef<boolean>(false);

  const bossRobotSpriteImgRef = useRef<HTMLImageElement | null>(null);
  const [bossRobotSpriteLoaded, setBossRobotSpriteLoaded] = useState<boolean>(false);

  const bossRobotActImgRef = useRef<HTMLImageElement | null>(null);
  const [bossRobotActLoaded, setBossRobotActLoaded] = useState<boolean>(false);

  const companionRobotImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const [companionsLoaded, setCompanionsLoaded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const urls: Record<string, string> = {
      "C2-927": "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/main/8BIT-robot-RB/G-C2-927.png",
      "C2-928": "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/main/8BIT-robot-RB/G-C2-928.png",
      "C2-929": "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/main/8BIT-robot-RB/G-C2-929.png",
      "C2-932": "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/main/8BIT-robot-RB/G-C2-932.png",
      "C2-934": "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/main/8BIT-robot-RB/G-C2-934.png"
    };

    Object.keys(urls).forEach((key) => {
      const img = new Image();
      img.src = urls[key];
      img.onload = () => {
        companionRobotImagesRef.current[key] = img;
        setCompanionsLoaded((prev) => ({ ...prev, [key]: true }));
      };
    });
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/8BIT-robot/8BIT-C2-932-WALK-01.png";
    img.onload = () => {
      bossRobotSpriteImgRef.current = img;
      setBossRobotSpriteLoaded(true);
    };
    img.onerror = () => {
      bossRobotSpriteImgRef.current = null;
      setBossRobotSpriteLoaded(false);
    };

    const imgAct = new Image();
    imgAct.src = "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/main/8BIT-robot/8BIT-C2-932-ACT.png";
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
      hasMoved: false,
      actionType: "defend" as "defend" | "punch" | "laser" | "ult",
      actionEndTime: 0
    },
    enemies: [] as Array<{ x: number; y: number; hp: number; maxHp: number; speed: number; radius: number; color: string; type: "mote" | "clumper" | "stalker"; points: number }>,
    collectibles: [] as Array<{ x: number; y: number; type: "battery" | "gem" | "lamp" | "coin"; amount: number; lampType?: string; radius: number; pulse: number }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; radius: number; color: string; life: number; maxLife: number; alpha: number; text?: string }>,
    bullets: [] as Array<{ x: number; y: number; vx: number; vy: number; damage: number; radius: number; color: string; isLaserBeam?: boolean; laserEndX?: number; laserEndY?: number; maxLife?: number; life?: number; isEnemy?: boolean; isHoming?: boolean }>,
    lightZones: [] as Array<{ x: number; y: number; radius: number; damage: number; duration: number; maxDuration: number; highMode: boolean }>,
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
      dashTimer?: number; 
      dashVx?: number; 
      dashVy?: number;
      stunTimer?: number;
      stunMeter?: number;
    } | null,
    ticks: 0,
    spawnTimer: 0,
    mapSize: { width: 1500, height: 1000 },
    camera: { x: 0, y: 0 },
    lowBatteryCooldown: 0,
    screenShake: 0,
    companionSkills: {} as Record<string, number>
  });

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
      triggerSound(next === "HIGH" ? "power" : "click");
      return next;
    });
  };

  // Keyboard and mouse handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
      keysRef.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [stage]);

  // Generate random upgrades when leveling up
  const triggerLevelUpUpgrade = (currentWeapons: Record<string, number>) => {
    triggerSound("upgrade");
    const options: Array<{ id: string; type: "weapon" | "stat"; name: string; desc: string; icon: string }> = [];

    // Weapon upgrade options
    Object.keys(WEAPONS_INFO).forEach((wId) => {
      const info = WEAPONS_INFO[wId];
      const curLvl = currentWeapons[wId] || 0;
      if (curLvl === 0) {
        options.push({
          id: wId,
          type: "weapon",
          name: `獲得 ${wId}`,
          desc: info.desc,
          icon: "💡"
        });
      } else if (curLvl < 5) {
        options.push({
          id: wId,
          type: "weapon",
          name: `升級 ${wId} (Lv.${curLvl} ➔ Lv.${curLvl + 1})`,
          desc: `提升此款工作燈的光源半徑、驅散威力和冷卻頻率。`,
          icon: "⚡"
        });
      }
    });

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
      desc: "提升小隊與機甲移動速度，更加靈活躲避怪物夾擊。",
      icon: "🏃"
    });

    // Pick 3 random distinct options
    const shuffled = options.sort(() => 0.5 - Math.random());
    setUpgradeChoices(shuffled.slice(0, 3));
    setShowUpgradeChoice(true);
  };

  const handleSelectUpgrade = (choice: { id: string; type: "weapon" | "stat"; name: string }) => {
    triggerSound("click");
    if (choice.type === "weapon") {
      setWeaponLevels((prev) => {
        const next = { ...prev, [choice.id]: (prev[choice.id] || 0) + 1 };
        return next;
      });
      // also increase collected parts counter
      setCollectedLamps((prev) => ({
        ...prev,
        [choice.id]: (prev[choice.id] || 0) + 1
      }));
    } else {
      if (choice.id === "stat_hp") {
        setMaxHp((m) => {
          const nextMax = m + 1;
          setHp(nextMax);
          return nextMax;
        });
      } else if (choice.id === "stat_battery") {
        // Handled dynamically or via state
        setSelectedAgent((prev) => ({ ...prev, maxBattery: prev.maxBattery + 20 }));
        engineRef.current.player.batteryVal = Math.min(engineRef.current.player.batteryVal + 50, selectedAgent.maxBattery + 20);
      } else if (choice.id === "stat_speed") {
        setSelectedAgent((prev) => ({ ...prev, speed: prev.speed * 1.15 }));
      }
    }
    setShowUpgradeChoice(false);
  };

  // Setup / reset game for survivors stage
  const getPlayerMaxBattery = () => {
    const bonus = (purchasedUpgrades.start_battery || 0) * 20;
    return selectedAgent.maxBattery + bonus;
  };

  const handleGameOver = () => {
    setStage("GAMEOVER");
    triggerSound("game_over");
    setCoins((prev) => {
      const updated = prev + sessionCoins;
      localStorage.setItem("light_crew_coins", String(updated));
      return updated;
    });
  };

  const startGame = () => {
    triggerSound("click");
    setSessionCoins(0);
    const bonusHp = purchasedUpgrades.shield_boost || 0;
    const initialHp = (selectedAgent.id === "leo" ? 4 : 3) + bonusHp;
    setHp(initialHp);
    setMaxHp(initialHp);
    setLevel(1);
    setExp(0);
    setExpNeeded(100);
    setBatteryPercent(100);
    setBatteryMode("LOW");
    setTimeLeft(isDemoMode ? 30 : 90);
    setScore(0);
    setWeaponLevels({
      "C2-927": 1,
      "C2-928": 0,
      "C2-929": 0,
      "C2-932": 0,
      "C2-934": 0
    });
    setCollectedLamps({
      "C2-927": 1,
      "C2-928": 0,
      "C2-929": 0,
      "C2-932": 0,
      "C2-934": 0
    });

    const initMaxBattery = getPlayerMaxBattery();

    // Reset loop engine state
    engineRef.current = {
      player: { 
        x: 750, 
        y: 500, 
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
        hasMoved: false,
        actionType: "defend" as "defend" | "punch" | "laser" | "ult",
        actionEndTime: 0
      },
      enemies: [],
      collectibles: [],
      particles: [],
      bullets: [],
      lightZones: [],
      boss: null,
      ticks: 0,
      spawnTimer: 0,
      mapSize: { width: 1800, height: 1200 },
      camera: { x: 375, y: 375 },
      lowBatteryCooldown: 0
    };

    // Spawn initial items & decorations
    for (let i = 0; i < 15; i++) {
      engineRef.current.collectibles.push({
        x: Math.random() * 1800,
        y: Math.random() * 1200,
        type: "battery",
        amount: 30,
        radius: 8,
        pulse: Math.random() * Math.PI
      });
    }

    // Spawn initial gold coins for a welcoming feedback loop!
    for (let i = 0; i < 12; i++) {
      engineRef.current.collectibles.push({
        x: Math.random() * 1800,
        y: Math.random() * 1200,
        type: "coin",
        amount: Math.floor(Math.random() * 3) + 1,
        radius: 6,
        pulse: Math.random() * Math.PI
      });
    }
    // Spawn some weapon crates
    const initialLamps = ["C2-928", "C2-929", "C2-932", "C2-934"];
    initialLamps.forEach((lamp) => {
      engineRef.current.collectibles.push({
        x: 200 + Math.random() * 1400,
        y: 200 + Math.random() * 800,
        type: "lamp",
        amount: 1,
        lampType: lamp,
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

  // Set up Boss Battle
  const startBossBattle = () => {
    triggerSound("click");
    setStage("BOSSBATTLE");

    // Recalculate player HP based on lamps collected plus purchased shields!
    const bonusShieldHp = (purchasedUpgrades.shield_boost || 0) * 20;
    const calculatedMechaHp = 100 + totalCollectedCount * 15 + bonusShieldHp;
    setHp(calculatedMechaHp);
    setMaxHp(calculatedMechaHp);

    const ch = CHAPTERS.find((c) => c.id === selectedChapter) || CHAPTERS[0];
    setBossActiveName(ch.bossName);
    // Substantially higher Boss HP for an epic combat challenge!
    const calculatedBossHp = 2800 + selectedChapter * 1200;
    setBossHp(calculatedBossHp);
    setBossMaxHp(calculatedBossHp);

    const isMobileDevice = window.innerWidth < 640;
    const arenaWidth = isMobileDevice ? 500 : 1000;
    const arenaHeight = isMobileDevice ? 750 : 550;

    // Reset Engine references for boss fight in bounded arena
    engineRef.current = {
      player: { 
        x: arenaWidth / 2, 
        y: arenaHeight - 120, 
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
        hasMoved: false,
        actionType: "defend" as "defend" | "punch" | "laser" | "ult",
        actionEndTime: 0
      }, // Mecha is bigger
      enemies: [],
      collectibles: [],
      particles: [],
      bullets: [],
      lightZones: [],
      boss: {
        x: arenaWidth / 2,
        y: 130,
        vx: 1.1, // Slower horizontal speed
        vy: 0,
        hp: calculatedBossHp,
        maxHp: calculatedBossHp,
        radius: 65, // Visually massive and imposing!
        attackCooldown: 0,
        name: ch.bossName,
        targetY: 130,
        currentPattern: 0,
        dashTimer: 0,
        dashVx: 0,
        dashVy: 0,
        stunTimer: 0,
        stunMeter: 0
      },
      ticks: 0,
      spawnTimer: 0,
      mapSize: { width: arenaWidth, height: arenaHeight }, // Bounded Arena size matches responsive canvas
      camera: { x: 0, y: 0 },
      lowBatteryCooldown: 0,
      screenShake: 0,
      companionSkills: {}
    };
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
      
      const isPaused = showTipModal || startTitleActive;
      
      let dx = 0;
      let dy = 0;
      const isHigh = batteryMode === "HIGH";

      if (!isPaused) {
        state.ticks++;

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

       const speedMultiplier = 1 + (purchasedUpgrades.speed_boost || 0) * 0.1;
       const currentSpeed = (stage === "BOSSBATTLE" ? 2.5 : selectedAgent.speed) * speedMultiplier;
       player.x += dx * currentSpeed;
       player.y += dy * currentSpeed;

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
          player.punchCooldown = 22; // 0.36s cooldown
          setMechaAction("punch", 90);
          triggerSound("hit");

          // Aim at Boss or facing direction
          const targetX = state.boss ? state.boss.x : player.x;
          const targetY = state.boss ? state.boss.y : player.y - 100;
          const punchAngle = Math.atan2(targetY - player.y, targetX - player.x);
          
          const punchRange = 140;
          const distanceToBoss = state.boss ? Math.hypot(state.boss.x - player.x, state.boss.y - player.y) : 999;
          
          if (state.boss && distanceToBoss <= punchRange + state.boss.radius) {
            const punchDamage = 110; // High single hit damage
            state.boss.hp -= punchDamage;
            setBossHp(Math.max(0, Math.ceil(state.boss.hp)));
            
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
          } else {
            // Miss swipe visual in empty air
            const swipeX = player.x + Math.cos(punchAngle) * 40;
            const swipeY = player.y + Math.sin(punchAngle) * 40;
            for (let i = 0; i < 6; i++) {
              const a = punchAngle + (Math.random() - 0.5) * 0.8;
              const spd = 3 + Math.random() * 3;
              state.particles.push({
                x: swipeX,
                y: swipeY,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                radius: 2,
                color: "rgba(251, 146, 60, 0.6)",
                life: 0,
                maxLife: 12,
                alpha: 0.8
              });
            }
          }

          // Spawn a melee wave bubble projectile
          state.bullets.push({
            x: player.x + Math.cos(punchAngle) * 25,
            y: player.y + Math.sin(punchAngle) * 25,
            vx: Math.cos(punchAngle) * 9,
            vy: Math.sin(punchAngle) * 9,
            damage: 0, // Handled instantly above
            radius: 32,
            color: "rgba(251, 146, 60, 0.35)",
            maxLife: 6,
            life: 0
          });
        }

        // 3. Fire Laser Beam (C) with Battery Consumption
        if (player.laserBattery === undefined) player.laserBattery = 100;
        const isHoldingLaserKey = keysRef.current["c"] || keysRef.current["keyc"];

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

            const targetX = state.boss ? state.boss.x : player.x;
            const targetY = state.boss ? state.boss.y : player.y - 300;
            
            if (state.boss) {
              const laserDmg = 9; // Good continuous damage
              state.boss.hp -= laserDmg;

              // Gain very slight ult energy on laser hit
              player.ultEnergy = Math.min(100, player.ultEnergy + 0.8);
              const nextUltOnLaser = Math.floor(player.ultEnergy);
              if (state.lastUltEnergy !== nextUltOnLaser) {
                state.lastUltEnergy = nextUltOnLaser;
                setMechaUltEnergy(nextUltOnLaser);
              }

              if (state.boss.hp <= 0) {
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
            if (state.boss) {
              for (let i = 0; i < 2; i++) {
                state.particles.push({
                  x: state.boss.x + (Math.random() - 0.5) * 20,
                  y: state.boss.y + (Math.random() - 0.5) * 20,
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
          if (state.boss) {
            const ultDamage = 450;
            state.boss.hp -= ultDamage;
            setBossHp(Math.max(0, Math.ceil(state.boss.hp)));

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
      
      // -- C2-927 Sector Sweep --
      if (weaponLevels["C2-927"] > 0) {
        const rate = isHigh ? 25 : 45;
        if (state.ticks % rate === 0) {
          if (stage === "BOSSBATTLE" && state.companionSkills) {
            state.companionSkills["C2-927"] = 30;
          }
          let srcX = player.x;
          let srcY = player.y;
          let angle = dx === 0 && dy === 0 ? 0 : Math.atan2(dy, dx);
          if (stage === "BOSSBATTLE") {
            const collectedCompanionIDs = ["C2-927", "C2-928", "C2-929", "C2-932", "C2-934"].filter((id) => (collectedLamps[id] || 0) > 0);
            const compIdx = collectedCompanionIDs.indexOf("C2-927");
            if (compIdx !== -1) {
              const numCompanions = collectedCompanionIDs.length;
              const orbitAngle = (state.ticks / 50) + (compIdx * (Math.PI * 2 / numCompanions));
              const orbitRadius = 65 + Math.sin(state.ticks / 15 + compIdx) * 5;
              srcX = player.x + Math.cos(orbitAngle) * orbitRadius;
              srcY = player.y + Math.sin(orbitAngle) * orbitRadius;
              if (state.boss) {
                angle = Math.atan2(state.boss.y - srcY, state.boss.x - srcX);
              }
            }
          }

          const fanSize = isHigh ? Math.PI / 2 : Math.PI / 4;
          const dist = isHigh ? 170 : 85;
          const bonusDamageMult = 1 + (purchasedUpgrades.damage_boost || 0) * 0.15;
          const damage = (isHigh ? 45 : 18) * (1 + weaponLevels["C2-927"] * 0.15) * bonusDamageMult;

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
                // pushback
                const push = isHigh ? 35 : 12;
                enemy.x += Math.cos(eAngle) * push;
                enemy.y += Math.sin(eAngle) * push;
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
          if (state.boss) {
            const bdx = state.boss.x - srcX;
            const bdy = state.boss.y - srcY;
            const bDist = Math.hypot(bdx, bdy);
            if (bDist <= dist) {
              state.boss.hp -= damage * 0.5;
              setBossHp(Math.max(0, Math.ceil(state.boss.hp)));
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
              color: "rgba(249, 115, 22, 0.4)",
              life: 0,
              maxLife: isHigh ? 24 : 15,
              alpha: 0.8
            });
          }
        }
      }

      // -- C2-928 Slim Beam Laser --
      if (weaponLevels["C2-928"] > 0) {
        const rate = isHigh ? 12 : 25;
        if (state.ticks % rate === 0) {
          if (stage === "BOSSBATTLE" && state.companionSkills) {
            state.companionSkills["C2-928"] = 25;
          }
          let srcX = player.x;
          let srcY = player.y;
          if (stage === "BOSSBATTLE") {
            const collectedCompanionIDs = ["C2-927", "C2-928", "C2-929", "C2-932", "C2-934"].filter((id) => (collectedLamps[id] || 0) > 0);
            const compIdx = collectedCompanionIDs.indexOf("C2-928");
            if (compIdx !== -1) {
              const numCompanions = collectedCompanionIDs.length;
              const orbitAngle = (state.ticks / 50) + (compIdx * (Math.PI * 2 / numCompanions));
              const orbitRadius = 65 + Math.sin(state.ticks / 15 + compIdx) * 5;
              srcX = player.x + Math.cos(orbitAngle) * orbitRadius;
              srcY = player.y + Math.sin(orbitAngle) * orbitRadius;
            }
          }

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
            const bonusDamageMult = 1 + (purchasedUpgrades.damage_boost || 0) * 0.15;
            const bulletDamage = (isHigh ? 22 : 10) * (1 + weaponLevels["C2-928"] * 0.2) * bonusDamageMult;
            
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

      // -- C2-929 Flexible Gooseneck Tracking --
      if (weaponLevels["C2-929"] > 0) {
        // Periodically tick electrical laser connection links
        if (state.ticks % 10 === 0) {
          if (stage === "BOSSBATTLE" && state.companionSkills) {
            state.companionSkills["C2-929"] = 15;
          }
          let srcX = player.x;
          let srcY = player.y;
          if (stage === "BOSSBATTLE") {
            const collectedCompanionIDs = ["C2-927", "C2-928", "C2-929", "C2-932", "C2-934"].filter((id) => (collectedLamps[id] || 0) > 0);
            const compIdx = collectedCompanionIDs.indexOf("C2-929");
            if (compIdx !== -1) {
              const numCompanions = collectedCompanionIDs.length;
              const orbitAngle = (state.ticks / 50) + (compIdx * (Math.PI * 2 / numCompanions));
              const orbitRadius = 65 + Math.sin(state.ticks / 15 + compIdx) * 5;
              srcX = player.x + Math.cos(orbitAngle) * orbitRadius;
              srcY = player.y + Math.sin(orbitAngle) * orbitRadius;
            }
          }

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
              const bonusDamageMult = 1 + (purchasedUpgrades.damage_boost || 0) * 0.15;
              const dmg = (isHigh ? 12 : 5) * (1 + weaponLevels["C2-929"] * 0.25) * bonusDamageMult;
              t.hp -= dmg;
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
      if (weaponLevels["C2-932"] > 0) {
        const rate = isHigh ? 80 : 140;
        if (state.ticks % rate === 0) {
          if (stage === "BOSSBATTLE" && state.companionSkills) {
            state.companionSkills["C2-932"] = 40;
          }
          let srcX = player.x;
          let srcY = player.y;
          if (stage === "BOSSBATTLE") {
            const collectedCompanionIDs = ["C2-927", "C2-928", "C2-929", "C2-932", "C2-934"].filter((id) => (collectedLamps[id] || 0) > 0);
            const compIdx = collectedCompanionIDs.indexOf("C2-932");
            if (compIdx !== -1) {
              const numCompanions = collectedCompanionIDs.length;
              const orbitAngle = (state.ticks / 50) + (compIdx * (Math.PI * 2 / numCompanions));
              const orbitRadius = 65 + Math.sin(state.ticks / 15 + compIdx) * 5;
              srcX = player.x + Math.cos(orbitAngle) * orbitRadius;
              srcY = player.y + Math.sin(orbitAngle) * orbitRadius;
            }
          }

          const zoneRadius = isHigh ? 110 : 60;
          const bonusDamageMult = 1 + (purchasedUpgrades.damage_boost || 0) * 0.15;
          const damage = (isHigh ? 3 : 1) * (1 + weaponLevels["C2-932"] * 0.3) * bonusDamageMult;
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

      // -- C2-934 Heavy Precision Handheld Flashlight Beam --
      if (weaponLevels["C2-934"] > 0) {
        const rate = isHigh ? 35 : 60;
        if (state.ticks % rate === 0) {
          if (stage === "BOSSBATTLE" && state.companionSkills) {
            state.companionSkills["C2-934"] = 35;
          }
          let srcX = player.x;
          let srcY = player.y;
          if (stage === "BOSSBATTLE") {
            const collectedCompanionIDs = ["C2-927", "C2-928", "C2-929", "C2-932", "C2-934"].filter((id) => (collectedLamps[id] || 0) > 0);
            const compIdx = collectedCompanionIDs.indexOf("C2-934");
            if (compIdx !== -1) {
              const numCompanions = collectedCompanionIDs.length;
              const orbitAngle = (state.ticks / 50) + (compIdx * (Math.PI * 2 / numCompanions));
              const orbitRadius = 65 + Math.sin(state.ticks / 15 + compIdx) * 5;
              srcX = player.x + Math.cos(orbitAngle) * orbitRadius;
              srcY = player.y + Math.sin(orbitAngle) * orbitRadius;
            }
          }

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
            const bonusDamageMult = 1 + (purchasedUpgrades.damage_boost || 0) * 0.15;
            const dmg = (isHigh ? 65 : 30) * (1 + weaponLevels["C2-934"] * 0.3) * bonusDamageMult;
            
            // Deal damage
            target.hp -= dmg;
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
          
          // Spawn just outside the viewport
          const angle = Math.random() * Math.PI * 2;
          const spawnDist = 480;
          const sx = player.x + Math.cos(angle) * spawnDist;
          const sy = player.y + Math.sin(angle) * spawnDist;

          if (sx >= 0 && sx <= state.mapSize.width && sy >= 0 && sy <= state.mapSize.height) {
            const rand = Math.random();
            let type: "mote" | "clumper" | "stalker" = "mote";
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
              x: sx,
              y: sy,
              hp: hpVal,
              maxHp: hpVal,
              speed: spd,
              radius: radius,
              color: col,
              type: type,
              points: type === "clumper" ? 30 : type === "stalker" ? 20 : 10
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
            // apply temporary speed debuff during this frame
            enemy.x -= (enemy.x - zone.x) * (zone.highMode ? 0.05 : 0.01);
            enemy.y -= (enemy.y - zone.y) * (zone.highMode ? 0.05 : 0.01);
          }
        });

        // Slow down Boss if inside work lamp zone
        if (state.boss) {
          const d = Math.hypot(state.boss.x - zone.x, state.boss.y - zone.y);
          if (d <= zone.radius + state.boss.radius) {
            state.boss.hp -= zone.damage * 0.4;
            setBossHp(Math.max(0, Math.ceil(state.boss.hp)));
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
          enemy.x += (dxToPlayer / d) * enemy.speed;
          enemy.y += (dyToPlayer / d) * enemy.speed;
        }

        // Deal contact damage to player
        if (d <= player.radius + enemy.radius && player.invincibleTime === 0) {
          player.hp = Math.max(0, (player.hp ?? 3) - 1);
          setHp(player.hp);
          if (player.hp <= 0) {
            handleGameOver();
          }
          player.invincibleTime = 45; // invincible for 45 frames (~0.75s)
          triggerSound("hit");

          // Knockback player slightly
          player.x += (dxToPlayer / d) * -15;
          player.y += (dyToPlayer / d) * -15;
        }

        // Check if enemy died
        if (enemy.hp <= 0) {
          // Spawn Exp crystals (gems) or battery
          setScore((s) => s + enemy.points);
          
          // 35% chance to drop a shiny gold coin
          if (Math.random() < 0.35) {
            state.collectibles.push({
              x: enemy.x + (Math.random() - 0.5) * 10,
              y: enemy.y + (Math.random() - 0.5) * 10,
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

        b.x += b.vx;
        b.y += b.vy;

        // Collision detection
        let hit = false;

        if (b.isEnemy) {
          // Collision with player
          const dToP = Math.hypot(player.x - b.x, player.y - b.y);
          if (dToP <= player.radius + b.radius && player.invincibleTime === 0) {
            const actualDamage = player.isShieldActive ? Math.ceil(b.damage * 0.2) : b.damage;
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
          if (state.boss && !hit && Math.hypot(state.boss.x - b.x, state.boss.y - b.y) <= state.boss.radius + b.radius) {
            state.boss.hp -= b.damage;
            setBossHp(Math.max(0, Math.ceil(state.boss.hp)));
            hit = true;
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
            const maxBatLimit = getPlayerMaxBattery();
            const chargeEfficiency = selectedAgent.id === "claire" ? 1.3 : 1.0;
            player.batteryVal = Math.min(maxBatLimit, player.batteryVal + col.amount * chargeEfficiency);
            const nextBatPercent = Math.ceil((player.batteryVal / maxBatLimit) * 100);
            if (state.lastBatteryPercent !== nextBatPercent) {
              state.lastBatteryPercent = nextBatPercent;
              setBatteryPercent(nextBatPercent);
            }
            triggerSound("click");
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
            triggerSound("click");
          } else if (col.type === "lamp") {
            const lampName = col.lampType || "C2-927";
            setWeaponLevels((prev) => ({
              ...prev,
              [lampName]: Math.max(1, (prev[lampName] || 0) + 1)
            }));
            setCollectedLamps((prev) => ({
              ...prev,
              [lampName]: (prev[lampName] || 0) + 1
            }));
            triggerSound("upgrade");
            // show a brief visual particle splash
            for (let i = 0; i < 15; i++) {
              state.particles.push({
                x: col.x,
                y: col.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                radius: 3,
                color: "#f59e0b",
                life: 0,
                maxLife: 25,
                alpha: 1
              });
            }
          } else if (col.type === "coin") {
            const coinAmount = col.amount || 1;
            setSessionCoins((prev) => prev + coinAmount);
            triggerSound("click");
            
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

        if (boss.stunTimer === undefined) boss.stunTimer = 0;
        
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
        if (boss.dashTimer && boss.dashTimer > 0) {
          boss.dashTimer--;
          
          if (boss.dashTimer > 30) {
            // Dash preparation (charging up, shaking)
            // Gently orient dash velocity towards player
            const dxToP = player.x - boss.x;
            const dyToP = player.y - boss.y;
            const d = Math.hypot(dxToP, dyToP);
            if (d > 0.1) {
              boss.dashVx = (dxToP / d) * 4.0; // Slower, more manageable dash
              boss.dashVy = (dyToP / d) * 4.0;
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
                color: "#f43f5e",
                life: 0,
                maxLife: 20,
                alpha: 1
              });
            }
          } else {
            // Executing Dash
            boss.x += boss.dashVx || 0;
            boss.y += boss.dashVy || 0;

            // Spawn dark trailing sparks
            spawnParticle(state, {
              x: boss.x + (Math.random() - 0.5) * 15,
              y: boss.y + (Math.random() - 0.5) * 15,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5,
              radius: 3,
              color: "#a855f7",
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
          // Normal hovering/chasing movement
          boss.x += boss.vx;
          boss.y += boss.vy;

          // Horizontal bounds check
          if (boss.x <= boss.radius || boss.x >= state.mapSize.width - boss.radius) {
            boss.vx *= -1;
            boss.x = Math.max(boss.radius, Math.min(state.mapSize.width - boss.radius, boss.x));
          }

          // Gentle vertical drifting to stay in the upper half
          if (boss.targetY === undefined) boss.targetY = 130;
          const dy = boss.targetY - boss.y;
          if (Math.abs(dy) > 2) {
            boss.y += Math.sign(dy) * 0.45; // Slower drift
          } else {
            // Set random new target Y height in the upper 40% of the screen
            boss.targetY = 80 + Math.random() * (state.mapSize.height * 0.35);
          }
        }

        // Keep boss within overall screen bounds
        boss.x = Math.max(boss.radius, Math.min(state.mapSize.width - boss.radius, boss.x));
        boss.y = Math.max(boss.radius, Math.min(state.mapSize.height - boss.radius, boss.y));

        // Active Attack timer
        boss.attackCooldown++;
        // Attack more frequently (every 110 frames ~1.8s)
        if (boss.attackCooldown >= 110) {
          boss.attackCooldown = 0;
          
          // Randomly select 1 of 4 powerful attack patterns
          const pattern = Math.floor(Math.random() * 4);
          
          if (pattern === 0) {
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
              color: "#fbbf24",
              life: 0,
              maxLife: 40,
              alpha: 1,
              text: "⚡ TRIPLE TARGETED NOVA! ⚡"
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
                  damage: 18,
                  radius: 7,
                  color: "#eab308", // Yellow shadow laser balls
                  isEnemy: true
                });
              }
            }
          } else if (pattern === 2) {
            // Pattern 2: Heavy Charging Dash Attack
            triggerSound("power");
            state.screenShake = 12; // Shake immediately to announce the doom dash!
            boss.dashTimer = 70; // 70 frames total: 35 frames prep, 35 frames movement

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
              text: "🚨 MECHA-CRUSH DASH CHARGE!!! 🚨"
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
              color: "#ec4899",
              life: 0,
              maxLife: 40,
              alpha: 1,
              text: "👾 HOMING BIO-FLUX BULLETS! 👾"
            });

            for (let i = 0; i < 4; i++) {
              const angle = (Math.PI / 2) * i + Math.random() * 0.3;
              state.bullets.push({
                x: boss.x + Math.cos(angle) * 35,
                y: boss.y + Math.sin(angle) * 35,
                vx: Math.cos(angle) * 0.9, // Slower initial homing velocity
                vy: Math.sin(angle) * 0.9, // Slower initial homing velocity
                damage: 12,
                radius: 9,
                color: "#ec4899", // Homing pink energy sphere
                isEnemy: true,
                isHoming: true
              });
            }
          }
        }
        } // End of stunTimer else block

        // Contact damage to Mecha (from direct contact with the Boss)
        const distToPlayer = Math.hypot(player.x - boss.x, player.y - boss.y);
        if (distToPlayer <= player.radius + boss.radius && player.invincibleTime === 0) {
          const actualDamage = player.isShieldActive ? Math.ceil(22 * 0.2) : 22;
          player.hp = Math.max(0, (player.hp ?? 100) - actualDamage);
          setHp(player.hp);
          if (player.hp <= 0) {
            handleGameOver();
          }
          player.invincibleTime = player.isShieldActive ? 20 : 55; // Shorter invincibility if shielded
          triggerSound(player.isShieldActive ? "click" : "hit");
          
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
      ctx.translate(-state.camera.x, -state.camera.y);

      ctx.fillStyle = activeChapter.groundColor;
      ctx.fillRect(0, 0, state.mapSize.width, state.mapSize.height);

      // Grid lines
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
        } else {
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // D. Draw Enemies (Shadow monsters)
      state.enemies.forEach((enemy) => {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();

        // Cute glowing red eyes
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(enemy.x - enemy.radius * 0.4, enemy.y - enemy.radius * 0.1, 2, 0, Math.PI * 2);
        ctx.arc(enemy.x + enemy.radius * 0.4, enemy.y - enemy.radius * 0.1, 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw shadow health bar above larger clumpers
        if (enemy.type === "clumper") {
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(enemy.x - 12, enemy.y - enemy.radius - 8, 24, 4);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(enemy.x - 12, enemy.y - enemy.radius - 8, (enemy.hp / enemy.maxHp) * 24, 4);
        }
      });

      // E. Draw Boss (if active)
      if (state.boss) {
        const boss = state.boss;
        
        let bx = boss.x;
        let by = boss.y;
        
        // Shake boss and draw charging visuals when preparing a dash
        if (boss.dashTimer && boss.dashTimer > 30) {
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

        // Radial gradient for the massive boss body with high-contrast shadow glow!
        ctx.save();
        ctx.shadowColor = activeChapter.themeColor;
        ctx.shadowBlur = 30 + Math.sin(state.ticks * 0.08) * 12;

        const grad = ctx.createRadialGradient(bx, by, 8, bx, by, rad);
        grad.addColorStop(0, "#4c1d95"); // deep royal violet
        grad.addColorStop(0.5, "#1e1b4b"); // heavy indigo void
        grad.addColorStop(1, "rgba(9, 9, 11, 0.98)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Outer neon aura ring
        ctx.strokeStyle = activeChapter.themeColor;
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

        // Menacing red core slits (eyes) scaled up for larger radius!
        ctx.fillStyle = boss.dashTimer && boss.dashTimer > 30 ? "#f43f5e" : "#ef4444";
        ctx.beginPath();
        ctx.ellipse(bx - 19, by, 12, 4.5, Math.PI / 6, 0, Math.PI * 2);
        ctx.ellipse(bx + 19, by, 12, 4.5, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        // Core name text banner & Combat Status Indicators
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(boss.name, bx, by - boss.radius - 20);

        // Display Active Action Alert
        let statusText = "⚔️ SYSTEM ONLINE / COMBAT OPTIMIZATION ⚔️";
        let statusColor = "text-zinc-400";
        if (boss.dashTimer && boss.dashTimer > 30) {
          statusText = "⚠️ WARNING: ENGINE CHARGING [OVERDRIVE DANGER] ⚠️";
          statusColor = "text-rose-500 animate-pulse";
        } else if (boss.stunTimer && boss.stunTimer > 0) {
          statusText = "💫 CRITICAL FAILURE: SYSTEM SHUTDOWN 💫";
          statusColor = "text-yellow-400";
        }
        
        ctx.save();
        ctx.fillStyle = statusText.includes("WARNING") ? "#ef4444" : statusText.includes("CRITICAL") ? "#fbbf24" : "#a1a1aa";
        ctx.font = "bold 8px monospace";
        ctx.fillText(statusText, bx, by - boss.radius - 8);
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
        if (bossRobotImg && bossRobotSpriteLoaded) {
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

          ctx.drawImage(
            drawImg,
            frameIndex * fw,
            0,
            fw,
            fh,
            player.x - drawWidth / 2,
            player.y - drawHeight / 2 - 4, // slight shift upwards to match center of mass
            drawWidth,
            drawHeight
          );
          ctx.restore();

          // Draw cyber defensive shield if active!
          if (player.isShieldActive) {
            ctx.save();
            
            // Outer neon cyan glowing ring
            ctx.strokeStyle = "rgba(6, 182, 212, 0.85)";
            ctx.lineWidth = 3 + Math.sin(state.ticks / 4) * 1.5; // pulsating glow!
            ctx.shadowColor = "#22d3ee";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius + 18, 0, Math.PI * 2);
            ctx.stroke();
            
            // Translucent neon cyan filled field with hexagon wireframe grid overlay
            ctx.shadowBlur = 0; // reset shadow
            ctx.fillStyle = "rgba(6, 182, 212, 0.12)";
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius + 18, 0, Math.PI * 2);
            ctx.fill();

            // Hexagonal lines overlay
            ctx.strokeStyle = "rgba(34, 211, 238, 0.38)";
            ctx.lineWidth = 1.3;
            const shieldRadius = player.radius + 18;
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

        } else {
          // Draw the assembled LAMPI ROBOT MECHA! (FALLBACK)
          ctx.save();
          ctx.translate(player.x, player.y);
          ctx.scale(1.35, 1.35); // Scale Mecha up by 35%
          ctx.translate(-player.x, -player.y);

          const armFloodlights = collectedLamps["C2-927"] || 1;
          const armLasers = collectedLamps["C2-928"] || 0;
          const antennaGoose = collectedLamps["C2-929"] || 0;
          const hoverBase = collectedLamps["C2-932"] || 0;

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
          // C2-927: Large Floodlight arms
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

          // C2-928: Sleek slim double-lasers
          if (armLasers > 0) {
            ctx.fillStyle = "#06b6d4"; // blue blaster muzzle
            ctx.fillRect(player.x - 34, player.y - 2, 6, 4);
            ctx.fillRect(player.x + 28, player.y - 2, 6, 4);
          }

          // C2-929: Flexible gooseneck radar antennas waving
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
            
            // Outer neon cyan glowing ring
            ctx.strokeStyle = "rgba(6, 182, 212, 0.85)";
            ctx.lineWidth = 3 + Math.sin(state.ticks / 4) * 1.5; // pulsating glow!
            ctx.shadowColor = "#22d3ee";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius + 18, 0, Math.PI * 2);
            ctx.stroke();
            
            // Translucent neon cyan filled field with hexagon wireframe grid overlay
            ctx.shadowBlur = 0; // reset shadow
            ctx.fillStyle = "rgba(6, 182, 212, 0.12)";
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius + 18, 0, Math.PI * 2);
            ctx.fill();

            // Hexagonal lines overlay
            ctx.strokeStyle = "rgba(34, 211, 238, 0.38)";
            ctx.lineWidth = 1.3;
            const shieldRadius = player.radius + 18;
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

      // DRAW COMPANION ROBOTS (For Boss Battle)
      if (stage === "BOSSBATTLE") {
        const collectedCompanionIDs = ["C2-927", "C2-928", "C2-929", "C2-932", "C2-934"].filter((id) => (collectedLamps[id] || 0) > 0);
        collectedCompanionIDs.forEach((wId, idx) => {
          const numCompanions = collectedCompanionIDs.length;
          const orbitAngle = (state.ticks / 50) + (idx * (Math.PI * 2 / numCompanions));
          const orbitRadius = 65 + Math.sin(state.ticks / 15 + idx) * 5;
          const cx = player.x + Math.cos(orbitAngle) * orbitRadius;
          const cy = player.y + Math.sin(orbitAngle) * orbitRadius;

          // 用 C2-932 機器人代替全部，後續再更新
          const compImg = companionRobotImagesRef.current["C2-932"] || companionRobotImagesRef.current[wId];
          if (compImg) {
            ctx.save();

            const isSkillActive = state.companionSkills && state.companionSkills[wId] > 0;

            // Draw shadow base shadow
            ctx.fillStyle = isSkillActive ? "rgba(34, 211, 238, 0.25)" : "rgba(253, 224, 71, 0.12)";
            ctx.beginPath();
            ctx.arc(cx, cy + 10, 10, 0, Math.PI * 2);
            ctx.fill();

            // Glowing Active Aura Ring
            if (isSkillActive) {
              const ringColor = wId === "C2-927" ? "#f97316" : wId === "C2-928" ? "#22d3ee" : wId === "C2-929" ? "#10b981" : wId === "C2-932" ? "#3b82f6" : "#f43f5e";
              ctx.shadowColor = ringColor;
              ctx.shadowBlur = 15;
              ctx.strokeStyle = ringColor;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(cx, cy, 18, 0, Math.PI * 2);
              ctx.stroke();
              ctx.shadowBlur = 0; // Reset shadow
            }

            const robotSize = 34;
            ctx.drawImage(
              compImg,
              cx - robotSize / 2,
              cy - robotSize / 2,
              robotSize,
              robotSize
            );

            // Draw ID label above robot (if skill is not blocking)
            if (!isSkillActive) {
              ctx.fillStyle = "rgba(224, 242, 254, 0.9)";
              ctx.font = "bold 8px monospace";
              ctx.textAlign = "center";
              ctx.fillText(wId, cx, cy - robotSize / 2 - 3);
            }

            // Draw beautiful retro skill speech bubble popup
            if (isSkillActive) {
              const skillNames: Record<string, string> = {
                "C2-927": "扇形極光淨化 ⚡",
                "C2-928": "高能脈衝直射 🎯",
                "C2-929": "自動蛇管鎖定 🔗",
                "C2-932": "慢速淨化力場 🌀",
                "C2-934": "穿透致命光炮 💥"
              };
              const skillColors: Record<string, string> = {
                "C2-927": "#fb923c",
                "C2-928": "#22d3ee",
                "C2-929": "#34d399",
                "C2-932": "#60a5fa",
                "C2-934": "#fb7185"
              };

              const skillName = skillNames[wId] || "輔助支援!";
              const skillColor = skillColors[wId] || "#e2e8f0";

              ctx.font = "bold 9px system-ui, sans-serif";
              const txtWidth = ctx.measureText(skillName).width;
              const paddingX = 6;
              const paddingY = 4;
              const bx_width = txtWidth + paddingX * 2;
              const bx_height = 14;
              const bx_x = cx - bx_width / 2;
              const bx_y = cy - robotSize / 2 - 22;

              // Rounded border box
              ctx.fillStyle = "rgba(9, 9, 11, 0.95)";
              ctx.strokeStyle = skillColor;
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(bx_x, bx_y, bx_width, bx_height, 3);
              } else {
                ctx.rect(bx_x, bx_y, bx_width, bx_height);
              }
              ctx.fill();
              ctx.stroke();

              // Tiny triangle arrow
              ctx.fillStyle = "rgba(9, 9, 11, 0.95)";
              ctx.beginPath();
              ctx.moveTo(cx - 3, bx_y + bx_height);
              ctx.lineTo(cx + 3, bx_y + bx_height);
              ctx.lineTo(cx, bx_y + bx_height + 3);
              ctx.closePath();
              ctx.fill();

              ctx.strokeStyle = skillColor;
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(cx - 3, bx_y + bx_height);
              ctx.lineTo(cx, bx_y + bx_height + 3);
              ctx.lineTo(cx + 3, bx_y + bx_height);
              ctx.stroke();

              // Text
              ctx.fillStyle = skillColor;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(skillName, cx, bx_y + bx_height / 2 + 0.5);
            }

            ctx.restore();
          }
        });
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

          // Cut extra sector cone if C2-927 sweep is active and in High Mode
          const angle = dx === 0 && dy === 0 ? 0 : Math.atan2(dy, dx);
          const fanSize = isHigh ? Math.PI / 1.6 : Math.PI / 3.5;
          // Expanded sweep distances for brighter visuals
          const sweepDist = isHigh ? 380 : 250;

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
  }, [stage, selectedChapter, batteryMode, weaponLevels, showUpgradeChoice, showTipModal, startTitleActive]);

  // Handle Level-up/Success actions
  const handleVictory = () => {
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
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/95 z-50 flex flex-col justify-between overflow-hidden font-mono text-zinc-100">
      
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
                
                <h1 className="text-xl xs:text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-none">
                  勇敢の燈燈小隊 <br />
                  <span className="text-xs sm:text-lg font-medium text-orange-400 tracking-widest block mt-1 uppercase">
                    SCI Industrial Light Purifier
                  </span>
                </h1>

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
                      className="flex-1 py-2.5 sm:py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-[10px] sm:text-xs tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-transform rounded"
                    >
                      <Play className="w-3.5 h-3.5 fill-zinc-950" />
                      <span>出發驅散黑暗</span>
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
          <div className="w-full bg-zinc-950/95 border-b border-zinc-900 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 z-15 select-none flex-shrink-0">
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
            </div>
          </div>

          {/* Core Interactive Web Game Canvas (Responsive vertical / horizontal) */}
          <div className="flex-1 w-full bg-zinc-950 flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden">
            <div className="relative w-full max-w-[1100px] flex items-center justify-center">
              <canvas 
                ref={canvasRef} 
                width={isMobile ? 500 : 1000} 
                height={isMobile ? 750 : 550} 
                className={
                  isMobile 
                    ? "w-full max-w-[420px] aspect-[5/7.5] border border-zinc-800 bg-zinc-950 shadow-2xl rounded" 
                    : "max-w-full max-h-[580px] md:max-h-[660px] border border-zinc-800 bg-zinc-950 aspect-[10/5.5] shadow-2xl rounded"
                }
              />
            </div>
          </div>

          {/* Bottom Game Controls Dock (Positioned at the very bottom, non-blocking) */}
          {showTouchControls && (
            <div className="w-full bg-zinc-950 border-t border-zinc-900 p-3 sm:p-4 flex flex-col xs:flex-row items-center justify-between gap-4 z-20">
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
              💡 <span className="text-zinc-200">提示：</span>利用移動方向調整 C2-927 扇形強光方向。收集金色手提箱 💼 會直接升級或增加新的工作燈零件！
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

                <div className="space-y-1.5 sm:space-y-2.5">
                  {upgradeChoices.map((choice, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectUpgrade(choice)}
                      className="w-full p-2 sm:p-3 bg-zinc-950/80 border border-zinc-800 hover:border-orange-500/80 text-left transition-all duration-200 cursor-pointer flex items-center gap-2 sm:gap-3.5 group rounded-none"
                    >
                      <div className="text-xl sm:text-2xl p-1.5 sm:p-2 bg-zinc-900 border border-zinc-800 rounded group-hover:bg-orange-500/10 group-hover:border-orange-500/30 transition-colors">
                        {choice.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] sm:text-xs font-black text-white group-hover:text-orange-400 transition-colors">{choice.name}</div>
                        <div className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5 font-sans leading-tight">{choice.desc}</div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-orange-400 transition-colors" />
                    </button>
                  ))}
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
                    • 利用移動方向調整 <strong>C2-927 扇形強光</strong> 的照射方向，驅散陰影怪物。
                  </p>
                  <p>
                    • 收集金色手提箱 <span className="text-amber-400 font-bold">💼</span> 會直接升級或增加新的工作燈零件！
                  </p>
                </div>
                <button
                  onClick={handleConfirmTip}
                  className="px-6 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-xs tracking-widest uppercase rounded shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer w-full"
                >
                  確定開始
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

      {/* 2.5 COLLECTION REPORT SCREEN */}
      {stage === "REPORT" && (() => {
        const totalCollectedCount = Object.values(collectedLamps).reduce<number>((acc, curr) => acc + (curr as number), 0);
        return (
          <div className="flex-1 w-full overflow-hidden p-3 sm:p-6 select-none animate-fade-in flex flex-col justify-between">
            <div className="flex flex-col justify-between max-w-5xl mx-auto h-full w-full py-1">
              
              {/* Header section */}
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-black uppercase tracking-widest">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SCI MISSION COLLECTION SUCCESS // 任務收集成果報告</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-widest leading-none">
                  科部工業工作燈 ─ 成果結算報告
                </h2>
                <p className="text-[10px] sm:text-xs text-zinc-400 font-sans max-w-2xl mx-auto">
                  戰區物資收集已結束。系統已解析本次任務中救回的所有 SCI 特規照明設備。
                  根據核心協定，<span className="text-amber-400 font-bold">所有已收集的燈具產品將自動實體化召喚為輔助機器人</span>，隨同您的重裝機甲加入最終 Boss 決戰！
                </p>
              </div>

              {/* Total summary board */}
              <div className="my-2.5 p-3 sm:p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl">
                    ⚡
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest font-black">SYSTEM DEPLOYMENT DATA</div>
                    <div className="text-[13px] font-bold text-white mt-0.5">
                      本次共成功配置 <span className="text-emerald-400 font-extrabold text-sm">{totalCollectedCount}</span> 件 SCI 照明設備
                    </div>
                  </div>
                </div>
                <div className="text-zinc-400 max-w-md text-left leading-relaxed text-[11px] sm:text-xs">
                  輔助機器人搭載了獨立光能核心，能夠自主射擊與施放力場，且不受敵方碰撞傷害。它們的加入將為 Boss 決戰提供強大的火力網支援！
                </div>
              </div>

              {/* 5 Robots Windows Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 my-2.5 overflow-y-auto max-h-[320px] md:max-h-none pr-1">
                {[
                  {
                    id: "C2-927",
                    name: "C2-927 摺疊式泛光手電筒",
                    english: "Foldable Sector Purifier",
                    stars: "★★★☆☆",
                    speed: "★★☆☆☆",
                    support: "★★☆☆☆",
                    desc: "提供 120° 寬幅扇形極光淨化，掃描並重創大範圍暗影威脅。"
                  },
                  {
                    id: "C2-928",
                    name: "C2-928 輕巧型直射手電筒",
                    english: "Slim Straight Pulsar",
                    stars: "★★☆☆☆",
                    speed: "★★★★★",
                    support: "★☆☆☆☆",
                    desc: "發射高能 Slim 光能直射脈衝，對最近的威脅展開超高速連射打擊。"
                  },
                  {
                    id: "C2-929",
                    name: "C2-929 蛇管工作燈",
                    english: "Gooseneck Laser",
                    stars: "★★★☆☆",
                    speed: "★★★★☆",
                    support: "★★★☆☆",
                    desc: "利用靈活蛇管全方位自動鎖定周圍暗影怪物，發射自動追蹤的光束鏈。"
                  },
                  {
                    id: "C2-932",
                    name: "C2-932 夾式工作燈",
                    english: "Clamp Slowing Field",
                    stars: "★★★★☆",
                    speed: "★☆☆☆☆",
                    support: "★★★★★",
                    desc: "在戰場中部署強力重壓光斑淨化力場，大幅減速並持續重創踏入力場內的所有怪物。"
                  },
                  {
                    id: "C2-934",
                    name: "C2-934 重型精準手持強光束",
                    english: "Heavy Precision Beam",
                    stars: "★★★★★",
                    speed: "★☆☆☆☆",
                    support: "★★☆☆☆",
                    desc: "聚光超載發射一條毀滅性的穿透全螢幕超重型致命光炮，清除路徑上一切障礙。"
                  }
                ].map((robot) => {
                  const count = collectedLamps[robot.id] || 0;
                  const isCollected = count > 0;
                  return (
                    <div
                      key={robot.id}
                      className={`border p-3.5 flex flex-col justify-between rounded-lg transition-all relative overflow-hidden h-full ${
                        isCollected
                          ? "bg-zinc-900/80 border-emerald-500/50 shadow-lg shadow-emerald-950/20"
                          : "bg-zinc-950/40 border-zinc-900 opacity-50"
                      }`}
                    >
                      {/* Glowing active outline */}
                      {isCollected && (
                        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 animate-pulse" />
                      )}

                      {/* ID & Status badge */}
                      <div className="flex justify-between items-center mb-2 font-mono">
                        <span className={`text-[10px] font-black tracking-wider ${isCollected ? "text-emerald-400" : "text-zinc-600"}`}>
                          {robot.id}
                        </span>
                        <span className={`text-[8px] px-1 py-0.5 rounded font-sans uppercase font-bold tracking-tight ${
                          isCollected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-900 text-zinc-600 border border-zinc-850"
                        }`}>
                          {isCollected ? `已召喚 x${count}` : "未配備"}
                        </span>
                      </div>

                      {/* Robot 8-bit Image Screen */}
                      <div className={`aspect-square w-full rounded border flex items-center justify-center p-2 mb-2 relative overflow-hidden ${
                        isCollected 
                          ? "bg-zinc-950 border-emerald-500/20" 
                          : "bg-zinc-900/20 border-zinc-900"
                      }`}>
                        {/* Grid overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0.1)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
                        
                        <img
                          src={`https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/main/8BIT-robot-RB/G-${robot.id}.png`}
                          alt={robot.id}
                          referrerPolicy="no-referrer"
                          className={`w-14 h-14 object-contain transition-transform duration-300 ${
                            isCollected ? "animate-bounce" : "grayscale opacity-20"
                          }`}
                        />

                        {/* Locked Overlay */}
                        {!isCollected && (
                          <div className="absolute inset-0 flex items-center justify-center text-lg select-none text-zinc-800">
                            🔒
                          </div>
                        )}
                      </div>

                      {/* Meta info */}
                      <div className="text-left flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className={`text-[11px] font-black truncate leading-tight ${isCollected ? "text-white" : "text-zinc-600"}`}>
                            {robot.name}
                          </h4>
                          <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest truncate">{robot.english}</div>
                        </div>

                        {/* Stats details */}
                        <div className="space-y-0.5 my-1.5 font-sans text-[8px] leading-none text-zinc-400">
                          <div className="flex justify-between">
                            <span>威力 (ATK):</span>
                            <span className={isCollected ? "text-amber-500" : "text-zinc-600"}>{robot.stars}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>攻速 (SPD):</span>
                            <span className={isCollected ? "text-sky-400" : "text-zinc-600"}>{robot.speed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>輔助 (SUP):</span>
                            <span className={isCollected ? "text-teal-400" : "text-zinc-600"}>{robot.support}</span>
                          </div>
                        </div>

                        <p className={`text-[9px] leading-tight font-sans mt-1 text-zinc-400 border-t border-zinc-900 pt-1.5 line-clamp-3 ${isCollected ? "text-zinc-300" : "text-zinc-600"}`}>
                          {robot.desc}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="border-t border-zinc-900 pt-3.5 flex items-center justify-between w-full font-mono text-xs">
                <div className="text-left text-zinc-500 text-[10px] sm:text-xs font-sans max-w-sm hidden md:block leading-tight">
                  💡 <b>溫馨提示：</b>點擊右下方按鈕，開始核心接駁程序。系統將根據收集的物資為您的主體裝配終極重裝機甲！
                </div>
                <button
                  onClick={() => {
                    triggerSound("click");
                    setStage("ASSEMBLY");
                  }}
                  className="py-3 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-black tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-500/15 rounded-lg w-full md:w-auto"
                >
                  <span>進入機甲合體程序 (PROCEED TO ASSEMBLY)</span>
                  <ChevronRight className="w-4 h-4 text-zinc-950" />
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 3. ASSEMBLY SEQUENCE MOUNT STATE */}
      {stage === "ASSEMBLY" && (
        <div className="flex-1 w-full overflow-hidden p-3 sm:p-6 select-none animate-fade-in flex flex-col justify-between">
          <div className="flex flex-col items-center justify-between max-w-4xl mx-auto h-full w-full py-1">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5" />
                <span>SCI ASSEMBLY SYSTEM</span>
              </div>
              <h2 className="text-lg sm:text-3xl font-black text-white tracking-wider leading-none">
                燈燈機器人 (LAMPI ROBOT) 自動組裝程序
              </h2>
              <p className="text-[10px] sm:text-xs text-zinc-400 font-sans max-w-xl mx-auto line-clamp-1 sm:line-clamp-none">
                收集到的所有 SCI 級工業工作燈已順利運抵軌道接駁庫。系統正根據本局收集的燈具配置裝配戰鬥機甲外裝！
              </p>
            </div>

            {/* Mobile Tabs */}
            <div className="flex md:hidden w-full border-b border-zinc-800 mt-2">
              <button
                onClick={() => setAssemblyTab("lamps")}
                className={`flex-1 py-1.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  assemblyTab === "lamps" 
                    ? "border-amber-500 text-amber-400" 
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                📂 收集物資報告
              </button>
              <button
                onClick={() => setAssemblyTab("specs")}
                className={`flex-1 py-1.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  assemblyTab === "specs" 
                    ? "border-cyan-500 text-cyan-400" 
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                📊 機甲核心戰力
              </button>
            </div>

            <div className="w-full flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 mt-3 overflow-hidden">
              {/* Left Box: Blueprints & collected details */}
              <div className={`bg-zinc-900/60 border border-zinc-800 p-3 sm:p-5 rounded flex flex-col justify-between overflow-hidden ${assemblyTab === "lamps" ? "flex" : "hidden md:flex"}`}>
                <div className="overflow-hidden flex flex-col h-full justify-between">
                  <h3 className="text-[10px] sm:text-xs font-bold text-amber-500 border-b border-zinc-800 pb-1.5">
                    📂 收集物資報告及裝備卡位
                  </h3>

                  <div className="space-y-1.5 sm:space-y-3 my-2 overflow-y-auto max-h-[140px] xs:max-h-[170px] md:max-h-none pr-1">
                    {Object.keys(collectedLamps).map((wId) => {
                      const amt = collectedLamps[wId] || 0;
                      const details = WEAPONS_INFO[wId];
                      return (
                        <div key={wId} className="flex items-center justify-between p-1.5 sm:p-2.5 bg-zinc-950 border border-zinc-800/80 rounded">
                          <div className="space-y-0.5">
                            <div className="text-[10px] sm:text-xs font-bold text-white">{wId}</div>
                            <div className="text-[8px] sm:text-[10px] text-zinc-400 font-sans">{details.name}</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] sm:text-[10px] text-zinc-500 font-sans">裝配數:</span>
                            <span className="px-1.5 py-0.5 bg-amber-500 text-zinc-950 font-black text-[10px] sm:text-xs rounded">{amt} 支</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dynamic summary mecha type */}
                  <div className="p-2 bg-zinc-950 border border-zinc-800/50 rounded font-sans text-[10px] sm:text-xs">
                    <span className="font-bold text-cyan-400">裝配評估結果：</span>
                    <span className="text-zinc-300">
                      {collectedLamps["C2-927"] > collectedLamps["C2-928"] 
                        ? "雙臂搭載大容量 Foldable 泛光極光炮，極致扇形淨化能力！" 
                        : "高速發射多道微型 Slim 直射脈衝，攻速非凡！"
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Box: Dynamic specs of assembled robot */}
              <div className={`bg-zinc-900/60 border border-zinc-800 p-3 sm:p-5 rounded flex flex-col justify-between overflow-hidden ${assemblyTab === "specs" ? "flex" : "hidden md:flex"}`}>
                <div className="overflow-hidden flex flex-col h-full justify-between">
                  <div>
                    <h3 className="text-[10px] sm:text-xs font-bold text-cyan-400 border-b border-zinc-800 pb-1.5">
                      📊 機甲核心戰力參數 (MECHA SPECS)
                    </h3>

                    <div className="space-y-2 sm:space-y-4 mt-2 font-sans text-[10px] sm:text-xs">
                      {/* Custom progress bars */}
                      <div>
                        <div className="flex justify-between text-zinc-400 text-[9px] sm:text-[11px] mb-0.5 sm:mb-1">
                          <span>護盾能量上限 (HEALTH RESISTANCE)</span>
                          <span className="text-white font-bold">{100 + totalCollectedCount * 15} HP</span>
                        </div>
                        <div className="w-full bg-zinc-950 h-1.5 sm:h-2 rounded overflow-hidden">
                          <div className="bg-rose-500 h-full transition-all duration-700" style={{ width: `${Math.min(100, 40 + totalCollectedCount * 8)}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-zinc-400 text-[9px] sm:text-[11px] mb-0.5 sm:mb-1">
                          <span>泛光衝擊傷害 (FLOOD IMPACT)</span>
                          <span className="text-white font-bold">Lv.{collectedLamps["C2-927"]}</span>
                        </div>
                        <div className="w-full bg-zinc-950 h-1.5 sm:h-2 rounded overflow-hidden">
                          <div className="bg-orange-500 h-full transition-all duration-700" style={{ width: `${Math.min(100, collectedLamps["C2-927"] * 20)}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-zinc-400 text-[9px] sm:text-[11px] mb-0.5 sm:mb-1">
                          <span>多重尋向蛇管雷射 (GOOSENECK LASERS)</span>
                          <span className="text-white font-bold">{collectedLamps["C2-929"]} 束雷射線</span>
                        </div>
                        <div className="w-full bg-zinc-950 h-1.5 sm:h-2 rounded overflow-hidden">
                          <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: `${Math.min(100, collectedLamps["C2-929"] * 25)}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-zinc-400 text-[9px] sm:text-[11px] mb-0.5 sm:mb-1">
                          <span>力場部署能力 (SLOWING FIELDS)</span>
                          <span className="text-white font-bold">{collectedLamps["C2-932"] > 0 ? "已開通" : "未部署"}</span>
                        </div>
                        <div className="w-full bg-zinc-950 h-1.5 sm:h-2 rounded overflow-hidden">
                          <div className="bg-amber-500 h-full transition-all duration-700" style={{ width: `${collectedLamps["C2-932"] > 0 ? 100 : 0}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { triggerSound("click"); setShowBossTipModal(true); }}
                    className="w-full py-2 xs:py-2.5 sm:py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 font-black text-xs sm:text-sm tracking-widest uppercase cursor-pointer flex items-center justify-center gap-1.5 mt-3 active:scale-95 transition-all shadow-lg shadow-cyan-500/10 rounded"
                  >
                    <Cpu className="w-3.5 h-3.5 text-zinc-950" />
                    <span>部署機甲・迎戰黑暗首領</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. BOSS BATTLE STATE */}
      {stage === "BOSSBATTLE" && (
        <div className="flex-1 flex flex-col relative w-full h-full select-none">
          {/* Streamlined, Compact Top Status Bar for Boss Battle */}
          <div className="w-full bg-zinc-950/95 border-b border-zinc-900 px-3 py-2 flex flex-wrap items-center justify-between gap-3 z-15 select-none flex-shrink-0">
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
                onClick={startGame}
                className="px-2 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-500 text-rose-400 text-[10px] font-bold uppercase rounded cursor-pointer flex items-center gap-1"
                title="重新開始挑戰"
              >
                <RotateCcw className="w-3 h-3" />
                <span>重新挑戰</span>
              </button>
            </div>
          </div>

          {/* Core Boss Arena Canvas & Support Squad HUD Layout */}
          <div className="flex-1 w-full bg-zinc-950 flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden">
            {(() => {
              const collectedCompanionIDs = ["C2-927", "C2-928", "C2-929", "C2-932", "C2-934"].filter((id) => (collectedLamps[id] || 0) > 0);
              return (
                <div className="w-full max-w-[1150px] flex flex-col lg:flex-row items-stretch justify-center gap-3 sm:gap-4 h-full">
                  
                  {/* Left Side: Game Canvas */}
                  <div className="flex-1 flex items-center justify-center relative">
                    <canvas 
                      ref={canvasRef} 
                      width={isMobile ? 500 : 1000} 
                      height={isMobile ? 750 : 550} 
                      className={
                        isMobile 
                          ? "w-full max-w-[420px] aspect-[5/7.5] border border-zinc-800 bg-zinc-950 shadow-2xl rounded" 
                          : "max-w-full max-h-[580px] md:max-h-[660px] border border-zinc-800 bg-zinc-950 aspect-[10/5.5] shadow-2xl rounded"
                      }
                    />
                  </div>

                  {/* Right Side: Deployed Support Squad HUD */}
                  <div className="w-full lg:w-[260px] flex flex-col bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-2.5 sm:p-3 select-none justify-between flex-shrink-0">
                    <div className="text-left mb-2 border-b border-zinc-850 pb-1.5 flex justify-between items-center">
                      <div>
                        <h4 className="text-[11px] sm:text-[12px] font-black text-white uppercase tracking-wider font-mono">已部署支援小隊</h4>
                        <p className="text-[8px] sm:text-[9px] text-zinc-500 font-mono tracking-widest leading-none mt-0.5">DEPLOYED SUPPORT SQUAD</p>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black px-1.5 py-0.5 rounded font-mono">
                        {collectedCompanionIDs.length}機
                      </span>
                    </div>

                    <div className="space-y-1.5 overflow-y-auto max-h-[160px] lg:max-h-[380px] pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                      {[
                        {
                          id: "C2-927",
                          name: "C2-927 摺疊式泛光手電筒",
                          skill: "120° 寬幅扇形極光淨化",
                          textColor: "text-orange-400"
                        },
                        {
                          id: "C2-928",
                          name: "C2-928 輕巧型直射手電筒",
                          skill: "高能直射脈衝高速連射",
                          textColor: "text-cyan-400"
                        },
                        {
                          id: "C2-929",
                          name: "C2-929 蛇管工作燈",
                          skill: "全方位自動追蹤雷射鏈",
                          textColor: "text-emerald-400"
                        },
                        {
                          id: "C2-932",
                          name: "C2-932 夾式工作燈",
                          skill: "強力慢速重壓淨化力場",
                          textColor: "text-blue-400"
                        },
                        {
                          id: "C2-934",
                          name: "C2-934 重型精準手持強光束",
                          skill: "穿透性全螢幕超重型光炮",
                          textColor: "text-rose-400"
                        }
                      ].map((mech) => {
                        const isDeployed = (collectedLamps[mech.id] || 0) > 0;
                        return (
                          <div 
                            key={mech.id} 
                            className={`p-1.5 sm:p-2 border rounded-lg transition-all ${
                              isDeployed 
                                ? "bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700/60" 
                                : "bg-zinc-950/10 border-zinc-900/40 opacity-25"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded bg-zinc-950 border flex items-center justify-center p-1 relative overflow-hidden flex-shrink-0 ${
                                isDeployed ? "border-zinc-800" : "border-zinc-950"
                              }`}>
                                <img
                                  src={`https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/main/8BIT-robot-RB/G-${mech.id}.png`}
                                  className={`w-6 h-6 object-contain ${isDeployed ? "" : "grayscale"}`}
                                  referrerPolicy="no-referrer"
                                  alt={mech.id}
                                />
                                {!isDeployed && <div className="absolute inset-0 bg-zinc-950/40 flex items-center justify-center text-[8px]">🔒</div>}
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="flex justify-between items-center leading-none">
                                  <span className={`text-[8px] sm:text-[9px] font-black font-mono tracking-wide ${isDeployed ? mech.textColor : "text-zinc-600"}`}>
                                    {mech.id}
                                  </span>
                                  <span className={`text-[7px] px-1 py-0.5 rounded font-black font-sans uppercase leading-none ${
                                    isDeployed ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-950 text-zinc-700"
                                  }`}>
                                    {isDeployed ? "ONLINE" : "OFFLINE"}
                                  </span>
                                </div>
                                <h5 className={`text-[9px] sm:text-[10px] font-extrabold truncate mt-0.5 ${isDeployed ? "text-white" : "text-zinc-600"}`}>
                                  {isDeployed ? mech.name.split(" ")[1] : "未配備"}
                                </h5>
                                <p className="text-[7.5px] sm:text-[8px] text-zinc-500 truncate leading-none mt-0.5">{mech.skill}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-zinc-850 pt-2 mt-2 text-[8px] text-zinc-500 text-left leading-relaxed">
                      ⚠️ <b>系統提示：</b><br />
                      最終決戰中已部署以上支援小隊。由於全模組外觀整合中，場中機器人造型目前皆暫以 <b>C2-932</b> 渲染。
                    </div>
                  </div>

                </div>
              );
            })()}
          </div>

          {/* Bottom Game Controls Dock for Boss Battle */}
          <div className="w-full bg-zinc-950 border-t border-zinc-900 p-2.5 sm:p-4 z-20 flex-shrink-0">
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
                onClick={() => { setStage("START"); setStartStep(1); }}
                className="flex-1 py-2 sm:py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[10px] sm:text-xs font-bold tracking-widest uppercase cursor-pointer rounded"
              >
                返回大廳 (RETURN)
              </button>
              <button
                onClick={startGame}
                className="flex-1 py-2 sm:py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] sm:text-xs tracking-widest uppercase cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20 rounded"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重新挑戰</span>
              </button>
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
                onClick={() => { setStage("START"); setStartStep(1); }}
                className="flex-1 py-2 sm:py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[10px] sm:text-xs font-bold tracking-widest uppercase cursor-pointer rounded"
              >
                返回基地 (BASE)
              </button>
              <button
                onClick={startGame}
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
      <div className="bg-zinc-950 border-t border-zinc-900 p-3.5 flex justify-between items-center text-[10px] text-zinc-500 font-sans z-10">
        <div>
          <span>勇敢の燈燈小隊 ── 攜手 SCI 工業照明科技 驅散一切未知的暗影</span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1 hover:text-orange-400 transition-colors cursor-pointer text-zinc-400 uppercase font-mono tracking-widest text-[10px]"
        >
          <X className="w-3.5 h-3.5" />
          <span>返回事業組基地 (EXIT MISSION)</span>
        </button>
      </div>

      {/* 🛠️ BOSS CONTROL OPERATIONS MODAL OVERLAY */}
      {showBossTipModal && (
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
                  startBossBattle();
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
