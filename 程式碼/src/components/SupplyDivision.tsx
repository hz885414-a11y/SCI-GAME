import React, { useEffect, useState } from "react";
import { Sliders } from "lucide-react";
import { recordAction } from "../systems/playerStats";
import { useGameConfig } from "../config/GameConfigContext";
import { formatSupplyEffect, getSupplyCategory } from "../data/supplyShopConfig";
import type { SupplyShopItem } from "../data/supplyShopConfig";

interface SupplyDivisionProps {
  playSound: (soundName: string) => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  purchasedUpgrades: Record<string, number>;
  setPurchasedUpgrades: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onVideoPlaybackChange: (isPlaying: boolean) => void;
}

export function SupplyDivision({ 
  playSound,
  coins,
  setCoins,
  purchasedUpgrades,
  setPurchasedUpgrades,
  onVideoPlaybackChange
}: SupplyDivisionProps) {
  const { config } = useGameConfig();
  const [confirmItem, setConfirmItem] = useState<{
    id: string;
    name: string;
    icon: string;
    code: string;
    cost: number;
    currentLvl: number;
  } | null>(null);
  const [recentlyUpgraded, setRecentlyUpgraded] = useState<string | null>(null);
  const [upgradeNotice, setUpgradeNotice] = useState<string | null>(null);
  const [pendingVideoRewards, setPendingVideoRewards] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem("sci_pending_video_rewards") || "{}"); } catch { return {}; }
  });
  const [videoItem, setVideoItem] = useState<SupplyShopItem | null>(null);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [codeItem, setCodeItem] = useState<SupplyShopItem | null>(null);

  useEffect(() => {
    if (!recentlyUpgraded) return;
    const timer = window.setTimeout(() => {
      setRecentlyUpgraded(null);
      setUpgradeNotice(null);
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [recentlyUpgraded]);

  useEffect(() => {
    if (!videoItem) return;
    setWatchedSeconds(0);
    const required = Math.max(1, videoItem.requiredWatchSeconds || 30);
    const timer = window.setInterval(() => setWatchedSeconds((seconds) => Math.min(required, seconds + 1)), 1000);
    return () => window.clearInterval(timer);
  }, [videoItem]);

  useEffect(() => {
    onVideoPlaybackChange(Boolean(videoItem));
  }, [videoItem, onVideoPlaybackChange]);

  useEffect(() => () => onVideoPlaybackChange(false), [onVideoPlaybackChange]);

  const upgradeItems = config.supplyShopItems.filter((item) => item.enabled);

  const getUpgradeCost = (id: string, level: number) => {
    const item = upgradeItems.find(i => i.id === id);
    if (!item) return 999;
    return Math.round(item.baseCost * Math.pow(item.costMultiplier, level));
  };

  const handleBuyUpgradeClick = (id: string) => {
    const item = upgradeItems.find(i => i.id === id);
    if (!item) return;
    if (pendingVideoRewards[id]) { setVideoItem(item); return; }
    const currentLvl = purchasedUpgrades[id] || 0;
    const maxLvl = item.maxLevel;
    if (currentLvl >= maxLvl) {
      if ((item.productType || "ability") === "discountCode") setCodeItem(item);
      playSound("click");
      return;
    }

    const cost = getUpgradeCost(id, currentLvl);
    if (coins < cost) {
      playSound("click");
      return;
    }

    playSound("click");
    setConfirmItem({ id: item.id, name: item.name, icon: item.icon, code: item.code, cost, currentLvl });
  };

  const applyPurchasedLevel = (item: SupplyShopItem, targetLevel: number) => {
    setPurchasedUpgrades((previous) => ({ ...previous, [item.id]: Math.max(previous[item.id] || 0, targetLevel) }));
    setRecentlyUpgraded(item.id);
    recordAction("purchaseHumanUpgrade");
  };

  const completeVideoReward = () => {
    if (!videoItem) return;
    const targetLevel = pendingVideoRewards[videoItem.id];
    if (!targetLevel) return;
    applyPurchasedLevel(videoItem, targetLevel);
    const next = { ...pendingVideoRewards };
    delete next[videoItem.id];
    setPendingVideoRewards(next);
    localStorage.setItem("sci_pending_video_rewards", JSON.stringify(next));
    setUpgradeNotice(`${videoItem.icon} 影片觀看完成，能力已解鎖！`);
    playSound("upgradeSuccess");
    setVideoItem(null);
  };

  const toEmbedUrl = (url: string) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]+)/);
    return youtubeMatch ? `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1` : url;
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
      <div className="w-full flex-1 min-h-0 overflow-y-auto pb-4 animate-fade-in flex flex-col space-y-3">
        
        {/* Header / Intro Card */}
        <div className="bg-black border border-zinc-700 px-3.5 py-2.5 rounded relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0 shadow-[0_8px_24px_rgba(0,0,0,0.55)]">
          <div className="space-y-1">
            <h3 className="text-[18px] leading-tight font-bold text-white flex items-center gap-2">
              <Sliders className="w-[18px] h-[18px] text-amber-500" />
              <span>特工機甲戰備物資強化</span>
            </h3>
            <p className="text-[13px] text-zinc-400 font-sans leading-snug">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {upgradeItems.map((upgrade, displayIndex) => {
            const currentLvl = purchasedUpgrades[upgrade.id] || 0;
            const cost = getUpgradeCost(upgrade.id, currentLvl);
            const isMax = currentLvl >= upgrade.maxLevel;
            const category = getSupplyCategory(upgrade);
            const showCategory = displayIndex === 0 || getSupplyCategory(upgradeItems[displayIndex - 1]) !== category;

            return (
              <React.Fragment key={upgrade.id}>
              {showCategory && <div className="sm:col-span-2 mt-1 flex items-center gap-3 border-b border-amber-500/25 pb-2"><span className="text-xs font-black tracking-widest text-amber-400">{category}</span><span className="h-px flex-1 bg-zinc-900" /></div>}
              <div 
                className={`bg-zinc-950 border px-3.5 py-3 rounded flex flex-col justify-between gap-2 transition-all duration-300 relative group animate-fade-in ${
                  recentlyUpgraded === upgrade.id
                    ? "scale-[1.025] border-emerald-300 bg-emerald-950/35 shadow-[0_0_28px_rgba(52,211,153,0.45)]"
                    : "border-zinc-850 hover:border-zinc-800"
                }`}
              >
                {/* Badge */}
                <div className="absolute top-2.5 right-2.5 text-[9px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded uppercase">
                  {upgrade.code}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl p-1.5 bg-zinc-900 border border-zinc-850 rounded leading-none select-none">{upgrade.icon}</span>
                    <div>
                      <h4 className="text-[15px] font-bold text-white leading-tight">{upgrade.name}</h4>
                      <span className="text-[11px] text-zinc-500 font-mono font-bold">LEVEL {currentLvl} / {upgrade.maxLevel}</span>
                    </div>
                  </div>

                  <p className="text-[12px] text-zinc-400 font-sans leading-snug min-h-[32px]">
                    {upgrade.description}
                  </p>

                  {/* Attribute bar indicator */}
                  <div className="space-y-1">
                    <div className="text-[11px] text-zinc-500 flex justify-between gap-2 font-mono font-bold">
                      <span>設備加成效益:</span>
                      <span className="text-amber-500">{(upgrade.productType || "ability") === "discountCode" ? "購買後取得專屬優惠代碼" : (upgrade.productType === "videoReward" ? `觀看影片後｜${formatSupplyEffect(upgrade)}` : formatSupplyEffect(upgrade))}</span>
                    </div>
                    <div className="flex gap-1 h-1.5">
                      {Array.from({ length: upgrade.maxLevel }).map((_, idx) => (
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
                  disabled={isMax && (upgrade.productType || "ability") !== "discountCode"}
                  onClick={() => handleBuyUpgradeClick(upgrade.id)}
                  className={`w-full py-2 border font-extrabold text-[12px] leading-tight tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer rounded ${
                    isMax 
                      ? "bg-zinc-900 border-zinc-850 text-zinc-600 cursor-not-allowed" 
                      : coins >= cost 
                        ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-400 hover:text-black font-black shadow-[0_2px_8px_rgba(245,158,11,0.2)]" 
                        : "bg-zinc-950 hover:bg-zinc-900 border-zinc-850 text-zinc-400"
                  }`}
                >
                  {pendingVideoRewards[upgrade.id] ? <span>▶ 繼續觀看影片並解鎖</span> : isMax ? (
                    <span>{upgrade.productType === "discountCode" ? "📋 查看並複製優惠代碼" : "⚔️ 已達最高強化 (MAX LEVEL)"}</span>
                  ) : (
                    <>
                      <span>🪙 採買升級 (-{cost} 金幣)</span>
                    </>
                  )}
                </button>
              </div>
              </React.Fragment>
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
                  const purchasedItem = upgradeItems.find((item) => item.id === confirmItem.id);
                  if (!purchasedItem) { setConfirmItem(null); return; }
                  setCoins(prev => prev - confirmItem.cost);
                  const targetLevel = confirmItem.currentLvl + 1;
                  if (purchasedItem.productType === "videoReward") {
                    const pending = { ...pendingVideoRewards, [purchasedItem.id]: targetLevel };
                    setPendingVideoRewards(pending);
                    localStorage.setItem("sci_pending_video_rewards", JSON.stringify(pending));
                    setVideoItem(purchasedItem);
                    setUpgradeNotice(`${confirmItem.icon} 已購買，觀看完成後才會獲得能力。`);
                  } else {
                    applyPurchasedLevel(purchasedItem, targetLevel);
                    if (purchasedItem.productType === "discountCode") setCodeItem(purchasedItem);
                    setUpgradeNotice(`${confirmItem.icon} ${confirmItem.name} 購買成功！`);
                    playSound("upgradeSuccess");
                  }
                  setConfirmItem(null);
                }}
                className="flex-1 py-2 text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 border border-amber-400 hover:text-black rounded transition active:scale-90 active:brightness-125 cursor-pointer"
              >
                確定 (CONFIRM)
              </button>
            </div>
          </div>
        </div>
      )}

      {upgradeNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-24 z-[60] -translate-x-1/2 animate-fade-in border border-emerald-300 bg-zinc-950/95 px-5 py-3 text-sm font-black text-emerald-300 shadow-[0_0_28px_rgba(52,211,153,0.5)]"
        >
          ✓ {upgradeNotice}
        </div>
      )}

      {videoItem && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"><div className="w-full max-w-3xl space-y-3 border border-cyan-500/50 bg-zinc-950 p-4"><div className="flex items-center justify-between"><div><b className="text-cyan-300">觀看影片解鎖｜{videoItem.name}</b><p className="text-xs text-zinc-400">觀看完成後才會套用能力。</p></div><button type="button" onClick={() => setVideoItem(null)} className="border border-zinc-700 px-3 py-2 text-xs">稍後再看</button></div><div className="aspect-video overflow-hidden bg-black">{videoItem.videoUrl && /\.(mp4|webm)(\?|$)/i.test(videoItem.videoUrl) ? <video src={videoItem.videoUrl} controls autoPlay className="h-full w-full" onEnded={completeVideoReward} /> : videoItem.videoUrl ? <iframe src={toEmbedUrl(videoItem.videoUrl)} title={videoItem.name} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full border-0" /> : <div className="grid h-full place-items-center text-zinc-500">尚未設定影片連結</div>}</div><div><div className="mb-1 flex justify-between text-xs"><span>觀看進度</span><span>{watchedSeconds} / {Math.max(1, videoItem.requiredWatchSeconds || 30)} 秒</span></div><div className="h-2 overflow-hidden bg-zinc-800"><div className="h-full bg-cyan-400 transition-all" style={{ width: `${Math.min(100, watchedSeconds / Math.max(1, videoItem.requiredWatchSeconds || 30) * 100)}%` }} /></div></div><button type="button" disabled={watchedSeconds < Math.max(1, videoItem.requiredWatchSeconds || 30)} onClick={completeVideoReward} className="w-full bg-cyan-400 py-3 font-black text-black disabled:bg-zinc-800 disabled:text-zinc-500">{watchedSeconds >= Math.max(1, videoItem.requiredWatchSeconds || 30) ? "領取能力" : "請看完影片"}</button></div></div>}

      {codeItem && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"><div className="w-full max-w-md border border-amber-500/50 bg-zinc-950 p-6 text-center"><div className="text-4xl">🎟️</div><h3 className="mt-3 text-xl font-black text-white">{codeItem.name}</h3><p className="mt-2 text-sm text-zinc-400">請複製下方代碼，未來可在指定賣場使用。</p><div className="my-5 border-2 border-dashed border-amber-500 bg-amber-500/10 p-4 font-mono text-2xl font-black tracking-widest text-amber-300">{codeItem.discountCode || "尚未設定"}</div><div className="flex gap-2"><button type="button" onClick={() => setCodeItem(null)} className="flex-1 border border-zinc-700 py-3">關閉</button><button type="button" disabled={!codeItem.discountCode} onClick={async () => { await navigator.clipboard.writeText(codeItem.discountCode || ""); setUpgradeNotice("優惠代碼已複製！"); playSound("click"); }} className="flex-1 bg-amber-500 py-3 font-black text-black disabled:bg-zinc-800">複製代碼</button></div></div></div>}

    </div>
  );
}
