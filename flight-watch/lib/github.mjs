function ghHeaders() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) return null;
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${token}`,
    "x-github-api-version": "2022-11-28",
    "user-agent": "flight-watch",
  };
}

function repoSlug() {
  const slug = process.env.GITHUB_REPOSITORY;
  if (!slug) throw new Error("GITHUB_REPOSITORY is required for GitHub alerts");
  return slug;
}

export async function findOpenAlertIssue(routeId, labels) {
  const headers = ghHeaders();
  if (!headers) return null;
  const q = [
    `repo:${repoSlug()}`,
    "is:issue",
    "is:open",
    `label:${labels[0] || "flight-alert"}`,
    `in:title ${routeId}`,
  ].join(" ");
  const url = new URL("https://api.github.com/search/issues");
  url.searchParams.set("q", q);
  url.searchParams.set("per_page", "5");
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub search failed: ${res.status}`);
  const data = await res.json();
  return data.items?.[0] || null;
}

export async function createOrUpdateAlertIssue({ title, body, labels, routeId }) {
  const headers = ghHeaders();
  if (!headers) {
    console.log("[notify] No GITHUB_TOKEN — skip issue create. Report only.");
    return { skipped: true };
  }

  const existing = await findOpenAlertIssue(routeId, labels);
  if (existing) {
    const res = await fetch(existing.comments_url, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) throw new Error(`GitHub comment failed: ${res.status}`);
    // Keep title fresh
    await fetch(existing.url, {
      method: "PATCH",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ title }),
    });
    return { updated: true, url: existing.html_url, number: existing.number };
  }

  const res = await fetch(`https://api.github.com/repos/${repoSlug()}/issues`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ title, body, labels }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub create issue failed: ${res.status} ${text}`);
  }
  const issue = await res.json();
  return { created: true, url: issue.html_url, number: issue.number };
}

export async function ensureLabel(name, color = "0E8A16") {
  const headers = ghHeaders();
  if (!headers) return;
  const get = await fetch(`https://api.github.com/repos/${repoSlug()}/labels/${encodeURIComponent(name)}`, {
    headers,
  });
  if (get.status === 200) return;
  await fetch(`https://api.github.com/repos/${repoSlug()}/labels`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({
      name,
      color,
      description: "Flight price threshold hit",
    }),
  });
}
