import React, { useState } from "react";
import { Activity, Crosshair, Cpu, Gauge, Shield, Sparkles, Wrench } from "lucide-react";
import {
  MATERIAL_CONFIG,
  MATERIAL_IDS,
  ROBOT_UPGRADE_CONFIG,
  canAffordUpgrade,
  getUpgradeCost,
  type MaterialId,
  type MaterialInventory,
  type RobotUpgradeId,
  type RobotUpgradeLevels,
} from "../data/modificationSystem";
import { ROBOT_CONFIG } from "../data/robotConfig";
import { BACKGROUND_ASSETS } from "../data/backgroundAssets";
import { recordAction } from "../systems/playerStats";

interface RobotLabPanelProps {
  materials: MaterialInventory;
  setMaterials: React.Dispatch<React.SetStateAction<MaterialInventory>>;
  upgrades: RobotUpgradeLevels;
  setUpgrades: React.Dispatch<React.SetStateAction<RobotUpgradeLevels>>;
  playSound: (sound: string) => void;
}

type UpgradeCategory = "attack" | "defense" | "mobility" | "special";

const MAX_LEVEL = 5;

const UPGRADE_CATEGORIES: Array<{
  id: UpgradeCategory;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string }>;
  upgrades: RobotUpgradeId[];
}> = [
  { id: "attack", name: "攻擊系統", shortName: "攻擊", icon: Crosshair, upgrades: ["attack_power", "laser_weapon", "tracking_weapon", "range_attack"] },
  { id: "defense", name: "防禦系統", shortName: "防禦", icon: Shield, upgrades: ["defense_power", "energy_shield"] },
  { id: "mobility", name: "機動系統", shortName: "移動", icon: Gauge, upgrades: ["movement_speed"] },
  { id: "special", name: "特殊系統", shortName: "特殊", icon: Sparkles, upgrades: ["special_lighting", "passive_skill"] },
];

