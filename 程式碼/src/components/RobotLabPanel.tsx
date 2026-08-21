import React, { useState } from "react";
import { X } from "lucide-react";
import {
  MATERIAL_CONFIG, MATERIAL_IDS, ROBOT_UPGRADE_CONFIG, ROBOT_UPGRADE_IDS,
  canAffordUpgrade, getUpgradeCost,
  type MaterialId, type MaterialInventory, type RobotUpgradeId, type RobotUpgradeLevels
} from "../data/modificationSystem";
import { ROBOT_CONFIG } from "../data/robotConfig";

interface RobotLabPanelProps {
  materials: MaterialInventory;
  setMaterials: React.Dispatch<React.SetStateAction<MaterialInventory>>;
  upgrades: RobotUpgradeLevels;
  setUpgrades: React.Dispatch<React.SetStateAction<RobotUpgradeLevels>>;
  playSound: (sound: string) => void;
}

export function RobotLabPanel({ materials, setMaterials, upgrades, setUpgrades, playSound }: RobotLabPanelProps) {
  const [open, setOpen] = useState(false);
  const maxLevel = 5;

  const upgrade = (id: RobotUpgradeId) => {
    const currentLevel = upgrades[id] || 0;
    if (currentLevel >= maxLevel) return;
    const cost = getUpgradeCost(id, currentLevel);
    if (!canAffordUpgrade(materials, cost)) {
      playSound("click");
      return;
    }
    setMaterials((previous) => {
      const next = { ...previous };
      Object.entries(cost).forEach(([materialId, amount]) => {
        next[materialId as MaterialId] -= amount || 0;
      });
      return next;
    });
    setUpgrades((previous) => ({ ...previous, [id]: currentLevel + 1 }));
    playSound("success");
  };

  return (
    <>
      <button
        onClick={() => { playSound("click"); setOpen(true); }}
        className="absolute right-2 top-2 z-[60] min-h-11 rounded-lg border border-cyan-400/40 bg-zinc-950/95 px-3 py-2 text-xs font-black text-cyan-300 shadow-lg shadow-cyan-950/40 hover:border-cyan-300"
      >
        <span className="flex items-center gap-2">🔧 燈燈機器人改裝中心</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] overflow-hidden bg-black/90 p-2 sm:p-5">
          <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-cyan-500/30 bg-zinc-950">
            <header className="flex items-center justify-between border-b border-zinc-800 p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <img src={ROBOT_CONFIG.c2_932.portrait} alt="C2-932" className="h-14 w-14 object-contain [image-rendering:pixelated]" />
                <div><h2 className="text-lg font-black text-white">C2-932 機器人改裝中心</h2><p className="text-[10px] text-cyan-400">LABORATORY MODIFICATION SYSTEM</p></div>
              </div>
              <button onClick={() => setOpen(false)} className="min-h-11 min-w-11 rounded-lg border border-zinc-700 text-zinc-300"><X className="mx-auto h-5 w-5" /></button>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[260px_1fr]">
              <aside className="border-b border-zinc-800 p-3 lg:border-b-0 lg:border-r">
                <h3 className="mb-2 text-xs font-black text-zinc-300">改裝素材庫</h3>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                  {MATERIAL_IDS.map((id) => (
                    <div key={id} className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-900/60 px-2 py-1.5 text-xs">
                      <span style={{ color: MATERIAL_CONFIG[id].color }}>{MATERIAL_CONFIG[id].icon} {MATERIAL_CONFIG[id].name}</span>
                      <b className="text-white">{materials[id]}</b>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[10px] leading-relaxed text-zinc-500">素材只會在實驗室消耗。關卡中取得素材不會直接改變 C2-932。</p>
              </aside>

              <main className="min-h-0 overflow-y-auto p-3 sm:p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {ROBOT_UPGRADE_IDS.map((id) => {
                    const config = ROBOT_UPGRADE_CONFIG[id];
                    const level = upgrades[id] || 0;
                    const cost = getUpgradeCost(id, level);
                    const affordable = canAffordUpgrade(materials, cost);
                    const maxed = level >= maxLevel;
                    return (
                      <section key={id} className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/45 p-3">
                        <div>
                          <div className="flex items-center justify-between"><h3 className="font-black text-white">{config.icon} {config.name}</h3><span className="text-xs font-mono text-cyan-300">Lv.{level}/{maxLevel}</span></div>
                          <p className="mt-2 text-xs leading-relaxed text-zinc-400">{config.description}</p>
                          <p className="mt-1 text-[10px] text-cyan-400">{config.effect}</p>
                          <div className="mt-3 flex flex-wrap gap-1">
                            {Object.entries(cost).map(([materialId, amount]) => (
                              <span key={materialId} className="rounded border border-zinc-700 bg-zinc-950 px-1.5 py-1 text-[9px] text-zinc-300">
                                {MATERIAL_CONFIG[materialId as MaterialId].name} × {amount}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button disabled={maxed || !affordable} onClick={() => upgrade(id)} className="mt-3 min-h-11 rounded-lg border border-cyan-500/40 bg-cyan-500/15 text-xs font-black text-cyan-200 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-950 disabled:text-zinc-600">
                          {maxed ? "已達最高等級" : affordable ? "安裝／升級模組" : "素材不足"}
                        </button>
                      </section>
                    );
                  })}
                </div>
              </main>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
