/**
 * Fail fast on unsafe production configuration, instead of discovering it at runtime. Called from server.js only.
 */
function validateEnv() {
  if (process.env.NODE_ENV !== "production") return;

  const problems = [];
  const warnings = [];
  const missing = (k) => !process.env[k] || process.env[k].includes("placeholder");

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) problems.push("JWT_SECRET (min 32 chars)");
  if (!process.env.MONGODB_URI) problems.push("MONGODB_URI");
  if (missing("GOOGLE_CLIENT_ID") || process.env.GOOGLE_CLIENT_ID.startsWith("your-google-client-id")) {
    problems.push("GOOGLE_CLIENT_ID (Google sign-in is the only way to use the site)");
  }

  if (process.env.ADMIN_PASSCODE_LOGIN === "true" && (process.env.ADMIN_SECRET_KEY || "").length < 20) {
    problems.push("ADMIN_SECRET_KEY (min 20 chars, required because ADMIN_PASSCODE_LOGIN=true)");
  }
  if (process.env.ALLOW_GUEST_LOGIN === "true") {
    warnings.push("ALLOW_GUEST_LOGIN=true: anonymous guest accounts can be created (capped per IP and per day).");
  }
  if (!process.env.CLIENT_URL) {
    warnings.push("CLIENT_URL is not set: fine when Express serves the frontend itself; required if the frontend is on another origin.");
  }

  warnings.forEach((w) => console.warn(`⚠️  [Config] ${w}`));
  if (problems.length) {
    console.error(`[Config] FATAL: missing or invalid production settings:\n  - ${problems.join("\n  - ")}`);
    process.exit(1);
  }
}

module.exports = { validateEnv };
