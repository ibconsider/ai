# 機票價格自動監控

監控 **2027-01-10～2027-02-03** 出發的單程經濟艙：

| 航線 | 門檻 | 優先查價市場 |
| --- | --- | --- |
| 台北 TPE → 赫爾辛基 HEL | **&lt; 18,000 TWD** | 芬蘭站 EUR、台灣站 TWD、美國站 USD |
| 台北 TPE → 伊斯坦堡 IST | **&lt; 10,000 TWD** | 土耳其站 TRY、台灣站 TWD、美國站 USD |

允許多次轉機。各市場報價會先保留原幣，再換算成台幣比較；**以換算後最低者為準**。達標時開／更新 GitHub Issue 通知你（若 repo 有開 email 通知就會寄信）。

> 為什麼查當地語系／貨幣？很多 OTA／Google Flights 會依「銷售點（point of sale）」顯示不同價格。本監控會同時打芬蘭／土耳其／台灣等 market，並附上對應語系連結方便你人工核價。

## 你需要做的 2 件事

### 1. 免費申請 Travelpayouts API token

1. 到 [Travelpayouts](https://www.travelpayouts.com/) 註冊（免費）
2. 個人檔案裡複製 **API token**
3. 打開 GitHub repo → **Settings → Secrets and variables → Actions**
4. 新增 secret 名稱：`TRAVELPAYOUTS_TOKEN`，貼上 token

### 2. 打開 GitHub Actions（若尚未啟用）

合併本 PR 後，workflow `Flight price watch` 會：

- **每天 09:00（台北時間）**自動跑
- 也可在 Actions 頁手動 **Run workflow**
- 低於門檻 → 建立／留言到帶 `flight-alert` 標籤的 Issue

建議再到 GitHub → Settings → Notifications，確認 Issues 會寄到你的信箱。

## 本機測試

```bash
# 不需 token，用假資料驗證流程
node flight-watch/check.mjs --dry-run

# 真實查價（需 export TRAVELPAYOUTS_TOKEN=...）
node flight-watch/check.mjs

# 真實查價 + 開 Issue（另需 GITHUB_TOKEN、GITHUB_REPOSITORY）
node flight-watch/check.mjs --notify
```

報告會寫到 `flight-watch/out/latest.json`。

## 調整條件

編輯 [`config.json`](./config.json)：

- `dateRange`：出發區間
- `routes[].thresholdTwd`：門檻
- `routes[].markets`：要用哪些當地 market／貨幣

## Cursor Automation（可選）

若想用 Cursor 雲端 Agent 瀏覽器再核一次 Google Flights，見 [`CURSOR_AUTOMATION.md`](./CURSOR_AUTOMATION.md)。

## 注意

- Travelpayouts Data API 是**使用者搜尋快取**（約 2–7 天），不是即時訂位價。Issue 裡會附當地語系 Google Flights／Aviasales 連結，請在下訂前再確認。
- 匯率來源：`@fawazahmed0/currency-api`（免費、免 key）。
