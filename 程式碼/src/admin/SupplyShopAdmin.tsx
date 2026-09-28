import { useMemo, useState } from "react";
import type { SupplyEffectType, SupplyProductType, SupplyShopItem } from "../data/supplyShopConfig";
import { formatSupplyEffect, getSupplyCategory, SUPPLY_EFFECT_LABELS } from "../data/supplyShopConfig";

const EFFECT_TYPES = Object.entries(SUPPLY_EFFECT_LABELS) as Array<[SupplyEffectType, string]>;
const PRODUCT_TYPES: Array<[SupplyProductType, string]> = [["ability", "直接能力加成"], ["videoReward", "觀看影片後解鎖能力"], ["discountCode", "購買後取得優惠代碼"]];

export function SupplyShopAdmin({ items, onChange }: { items: SupplyShopItem[]; onChange: (items: SupplyShopItem[]) => void }) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const categories = useMemo(() => [...new Set(items.map(getSupplyCategory))], [items]);
  const visibleItems = items.map((item, index) => ({ item, index })).filter(({ item }) => {
    const query = search.trim().toLowerCase();
    return (categoryFilter === "all" || getSupplyCategory(item) === categoryFilter)
      && (!query || `${item.name} ${item.code} ${item.description} ${item.id}`.toLowerCase().includes(query));
  });

  const update = (index: number, patch: Partial<SupplyShopItem>) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const move = (index: number, direction: -1 | 1) => {
    const visiblePosition = visibleItems.findIndex((entry) => entry.index === index);
    const targetEntry = visibleItems[visiblePosition + direction];
    if (!targetEntry) return;
    const target = targetEntry.index;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const add = () => {
    const category = categoryFilter === "all" ? (categories[0] || "能力強化") : categoryFilter;
    onChange([...items, { id: `supply_${Date.now()}`, code: "SCI-NEW-00", name: "新補給商品", icon: "🧰", category, description: "請輸入商品說明", productType: "ability", effectType: "damage", effectPerLevel: .1, baseCost: 100, costMultiplier: 1.5, maxLevel: 5, enabled: true }]);
  };

  return <div className="admin-bosses">
    <div className="admin-section-title"><div><span>補給商品目錄</span><h3>後勤補給部商品</h3><p>可自訂商品分類與前台顯示順序；清單由上到下就是前台排列順序。</p></div><button type="button" className="admin-add" onClick={add}>＋ 新增商品</button></div>
    <div className="admin-filter-bar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜尋商品名稱、代碼、說明或 ID" /><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">所有商品分類</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select><span>顯示 {visibleItems.length} / {items.length} 個商品</span></div>
    <div className="admin-stack">{visibleItems.map(({ item, index }, visiblePosition) => { const productType = item.productType || "ability"; return <details className="admin-record" key={item.id} open={visiblePosition === 0}>
      <summary><b>{item.icon} {item.name}</b><span>{getSupplyCategory(item)}｜順序 {index + 1}｜{item.enabled ? "上架中" : "已下架"}</span></summary>
      <div className="admin-record-body two-col">
        <label>商品分類<input list="supply-category-options" value={getSupplyCategory(item)} onChange={(e) => update(index, { category: e.target.value })} placeholder="例如：能力強化" /><small>可選既有分類，也可直接輸入新分類。</small></label>
        <label>商品類型<select value={productType} onChange={(e) => update(index, { productType: e.target.value as SupplyProductType, maxLevel: e.target.value === "discountCode" ? 1 : item.maxLevel })}>{PRODUCT_TYPES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>商品名稱<input value={item.name} onChange={(e) => update(index, { name: e.target.value })} /></label><label>商品圖示<input value={item.icon} onChange={(e) => update(index, { icon: e.target.value })} /></label><label>商品代碼<input value={item.code} onChange={(e) => update(index, { code: e.target.value })} /></label>
        <label className="wide">商品說明<textarea value={item.description} onChange={(e) => update(index, { description: e.target.value })} /></label>
        {productType === "videoReward" && <><label className="wide">影片連結<input value={item.videoUrl || ""} onChange={(e) => update(index, { videoUrl: e.target.value })} placeholder="YouTube 或 MP4 網址" /></label><label>需要觀看秒數<input type="number" min="1" value={item.requiredWatchSeconds || 30} onChange={(e) => update(index, { requiredWatchSeconds: Math.max(1, Number(e.target.value)) })} /><small>外部嵌入影片以此時間判定看完。</small></label></>}
        {productType === "discountCode" ? <label className="wide">可複製的優惠代碼<input value={item.discountCode || ""} onChange={(e) => update(index, { discountCode: e.target.value })} placeholder="例如 SCI2026" /></label> : <><label>升級效果<select value={item.effectType} onChange={(e) => update(index, { effectType: e.target.value as SupplyEffectType })}>{EFFECT_TYPES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>每級效果值<input type="number" step={item.effectType === "battery" || item.effectType === "shield" ? 1 : .01} min="0" value={item.effectPerLevel} onChange={(e) => update(index, { effectPerLevel: Math.max(0, Number(e.target.value)) })} /><small>{item.effectType === "damage" || item.effectType === "speed" ? "0.15 代表每級 +15%" : "每升一級增加的固定數值"}</small></label></>}
        <label>第一級價格<input type="number" min="0" value={item.baseCost} onChange={(e) => update(index, { baseCost: Math.max(0, Number(e.target.value)) })} /></label><label>每級價格倍率<input type="number" min="1" step=".05" value={item.costMultiplier} onChange={(e) => update(index, { costMultiplier: Math.max(1, Number(e.target.value)) })} /></label><label>最高等級<input type="number" min="1" max="20" disabled={productType === "discountCode"} value={productType === "discountCode" ? 1 : item.maxLevel} onChange={(e) => update(index, { maxLevel: Math.min(20, Math.max(1, Number(e.target.value))) })} /></label>
        <label className="admin-check"><input type="checkbox" checked={item.enabled} onChange={(e) => update(index, { enabled: e.target.checked })} />前台上架此商品</label><label>商品 ID<input value={item.id} readOnly /></label>
        <div className="wide admin-record-actions"><div className="admin-order-actions"><button type="button" onClick={() => move(index, -1)} disabled={visiblePosition === 0}>↑ 上移</button><button type="button" onClick={() => move(index, 1)} disabled={visiblePosition === visibleItems.length - 1}>↓ 下移</button></div><small>{productType === "discountCode" ? `優惠代碼：${item.discountCode || "尚未設定"}` : `實際效果：${formatSupplyEffect(item)}`}</small><button type="button" className="admin-delete" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>刪除商品</button></div>
      </div>
    </details>; })}</div>
    <datalist id="supply-category-options">{categories.map((category) => <option key={category} value={category} />)}</datalist>
  </div>;
}
