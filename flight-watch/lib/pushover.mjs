/**
 * Pushover — iOS Critical Alerts can ring even with the side Silent switch on
 * (same class of alert as some alarm-style apps; Discord cannot do this).
 * https://pushover.net/api
 */

export async function sendPushoverAlert({ title, message, clickUrl }) {
  const token = process.env.PUSHOVER_API_TOKEN?.trim();
  const user = process.env.PUSHOVER_USER_KEY?.trim();
  if (!token || !user) {
    console.log("[pushover] PUSHOVER_API_TOKEN / PUSHOVER_USER_KEY not set — skip.");
    return { skipped: true, reason: "missing_pushover_secrets" };
  }

  // priority=2 emergency: repeats until acknowledged; needs retry+expire.
  // On iPhone, enable Critical Alerts for Pushover to bypass Silent switch.
  const params = new URLSearchParams({
    token,
    user,
    title: String(title).slice(0, 250),
    message: String(message).slice(0, 1024),
    priority: "2",
    retry: "60",
    expire: "600",
    sound: process.env.PUSHOVER_SOUND?.trim() || "siren",
  });
  if (clickUrl) {
    params.set("url", clickUrl);
    params.set("url_title", "打開機票連結");
  }

  const res = await fetch("https://api.pushover.net/1/messages.json", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.status !== 1) {
    throw new Error(`Pushover HTTP ${res.status}: ${JSON.stringify(body)}`);
  }
  return { sent: true, request: body.request };
}
