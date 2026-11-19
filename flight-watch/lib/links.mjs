/**
 * Deep links that open Google Flights / Aviasales in destination-local language + currency.
 * These are for human verification — pricing often differs by POS/locale.
 *
 * Google Flights: classic `#flt=` fragments are deprecated and often open a blank
 * search form. Prefer the modern `tfs=` protobuf token; keep a `q=` text fallback.
 */
import {
  googleFlightsSearchUrl,
  googleFlightsQueryUrl,
} from "./google-flights-tfs.mjs";

export function googleFlightsUrl({ origin, destination, date, currency, hl }) {
  return googleFlightsSearchUrl({
    origin,
    destination,
    date,
    currency,
    hl,
  });
}

export function aviasalesUrl({ origin, destination, date, locale, currency }) {
  // Aviasales marker-less search deep link (one-way).
  const yymmdd = date.replaceAll("-", "").slice(2); // 270115
  const path = `/${origin}${yymmdd}${destination}1`;
  const host =
    locale === "fi"
      ? "https://www.aviasales.com"
      : locale === "tr"
        ? "https://www.aviasales.com.tr"
        : locale === "zh"
          ? "https://www.aviasales.com"
          : "https://www.aviasales.com";
  const params = new URLSearchParams({
    locale: locale === "zh" ? "zh" : locale,
    currency: currency.toLowerCase(),
  });
  return `${host}${path}?${params.toString()}`;
}

export function buildVerifyLinks(route, offer, marketCfg) {
  const common = {
    origin: route.origin,
    destination: route.destination,
    date: offer.departDate,
    currency: marketCfg.currency,
    hl: marketCfg.locale,
  };
  return {
    googleFlights: googleFlightsUrl(common),
    googleFlightsFallback: googleFlightsQueryUrl(common),
    aviasales: aviasalesUrl({
      origin: route.origin,
      destination: route.destination,
      date: offer.departDate,
      locale: marketCfg.locale,
      currency: marketCfg.currency,
    }),
  };
}
