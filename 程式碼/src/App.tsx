import React, { useState, useEffect, useRef } from "react";
import { BACKGROUND_ASSETS } from "./data/backgroundAssets";
import {
  CHARACTERS,
  SCENARIOS,
  RESPONSE_DATABASE,
  DialogueLine,
  Scenario,
} from "./data/responses";
import { CharacterStandee, CustomSpeechBubble, detectEmotion, EmotionType } from "./components/Characters";
import { characterImages } from "./data/characterImages";
import { SceneCharacters } from "./components/SceneCharacters";
import { scenes } from "./data/scenes";
import { preloadImages } from "./utils/preloadImages";
import { FortuneModal, InstructionsModal, SettingsModal } from "./components/Modals";
import { StartScreen, BootingScreen } from "./components/StartScreen";
import { OpsDivision } from "./components/OpsDivision";
import { SupplyDivision } from "./components/SupplyDivision";
import { MissionGame } from "./components/MissionGame";
import { RobotLabPanel } from "./components/RobotLabPanel";
import { createDefaultRobotUpgrades, createEmptyMaterialInventory, type MaterialInventory, type RobotUpgradeLevels } from "./data/modificationSystem";
import { playSound, setMuteState, startAmbientHum, stopAmbientHum, startBackgroundMusic, stopBackgroundMusic, setMusicVolume, setMusicMuteState } from "./utils/audio";
import {
  Lightbulb,
  BookOpen,
  Settings,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  RefreshCw,
  Zap,
  CheckCircle,
  HelpCircle,
  Heart,
  Beaker,
  Shield,
  Boxes
} from "lucide-react";

// Helper to load saved images synchronously during initial state creation
const loadSavedImages = (id: string) => {
  const saved = localStorage.getItem(`custom_${id}_images`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
  }
  const legacy = localStorage.getItem(`custom_${id}`);
  return {
    happy: legacy || null,
    serious: null,
    sad: null,
    excited: null
  };
};