export function RobotLabPanel({ materials, setMaterials, upgrades, setUpgrades, playSound }: RobotLabPanelProps) {
  const [activeCategory, setActiveCategory] = useState<UpgradeCategory>("attack");
  const category = UPGRADE_CATEGORIES.find((item) => item.id === activeCategory) ?? UPGRADE_CATEGORIES[0];
  const installedLevels = Object.values(upgrades).reduce((total, level) => total + level, 0);
  const totalLevels = Object.keys(upgrades).length * MAX_LEVEL;

  const upgrade = (id: RobotUpgradeId) => {
    const currentLevel = upgrades[id] || 0;
    if (currentLevel >= MAX_LEVEL) return;
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
    recordAction("repairRobot");
    recordAction("upgradeRobotModule");
    playSound("success");
  };

  return (
    <section className="mx-auto flex h-full w-full max-w-[1600px] flex-col overflow-hidden border border-zinc-700 bg-[#070b0e]/95 font-sans shadow-[0_0_50px_rgba(0,0,0,0.75)]">
      <header className="flex min-h-16 shrink-0 items-center justify-between border-b border-zinc-700 bg-gradient-to-r from-[#111820] via-[#080d11] to-[#111820] px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center border border-red-500/50 bg-red-950/30 text-red-400 shadow-[inset_0_0_15px_rgba(239,68,68,0.15)]">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-black tracking-wider text-zinc-100 sm:text-xl">機器人改裝中心</p>
            <p className="hidden text-[9px] font-bold tracking-[0.24em] text-zinc-500 sm:block">TECHNOLOGY R&amp;D DIVISION // MODIFICATION DECK</p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden min-w-32 sm:block">
            <div className="mb-1 flex justify-between text-[9px] font-mono text-zinc-500">
              <span>改裝完成度</span><span>{installedLevels}/{totalLevels}</span>
            </div>
            <div className="h-1.5 overflow-hidden bg-zinc-800">
              <div className="h-full bg-gradient-to-r from-red-600 to-orange-400 transition-all" style={{ width: `${(installedLevels / totalLevels) * 100}%` }} />
            </div>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto xl:grid-cols-[250px_minmax(320px,1fr)_470px] xl:overflow-hidden">
        <aside className="border-b border-zinc-700 bg-[#0a0f13]/95 p-3 xl:overflow-y-auto xl:border-b-0 xl:border-r">
          <div className="mb-3 flex items-center justify-between border-b border-zinc-800 pb-2">
            <h3 className="text-sm font-black tracking-widest text-zinc-200">改裝素材庫</h3>
            <span className="h-1.5 w-1.5 animate-pulse bg-red-500" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-1">
            {MATERIAL_IDS.map((id) => (
              <div key={id} className="group flex min-h-12 items-center gap-2 border border-zinc-800 bg-gradient-to-r from-zinc-900/90 to-zinc-950 px-2.5 transition-colors hover:border-zinc-600">
                <span className="grid h-7 w-7 shrink-0 place-items-center border border-zinc-700 bg-black/50 text-base" style={{ color: MATERIAL_CONFIG[id].color }}>
                  {MATERIAL_CONFIG[id].icon}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-zinc-300">{MATERIAL_CONFIG[id].name}</span>
                <b className="font-mono text-sm text-white">{materials[id]}</b>
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-zinc-800 pt-3 text-[9px] leading-relaxed text-zinc-600">
            素材可透過任務與探索取得。升級會立即套用至 C2-932，並保留於下一次 Boss 戰。
          </p>
        </aside>

        <div
          className="relative flex min-h-[380px] flex-col overflow-hidden border-b border-zinc-700 bg-cover bg-center bg-no-repeat xl:min-h-0 xl:border-b-0 xl:border-r"
          style={{ backgroundImage: `url(${BACKGROUND_ASSETS.tech})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/5 to-black/20" />
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(239,68,68,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.05)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="rd-hangar-scan pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-red-400/10 to-transparent" aria-hidden="true" />

          <div className="relative z-10 flex items-center justify-between p-3 text-[9px] font-mono tracking-widest text-zinc-600">
            <span>FRAME DIAGNOSTIC // ONLINE</span>
            <span className="flex items-center gap-1.5 text-emerald-500"><Activity className="h-3 w-3" /> 100%</span>
          </div>

          <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-6 pb-10 pt-2">
            <div className="relative flex h-full max-h-[600px] w-full max-w-[560px] items-center justify-center">
              <div className="absolute inset-y-[6%] left-1/2 w-px bg-gradient-to-b from-transparent via-red-500/20 to-transparent" />
              <div className="absolute inset-x-[10%] top-1/2 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
              <div className="rd-robot-idle relative z-10 flex h-full w-full items-center justify-center">
                <img
                  src={ROBOT_CONFIG.c2_932.portrait}
                  alt="C2-932 戰鬥機器人"
                  className="h-full w-full translate-y-[8%] object-contain [image-rendering:pixelated] drop-shadow-[0_16px_25px_rgba(0,0,0,0.9)] xl:translate-y-[2%]"
                />
              </div>
              <div className="pointer-events-none absolute left-[34%] top-[29%] z-20" aria-hidden="true">
                {[0, 1, 2].map((puff) => <span key={puff} className="rd-smoke-puff" style={{ animationDelay: `${puff * 0.7}s` }} />)}
              </div>
              <div className="pointer-events-none absolute left-[65%] top-[31%] z-20" aria-hidden="true">
                {[0, 1].map((puff) => <span key={puff} className="rd-smoke-puff rd-smoke-puff-right" style={{ animationDelay: `${4.2 + puff * 0.8}s` }} />)}
              </div>
            </div>
          </div>

          <div className="relative z-10 mx-4 mb-3 border border-zinc-700 bg-black/70 px-4 py-2 text-center">
            <p className="text-lg font-black tracking-[0.16em] text-zinc-200">勇敢的燈燈機器人</p>
            <p className="text-[9px] tracking-widest text-red-500">LIGHT COMBAT FRAME // READY</p>
          </div>
        </div>

        <aside className="flex min-h-[440px] flex-col bg-[#0a0f13]/95 xl:min-h-0">
          <div className="grid shrink-0 grid-cols-4 border-b border-zinc-700 bg-black/40">
            {UPGRADE_CATEGORIES.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeCategory;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setActiveCategory(item.id); playSound("click"); }}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 border-r border-zinc-800 text-[11px] font-black transition-all last:border-r-0 ${active ? "bg-red-950/60 text-red-300 shadow-[inset_0_-3px_0_#ef4444]" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"}`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-red-400" : "text-zinc-600"}`} />
                  {item.shortName}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <div>
              <p className="text-base font-black tracking-widest text-zinc-200">{category.name}</p>
              <p className="text-[9px] tracking-wider text-zinc-600">SELECT MODULE TO UPGRADE</p>
            </div>
            <Cpu className="h-5 w-5 text-red-500/70" />
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {category.upgrades.map((id) => {
              const config = ROBOT_UPGRADE_CONFIG[id];
              const level = upgrades[id] || 0;
              const cost = getUpgradeCost(id, level);
              const affordable = canAffordUpgrade(materials, cost);
              const maxed = level >= MAX_LEVEL;
              return (
                <article key={id} className="border border-zinc-700 bg-gradient-to-br from-zinc-900/90 to-[#080b0e] p-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.35)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate font-black text-zinc-100"><span className="mr-2 text-red-400">{config.icon}</span>{config.name}</h4>
                      <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">{config.description}</p>
                      <p className="mt-1 text-[10px] font-bold text-cyan-400">{config.effect}</p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-black text-cyan-300">Lv.{level}/{MAX_LEVEL}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-stretch gap-1.5">
                    {!maxed && Object.entries(cost).map(([materialId, amount]) => {
                      const enough = materials[materialId as MaterialId] >= (amount || 0);
                      return (
                        <span key={materialId} className={`flex min-h-9 items-center gap-1.5 border bg-black/50 px-2 text-[9px] font-mono ${enough ? "border-zinc-700 text-zinc-300" : "border-red-900/70 text-red-400"}`}>
                          <b style={{ color: MATERIAL_CONFIG[materialId as MaterialId].color }}>{MATERIAL_CONFIG[materialId as MaterialId].icon}</b>
                          {materials[materialId as MaterialId]}/{amount}
                        </span>
                      );
                    })}
                    <button
                      type="button"
                      disabled={maxed || !affordable}
                      onClick={() => upgrade(id)}
                      className="ml-auto min-h-9 min-w-24 border border-red-500/70 bg-red-950/55 px-4 text-xs font-black tracking-widest text-red-200 shadow-[inset_0_0_12px_rgba(239,68,68,0.18)] transition-all hover:bg-red-900/70 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-black/40 disabled:text-zinc-600"
                    >
                      {maxed ? "已完成" : affordable ? "升級" : "素材不足"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="shrink-0 border-t border-zinc-700 bg-black/40 p-3">
            <div className="flex items-center justify-between border border-emerald-900/60 bg-emerald-950/15 px-3 py-2 text-[10px]">
              <span className="flex items-center gap-2 font-bold text-emerald-400"><span className="h-1.5 w-1.5 animate-pulse bg-emerald-400" />改裝資料已同步</span>
              <span className="font-mono text-zinc-600">AUTO APPLY</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
