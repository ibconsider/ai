# ai

## 機票價格自動監控（回程）

見 [`flight-watch/README.md`](./flight-watch/README.md)。

- 每天 **09:00 / 21:00（Europe/Helsinki）** 查價
- **TPE → HEL** &lt; 18,000 TWD；**TPE → IST** &lt; 10,000 TWD
- 達標：**ntfy 手機推播（提示聲）** + GitHub Issue

Secrets：`TRAVELPAYOUTS_TOKEN`、`NTFY_TOPIC`
