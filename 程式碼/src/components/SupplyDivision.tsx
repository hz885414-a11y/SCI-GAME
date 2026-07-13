import React, { useState } from "react";
import { Sliders } from "lucide-react";

interface SupplyDivisionProps {
  playSound: (soundName: string) => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  purchasedUpgrades: Record<string, number>;
  setPurchasedUpgrades: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export function SupplyDivision({ 
  playSound,
  coins,
  setCoins,
  purchasedUpgrades,
  setPurchasedUpgrades
}: SupplyDivisionProps) {
  const [confirmItem, setConfirmItem] = useState<{
    id: string;
    name: string;
    icon: string;
    code: string;
    cost: number;
    currentLvl: number;
  } | null>(null);

  const upgradeItems = [
    {
      id: "start_battery",
      code: "SCI-BATT-01",
      name: "起點高能蓄電池",
      icon: "🔋",
      desc: "為特工初始機動工作燈注入超高容量。升級可提升關卡初始電量與總上限。",
      effect: "初始與最大電量 +20 (最大 +100)",
      baseCost: 80,
      costMultiplier: 1.5,
    },
    {
      id: "shield_boost",
      code: "SCI-SHLD-02",
      name: "SCI 複合裝甲盾",
      icon: "🛡️",
      desc: "強化機甲物理與能源抗性，提高在戰場中的容錯率，增加生命點數。",
      effect: "初始生命值 +1 / 機盾生命 +20",
      baseCost: 100,
      costMultiplier: 1.6,
    },
    {
      id: "damage_boost",
      code: "SCI-DMG-03",
      name: "光子折射聚焦鏡",
      icon: "🔥",
      desc: "通過折射聚焦鏡片使光束能量翻倍，特工所有光能武器的燃燒與淨化傷害大幅提升。",
      effect: "所有武器淨化傷害 +15%",
      baseCost: 120,
      costMultiplier: 1.5,
    },
    {
      id: "speed_boost",
      code: "SCI-ENG-04",
      name: "超導微型引擎",
      icon: "⚡",
      desc: "裝配高頻率磁懸浮微型發動引擎，使特工走位更加敏捷靈活，完美避開魔球。",
      effect: "特工與機甲移動速度 +10%",
      baseCost: 80,
      costMultiplier: 1.4,
    }
  ];

  const getUpgradeCost = (id: string, level: number) => {
    const item = upgradeItems.find(i => i.id === id);
    if (!item) return 999;
    return Math.round(item.baseCost * Math.pow(item.costMultiplier, level));
  };

  const handleBuyUpgradeClick = (id: string) => {
    const currentLvl = purchasedUpgrades[id] || 0;
    const maxLvl = 5;
    if (currentLvl >= maxLvl) {
      playSound("click");
      return;
    }

    const cost = getUpgradeCost(id, currentLvl);
    if (coins < cost) {
      playSound("click");
      return;
    }

    playSound("click");
    const item = upgradeItems.find(i => i.id === id);
    if (item) {
      setConfirmItem({
        id: item.id,
        name: item.name,
        icon: item.icon,
        code: item.code,
        cost,
        currentLvl
      });
    }
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-6 py-3 flex flex-col justify-start relative z-20 overflow-hidden text-zinc-100">
      
      {/* Sector Header Block */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-xs text-zinc-500">
          <span className="w-1.5 h-1.5 bg-orange-500 rounded-none animate-pulse" />
          <span>LOGISTICS_SECTOR_PROTOCOL // WAR_DEPOT</span>
        </div>
      </div>

      {/* MECHA UPGRADES SHOP */}
      <div className="w-full flex-1 min-h-0 overflow-y-auto pb-4 animate-fade-in flex flex-col space-y-4">
        
        {/* Header / Intro Card */}
        <div className="bg-zinc-900/40 border border-zinc-850 p-3.5 rounded relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>特工機甲戰備物資強化</span>
            </h3>
            <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
              消耗收集的 <b>金幣 🪙</b> 升級特工核心硬體。升級項目將直接在「任務遊戲」中生效，幫助小隊突破更深層的黑暗戰區！
            </p>
          </div>

          {/* Coins Balance Indicator */}
          <div className="bg-zinc-950 border border-amber-500/20 px-3 py-2 rounded shrink-0 flex items-center gap-2 select-none text-right justify-between sm:justify-end shadow-[inset_0_0_10px_rgba(245,158,11,0.05)]">
            <span className="text-[9px] text-zinc-500 font-bold uppercase font-mono tracking-wider">YOUR COINS</span>
            <div className="text-lg font-black text-amber-400 font-mono flex items-center gap-1.5">
              <span>🪙</span>
              <span>{coins}</span>
            </div>
          </div>
        </div>

        {/* Upgrades Items Catalog */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {upgradeItems.map((upgrade) => {
            const currentLvl = purchasedUpgrades[upgrade.id] || 0;
            const cost = getUpgradeCost(upgrade.id, currentLvl);
            const isMax = currentLvl >= 5;

            return (
              <div 
                key={upgrade.id}
                className="bg-zinc-950 border border-zinc-850 hover:border-zinc-800 p-4 rounded flex flex-col justify-between space-y-3 transition-colors relative group animate-fade-in"
              >
                {/* Badge */}
                <div className="absolute top-2.5 right-2.5 text-[8px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded uppercase">
                  {upgrade.code}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl p-1.5 bg-zinc-900 border border-zinc-850 rounded leading-none select-none">{upgrade.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">{upgrade.name}</h4>
                      <span className="text-[9px] text-zinc-500 font-mono font-bold">LEVEL {currentLvl} / 5</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-400 font-sans leading-relaxed min-h-[40px]">
                    {upgrade.desc}
                  </p>

                  {/* Attribute bar indicator */}
                  <div className="space-y-1">
                    <div className="text-[9px] text-zinc-500 flex justify-between font-mono font-bold">
                      <span>設備加成效益:</span>
                      <span className="text-amber-500">{upgrade.effect}</span>
                    </div>
                    <div className="flex gap-1 h-1.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <div 
                          key={idx}
                          className={`flex-1 rounded-sm border ${
                            idx < currentLvl 
                              ? "bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]" 
                              : "bg-zinc-950 border-zinc-900"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  disabled={isMax}
                  onClick={() => handleBuyUpgradeClick(upgrade.id)}
                  className={`w-full py-2.5 border font-extrabold text-[10px] tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer rounded ${
                    isMax 
                      ? "bg-zinc-900 border-zinc-850 text-zinc-600 cursor-not-allowed" 
                      : coins >= cost 
                        ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-400 hover:text-black font-black shadow-[0_2px_8px_rgba(245,158,11,0.2)]" 
                        : "bg-zinc-950 hover:bg-zinc-900 border-zinc-850 text-zinc-400"
                  }`}
                >
                  {isMax ? (
                    <span>⚔️ 已達最高強化 (MAX LEVEL)</span>
                  ) : (
                    <>
                      <span>🪙 採買升級 (-{cost} 金幣)</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

      </div>

      {/* PURCHASE CONFIRMATION MODAL */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fade-in">
          <div className="bg-zinc-950 border border-amber-500/30 w-full max-w-sm p-5 space-y-4 rounded shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            
            {/* Modal Title */}
            <div className="border-b border-zinc-800 pb-2 flex flex-col">
              <span className="font-sans font-extrabold text-xs text-amber-400 block tracking-wider">🛠️ 採買戰備升級確認</span>
              <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">CONFIRM UPGRADE PURCHASE</span>
            </div>

            {/* Item Details Card */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded flex items-center gap-3">
              <span className="text-3xl p-1.5 bg-zinc-950 border border-zinc-850 rounded leading-none select-none">
                {confirmItem.icon}
              </span>
              <div>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">{confirmItem.code}</span>
                <h4 className="text-xs font-bold text-white leading-tight">{confirmItem.name}</h4>
                <div className="text-[10px] font-mono text-amber-500 font-bold mt-1">
                  等級：Lvl {confirmItem.currentLvl} ➔ <span className="text-emerald-400">Lvl {confirmItem.currentLvl + 1}</span>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              確定要花費 <span className="text-amber-400 font-bold font-mono">🪙 {confirmItem.cost}</span> 金幣採買此裝備升級嗎？
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => {
                  playSound("click");
                  setConfirmItem(null);
                }}
                className="flex-1 py-2 text-xs font-bold text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition active:scale-95 cursor-pointer"
              >
                取消 (CANCEL)
              </button>
              <button
                onClick={() => {
                  // Execute purchase!
                  setCoins(prev => prev - confirmItem.cost);
                  setPurchasedUpgrades(prev => {
                    const updated = {
                      ...prev,
                      [confirmItem.id]: confirmItem.currentLvl + 1
                    };
                    localStorage.setItem("light_crew_upgrades", JSON.stringify(updated));
                    return updated;
                  });
                  playSound("success");
                  setConfirmItem(null);
                }}
                className="flex-1 py-2 text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 border border-amber-400 hover:text-black rounded transition active:scale-95 cursor-pointer"
              >
                確定 (CONFIRM)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
