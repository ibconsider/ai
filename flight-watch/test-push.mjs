#!/usr/bin/env node
import { notifyAllChannels } from "./lib/notify-all.mjs";

const result = await notifyAllChannels({
  title: "✈️ 機票監控測試推播",
  message:
    "若 iPhone 靜音鍵開著仍聽到聲音，代表 Critical／Pushover 設定成功。Discord 在靜音模式下通常不會響（和 Cursor 完成音不同）。",
  clickUrl: "https://github.com/ibconsider/ai/issues?q=label%3Aflight-alert",
  priority: "urgent",
});

console.log(JSON.stringify(result, null, 2));

if (!result.sent.length) {
  console.error(
    "\n沒有任何手機管道送出。靜音鍵仍要響請設：\n" +
      "- PUSHOVER_API_TOKEN + PUSHOVER_USER_KEY（最穩）\n" +
      "- 或 NTFY_TOPIC（iOS 開 Critical Alerts）\n" +
      "Discord 可留著看訊息，但靜音鍵開著通常沒鈴聲。"
  );
  process.exit(1);
}

console.log("OK — sent via:", result.sent.join(", "));
