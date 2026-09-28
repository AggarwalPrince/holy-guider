const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const isProduction = process.env.NODE_ENV === "production";

// ---------------------------------------------------------------------------
// Signing secret
// ---------------------------------------------------------------------------
// Production refuses to start without a real secret: a random per-process
// fallback would silently log everyone out on every restart and break any
// multi-instance deployment. Development gets a random one with a warning.
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (isProduction) {
    throw new Error("JWT_SECRET must be set in production (generate one with: openssl rand -hex 48).");
  }
  JWT_SECRET = crypto.randomBytes(48).toString("hex");
  console.warn("⚠️  [Auth] JWT_SECRET is not set; using a temporary secret. Sessions reset on every restart.");
} else if (isProduction && JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET is too short for production (use at least 32 characters).");
}

const COOKIE_NAME = "hg_session";
const USER_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ADMIN_TTL_MS = 8 * 60 * 60 * 1000; // privileged sessions are short-lived

const isAdminUser = (user) => Boolean(user && (user.isAdmin || user.role === "admin"));

// ---------------------------------------------------------------------------
// Token + cookie helpers
// ---------------------------------------------------------------------------
/**
 * The token carries ONLY who the user is and their session version. Anything
 * that can change — admin status, guest flag, balance — is deliberately NOT in
 * the token; it is read from the database on every request (see requireUser).
 * That is what makes revoking an admin take effect immediately instead of
 * after the token's expiry.
 */
function signToken(user, { ttlMs = USER_TTL_MS } = {}) {
  return jwt.sign({ sub: user._id.toString(), tv: user.tokenVersion || 0 }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: Math.floor(ttlMs / 1000),
  });
}

function cookieOptions(maxAgeMs) {
  const sameSite = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();
  return {
    httpOnly: true, // JavaScript (and therefore XSS) can never read the session
    secure: isProduction || sameSite === "none" || process.env.COOKIE_SECURE === "true",
    sameSite: ["lax", "strict", "none"].includes(sameSite) ? sameSite : "lax",
    path: "/",
    maxAge: maxAgeMs,
  };
}

function setSessionCookie(res, token, ttlMs = USER_TTL_MS) {
  res.cookie(COOKIE_NAME, token, cookieOptions(ttlMs));
}

function clearSessionCookie(res) {
  const { maxAge, ...opts } = cookieOptions(0);
  res.clearCookie(COOKIE_NAME, opts);
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(part.slice(idx + 1).trim());
    } catch {
      /* ignore malformed cookie */
    }
  }
  return out;
}

function hasSessionCookie(req) {
  return Boolean(parseCookies(req.headers.cookie)[COOKIE_NAME]);
}

/** Returns { token, via } — session cookie only. Authorization: Bearer is not accepted. */
function extractToken(req) {
  const cookieToken = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (cookieToken) return { token: cookieToken, via: "cookie" };
  return { token: null, via: null };
}

// ---------------------------------------------------------------------------
// Session loading — always re-checked against the database
// ---------------------------------------------------------------------------
async function loadSession(req) {
  const { token, via } = extractToken(req);
  if (!token) return { error: 401, message: "Authentication required. Please sign in." };

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return { error: 401, message: "Invalid or expired session. Please sign in again." };
  }

  const user = await User.findById(payload.sub);
  if (!user) return { error: 401, message: "Your session refers to an account that no longer exists." };
  if ((payload.tv || 0) !== (user.tokenVersion || 0)) {
    return { error: 401, message: "Your session was revoked. Please sign in again." };
  }

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      isAdmin: isAdminUser(user), // current DB state, never a token claim
      isGuest: Boolean(user.isGuest),
      via,
    },
    userDoc: user,
  };
}

/**
 * Requires a valid session. The user is loaded from the database on every
 * request, so req.user.isAdmin always reflects the CURRENT privilege: if an
 * admin is demoted, their very next request is treated as a normal user (or
 * rejected, if their session was revoked) — not 7 days later.
 */
async function requireUser(req, res, next) {
  try {
    const session = await loadSession(req);
    if (session.error) return res.status(session.error).json({ error: session.message });
    req.user = session.user;
    req.userDoc = session.userDoc;
    return next();
  } catch (err) {
    console.error("[Auth] Session check failed:", err);
    return res.status(500).json({ error: "Could not verify your session." });
  }
}

/** Same as requireUser, plus the user must currently be an admin. */
async function requireAdmin(req, res, next) {
  return requireUser(req, res, (err) => {
    if (err) return next(err);
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Access denied. Administrator privileges required." });
    }
    return next();
  });
}

/** Populates req.user when a valid session exists but never rejects. */
async function attachUserIfPresent(req, res, next) {
  try {
    const session = await loadSession(req);
    req.user = session.error ? null : session.user;
    req.userDoc = session.error ? null : session.userDoc;
  } catch {
    req.user = null;
  }
  next();
}

module.exports = {
  COOKIE_NAME,
  ADMIN_TTL_MS,
  USER_TTL_MS,
  isAdminUser,
  signToken,
  setSessionCookie,
  clearSessionCookie,
  hasSessionCookie,
  requireUser,
  requireAdmin,
  attachUserIfPresent,
};
