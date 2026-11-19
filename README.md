# ai

## 機票價格自動監控（回程）

見 [`flight-watch/README.md`](./flight-watch/README.md)。

- **約每 2 小時**查價（一天約 12 次）
- **TPE → HEL** &lt; 18,000；**TPE → IST** &lt; 10,000
- **TPE → HIJ（2027-01-15）**、**HIJ → TPE（2027-01-20）** &lt; 7,000 且總時長 ≤12h
- 達標：Discord＋捷徑／ntfy

設定見 [`flight-watch/NOTIFY.md`](./flight-watch/NOTIFY.md)。
