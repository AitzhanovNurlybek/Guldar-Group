import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

const keys = ["NEXT_PUBLIC_SITE_URL", "VERCEL_ENV", "VERCEL_PROJECT_PRODUCTION_URL"];
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
let run = 0;
afterEach(() => {
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});

async function resolve(env = {}) {
  for (const key of keys) delete process.env[key];
  Object.assign(process.env, env);
  return (await import(`../src/lib/site-url.ts?test=${run++}`)).siteUrl;
}

test("local development uses localhost", async () => {
  assert.equal(await resolve(), "http://localhost:3000");
});
test("production has a public canonical without manual env configuration", async () => {
  assert.equal(await resolve({ VERCEL_ENV: "production" }), "https://guldar-group.vercel.app");
});
test("production uses the Vercel production domain", async () => {
  assert.equal(await resolve({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "guldar.kz" }), "https://guldar.kz");
});
for (const loopback of ["http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000"]) {
  test(`production ignores an accidentally copied local origin: ${loopback}`, async () => {
    assert.equal(await resolve({ VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: loopback }), "https://guldar-group.vercel.app");
  });
}
test("explicit origin overrides hosting defaults and is trimmed", async () => {
  assert.equal(await resolve({ VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: " https://www.guldar.kz/ " }), "https://www.guldar.kz");
});
test("a preview never inherits the production domain implicitly", async () => {
  assert.equal(await resolve({ VERCEL_ENV: "preview", VERCEL_PROJECT_PRODUCTION_URL: "guldar.kz" }), "http://localhost:3000");
});
for (const invalid of ["ftp://guldar.kz", "https://user:password@guldar.kz", "https://guldar.kz/path", "https://guldar.kz?q=x", "https://guldar.kz/#x", "not a url"]) {
  test(`invalid canonical is rejected: ${invalid}`, async () => {
    await assert.rejects(resolve({ NEXT_PUBLIC_SITE_URL: invalid }));
  });
}
