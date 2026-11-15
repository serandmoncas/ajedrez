// @vitest-environment node
// Runs public/sw.js against an in-memory Cache API to check install and offline fallbacks.
import { readFileSync } from "node:fs";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const SOURCE = readFileSync(path.resolve("public/sw.js"), "utf8");
const ORIGIN = "https://ajedrez.test";

function setup(serve: (url: string) => Response | Promise<Response>) {
  const stores = new Map<string, Map<string, Response>>();
  const key = (r: Request | string) => new URL(typeof r === "string" ? r : r.url, ORIGIN).pathname;
  const open = async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const m = stores.get(name)!;
    return {
      addAll: async (urls: string[]) => {
        for (const u of urls) m.set(key(u), await serve(key(u)));
      },
      put: async (r: Request, res: Response) => void m.set(key(r), res),
      match: async (r: Request | string) => m.get(key(r))?.clone(),
    };
  };
  const caches = {
    open,
    keys: async () => [...stores.keys()],
    delete: async (n: string) => stores.delete(n),
    match: async (r: Request | string) => {
      for (const m of stores.values()) if (m.has(key(r))) return m.get(key(r))!.clone();
      return undefined;
    },
  };
  const listeners: Record<string, (e: unknown) => void> = {};
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, fn: (e: unknown) => void) => (listeners[type] = fn),
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  };
  let online = true;
  const fetchFn = async (r: Request) => {
    if (!online) throw new TypeError("Failed to fetch");
    return serve(key(r));
  };
  runInNewContext(SOURCE, { self, caches, fetch: fetchFn, Response, URL, Set });
  const install = async () => {
    let p: Promise<unknown> = Promise.resolve();
    listeners.install({ waitUntil: (x: Promise<unknown>) => (p = x) });
    await p;
  };
  const navigate = async (pathname: string) => {
    let res: Promise<Response> | undefined;
    const request = { url: ORIGIN + pathname, method: "GET", mode: "navigate" };
    listeners.fetch({ request, respondWith: (r: Promise<Response>) => (res = r) });
    return res!;
  };
  return { stores, install, navigate, goOffline: () => (online = false) };
}

const html = (body: string) =>
  new Response(`<html><head><script src="/_next/static/chunks/main.js" async=""></script>` +
    `<link rel="stylesheet" href="/_next/static/css/app.css"/></head><body>${body}</body></html>`, {
    headers: { "Content-Type": "text/html" },
  });

describe("service worker", () => {
  it("precaches the pages, the bundle and the static assets the pages reference", async () => {
    const sw = setup((url) => (url.startsWith("/_next/") || url.endsWith(".json") ? new Response("x") : html(url)));
    await sw.install();
    const cached = [...sw.stores.get("ajedrez-v2")!.keys()];
    for (const url of ["/", "/sesion", "/capacidades", "/ajustes", "/creditos", "/biblioteca", "/content/bundle.json"]) {
      expect(cached).toContain(url);
    }
    expect(cached).toContain("/_next/static/chunks/main.js");
    expect(cached).toContain("/_next/static/css/app.css");
  });

  it("offline, a lesson page never opened gets a Spanish offline message, not the home page", async () => {
    const sw = setup((url) => (url.startsWith("/_next/") || url.endsWith(".json") ? new Response("x") : html(url)));
    await sw.install();
    sw.goOffline();
    const res = await sw.navigate("/aprender/italiana");
    const text = await res.text();
    expect(text).toContain("Sin conexión");
    expect(text).not.toContain("<body>/</body>");
    expect(await (await sw.navigate("/ajustes")).text()).toContain("<body>/ajustes</body>");
  });

  it("a lesson opened online is served from the cache offline", async () => {
    const sw = setup((url) => (url.startsWith("/_next/") || url.endsWith(".json") ? new Response("x") : html(url)));
    await sw.install();
    await (await sw.navigate("/aprender/italiana")).text();
    sw.goOffline();
    expect(await (await sw.navigate("/aprender/italiana")).text()).toContain("<body>/aprender/italiana</body>");
  });
});
