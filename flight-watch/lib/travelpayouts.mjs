const BASE = "https://api.travelpayouts.com";

function requireToken() {
  const token = process.env.TRAVELPAYOUTS_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "Missing TRAVELPAYOUTS_TOKEN. Sign up free at https://www.travelpayouts.com/ and put the API token in the GitHub Actions secret."
    );
  }
  return token;
}

async function getJson(path, params) {
  const token = requireToken();
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  url.searchParams.set("token", token);

  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "X-Access-Token": token,
    },
  });

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    const msg = body?.error || body?.message || text || res.statusText;
    throw new Error(`Travelpayouts ${res.status}: ${msg}`);
  }
  return body;
}

function monthsCovering(startIso, endIso) {
  const start = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  const months = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  while (cursor <= end) {
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}-01`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

function inRange(dateIso, start, end) {
  return dateIso >= start && dateIso <= end;
}

/**
 * Fetch cheapest one-way quotes for a route/market across the date window.
 * Uses month-matrix (grouped by transfers) then falls back to cheap calendar.
 */
export async function searchRouteMarket(route, marketCfg, dateRange) {
  const { origin, destination, allowTransfers } = route;
  const { market, currency } = marketCfg;
  const offers = [];

  for (const month of monthsCovering(dateRange.start, dateRange.end)) {
    const matrix = await getJson("/v2/prices/month-matrix", {
      currency: currency.toLowerCase(),
      origin,
      destination,
      month,
      show_to_affiliates: "false",
      one_way: "true",
      market,
      limit: 31,
    });

    const rows = Array.isArray(matrix?.data) ? matrix.data : [];
    for (const row of rows) {
      const depart = row.depart_date || row.departure_at?.slice?.(0, 10);
      if (!depart || !inRange(depart, dateRange.start, dateRange.end)) continue;
      const transfers = Number(row.number_of_changes ?? row.transfers ?? 0);
      if (!allowTransfers && transfers > 0) continue;
      const price = Number(row.value ?? row.price);
      if (!Number.isFinite(price) || price <= 0) continue;
      offers.push({
        source: "month-matrix",
        market,
        currency: currency.toUpperCase(),
        departDate: depart,
        price,
        transfers,
        airline: row.airline || null,
        flightNumber: row.flight_number || null,
        expiresAt: row.expires_at || null,
        gate: row.gate || null,
      });
    }
  }

  // Secondary: cheap prices by month (broader cache)
  const startMonth = dateRange.start.slice(0, 7);
  const endMonth = dateRange.end.slice(0, 7);
  const months = startMonth === endMonth ? [startMonth] : [startMonth, endMonth];
  for (const departMonth of months) {
    const cheap = await getJson("/v1/prices/cheap", {
      origin,
      destination,
      depart_date: departMonth,
      currency: currency.toLowerCase(),
      market,
    });
    const data = cheap?.data?.[destination] || cheap?.data || {};
    const values = typeof data === "object" && data !== null ? Object.values(data) : [];
    for (const row of values) {
      const depart = (row.departure_at || row.depart_date || "").slice(0, 10);
      if (!depart || !inRange(depart, dateRange.start, dateRange.end)) continue;
      const transfers = Number(row.number_of_stops ?? row.transfers ?? 0);
      if (!allowTransfers && transfers > 0) continue;
      const price = Number(row.price ?? row.value);
      if (!Number.isFinite(price) || price <= 0) continue;
      offers.push({
        source: "cheap",
        market,
        currency: currency.toUpperCase(),
        departDate: depart,
        price,
        transfers,
        airline: row.airline || null,
        flightNumber: row.flight_number || null,
        expiresAt: row.expires_at || null,
        gate: null,
      });
    }
  }

  return offers;
}
