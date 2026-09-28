/**
 * Single source of truth for "which browser origins may talk to this API",
 * shared by the CORS middleware and the CSRF/origin guard.
 */
const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

function originOf(value) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * An origin is allowed when it is (a) explicitly listed in CLIENT_URL, or
 * (b) the same host this request was addressed to — which covers the default
 * single-service deployment (Express serves the built React app) without any
 * CORS configuration. Browsers cannot forge the Host header, so an attacker's
 * page (Origin: https://evil.example, Host: your-api) never matches (b).
 * In development with no CLIENT_URL set, everything is allowed for convenience.
 */
function isAllowedOrigin(origin, req) {
  if (!origin) return false;
  const normalized = originOf(origin);
  if (!normalized) return false;
  if (allowedOrigins.includes(normalized)) return true;
  if (req && req.headers && req.headers.host) {
    try {
      if (new URL(normalized).host === req.headers.host) return true;
    } catch {
      /* fall through */
    }
  }
  if (!isProduction && allowedOrigins.length === 0) return true;
  return false;
}

module.exports = { allowedOrigins, isAllowedOrigin, originOf };
