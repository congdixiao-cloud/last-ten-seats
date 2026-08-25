import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the Last Ten Seats survival game", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>最后十席 · 感染区撤离<\/title>/i);
  assert.match(html, /感染区撤离/);
  assert.match(html, /全队饱食度/);
  assert.match(html, /房车修复/);
  assert.match(html, /配置下一次行动/);
  assert.match(html, />黑市<\/button>/);
  assert.match(html, />物资图鉴<\/button>/);
  assert.match(html, />人员图鉴<\/button>/);
  assert.doesNotMatch(html, /Your site is taking shape/);
});
