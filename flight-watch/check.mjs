#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRatesToTwd, toTwd } from "./lib/fx.mjs";
import { searchRouteMarket } from "./lib/travelpayouts.mjs";
import { buildVerifyLinks } from "./lib/links.mjs";
import { createOrUpdateAlertIssue, ensureLabel } from "./lib/github.mjs";
import { notifyAllChannels } from "./lib/notify-all.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, "config.json"), "utf8"));

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const notify = args.has("--notify") || process.env.FLIGHT_WATCH_NOTIFY === "1";

function pickBest(offers, rates) {
  const scored = offers.map((o) => ({
    ...o,
    priceTwd: toTwd(o.price, o.currency, rates),
  }));
  scored.sort((a, b) => a.priceTwd - b.priceTwd || a.transfers - b.transfers);
  return scored;
}

/** Cheapest offer per depart date that is under the TWD threshold. */
function belowThresholdByDate(ranked, thresholdTwd) {
  const byDate = new Map();
  for (const o of ranked) {
    if (!(o.priceTwd < thresholdTwd)) continue;
    const prev = byDate.get(o.departDate);
    if (!prev || o.priceTwd < prev.priceTwd) byDate.set(o.departDate, o);
  }
  return [...byDate.values()].sort(
    (a, b) => a.departDate.localeCompare(b.departDate) || a.priceTwd - b.priceTwd
  );
}

function marketCfgOf(offer) {
  return (
    offer._marketCfg || {
      label: offer.market,
      locale: "en",
      currency: offer.currency,
      market: offer.market,
    }
  );
}

function formatOfferLine(o) {
  const xfer = o.transfers === 0 ? "直飛" : `${o.transfers} 次轉機`;
  return `- **${o.departDate}**｜${o.price.toLocaleString()} ${o.currency} ≈ **${o.priceTwd.toLocaleString()} TWD**｜${xfer}｜market=${o.market}｜來源=${o.source}`;
}

function formatBelowDateLine(route, o) {
  const cfg = marketCfgOf(o);
  const links = buildVerifyLinks(route, o, {
    locale: cfg.locale || "en",
    currency: o.currency,
  });
  const xfer = o.transfers === 0 ? "直飛" : `${o.transfers} 次轉機`;
  return `- **${o.departDate}**｜${o.price.toLocaleString()} ${o.currency} ≈ **${o.priceTwd.toLocaleString()} TWD**｜${xfer}｜[Google Flights](${links.googleFlights}) · [備用連結](${links.googleFlightsFallback}) · [Aviasales](${links.aviasales})`;
}

function buildIssueBody(route, best, marketCfg, belowDates) {
  const links = buildVerifyLinks(route, best, marketCfg);
  const status = belowDates.length ? "✅ 已低於門檻" : "ℹ️ 尚未達標（摘要）";
  const lines = [
    `## ${route.label}（${route.origin} → ${route.destination}）`,
    "",
    status,
    "",
    `| 項目 | 值 |`,
    `| --- | --- |`,
    `| 查詢區間 | ${config.dateRange.start} → ${config.dateRange.end} |`,
    `| 最低出發日 | ${best.departDate} |`,
    `| 最低報價 | ${best.price.toLocaleString()} ${best.currency} |`,
    `| 約合台幣 | **${best.priceTwd.toLocaleString()} TWD** |`,
    `| 門檻 | ${route.thresholdTwd.toLocaleString()} TWD |`,
    `| 轉機 | ${best.transfers} |`,
    `| 查價市場 | ${marketCfg.label} (\`${best.market}\` / ${best.currency}) |`,
    `| 達標日期數 | ${belowDates.length}（區間內全部日期都會查；不是只查首日） |`,
    "",
    "### 達標日期一覽（區間內快取有價且低於門檻）",
    "",
  ];

  if (belowDates.length === 0) {
    lines.push("_目前快取沒有低於門檻的日期。_");
  } else {
    for (const o of belowDates) lines.push(formatBelowDateLine(route, o));
  }

  lines.push(
    "",
    "### 最低價快速核價連結",
    "",
    `- [Google Flights（當地語系，預填 ${best.departDate}）](${links.googleFlights})`,
    `- [Google Flights 備用文字搜尋](${links.googleFlightsFallback})`,
    `- [Aviasales](${links.aviasales})`,
    "",
    "_資料來自 Travelpayouts／Aviasales 快取（約 2–7 天）。遠期航線快取常不完整——Google 現場可查到、但快取沒列出的日期，不會出現在上方清單。_",
    "",
    `檢查時間（UTC）：${new Date().toISOString()}`
  );

  return lines.join("\n");
}

