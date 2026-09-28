# AllTrack

Web-App für **Strom, Wasser und Gas**: Zählerstände erfassen, Kosten und Abschlag im Blick,
Verträge mit Dokumenten, Jahresabrechnung prüfen – auf dem Handy und am Desktop.
Aktuelle Version und Änderungen: [CHANGELOG.md](CHANGELOG.md).

## Aufbau

| Pfad | Inhalt |
|---|---|
| `index.html` | App im Standard-Design (eine Datei, Vanilla JS, kein Build) |
| `klassisch/index.html` | klassisches Design als Rückfall, pro Person umschaltbar |
| `test/` | Testumgebung – Byte-Kopien, eigener Datenbereich (Schema `test`) |
| `sw.js`, `manifest.webmanifest`, `icon-*` | installierbare Web-App (PWA) |
| `supabase/functions/tarif-extract/` | Edge Function für die KI-Auswertung (Claude) |
| `archive/mobile/` | stillgelegte native Android-Hülle (Capacitor) |

Nach jeder Änderung `index.html → test/index.html`, `klassisch/index.html → test/klassisch/index.html`
und `sw.js → test/sw.js` kopieren – die Umgebung wird zur Laufzeit am Pfad erkannt.

## Technik

- **Frontend:** statische Seiten auf GitHub Pages
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions); Zugriff über Row Level Security,
  der publishable key in der Seite ist absichtlich öffentlich
- **KI:** Edge Function `tarif-extract` ruft die Claude-API auf (Schlüssel nur als Supabase-Secret),
  protokolliert Tokens und Kosten in `ai_calls` (lesbar nur für Admins des Haushalts)

## Lokale Vorschau

Statischer Webserver über `http://localhost`, z. B.:

```bash
python -m http.server 8080
```
