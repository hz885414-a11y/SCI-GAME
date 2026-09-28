import React, { useEffect, useState } from "react";
import { DEFAULT_GAME_CONFIG } from "../config/defaults";
import { isFirebaseConfigured, loadFirebaseConfig, saveFirebaseConfig } from "../config/firebase";
import type { DialoguePortrait, GameConfig, GameplayConfig } from "../config/types";
import { ADMIN_MODULES } from "./moduleRegistry";
import { PLAYER_ACTIONS, PLAYER_ACTION_INFO } from "../systems/playerStats";
import { CardEventAdmin } from "./CardEventAdmin";
import { KnowledgeRuleControls } from "./KnowledgeRuleControls";
import { BossAdmin } from "./BossAdmin";
import { SupplyShopAdmin } from "./SupplyShopAdmin";
import { CharacterPresentationAdmin } from "./CharacterPresentationAdmin";

type ModuleId = (typeof ADMIN_MODULES)[number]["id"];

const IMPACT: Record<ModuleId, string> = {
  gameplay: "影響位置：行動任務與 Boss 戰。重新進入戰鬥後套用。",
  bosses: "影響位置：六個展覽 Boss 戰；重新進入該 Boss 戰後套用。",
  supply: "影響位置：基地的後勤補給部；重新進入該畫面後套用。",
  prologue: "影響位置：開始畫面後的「SCI // 前情提要」。設定選單也可重新播放。",
  ending: "影響位置：六個魔王皆擊敗後的三頁階段性結局，以及 /END 測試畫面。",
  knowledge: "影響位置：累積指定行為後顯示知識事件，並發放對應的圖鑑卡片。",
  cardEvents: "影響位置：伺服器統一處理玩家事件、累積 stats、卡片規則與 pendingCards。",
  characters: "影響位置：勇氣の實驗室角色立繪；重新整理前台後依目前螢幕尺寸套用。",
  dialogues: "影響位置：基地的研發實驗室；玩家輸入煩惱後，Claire、Ethan、Leo 的回覆。",
};

const KNOWLEDGE_CATEGORIES = ["lighting", "energy", "materials", "maintenance", "marine", "safety"] as const;
const CATEGORY_LABELS: Record<(typeof KNOWLEDGE_CATEGORIES)[number], string> = {
  lighting: "照明", energy: "能源", materials: "材料", maintenance: "維護", marine: "海事", safety: "安全",
};
const categoryRank = (category: string | undefined) => Math.max(0, KNOWLEDGE_CATEGORIES.indexOf(category as (typeof KNOWLEDGE_CATEGORIES)[number]));

