# 手機提示聲設定（請先合併 PR）

## 為什麼 email 沒聲音、又遲到？

1. **手機推播的 PR 還沒合併**時，系統只會開 GitHub Issue → 寄 email。Gmail／系統郵件常常**沒提示聲**，要你手動開收件匣才看得到。  
2. GitHub Actions 排程常**延遲數十分鐘到數小時**（例如排 9:00，實際 10:00 才跑完寄信）。

所以不要再只靠 email。請用下面至少一種**App 推播**。

---

## 今天請做這三步

### ① 合併這個 PR

https://github.com/ibconsider/ai/pull/4  

（舊的 PR #2 可關閉。）

### ② 設定 Telegram（最推薦，上課也容易響）

1. 手機打開 Telegram，搜尋 **`@BotFather`**
2. 送 `/newbot`，照指示取名字 → 拿到 **token**（一長串）
3. 到 GitHub secrets 新增：  
   - `TELEGRAM_BOT_TOKEN` = 那串 token  
   https://github.com/ibconsider/ai/settings/secrets/actions
4. 在 Telegram 搜尋你的 bot，按 **Start**
5. 用手機瀏覽器打開（把 `<TOKEN>` 換成你的 token）：  
   `https://api.telegram.org/bot<TOKEN>/getUpdates`  
   找到 `"chat":{"id": 一串數字` → 那就是 chat id
6. 再新增 secret：`TELEGRAM_CHAT_ID` = 那串數字（可含負號）
7. Telegram App：**設定 → 通知與聲音** → 開啟通知，允許聲音；勿開「靜音」／專注模式擋 Telegram

### ③ 測試推播

1. https://github.com/ibconsider/ai/actions/workflows/flight-watch.yml  
2. **Run workflow** → 勾選 **test_push** → Run  
3. 手機應立刻收到 Telegram／ntfy 測試訊息

---

## 可選：再加一層保險

| 管道 | Secret | 說明 |
| --- | --- | --- |
| **ntfy** | `NTFY_TOPIC` | 裝 [ntfy App](https://ntfy.sh/)，訂閱難猜 topic |
| **Discord** | `DISCORD_WEBHOOK_URL` | 伺服器 → 頻道 → 整合 → Webhook |

可三個都開；達標會同時推。

---

## 注意

- Email 可留著當備份，但**不要當第一通知**。  
- 上課時請確認手機沒開勿擾，或允許 Telegram／ntfy **緊急通知例外**。  
- 達標後請立刻點連結下訂；快取價會過期。
