/**
 * Instant phone push via ntfy.sh (free).
 * Priority 5 / max can become iOS Critical Alerts (rings with Silent switch on)
 * if the ntfy iOS app has Critical Alerts enabled.
 * Docs: https://docs.ntfy.sh/publish/
 */

function topicUrl() {
  const topic = process.env.NTFY_TOPIC?.trim();
  if (!topic) return null;
  if (/^https?:\/\//i.test(topic)) return topic;
  const server = (process.env.NTFY_SERVER || "https://ntfy.sh").replace(/\/$/, "");
  return `${server}/${encodeURIComponent(topic)}`;
}

export async function sendNtfyAlert({
  title,
  message,
  clickUrl,
  priority = "max",
  tags = ["airplane", "warning", "rotating_light"],
}) {
  const url = topicUrl();
  if (!url) {
    console.log("[ntfy] NTFY_TOPIC not set — skip phone push.");
    return { skipped: true, reason: "missing_NTFY_TOPIC" };
  }

  // Use numeric 5 as well as "max" — iOS maps prio 5 → critical when allowed.
  const headers = {
    Title: title,
    Priority: "5",
    Tags: tags.join(","),
    // Help some clients treat as time-sensitive / critical.
    "X-Priority": "5",
  };
  if (priority && priority !== "max" && priority !== "urgent") {
    headers.Priority = String(priority);
  }
  if (clickUrl) headers.Click = clickUrl;

  const token = process.env.NTFY_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: message,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ntfy HTTP ${res.status}: ${text}`);
  }

  return { sent: true, status: res.status, priority: 5 };
}
