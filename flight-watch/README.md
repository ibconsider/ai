# 機票價格自動監控（回程）

去程台灣已買好；本監控盯 **回程單程經濟艙**，出發區間 **2027-01-10～2027-02-03**：

| 航線 | 門檻 | 優先查價市場 |
| --- | --- | --- |
| 回程｜台北 TPE → 赫爾辛基 HEL | **&lt; 18,000 TWD** | 芬蘭站 EUR、台灣站 TWD、美國站 USD |
| 回程｜台北 TPE → 伊斯坦堡 IST | **&lt; 10,000 TWD** | 土耳其站 TRY、台灣站 TWD、美國站 USD |

允許多次轉機。各市場原幣報價換算成台幣後取最低。達標時會：

1. **手機推播（Telegram / ntfy / Discord）** ← 必做，email 沒聲音
2. 開／更新 GitHub Issue（`flight-alert`，僅備份）

排程：**約每 2 小時一次**。GitHub 排程常會晚跑，所以更要靠 App 推播，不能靠 email。

## 手機提示聲（必做）

完整步驟見 **[NOTIFY.md](./NOTIFY.md)**（**Discord** 即可，不必 Telegram）。

摘要：

1. **先合併** https://github.com/ibconsider/ai/pull/4（沒合併＝永遠只有 email）
2. 設定 `DISCORD_WEBHOOK_URL`（建議再加 `DISCORD_USER_ID` 以便 @你）
3. Actions → 勾 **test_push** 確認 Discord 手機會響

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