const GAMEPLAY_FIELDS: Array<{ group: string; key: keyof GameplayConfig; label: string; hint: string; step: number }> = [
  { group: "玩家燈燈小隊｜生命", key: "playerBaseHp", label: "冒險模式基礎生命", hint: "Claire、Ethan、Leo 進入一般任務時的愛心數量。", step: 1 },
  { group: "C2-932 機器人｜生命與 Boss", key: "mechaBaseHp", label: "C2-932 基礎生命", hint: "Boss 戰機器人的基礎 HP。", step: 10 },
  { group: "C2-932 機器人｜生命與 Boss", key: "mechaHpPerDefenseLevel", label: "每級防禦增加生命", hint: "研發室每一級防禦強化增加的機器人 HP。", step: 5 },
  { group: "C2-932 機器人｜生命與 Boss", key: "bossBaseHp", label: "Boss 基礎血量", hint: "Boss 血量公式的固定基礎值。", step: 100 },
  { group: "C2-932 機器人｜生命與 Boss", key: "bossHpPerChapter", label: "Boss 每章血量增幅", hint: "章節編號 × 此數值，再加上基礎血量。", step: 100 },
  { group: "玩家燈燈小隊｜一般怪物", key: "monsterHpMultiplier", label: "全部一般怪物倍率", hint: "最後統一乘上的倍率；1.5 = 增加 50%。", step: .1 },
  { group: "玩家燈燈小隊｜一般怪物", key: "moteBaseHp", label: "暗影微粒基礎血量", hint: "最常見小怪的固定血量。", step: 1 },
  { group: "玩家燈燈小隊｜一般怪物", key: "moteHpPerChapter", label: "暗影微粒每章增幅", hint: "每增加一章追加的血量。", step: 1 },
  { group: "玩家燈燈小隊｜一般怪物", key: "stalkerBaseHp", label: "追獵者基礎血量", hint: "高速紅色小怪的固定血量。", step: 1 },
  { group: "玩家燈燈小隊｜一般怪物", key: "stalkerHpPerChapter", label: "追獵者每章增幅", hint: "每增加一章追加的血量。", step: 1 },
  { group: "玩家燈燈小隊｜一般怪物", key: "clumperBaseHp", label: "重型怪基礎血量", hint: "大型灰色怪物的固定血量。", step: 5 },
  { group: "玩家燈燈小隊｜一般怪物", key: "clumperHpPerChapter", label: "重型怪每章增幅", hint: "每增加一章追加的血量。", step: 5 },
  { group: "玩家燈燈小隊｜怪物生成", key: "spawnStartInterval", label: "初始生成間隔", hint: "遊戲 tick 數；越小生成越快。預設 35。", step: 1 },
  { group: "玩家燈燈小隊｜怪物生成", key: "spawnMinInterval", label: "最快生成間隔", hint: "戰鬥後期不會快於此 tick 數。", step: 1 },
  { group: "玩家燈燈小隊｜怪物生成", key: "maxEnemies", label: "場上怪物上限", hint: "同時存在的一般怪物最大數量。", step: 5 },
  { group: "玩家燈燈小隊｜武器傷害", key: "rangeLowDamage", label: "廣域照明 Low 傷害", hint: "玩家冒險模式的扇形攻擊。", step: 1 },
  { group: "玩家燈燈小隊｜武器傷害", key: "rangeHighDamage", label: "廣域照明 High 傷害", hint: "玩家冒險模式 High 扇形攻擊。", step: 1 },
  { group: "玩家燈燈小隊｜武器傷害", key: "playerBaseAttack", label: "脈衝雷射 Low 傷害", hint: "玩家冒險模式單發雷射。", step: 1 },
  { group: "玩家燈燈小隊｜武器傷害", key: "laserHighDamage", label: "脈衝雷射 High 傷害", hint: "玩家冒險模式 High 雷射。", step: 1 },
  { group: "玩家燈燈小隊｜武器傷害", key: "trackingLowDamage", label: "追蹤光束 Low 傷害", hint: "玩家冒險模式追蹤電擊。", step: 1 },
  { group: "玩家燈燈小隊｜武器傷害", key: "trackingHighDamage", label: "追蹤光束 High 傷害", hint: "玩家冒險模式 High 追蹤電擊。", step: 1 },
  { group: "玩家燈燈小隊｜武器傷害", key: "specialLowDamage", label: "淨化光圈 Low 每次傷害", hint: "玩家冒險模式地面光圈。", step: 1 },
  { group: "玩家燈燈小隊｜武器傷害", key: "specialHighDamage", label: "淨化光圈 High 每次傷害", hint: "玩家冒險模式 High 地面光圈。", step: 1 },
  { group: "玩家燈燈小隊｜武器傷害", key: "heavyLowDamage", label: "重型光砲 Low 傷害", hint: "玩家冒險模式重型光束。", step: 1 },
  { group: "玩家燈燈小隊｜武器傷害", key: "heavyHighDamage", label: "重型光砲 High 傷害", hint: "玩家冒險模式 High 重型光束。", step: 1 },
  { group: "C2-932 機器人｜武器傷害", key: "robotRangeLowDamage", label: "廣域照明 Low 傷害", hint: "僅套用在 C2-932 Boss 戰。", step: 1 },
  { group: "C2-932 機器人｜武器傷害", key: "robotRangeHighDamage", label: "廣域照明 High 傷害", hint: "僅套用在 C2-932 Boss 戰。", step: 1 },
  { group: "C2-932 機器人｜武器傷害", key: "robotLaserLowDamage", label: "脈衝雷射 Low 傷害", hint: "僅套用在 C2-932 Boss 戰。", step: 1 },
  { group: "C2-932 機器人｜武器傷害", key: "robotLaserHighDamage", label: "脈衝雷射 High 傷害", hint: "僅套用在 C2-932 Boss 戰。", step: 1 },
  { group: "C2-932 機器人｜武器傷害", key: "robotTrackingLowDamage", label: "追蹤光束 Low 傷害", hint: "僅套用在 C2-932 Boss 戰。", step: 1 },
  { group: "C2-932 機器人｜武器傷害", key: "robotTrackingHighDamage", label: "追蹤光束 High 傷害", hint: "僅套用在 C2-932 Boss 戰。", step: 1 },
  { group: "C2-932 機器人｜武器傷害", key: "robotSpecialLowDamage", label: "淨化光圈 Low 每次傷害", hint: "僅套用在 C2-932 Boss 戰。", step: 1 },
  { group: "C2-932 機器人｜武器傷害", key: "robotSpecialHighDamage", label: "淨化光圈 High 每次傷害", hint: "僅套用在 C2-932 Boss 戰。", step: 1 },
  { group: "C2-932 機器人｜武器傷害", key: "robotHeavyLowDamage", label: "重型光砲 Low 傷害", hint: "僅套用在 C2-932 Boss 戰。", step: 1 },
  { group: "C2-932 機器人｜武器傷害", key: "robotHeavyHighDamage", label: "重型光砲 High 傷害", hint: "僅套用在 C2-932 Boss 戰。", step: 1 },
  { group: "C2-932 機器人｜武器傷害", key: "mechaPunchDamage", label: "拳擊傷害", hint: "Boss 戰近戰拳擊的單次傷害。", step: 5 },
  { group: "C2-932 機器人｜武器傷害", key: "mechaUltimateDamage", label: "終極技能傷害", hint: "能量滿時終極技能對 Boss 的傷害。", step: 10 },
  { group: "玩家燈燈小隊｜掉落與獎勵", key: "coinDropChance", label: "金幣掉落機率", hint: "0.35 = 35%。", step: .01 },
  { group: "玩家燈燈小隊｜掉落與獎勵", key: "coinDropMin", label: "金幣最少數量", hint: "每次成功掉落至少取得的金幣。", step: 1 },
  { group: "玩家燈燈小隊｜掉落與獎勵", key: "coinDropMax", label: "金幣最多數量", hint: "每次成功掉落最多取得的金幣。", step: 1 },
  { group: "玩家燈燈小隊｜掉落與獎勵", key: "batteryDropChance", label: "電池掉落機率", hint: "0.15 = 15%。未掉電池時改掉經驗晶體。", step: .01 },
  { group: "玩家燈燈小隊｜掉落與獎勵", key: "batteryRestoreAmount", label: "電池回復量", hint: "拾取一顆電池恢復的能源。", step: 5 },
  { group: "玩家燈燈小隊｜掉落與獎勵", key: "materialDropChance", label: "改裝素材掉落機率", hint: "0.22 = 22%，與其他掉落獨立判定。", step: .01 },
  { group: "玩家燈燈小隊｜掉落與獎勵", key: "expGemBase", label: "經驗晶體基礎值", hint: "一般經驗晶體的固定經驗。", step: 1 },
  { group: "玩家燈燈小隊｜掉落與獎勵", key: "expGemPerChapter", label: "經驗晶體每章增幅", hint: "章節越高，每顆晶體追加的經驗。", step: 1 },
];

