// Stellt den Ordner mobile/www zusammen: kopiert die Web-App (index.html + Icons)
// aus dem Projekt-Stammverzeichnis hinein. Capacitor packt daraus die APK.
import { mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const www = join(here, 'www');

rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

// Die App laedt zur Laufzeit die Web-App direkt von GitHub Pages (server.url in
// capacitor.config.json). Damit wirkt jede Aenderung an index.html sofort, ohne dass
// eine neue APK installiert werden muss.
//   offline.html = Notfall-Seite, wenn beim allerersten Start noch nichts im Cache liegt
//                  (server.errorPath). Sie liegt als einzige Datei wirklich in der APK.
//   index.html   = wird von Capacitor beim Zusammenbauen erwartet, im Betrieb aber
//                  nicht mehr geladen. sw.js wird nicht kopiert (kommt vom Server).
const files = ['offline.html', 'index.html', 'supabase.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
for (const f of files) {
  copyFileSync(join(root, f), join(www, f));
}
console.log('www zusammengestellt:', files.join(', '));
