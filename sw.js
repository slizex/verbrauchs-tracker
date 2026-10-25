/* AllTrack Service Worker
   Strategie: network-first (online immer aktuell), Offline-Fallback auf die App-Hülle.
   Supabase-Anfragen (Daten/Anmeldung) gehen IMMER direkt ins Netz – nie aus dem Cache.

   Beim Seitenaufruf wartet er höchstens NAV_TIMEOUT auf das Netz und nimmt sonst die
   zuletzt geladene Fassung.

   Die Seite selbst und .json fragt er immer beim Server nach (ETag/304): GitHub Pages erlaubt sonst
   10 Minuten Zwischenspeicher, und die Android-App zeigte nach einem Update noch die alte Fassung. */
var CACHE = 'vt-shell-v9'; // Version 7.5.0: Seite und .json immer beim Server nachfragen (Android-App)
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
      /* Nur eigene alte Hüllen löschen: All-Home teilt den Ursprung slizex.github.io und damit den Cache-Speicher. */
      return Promise.all(keys.map(function (k) { if (k.indexOf('vt-shell-') === 0 && k !== CACHE) return caches.delete(k); }));
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
    var frisch = req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname) || /\.json$/.test(url.pathname);
    fetch(frisch && url.origin === location.origin ? new Request(req, { cache: 'no-cache' }) : req).then(function (res) {
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
