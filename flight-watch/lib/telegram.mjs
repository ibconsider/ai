/**
 * Telegram bot push — reliable phone banners + sound if Telegram notifications
 * are enabled (recommended as primary alert while in class).
 */

export async function sendTelegramAlert({ title, message, clickUrl }) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) {
    console.log("[telegram] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — skip.");
    return { skipped: true, reason: "missing_telegram_secrets" };
  }

  const text = [
    `<b>${escapeHtml(title)}</b>`,
    "",
    escapeHtml(message),
    clickUrl ? `\n<a href="${escapeHtml(clickUrl)}">打開 Google Flights</a>` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
      // Ensure notification (not silent)
      disable_notification: false,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.ok === false) {
    throw new Error(`Telegram HTTP ${res.status}: ${JSON.stringify(body)}`);
  }
  return { sent: true, messageId: body.result?.message_id };
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
