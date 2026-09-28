process.env.NODE_ENV = "development";
process.env.JWT_SECRET = "smoke_test_jwt_secret_smoke_test_jwt_secret";
process.env.ADMIN_SECRET_KEY = "smoke_test_admin_secret_long_enough";
process.env.ADMIN_EMAIL = "admin@holyguider.com";
process.env.DAILY_ASK_LIMIT = "3";
process.env.CLIENT_URL = "https://app.holyguider.com";
process.env.RATE_LIMIT_DISABLED = "true"; // limits are covered in test/limits.js

const jwt = require("jsonwebtoken");
const { mock, ai, start, check, section, finish, fakeGoogleToken } = require("./helpers");
const User = require("../models/User");
const Journal = require("../models/Journal");
const { sanitizeGuidance } = require("../services/spiritualAI");

async function main() {
  const { client, base, close } = await start();

  // Sign in through the (dev-mode) Google path, returning a cookie session.
  let n = 0;
  async function googleUser(email = `user${++n}@example.com`) {
    const s = client.session();
    const r = await s.post("/api/auth/google", { token: fakeGoogleToken({ sub: `g_${n}_${Date.now()}`, email }) });
    return { s, user: r.body.user, res: r };
  }
  // ------------------------------------------------------------------
  section("1. Sessions live in an HttpOnly cookie, not in JS-readable storage");
  const guest = client.session();
  const g = await guest.post("/api/auth/dev-login");
  const cookieHeader = g.setCookie.find((c) => c.startsWith("hg_session=")) || "";
  check("guest login -> 200", g.status === 200, g);
  check("session cookie is HttpOnly", /HttpOnly/i.test(cookieHeader), cookieHeader);
  check("session cookie is SameSite=Lax", /SameSite=Lax/i.test(cookieHeader), cookieHeader);
  check("token is NOT returned in the JSON body by default", g.body.token === undefined, g.body);
  check("guest is flagged isGuest", g.body.user.isGuest === true);
  const me = await guest.get("/api/auth/me");
  check("cookie authenticates /api/auth/me", me.status === 200 && me.body.user.id === g.body.user.id, me);
  const tokenPayload = jwt.decode(guest.cookie.split("=")[1]);
  check("JWT carries no privilege claims (only sub/tv/iat/exp)", Object.keys(tokenPayload).sort().join() === "exp,iat,sub,tv", tokenPayload);
  const guest2 = client.session();
  const g2 = await guest2.post("/api/auth/dev-login");
  check("two guests are different accounts", g2.body.user.id !== g.body.user.id);
  await guest.post("/api/auth/logout");
  check("after logout the cookie no longer authenticates", (await guest.get("/api/auth/me")).status === 401);

  // ------------------------------------------------------------------
  section("2. /api/ask is free, needs a Google session, and identity comes from it, not the body");
  const alice = await googleUser("alice@example.com");
  const bob = await googleUser("bob@example.com");
  check("unauthenticated ask -> 401", (await client.session().post("/api/ask", { question: "hi", tradition: "gita" })).status === 401);
  const free = await alice.s.post("/api/ask", { question: "Why?", tradition: "gita", userId: bob.user.id });
  check("signed-in user asks with no payment -> 200", free.status === 200 && free.body.success === true, free);
  check("response contains no wallet/charge fields", free.body.walletBalance === undefined && free.body.deducted === undefined, free.body);
  check("entry is saved to ALICE's journal (body userId ignored)", (await Journal.find({ userId: alice.user.id })).length === 1 && (await Journal.find({ userId: bob.user.id })).length === 0);
  const guestAsk = await guest2.post("/api/ask", { question: "hi", tradition: "gita" });
  check("guest sessions cannot ask -> 403 needsSignIn", guestAsk.status === 403 && guestAsk.body.needsSignIn === true, guestAsk);
  check("user payload has no walletBalance", (await alice.s.get("/api/auth/me")).body.user.walletBalance === undefined);
  for (const gone of ["/api/payments/create-order", "/api/payments/verify", "/api/payments/webhook", "/api/coupons/redeem", "/api/admin/grant-balance"]) {
    const r = await alice.s.post(gone, {});
    check(`removed endpoint ${gone} -> 404`, r.status === 404, r);
  }

  section("3. AI failure returns a clean 503 and saves nothing");
  const carol = await googleUser("carol@example.com");
  ai.impl = async () => { throw new Error("upstream AI is down"); };
  const failedAsk = await carol.s.post("/api/ask", { question: "Will this fail?", tradition: "hinduism" });
  check("AI failure -> 503", failedAsk.status === 503, failedAsk);
  check("no journal entry is stored for a failed ask", (await Journal.find({ userId: carol.user.id })).length === 0);
  ai.impl = async (q, tradition) => ({ religion: tradition, verse: { english_translation: "ok", original_script: "ok" }, context: "c", application: { reframe: "r", action_steps: [] }, disclaimer: "d", provider: "test-stub" });

  section("4. Daily allowance per account (DAILY_ASK_LIMIT=3)");
  const dana = await googleUser("dana@example.com");
  const dRes = [];
  for (let i = 0; i < 5; i++) dRes.push((await dana.s.post("/api/ask", { question: `q${i}`, tradition: "gita" })).status);
  check("first 3 asks succeed, then 429", dRes.slice(0, 3).every((c) => c === 200) && dRes.slice(3).every((c) => c === 429), dRes);
  const other = await bob.s.post("/api/ask", { question: "still fine", tradition: "gita" });
  check("another account is unaffected by dana's limit", other.status === 200, other);

  // ------------------------------------------------------------------
  section("5. Admin privilege is checked against the DATABASE on every request");
  const adminS = client.session();
  const adminLogin = await adminS.post("/api/auth/admin-login", { passcode: process.env.ADMIN_SECRET_KEY });
  check("passcode login -> 200, admin", adminLogin.status === 200 && adminLogin.body.user.isAdmin === true, adminLogin);
    check("admin session cookie is short-lived (8h)", /Max-Age=28800/.test(adminLogin.setCookie[0]), adminLogin.setCookie[0]);
  const forgedEmail = await client.session().post("/api/auth/admin-login", { passcode: process.env.ADMIN_SECRET_KEY, email: "attacker@evil.com" });
  check("admin identity is pinned to ADMIN_EMAIL, client email ignored", forgedEmail.body.user.email === "admin@holyguider.com");
  check("wrong passcode -> 401", (await client.session().post("/api/auth/admin-login", { passcode: "nope" })).status === 401);
  check("old hardcoded passcode -> 401", (await client.session().post("/api/auth/admin-login", { passcode: "holy_guider_admin_2026" })).status === 401);
  check("non-string passcode -> 401", (await client.session().post("/api/auth/admin-login", { passcode: { $ne: 1 } })).status === 401);

  const victim = await googleUser("victim@example.com");
  await victim.s.post("/api/ask", { question: "A private worry", tradition: "hinduism" });
  check("admin can read another user's journal while admin", (await adminS.get(`/api/journal/${victim.user.id}`)).status === 200);
  check("admin can view another user's profile while admin", (await adminS.get(`/api/auth/user/${victim.user.id}`)).status === 200);
  check("admin stats -> 200", (await adminS.get("/api/admin/stats")).status === 200);
  const stats = (await adminS.get("/api/admin/stats")).body;
  check("dashboard shows a short question preview, never the full AI answer", stats.recentInquiries.every((i) => i.aiResponse === undefined && i.question === undefined && i.questionPreview.length <= 120), stats.recentInquiries[0]);

  // Revoke admin in the DB. The admin's cookie/JWT is unchanged and still valid.
  const adminId = adminLogin.body.user.id;
  await User.findByIdAndUpdate(adminId, { $set: { isAdmin: false, role: "user" } });
  check("demoted admin: journal of another user -> 403 IMMEDIATELY (not after 7 days)", (await adminS.get(`/api/journal/${victim.user.id}`)).status === 403);
  check("demoted admin: another user's profile -> 403", (await adminS.get(`/api/auth/user/${victim.user.id}`)).status === 403);
  check("demoted admin: /api/admin/stats -> 403", (await adminS.get("/api/admin/stats")).status === 403);
  check("demoted admin: /me reports isAdmin=false", (await adminS.get("/api/auth/me")).body.user.isAdmin === false);
  await User.findByIdAndUpdate(adminId, { $inc: { tokenVersion: 1 } });
  check("bumping tokenVersion ends the session outright -> 401", (await adminS.get("/api/auth/me")).status === 401);

  // ------------------------------------------------------------------
  section("9. Journal ownership");
  const vJournal = await Journal.find({ userId: victim.user.id });
  const entryId = vJournal[0]._id.toString();
  check("another user cannot read victim's journal -> 403", (await alice.s.get(`/api/journal/${victim.user.id}`)).status === 403);
  check("another user cannot delete victim's entry (404, indistinguishable from missing)", (await alice.s.del(`/api/journal/${entryId}`)).status === 404);
  check("unauthenticated read -> 401", (await client.session().get(`/api/journal/${victim.user.id}`)).status === 401);
  check("malformed ids -> 400 (not a 500 CastError)", (await alice.s.get("/api/journal/not-an-id")).status === 400 && (await alice.s.del("/api/journal/xyz")).status === 400 && (await alice.s.get("/api/auth/user/xyz")).status === 400);
  check("owner can delete their own entry", (await victim.s.del(`/api/journal/${entryId}`)).status === 200);
  check("…and it is gone", (await Journal.find({ userId: victim.user.id })).length === 0);

  // ------------------------------------------------------------------
  section("10. Input hardening");
  check("object as Google token -> 400", (await client.session().post("/api/auth/google", { token: { $ne: null } })).status === 400);
  check("array as question -> 400", (await alice.s.post("/api/ask", { question: ["a"], tradition: "gita" })).status === 400);
  check("object as tradition -> 400", (await alice.s.post("/api/ask", { question: "hi", tradition: { $ne: "" } })).status === 400);
  check("5000-char question -> 400", (await alice.s.post("/api/ask", { question: "x".repeat(5000), tradition: "gita" })).status === 400);
  const badJson = await client.raw("POST", "/api/auth/dev-login", { rawBody: "{not json", headers: { Origin: base } });
  check("malformed JSON -> 400 (not 500)", badJson.status === 400, badJson);
  const huge = await client.raw("POST", "/api/auth/dev-login", { rawBody: JSON.stringify({ a: "x".repeat(200 * 1024) }), headers: { Origin: base } });
  check("200kb body -> 413", huge.status === 413, huge.status);
  const unk = await client.raw("GET", "/api/nope");
  check("unknown API route -> JSON 404", unk.status === 404 && typeof unk.body.error === "string");
  check("removed unauthenticated /guidance route is gone", (await client.raw("POST", "/api/guidance/guidance", { body: { problem: "x", religion: "islam" }, headers: { Origin: base } })).status === 404);

  section("11. Google sign-in: dev fallback can never grant admin");
  const fakeAdmin = await googleUser("admin@holyguider.com");
  check("unverified dev token with the admin email is NOT admin", fakeAdmin.user.isAdmin === false, fakeAdmin.user);

  section("12. Browser-facing security headers, CORS and CSRF");
  const h = await client.raw("GET", "/api/health");
  check("Content-Security-Policy is set with a script-src", /script-src/.test(h.headers["content-security-policy"] || ""), h.headers["content-security-policy"]);
  check("CSP allows Google sign-in only (no payment hosts), blocks framing and plugins", !/razorpay/.test(h.headers["content-security-policy"]) && /accounts\.google\.com/.test(h.headers["content-security-policy"]) && /frame-ancestors 'none'/.test(h.headers["content-security-policy"]) && /object-src 'none'/.test(h.headers["content-security-policy"]));
  check("popups keep window.opener for Google (COOP same-origin-allow-popups)", h.headers["cross-origin-opener-policy"] === "same-origin-allow-popups");
  check("no X-Powered-By", h.headers["x-powered-by"] === undefined);
  check("API responses are Cache-Control: no-store", /no-store/.test(h.headers["cache-control"] || ""));
  check("nosniff header present", h.headers["x-content-type-options"] === "nosniff");

  const pre = await client.raw("OPTIONS", "/api/ask", { headers: { Origin: "https://evil.example", "Access-Control-Request-Method": "POST" } });
  check("CORS: an untrusted origin gets no Access-Control-Allow-Origin", !pre.headers["access-control-allow-origin"], pre.headers);
  const preOk = await client.raw("OPTIONS", "/api/ask", { headers: { Origin: "https://app.holyguider.com", "Access-Control-Request-Method": "POST" } });
  check("CORS: the configured frontend is allowed, with credentials", preOk.headers["access-control-allow-origin"] === "https://app.holyguider.com" && preOk.headers["access-control-allow-credentials"] === "true", preOk.headers);
  const csrf = await alice.s.post("/api/ask", { question: "hi", tradition: "gita" }, { Origin: "https://evil.example" });
  check("CSRF: cookie-authenticated POST from an untrusted Origin -> 403", csrf.status === 403, csrf);
  const csrfNoOrigin = client.session({ sendOrigin: false });
  csrfNoOrigin.cookie = alice.s.cookie;
  check("CSRF: cookie-authenticated POST with no Origin at all -> 403", (await csrfNoOrigin.post("/api/ask", { question: "hi", tradition: "gita" })).status === 403);
  const fromFrontend = await alice.s.post("/api/ask", { question: "hi", tradition: "gita" }, { Origin: "https://app.holyguider.com" });
  check("POST from the configured frontend origin is allowed (reaches the handler: 200)", fromFrontend.status === 200, fromFrontend);
  const csrfLogin = await client.session().post("/api/auth/dev-login", {}, { Origin: "https://evil.example" });
  check("login CSRF: sign-in POST from an untrusted Origin -> 403", csrfLogin.status === 403);

  section("13. Bearer tokens are not accepted — cookie is the only auth path");
  const api = client.session({ sendOrigin: false });
  const tokenLogin = await api.post("/api/auth/dev-login");
  const realToken = jwt.sign({ sub: tokenLogin.body.user.id, tv: 0 }, process.env.JWT_SECRET);
  api.cookie = "";
  check(
    "Bearer token is ignored with no cookie present -> 401",
    (await api.get("/api/auth/me", { Authorization: `Bearer ${realToken}` })).status === 401
  );
  const forged = jwt.sign({ sub: tokenLogin.body.user.id, tv: 0 }, "WRONG_SECRET");
  check("token signed with the wrong secret -> 401", (await api.get("/api/auth/me", { Authorization: `Bearer ${forged}` })).status === 401);
  const noneAlg = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: tokenLogin.body.user.id, tv: 0 })).toString("base64url")}.`;
  check("unsigned ('alg: none') token -> 401", (await api.get("/api/auth/me", { Authorization: `Bearer ${noneAlg}` })).status === 401);

  section("14. AI output is whitelisted before it is stored or returned");
  const dirty = sanitizeGuidance({
    success: false, walletBalance: 999999, deducted: -100, __proto__: { polluted: true }, evil: "<script>",
    verse: { english_translation: "x".repeat(10000), chapter: 2, reference: "Gita 2.47", extra: "nope" },
    application: { reframe: "r", action_steps: ["a", { obj: 1 }, "b", ...Array(20).fill("c")] },
  });
  check("unexpected top-level keys are dropped", !("success" in dirty) && !("walletBalance" in dirty) && !("evil" in dirty) && !("extra" in dirty.verse), Object.keys(dirty));
  check("strings are length-capped and numbers coerced", dirty.verse.english_translation.length === 4000 && dirty.verse.chapter === "2");
  check("action_steps: strings only, max 8", dirty.application.action_steps.length === 8 && dirty.application.action_steps.every((s) => typeof s === "string"));
  let threw = false;
  try { sanitizeGuidance({ nonsense: true }); } catch { threw = true; }
  check("a response with no usable verse is rejected (so the caller gets a clean error)", threw);

  await close();
  finish();
}

main().catch((e) => {
  console.error("Smoke test crashed:", e);
  process.exit(1);
});
