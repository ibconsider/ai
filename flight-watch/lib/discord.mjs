/** Discord webhook — enable mobile notifications for that server/channel. */
export async function sendDiscordAlert({ title, message, clickUrl }) {
  const webhook = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhook) {
    console.log("[discord] DISCORD_WEBHOOK_URL not set — skip.");
    return { skipped: true, reason: "missing_DISCORD_WEBHOOK_URL" };
  }

  const userId = process.env.DISCORD_USER_ID?.trim();
  const mention = userId ? `<@${userId}>` : "";

  const content = [
    mention,
    `**${title}**`,
    message,
    clickUrl || "",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 1900);

  const payload = {
    content,
    allowed_mentions: userId
      ? { users: [userId] }
      : { parse: [] },
  };

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord HTTP ${res.status}: ${text}`);
  }
  return { sent: true, status: res.status, mentioned: Boolean(userId) };
}
