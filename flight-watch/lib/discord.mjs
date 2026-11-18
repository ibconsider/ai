/** Optional Discord webhook (mobile Discord can ring). */
export async function sendDiscordAlert({ title, message, clickUrl }) {
  const webhook = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhook) {
    console.log("[discord] DISCORD_WEBHOOK_URL not set — skip.");
    return { skipped: true, reason: "missing_DISCORD_WEBHOOK_URL" };
  }

  const content = [
    `**${title}**`,
    message,
    clickUrl ? clickUrl : "",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content: content.slice(0, 1900) }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord HTTP ${res.status}: ${text}`);
  }
  return { sent: true, status: res.status };
}
