import React, { useState, useEffect } from "react";
import {
  Truck,
  Compass,
  Battery,
  Activity,
  ExternalLink,
  Globe,
  Layers,
  Sparkles,
  MapPin,
  AlertTriangle,
  Lightbulb,
  Flame,
  X,
  Terminal,
  ChevronUp,
  FolderOpen,
  Gamepad2
} from "lucide-react";
interface OpsDivisionProps {
  isMuted: boolean;
  playSound: (sound: string) => void;
  isGameOpen: boolean;
  setIsGameOpen: (open: boolean) => void;
  coins: number;
  purchasedUpgrades: Record<string, number>;
  pendingBossChapter: number | null;
}

export function OpsDivision({
  isMuted,
  playSound,
  isGameOpen,
  setIsGameOpen,
  coins,
  purchasedUpgrades,
  pendingBossChapter
}: OpsDivisionProps) {
  // Exhibition destinations are intentionally embedded here so every button always opens its assigned site.
  const exhibitions = [
    { id: "ampa", name: "AMPA", url: "https://www.sci.com.tw/2026-ampa-online-exhibition/", location: "台北 (Taipei)", code: "TW-AMPA" },
    { id: "frankfurt", name: "Automechanika Frankfurt", url: "https://www.sci.com.tw/automechanika-frankfurt-2026-1/", location: "法蘭克福 (Frankfurt)", code: "DE-AMF" },
    { id: "tite", name: "TITE × IHT", url: "https://www.sci.com.tw/titexiht2026/", location: "台中 (Taichung)", code: "TW-TITE" },
    { id: "aapex", name: "AAPEX", url: "https://www.sci.com.tw/aapex-2026/", location: "拉斯維加斯 (Las Vegas)", code: "US-AAPEX" },
    { id: "metstrade", name: "Metstrade", url: "https://www.sci.com.tw/metstrade-2026/", location: "阿姆斯特丹 (Amsterdam)", code: "NL-METS" },
    { id: "bauma", name: "bauma CHINA", url: "https://www.sci.com.tw/bauma-china-2026/", location: "上海 (Shanghai)", code: "CN-BAUMA" }
  ];

  // Taskbar windows open/close states - all closed by default
  const [isOpenPortal, setIsOpenPortal] = useState<boolean>(false);
  const [isOpenLogs, setIsOpenLogs] = useState<boolean>(false);

  // Laboratory Dashboard states
  const [isDashboardCollapsed, setIsDashboardCollapsed] = useState<boolean>(false);
  const [localWaveHeights, setLocalWaveHeights] = useState<number[]>([15, 25, 40, 20, 10, 30, 45, 12, 18, 32, 22]);

  // Dynamic wave height fluctuations for the laboratory dashboard
  useEffect(() => {
    const waveInterval = setInterval(() => {
      setLocalWaveHeights(prev => prev.map(h => Math.max(10, Math.min(100, h + Math.floor(Math.random() * 31) - 15))));
    }, 400);
    return () => clearInterval(waveInterval);
  }, []);

  const isAnyPopupOpen = isOpenPortal || isOpenLogs;
  const isCollapsed = isAnyPopupOpen || isDashboardCollapsed;

  // Terminal log state
  const [logs, setLogs] = useState<string[]>([
    "SYS_INIT // 營業機動事業部展覽導航系統連線中...",
    "PORTAL_READY // 線上展覽虛擬網關已部署完成 [VIRTUAL GATEWAY ONLINE]",
    "SYSTEM_STATUS: ONLINE // 全數展區數據與主伺服器安全同步中",
    "HELP // 點擊下方任務工作列（TASKBAR）即可打開對應的控制視窗"
  ]);

  // Simulation parameters for telemetry
  const [fuel, setFuel] = useState<number>(84);
  const [signal, setSignal] = useState<number>(98);

  // Dynamic telemetry fluctuations
  useEffect(() => {
    const teleInterval = setInterval(() => {
      setFuel((prev) => Math.max(50, Math.min(100, prev + (Math.random() * 0.4 - 0.2))));
      setSignal((prev) => Math.max(90, Math.min(100, prev + (Math.random() * 2 - 1))));
    }, 3000);
    return () => clearInterval(teleInterval);
  }, []);

  const addLog = (text: string) => {
    const timestamp = new Date().toLocaleTimeString("zh-TW", { hour12: false });
    setLogs((prev) => [`[${timestamp}] ${text}`, ...prev.slice(0, 18)]);
  };

  const handleOpenExhibition = (url: string, name: string) => {
    playSound("click");
    addLog(`[REDIRECT] 導向至 ${name} 中... 網址: ${url}`);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Toggle helpers
  const togglePortal = () => {
    playSound("click");
    const next = !isOpenPortal;
    setIsOpenPortal(next);
    addLog(`${next ? "[OPEN]" : "[CLOSE]"} 啟動任務中心視窗`);
    if (next) {
      setIsGameOpen(false);
      setIsOpenLogs(false);
    }
  };

  const toggleSectors = () => {
    playSound("click");
    const next = !isGameOpen;
    setIsGameOpen(next);
    addLog(
      next && pendingBossChapter !== null
        ? `[RESUME] 第 ${pendingBossChapter} 章 Boss 警告程序啟動`
        : `${next ? "[START]" : "[CLOSE]"} 啟動出發任務戰術模擬主機`
    );
    if (next) {
      setIsOpenPortal(false);
      setIsOpenLogs(false);
    }
  };

  const toggleLogs = () => {
    playSound("click");
    const next = !isOpenLogs;
    setIsOpenLogs(next);
    addLog(`${next ? "[OPEN]" : "[CLOSE]"} 啟動實時通訊日誌視窗`);
    if (next) {
      setIsOpenPortal(false);
      setIsGameOpen(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-6 py-1 sm:py-3 flex flex-col justify-between relative z-20 overflow-y-auto min-h-0 space-y-3">

      {/* Main Interactive Desktop Area */}
      <div className={`flex-1 min-h-0 relative flex flex-col items-center ${(!isOpenPortal && !isOpenLogs && !isGameOpen) ? "justify-start pt-14 sm:pt-20" : "justify-center"}`}>

        {/* TOP CENTERED LABORATORY DASHBOARD OVERLAY */}
        <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300">
          {isCollapsed ? (
            /* COLLAPSED / SHRUNK MODE */
            <div 
              onClick={() => { playSound("click"); setIsDashboardCollapsed(false); }}
              className="cursor-pointer font-mono text-[10px] sm:text-xs text-zinc-500 select-none flex items-center justify-between gap-4 sm:gap-6 bg-black/95 border border-orange-500/30 px-4 sm:px-5 py-2 sm:py-2.5 rounded-none w-[300px] xs:w-[340px] sm:w-[460px] shadow-lg shadow-black/95 hover:border-orange-500/70 hover:bg-zinc-950 transition-all duration-300 relative group"
            >
              <div className="absolute inset-x-0 -bottom-5 text-center text-[8px] sm:text-[9px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase">
                CLICK TO EXPAND // 點擊展開儀表板
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <span className="w-2 h-2 bg-orange-500 rounded-none animate-pulse" />
                <span className="font-bold text-zinc-400">LAB: ACTIVE</span>
              </div>

              <div className="flex items-center gap-1.5 text-amber-400 font-black shrink-0">
                <span>🪙</span>
                <span>{coins}</span>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 text-zinc-400 text-[9px] sm:text-[11px] font-mono border-l border-zinc-800 pl-2.5 sm:pl-4">
                <span>🔋 L{purchasedUpgrades.start_battery || 0}</span>
                <span>🛡️ L{purchasedUpgrades.shield_boost || 0}</span>
                <span>🔥 L{purchasedUpgrades.damage_boost || 0}</span>
                <span>⚡ L{purchasedUpgrades.speed_boost || 0}</span>
              </div>
            </div>
          ) : (
            /* FULL EXPANDED MODE */
            <div 
              onClick={() => { playSound("click"); setIsDashboardCollapsed(true); }}
              className="cursor-pointer font-mono text-[10px] sm:text-xs text-zinc-500 select-none flex flex-col gap-3 bg-black/90 border border-zinc-900/80 p-4 sm:p-5 rounded-none w-[300px] xs:w-[340px] sm:w-[420px] shadow-2xl shadow-black/90 hover:border-orange-500/40 transition-all duration-300 relative group animate-fade-in"
            >
              <div className="absolute inset-x-0 -bottom-5 text-center text-[8px] sm:text-[9px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase">
                CLICK TO COLLAPSE // 點擊縮小儀表板
              </div>

              <div className="text-[10px] sm:text-xs text-zinc-300 font-black flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-none animate-pulse shrink-0" />
                  <span>● LAB_STATUS: ACTIVE</span>
                </div>
                <span className="text-[9px] sm:text-[10px] text-zinc-500">EXPANDED</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-zinc-400 text-[9px] sm:text-[11px]">
                <div>TEMP: 23.4°C</div>
                <div>HUMIDITY: 45.2%</div>
              </div>

              {/* Squad Coins Display */}
              <div className="border-t border-zinc-800/80 pt-2.5 mt-0.5">
                <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase font-black tracking-wider">
                  SQUAD COINS (特工金幣)
                </div>
                <div className="text-base sm:text-lg font-black text-amber-400 mt-1 flex items-center gap-1.5">
                  <span className="animate-pulse">🪙</span>
                  <span>{coins}</span>
                </div>
              </div>

              {/* Equipment Levels Display */}
              <div className="border-t border-zinc-800/80 pt-2.5 mt-0.5 space-y-2">
                <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase font-black tracking-wider">
                  EQUIPMENT (戰備強化)
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] sm:text-xs text-zinc-300">
                  <div className="flex justify-between">
                    <span>🔋 蓄電池:</span>
                    <span className={purchasedUpgrades.start_battery > 0 ? "text-green-400 font-bold" : "text-zinc-600"}>
                      L{purchasedUpgrades.start_battery || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>🛡️ 機盾:</span>
                    <span className={purchasedUpgrades.shield_boost > 0 ? "text-blue-400 font-bold" : "text-zinc-600"}>
                      L{purchasedUpgrades.shield_boost || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>🔥 聚焦鏡:</span>
                    <span className={purchasedUpgrades.damage_boost > 0 ? "text-red-400 font-bold" : "text-zinc-600"}>
                      L{purchasedUpgrades.damage_boost || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>⚡ 微引擎:</span>
                    <span className={purchasedUpgrades.speed_boost > 0 ? "text-yellow-400 font-bold" : "text-zinc-600"}>
                      L{purchasedUpgrades.speed_boost || 0}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Pulsing wave graph */}
              <div className="flex items-end gap-1 h-10 mt-1 bg-zinc-900/40 border border-zinc-800/40 p-1 w-full justify-between">
                {localWaveHeights.map((height, idx) => (
                  <div
                    key={idx}
                    className="w-1 bg-orange-500/30 rounded-none transition-all duration-300"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Windows Container (Responsive single active window) */}
        <div className="w-full max-w-4xl mx-auto flex flex-col justify-center min-h-0">
          
          {/* WINDOW 1: Portal Gate */}
          {isOpenPortal && (
            <div className="bg-zinc-950/95 border border-orange-500/50 p-4 sm:p-6 flex flex-col justify-between space-y-4 shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all animate-fade-in relative">
              <div>
                <div className="border-b border-zinc-800 pb-3 flex items-start justify-between">
                  <div className="font-bold text-sm sm:text-base text-white flex flex-col gap-1 font-sans">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                      機動調度任務中心
                    </div>
                    <div className="text-[10px] sm:text-xs text-zinc-500 font-mono pl-6 leading-tight">
                      (MOBILE DISPATCH MISSION CENTER)
                    </div>
                  </div>
                  <button 
                    onClick={togglePortal}
                    className="p-1 hover:bg-zinc-900 text-zinc-400 hover:text-orange-400 cursor-pointer"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>


              </div>

              <div className="space-y-3 mt-1">
                <div className="text-[10px] sm:text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                  <Compass className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>SELECT DEPLOYMENT TARGET // 選擇展覽進入虛擬展區</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                  {exhibitions.map((exhib) => {
                    return (
                      <button
                        key={exhib.id}
                        onClick={() => handleOpenExhibition(exhib.url, exhib.name)}
                        className="group flex min-h-[92px] flex-col justify-between p-3 sm:p-4 bg-zinc-900/40 hover:bg-orange-500/10 border border-zinc-900 hover:border-orange-500/40 transition-all duration-200 text-left rounded-none cursor-pointer relative overflow-hidden"
                      >
                        {/* Hover bar indicator */}
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-transparent group-hover:bg-orange-500 transition-all" />
                        
                        <div className="w-full flex items-center justify-between text-[9px] sm:text-[10px] font-mono mb-2">
                          <span className="text-orange-500/70 font-bold tracking-wider group-hover:text-orange-400">
                            {exhib.code}
                          </span>
                          <span className="text-zinc-600 group-hover:text-zinc-500 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                            {exhib.location}
                          </span>
                        </div>
                        
                        <div className="font-bold text-xs sm:text-sm text-zinc-300 group-hover:text-white leading-tight mb-3">
                          {exhib.name}
                        </div>

                        <div className="w-full flex justify-end items-center text-[9px] sm:text-[10px] font-mono text-zinc-600 group-hover:text-orange-400 gap-1.5 mt-auto">
                          <span>CONNECT SECTOR</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* WINDOW 2: Side-scrolling Mission Game is now handled globally at root app layer */}

          {/* WINDOW 4: Logger Console */}
          {isOpenLogs && (
            <div className="bg-zinc-950/95 border border-zinc-800 p-3 flex flex-col justify-between space-y-2 shadow-lg transition-all animate-fade-in">
              <div className="border-b border-zinc-800 pb-1.5 flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5 font-mono">
                  <Terminal className="w-3.5 h-3.5 text-orange-500" />
                  OP_CENTER_CONSOLE_LOG
                </span>
                <button 
                  onClick={toggleLogs}
                  className="p-1 hover:bg-zinc-900 text-zinc-400 hover:text-orange-400 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Log Ticker */}
              <div className="flex-1 overflow-y-auto space-y-0.5 text-zinc-500 font-mono text-[9px] h-[160px] scrollbar-thin">
                {logs.map((log, idx) => (
                  <div key={idx} className={`truncate ${idx === 0 ? "text-orange-400" : ""}`}>
                    {log}
                  </div>
                ))}
              </div>

              <div className="text-[8px] font-mono text-zinc-600 text-right">
                BUFFER: OK // CONSOLE_ACTIVE
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Sleek Tactical Work-Items Taskbar (工作任務列) */}
      <div className="bg-zinc-950 border border-zinc-800 p-2 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2.5 relative z-30 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2">
          <span className="p-1 bg-orange-500/10 border border-orange-500/20 text-orange-500 hidden sm:block">
            <FolderOpen className="w-4 h-4" />
          </span>
          <div>
            <span className="text-[9px] font-mono text-zinc-500 block leading-none">MOB_OPS_DOCK // 任務工作列</span>
            <span className="text-[11px] font-bold text-zinc-300 font-sans">請點擊按鈕以展開對應功能視窗</span>
          </div>
        </div>

        {/* Taskbar Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          {/* Main big button for Outbound Mission */}
          <div className="w-full sm:w-auto">
            <button
              onClick={toggleSectors}
              className={`w-full sm:w-auto px-4 py-2 sm:px-4 sm:py-1.5 border text-xs sm:text-[10px] font-sans font-bold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 rounded-none
                ${isGameOpen 
                  ? "bg-orange-500 text-black border-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.25)]" 
                  : pendingBossChapter !== null
                  ? "bg-rose-950/80 border border-rose-500 text-rose-200 hover:bg-rose-900/80 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                  : "bg-zinc-900 border border-orange-500/50 text-orange-400 hover:text-zinc-200 hover:border-zinc-700"
                }
              `}
            >
              {pendingBossChapter !== null ? (
                <AlertTriangle className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-rose-300 animate-pulse" />
              ) : (
                <Gamepad2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-orange-500 animate-pulse" />
              )}
              <span className={pendingBossChapter !== null ? "text-rose-200 font-black" : "text-orange-400 font-black"}>
                {pendingBossChapter !== null
                  ? `⚠️ 繼續第 ${pendingBossChapter} 章 Boss 任務（C2-932）`
                  : "🎮 出發任務(遊戲)"}
              </span>
              {isGameOpen && <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping" />}
            </button>
          </div>

          {/* Secondary task buttons below it on mobile, inline on sm+ */}
          <div className="grid grid-cols-2 gap-1.5 w-full sm:flex sm:items-center sm:gap-2 sm:w-auto">
            <button
              onClick={togglePortal}
              className={`px-2 py-1.5 sm:px-3 sm:py-1.5 border text-[10px] font-sans font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 rounded-none
                ${isOpenPortal 
                  ? "bg-orange-500 text-black border-orange-500" 
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }
              `}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="truncate">任務中心</span>
              {isOpenPortal && <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping" />}
            </button>

            <button
              onClick={toggleLogs}
              className={`px-2 py-1.5 sm:px-3 sm:py-1.5 border text-[10px] font-sans font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 rounded-none
                ${isOpenLogs 
                  ? "bg-orange-500 text-black border-orange-500" 
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }
              `}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="truncate">通訊日誌</span>
              {isOpenLogs && <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping" />}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
