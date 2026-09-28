const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const {
  signToken,
  setSessionCookie,
  clearSessionCookie,
  requireUser,
  isAdminUser,
  ADMIN_TTL_MS,
  USER_TTL_MS,
} = require("../middleware/auth");
const { adminLoginLimiter, guestLimiter } = require("../middleware/rateLimits");
const { isObjectIdString, isString } = require("../utils/validate");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const isProduction = process.env.NODE_ENV === "production";
const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
const GUEST_DAILY_CAP = Number(process.env.GUEST_DAILY_CAP) || 200;

const sha256 = (s) => crypto.createHash("sha256").update(s).digest();

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: isAdminUser(user) ? "admin" : "user",
    isAdmin: isAdminUser(user),
    isGuest: Boolean(user.isGuest),
  };
}

/**
 * Starts a browser session: the token goes into an HttpOnly cookie, so page
 * JavaScript (and therefore any XSS bug) can never read it. The token is
 * never echoed in the JSON body — the cookie is the only way to hold a
 * session, for browser clients and API clients alike.
 */
function startSession(res, user, { ttlMs = USER_TTL_MS, extra = {} } = {}) {
  const token = signToken(user, { ttlMs });
  setSessionCookie(res, token, ttlMs);
  return res.json({
    success: true,
    user: publicUser(user),
    ...extra,
  });
}

