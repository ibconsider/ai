# 機票價格自動監控（回程）

去程台灣已買好；本監控盯 **回程單程經濟艙**，出發區間 **2027-01-10～2027-02-03**：

| 航線 | 門檻 | 優先查價市場 |
| --- | --- | --- |
| 回程｜台北 TPE → 赫爾辛基 HEL | **&lt; 18,000 TWD** | 芬蘭站 EUR、台灣站 TWD、美國站 USD |
| 回程｜台北 TPE → 伊斯坦堡 IST | **&lt; 10,000 TWD** | 土耳其站 TRY、台灣站 TWD、美國站 USD |

允許多次轉機。各市場原幣報價換算成台幣後取最低。達標時會：

1. **手機推播（ntfy，可開提示聲）** ← 請務必設定，比 email 快
2. 開／更新 GitHub Issue（`flight-alert`）

排程：**約每 2 小時一次**（UTC `0 */2 * * *`；芬蘭冬季約整天整點偶數時），一天約 12 次。GitHub 排程可能略延遲。

## 手機提示聲（必做）

GitHub / Gmail 信件常常沒聲音。改用免費 **ntfy** 推播：

### A. 手機

1. 安裝 [ntfy](https://ntfy.sh/)（[Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy) / [iOS](https://apps.apple.com/app/ntfy/id1625396347)）
2. App 內 **Subscribe to topic**
3. Topic 自己取一個**很難猜**的名稱，例如 `fand-tpe-hel-7k2m9x`（不要用公開字串）
4. 系統通知權限：**允許**，並打開**聲音／橫幅／鎖定畫面**
5. 在該 topic 設定裡把 **Priority**／緊急通知打開（Android 可設為高優先通知頻道）

### B. GitHub Secret

1. https://github.com/ibconsider/ai/settings/secrets/actions  
2. **New repository secret**  
3. Name：`NTFY_TOPIC`  
4. Value：你在 App 訂閱的那個 topic 名稱（只要名稱，不要整段 URL）  
5. Save  

（可選）若你用 ntfy 付費／自架並開了 access token，再加 secret `NTFY_TOKEN`。

### C. 測試聲音

1. 合併本 PR 後打開 https://github.com/ibconsider/ai/actions/workflows/flight-watch.yml  
2. **Run workflow**  
3. 勾選 **test_push** → Run  
4. 手機應立刻響／跳出「機票監控測試推播」

之後真實達標會用 **urgent** 優先級推播，點通知可直達 Google Flights。

## Travelpayouts token（若尚未設定）

1. [Travelpayouts](https://www.travelpayouts.com/) → Profile → **API token**
2. GitHub secret 名稱：`TRAVELPAYOUTS_TOKEN`

## 本機測試

```bash
node flight-watch/check.mjs --dry-run
NTFY_TOPIC=your-topic node flight-watch/test-ntfy.mjs
```

## 調整條件

編輯 [`config.json`](./config.json)：日期區間、門檻、markets。

## 注意

- Travelpayouts 是快取價（約 2–7 天），**推播後請立刻點連結確認可訂價**。
- 匯率：`@fawazahmed0/currency-api`（免費）。