const PORTRAIT_OPTIONS: Array<[DialoguePortrait, string]> = [["auto", "自動判斷"], ["normal", "COMMON｜一般"], ["dialog", "dialog｜說話"], ["happy", "happy｜開心"], ["think", "Suspect｜思考"], ["surprise", "surprise｜驚訝"]];

function DialogueRows({ value, portraits, onChange }: { value: string[]; portraits: DialoguePortrait[]; onChange: (next: string[], portraits: DialoguePortrait[]) => void }) {
  return <div className="admin-dialogue-rows">
    {value.map((line, index) => <div className="admin-dialogue-row" key={index}>
      <span className="admin-row-number">{index + 1}</span>
      <textarea aria-label={`第 ${index + 1} 則回覆`} value={line} onChange={(event) => onChange(value.map((item, itemIndex) => itemIndex === index ? event.target.value : item), portraits)} />
      <select aria-label={`第 ${index + 1} 則回覆使用圖片`} value={portraits[index] || "auto"} onChange={(event) => onChange(value, value.map((_, itemIndex) => itemIndex === index ? event.target.value as DialoguePortrait : portraits[itemIndex] || "auto"))}>{PORTRAIT_OPTIONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <button type="button" className="admin-delete" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index), portraits.filter((_, itemIndex) => itemIndex !== index))}>刪除</button>
    </div>)}
    <button type="button" className="admin-add" onClick={() => onChange([...value, "新增回覆文字"], [...portraits, "auto"])}>＋ 新增一則回覆</button>
  </div>;
}

