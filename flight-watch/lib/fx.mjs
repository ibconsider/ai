const CDN = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies";
const FALLBACK = "https://latest.currency-api.pages.dev/v1/currencies";

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`FX HTTP ${res.status} for ${url}`);
  return res.json();
}

/**
 * Returns map of uppercase currency -> TWD rate (1 UNIT = rate TWD).
 */
export async function loadRatesToTwd(currencies) {
  const needed = [...new Set(currencies.map((c) => c.toLowerCase()))];
  const rates = { TWD: 1 };

  for (const code of needed) {
    if (code === "twd") continue;
    let data;
    try {
      data = await fetchJson(`${CDN}/${code}.json`);
    } catch {
      data = await fetchJson(`${FALLBACK}/${code}.json`);
    }
    const twd = data?.[code]?.twd;
    if (typeof twd !== "number" || !(twd > 0)) {
      throw new Error(`Missing TWD rate for ${code.toUpperCase()}`);
    }
    rates[code.toUpperCase()] = twd;
  }

  return rates;
}

export function toTwd(amount, currency, rates) {
  const rate = rates[currency.toUpperCase()];
  if (typeof rate !== "number") {
    throw new Error(`No FX rate for ${currency}`);
  }
  return Math.round(amount * rate);
}
