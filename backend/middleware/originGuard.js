const { isAllowedOrigin, originOf } = require("../config/origins");
const { hasSessionCookie } = require("./auth");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF defence for a cookie-authenticated API. The session cookie is
 * SameSite=Lax by default, and JSON bodies already force a CORS preflight for
 * cross-site fetches; this adds a third, explicit layer: any state-changing
 * request that carries a browser Origin (or Referer) must come from an origin
 * we trust. Requests with no Origin at all (curl, server-to-server) are only
 * accepted when they aren't relying on the ambient session cookie.
 */
function originGuard(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.headers.origin || (req.headers.referer ? originOf(req.headers.referer) : null);

  if (!origin) {
    if (hasSessionCookie(req)) {
      return res.status(403).json({ error: "Cross-site request blocked (missing Origin)." });
    }
    return next();
  }

  if (isAllowedOrigin(origin, req)) return next();
  return res.status(403).json({ error: "Cross-site request blocked." });
}

module.exports = originGuard;