const httpsUrlOrDefault = (u) => (typeof u === "string" && /^https:\/\//i.test(u) && u.length <= 2048 ? u : DEFAULT_AVATAR);

/**
 * POST /api/auth/google — sign in with a Google ID token.
 *
 * The token is only trusted after Google's library verifies its signature and
 * audience. Admin is granted only for a verified token whose email is
 * ADMIN_EMAIL AND which Google marks email_verified (a matching but
 * unverified address proves nothing). A no-verification fallback exists for
 * local development only, and can never grant admin.
 */
router.post("/google", async (req, res) => {
  try {
    const token = req.body && req.body.token;
    if (!isString(token, { min: 1, max: 8192 })) {
      return res.status(400).json({ error: "Google ID token is required." });
    }

    const googleConfigured =
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_ID !== "your-google-client-id.apps.googleusercontent.com";

    let payload;
    let verified = false;

    if (googleConfigured) {
      const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
      verified = true;
    } else if (!isProduction) {
      const parts = token.split(".");
      if (parts.length === 3) {
        payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
      } else {
        payload = {
          sub: `google_user_${Date.now()}`,
          email: "seeker@mysticai.io",
          name: "Enlightened Seeker",
          picture: DEFAULT_AVATAR,
        };
      }
    } else {
      return res.status(503).json({ error: "Google sign-in is not configured on this server." });
    }

    // Whatever the payload's source, only plain strings may reach a database
    // query (an object here would be NoSQL injection in the dev fallback).
    if (!payload || !isString(payload.sub, { max: 255 })) {
      return res.status(401).json({ error: "Authentication failed. Could not verify Google credentials." });
    }
    const googleId = payload.sub;
    const email = isString(payload.email, { max: 320 }) ? payload.email.toLowerCase().trim() : `user_${googleId}@holyguider.com`;
    const name = isString(payload.name, { max: 200 }) ? payload.name : "Spiritual Seeker";
    const picture = httpsUrlOrDefault(payload.picture);

    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const isConfiguredAdmin =
      verified && payload.email_verified === true && adminEmail !== "" && email === adminEmail;

    // Atomic find-or-create: two simultaneous first logins can't race into a
    // duplicate-key error or two accounts.
    let user = await User.findOneAndUpdate(
      { googleId },
      { $setOnInsert: { email, name, avatar: picture, role: "user", isAdmin: false, isGuest: false } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (isConfiguredAdmin && !isAdminUser(user)) {
      user = await User.findByIdAndUpdate(user._id, { $set: { isAdmin: true, role: "admin" } }, { new: true });
    }

    return startSession(res, user, { ttlMs: isAdminUser(user) ? ADMIN_TTL_MS : USER_TTL_MS });
  } catch (error) {
    console.error("[Auth] Google sign-in verification error:", error.message);
    return res.status(401).json({ error: "Authentication failed. Could not verify Google credentials." });
  }
});

/**
 * POST /api/auth/admin-login — shared-passcode admin entry (break-glass).
 *
 * The recommended admin path is signing in with Google as ADMIN_EMAIL (above),
 * which needs no shared secret. This route is therefore OFF in production
 * unless ADMIN_PASSCODE_LOGIN=true, needs a strong ADMIN_SECRET_KEY, allows
 * only 5 failed attempts per 15 minutes per IP, and issues an 8-hour session.
 * The identity it grants is pinned to the server-configured ADMIN_EMAIL.
 */
router.post("/admin-login", adminLoginLimiter, async (req, res) => {
  try {
    const passcodeLoginEnabled = !isProduction || process.env.ADMIN_PASSCODE_LOGIN === "true";
    const configuredKey = process.env.ADMIN_SECRET_KEY;
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();

    if (!passcodeLoginEnabled || !configuredKey || !adminEmail) {
      return res.status(503).json({ error: "Admin passcode login is not enabled on this server." });
    }
    if (isProduction && configuredKey.length < 20) {
      console.error("[Auth] ADMIN_SECRET_KEY is shorter than 20 characters; refusing passcode login.");
      return res.status(503).json({ error: "Admin passcode login is not enabled on this server." });
    }

    const passcode = req.body && req.body.passcode;
    if (!isString(passcode, { min: 1, max: 256 })) {
      return res.status(401).json({ error: "Invalid Admin Passcode." });
    }

    // Hash both sides so the constant-time comparison is over equal-length
    // buffers and reveals nothing about the real passcode's length.
    if (!crypto.timingSafeEqual(sha256(passcode), sha256(configuredKey))) {
      console.warn("[Auth] Failed admin passcode attempt from", req.ip);
      return res.status(401).json({ error: "Invalid Admin Passcode." });
    }

    let adminUser = await User.findOne({ email: adminEmail, isGuest: { $ne: true } });
    if (!adminUser) {
      adminUser = await User.create({
        googleId: `admin_${crypto.randomUUID()}`,
        email: adminEmail,
        name: "Holy Guider Administrator",
        avatar: "https://api.iconify.design/lucide:shield-check.svg?color=%23B08D3F",
        role: "admin",
        isAdmin: true,
      });
    } else if (!isAdminUser(adminUser)) {
      adminUser = await User.findByIdAndUpdate(adminUser._id, { $set: { isAdmin: true, role: "admin" } }, { new: true });
    }

    console.warn(`[Auth] Admin passcode login succeeded from ${req.ip}`);
    return startSession(res, adminUser, {
      ttlMs: ADMIN_TTL_MS,
      extra: { message: "Admin authentication successful. Unlimited guidance access granted." },
    });
  } catch (error) {
    console.error("[Auth] Admin login error:", error);
    return res.status(500).json({ error: "Failed to process admin login" });
  }
});

/**
 * POST /api/auth/dev-login — guest / demo session.
 *
 * Off by default in production (ALLOW_GUEST_LOGIN=true to enable). Guests
 * cannot use /api/ask (a Google account is required). Even
 * when enabled there is a per-IP limit AND a global daily cap on new guest
 * accounts, so spreading requests over many IPs can't flood the database.
 */
router.post("/dev-login", guestLimiter, async (req, res) => {
  const guestLoginAllowed = !isProduction || process.env.ALLOW_GUEST_LOGIN === "true";
  if (!guestLoginAllowed) {
    return res.status(404).json({ error: "Guest sessions are not available. Please sign in to continue." });
  }

  try {
    const createdToday = await User.countDocuments({
      isGuest: true,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    if (createdToday >= GUEST_DAILY_CAP) {
      return res.status(429).json({ error: "Guest sessions are temporarily unavailable. Please sign in with Google." });
    }

    const user = await User.create({
      googleId: `guest_${crypto.randomUUID()}`,
      email: `guest.${crypto.randomUUID().slice(0, 8)}@holyguider.com`,
      name: "Guest Seeker",
      avatar: DEFAULT_AVATAR,
      role: "user",
      isAdmin: false,
      isGuest: true,
    });
    return startSession(res, user);
  } catch (error) {
    console.error("[Auth] Guest login error:", error);
    return res.status(500).json({ error: "Failed to initialize guest account" });
  }
});

/** GET /api/auth/me — who am I, according to my session . */
router.get("/me", requireUser, (req, res) => {
  res.json({ user: publicUser(req.userDoc) });
});

/** POST /api/auth/logout — clear the session cookie. */
router.post("/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

/**
 * GET /api/auth/user/:id — own profile, or any profile for a CURRENT admin
 * (privilege is re-read from the database by requireUser on every request).
 */
router.get("/user/:id", requireUser, async (req, res) => {
  try {
    if (!isObjectIdString(req.params.id)) {
      return res.status(400).json({ error: "Invalid user id." });
    }
    if (req.user.id !== req.params.id && !req.user.isAdmin) {
      return res.status(403).json({ error: "You can only view your own profile." });
    }
    const user = req.user.id === req.params.id ? req.userDoc : await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(publicUser(user));
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

module.exports = router;
