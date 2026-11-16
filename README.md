# ai

## 機票價格自動監控

見 [`flight-watch/README.md`](./flight-watch/README.md)。

簡述：GitHub Actions 每天用 Travelpayouts 多市場（芬蘭 EUR／土耳其 TRY／台灣 TWD）追蹤

- **TPE → HEL**（2027-01-10～02-03）&lt; **18,000 TWD**
- **TPE → IST**（同區間）&lt; **10,000 TWD**

達標會開 GitHub Issue（`flight-alert`）。請先設定 repo secret `TRAVELPAYOUTS_TOKEN`。
