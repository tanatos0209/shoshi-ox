/* AI択一対策 service worker
 * - app.js（問題データ入り）・index.html・CSS・アイコンはネットワーク優先
 *   → 再読み込みで見た目と問題が更新される。オフライン時はキャッシュで動作
 */
const CACHE = "shoshi-ox-shell-v29";
const SHELL = ["./", "./index.html", "./app.js", "./styles.css", "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];
const NETWORK_FIRST = [/\/app\.js$/, /\/index\.html$/, /\/$/, /\/manifest\.webmanifest$/,
  /\/styles\.css$/, /\/icon-.*\.png$/, /\/apple-touch-icon\.png$/];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const path = url.pathname;
  if (req.mode === "navigate" || NETWORK_FIRST.some(r => r.test(path))) {
    e.respondWith(
      fetch(req, { cache: "no-store" })
        .then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./index.html")))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return res; }).catch(() => cached);
      return cached || net;
    })
  );
});
