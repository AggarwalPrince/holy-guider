/**
 * Builds the Express app. It does NOT connect to the database or start
 * listening — server.js does that — so the exact same app (same middleware,
 * same headers, same guards) can be exercised by the tests.
 */
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { isAllowedOrigin, allowedOrigins } = require("./config/origins");
const originGuard = require("./middleware/originGuard");
const { authLimiter, askIpLimiter, adminLimiter } = require("./middleware/rateLimits");

const app = express();
const isProduction = process.env.NODE_ENV === "production";

// ---------------------------------------------------------------------------
// Reverse proxy. On Render/Railway/Vercel/nginx the TCP peer is the proxy, and
// the real visitor is in X-Forwarded-For. Without this, req.ip is the proxy's
// address for EVERYONE, so every per-IP rate limit is shared by all visitors
// (one abuser locks out the whole site) and the limits can't tell them apart.
// The number is how many proxy hops to trust; override with TRUST_PROXY.
// ---------------------------------------------------------------------------
const trustProxyEnv = process.env.TRUST_PROXY;
if (trustProxyEnv !== undefined && trustProxyEnv !== "") {
  app.set("trust proxy", /^\d+$/.test(trustProxyEnv) ? Number(trustProxyEnv) : trustProxyEnv === "true");
} else if (isProduction) {
  app.set("trust proxy", 1);
}

if (isProduction && allowedOrigins.length === 0) {
  console.warn(
    "⚠️  [CORS] CLIENT_URL is not set. That's fine when Express serves the frontend itself (same origin), " +
      "but a frontend hosted elsewhere will be blocked until you set it."
  );
}

// ---------------------------------------------------------------------------
// CORS — only the origins we trust, and credentials (the session cookie) only
// for those. A disallowed origin simply gets no CORS headers, so the browser
// refuses to hand the response to the page.
// ---------------------------------------------------------------------------
app.use(
  cors((req, callback) => {
    const origin = req.headers.origin;
    callback(null, {
      origin: !origin || isAllowedOrigin(origin, req),
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
      maxAge: 600,
    });
  })
);

// ---------------------------------------------------------------------------
// Security headers. This process also serves the built React app, so a real
// Content-Security-Policy matters: it is the main defence that stops an
// injected script from running. Set CSP_REPORT_ONLY=true to log violations
// without blocking while you verify Google sign-in in a real browser.
// ---------------------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      reportOnly: process.env.CSP_REPORT_ONLY === "true",
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://accounts.google.com/gsi/client"],
        // React sets inline style attributes; inline *scripts* stay blocked.
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com/gsi/style"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: [
          "'self'",
          "data:",
          "https://images.unsplash.com",
          "https://api.iconify.design",
          "https://*.googleusercontent.com",
        ],
        connectSrc: ["'self'", "https://accounts.google.com/gsi/"],
        frameSrc: ["https://accounts.google.com/gsi/"],
        formAction: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
    // Google's sign-in popup needs window.opener.
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginEmbedderPolicy: false,
  })
);

// JSON bodies are capped at 100kb.
app.use(express.json({ limit: "100kb" }));

// API responses hold journals and profiles: never cache them.
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// CSRF/origin check for every state-changing API request.
app.use("/api", originGuard);

// Keep-alive for UptimeRobot / Render.
app.get("/keep-alive", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString(), uptime: process.uptime() });
});
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Core API routes
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/ask", askIpLimiter, require("./routes/ask"));
app.use("/api/guidance", askIpLimiter, require("./routes/ask")); // backward-compatible alias
app.use("/api/journal", require("./routes/journal"));
app.use("/api/admin", adminLimiter, require("./routes/admin"));

// Unknown API routes get JSON, never the SPA's index.html.
app.use("/api", (req, res) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.originalUrl.split("?")[0]}` });
});

// ---------------------------------------------------------------------------
// Frontend (single-service deployment) or a small JSON landing response.
// ---------------------------------------------------------------------------
const frontendDistPath = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res) => {
    if (req.path === "/keep-alive") return res.status(404).end();
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({ name: "Holy Guider API", status: "active", keepAlive: "/keep-alive" });
  });
  app.use((req, res) => {
    res.status(404).json({ error: "Not found." });
  });
}

// Central error handler. Details are logged server-side and never echoed.
app.use((err, req, res, next) => {
  if (err && err.type === "entity.too.large") return res.status(413).json({ error: "Request body too large." });
  if (err && err.type === "entity.parse.failed") return res.status(400).json({ error: "Malformed JSON body." });
  console.error("[ServerError]", err && err.stack ? err.stack : err);
  res.status(500).json({ error: "A cosmic disturbance occurred on the server." });
});

module.exports = app;
