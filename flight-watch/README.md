# 機票價格自動監控（回程）

去程台灣已買好；本監控盯下列單程經濟艙：

| 航線 | 日期 | 門檻 | 備註 |
| --- | --- | --- | --- |
| 回程｜TPE → HEL | 2027-01-10～02-03 | **&lt; 18,000 TWD** | 多市場 EUR/TWD/USD |
| 回程｜TPE → IST | 同上 | **&lt; 10,000 TWD** | 多市場 TRY/TWD/USD |
| 台北 → 廣島 TPE→HIJ | **2027-01-11** | **&lt; 7,000 TWD** | 總時長 **≤12 小時** |
| 廣島 → 台北 HIJ→TPE | **2027-01-16** | **&lt; 7,000 TWD** | 總時長 **≤12 小時** |

允許多次轉機。各市場原幣報價換算成台幣後取最低。達標時會：

1. **手機推播（Telegram / ntfy / Discord）** ← 必做，email 沒聲音
2. 開／更新 GitHub Issue（`flight-alert`，僅備份）

排程：**約每 2 小時一次**。GitHub 排程常會晚跑，所以更要靠 App 推播，不能靠 email。

## 手機提示聲（必做）

完整步驟見 **[NOTIFY.md](./NOTIFY.md)**（**免費**）。

- **Discord**：達標會有訊息；靜音鍵開著通常不響  
- **要靜音鍵也響（免費）**：  
  1. iPhone **捷徑**：收到主旨含「機票達標」的郵件 → 播放聲音（同電量捷徑原理）  
  2. 或免費 **ntfy** + Critical Alerts

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