export default function App() {
  // Input and General State
  const [inputText, setInputText] = useState("");
  const [gameMode, setGameMode] = useState<"idle" | "counseling">("idle");
  const [textSpeed, setTextSpeed] = useState<"slow" | "normal" | "instant">("normal");
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [musicVolume, setMusicVolumeState] = useState(50);

  // Standee visual style customization (photo default as requested)
  const [standeeStyle, setStandeeStyle] = useState<"svg" | "photo">("photo");
  const [customClaire, setCustomClaire] = useState<Record<string, string | null>>(() => loadSavedImages("claire"));
  const [customEthan, setCustomEthan] = useState<Record<string, string | null>>(() => loadSavedImages("ethan"));
  const [customLeo, setCustomLeo] = useState<Record<string, string | null>>(() => loadSavedImages("leo"));

  // Dialogue Engine State
  const [storyLines, setStoryLines] = useState<DialogueLine[]>([]);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [visibleText, setVisibleText] = useState("");
  const [isTypewriterComplete, setIsTypewriterComplete] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [lastActiveSpeakerId, setLastActiveSpeakerId] = useState<string>("claire");

  // Mood / Dialogue switching states (Dynamic character expressions)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [characterMood, setCharacterMood] = useState<"normal" | "happy" | "sad" | "think">("normal");
  const [dialogueState, setDialogueState] = useState<"normal" | "success" | "failure" | "thinking">("normal");
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);

  // Affection points (Default 20 points for each character)
  const [affectionPoints, setAffectionPoints] = useState<Record<string, number>>({
    claire: 20,
    ethan: 20,
    leo: 20,
  });

  // Modal open states
  const [isFortuneOpen, setIsFortuneOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [pendingBossChapter, setPendingBossChapter] = useState<number | null>(null);
  const [missionActive, setMissionActive] = useState(false);
  const desiredTrackRef = useRef<"theme" | "normal">("theme");

  // Coins and Upgrades Systems
  const [coins, setCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("light_crew_coins");
      return saved ? parseInt(saved, 10) : 100; // start with 100 coins for a warm start
    } catch (e) {
      return 100;
    }
  });

  const [purchasedUpgrades, setPurchasedUpgrades] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("light_crew_upgrades");
      return saved ? JSON.parse(saved) : {
        start_battery: 0,
        shield_boost: 0,
        damage_boost: 0,
        speed_boost: 0
      };
    } catch (e) {
      return {
        start_battery: 0,
        shield_boost: 0,
        damage_boost: 0,
        speed_boost: 0
      };
    }
  });

  const [modificationMaterials, setModificationMaterials] = useState<MaterialInventory>(() => {
    const defaults = createEmptyMaterialInventory();
    try {
      const saved = localStorage.getItem("c2_932_materials");
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });

  const [robotUpgrades, setRobotUpgrades] = useState<RobotUpgradeLevels>(() => {
    const defaults = createDefaultRobotUpgrades();
    try {
      const saved = localStorage.getItem("c2_932_upgrades");
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });
  const [unlockedChapters, setUnlockedChapters] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("squad_unlocked_chapters");
      return saved ? JSON.parse(saved) : [1];
    } catch (e) {
      return [1];
    }
  });

  // Keep localStorage updated when state changes
  useEffect(() => {
    localStorage.setItem("light_crew_coins", coins.toString());
  }, [coins]);

  useEffect(() => {
    localStorage.setItem("light_crew_upgrades", JSON.stringify(purchasedUpgrades));
  }, [purchasedUpgrades]);

  useEffect(() => {
    localStorage.setItem("c2_932_materials", JSON.stringify(modificationMaterials));
  }, [modificationMaterials]);

  useEffect(() => {
    localStorage.setItem("c2_932_upgrades", JSON.stringify(robotUpgrades));
  }, [robotUpgrades]);

  useEffect(() => {
    localStorage.setItem("squad_unlocked_chapters", JSON.stringify(unlockedChapters));
  }, [unlockedChapters]);

  // App Phases state: start (landing), booting (cutscene loading), main (interactive dashboard)
  const [appPhase, setAppPhase] = useState<"start" | "booting" | "main">("start");
  // Current active area: lab (勇氣の實驗室), ops (營業機動事業部), or supply (補給調配部)
  const [currentScene, setCurrentScene] = useState<"lab" | "ops" | "supply">("ops");

  // Scene transit states
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingScene, setPendingScene] = useState<"lab" | "ops" | "supply" | null>(null);
  const [transitionStep, setTransitionStep] = useState(0);

  const handleSceneChange = (targetScene: "lab" | "ops" | "supply") => {
    if (targetScene === currentScene || isTransitioning) return;
    playSound("click");
    setPendingScene(targetScene);
    setIsTransitioning(true);
    setTransitionStep(1);

    // Preload character images for the target scene before transitioning
    const imagesToPreload: string[] = [];
    if (targetScene === "lab") {
      imagesToPreload.push(
        characterImages.claire.normal,
        characterImages.claire.happy,
        characterImages.claire.sad,
        characterImages.claire.think,
        characterImages.ethan.normal,
        characterImages.ethan.happy,
        characterImages.ethan.sad,
        characterImages.ethan.think,
        characterImages.leo.normal,
        characterImages.leo.happy,
        characterImages.leo.sad,
        characterImages.leo.think
      );
    }
    preloadImages(imagesToPreload);

    // Sequence of soft footstep sounds (typewriter clicks spaced out)
    let step = 1;
    const interval = setInterval(() => {
      playSound("typewriter");
      step += 1;
      setTransitionStep((prev) => Math.min(6, prev + 1));
      if (step >= 6) {
        clearInterval(interval);
      }
    }, 280);

    // Swap the scene behind the dark curtain
    setTimeout(() => {
      setCurrentScene(targetScene);
    }, 1200);

    // Fade out transition completely
    setTimeout(() => {
      setIsTransitioning(false);
      setPendingScene(null);
      setTransitionStep(0);
    }, 1800);
  };

  // Waveform meter simulation (for lab aesthetic)
  const [waveHeights, setWaveHeights] = useState<number[]>([15, 25, 40, 20, 10, 30, 45, 12, 18, 32, 22]);

  // Timers and Refs
  const typewriterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dialogueContainerRef = useRef<HTMLDivElement | null>(null);

  // Initialize and load saved statistics
  useEffect(() => {
    const savedAffection = localStorage.getItem("light_crew_affection");
    if (savedAffection) {
      try {
        setAffectionPoints(JSON.parse(savedAffection));
      } catch (e) {
        console.error("Failed to parse saved affection levels", e);
      }
    }

    const savedMute = localStorage.getItem("light_crew_mute");
    if (savedMute) {
      const muted = savedMute === "true";
      setIsMuted(muted);
      setMuteState(muted);
    }

    const savedMusicMute = localStorage.getItem("light_crew_music_mute");
    if (savedMusicMute) {
      const muted = savedMusicMute === "true";
      setIsMusicMuted(muted);
      setMusicMuteState(muted);
    } else {
      setIsMusicMuted(false);
      setMusicMuteState(false);
    }

    const savedMusicVolume = localStorage.getItem("light_crew_music_volume");
    if (savedMusicVolume) {
      const vol = parseInt(savedMusicVolume, 10);
      setMusicVolumeState(vol);
      setMusicVolume(vol);
    } else {
      setMusicVolumeState(50);
      setMusicVolume(50);
    }



    const savedStyle = localStorage.getItem("light_crew_standee_style");
    if (savedStyle) {
      setStandeeStyle(savedStyle as "svg" | "photo");
    } else {
      setStandeeStyle("photo"); // Default is photo
    }

    // Gentle wave animation for the lab dashboard
    const waveInterval = setInterval(() => {
      setWaveHeights((prev) =>
        prev.map((h) => Math.max(5, Math.min(60, h + (Math.random() * 20 - 10))))
      );
    }, 250);

    return () => {
      clearInterval(waveInterval);
      if (typewriterTimerRef.current) clearTimeout(typewriterTimerRef.current);
    };
  }, []);

  // Manage Ambient hum loop based on mute state + user gesture activation + app phase
  useEffect(() => {
    if (appPhase !== "main") {
      stopAmbientHum();
      return;
    }

    if (isMuted) {
      stopAmbientHum();
      return;
    }

    // Attempt to start immediately
    startAmbientHum();

    // Setup gesture triggers to handle modern browser autoplay protection
    const handleGesture = () => {
      if (!isMuted && appPhase === "main") {
        startAmbientHum();
      }
      document.removeEventListener("click", handleGesture);
      document.removeEventListener("touchstart", handleGesture);
    };

    document.addEventListener("click", handleGesture);
    document.addEventListener("touchstart", handleGesture);

    return () => {
      stopAmbientHum();
      document.removeEventListener("click", handleGesture);
      document.removeEventListener("touchstart", handleGesture);
    };
  }, [isMuted]);

  // Manage Background Music (BGM) loop based on isMusicMuted, user gesture, and app phase
  const desiredTrack = appPhase === "start" || missionActive ? "theme" : "normal";
  desiredTrackRef.current = desiredTrack;
  useEffect(() => {
    if (isMusicMuted) {
      stopBackgroundMusic();
      return;
    }

    // In 'start' phase, the StartScreen component handles its own BGM trigger state.
    // In 'booting' and 'main' phases, we run background music seamlessly.
    if (appPhase === "booting" || appPhase === "main") {
      startBackgroundMusic(desiredTrack);
    }

    // Setup interactive gesture listener to satisfy browser autoplay restrictions
    const handleGesture = () => {
      if (!isMusicMuted && (appPhase === "booting" || appPhase === "main")) {
        startBackgroundMusic(desiredTrackRef.current);
      }
    };

    document.addEventListener("click", handleGesture);
    document.addEventListener("touchstart", handleGesture);

    return () => {
      document.removeEventListener("click", handleGesture);
      document.removeEventListener("touchstart", handleGesture);
    };
  }, [isMusicMuted, appPhase, desiredTrack]);

  const handleMissionOpenChange = (open: boolean) => {
    setMissionActive(open);
    setIsGameOpen(open);
    desiredTrackRef.current = open ? "theme" : "normal";
    startBackgroundMusic(open ? "theme" : "normal");
  };


  // Save mute settings
  const handleMuteToggle = (muted: boolean) => {
    setIsMuted(muted);
    setMuteState(muted);
    localStorage.setItem("light_crew_mute", muted ? "true" : "false");
  };

  const handleMusicMuteToggle = (muted: boolean) => {
    setIsMusicMuted(muted);
    setMusicMuteState(muted);
    localStorage.setItem("light_crew_music_mute", muted ? "true" : "false");
  };

  const handleMusicVolumeChange = (vol: number) => {
    setMusicVolumeState(vol);
    setMusicVolume(vol);
    localStorage.setItem("light_crew_music_volume", vol.toString());
  };

  // Save speed settings
  const handleSpeedChange = (speed: "slow" | "normal" | "instant") => {
    setTextSpeed(speed);
    localStorage.setItem("light_crew_text_speed", speed);
  };

  // Reset stats
  const handleResetData = () => {
    const initial = { claire: 20, ethan: 20, leo: 20 };
    setAffectionPoints(initial);
    localStorage.setItem("light_crew_affection", JSON.stringify(initial));
    setGameMode("idle");
    setStoryLines([]);
    setInputText("");
    
    // Also reset custom images
    localStorage.removeItem("custom_claire");
    localStorage.removeItem("custom_ethan");
    localStorage.removeItem("custom_leo");
    localStorage.removeItem("custom_claire_images");
    localStorage.removeItem("custom_ethan_images");
    localStorage.removeItem("custom_leo_images");
    setCustomClaire({ happy: null, serious: null, sad: null, excited: null });
    setCustomEthan({ happy: null, serious: null, sad: null, excited: null });
    setCustomLeo({ happy: null, serious: null, sad: null, excited: null });

    // Reset coins and upgrades
    setCoins(100);
    setPurchasedUpgrades({
      start_battery: 0,
      shield_boost: 0,
      damage_boost: 0,
      speed_boost: 0
    });
    localStorage.setItem("light_crew_coins", "100");
    localStorage.setItem("light_crew_upgrades", JSON.stringify({
      start_battery: 0,
      shield_boost: 0,
      damage_boost: 0,
      speed_boost: 0
    }));

    setModificationMaterials(createEmptyMaterialInventory());
    setRobotUpgrades(createDefaultRobotUpgrades());
    localStorage.removeItem("c2_932_materials");
    localStorage.removeItem("c2_932_upgrades");

    // Reset unlocked chapters in game missions
    setUnlockedChapters([1]);
    localStorage.setItem("squad_unlocked_chapters", JSON.stringify([1]));

    // Reset custom exhibition URLs to defaults as part of full system reset
    localStorage.removeItem("sci_exhibition_urls");

    // Display a blocking alert (catch-safe for sandboxed iframes)
    try {
      alert("系統數據、任務關卡與金幣資源已成功重置！系統將自動重新加載以套用全新狀態！");
    } catch (e) {
      console.warn("Alert blocked in sandboxed iframe.", e);
    }

    // Force refresh the page to guarantee that all React states, caches, canvas loops, and contexts are perfectly rebuilt
    window.location.reload();
  };

  const handleStandeeStyleChange = (style: "svg" | "photo") => {
    setStandeeStyle(style);
    localStorage.setItem("light_crew_standee_style", style);
  };

  const handleCustomImageChange = (id: string, emotion: string, url: string | null) => {
    if (id === "claire") {
      const updated = { ...customClaire, [emotion]: url };
      setCustomClaire(updated);
      try {
        localStorage.setItem("custom_claire_images", JSON.stringify(updated));
      } catch (e) {
        console.warn("Storage quota exceeded, saved to current session state only.", e);
      }
    }
    if (id === "ethan") {
      const updated = { ...customEthan, [emotion]: url };
      setCustomEthan(updated);
      try {
        localStorage.setItem("custom_ethan_images", JSON.stringify(updated));
      } catch (e) {
        console.warn("Storage quota exceeded, saved to current session state only.", e);
      }
    }
    if (id === "leo") {
      const updated = { ...customLeo, [emotion]: url };
      setCustomLeo(updated);
      try {
        localStorage.setItem("custom_leo_images", JSON.stringify(updated));
      } catch (e) {
        console.warn("Storage quota exceeded, saved to current session state only.", e);
      }
    }
  };



  // Character interaction handler (disabled affection increase as requested)
  const handleCharacterInteraction = (charId: string) => {
    // 刪除好感度上升功能，點擊角色不再增加好感度
    if (gameMode === "idle") {
      // 在手機版本上，點擊目前顯示的角色會循環切換至燈燈小隊的下一個隊員，增加互動感！
      const currentIndex = CHARACTERS.findIndex((c) => c.id === charId);
      const nextIndex = (currentIndex + 1) % CHARACTERS.length;
      setLastActiveSpeakerId(CHARACTERS[nextIndex].id);
    }
  };

  // Run Typewriter Effect for dialogue
  useEffect(() => {
    if (storyLines.length === 0 || currentDialogueIndex >= storyLines.length) {
      return;
    }

    if (typewriterTimerRef.current) {
      clearTimeout(typewriterTimerRef.current);
    }

    const currentLine = storyLines[currentDialogueIndex];
    const fullText = currentLine.text;

    if (textSpeed === "instant") {
      setVisibleText(fullText);
      setIsTypewriterComplete(true);
      return;
    }

    setIsTypewriterComplete(false);
    setVisibleText("");

    let charIndex = 0;
    const typingDelay = textSpeed === "slow" ? 55 : 30;

    const typeNextChar = () => {
      if (charIndex < fullText.length) {
        setVisibleText(fullText.slice(0, charIndex + 1));
        playSound("typewriter");
        charIndex++;
        typewriterTimerRef.current = setTimeout(typeNextChar, typingDelay);
      } else {
        setIsTypewriterComplete(true);
      }
    };

    // Use a small 20ms timeout to allow React state batching and empty text transition to fully commit first.
    // This guarantees the first character is never swallowed or batched out of sequence.
    typewriterTimerRef.current = setTimeout(typeNextChar, 20);

    return () => {
      if (typewriterTimerRef.current) {
        clearTimeout(typewriterTimerRef.current);
      }
    };
  }, [storyLines, currentDialogueIndex, textSpeed]);

  // Keyword Matching Logic to generate counselor sequence
  const handleCounselSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const query = inputText.trim();
    if (!query) return;

    playSound("click");

    // Match Scenario based on keywords
    let matchedScenario: Scenario = SCENARIOS.find((sc) => sc.id === "others")!;

    for (const scenario of SCENARIOS) {
      if (scenario.id === "others") continue;
      const matches = scenario.keywords.some((keyword) => query.includes(keyword));
      if (matches) {
        matchedScenario = scenario;
        break;
      }
    }

    setSelectedScenario(matchedScenario);

    const responseSet = RESPONSE_DATABASE[matchedScenario.id] || RESPONSE_DATABASE.others;

    const claireText = responseSet.claire[Math.floor(Math.random() * responseSet.claire.length)];
    const ethanText = responseSet.ethan[Math.floor(Math.random() * responseSet.ethan.length)];
    const leoText = responseSet.leo[Math.floor(Math.random() * responseSet.leo.length)];

    // Pick random banter
    const banterSet = responseSet.banter;
    const randomBanter = banterSet[Math.floor(Math.random() * banterSet.length)] || [];

    // Construct story lines
    const flow: DialogueLine[] = [
      {
        speakerId: "narrator",
        text: `【系統消息】正在解密高流明戀愛電路... 已匹配到「${matchedScenario.name}」故障迴路！`,
      },
      {
        speakerId: "player",
        text: `${query}`,
      },
      {
        speakerId: "claire",
        text: claireText,
      },
      {
        speakerId: "ethan",
        text: ethanText,
      },
      {
        speakerId: "leo",
        text: leoText,
      },
      ...randomBanter,
      {
        speakerId: "narrator",
        text: `【系統消息】電路重組完成！你可以點擊「再問一次」嘗試其他煩惱，或者抽取今日戀愛小籤！`,
      },
    ];

    setStoryLines(flow);
    setCurrentDialogueIndex(0);
    setGameMode("counseling");
  };

  // Progression Click Handler on dialogue box
  const handleDialogueNext = () => {
    if (storyLines.length === 0) return;

    if (!isTypewriterComplete) {
      // Skip typing effect and show entire string immediately
      if (typewriterTimerRef.current) {
        clearTimeout(typewriterTimerRef.current);
      }
      const currentLine = storyLines[currentDialogueIndex];
      setVisibleText(currentLine.text);
      setIsTypewriterComplete(true);
      playSound("click");
      return;
    }

    playSound("click");

    if (currentDialogueIndex < storyLines.length - 1) {
      setCurrentDialogueIndex((prev) => prev + 1);
    } else {
      // Completed full dialogue cycle, stay on final page
      // Do nothing, show results screen
    }
  };

  // Speaker configuration
  const getActiveSpeakerId = (): string | null => {
    if (storyLines.length === 0 || currentDialogueIndex >= storyLines.length) {
      return null;
    }
    const currentLine = storyLines[currentDialogueIndex];
    if (currentLine.speakerId === "player" || currentLine.speakerId === "narrator") {
      return null;
    }
    return currentLine.speakerId;
  };

  const activeSpeakerId = getActiveSpeakerId();

  // Keep lastActiveSpeakerId in sync with the current speaking character
  useEffect(() => {
    if (activeSpeakerId) {
      setLastActiveSpeakerId(activeSpeakerId);
    }
  }, [activeSpeakerId]);

  // Get active speaker profile
  const activeSpeaker = CHARACTERS.find((char) => char.id === activeSpeakerId);

  // Get speaker color badge styling
  const getSpeakerBadgeStyle = (speakerId: string) => {
    switch (speakerId) {
      case "claire":
        return "bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]";
      case "ethan":
        return "bg-sky-500 text-white shadow-[0_0_12px_rgba(14,165,233,0.4)]";
      case "leo":
        return "bg-amber-500 text-zinc-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)]";
      case "player":
        return "bg-zinc-100 text-zinc-950 font-bold shadow-[0_0_8px_rgba(255,255,255,0.3)]";
      case "narrator":
        return "bg-zinc-800 text-zinc-300 font-mono text-[10px] tracking-widest border border-zinc-700";
      default:
        return "bg-zinc-700 text-zinc-200";
    }
  };

  const getSpeakerNameText = (speakerId: string) => {
    if (speakerId === "player") return "💬 你的心聲 (PLAYER)";
    if (speakerId === "narrator") return "⚡ 系統診斷迴路 (DIAGNOSTIC)";
    const char = CHARACTERS.find((c) => c.id === speakerId);
    return char ? `💡 ${char.name} (${char.englishName})` : speakerId.toUpperCase();
  };

  const isBanterOnGoing = () => {
    if (storyLines.length === 0 || currentDialogueIndex >= storyLines.length) return false;
    // index is after 4 (the initial answers)
    return currentDialogueIndex >= 5 && currentDialogueIndex < storyLines.length - 1;
  };

  return (
    <div id="game-container" className="h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col justify-between relative overflow-hidden font-sans border-2 sm:border-8 border-zinc-900">
      
      {/* --- INDUSTRIAL LAB REALISTIC BACKGROUND --- */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        {/* Background Image: Moody concrete industrial lab workshop or Mobile operations van garage */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-65 filter brightness-75 contrast-100 transition-all duration-700 ease-in-out"
          style={{ 
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundImage:
              currentScene === "lab"
                ? `url(${BACKGROUND_ASSETS.lab})`
                : currentScene === "ops"
                ? `url(${BACKGROUND_ASSETS.business})`
                : `url(${BACKGROUND_ASSETS.purchase})`,
          }}
        />

        {/* Ambient Dark overlay & cinematic vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 opacity-95" />
        <div className="absolute inset-0 bg-radial-gradient-to-b from-transparent to-black/70 pointer-events-none" />



        {/* Floor Warning Stripes at the bottom resembling the floor stripes in the photo */}
        <div className="absolute bottom-0 inset-x-0 h-3 opacity-30 select-none pointer-events-none z-10"
          style={{
            background: "repeating-linear-gradient(45deg, #eab308, #eab308 8px, #000000 8px, #000000 16px)"
          }}
        />

        {/* Glowing warm spotlights resembling high lumen lamps in the photo */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-orange-500/5 blur-[90px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-[100px]" />
      </div>

      {/* --- INDUSTRIAL LAB DECORATIVE OVERLAYS --- */}
      {/* 1. Technical Grid Overlay */}
      <div className="absolute inset-0 opacity-15 pointer-events-none z-0">
        <div className="absolute top-12 left-12 text-[10px] tracking-[0.2em] text-zinc-500 font-mono">PROJECT: LIGHT-UNIT-7 // STAFF ONLY</div>
        <div className="absolute bottom-48 right-12 text-[10px] tracking-[0.2em] text-orange-500 font-mono rotate-90">WARNING: HIGH LUMEN RADIATION</div>
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #27272a 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      {/* 2. Abstract Ceiling Metal Truss and Lamps */}
      <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-black/80 to-transparent z-0 pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 flex justify-around opacity-40">
          <div className="w-0.5 h-16 bg-zinc-700 relative">
            <div className="absolute bottom-[-10px] left-[-10px] w-5 h-5 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_#f97316]" />
            </div>
          </div>
          <div className="w-0.5 h-20 bg-zinc-700 relative hidden md:block">
            <div className="absolute bottom-[-10px] left-[-10px] w-5 h-5 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse shadow-[0_0_10px_#0ea5e9]" />
            </div>
          </div>
          <div className="w-0.5 h-14 bg-zinc-700 relative">
            <div className="absolute bottom-[-10px] left-[-10px] w-5 h-5 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. UI Decorative Border Accents */}
      <div className="absolute top-4 right-4 p-2 opacity-30 select-none pointer-events-none">
        <div className="w-24 h-[1px] bg-zinc-700"></div>
        <div className="h-24 w-[1px] bg-zinc-700 absolute top-0 right-0"></div>
      </div>
      <div className="absolute bottom-4 left-4 p-2 opacity-30 select-none pointer-events-none">
        <div className="w-24 h-[1px] bg-zinc-700"></div>
        <div className="h-24 w-[1px] bg-zinc-700 absolute bottom-0 left-0"></div>
      </div>


      {appPhase === "start" && (
        <StartScreen
          onStart={() => setAppPhase("booting")}
          isMusicMuted={isMusicMuted}
          onMusicMuteToggle={handleMusicMuteToggle}
          musicVolume={musicVolume}
          onMusicVolumeChange={handleMusicVolumeChange}
        />
      )}

      {appPhase === "booting" && (
        <BootingScreen
          onComplete={() => setAppPhase("main")}
        />
      )}

      {appPhase === "main" && (
        <>
          {/* --- HEADER BAR (TOP) --- */}
          <header className="relative z-30 border-b border-zinc-900 bg-black/40 backdrop-blur px-2.5 py-1.5 sm:px-6 sm:py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-4">
          <div className="w-5 h-5 sm:w-10 sm:h-10 border border-orange-500 flex items-center justify-center flex-shrink-0">
            <div className="w-1.5 h-1.5 sm:w-4 sm:h-4 bg-orange-500 animate-pulse"></div>
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-[11px] sm:text-sm md:text-lg font-bold tracking-wider sm:tracking-widest text-white truncate max-w-[120px] xs:max-w-none">
              燈燈小隊基地
            </h1>
            <span className="text-[6px] sm:text-[9px] font-mono text-zinc-500 tracking-widest truncate">
              PROJECT: LIGHT-UNIT-7 // DIAGNOSIS
            </span>
          </div>
        </div>

        {/* Top interactive action buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Gold Coin Chip */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 bg-zinc-900/90 border border-zinc-800 text-yellow-400 font-extrabold text-[10px] sm:text-xs shadow-[0_0_10px_rgba(251,191,36,0.08)] select-none">
            <span className="animate-pulse">🪙</span>
            <span>{coins} <span className="hidden xs:inline text-[9.5px] text-zinc-500 font-bold ml-0.5">金幣</span></span>
          </div>

          <button
            onClick={() => { playSound("click"); setIsFortuneOpen(true); }}
            className="p-1 sm:p-2 border border-orange-500/80 hover:border-orange-400 bg-black/60 backdrop-blur text-orange-400 transition-all duration-200 rounded-none cursor-pointer flex items-center justify-center"
            title="今日小籤"
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 animate-pulse" />
          </button>

          <button
            onClick={() => { playSound("click"); setIsInstructionsOpen(true); }}
            className="p-1 sm:p-2 border border-zinc-700 hover:border-zinc-500 bg-black/40 backdrop-blur text-zinc-300 transition-all duration-200 rounded-none cursor-pointer flex items-center justify-center"
            title="遊戲說明"
          >
            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-400" />
          </button>

          <button
            onClick={() => { playSound("click"); setIsSettingsOpen(true); }}
            className="p-1 sm:p-2 border border-zinc-700 hover:border-zinc-500 bg-black/40 backdrop-blur text-zinc-300 transition-all duration-200 rounded-none cursor-pointer flex items-center justify-center"
            title="調整參數設定"
          >
            <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </header>

      {/* --- HIGH-TECH AREA NAV BAR (場景切換) --- */}
      <div className="relative z-30 bg-zinc-950/95 border-b border-zinc-900 px-2 py-1 sm:px-6 flex flex-row items-center justify-between gap-1 text-[10px] sm:text-xs font-mono shrink-0">
        <div className="items-center gap-1.5 text-zinc-500 text-[9px] sm:text-xs hidden xs:flex truncate max-w-[40%]">
          <span className="w-1.5 h-1.5 bg-orange-500 animate-pulse flex-shrink-0" />
          <span className="hidden sm:inline">CURRENT_SECTOR:</span>
          <span className="text-orange-400 font-bold uppercase truncate">
            {currentScene === "lab"
              ? "LOVE_LAB"
              : currentScene === "ops"
              ? "MOB_OPS"
              : "SUPPLY"
            }
          </span>
        </div>
        
        <div className="flex items-center gap-0.5 sm:gap-1.5 w-full xs:w-auto justify-center xs:justify-end overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleSceneChange("lab")}
            className={`px-3 py-1 sm:px-4 sm:py-1.5 border text-[11px] sm:text-sm font-bold font-sans transition-all active:scale-95 cursor-pointer flex items-center gap-1.5
              ${currentScene === "lab"
                ? "bg-orange-500/15 border-orange-500 text-orange-400 font-black"
                : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200"
              }
            `}
          >
            <Beaker className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
            <span>勇氣の實驗室</span>
          </button>
          <button
            onClick={() => handleSceneChange("ops")}
            className={`px-3 py-1 sm:px-4 sm:py-1.5 border text-[11px] sm:text-sm font-bold font-sans transition-all active:scale-95 cursor-pointer flex items-center gap-1.5
              ${currentScene === "ops"
                ? "bg-orange-500/15 border-orange-500 text-orange-400 font-black"
                : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200"
              }
            `}
          >
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
            <span>營業機動部</span>
          </button>
          <button
            onClick={() => handleSceneChange("supply")}
            className={`px-3 py-1 sm:px-4 sm:py-1.5 border text-[11px] sm:text-sm font-bold font-sans transition-all active:scale-95 cursor-pointer flex items-center gap-1.5
              ${currentScene === "supply"
                ? "bg-orange-500/15 border-orange-500 text-orange-400 font-black"
                : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200"
              }
            `}
          >
            <Boxes className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
            <span>後勤補給部</span>
          </button>
        </div>
      </div>


      {currentScene === "lab" ? (
        <main className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-6 py-1 sm:py-3 flex flex-col justify-end relative z-20 overflow-hidden">
        <RobotLabPanel materials={modificationMaterials} setMaterials={setModificationMaterials} upgrades={robotUpgrades} setUpgrades={setRobotUpgrades} playSound={playSound} />
        {pendingBossChapter !== null && (
          <button
            onClick={() => handleMissionOpenChange(true)}
            className="mx-auto mt-2 min-h-11 w-full max-w-md rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 px-4 text-sm font-black text-zinc-950"
          >
            繼續挑戰 Boss（C2-932）
          </button>
        )}
        
        {/* Three Characters Container */}
        <div className="flex justify-center items-center sm:items-end sm:grid sm:grid-cols-3 gap-1.5 sm:gap-3 md:gap-6 w-full relative mb-2 sm:mb-4 flex-1 min-h-0">
          {activeSceneId ? (
            <div className="col-span-3 w-full h-[140px] xs:h-[180px] sm:h-[280px] md:h-[320px] lg:h-[350px]">
              <SceneCharacters sceneId={activeSceneId} />
            </div>
          ) : (
            CHARACTERS.map((char) => {
              const isSpeaking = activeSpeakerId === char.id;
              const currentLine = storyLines[currentDialogueIndex];
              const currentLineText = (isSpeaking && currentLine) ? currentLine.text : "";
              
              let currentEmotion = isSpeaking ? detectEmotion(currentLineText, char.id) : "happy";
              
              // Dynamic Overrides based on system variables
              if (dialogueState === "success") {
                currentEmotion = "happy";
              } else if (dialogueState === "failure") {
                currentEmotion = "sad";
              } else if (dialogueState === "thinking") {
                currentEmotion = "serious";
              } else if (characterMood === "happy") {
                currentEmotion = "happy";
              } else if (characterMood === "sad") {
                currentEmotion = "sad";
              } else if (characterMood === "think") {
                currentEmotion = "serious";
              } else if (selectedChoice === "good") {
                currentEmotion = "happy";
              } else if (selectedChoice === "bad") {
                currentEmotion = "sad";
              } else if (currentStep > 5) {
                currentEmotion = "happy";
              }

              const customImagesObj = char.id === "claire" ? customClaire : char.id === "ethan" ? customEthan : customLeo;

              return (
                <CharacterStandee
                  key={char.id}
                  character={char}
                  isActive={activeSpeakerId === null || activeSpeakerId === char.id}
                  isSpeaking={isSpeaking}
                  isAnySpeaking={activeSpeakerId !== null}
                  onInteraction={() => handleCharacterInteraction(char.id)}
                  customImages={customImagesObj}
                  emotion={currentEmotion}
                />
              );
            })
          )}

          {/* Floated speech bubble over speaking character */}
          {!activeSceneId && activeSpeakerId && isTypewriterComplete && (
            <CustomSpeechBubble
              characterId={activeSpeakerId}
              text={
                activeSpeakerId === "claire"
                  ? "沒關係，我陪你。"
                  : activeSpeakerId === "ethan"
                    ? "先別急，我們看事實。"
                    : "交給我！"
              }
            />
          )}
        </div>


        {/* --- NARRATIVE / DIALOGUE PANEL (LOWER) --- */}
        <div className="w-full relative z-50 min-h-[95px] xs:min-h-[110px] sm:min-h-[170px] flex flex-col justify-end shrink-0">
          {gameMode === "counseling" && storyLines.length > 0 ? (
            // VISUAL NOVEL CONSOLE DIALOGUE BOX
            <div
              ref={dialogueContainerRef}
              onClick={handleDialogueNext}
              className={`w-full min-h-[90px] xs:min-h-[105px] sm:min-h-[145px] md:min-h-[160px] p-2 xs:p-3 sm:p-6 rounded-none border bg-zinc-900/90 backdrop-blur-md cursor-pointer select-none relative transition-all duration-300
                ${
                  activeSpeakerId === "claire"
                    ? "border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.15)]"
                    : activeSpeakerId === "ethan"
                      ? "border-sky-500/60 shadow-[0_0_30px_rgba(14,165,233,0.15)]"
                      : activeSpeakerId === "leo"
                        ? "border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.15)]"
                        : "border-zinc-800 shadow-2xl"
                }
              `}
            >
              {/* Speaker name label */}
              {storyLines[currentDialogueIndex] && (
                <div className="absolute -top-3 sm:-top-4 left-3 sm:left-6 flex items-center">
                  <span className={`text-[7px] xs:text-[8px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 sm:px-4 sm:py-1.5 border rounded-none
                    ${getSpeakerBadgeStyle(storyLines[currentDialogueIndex].speakerId)}
                  `}>
                    SPEAKING: {getSpeakerNameText(storyLines[currentDialogueIndex].speakerId)}
                  </span>
                </div>
              )}

              {/* Speaker Custom Catchphrase banner (Subtle) */}
              {activeSpeaker && (
                <div className="absolute top-1 sm:top-2 right-2 sm:right-4 text-[7px] xs:text-[8px] sm:text-[10px] font-mono font-medium italic opacity-40 text-zinc-500 select-none hidden xs:block">
                  {activeSpeaker.catchphrase}
                </div>
              )}

              {/* Dialogue content text */}
              <div className="mt-0.5 xs:mt-1.5 sm:mt-3 text-zinc-200 text-[11px] xs:text-xs sm:text-base leading-relaxed font-sans font-medium h-[48px] xs:h-[65px] sm:h-[80px] overflow-y-auto pr-1">
                {visibleText}
                
                {/* Visual Cursor when typing */}
                {!isTypewriterComplete && (
                  <span className="inline-block w-1.5 h-3 ml-1 bg-orange-500 animate-pulse" />
                )}
              </div>

              {/* Bottom control / Progress hint */}
              <div className="absolute bottom-1 xs:bottom-2 right-2 sm:right-4 flex items-center gap-1 text-[7px] xs:text-[8px] sm:text-[10px] font-mono text-zinc-500 select-none">
                {isBanterOnGoing() && (
                  <span className="text-amber-500/80 font-bold bg-amber-950/30 px-1.5 py-0.5 rounded-none border border-amber-800/30 animate-pulse">
                    ??BANTER_FLOW
                  </span>
                )}
                <span>
                  {currentDialogueIndex + 1} / {storyLines.length}
                </span>
                <span className="text-xs text-zinc-400 animate-bounce ml-1">
                  {isTypewriterComplete ? "▼" : "▷"}
                </span>
              </div>
            </div>
          ) : (
            // IDLE ENTRANCE MESSAGE
            <div className="w-full p-2 xs:p-3 sm:p-6 rounded-none border border-zinc-800 bg-zinc-900/80 backdrop-blur-md text-center space-y-1.5 xs:space-y-3 shadow-2xl relative">
              <div className="absolute -top-2.5 left-3 sm:left-6 text-[6px] sm:text-[8px] font-mono tracking-widest text-zinc-500 bg-zinc-950 px-1.5 py-0.5 border border-zinc-800">
                SYSTEM_IDLE // RECEPTACLE_READY
              </div>
              <h4 className="font-sans font-bold text-[10px] sm:text-base tracking-wider sm:tracking-widest text-zinc-200 uppercase mt-0.5">
                ⚙️ 燈燈小隊研發實驗室安全迴路
              </h4>
              <p className="text-[10px] sm:text-xs md:text-sm text-zinc-400 leading-normal max-w-xl mx-auto hidden sm:block">
                在下方終端機中輸入你的已讀不回、告白、吃醋、冷戰或分手等戀愛疑難雜症。
                系統將自動進行情感訊號抓取，並由三位照明專家 Claire、Ethan、Leo 為你進行愛情電路診斷。
              </p>
              
            </div>
          )}
        </div>

      </main>
      ) : currentScene === "ops" ? (
        <OpsDivision
          isMuted={isMuted}
          playSound={playSound}
          isGameOpen={isGameOpen}
          setIsGameOpen={handleMissionOpenChange}
          coins={coins}
          purchasedUpgrades={purchasedUpgrades}
        />
      ) : (
        <SupplyDivision
          playSound={playSound}
          coins={coins}
          setCoins={setCoins}
          purchasedUpgrades={purchasedUpgrades}
          setPurchasedUpgrades={setPurchasedUpgrades}
        />
      )}


      {/* --- FOOTER USER INPUT TERMINAL (BOTTOM) --- */}
      {currentScene !== "supply" && (
        <footer className="relative z-30 border-t border-zinc-900 bg-zinc-950/95 px-2 py-1.5 sm:px-6 sm:py-4 flex flex-col justify-center shrink-0">
          <div className="w-full max-w-4xl mx-auto">
            {currentScene === "ops" ? (
              <div className="w-full h-[34px] sm:h-[50px] flex items-center justify-between px-2 sm:px-4 rounded-none bg-zinc-900/45 border border-zinc-800 text-[9px] sm:text-xs text-zinc-500 select-none">
                <div className="flex items-center gap-1.5 sm:gap-2 font-mono truncate">
                  <span className="w-1.5 h-1.5 rounded-none bg-orange-500 animate-pulse flex-shrink-0" />
                  <span className="truncate text-zinc-400 font-bold">SYSTEM: FLEET_SUPPORT_ONLINE</span>
                </div>
                <span className="text-[9px] font-mono opacity-60 hidden sm:block">SUPPORTED BY BRAVE LIGHT SQUAD</span>
              </div>
            ) : gameMode === "idle" ? (
              <form onSubmit={handleCounselSubmit} className="flex gap-2 h-[34px] sm:h-[50px]">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="輸入你的戀愛煩惱吧（例如：他都已讀不回...）"
                  className="flex-1 bg-zinc-950 border border-zinc-850 px-2 sm:px-6 h-full text-[11px] sm:text-sm focus:outline-none focus:border-orange-500 transition-colors tracking-wide text-zinc-100 placeholder-zinc-600 rounded-none font-sans min-w-0"
                  maxLength={100}
                  required
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`px-3 sm:px-8 h-full font-bold text-[9px] sm:text-xs uppercase tracking-widest transition-all duration-300 rounded-none cursor-pointer flex items-center justify-center gap-1 sm:gap-2 flex-shrink-0
                    ${inputText.trim()
                      ? "bg-white text-black hover:bg-orange-500 hover:text-white shadow-lg"
                      : "bg-zinc-900 text-zinc-600 border border-zinc-850 cursor-not-allowed"
                    }
                  `}
                  title="送出諮商診斷"
                >
                  <span>SEND_CIRCUIT</span>
                  <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </form>
            ) : (
              // Check if we are at the end of the dialogue to show action choices in the footer bar!
              gameMode === "counseling" && currentDialogueIndex === storyLines.length - 1 ? (
                <div className="w-full flex gap-2 h-[34px] sm:h-[50px] animate-scale-up">
                  <button
                    onClick={() => {
                      playSound("click");
                      setGameMode("idle");
                      setStoryLines([]);
                      setInputText("");
                    }}
                    className="flex-1 h-full px-2 sm:px-6 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-850 font-bold text-[9px] sm:text-xs uppercase tracking-wider sm:tracking-widest rounded-none transition-all duration-200 active:scale-95 flex items-center justify-center gap-1 sm:gap-2 cursor-pointer truncate"
                  >
                    <RefreshCw className="w-3 h-3 text-orange-500 flex-shrink-0" />
                    <span className="truncate">再問一題 (NEW_CIRCUIT)</span>
                  </button>

                  <button
                    onClick={() => {
                      playSound("click");
                      setIsFortuneOpen(true);
                    }}
                    className="flex-1 h-full px-2 sm:px-6 bg-white text-black hover:bg-orange-500 hover:text-white font-black text-[9px] sm:text-xs uppercase tracking-wider sm:tracking-widest rounded-none transition-all duration-200 active:scale-95 shadow-lg flex items-center justify-center gap-1 sm:gap-2 cursor-pointer truncate"
                  >
                    <Sparkles className="w-3 h-3 text-orange-500 flex-shrink-0 animate-pulse" />
                    <span className="truncate">抽取今日戀愛籤 (FORTUNE)</span>
                  </button>
                </div>
              ) : (
                // During narrative mode, we disable typing to keep focus on dialogue flow
                <div className="w-full h-[34px] sm:h-[50px] flex items-center justify-between px-2 sm:px-4 rounded-none bg-zinc-900/60 border border-zinc-800 text-[9px] sm:text-xs text-zinc-400 select-none">
                  <div className="flex items-center gap-1 sm:gap-2 font-mono min-w-0">
                    <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500 animate-pulse flex-shrink-0" />
                    <span className="truncate">ACTIVE: [{selectedScenario?.name.toUpperCase() || "LOVE_TROUBLE"}]</span>
                  </div>
                  <button
                    onClick={handleDialogueNext}
                    className="px-2.5 py-1 sm:px-4 sm:py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 text-[9px] sm:text-[10px] font-mono tracking-wider sm:tracking-widest uppercase transition-all duration-200 active:scale-95 rounded-none cursor-pointer flex-shrink-0"
                  >
                    {isTypewriterComplete ? "NEXT_SIGNAL ▶" : "SKIP_SIGNAL ▷"}
                  </button>
                </div>
              )
            )}
          </div>

          {/* Copyright badge */}
          <div className="text-center text-[8px] sm:text-[10px] text-zinc-600 font-mono mt-1 sm:mt-2.5">
            © 2026 LIGHT_CREW_STUDIO // ALL SYSTEMS COMPLIANT // 100% SECURE CLIENT LOOP
          </div>
        </footer>
      )}
        </>
      )}


      {/* --- ALL OVERLAY MODAL SCREENS --- */}
      <FortuneModal
        isOpen={isFortuneOpen}
        onClose={() => setIsFortuneOpen(false)}
      />

      <InstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isMuted={isMuted}
        onMuteToggle={handleMuteToggle}
        isMusicMuted={isMusicMuted}
        onMusicMuteToggle={handleMusicMuteToggle}
        musicVolume={musicVolume}
        onMusicVolumeChange={handleMusicVolumeChange}
        textSpeed={textSpeed}
        onSpeedChange={handleSpeedChange}
        onResetData={handleResetData}
        customClaire={customClaire}
        customEthan={customEthan}
        customLeo={customLeo}
        onCustomImageChange={handleCustomImageChange}
      />

      {isGameOpen && (
        <MissionGame
          onClose={() => { setPendingBossChapter(null); handleMissionOpenChange(false); }}
          onReturnToLab={(chapter) => {
            setPendingBossChapter(chapter);
            setCurrentScene("lab");
            handleMissionOpenChange(false);
          }}
          resumeBossChapter={pendingBossChapter}
          affectionPoints={affectionPoints}
          setAffectionPoints={setAffectionPoints}
          playSound={playSound}
          coins={coins}
          setCoins={setCoins}
          purchasedUpgrades={purchasedUpgrades}
          robotUpgrades={robotUpgrades}
          onMaterialsEarned={(earned) => setModificationMaterials((previous) => {
            const next = { ...previous };
            Object.entries(earned).forEach(([id, amount]) => { next[id as keyof MaterialInventory] += amount || 0; });
            return next;
          })}
          unlockedChapters={unlockedChapters}
          setUnlockedChapters={setUnlockedChapters}
        />
      )}

      {/* --- REALISTIC PHYSICAL WALKING SCENE TRANSITION OVERLAY --- */}
      {isTransitioning && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-md animate-fade-in text-white font-mono p-6">
          {/* Bobbing walking simulation container */}
          <div className="text-center max-w-sm w-full space-y-6 flex flex-col items-center justify-center animate-walk-bob">
            {/* Top scanning / diagnostic frame */}
            <div className="border border-orange-500/30 bg-zinc-950/80 px-4 py-2 text-center w-full">
              <div className="text-[10px] text-orange-500 animate-pulse font-bold tracking-widest uppercase">
                ⚙️ SECTOR TRANSITION IN PROGRESS
              </div>
              <div className="text-[9px] text-zinc-500 font-bold font-mono mt-0.5">
                LIGHT_CREW // PROTOCOL_WALK_v1.07
              </div>
            </div>

            {/* Alternating Footstep Footprint Graphics */}
            <div className="flex justify-center items-center gap-12 py-8 relative h-28 w-44">
              {/* Left footstep outline */}
              <div 
                className={`w-8 h-16 rounded-full border-2 border-orange-500/40 bg-orange-500/10 flex flex-col justify-between p-1.5 transition-all duration-200
                  ${transitionStep % 2 === 1 ? "opacity-100 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] bg-orange-500/20 scale-105" : "opacity-25"}
                `}
              >
                {/* Visual toes representer */}
                <div className="flex justify-between gap-0.5 px-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500/80" />
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500/80" />
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500/80" />
                </div>
                <div className="flex-1 rounded-full bg-transparent mt-1" />
                <div className="w-full h-4 rounded-b-md bg-orange-500/20 border-t border-orange-500/30" />
              </div>

              {/* Right footstep outline */}
              <div 
                className={`w-8 h-16 rounded-full border-2 border-orange-500/40 bg-orange-500/10 flex flex-col justify-between p-1.5 transition-all duration-200 mt-6
                  ${transitionStep % 2 === 0 ? "opacity-100 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] bg-orange-500/20 scale-105" : "opacity-25"}
                `}
              >
                {/* Visual toes representer */}
                <div className="flex justify-between gap-0.5 px-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500/80" />
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500/80" />
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500/80" />
                </div>
                <div className="flex-1 rounded-full bg-transparent mt-1" />
                <div className="w-full h-4 rounded-b-md bg-orange-500/20 border-t border-orange-500/30" />
              </div>
            </div>

            {/* Transition Stats */}
            <div className="space-y-2.5 w-full bg-zinc-950/60 border border-zinc-900 p-4 text-left">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 font-mono">來源區域 (FROM)</span>
                <span className="text-zinc-300 uppercase font-sans font-bold">
                  {currentScene === "lab"
                    ? "勇氣の實驗室"
                    : currentScene === "ops"
                    ? "營業機動事業部"
                    : "補給調配部"
                  }
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 font-mono">目標區域 (TO)</span>
                <span className="text-orange-400 uppercase font-sans font-bold animate-pulse">
                  {pendingScene === "lab"
                    ? "勇氣の實驗室"
                    : pendingScene === "ops"
                    ? "營業機動事業部"
                    : "補給調配部"
                  }
                </span>
              </div>
              
              {/* Progress Bar & Steps Count */}
              <div className="pt-2 border-t border-zinc-900 space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-zinc-400">正在前往下一個工作現場...</span>
                  <span className="text-orange-500 font-mono">{transitionStep} / 6 步</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 border border-zinc-800/80 overflow-hidden relative">
                  <div 
                    className="h-full bg-orange-500 transition-all duration-300 ease-out"
                    style={{ width: `${(transitionStep / 6) * 100}%` }}
                  />
                  {/* Scanning scanline in transition bar */}
                  <div className="absolute inset-y-0 w-8 bg-white/20 skew-x-12 animate-pulse" />
                </div>
              </div>
            </div>

            {/* High-tech status string */}
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono text-center">
              SYSTEM_LATENCY: 42ms // SECTOR_LOCK_SECURED
            </div>
          </div>
        </div>
      )}



    </div>
  );
}
