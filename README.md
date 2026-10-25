# AllTrack

Web-App für **Strom, Wasser und Gas**: Zählerstände erfassen, Kosten und Abschlag im Blick,
Verträge mit Dokumenten, Jahresabrechnung prüfen – auf dem Handy und am Desktop.
Aktuelle Version und Änderungen: [CHANGELOG.md](CHANGELOG.md).

## Aufbau

| Pfad | Inhalt |
|---|---|
| `index.html` | App im Standard-Design (eine Datei, Vanilla JS, kein Build) |
| `klassisch/` | leitet nur noch auf die App um (klassisches Design archiviert) |
| `sw.js`, `manifest.webmanifest`, `icon-*` | installierbare Web-App (PWA) |
| `supabase/functions/tarif-extract/` | Edge Function für die KI-Auswertung (Claude) |
| `android-app/` | Android-App (Capacitor-Hülle, lädt die Live-Seite) – Version in `android-app/app-version.json` |
| `android-app.json` | Update-Angabe für die App (Version, Download, SHA-256); `code` 0 = noch keine App |
| `.github/workflows/android.yml` | Cloud-Bau der App: bauen, signieren, im Emulator prüfen, bei Tag `app-vX.Y.Z` veröffentlichen |
| `archive/klassisch/` | archiviertes klassisches Design (Stand 7.1.0, nur als Text) |

## Android-App

Die App ist nur die Hülle um `https://slizex.github.io/verbrauchs-tracker/` und bringt native Funktionen mit
(Sperre, Bildschirmschutz, Ablese-Erinnerung, Scanner, Teilen an AllTrack, PDF-Ansicht, Update in der App).
Neue Web-Funktionen brauchen deshalb **keine** neue APK. Neu gebaut wird nur bei Änderungen in `android-app/`:

1. `android-app/app-version.json` hochzählen (`code` +1, `name`), committen, Tag `app-vX.Y.Z` pushen.
2. Der Cloud-Bau signiert mit den Secrets `ALLTRACK_KEYSTORE_B64` / `ALLTRACK_KEYSTORE_PASSWORT` und legt das Release an.
3. Aus der Release-Meldung `url`, `sha256`, `groesse`, `code` in `android-app.json` übernehmen – dann erscheint die Update-Karte.

Der Signaturschlüssel liegt nur lokal (nie im Repo); ohne ihn lässt sich keine installierte App mehr aktualisieren.

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
