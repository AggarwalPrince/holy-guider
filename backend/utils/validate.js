/**
 * Small, dependency-free input validators.
 *
 * Why this exists: Express hands us whatever JSON the client sent, so a field
 * we expect to be a string can arrive as an object ({"$ne": null}) or an
 * array. Passing that straight into a Mongo filter is NoSQL injection, and
 * `Number(["50"])` happily coerces to 50. Everything that reaches a query or
 * money calculation goes through one of these first.
 */

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

function isObjectIdString(v) {
  return typeof v === "string" && OBJECT_ID_RE.test(v);
}

function isString(v, { min = 1, max = 256 } = {}) {
  return typeof v === "string" && v.length >= min && v.length <= max;
}

/**
 * Parse a whole-rupee amount. Accepts a JS number or a plain digit string,
 * rejects everything else (arrays, booleans, NaN, Infinity, decimals,
 * exponent notation, negative numbers) and enforces an inclusive range.
 * Returns the integer, or null when invalid.
 */
function parseRupees(value, { min = 1, max = 1_000_000 } = {}) {
  let n;
  if (typeof value === "number") {
    n = value;
  } else if (typeof value === "string" && /^\d{1,9}$/.test(value.trim())) {
    n = Number(value.trim());
  } else {
    return null;
  }
  if (!Number.isSafeInteger(n) || n < min || n > max) return null;
  return n;
}

module.exports = { isObjectIdString, isString, parseRupees };
