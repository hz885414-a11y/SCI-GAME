@echo off
chcp 65001 >nul
cd /d "%~dp0程式碼"

set "CODEX_NODE=C:\Users\bus11\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

echo 正在啟動 SCI-GAME 預覽...
echo 啟動後請開啟 http://localhost:3000/
echo.

where node >nul 2>nul
if %errorlevel%==0 (
  node node_modules\tsx\dist\cli.mjs server.ts
) else if exist "%CODEX_NODE%" (
  "%CODEX_NODE%" node_modules\tsx\dist\cli.mjs server.ts
) else (
  echo 找不到 Node.js，請先開啟 Codex 後再執行此檔案。
  pause
)
