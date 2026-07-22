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

// sw.js wird bewusst NICHT kopiert: in der nativen App ist der Service Worker
// unnoetig und wuerde nur die localhost-Huelle zwischenspeichern.
const files = ['index.html', 'supabase.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
for (const f of files) {
  copyFileSync(join(root, f), join(www, f));
}
console.log('www zusammengestellt:', files.join(', '));
