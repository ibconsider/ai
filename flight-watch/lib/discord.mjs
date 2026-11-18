/** Discord webhook — enable mobile notifications for that server/channel. */

function normalizeUserId(raw) {
  if (!raw) return null;
  // Accept pasted IDs that may include spaces, quotes, or <@...> mention syntax.
  const digits = String(raw).trim().replace(/[<@!>]/g, "").replace(/\D/g, "");
  // Discord snowflakes are typically 17–20 digits.
  if (!/^\d{17,20}$/.test(digits)) return null;
  return digits;
}

async function postWebhook(webhook, payload) {
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  return { res, text };
}

export async function sendDiscordAlert({ title, message, clickUrl }) {
  const webhook = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhook) {
    console.log("[discord] DISCORD_WEBHOOK_URL not set — skip.");
    return { skipped: true, reason: "missing_DISCORD_WEBHOOK_URL" };
  }
  if (!/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\//i.test(webhook)) {
    throw new Error(
      "DISCORD_WEBHOOK_URL looks invalid. It should start with https://discord.com/api/webhooks/"
    );
  }

  const userId = normalizeUserId(process.env.DISCORD_USER_ID);
  if (process.env.DISCORD_USER_ID?.trim() && !userId) {
    console.warn(
      "[discord] DISCORD_USER_ID is set but invalid; sending without @mention."
    );
  }

  const baseLines = [
    `**${title}**`,
    message,
    clickUrl || "",
  ].filter(Boolean);

  const withMention = {
    content: [userId ? `<@${userId}>` : null, ...baseLines]
      .filter(Boolean)
      .join("\n")
      .slice(0, 1900),
    allowed_mentions: userId ? { users: [userId] } : { parse: [] },
  };

  let { res, text } = await postWebhook(webhook, withMention);

  // Retry without mention if Discord rejects allowed_mentions/users.
  if (!res.ok && userId) {
    console.warn(
      `[discord] mention post failed (${res.status}): ${text} — retrying without @mention`
    );
    const withoutMention = {
      content: baseLines.join("\n").slice(0, 1900),
      allowed_mentions: { parse: [] },
    };
    ({ res, text } = await postWebhook(webhook, withoutMention));
  }

  if (!res.ok) {
    throw new Error(`Discord HTTP ${res.status}: ${text}`);
  }
  return { sent: true, status: res.status, mentioned: Boolean(userId) };
}
