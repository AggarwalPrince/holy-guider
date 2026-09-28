// Shared test harness. Call `setEnv()` semantics live in each test file:
// environment variables must be set BEFORE this module (and therefore the app)
// is first required.
const http = require("http");
const crypto = require("crypto");

const mock = require("./mock-db"); // patches the models before any route loads

// ---- stub AI --------------------------------------------------------------
const spiritualAI = require("../services/spiritualAI");
const ai = {
  impl: async (question, tradition) => ({
    religion: tradition,
    verse: { book: "Test", chapter: "1", verse_number: "1", original_script: "...", transliteration: null, hindi_translation: "...", english_translation: "Stubbed guidance.", reference: "Test 1.1" },
    context: "Stubbed context.",
    application: { reframe: "Stay calm.", action_steps: ["Breathe", "Reflect"] },
    disclaimer: "This is an AI-generated interpretation.",
    provider: "test-stub",
  }),
};
spiritualAI.generateSpiritualGuidance = (...args) => ai.impl(...args);

// ---- HTTP client with a cookie jar ---------------------------------------
function rawRequest(base, method, path, { body, headers = {}, rawBody } = {}) {
  const u = new URL(base);
  return new Promise((resolve, reject) => {
    const payload = rawBody !== undefined ? rawBody : body !== undefined ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        host: u.hostname,
        port: u.port,
        method,
        path,
        headers: {
          ...(payload !== undefined ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}),
          ...headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          let parsed = {};
          try { parsed = JSON.parse(data); } catch { parsed = { _raw: data }; }
          resolve({ status: res.statusCode, headers: res.headers, setCookie: res.headers["set-cookie"] || [], body: parsed });
        });
      }
    );
    req.on("error", reject);
    if (payload !== undefined) req.write(payload);
    req.end();
  });
}

function makeClient(base) {
  function session({ sendOrigin = true } = {}) {
    let cookie = "";
    const s = {
      get cookie() { return cookie; },
      set cookie(v) { cookie = v; },
      async request(method, path, body, headers = {}) {
        const h = { ...(cookie ? { Cookie: cookie } : {}), ...(sendOrigin && method !== "GET" ? { Origin: base } : {}), ...headers };
        const res = await rawRequest(base, method, path, { body, headers: h });
        for (const c of res.setCookie) {
          const [pair] = c.split(";");
          const [name, value] = pair.split("=");
          if (/Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(c) || value === "") cookie = cookie.split("; ").filter((x) => !x.startsWith(name + "=")).join("; ");
          else cookie = [...cookie.split("; ").filter((x) => x && !x.startsWith(name + "=")), pair].join("; ");
        }
        return res;
      },
      get: (p, h) => s.request("GET", p, undefined, h),
      post: (p, b, h) => s.request("POST", p, b ?? {}, h),
      del: (p, h) => s.request("DELETE", p, undefined, h),
    };
    return s;
  }
  return { base, session, raw: (m, p, o) => rawRequest(base, m, p, o) };
}

function fakeGoogleToken({ sub, email, name = "Test User" }) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "none" })}.${b64({ sub, email, name })}.sig`;
}

async function start() {
  const app = require("../app");
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { server, base, client: makeClient(base), close: () => new Promise((r) => server.close(r)) };
}

// ---- tiny assertion runner -----------------------------------------------
let pass = 0;
let fail = 0;
function check(label, cond, extra) {
  if (cond) {
    pass++;
    console.log(`  ✅ ${label}`);
  } else {
    fail++;
    console.log(`  ❌ ${label}${extra !== undefined ? " -- " + JSON.stringify(extra) : ""}`);
  }
}
const section = (t) => console.log(`\n== ${t} ==`);
function finish() {
  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
}

module.exports = { mock, ai, start, check, section, finish, fakeGoogleToken, rawRequest, makeClient };
