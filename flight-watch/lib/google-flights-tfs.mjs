/**
 * Encode a Google Flights `tfs=` token (URL-safe base64 protobuf).
 * Schema matches reverse-engineered Url/Flight/Location messages used by
 * google-flights-url-generator / flight-goat (one-way, 1 adult, economy).
 */

function encodeVarint(n) {
  const bytes = [];
  let x = n >>> 0;
  while (x > 0x7f) {
    bytes.push((x & 0x7f) | 0x80);
    x >>>= 7;
  }
  bytes.push(x);
  return Buffer.from(bytes);
}

function tag(fieldNumber, wireType) {
  return encodeVarint((fieldNumber << 3) | wireType);
}

function encodeBytes(fieldNumber, buf) {
  return Buffer.concat([tag(fieldNumber, 2), encodeVarint(buf.length), buf]);
}

function encodeString(fieldNumber, str) {
  return encodeBytes(fieldNumber, Buffer.from(str, "utf8"));
}

function encodeVarintField(fieldNumber, value) {
  return Buffer.concat([tag(fieldNumber, 0), encodeVarint(value)]);
}

function encodeLocation(iata) {
  // Location: field 1 = type (1=airport), field 2 = name
  return Buffer.concat([encodeVarintField(1, 1), encodeString(2, iata)]);
}

function encodeFlight({ date, origin, destination }) {
  // Flight: field 2 date, field 13 src, field 14 dst
  return Buffer.concat([
    encodeString(2, date),
    encodeBytes(13, encodeLocation(origin)),
    encodeBytes(14, encodeLocation(destination)),
  ]);
}

/**
 * @returns {string} URL-safe base64 without padding
 */
export function encodeTfsOneWay({ origin, destination, date }) {
  // Traveler enum: ADULT = 1 (field 8 repeated)
  // Class: ECONOMY = 1 (field 9)
  // field 14 = 1 appears on live Google search tokens (non-filter / defaults)
  // TripType: ONE_WAY = 2 (field 19)
  const urlMsg = Buffer.concat([
    encodeBytes(3, encodeFlight({ date, origin, destination })),
    encodeVarintField(8, 1),
    encodeVarintField(9, 1),
    encodeVarintField(14, 1),
    encodeVarintField(19, 2),
  ]);
  return urlMsg.toString("base64url");
}

export function googleFlightsSearchUrl({
  origin,
  destination,
  date,
  currency,
  hl,
}) {
  const tfs = encodeTfsOneWay({ origin, destination, date });
  const params = new URLSearchParams({
    tfs,
    hl: hl || "en",
    curr: String(currency || "USD").toUpperCase(),
  });
  return `https://www.google.com/travel/flights/search?${params.toString()}`;
}

/** Plain-language fallback if tfs ever breaks. */
export function googleFlightsQueryUrl({
  origin,
  destination,
  date,
  currency,
  hl,
}) {
  const params = new URLSearchParams({
    hl: hl || "en",
    curr: String(currency || "USD").toUpperCase(),
    q: `Flights from ${origin} to ${destination} on ${date}`,
  });
  return `https://www.google.com/travel/flights?${params.toString()}`;
}