export function AdminPage() {
  const [config, setConfig] = useState<GameConfig>(DEFAULT_GAME_CONFIG);
  const [active, setActive] = useState<ModuleId>("gameplay");
  const [status, setStatus] = useState("載入中…");
  const [saving, setSaving] = useState(false);
  const [dialogueScenario, setDialogueScenario] = useState(Object.keys(DEFAULT_GAME_CONFIG.dialogues)[0]);
  const [eventSearch, setEventSearch] = useState("");
  const [eventActionFilter, setEventActionFilter] = useState("all");
  const [eventCategoryFilter, setEventCategoryFilter] = useState("all");
  const [cardSearch, setCardSearch] = useState("");
  const [cardCategoryFilter, setCardCategoryFilter] = useState("all");

  useEffect(() => {
    if (!isFirebaseConfigured()) { setStatus("未設定 Firebase，目前顯示本地預設值"); return; }
    loadFirebaseConfig().then((remote) => {
      if (remote) setConfig({ ...DEFAULT_GAME_CONFIG, ...remote, gameplay: { ...DEFAULT_GAME_CONFIG.gameplay, ...remote.gameplay } });
      setStatus(remote ? "已載入 Firebase 最新設定" : "Firebase 尚無設定，已載入本地預設值");
    }).catch((error) => setStatus(`${error.message}，已載入本地預設值`));
  }, []);

  // Newly created cards inherit the active category filter so operators do not
  // need to reselect the category after adding a card inside a filtered list.
  useEffect(() => {
    if (cardCategoryFilter === "all") return;
    setConfig((current) => {
      const lastIndex = current.cards.length - 1;
      const lastCard = current.cards[lastIndex];
      if (!lastCard || lastCard.title !== "新知識卡片" || lastCard.category === cardCategoryFilter) return current;
      const cards = [...current.cards];
      cards[lastIndex] = { ...lastCard, category: cardCategoryFilter as typeof lastCard.category };
      return { ...current, cards };
    });
  }, [cardCategoryFilter, config.cards.length]);

  const save = async () => {
    setSaving(true);
    try {
      const cards = [...config.cards].sort((a, b) => categoryRank(a.category) - categoryRank(b.category));
      const eventCategory = (event: (typeof config.events)[number]) => cards.find((card) => card.id === event.rewardCard)?.category;
      const events = [...config.events].sort((a, b) => categoryRank(eventCategory(a)) - categoryRank(eventCategory(b)));
      const next = { ...config, cards, events, version: config.version + 1, updatedAt: new Date().toISOString() };
      await saveFirebaseConfig(next);
      localStorage.setItem("sci_game_config_updated", String(Date.now()));
      setConfig(next);
      setStatus("儲存成功；重新整理或重新進入相關畫面後套用");
    } catch (error) { setStatus(error instanceof Error ? error.message : "儲存失敗"); }
    finally { setSaving(false); }
  };

  const updateArrayItem = <K extends "events" | "cards" | "prologue" | "ending">(key: K, index: number, itemPatch: Partial<GameConfig[K][number]>) => {
    const next = [...config[key]] as GameConfig[K];
    next[index] = { ...next[index], ...itemPatch } as GameConfig[K][number];
    setConfig({ ...config, [key]: next });
  };

  const moveArrayItem = <K extends "events" | "cards">(key: K, index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= config[key].length) return;
    const next = [...config[key]] as GameConfig[K];
    [next[index], next[destination]] = [next[destination], next[index]];
    setConfig({ ...config, [key]: next });
  };

  const activeInfo = ADMIN_MODULES.find((item) => item.id === active)!;
  const dialogue = config.dialogues[dialogueScenario] || config.dialogues.others;
  const selectedScenario = config.scenarios.find((scenario) => scenario.id === dialogueScenario);
  const updateScenario = (patch: Partial<NonNullable<typeof selectedScenario>>) => setConfig({
    ...config,
    scenarios: config.scenarios.map((scenario) => scenario.id === dialogueScenario ? { ...scenario, ...patch } : scenario),
  });
  const cardCategoryForEvent = (rewardCardId: string) => config.cards.find((card) => card.id === rewardCardId)?.category;
  const filteredEvents = config.events.map((event, index) => ({ event, index })).filter(({ event }) => {
    const matchesText = `${event.title} ${event.content} ${event.id}`.toLowerCase().includes(eventSearch.trim().toLowerCase());
    return matchesText && (eventActionFilter === "all" || event.action === eventActionFilter) && (eventCategoryFilter === "all" || cardCategoryForEvent(event.rewardCard) === eventCategoryFilter);
  }).sort((a, b) => categoryRank(cardCategoryForEvent(a.event.rewardCard)) - categoryRank(cardCategoryForEvent(b.event.rewardCard)) || a.index - b.index);
  const filteredCards = config.cards.map((card, index) => ({ card, index })).filter(({ card }) => {
    const matchesText = `${card.title} ${card.description} ${card.industryNote} ${card.id}`.toLowerCase().includes(cardSearch.trim().toLowerCase());
    return matchesText && (cardCategoryFilter === "all" || card.category === cardCategoryFilter);
  }).sort((a, b) => categoryRank(a.card.category) - categoryRank(b.card.category) || a.index - b.index);

  return <main className="admin-shell">
    <header className="admin-header"><div><p>SCI GAME / CONTROL ROOM</p><h1>遊戲內容管理台</h1><span className={status.includes("成功") || status.includes("已載入") ? "status-ok" : ""}>{status}</span></div><div className="admin-actions"><a href={import.meta.env.BASE_URL}>返回遊戲</a><button disabled={saving || !isFirebaseConfigured()} onClick={save}>{saving ? "儲存中…" : "儲存到 Firebase"}</button></div></header>
    <div className="admin-layout">
      <nav><div className="admin-nav-title">選擇遊戲內容</div>{ADMIN_MODULES.map((module) => <button key={module.id} className={active === module.id ? "active" : ""} onClick={() => setActive(module.id)}><b>{module.label}</b><small>{module.description}</small></button>)}</nav>
      <section className="admin-panel">
        <div className="admin-panel-heading"><div><span className="admin-kicker">目前編輯</span><h2>{activeInfo.label}</h2><p>{activeInfo.description}</p></div><div className="admin-impact">{IMPACT[active]}</div></div>

        {active === "gameplay" && <div className="admin-gameplay-sections">{[...new Set(GAMEPLAY_FIELDS.map((field) => field.group))].map((group) => <section className={`admin-gameplay-section ${group.startsWith("C2-932") ? "robot-section" : "squad-section"}`} key={group}><h3>{group}</h3><div className="admin-grid">{GAMEPLAY_FIELDS.filter((field) => field.group === group).map(({ key, label, hint, step }) => <label className="admin-field-card" key={key}><span>{label}</span><small>{hint}</small><input type="number" step={step} min={key.includes("Chance") ? 0 : undefined} max={key.includes("Chance") ? 1 : undefined} value={config.gameplay[key]} onChange={(e) => setConfig({ ...config, gameplay: { ...config.gameplay, [key]: Number(e.target.value) } })} /></label>)}</div></section>)}</div>}

        {active === "bosses" && <BossAdmin bosses={config.bosses} onChange={(bosses) => setConfig({ ...config, bosses })} />}

        {active === "supply" && <SupplyShopAdmin items={config.supplyShopItems} onChange={(supplyShopItems) => setConfig({ ...config, supplyShopItems })} />}

        {active === "prologue" && <div className="admin-stack">{config.prologue.map((page, pageIndex) => <details className="admin-record" key={page.id} open={pageIndex === 0}><summary><b>第 {pageIndex + 1} 頁｜{page.title}</b><span>遊戲前情提要 STORY {String(pageIndex + 1).padStart(2, "0")}</span></summary><div className="admin-record-body"><label>頁面標題<input value={page.title} onChange={(e) => updateArrayItem("prologue", pageIndex, { title: e.target.value })} /></label><label>背景圖片網址<input value={page.backgroundImage || ""} onChange={(e) => updateArrayItem("prologue", pageIndex, { backgroundImage: e.target.value || null })} /></label>{(page.segments || [{ paragraphs: page.paragraphs }]).map((segment, segmentIndex) => <div className="admin-subsection" key={segmentIndex}><h3>第 {segmentIndex + 1} 段</h3>{segment.paragraphs.map((paragraph, paragraphIndex) => <div className="admin-line" key={paragraphIndex}><textarea value={paragraph.text} onChange={(e) => { const segments = structuredClone(page.segments || [{ paragraphs: page.paragraphs }]); segments[segmentIndex].paragraphs[paragraphIndex].text = e.target.value; updateArrayItem("prologue", pageIndex, { segments }); }} /><label className="admin-check"><input type="checkbox" checked={Boolean(paragraph.emphasis)} onChange={(e) => { const segments = structuredClone(page.segments || [{ paragraphs: page.paragraphs }]); segments[segmentIndex].paragraphs[paragraphIndex].emphasis = e.target.checked; updateArrayItem("prologue", pageIndex, { segments }); }} />重點高亮</label></div>)}</div>)}</div></details>)}</div>}

        {active === "ending" && <div className="admin-stack">{config.ending.map((page, pageIndex) => <details className="admin-record" key={page.id} open={pageIndex === 0}><summary><b>第 {pageIndex + 1} 頁｜{page.title}</b><span>階段性結局 ENDING {String(pageIndex + 1).padStart(2, "0")}</span></summary><div className="admin-record-body"><label>頁面標題<input value={page.title} onChange={(e) => updateArrayItem("ending", pageIndex, { title: e.target.value })} /></label><label>背景圖片網址<input value={page.backgroundImage || ""} onChange={(e) => updateArrayItem("ending", pageIndex, { backgroundImage: e.target.value || null })} /></label>{(page.segments || [{ paragraphs: page.paragraphs }]).map((segment, segmentIndex) => <div className="admin-subsection" key={segmentIndex}><h3>第 {segmentIndex + 1} 段</h3>{segment.paragraphs.map((paragraph, paragraphIndex) => <div className="admin-line" key={paragraphIndex}><textarea value={paragraph.text} onChange={(e) => { const segments = structuredClone(page.segments || [{ paragraphs: page.paragraphs }]); segments[segmentIndex].paragraphs[paragraphIndex].text = e.target.value; updateArrayItem("ending", pageIndex, { segments }); }} /><label className="admin-check"><input type="checkbox" checked={Boolean(paragraph.emphasis)} onChange={(e) => { const segments = structuredClone(page.segments || [{ paragraphs: page.paragraphs }]); segments[segmentIndex].paragraphs[paragraphIndex].emphasis = e.target.checked; updateArrayItem("ending", pageIndex, { segments }); }} />重點高亮</label></div>)}</div>)}</div></details>)}</div>}

        {active === "knowledge" && <div className="admin-knowledge">
          <section className="admin-knowledge-section"><div className="admin-section-title"><div><span>STEP 1</span><h3>設定事件與累積次數</h3><p>同一種累積行為可以建立多個事件，分別設定 5、10、20 次等不同門檻。</p></div><button type="button" className="admin-add" onClick={() => { const targetCard = config.cards.find((card) => card.category === eventCategoryFilter) || config.cards[0]; setConfig({ ...config, events: [...config.events, { id: `event_${Date.now()}`, title: "新知識事件", content: "請輸入事件內容", icon: "💡", triggerType: "actionCount", action: (eventActionFilter === "all" ? "killEnemy" : eventActionFilter) as typeof PLAYER_ACTIONS[number], requiredCount: 1, rewardCard: targetCard?.id || "", once: true }] }); }}>＋ 新增事件</button></div><div className="admin-filter-bar"><input value={eventSearch} onChange={(e) => setEventSearch(e.target.value)} placeholder="搜尋事件標題、內容或 ID" /><select value={eventActionFilter} onChange={(e) => setEventActionFilter(e.target.value)}><option value="all">所有累積行為</option>{PLAYER_ACTIONS.map((action) => <option key={action} value={action}>{PLAYER_ACTION_INFO[action].group}｜{PLAYER_ACTION_INFO[action].label}</option>)}</select><select value={eventCategoryFilter} onChange={(e) => setEventCategoryFilter(e.target.value)}><option value="all">所有獎勵卡片分類</option>{KNOWLEDGE_CATEGORIES.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}</select><span>顯示 {filteredEvents.length} / {config.events.length} 個事件</span></div><div className="admin-stack">{filteredEvents.map(({ event, index }) => <details className="admin-record" key={event.id}><summary><b>{event.icon} {event.title}</b><span>{PLAYER_ACTION_INFO[event.action]?.label || event.action}累積 {event.requiredCount} 次時觸發</span></summary><div className="admin-record-body two-col"><label>事件標題<input value={event.title} onChange={(e) => updateArrayItem("events", index, { title: e.target.value })} /></label><label>圖示<input value={event.icon} onChange={(e) => updateArrayItem("events", index, { icon: e.target.value })} /></label><label>要累積的玩家行為<select value={event.action} onChange={(e) => updateArrayItem("events", index, { action: e.target.value as typeof event.action })}>{PLAYER_ACTIONS.map((action) => <option key={action} value={action}>{PLAYER_ACTION_INFO[action].group}｜{PLAYER_ACTION_INFO[action].label}</option>)}</select><small>{PLAYER_ACTION_INFO[event.action]?.description}</small></label><label>累積幾次後觸發<input type="number" min="1" value={event.requiredCount} onChange={(e) => updateArrayItem("events", index, { requiredCount: Math.max(1, Number(e.target.value)) })} /><small>每個事件都有獨立次數，可使用相同行為建立不同階段事件。</small></label><label className="wide">事件彈窗內容<textarea value={event.content} onChange={(e) => updateArrayItem("events", index, { content: e.target.value })} /></label><label>完成後發放的知識卡片<select value={event.rewardCard} onChange={(e) => updateArrayItem("events", index, { rewardCard: e.target.value })}>{config.cards.map((card) => <option key={card.id} value={card.id}>{card.icon} {card.title}</option>)}</select></label><label>事件 ID<input value={event.id} readOnly title="事件識別碼建立後不建議修改" /></label><div className="wide admin-record-actions"><div className="admin-order-actions"><button type="button" onClick={() => moveArrayItem("events", index, -1)} disabled={index === 0}>↑ 上移</button><button type="button" onClick={() => moveArrayItem("events", index, 1)} disabled={index === config.events.length - 1}>↓ 下移</button></div><button type="button" className="admin-delete" onClick={() => setConfig({ ...config, events: config.events.filter((_, itemIndex) => itemIndex !== index) })}>刪除此事件</button></div></div></details>)}</div></section>
          <section className="admin-knowledge-section"><div className="admin-section-title"><div><span>STEP 2</span><h3>設定事件獎勵卡片</h3><p>事件達成後發放的內容，會顯示在右上角的產業知識圖鑑。</p></div><button type="button" className="admin-add" onClick={() => setConfig({ ...config, cards: [...config.cards, { id: `card_${Date.now()}`, category: "lighting", icon: "💡", title: "新知識卡片", description: "請輸入卡片說明", industryNote: "請輸入產業補充", image: "" }] })}>＋ 新增卡片</button></div><div className="admin-filter-bar"><input value={cardSearch} onChange={(e) => setCardSearch(e.target.value)} placeholder="搜尋卡片名稱、說明或 ID" /><select value={cardCategoryFilter} onChange={(e) => setCardCategoryFilter(e.target.value)}><option value="all">所有卡片分類</option>{["lighting", "energy", "materials", "maintenance", "marine", "safety"].map((category) => <option key={category} value={category}>{category}</option>)}</select><span>顯示 {filteredCards.length} / {config.cards.length} 張卡片</span></div><div className="admin-stack">{filteredCards.map(({ card, index }) => <details className="admin-record" key={card.id}><summary><b>{card.icon} {card.title}</b><span>分類：{card.category}｜被 {config.events.filter((event) => event.rewardCard === card.id).length} 個事件使用</span></summary><div className="admin-record-body"><label>卡片標題<input value={card.title} onChange={(e) => updateArrayItem("cards", index, { title: e.target.value })} /></label><label>分類<select value={card.category} onChange={(e) => updateArrayItem("cards", index, { category: e.target.value as typeof card.category })}>{["lighting", "energy", "materials", "maintenance", "marine", "safety"].map((category) => <option key={category}>{category}</option>)}</select></label><label>卡片說明<textarea value={card.description} onChange={(e) => updateArrayItem("cards", index, { description: e.target.value })} /></label><label>產業補充文字<textarea value={card.industryNote} onChange={(e) => updateArrayItem("cards", index, { industryNote: e.target.value })} /></label><label>圖片網址<input value={card.image} onChange={(e) => updateArrayItem("cards", index, { image: e.target.value })} /></label><label>卡片 ID<input value={card.id} readOnly /></label><div className="admin-record-actions"><div className="admin-order-actions"><button type="button" onClick={() => moveArrayItem("cards", index, -1)} disabled={index === 0}>↑ 上移</button><button type="button" onClick={() => moveArrayItem("cards", index, 1)} disabled={index === config.cards.length - 1}>↓ 下移</button></div><button type="button" className="admin-delete" disabled={config.events.some((event) => event.rewardCard === card.id)} title={config.events.some((event) => event.rewardCard === card.id) ? "仍有事件使用此卡片，請先更換事件獎勵" : undefined} onClick={() => setConfig({ ...config, cards: config.cards.filter((_, itemIndex) => itemIndex !== index) })}>刪除此卡片</button></div></div></details>)}</div></section>
          <section className="admin-knowledge-relations"><div className="admin-section-title"><div><span>對照總覽</span><h3>卡片目前被哪些事件使用？</h3><p>依卡片分類排序；可直接確認同一卡片是否被多個事件發放。</p></div></div><div className="admin-relation-list">{filteredCards.map(({ card }) => { const relatedEvents = config.events.filter((event) => event.rewardCard === card.id); return <div className="admin-relation-card" key={card.id}><div><b>{card.icon} {card.title}</b><small>{CATEGORY_LABELS[card.category]}｜{relatedEvents.length} 個事件使用</small></div>{relatedEvents.length ? <ul>{relatedEvents.map((event) => <li key={event.id}><strong>{event.icon} {event.title}</strong><span>{PLAYER_ACTION_INFO[event.action]?.label || event.action}累積 {event.requiredCount} 次</span></li>)}</ul> : <p>尚未被任何事件設定為獎勵。</p>}</div>; })}</div></section>
        </div>}

        {active === "knowledge" && <KnowledgeRuleControls events={config.events} onUpdate={(index, patch) => updateArrayItem("events", index, patch)} />}

        {active === "cardEvents" && <CardEventAdmin />}

        {active === "characters" && <CharacterPresentationAdmin value={config.characterLayouts} defaultPortraits={config.characterDefaultPortraits} onChange={(characterLayouts) => setConfig({ ...config, characterLayouts })} onDefaultPortraitsChange={(characterDefaultPortraits) => setConfig({ ...config, characterDefaultPortraits })} onReset={() => setConfig({ ...config, characterLayouts: structuredClone(DEFAULT_GAME_CONFIG.characterLayouts) })} />}

        {active === "dialogues" && dialogue && <div className="admin-dialogues">
          <div className="admin-select-label"><label>先選擇玩家煩惱情境<select value={dialogueScenario} onChange={(e) => setDialogueScenario(e.target.value)}>{config.scenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.name}（{scenario.id}）</option>)}</select></label><small>系統會比對下方關鍵字，再從每位角色的回覆中隨機選一則。</small></div>
          {selectedScenario && <div className="admin-scenario-editor"><h3>情境辨識設定｜{selectedScenario.name}</h3><div className="admin-scenario-grid"><label>後台顯示名稱<input value={selectedScenario.name} onChange={(e) => updateScenario({ name: e.target.value })} /></label><label>情境說明<input value={selectedScenario.description} onChange={(e) => updateScenario({ description: e.target.value })} /></label></div><div className="admin-keywords"><b>觸發關鍵字</b><small>玩家輸入只要包含其中一個詞，就會使用這個情境。越具體的詞建議排在越前面。</small>{selectedScenario.keywords.map((keyword, index) => <div className="admin-keyword-row" key={index}><input aria-label={`關鍵字 ${index + 1}`} value={keyword} onChange={(e) => updateScenario({ keywords: selectedScenario.keywords.map((item, itemIndex) => itemIndex === index ? e.target.value : item) })} /><button type="button" className="admin-delete" onClick={() => updateScenario({ keywords: selectedScenario.keywords.filter((_, itemIndex) => itemIndex !== index) })}>刪除</button></div>)}<button type="button" className="admin-add" onClick={() => updateScenario({ keywords: [...selectedScenario.keywords, "新關鍵字"] })}>＋ 新增關鍵字</button></div></div>}
          {(["claire", "ethan", "leo"] as const).map((character) => <section className="admin-dialogue-card" key={character}><b>{character === "claire" ? "Claire｜溫柔回覆" : character === "ethan" ? "Ethan｜理性分析" : "Leo｜熱血鼓勵"}</b><small>每一格都是一則完整回覆；可指定這句話出現時使用哪一張表情圖片。</small><DialogueRows value={dialogue[character]} portraits={config.dialoguePortraits?.[dialogueScenario]?.[character] || []} onChange={(lines, portraits) => setConfig({ ...config, dialogues: { ...config.dialogues, [dialogueScenario]: { ...dialogue, [character]: lines } }, dialoguePortraits: { ...config.dialoguePortraits, [dialogueScenario]: { ...(config.dialoguePortraits?.[dialogueScenario] || { claire: [], ethan: [], leo: [] }), [character]: portraits } } })} /></section>)}
        </div>}
      </section>
    </div>
  </main>;
}
