// Rate limits and abuse caps, with the limiters ENABLED (smoke.js disables them).
process.env.NODE_ENV = "development";
process.env.JWT_SECRET = "limits_test_jwt_secret_limits_test_jwt_secret";
process.env.ADMIN_SECRET_KEY = "limits_test_admin_secret_long_enough";
process.env.ADMIN_EMAIL = "admin@holyguider.com";
process.env.GUEST_DAILY_CAP = "3";
delete process.env.RATE_LIMIT_DISABLED;

const { start, check, section, finish } = require("./helpers");

async function main() {
  const { client, close } = await start();

  section("Admin passcode brute-force is throttled (5 failures / 15 min / IP)");
  const attacker = client.session();
  const codes = [];
  for (let i = 0; i < 7; i++) codes.push((await attacker.post("/api/auth/admin-login", { passcode: `guess-${i}` })).status);
  check("first 5 wrong guesses -> 401", codes.slice(0, 5).every((c) => c === 401), codes);
  check("6th and 7th attempts are locked out -> 429", codes[5] === 429 && codes[6] === 429, codes);
  const rightButLocked = await attacker.post("/api/auth/admin-login", { passcode: process.env.ADMIN_SECRET_KEY });
  check("even the CORRECT passcode is refused while locked out -> 429", rightButLocked.status === 429, rightButLocked);

  section("Guest-account creation is capped globally, not just per IP");
  const cap = [];
  for (let i = 0; i < 5; i++) cap.push((await client.session().post("/api/auth/dev-login")).status);
  check("with GUEST_DAILY_CAP=3, guests 1-3 succeed and 4+ get 429", cap.slice(0, 3).every((c) => c === 200) && cap.slice(3).every((c) => c === 429), cap);

  section("Per-account AI rate limit (independent of IP)");
  const { fakeGoogleToken } = require("./helpers");
  const s = client.session();
  await s.post("/api/auth/google", { token: fakeGoogleToken({ sub: "g_limit", email: "limit@example.com" }) });
  const statuses = [];
  for (let i = 0; i < 10; i++) statuses.push((await s.post("/api/ask", { question: "hi", tradition: "hinduism" })).status);
  const limited = statuses.filter((c) => c === 429).length;
  check("after 8 requests/min the account is rate limited (429)", statuses.slice(0, 8).every((c) => c === 200) && limited === 2, statuses);

  await close();
  finish();
}
main().catch((e) => { console.error(e); process.exit(1); });
