# Cursor Automation 設定（可選加分）

GitHub Actions 已負責每日快取價監控。若還想用 Cursor 雲端 Agent **用瀏覽器**在當地語系 Google Flights 再核一次價，請建立 Automation：

1. 打開 [cursor.com/automations](https://cursor.com/automations)
2. **New automation**
3. Trigger：**Scheduled** → 每天（建議台北時間 10:00，比 GitHub Actions 晚一小時）  
   Cron 範例：`CRON_TZ=Asia/Taipei 0 10 * * *`
4. Repository：選 `ibconsider/ai`（本 repo）
5. Tools：若有「Send email / Slack」可打開；否則看 Agent 執行結果即可
6. Prompt 貼上下方全文

---

## Prompt

```text
你是機票價格核價助理。請檢查下列單程經濟艙（允許多趟轉機），並用「目的地國家語系＋當地貨幣」開啟 Google Flights 查價（不要只用台灣站／TWD），再換算成台幣回報。

日期區間（出發）：2027-01-10 到 2027-02-03

航線與門檻：
1) 台北 TPE → 赫爾辛基 HEL：低於 18000 TWD
2) 台北 TPE → 伊斯坦堡 IST：低於 10000 TWD

查價方式（務必做）：
- 芬蘭線：Google Flights 用 hl=fi、curr=EUR（可用 google.fi 或 google.com/travel/flights?hl=fi&curr=EUR）
- 土耳其線：hl=tr、curr=TRY
- 對照組：同一日期再用 hl=zh-TW、curr=TWD 查一次
- 抽樣至少 5 個出發日（含區間頭尾與中間幾天）；若看到更便宜日期可多查
- 匯率可用公開匯率 API 換算成 TWD；列出原幣金額與約合台幣

輸出（繁體中文）：
- 每條航線：目前看到的最低價、出發日、轉機次數、哪個語系／貨幣較便宜
- 是否達標（是／否）
- 可點的 Google Flights 連結
- 若達標：標題第一行寫「🚨 達標」並清楚標示價格；若未達標寫「未達標」與距門檻差額

可先執行：`node flight-watch/check.mjs`（若環境有 TRAVELPAYOUTS_TOKEN）把快取結果當起點，再瀏覽器核價。
不要修改程式碼，除非我另外要求。
```
