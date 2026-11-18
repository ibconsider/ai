# 手機提示聲（iPhone 靜音鍵開著也要響）

## 為什麼 Discord／Cursor 不一樣？

| 來源 | 靜音鍵開著 |
| --- | --- |
| **鬧鐘** | 會響（系統鬧鐘通道） |
| **Cursor 跑完提示音** | 常會響（App 內媒體音，不是一般通知鈴） |
| **Discord 通知** | **通常不響**（一般推播，遵守靜音鍵） |

所以：**Discord 適合「有訊息」**；要「靜音鍵開著也響」請加 **Pushover** 或 **ntfy Critical**。

Discord 可繼續留著當備份（達標仍會在頻道出現）。

---

## 方案 A：Pushover（最穩，約一次買斷）

1. 手機裝 [Pushover](https://pushover.net/clients)（App Store）  
2. 註冊 https://pushover.net/ → 複製 **User Key**  
3. 網站建立 Application → 複製 **API Token/Key**  
4. GitHub secrets：  
   - `PUSHOVER_USER_KEY`  
   - `PUSHOVER_API_TOKEN`  
5. iPhone：**設定 → 通知 → Pushover → 打開 Critical Alerts（緊急通知）**  
6. Actions → Flight price watch → 勾 **test_push** → 測聲音（靜音鍵可維持開啟）

達標會用 **Emergency** 優先級（會重複提醒直到確認）。

---

## 方案 B：ntfy（免費）

1. 裝 [ntfy](https://ntfy.sh/)  
2. 訂閱難猜 topic，例如 `fand-flight-7k2m9x`  
3. Secret：`NTFY_TOPIC` = 該名稱  
4. iPhone：設定 → 通知 → ntfy → 允許通知，並開啟 **Critical Alerts**（若有）  
5. App 內若有「Priority 5 = Critical」選項也打開  
6. 勾 **test_push** 測試  

我們會送 **Priority 5（max）**。

---

## Discord（已可用，當備份）

- `DISCORD_WEBHOOK_URL`、建議 `DISCORD_USER_ID`（純數字）  
- 靜音鍵開著：頻道會有字，但**別指望鈴聲**

---

## 測試

1. 合併含 Pushover／ntfy 的 PR  
2. 設好 secret  
3. https://github.com/ibconsider/ai/actions/workflows/flight-watch.yml  
4. **Run workflow** → 勾 **test_push**  
5. **保持靜音鍵開啟**，看 Pushover／ntfy 會不會響
