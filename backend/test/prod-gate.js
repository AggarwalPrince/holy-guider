// Production-mode behaviour: secure defaults must hold when NODE_ENV=production.
process.env.NODE_ENV = "production";
process.env.JWT_SECRET = "prod_gate_jwt_secret_prod_gate_jwt_secret_1234";
process.env.ADMIN_SECRET_KEY = "prod_gate_admin_secret_long_enough_1234";
process.env.ADMIN_EMAIL = "admin@holyguider.com";
process.env.GOOGLE_CLIENT_ID = "123456-abc.apps.googleusercontent.com";
delete process.env.ALLOW_GUEST_LOGIN;
delete process.env.ADMIN_PASSCODE_LOGIN;
delete process.env.RATE_LIMIT_DISABLED;

const { spawnSync } = require("child_process");
const path = require("path");
const { start, check, section, finish, fakeGoogleToken } = require("./helpers");

const backendDir = path.join(__dirname, "..");
function runNode(code, env) {
  return spawnSync(process.execPath, ["-e", code], { cwd: backendDir, env: { PATH: process.env.PATH, NODE_ENV: "production", ...env }, encoding: "utf8" });
}

async function main() {
  const { client, close } = await start();

  section("Guest and admin-passcode entry points are closed by default");
  const guest = await client.session().post("/api/auth/dev-login");
  check("dev-login is disabled in production by default -> 404", guest.status === 404, guest);
  const pass = await client.session().post("/api/auth/admin-login", { passcode: process.env.ADMIN_SECRET_KEY });
  check("admin passcode login is disabled in production by default -> 503 (use Google sign-in as ADMIN_EMAIL)", pass.status === 503, pass);
  const google = await client.session().post("/api/auth/google", { token: fakeGoogleToken({ sub: "x", email: "admin@holyguider.com" }) });
  check("a forged Google token claiming the admin email is rejected in production -> 401", google.status === 401, google);

  section("Opt-in flags work and stay locked down");
  process.env.ALLOW_GUEST_LOGIN = "true";
  const g = client.session();
  const gRes = await g.post("/api/auth/dev-login");
  const cookie = gRes.setCookie[0] || "";
  check("with ALLOW_GUEST_LOGIN=true a guest can be created", gRes.status === 200, gRes);
  check("production session cookie is Secure + HttpOnly", /; Secure/i.test(cookie) && /HttpOnly/i.test(cookie), cookie);
  const guestAsk = await g.post("/api/ask", { question: "hi", tradition: "gita" });
  check("…but a guest still cannot use the AI (Google sign-in required)", guestAsk.status === 403, guestAsk);
  delete process.env.ALLOW_GUEST_LOGIN;

  process.env.ADMIN_PASSCODE_LOGIN = "true";
  const okPass = await client.session().post("/api/auth/admin-login", { passcode: process.env.ADMIN_SECRET_KEY });
  check("with ADMIN_PASSCODE_LOGIN=true and a strong key the passcode works", okPass.status === 200, okPass);
  const saved = process.env.ADMIN_SECRET_KEY;
  process.env.ADMIN_SECRET_KEY = "short";
  const weak = await client.session().post("/api/auth/admin-login", { passcode: "short" });
  check("a weak (<20 char) ADMIN_SECRET_KEY is refused even if the flag is on -> 503", weak.status === 503, weak);
  process.env.ADMIN_SECRET_KEY = saved;
  delete process.env.ADMIN_PASSCODE_LOGIN;

  section("Behind a proxy, rate limits are per real visitor (trust proxy)");
  process.env.ADMIN_PASSCODE_LOGIN = "true";
  const hit = (ip) => client.raw("POST", "/api/auth/admin-login", { body: { passcode: "wrong" }, headers: { "X-Forwarded-For": ip } });
  const a = [];
  for (let i = 0; i < 6; i++) a.push((await hit("203.0.113.10")).status);
  const other = (await hit("203.0.113.99")).status;
  check("visitor A is locked out after 5 failures", a[4] === 401 && a[5] === 429, a);
  check("visitor B (different X-Forwarded-For) is NOT locked out by A", other === 401, other);
  delete process.env.ADMIN_PASSCODE_LOGIN;

  section("Payment endpoints are gone, headers are hardened");
  const pay = await client.raw("POST", "/api/payments/create-order", { body: { amount: 49 } });
  check("no payment endpoints exist in production -> 404", pay.status === 404, pay);
  const h = await client.raw("GET", "/api/health");
  check("HSTS is sent in production", /max-age=/.test(h.headers["strict-transport-security"] || ""), h.headers);
  check("CSP upgrades insecure requests in production", /upgrade-insecure-requests/.test(h.headers["content-security-policy"] || ""));
  check("/api/health no longer reveals the environment", h.body.environment === undefined, h.body);

  await close();

  section("Refuses to start with unsafe production configuration");
  const noSecret = runNode("require('./middleware/auth')", {});
  check("no JWT_SECRET in production -> process refuses to load auth", noSecret.status !== 0 && /JWT_SECRET must be set/.test(noSecret.stderr), noSecret.stderr.slice(0, 200));
  const shortSecret = runNode("require('./middleware/auth')", { JWT_SECRET: "tooshort" });
  check("short JWT_SECRET in production -> refused", shortSecret.status !== 0 && /too short/.test(shortSecret.stderr), shortSecret.stderr.slice(0, 200));
  const badEnv = runNode("require('./config/env').validateEnv()", { JWT_SECRET: "x".repeat(40) });
  check("validateEnv exits non-zero and names what is missing", badEnv.status === 1 && /MONGODB_URI/.test(badEnv.stderr) && !/RAZORPAY/.test(badEnv.stderr) && /GOOGLE_CLIENT_ID/.test(badEnv.stderr), badEnv.stderr);
  const goodEnv = runNode("require('./config/env').validateEnv(); console.log('ok')", {
    JWT_SECRET: "x".repeat(40), MONGODB_URI: "mongodb://x", GOOGLE_CLIENT_ID: "1-a.apps.googleusercontent.com",
  });
  check("a complete configuration (no payment keys needed) passes", goodEnv.status === 0 && /ok/.test(goodEnv.stdout), goodEnv.stderr);

  finish();
}
main().catch((e) => { console.error(e); process.exit(1); });
