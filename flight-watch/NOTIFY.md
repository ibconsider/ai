# 手機提示聲設定（Discord）

## 為什麼 email 沒聲音？

**PR #4 沒合併前**，達標只會開 GitHub Issue → 寄 email。Gmail 常常沒提示聲，Actions 也常晚跑。

請改用 **Discord App 推播**。

---

## 今天請做

### ① 合併 PR

https://github.com/ibconsider/ai/pull/4

### ② 建立 Discord Webhook

1. 打開 Discord（電腦或手機都行）
2. 進你的伺服器 → 選一個頻道（建議新建 `#flight-alerts`）
3. 頻道設定 → **整合 / Integrations** → **Webhook** → **新 Webhook**
4. 複製 **Webhook URL**（形如 `https://discord.com/api/webhooks/...`）

### ③ 存進 GitHub Secret

1. https://github.com/ibconsider/ai/settings/secrets/actions  
2. **New repository secret**  
3. Name：`DISCORD_WEBHOOK_URL`  
4. Value：貼上整段 Webhook URL → Save  

### ④（強烈建議）讓通知 @你 — 比較會響

1. Discord 開啟「開發者模式」：設定 → 進階 → 開發者模式  
2. 右鍵自己的頭像 → **複製使用者 ID**  
3. 新增／更新 secret：`DISCORD_USER_ID` = **只有數字**（約 17–20 位，不要加引號、空格、`<@...>`）  
4. 你必須已加入該 Webhook 所在的伺服器，@ 才會成功  

若 ID 不對，系統會改成不 @ 你仍發送訊息。

### ⑤ 打開 Discord 手機通知

- Discord App → 設定 → 通知 → 開啟  
- 該伺服器／`#flight-alerts`：**不要靜音**  
- 系統層級允許 Discord 通知聲音；上課勿擾可把 Discord 設成例外  

### ⑥ 測試

1. https://github.com/ibconsider/ai/actions/workflows/flight-watch.yml  
2. **Run workflow** → 勾選 **test_push** → Run  
3. 手機 Discord 應立刻跳出「機票監控測試推播」

---

## 可選備援

| Secret | 用途 |
| --- | --- |
| `NTFY_TOPIC` | 另裝 ntfy App 再加一層 |

不必設 Telegram。
