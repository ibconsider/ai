/**
 * Instant phone push via ntfy.sh (free). Install the ntfy app and subscribe
 * to your private topic; Priority "urgent"/"high" triggers sound/vibration.
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
  priority = "urgent",
  tags = ["airplane", "warning"],
}) {
  const url = topicUrl();
  if (!url) {
    console.log("[ntfy] NTFY_TOPIC not set — skip phone push.");
    return { skipped: true, reason: "missing_NTFY_TOPIC" };
  }

  const headers = {
    Title: title,
    Priority: String(priority),
    Tags: tags.join(","),
  };
  if (clickUrl) headers.Click = clickUrl;
  // Android / iOS: request sound; urgent already forces attention on most builds.
  headers["X-Priority"] = String(priority === "urgent" ? 5 : 4);

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

  return { sent: true, status: res.status };
}
