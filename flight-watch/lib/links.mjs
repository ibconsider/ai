/**
 * Deep links that open Google Flights / Aviasales in destination-local language + currency.
 * These are for human verification — pricing often differs by POS/locale.
 */
export function googleFlightsUrl({ origin, destination, date, currency, hl }) {
  const params = new URLSearchParams({
    hl,
    curr: currency.toUpperCase(),
  });
  // Hash fragment keeps the classic one-way search shape used by Flights.
  const hash = `flt=${origin}.${destination}.${date};c:${currency.toUpperCase()};e:1;sd:1;t:f;tt:o`;
  return `https://www.google.com/travel/flights?${params.toString()}#${hash}`;
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
  return {
    googleFlights: googleFlightsUrl({
      origin: route.origin,
      destination: route.destination,
      date: offer.departDate,
      currency: marketCfg.currency,
      hl: marketCfg.locale,
    }),
    aviasales: aviasalesUrl({
      origin: route.origin,
      destination: route.destination,
      date: offer.departDate,
      locale: marketCfg.locale,
      currency: marketCfg.currency,
    }),
  };
}