async function checkRoute(route, rates) {
  const all = [];
  const errors = [];

  for (const marketCfg of route.markets) {
    try {
      if (dryRun) {
        // Synthetic samples on first + mid window so date listing is exercised.
        const mid = config.dateRange.end;
        for (const [departDate, factor] of [
          [config.dateRange.start, 0.9],
          [mid, 0.95],
        ]) {
          all.push({
            source: "dry-run",
            market: marketCfg.market,
            currency: marketCfg.currency.toUpperCase(),
            departDate,
            price:
              marketCfg.currency.toLowerCase() === "twd"
                ? Math.round(route.thresholdTwd * factor)
                : marketCfg.currency.toLowerCase() === "eur"
                  ? Math.round((route.thresholdTwd * factor) / rates.EUR)
                  : marketCfg.currency.toLowerCase() === "try"
                    ? Math.round((route.thresholdTwd * factor) / rates.TRY)
                    : Math.round((route.thresholdTwd * factor) / (rates.USD || 30)),
            transfers: 1,
            airline: "XX",
            flightNumber: null,
            expiresAt: null,
            gate: null,
            _marketCfg: marketCfg,
          });
        }
        continue;
      }

      const offers = await searchRouteMarket(route, marketCfg, config.dateRange);
      for (const o of offers) all.push({ ...o, _marketCfg: marketCfg });
    } catch (err) {
      errors.push({ market: marketCfg.market, message: String(err.message || err) });
    }
  }

  const ranked = pickBest(all, rates);
  const best = ranked[0] || null;
  const belowOffers = best
    ? belowThresholdByDate(ranked, route.thresholdTwd)
    : [];
  const below = belowOffers.length > 0;

  return {
    routeId: route.id,
    label: route.label,
    thresholdTwd: route.thresholdTwd,
    offerCount: ranked.length,
    best,
    top: ranked.slice(0, 20),
    belowThreshold: below,
    /** Full offers (kept for notify link building). */
    belowOffers,
    belowDates: belowOffers.map((o) => ({
      departDate: o.departDate,
      price: o.price,
      currency: o.currency,
      priceTwd: o.priceTwd,
      transfers: o.transfers,
      market: o.market,
      source: o.source,
    })),
    errors,
  };
}

async function main() {
  const currencies = [
    ...new Set(config.routes.flatMap((r) => r.markets.map((m) => m.currency.toUpperCase()))),
  ];
  const rates = dryRun
    ? { TWD: 1, EUR: 36.27, TRY: 0.65, USD: 31.5 }
    : await loadRatesToTwd(currencies);

  const results = [];
  for (const route of config.routes) {
    results.push(await checkRoute(route, rates));
  }

  const report = {
    checkedAt: new Date().toISOString(),
    dateRange: config.dateRange,
    fx: rates,
    dryRun,
    results,
  };

  const outDir = join(__dirname, "out");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "latest.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log("=== 機票監控結果 ===");
  console.log(`區間：${config.dateRange.start} → ${config.dateRange.end}`);
  console.log(`匯率：${JSON.stringify(rates)}`);
  console.log("");

  for (const r of results) {
    console.log(`## ${r.label}（門檻 ${r.thresholdTwd.toLocaleString()} TWD）`);
    if (r.errors.length) {
      console.log("錯誤：", r.errors);
    }
    if (!r.best) {
      console.log("沒有找到符合日期的報價。");
      console.log("");
      continue;
    }
    console.log(
      `最低：${r.best.price} ${r.best.currency} ≈ ${r.best.priceTwd} TWD（${r.best.departDate}，${r.best.transfers} 轉機，market=${r.best.market}）${r.belowThreshold ? " ← 達標" : ""}`
    );
    if (r.belowDates?.length) {
      console.log(
        `達標日期（${r.belowDates.length}）：${r.belowDates.map((d) => d.departDate).join(", ")}`
      );
    }
    for (const line of r.top.map(formatOfferLine)) console.log(line);
    console.log("");
  }

  if (notify) {
    for (const label of config.alert.githubIssueLabels) {
      await ensureLabel(label);
    }
    for (const r of results) {
      if (!r.belowThreshold || !r.best) continue;
      const route = config.routes.find((x) => x.id === r.routeId);
      const marketCfg = marketCfgOf(r.best);
      const links = buildVerifyLinks(route, r.best, {
        locale: marketCfg.locale || "en",
        currency: r.best.currency,
      });
      const title = `${config.alert.titlePrefix}｜${r.label}｜${r.best.priceTwd.toLocaleString()} TWD（${r.best.departDate}） [${r.routeId}]`;
      const body = buildIssueBody(
        route,
        r.best,
        {
          label: marketCfg.label || marketCfg.market,
          locale: marketCfg.locale || "en",
          currency: r.best.currency,
          market: r.best.market,
        },
        r.belowOffers
      );
      const result = await createOrUpdateAlertIssue({
        title,
        body,
        labels: config.alert.githubIssueLabels,
        routeId: r.routeId,
      });
      console.log("[notify:github]", r.routeId, result);

      const dateList = r.belowDates
        .map((d) => `${d.departDate}≈${d.priceTwd.toLocaleString()}TWD`)
        .join("、");
      const xfer =
        r.best.transfers === 0 ? "直飛" : `${r.best.transfers} 次轉機`;
      const push = await notifyAllChannels({
        title: `✈️ 機票達標 ${r.best.priceTwd.toLocaleString()} TWD`,
        message: [
          `${r.label}`,
          `${route.origin}→${route.destination}｜最低 ${r.best.departDate}｜${xfer}`,
          `${r.best.price.toLocaleString()} ${r.best.currency} ≈ ${r.best.priceTwd.toLocaleString()} TWD`,
          `達標日期 ${r.belowDates.length} 天：${dateList}`,
          `區間 ${config.dateRange.start}→${config.dateRange.end}（會查完整區間，不是只查首日）`,
          `立刻打開連結確認／下訂（快取價會過期）`,
          links.googleFlights,
        ].join("\n"),
        clickUrl: links.googleFlights,
        priority: "urgent",
      });
      console.log("[notify:push]", r.routeId, push);
    }
  }

  // Non-zero exit when dry-run always succeeds; real run fails only on total hard failure.
  const hardFail = !dryRun && results.every((r) => r.errors.length && !r.best);
  if (hardFail) {
    console.error("All routes failed; see errors above.");
    process.exit(2);
  }

  console.log(`報告已寫入 ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
