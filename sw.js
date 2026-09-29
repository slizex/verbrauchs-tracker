/* AllTrack Service Worker
   Strategie: network-first (online immer aktuell), Offline-Fallback auf die App-Hülle.
   Supabase-Anfragen (Daten/Anmeldung) gehen IMMER direkt ins Netz – nie aus dem Cache.

   Dieser Service Worker läuft auch in der Android-App: die APK lädt die Web-App von
   dieser Adresse (server.url in archive/mobile/capacitor.config.json), damit Änderungen ohne
   neue Installation ankommen. Damit ist er zugleich das Offline-Netz der App – beim
   Seitenaufruf wartet er höchstens NAV_TIMEOUT auf das Netz und nimmt sonst die
   zuletzt geladene Fassung. */
var CACHE = 'vt-shell-v8'; // Version 7.2.0: klassisches Design archiviert – neuer Name räumt dessen alte Kopie aus dem Speicher
var NAV_TIMEOUT = 5000;

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      /* einzeln, damit ein fehlender Eintrag nicht alles verhindert */
      return Promise.all(['./', './index.html', './supabase.js', './fonts/nunito-latin-wght-normal.woff2', './icon.svg']
        .map(function (u) { return c.add(u).catch(function () {}); }));
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function fromCache(req) {
  return caches.match(req).then(function (m) {
    if (m) return m;
    if (req.mode !== 'navigate') return Response.error();
    /* Offline und nicht im Speicher: die App-Huelle */
    return caches.match('./index.html');
  });
}

/* Netz zuerst; bei Fehler – und beim Seitenaufruf zusätzlich nach Zeitablauf – aus dem Cache. */
function networkFirst(req, url, timeoutMs) {
  return new Promise(function (resolve) {
    var settled = false, timer = null;
    function finish(v) { if (settled) return; settled = true; if (timer) clearTimeout(timer); resolve(v); }
    fetch(req).then(function (res) {
      if (res && res.status === 200 && url.origin === location.origin) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      finish(res);
    }).catch(function () { finish(fromCache(req)); });
    if (timeoutMs) {
      timer = setTimeout(function () {
        if (settled) return;
        /* Nur übernehmen, wenn wirklich etwas im Cache liegt – sonst weiter aufs Netz warten. */
        caches.match(req).then(function (m) { if (m) finish(m); });
      }, timeoutMs);
    }
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.hostname.indexOf('supabase.co') >= 0) return; // Daten/Anmeldung nie cachen
  e.respondWith(networkFirst(req, url, req.mode === 'navigate' ? NAV_TIMEOUT : 0));
});
