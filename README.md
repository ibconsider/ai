# ai

## 機票價格自動監控（回程）

見 [`flight-watch/README.md`](./flight-watch/README.md)。

- **約每 2 小時**查價（一天約 12 次）
- **TPE → HEL** &lt; 18,000 TWD；**TPE → IST** &lt; 10,000 TWD
- 達標：**ntfy 手機推播（提示聲）** + GitHub Issue

Secrets：`TRAVELPAYOUTS_TOKEN`、`NTFY_TOPIC`
