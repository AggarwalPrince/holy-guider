const rateLimit = require("express-rate-limit");

const isProduction = process.env.NODE_ENV === "production";

// Only ever honoured outside production, so it can't be flipped on by accident.
const skip = () => !isProduction && process.env.RATE_LIMIT_DISABLED === "true";

const make = (opts) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    skip,
    ...opts,
  });

// Rate limits are keyed by client IP. Behind Render/Vercel/nginx that is only
// correct if Express trusts the proxy's X-Forwarded-For — see `trust proxy`
// in app.js; without it every visitor shares one bucket.

module.exports = {
  authLimiter: make({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: { error: "Too many attempts. Please try again later." },
  }),
  // Passcode guessing: count only FAILED attempts, and keep it tight.
  adminLoginLimiter: make({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: { error: "Too many failed admin login attempts. Try again in 15 minutes." },
  }),
  guestLimiter: make({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { error: "Too many guest sessions created from this network. Please try again later." },
  }),
  askIpLimiter: make({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: "You're asking a bit quickly — please slow down and try again shortly." },
  }),
  // Per-ACCOUNT limit (runs after requireUser). Uses express-rate-limit's own
  // store, which evicts expired entries — the previous hand-rolled Map kept an
  // entry for every user ever seen and grew without bound.
  askUserLimiter: make({
    windowMs: 60 * 1000,
    max: 8,
    keyGenerator: (req) => `u:${req.user.id}`,
    message: { error: "You're asking a bit quickly — please slow down and try again shortly." },
  }),
  adminLimiter: make({
    windowMs: 15 * 60 * 1000,
    max: 120,
    message: { error: "Too many admin requests. Please try again later." },
  }),
};
