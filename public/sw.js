// Service worker: offline shell for the app.
// Cache-first for immutable static assets; network-first (cache fallback) for
// navigations and the content bundle so updates arrive when online.
const CACHE = "ajedrez-v2";
const PAGES = ["/", "/sesion", "/capacidades", "/ajustes", "/creditos", "/biblioteca"];
const PRECACHE = [...PAGES, "/content/bundle.json"];

const OFFLINE_HTML = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sin conexión</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 36rem; margin: 2rem auto; padding: 0 1rem">
<h1>Sin conexión</h1>
<p>Esta lección todavía no está guardada en el dispositivo. Vuelve a abrirla cuando tengas conexión.</p>
<p><a href="/">Volver al inicio</a></p>
</body></html>`;

/** `/_next/static/...` URLs referenced by an HTML page (script src, link href). */
function staticAssets(html) {
  const urls = new Set();
  for (const m of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)) urls.add(m[1]);
  return [...urls];
}

async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(PRECACHE);
  // The pages are useless offline without their scripts and styles.
  const assets = new Set();
  for (const page of PAGES) {
    const response = await cache.match(page);
    if (response) for (const url of staticAssets(await response.text())) assets.add(url);
  }
  await cache.addAll([...assets]);
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === "navigate") {
      // A lesson never opened online: a short Spanish message, not the home page.
      if (new URL(request.url).pathname.startsWith("/aprender/")) {
        return new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
      const shell = await caches.match("/");
      if (shell) return shell;
    }
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
  } else if (url.pathname === "/content/bundle.json" || request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  }
});
