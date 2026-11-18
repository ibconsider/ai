import { sendNtfyAlert } from "./ntfy.mjs";
import { sendTelegramAlert } from "./telegram.mjs";
import { sendDiscordAlert } from "./discord.mjs";

/**
 * Fan-out to every configured phone channel. Missing secrets are skipped,
 * not fatal — so you can enable channels one by one.
 */
export async function notifyAllChannels({ title, message, clickUrl, priority = "urgent" }) {
  const results = {};

  try {
    results.ntfy = await sendNtfyAlert({ title, message, clickUrl, priority });
  } catch (err) {
    results.ntfy = { error: String(err.message || err) };
    console.error("[notify:ntfy]", err);
  }

  try {
    results.telegram = await sendTelegramAlert({ title, message, clickUrl });
  } catch (err) {
    results.telegram = { error: String(err.message || err) };
    console.error("[notify:telegram]", err);
  }

  try {
    results.discord = await sendDiscordAlert({ title, message, clickUrl });
  } catch (err) {
    results.discord = { error: String(err.message || err) };
    console.error("[notify:discord]", err);
  }

  const sent = ["ntfy", "telegram", "discord"].filter((k) => results[k]?.sent);
  if (sent.length === 0) {
    console.warn(
      "[notify] No phone channel sent. Set TELEGRAM_BOT_TOKEN+TELEGRAM_CHAT_ID and/or NTFY_TOPIC (and merge the PR)."
    );
  }
  return { sent, results };
}
