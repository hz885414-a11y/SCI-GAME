import React, { useState, useEffect, useRef } from "react";
import { playSound, startBackgroundMusic, stopBackgroundMusic } from "../utils/audio";
import { CORE_ASSET_MANIFEST } from "../data/coreAssetManifest";
import { UI_IMAGE_ASSETS } from "../data/gameAssetUrls";
import { preloadAssetManifest } from "../utils/preloadImages";
import { 
  Zap, 
  Settings, 
  Volume2, 
  VolumeX, 
  Database, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Play, 
  Cpu, 
  Terminal, 
  HelpCircle 
} from "lucide-react";

interface StartScreenProps {
  onStart: () => void;
  isMusicMuted: boolean;
  onMusicMuteToggle: (muted: boolean) => void;
  musicVolume: number;
  onMusicVolumeChange: (vol: number) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  isMusicMuted,
  onMusicMuteToggle,
  musicVolume,
  onMusicVolumeChange,
}) => {
  const [glitchTitle, setGlitchTitle] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Periodic random titles glitched state
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchTitle(true);
      setTimeout(() => setGlitchTitle(false), 200);
    }, 4000);
    return () => clearInterval(glitchInterval);
  }, []);

  // Control local procedural background music (BGM) based on isMusicMuted and user interaction
  useEffect(() => {
    if (isMusicMuted || !userInteracted) {
      stopBackgroundMusic();
    } else {
      startBackgroundMusic("theme");
    }
  }, [userInteracted, isMusicMuted]);

  const handleScreenClick = () => {
    if (!userInteracted) {
      setUserInteracted(true);
    }
  };

  const handleMusicToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound("click");
    
    if (!userInteracted) {
      setUserInteracted(true);
      // If BGM is muted, turn it on. If BGM was already on but silenced, keep it on and let it unmute!
      if (isMusicMuted) {
        onMusicMuteToggle(false);
      }
      startBackgroundMusic("theme");
    } else {
      const nextMuted = !isMusicMuted;
      onMusicMuteToggle(nextMuted);
      if (!nextMuted) {
        startBackgroundMusic("theme");
      }
    }
  };

  const handleStartClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering container click again
    playSound("click");
    startBackgroundMusic("normal");
    onStart();
  };

  const videoId = "E2BTGGxrOx8";
  // Always initialize muted to ensure reliable browser autoplay
  const iframeUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1`;

  return (
    <div 
      onClick={handleScreenClick}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40 p-6 select-none animate-fade-in overflow-hidden cursor-pointer"
    >
      {/* Ambient Background Wrapper */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-zinc-950">
        {/* YouTube Background Video */}
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.77vh] h-[56.25vw] min-w-full min-h-full pointer-events-none z-0 opacity-65 border-none"
          allow="autoplay; encrypted-media"
          title="Background Video"
        />

        {/* Cinematic translucent dark gradient & scanline filter overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90 backdrop-blur-[2px]" />
        
        {/* Subtle retro horizontal scanlines */}
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)",
            backgroundSize: "100% 4px"
          }}
        />
      </div>

      {/* Decorative cyber grid pattern */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-10" 
        style={{ 
          backgroundImage: "radial-gradient(circle at 50% 50%, #f59e0b 1px, transparent 1px)", 
          backgroundSize: "24px 24px" 
        }} 
      />

      <div className="w-full max-w-xl text-center space-y-8 relative z-20">
        {/* Subtle top decoration badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] tracking-[0.25em] font-mono uppercase animate-pulse">
          <Cpu className="w-3.5 h-3.5 text-amber-500" />
          <span>PROJECT: LIGHT-UNIT-7 // BOOT_LOADER</span>
        </div>

        {/* Main title */}
        <div className="relative">
          <img
            src={UI_IMAGE_ASSETS.mainTitle}
            alt="勇氣の燈燈小隊"
            className={`w-full max-w-[520px] sm:max-w-[620px] h-auto max-h-[28vh] sm:max-h-[36vh] mx-auto object-contain transition-all duration-300 ${glitchTitle ? "skew-x-3" : ""}`}
            loading="eager"
            draggable={false}
          />
        </div>

        {/* Short atmospheric description */}
        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
          除了用工作燈照亮你的人生路途（物理）
          <br />
          今天也想用工作燈照亮你的心！
        </p>

        {/* Pre-game Loadout Configuration Options (Sleek Icon version) */}
        <div className="flex justify-center items-center py-2">
          <button
            onClick={handleMusicToggleClick}
            className={`p-3.5 border transition-all duration-200 cursor-pointer flex items-center gap-2 rounded-full backdrop-blur-md
              ${!isMusicMuted 
                ? "bg-emerald-950/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                : "bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              }
            `}
            title={isMusicMuted ? "播放背景音樂 (BGM OFF)" : "靜音背景音樂 (BGM ON)"}
          >
            {isMusicMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-red-400" />
                <span className="text-[10px] font-mono tracking-wider font-bold text-zinc-400">BGM OFF</span>
              </>
            ) : !userInteracted ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono tracking-wider font-bold text-emerald-400">TAP TO ACTIVATE</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-mono tracking-wider font-bold text-emerald-400">BGM ON</span>
              </>
            )}
          </button>
        </div>

        {/* Start Game Button */}
        <div className="pt-2">
          <button
            onClick={handleStartClick}
            className="group relative inline-flex items-center gap-3 px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs uppercase tracking-[0.25em] transition-all duration-300 rounded-none active:scale-95 cursor-pointer shadow-[0_0_30px_rgba(245,158,11,0.25)] overflow-hidden"
          >
            {/* Hover overlay sheen */}
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            
            <Play className="w-4 h-4 text-black group-hover:scale-125 transition-transform duration-300" />
            <span className="flex flex-col sm:flex-row items-center sm:gap-1.5 text-center leading-tight">
              <span>BOOT UP SYSTEM</span>
              <span className="hidden sm:inline">//</span>
              <span>啟動診斷系統</span>
            </span>
          </button>
        </div>

        {/* Friendly Interaction Hint */}
        {!userInteracted && (
          <p className="text-[10px] text-amber-500 animate-pulse font-mono tracking-wider">
            ⚡ 點擊螢幕任意處以解除靜音播放背景音軌 (TOUCH ANYWHERE TO UNMUTE)
          </p>
        )}

        {/* Technical spec credits */}
        <div className="text-[9px] text-zinc-600 font-mono flex items-center justify-center gap-6 pt-4">
          <span>HOST: SECURE CONTAINER</span>
          <span>● WEB_AUDIO_API</span>
          <span>FUSE_STATE: CONNECTED</span>
        </div>
      </div>
    </div>
  );
};

interface BootingScreenProps {
  onComplete: () => void;
}

export const BootingScreen: React.FC<BootingScreenProps> = ({ onComplete }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentAsset, setCurrentAsset] = useState("建立素材清單");
  const [failedAssets, setFailedAssets] = useState(0);

  const diagnosticLogs = [
    ">> INITIALIZING NEURAL LINK PROTOCOL...",
    ">> CHECKING HARMONIC RESONANCE RATIO... RATIO: 1.05 [OK]",
    ">> ESTABLISHING LAB ANTENNA SPECTRAL TUNER... DONE",
    ">> SPINNING UP CORE SYNTHESIZER DRIVER [WEB AUDIO API]...",
    ">> LOADING AGENT #001: CLAIRE [温柔療癒 MATRIX]... ONLINE",
    ">> LOADING AGENT #002: ETHAN [理性直男 MATRIX]... ONLINE",
    ">> LOADING AGENT #003: LEO [酷酷熱血 MATRIX]... ONLINE",
    ">> DEPLOYING HOLOGRAPHIC WAVEFORM GRID...",
    ">> VERIFYING STANDEE PROJECTOR COORDINATES...",
    ">> COMPILING DIALOGUE MATRIX DATABASE...",
    ">> HARMONIZATION COMPLETE. COGNITIVE PATHWAY IS SECURE.",
    ">> SYS_STATUS: READY. ENTERING LOVERS' LAB..."
  ];

  useEffect(() => {
    let cancelled = false;
    let logIndex = 0;
    
    // Staggered log typewriter generator
    const logInterval = setInterval(() => {
      if (logIndex < diagnosticLogs.length) {
        setLogs(prev => [...prev, diagnosticLogs[logIndex]]);
        playSound("typewriter");
        logIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 320);

    const minimumBootTime = new Promise<void>((resolve) => window.setTimeout(resolve, 1800));
    const assetLoad = preloadAssetManifest(CORE_ASSET_MANIFEST, (status) => {
      if (cancelled) return;
      setProgress(status.percent);
      setCurrentAsset(status.currentLabel);
      setFailedAssets(status.failed);
    });

    Promise.all([minimumBootTime, assetLoad]).then(([, result]) => {
      if (cancelled) return;
      setProgress(100);
      setCurrentAsset(result.failed > 0 ? "部分遠端素材將於背景重試" : "核心素材載入完成");
      window.setTimeout(() => {
        if (cancelled) return;
        playSound("success");
        onComplete();
      }, 350);
    });

    return () => {
      cancelled = true;
      clearInterval(logInterval);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-40 bg-zinc-950 flex flex-col justify-between p-6 md:p-12 select-none font-mono text-xs text-zinc-300">
      
      {/* Decorative full screen glow grids */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-gradient-to-b from-amber-500/10 to-transparent" />
      
      {/* Top Status Indicators */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="font-bold text-amber-400">SYS_DIAGNOSTIC // COLD_BOOT</span>
        </div>
        <div className="text-[10px] text-zinc-500">
          SESSION_UID: {Math.floor(100000 + Math.random() * 900000)}
        </div>
      </div>

      {/* Terminal Log Console */}
      <div className="flex-1 my-6 overflow-y-auto max-h-[60vh] bg-black/60 border border-zinc-900 p-4 space-y-1.5 scrollbar-thin text-[11px] md:text-xs">
        {logs.map((log, index) => (
          <div key={index} className={`flex items-start gap-2 ${log.includes("ONLINE") || log.includes("[OK]") ? "text-emerald-400" : log.includes("READY") ? "text-amber-400 font-bold" : "text-zinc-400"}`}>
            <span className="text-zinc-600 select-none">[{index.toString().padStart(2, "0")}]</span>
            <p className="whitespace-pre-wrap">{log}</p>
          </div>
        ))}
        {/* Blinking typing cursor */}
        <div className="inline-block w-2 h-4 bg-amber-500 animate-pulse ml-1" />
      </div>

      {/* Bottom Loading Progress Bar */}
      <div className="space-y-4 pt-4 border-t border-zinc-900">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">⚡ COGNITIVE COUPLING SYNCHRONIZATION</span>
            <span className="text-[10px] text-zinc-500 block truncate max-w-[72vw]">
              LOADING: {currentAsset} {failedAssets > 0 ? `// ${failedAssets} FALLBACK` : "// CACHE READY"}
            </span>
          </div>
          <span className="font-mono text-amber-400 font-bold text-base bg-amber-500/10 px-2.5 py-0.5 border border-amber-500/20">
            {progress}%
          </span>
        </div>

        {/* Outer Bar */}
        <div className="w-full h-3 bg-zinc-900 border border-zinc-800 p-[1px] rounded-none overflow-hidden relative">
          {/* Glowing Fill */}
          <div 
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 transition-all duration-150 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            {/* Grid stripe scanlines inside the progress bar fill */}
            <div className="absolute inset-0 opacity-20" 
              style={{
                backgroundImage: "linear-gradient(90deg, #000 50%, transparent 50%)",
                backgroundSize: "6px 100%"
              }}
            />
          </div>
        </div>

        <div className="flex justify-between text-[9px] text-zinc-600">
          <span>影像與碰撞遮罩會在進入基地前完成快取</span>
          <span>{CORE_ASSET_MANIFEST.length} ASSETS</span>
        </div>
      </div>
    </div>
  );
};
