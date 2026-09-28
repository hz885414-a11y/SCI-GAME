import type { BossAdminDefinition } from "../data/bossAdminConfig";

const NUMBER_FIELDS: Array<{ key: keyof BossAdminDefinition["behavior"]; label: string; step: number; hint: string }> = [
  { key: "moveSpeed", label: "移動速度", step: .05, hint: "越高越快接近玩家" },
  { key: "attackInterval", label: "攻擊間隔", step: 1, hint: "Tick 數；越低越頻繁" },
  { key: "meleeStopDistance", label: "近戰停距", step: 5, hint: "偏好近戰時維持的距離" },
  { key: "dashSpeed", label: "衝刺速度", step: .1, hint: "衝刺或突進的移動速度" },
  { key: "dashTimer", label: "衝刺預告時間", step: 1, hint: "衝刺前的蓄力 tick 數" },
  { key: "dashExecutionThreshold", label: "衝刺執行門檻", step: 1, hint: "倒數到此值時真正衝刺" },
  { key: "defenseDuration", label: "防禦持續時間", step: 1, hint: "0 代表不使用防禦技能" },
  { key: "defenseDamageMultiplier", label: "防禦受傷倍率", step: .05, hint: "0.35 = 防禦時只受 35% 傷害" },
  { key: "radius", label: "碰撞半徑", step: 1, hint: "Boss 身形與碰撞範圍" },
];
const SKILL_FIELDS: Array<{ key: keyof BossAdminDefinition["behavior"]; label: string }> = [
  { key: "prefersMelee", label: "偏好近戰追擊" }, { key: "usesRockProjectiles", label: "岩塊彈幕" }, { key: "usesDiveAmbush", label: "潛行伏擊" }, { key: "usesTentacleArea", label: "觸手範圍攻擊" }, { key: "usesChainDash", label: "連鎖衝刺" }, { key: "usesKnockbackRoar", label: "擊退怒吼" }, { key: "usesHardwareSummons", label: "召喚硬體支援" }, { key: "usesToolBarrage", label: "磁力工具彈幕" }, { key: "usesBombingRun", label: "空襲轟炸" }, { key: "usesAimedLaser", label: "瞄準雷射" }, { key: "usesStrafingBurst", label: "掃射連發" },
];

export function BossAdmin({ bosses, onChange }: { bosses: BossAdminDefinition[]; onChange: (bosses: BossAdminDefinition[]) => void }) {
  const update = (index: number, patch: Partial<BossAdminDefinition>) => onChange(bosses.map((boss, itemIndex) => itemIndex === index ? { ...boss, ...patch } : boss));
  const updateBehavior = (index: number, key: keyof BossAdminDefinition["behavior"], value: number | boolean) => update(index, { behavior: { ...bosses[index].behavior, [key]: value } });
  return <div className="admin-bosses"><p className="admin-card-event-note">名稱、生命值與技能數據會由 Firebase 套用到六場 Boss 戰；攻擊演算法、碰撞與 AI 流程仍由程式碼維護。</p><div className="admin-stack">{bosses.map((boss, index) => <details className="admin-record" key={boss.id} open={index === 0}><summary><b>CH.{boss.chapter}｜{boss.exhibition}｜{boss.name}</b><span>HP {boss.hp}｜{boss.description}</span></summary><div className="admin-record-body two-col"><label>Boss 名稱<input value={boss.name} onChange={(e) => update(index, { name: e.target.value })} /></label><label>Boss 生命值<input type="number" min="1" value={boss.hp} onChange={(e) => update(index, { hp: Math.max(1, Number(e.target.value)) })} /></label><label className="wide">戰鬥說明<textarea value={boss.description} onChange={(e) => update(index, { description: e.target.value })} /></label><div className="wide admin-subsection"><h3>基礎行為數據</h3><div className="admin-grid">{NUMBER_FIELDS.map((field) => <label className="admin-field-card" key={String(field.key)}><span>{field.label}</span><small>{field.hint}</small><input type="number" step={field.step} value={Number(boss.behavior[field.key])} onChange={(e) => updateBehavior(index, field.key, Number(e.target.value))} /></label>)}</div></div><div className="wide admin-subsection"><h3>特殊技能開關</h3><div className="admin-boss-skills">{SKILL_FIELDS.map((field) => <label className="admin-check" key={String(field.key)}><input type="checkbox" checked={Boolean(boss.behavior[field.key])} onChange={(e) => updateBehavior(index, field.key, e.target.checked)} />{field.label}</label>)}</div></div><label className="wide">攻擊模式權重（逗號分隔）<input value={boss.behavior.attackPatternWeights.join(", ")} onChange={(e) => { const weights = e.target.value.split(",").map((item) => Number(item.trim())).filter(Number.isFinite); updateBehavior(index, "attackPatternWeights", weights); }} /><small>數字對應 AI 攻擊模式；調整順序與重複次數可改變技能出現機率。</small></label></div></details>)}</div></div>;
}
