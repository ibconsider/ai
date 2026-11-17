#!/usr/bin/env node
import { sendNtfyAlert } from "./lib/ntfy.mjs";

const result = await sendNtfyAlert({
  title: "✈️ 機票監控測試推播",
  message:
    "若你聽到／看到這則通知，手機提示聲已設定成功。之後達標會用同樣方式立刻推播。",
  clickUrl: "https://github.com/ibconsider/ai/issues?q=label%3Aflight-alert",
  priority: "urgent",
  tags: ["white_check_mark", "airplane"],
});

if (result.skipped) {
  console.error(
    "缺少 NTFY_TOPIC。請在 GitHub Actions secrets 新增 NTFY_TOPIC（你的私人 topic 名稱）。"
  );
  process.exit(1);
}

console.log("ntfy test OK", result);
