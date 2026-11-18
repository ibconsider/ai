import { sendNtfyAlert } from "./ntfy.mjs";
import { sendTelegramAlert } from "./telegram.mjs";
import { sendDiscordAlert } from "./discord.mjs";
import { sendPushoverAlert } from "./pushover.mjs";

/**
 * Fan-out to every configured phone channel. Missing secrets are skipped,
 * not fatal — so you can enable channels one by one.
 *
 * Silent-switch note (iPhone): Discord notifications usually stay quiet when
 * the side Silent switch is on. Pushover (Critical Alerts) and ntfy priority-5
 * critical can still ring; Cursor completion tones use a different audio path.
 */
export async function notifyAllChannels({ title, message, clickUrl, priority = "urgent" }) {
  const results = {};

  try {
    results.pushover = await sendPushoverAlert({ title, message, clickUrl });
  } catch (err) {
    results.pushover = { error: String(err.message || err) };
    console.error("[notify:pushover]", err);
  }

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

  const channels = ["pushover", "ntfy", "telegram", "discord"];
  const sent = channels.filter((k) => results[k]?.sent);
  if (sent.length === 0) {
    console.warn(
      "[notify] No phone channel sent. For sound with iPhone Silent ON, set PUSHOVER_* or NTFY_TOPIC (critical)."
    );
  }
  return { sent, results };
}
