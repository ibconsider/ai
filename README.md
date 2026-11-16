# ai

## 機票價格自動監控

見 [`flight-watch/README.md`](./flight-watch/README.md)。

簡述：GitHub Actions **每天 09:00（Europe/Helsinki）**用 Travelpayouts 多市場追蹤**回程**：

- **TPE → HEL**（2027-01-10～02-03）&lt; **18,000 TWD**
- **TPE → IST**（同區間）&lt; **10,000 TWD**

達標會開 GitHub Issue（`flight-alert`）。需 repo secret `TRAVELPAYOUTS_TOKEN`。
