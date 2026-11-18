# ai

## 機票價格自動監控（回程）

見 [`flight-watch/README.md`](./flight-watch/README.md)。

- **約每 2 小時**查價（一天約 12 次）
- **TPE → HEL** &lt; 18,000 TWD；**TPE → IST** &lt; 10,000 TWD
- 達標：**Discord 手機推播**（不要只靠 email）

請先合併 PR #4，再依 [`flight-watch/NOTIFY.md`](./flight-watch/NOTIFY.md) 設定。  
Secrets：`TRAVELPAYOUTS_TOKEN`、`DISCORD_WEBHOOK_URL`（建議加 `DISCORD_USER_ID`）
