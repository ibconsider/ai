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

function formatOfferLine(o) {
  const xfer = o.transfers === 0 ? "直飛" : `${o.transfers} 次轉機`;
  const dur =
    o.durationHours == null ? "時長未知" : `${Number(o.durationHours).toFixed(1)} 小時`;
  return `- **${o.departDate}**｜${o.price.toLocaleString()} ${o.currency} ≈ **${o.priceTwd.toLocaleString()} TWD**｜${xfer}｜${dur}｜market=${o.market}｜來源=${o.source}`;
}

function buildIssueBody(route, best, marketCfg, below) {
  const links = buildVerifyLinks(route, best, marketCfg);
  const status = below ? "✅ 已低於門檻" : "ℹ️ 尚未達標（摘要）";
  return [
    `## ${route.label}（${route.origin} → ${route.destination}）`,
    "",
    status,
    "",
    `| 項目 | 值 |`,
    `| --- | --- |`,
    `| 出發日 | ${best.departDate} |`,
    `| 報價 | ${best.price.toLocaleString()} ${best.currency} |`,
    `| 約合台幣 | **${best.priceTwd.toLocaleString()} TWD** |`,
    `| 門檻 | ${route.thresholdTwd.toLocaleString()} TWD |`,
    `| 轉機 | ${best.transfers} |`,
    `| 總時長 | ${best.durationHours == null ? "未知（下訂前請確認 ≤12h）" : `${Number(best.durationHours).toFixed(1)} 小時`} |`,
    `| 時長上限 | ${route.maxDurationHours != null ? `${route.maxDurationHours} 小時` : "無"} |`,
    `| 查價市場 | ${marketCfg.label} (\`${best.market}\` / ${best.currency}) |`,
    "",
    "### 用當地語系／貨幣人工核價（通常較準）",
    "",
    `- [Google Flights（當地語系）](${links.googleFlights})`,
    `- [Aviasales](${links.aviasales})`,
    "",
    "_資料來自 Travelpayouts／Aviasales 快取（約 2–7 天），請以上方連結確認可訂價格。_",
    "",
    `檢查時間（UTC）：${new Date().toISOString()}`,
  ].join("\n");
}

async function checkRoute(route, rates) {
  const all = [];
  const errors = [];

  for (const marketCfg of route.markets) {
    try {
      const range = route.dateRange || config.dateRange;
      if (dryRun) {
        // Synthetic sample so CI can exercise formatting without a token.
        const cur = marketCfg.currency.toLowerCase();
        let price;
        if (cur === "twd") price = route.thresholdTwd * 0.9;
        else if (cur === "eur") price = Math.round((route.thresholdTwd * 0.85) / rates.EUR);
        else if (cur === "try") price = Math.round((route.thresholdTwd * 0.8) / rates.TRY);
        else if (cur === "jpy") price = Math.round((route.thresholdTwd * 0.88) / (rates.JPY || 0.21));
        else price = Math.round((route.thresholdTwd * 0.95) / (rates.USD || 30));
        all.push({
          source: "dry-run",
          market: marketCfg.market,
          currency: marketCfg.currency.toUpperCase(),
          departDate: range.start,
          price,
          transfers: 1,
          durationHours: route.maxDurationHours != null ? Math.min(6, route.maxDurationHours) : 8,
          airline: "XX",
          flightNumber: null,
          expiresAt: null,
          gate: null,
          _marketCfg: marketCfg,
        });
        continue;
      }

      const offers = await searchRouteMarket(route, marketCfg, range);
      for (const o of offers) all.push({ ...o, _marketCfg: marketCfg });
    } catch (err) {
      errors.push({ market: marketCfg.market, message: String(err.message || err) });
    }
  }

  const ranked = pickBest(all, rates);
  const best = ranked[0] || null;
  const below = Boolean(best && best.priceTwd < route.thresholdTwd);

  return {
    routeId: route.id,
    label: route.label,
    thresholdTwd: route.thresholdTwd,
    offerCount: ranked.length,
    best,
    top: ranked.slice(0, 8),
    belowThreshold: below,
    errors,
  };
}

async function main() {
  const currencies = [
    ...new Set(config.routes.flatMap((r) => r.markets.map((m) => m.currency.toUpperCase()))),
  ];
  const rates = dryRun
    ? { TWD: 1, EUR: 36.27, TRY: 0.65, USD: 31.5, JPY: 0.21 }
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
  console.log(`預設區間：${config.dateRange.start} → ${config.dateRange.end}`);
  console.log(`匯率：${JSON.stringify(rates)}`);
  console.log("");

  for (const r of results) {
    const route = config.routes.find((x) => x.id === r.routeId);
    const range = route?.dateRange || config.dateRange;
    console.log(
      `## ${r.label}（門檻 ${r.thresholdTwd.toLocaleString()} TWD｜${range.start}→${range.end}${route?.maxDurationHours != null ? `｜≤${route.maxDurationHours}h` : ""}）`
    );
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
      const marketCfg = r.best._marketCfg || {
        label: r.best.market,
        locale: "en",
        currency: r.best.currency,
        market: r.best.market,
      };
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
        true
      );
      const result = await createOrUpdateAlertIssue({
        title,
        body,
        labels: config.alert.githubIssueLabels,
        routeId: r.routeId,
      });
      console.log("[notify:github]", r.routeId, result);

      // Phone channels (Telegram / ntfy / Discord) — not GitHub email.
      const xfer =
        r.best.transfers === 0 ? "直飛" : `${r.best.transfers} 次轉機`;
      const push = await notifyAllChannels({
        title: `✈️ 機票達標 ${r.best.priceTwd.toLocaleString()} TWD`,
        message: [
          `${r.label}`,
          `${route.origin}→${route.destination}｜${r.best.departDate}｜${xfer}`,
          `${r.best.price.toLocaleString()} ${r.best.currency} ≈ ${r.best.priceTwd.toLocaleString()} TWD`,
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
