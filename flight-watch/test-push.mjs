#!/usr/bin/env node
import { notifyAllChannels } from "./lib/notify-all.mjs";

const result = await notifyAllChannels({
  title: "✈️ 機票監控測試推播",
  message:
    "若手機響了／跳出這則，提示聲設定成功。之後達標會用同樣管道立刻通知（不要只靠 email）。",
  clickUrl: "https://github.com/ibconsider/ai/issues?q=label%3Aflight-alert",
  priority: "urgent",
});

console.log(JSON.stringify(result, null, 2));

if (!result.sent.length) {
  console.error(
    "\n沒有任何手機管道送出。請至少設定一組：\n" +
      "- TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID（建議）\n" +
      "- 或 NTFY_TOPIC\n" +
      "- 或 DISCORD_WEBHOOK_URL\n" +
      "並確認已合併 PR #4 後再跑 test_push。"
  );
  process.exit(1);
}

console.log("OK — sent via:", result.sent.join(", "));
