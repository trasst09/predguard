// Integration pass across auth, protected pages, and the field-ops routes.
// Boots the real server as a child process and exercises HTTP behavior that is
// deterministic without a live Supabase connection: auth gating (401/403/302),
// anonymous empty-list reads, static serving, and 404s. Run with `npm test`.
//
// ponytail: no test framework — node:test + node:http only.

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");

const PORT = 4711;
const BASE = `http://127.0.0.1:${PORT}`;
let child;

function request(pathName, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `${BASE}${pathName}`,
      { method: options.method || "GET", headers: options.headers || {} },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }
    );
    req.on("error", reject);
    if (options.body) {
      req.setHeader("Content-Type", "application/json");
      req.write(options.body);
    }
    req.end();
  });
}

async function waitForReady(retries = 40) {
  for (let i = 0; i < retries; i += 1) {
    try {
      await request("/api/auth/session");
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
  throw new Error("Server did not become ready in time.");
}

before(async () => {
  child = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    env: { ...process.env, PORT: String(PORT), HOST: "127.0.0.1" },
    stdio: "ignore"
  });
  await waitForReady();
});

after(() => {
  if (child) {
    child.kill();
  }
});

test("auth: session endpoint reports unauthenticated without a cookie", async () => {
  const res = await request("/api/auth/session");
  assert.equal(res.status, 200);
  assert.equal(JSON.parse(res.body).authenticated, false);
});

test("pages: protected /safety redirects anonymous visitors", async () => {
  const res = await request("/safety");
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, "/");
});

test("pages: protected /account redirects anonymous visitors", async () => {
  const res = await request("/account");
  assert.equal(res.status, 302);
});

test("admin: admin API rejects anonymous callers", async () => {
  const res = await request("/api/admin/users");
  assert.equal(res.status, 401);
});

test("field-ops: linked accounts read is empty for anonymous callers", async () => {
  const res = await request("/api/linked-accounts");
  assert.equal(res.status, 200);
  assert.deepEqual(JSON.parse(res.body).accounts, []);
});

test("field-ops: evidence read is empty for anonymous callers", async () => {
  const res = await request("/api/evidence");
  assert.equal(res.status, 200);
  assert.deepEqual(JSON.parse(res.body).evidence, []);
});

test("field-ops: safety events read is empty for anonymous callers", async () => {
  const res = await request("/api/safety-events");
  assert.equal(res.status, 200);
  assert.deepEqual(JSON.parse(res.body).events, []);
});

test("field-ops: location shares read is empty for anonymous callers", async () => {
  const res = await request("/api/location-shares");
  assert.equal(res.status, 200);
  assert.deepEqual(JSON.parse(res.body).shares, []);
});

test("field-ops: writing a linked account requires authentication", async () => {
  const res = await request("/api/linked-accounts", {
    method: "POST",
    body: JSON.stringify({ platform: "discord", handle: "@x", consentScopes: ["message_logging"] })
  });
  assert.equal(res.status, 401);
});

test("field-ops: triggering a safety event requires authentication", async () => {
  const res = await request("/api/safety-events", {
    method: "POST",
    body: JSON.stringify({ type: "panic" })
  });
  assert.equal(res.status, 401);
});

test("field-ops: starting a location share requires authentication", async () => {
  const res = await request("/api/location-shares", {
    method: "POST",
    body: JSON.stringify({ label: "test", minutes: 30 })
  });
  assert.equal(res.status, 401);
});

test("static: stylesheet is served", async () => {
  const res = await request("/styles.css");
  assert.equal(res.status, 200);
});

test("routing: unknown API route returns 404", async () => {
  const res = await request("/api/does-not-exist");
  assert.equal(res.status, 404);
});
