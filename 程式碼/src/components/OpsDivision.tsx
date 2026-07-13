import React, { useState, useEffect } from "react";
import {
  Truck,
  Compass,
  Battery,
  Activity,
  ExternalLink,
  Globe,
  Settings,
  Layers,
  Sparkles,
  MapPin,
  AlertTriangle,
  Lightbulb,
  Check,
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
}

export function OpsDivision({
  isMuted,
  playSound,
  isGameOpen,
  setIsGameOpen,
  coins,
  purchasedUpgrades
}: OpsDivisionProps) {
  // Configurable exhibition URLs state, persists in localStorage
  const defaultExhibitions = [
    { id: "ampa", name: "AMPA", defaultUrl: "https://www.taipeiampa.com.tw/", location: "台北 (Taipei)", code: "TW-AMPA" },
    { id: "frankfurt", name: "Automechanika Frankfurt", defaultUrl: "https://automechanika.messefrankfurt.com/frankfurt/en.html", location: "法蘭克福 (Frankfurt)", code: "DE-AMF" },
    { id: "tite", name: "TITE × IHT", defaultUrl: "https://www.hardwareexpo-taiwan.com/", location: "台中 (Taichung)", code: "TW-TITE" },
    { id: "aapex", name: "AAPEX", defaultUrl: "https://www.aapexshow.com/", location: "拉斯維加斯 (Las Vegas)", code: "US-AAPEX" },
    { id: "metstrade", name: "Metstrade", defaultUrl: "https://www.metstrade.com/", location: "阿姆斯特丹 (Amsterdam)", code: "NL-METS" },
    { id: "bauma", name: "bauma CHINA", defaultUrl: "https://www.bauma-china.com/", location: "上海 (Shanghai)", code: "CN-BAUMA" },
    { id: "shanghai", name: "Automechanika Shanghai", defaultUrl: "https://automechanika-shanghai.hk.messefrankfurt.com/shanghai/en.html", location: "上海 (Shanghai)", code: "CN-AMS" }
  ];

  const [exhibitionUrls, setExhibitionUrls] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("sci_exhibition_urls");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      ampa: "https://www.taipeiampa.com.tw/",
      frankfurt: "https://automechanika.messefrankfurt.com/frankfurt/en.html",
      tite: "https://www.hardwareexpo-taiwan.com/",
      aapex: "https://www.aapexshow.com/",
      metstrade: "https://www.metstrade.com/",
      bauma: "https://www.bauma-china.com/",
      shanghai: "https://automechanika-shanghai.hk.messefrankfurt.com/shanghai/en.html"
    };
  });

  const [selectedSettingId, setSelectedSettingId] = useState<string>("ampa");
  const [tempUrl, setTempUrl] = useState<string>("");
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [isSavedNotify, setIsSavedNotify] = useState(false);

  // Sync tempUrl when selectedSettingId changes or exhibitionUrls gets loaded
  useEffect(() => {
    setTempUrl(exhibitionUrls[selectedSettingId] || "");
    setIsEditingUrl(false);
  }, [selectedSettingId, exhibitionUrls]);

  // Taskbar windows open/close states - all closed by default
  const [isOpenPortal, setIsOpenPortal] = useState<boolean>(false);
  const [isOpenSettings, setIsOpenSettings] = useState<boolean>(false);
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

  const isAnyPopupOpen = isOpenPortal || isOpenSettings || isOpenLogs;
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

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    playSound("click");
    let targetUrl = tempUrl.trim();
    if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    setExhibitionUrls(prev => {
      const updated = {
        ...prev,
        [selectedSettingId]: targetUrl
      };
      localStorage.setItem("sci_exhibition_urls", JSON.stringify(updated));
      return updated;
    });

    setIsEditingUrl(false);
    setIsSavedNotify(true);
    const exhibName = defaultExhibitions.find(ex => ex.id === selectedSettingId)?.name || selectedSettingId;
    addLog(`[SYSTEM] ${exhibName} 的連結已更新為: ${targetUrl}`);
    setTimeout(() => setIsSavedNotify(false), 2000);
  };

  const handleOpenExhibition = (id: string, url: string, name: string) => {
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
      setIsOpenSettings(false);
      setIsOpenLogs(false);
    }
  };

  const toggleSectors = () => {
    playSound("click");
    const next = !isGameOpen;
    setIsGameOpen(next);
    addLog(`${next ? "[START]" : "[CLOSE]"} 啟動出發任務戰術模擬主機`);
    if (next) {
      setIsOpenPortal(false);
      setIsOpenSettings(false);
      setIsOpenLogs(false);
    }
  };

  const toggleSettings = () => {
    playSound("click");
    const next = !isOpenSettings;
    setIsOpenSettings(next);
    addLog(`${next ? "[OPEN]" : "[CLOSE]"} 啟動展覽連結配置視窗`);
    if (next) {
      setIsOpenPortal(false);
      setIsGameOpen(false);
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
      setIsOpenSettings(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-6 py-1 sm:py-3 flex flex-col justify-between relative z-20 overflow-y-auto min-h-0 space-y-3">

      {/* Main Interactive Desktop Area */}
      <div className={`flex-1 min-h-0 relative flex flex-col items-center ${(!isOpenPortal && !isOpenSettings && !isOpenLogs && !isGameOpen) ? "justify-start pt-14 sm:pt-20" : "justify-center"}`}>

        {/* TOP CENTERED LABORATORY DASHBOARD OVERLAY */}
        <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300">
          {isCollapsed ? (
            /* COLLAPSED / SHRUNK MODE */
            <div 
              onClick={() => { playSound("click"); setIsDashboardCollapsed(false); }}
              className="cursor-pointer font-mono text-[9px] sm:text-[10px] text-zinc-500 select-none flex items-center justify-between gap-4 bg-black/95 border border-orange-500/30 px-3 py-1.5 rounded-none w-[260px] xs:w-[290px] sm:w-[340px] shadow-lg shadow-black/95 hover:border-orange-500/70 hover:bg-zinc-950 transition-all duration-300 relative group"
            >
              <div className="absolute inset-x-0 -bottom-4 text-center text-[7px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase">
                CLICK TO EXPAND // 點擊展開儀表板
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-none animate-pulse" />
                <span className="font-bold text-zinc-400">LAB: ACTIVE</span>
              </div>

              <div className="flex items-center gap-1 text-amber-400 font-black shrink-0">
                <span>🪙</span>
                <span>{coins}</span>
              </div>

              <div className="flex items-center gap-2 text-zinc-500 text-[8px] sm:text-[9px] font-mono border-l border-zinc-850 pl-2">
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
              className="cursor-pointer font-mono text-[9px] sm:text-[10px] text-zinc-500 select-none flex flex-col gap-2 bg-black/90 border border-zinc-900/80 p-3 sm:p-4 rounded-none w-[220px] xs:w-[240px] sm:w-[280px] shadow-2xl shadow-black/90 hover:border-orange-500/40 transition-all duration-300 relative group animate-fade-in"
            >
              <div className="absolute inset-x-0 -bottom-4 text-center text-[7px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase">
                CLICK TO COLLAPSE // 點擊縮小儀表板
              </div>

              <div className="text-[8px] xs:text-[9px] text-zinc-400 font-black flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-none animate-pulse shrink-0" />
                  <span>● LAB_STATUS: ACTIVE</span>
                </div>
                <span className="text-[8px] text-zinc-600">EXPANDED</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-zinc-500 text-[8px] xs:text-[9px]">
                <div>TEMP: 23.4°C</div>
                <div>HUMIDITY: 45.2%</div>
              </div>

              {/* Squad Coins Display */}
              <div className="border-t border-zinc-800/80 pt-1.5 mt-0.5">
                <div className="text-[7px] xs:text-[8px] text-zinc-600 uppercase font-black tracking-wider">
                  SQUAD COINS (特工金幣)
                </div>
                <div className="text-xs xs:text-sm font-black text-amber-400 mt-0.5 flex items-center gap-1">
                  <span className="animate-pulse">🪙</span>
                  <span>{coins}</span>
                </div>
              </div>

              {/* Equipment Levels Display */}
              <div className="border-t border-zinc-800/80 pt-1.5 mt-0.5 space-y-1">
                <div className="text-[7px] xs:text-[8px] text-zinc-600 uppercase font-black tracking-wider">
                  EQUIPMENT (戰備強化)
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] xs:text-[9px] text-zinc-400">
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
              <div className="flex items-end gap-[1.5px] h-6 mt-1 bg-zinc-900/40 border border-zinc-800/40 p-0.5 w-full justify-between">
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
        <div className="w-full max-w-xl mx-auto flex flex-col justify-center min-h-0">
          
          {/* WINDOW 1: Portal Gate */}
          {isOpenPortal && (
            <div className="bg-zinc-950/95 border border-orange-500/50 p-4 flex flex-col justify-between space-y-3 shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all animate-fade-in relative">
              <div>
                <div className="border-b border-zinc-800 pb-2 flex items-start justify-between">
                  <div className="font-bold text-xs text-white flex flex-col gap-0.5 font-sans">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-orange-500" />
                      機動調度任務中心
                    </div>
                    <div className="text-[9px] text-zinc-500 font-mono pl-5 leading-tight">
                      (MOBILE DISPATCH
                      <br />
                      MISSION CENTER)
                    </div>
                  </div>
                  <button 
                    onClick={togglePortal}
                    className="p-1 hover:bg-zinc-900 text-zinc-400 hover:text-orange-400 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>


              </div>

              <div className="space-y-2 mt-1">
                <div className="text-[8px] sm:text-[9px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1 border-b border-zinc-900 pb-1">
                  <Compass className="w-3 h-3 text-orange-500 shrink-0" />
                  <span>SELECT DEPLOYMENT TARGET // 選擇展覽進入虛擬展區</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {defaultExhibitions.map((exhib) => {
                    const url = exhibitionUrls[exhib.id] || exhib.defaultUrl;
                    return (
                      <button
                        key={exhib.id}
                        onClick={() => handleOpenExhibition(exhib.id, url, exhib.name)}
                        className="group flex flex-col justify-between p-2 bg-zinc-900/40 hover:bg-orange-500/10 border border-zinc-900 hover:border-orange-500/40 transition-all duration-200 text-left rounded-none cursor-pointer relative overflow-hidden"
                      >
                        {/* Hover bar indicator */}
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-transparent group-hover:bg-orange-500 transition-all" />
                        
                        <div className="w-full flex items-center justify-between text-[8px] font-mono mb-1">
                          <span className="text-orange-500/70 font-bold tracking-wider group-hover:text-orange-400">
                            {exhib.code}
                          </span>
                          <span className="text-zinc-600 group-hover:text-zinc-500 flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                            {exhib.location}
                          </span>
                        </div>
                        
                        <div className="font-bold text-[10px] sm:text-[11px] text-zinc-300 group-hover:text-white leading-tight mb-2">
                          {exhib.name}
                        </div>

                        <div className="w-full flex justify-end items-center text-[8px] font-mono text-zinc-600 group-hover:text-orange-400 gap-1 mt-auto">
                          <span>CONNECT SECTOR</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* WINDOW 2: Side-scrolling Mission Game is now handled globally at root app layer */}

          {/* WINDOW 3: Link Config */}
          {isOpenSettings && (
            <div className="bg-zinc-950/95 border border-zinc-800 p-4 flex flex-col justify-between space-y-3 shadow-lg transition-all animate-fade-in">
              <div>
                <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5 font-sans">
                    <Settings className="w-3.5 h-3.5 text-orange-500" />
                    展覽連結設定 (EXHIBITION_URLS)
                  </span>
                  <button 
                    onClick={toggleSettings}
                    className="p-1 hover:bg-zinc-900 text-zinc-400 hover:text-orange-400 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[10px] text-zinc-400 mt-2 font-sans">
                  配置各個特展的外部跳轉連結。在下方選擇展覽並輸入網址儲存，系統將立即與機動調度任務中心的觀展按鈕同步。
                </p>

                <div className="bg-zinc-900/40 border border-zinc-800/80 p-3 mt-2 space-y-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">
                      SELECT EXHIBITION // 選擇展覽項目
                    </label>
                    <select
                      value={selectedSettingId}
                      onChange={(e) => { playSound("click"); setSelectedSettingId(e.target.value); }}
                      className="bg-zinc-950 border border-zinc-850 text-xs text-zinc-300 px-2 py-1.5 focus:outline-none focus:border-orange-500 font-sans cursor-pointer w-full rounded-none"
                    >
                      {defaultExhibitions.map(ex => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name} ({ex.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 border-t border-zinc-900 pt-2 mt-1">
                    <span>EXHIBITION_GATE_ADDRESS</span>
                    {isSavedNotify && (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5 animate-pulse">
                        <Check className="w-2.5 h-2.5" /> 儲存成功
                      </span>
                    )}
                  </div>

                  {isEditingUrl ? (
                    <form onSubmit={handleSaveUrl} className="flex gap-2">
                      <input
                        type="text"
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 px-2 py-1 focus:outline-none focus:border-orange-500 font-mono"
                        placeholder="請輸入展覽連結..."
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-2.5 bg-orange-500 text-black text-[11px] font-bold hover:bg-orange-400 cursor-pointer"
                      >
                        儲存
                      </button>
                      <button
                        type="button"
                        onClick={() => { playSound("click"); setTempUrl(exhibitionUrls[selectedSettingId] || ""); setIsEditingUrl(false); }}
                        className="px-2 bg-zinc-850 text-zinc-300 text-[11px] hover:bg-zinc-800 cursor-pointer"
                      >
                        取消
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800/60 p-2 font-mono text-[11px] text-zinc-300">
                      <span className="truncate opacity-80 max-w-[180px] xs:max-w-none">{exhibitionUrls[selectedSettingId]}</span>
                      <button
                        onClick={() => { playSound("click"); setIsEditingUrl(true); }}
                        className="text-[10px] text-orange-400 hover:text-orange-300 font-bold underline cursor-pointer shrink-0 ml-2"
                      >
                        修改連結
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-zinc-900/30 border border-zinc-800/50 p-1.5 text-[9px] text-zinc-500 flex items-center gap-1 font-sans">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>配置網址已寫入 LocalStorage。</span>
              </div>
            </div>
          )}

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
            <span className="text-[11px] font-bold text-zinc-300 font-sans">請點擊下方按鈕以展開對應功能視窗</span>
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
                  : "bg-zinc-900 border border-orange-500/50 text-orange-400 hover:text-zinc-200 hover:border-zinc-700"
                }
              `}
            >
              <Gamepad2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-orange-500 animate-pulse" />
              <span className="text-orange-400 font-black">🎮 出發任務(遊戲)</span>
              {isGameOpen && <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping" />}
            </button>
          </div>

          {/* Three sub buttons below it on mobile, inline on sm+ */}
          <div className="grid grid-cols-3 gap-1.5 w-full sm:flex sm:items-center sm:gap-2 sm:w-auto">
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
              onClick={toggleSettings}
              className={`px-2 py-1.5 sm:px-3 sm:py-1.5 border text-[10px] font-sans font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 rounded-none
                ${isOpenSettings 
                  ? "bg-orange-500 text-black border-orange-500" 
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }
              `}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="truncate">連結設定</span>
              {isOpenSettings && <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping" />}
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
