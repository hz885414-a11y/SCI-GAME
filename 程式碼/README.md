<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/0b58f910-5c23-48e8-b06b-2c7be7293416

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
# SCI GAME

## 第一階段後台與 Firebase 設定

管理頁面位於 `/admin`。遊戲與後台共用 `src/config` 的設定層；遊戲啟動時會讀取 Firebase Realtime Database 的 `gameConfig/v1`，讀取失敗或四秒內無回應時自動使用程式碼內的預設值。攻擊流程、碰撞判定、技能與怪物 AI 仍保留在程式碼中。

1. 在 Firebase Console 建立 Realtime Database。
2. 複製 `.env.example` 為 `.env.local`，填入 `VITE_FIREBASE_DATABASE_URL`。
3. 第一階段未加入登入，因此若要直接由瀏覽器後台儲存，需讓 `gameConfig` 節點可公開讀寫。`firebase-database.rules.json` 提供最小範圍的示例規則；請勿把其他資料放在此公開節點。
4. 執行開發伺服器後開啟 `http://localhost:3000/admin`，調整內容並按「儲存到 Firebase」。

新增管理模組時，在 `src/config/types.ts` 擴充資料結構、於 `src/config/defaults.ts` 提供離線預設值，再到 `src/admin/moduleRegistry.ts` 註冊模組即可。正式上線前建議在下一階段加入 Firebase Authentication 或將寫入移到受保護的伺服器端點。

## Card Event System

`/admin` 的 **Card Event System** 由 `server.ts` 統一處理卡片規則：前台只會回報事件；伺服器更新 `users/{uid}/stats`，只檢查相同 `triggerType` 的規則，依 `priority` 發放一張卡片，其他符合的項目會進入 `users/{uid}/pendingCards`。已發放的卡片紀錄在 `earnedCards`，不會重複取得。

資料節點為 `cards`、`cardRules` 與 `users/{uid}`。目前 Firebase 規則只開放 `gameConfig`，因此要啟用這套正式寫入流程，請把**伺服器專用**的 `FIREBASE_DATABASE_SECRET` 填進部署環境，並讓 Firebase 規則維持拒絕瀏覽器直接存取 `cards`、`cardRules`、`users`。不要為了讓它能運作而把 `users` 公開讀寫，否則任何人都可改寫玩家紀錄。
