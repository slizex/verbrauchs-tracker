# AllTrack – native Android-App (Capacitor)

Dieser Ordner verpackt die vorhandene Web-App (`../index.html`) als echte
Android-App. Der Build läuft automatisch in der GitHub-Cloud – **auf dem eigenen
PC muss nichts installiert werden.**

## Die App aktualisiert sich selbst

Die APK ist nur noch die native Hülle. Ihren Inhalt lädt sie beim Start direkt von
GitHub Pages (`server.url` in `capacitor.config.json`). Dadurch gilt:

- **Jede Änderung an `../index.html` ist sofort auf dem Handy** – ohne neue APK,
  ohne Installation, ohne Zutun des Nutzers.
- Läuft die App gerade, meldet sie eine neue Fassung mit einem kleinen Balken
  („Eine neuere Version ist da – Jetzt laden"). In *Konto → Info & Umgebung* gibt es
  zusätzlich „Nach Updates suchen".
- **Ohne Netz startet die App trotzdem:** der Service Worker (`../sw.js`) hält die
  zuletzt geladene Fassung bereit. Nur beim allerersten Start ohne Internet – wenn
  also noch nichts zwischengespeichert ist – erscheint `offline.html` aus der APK.
- Alle nativen Funktionen bleiben erhalten: Capacitor spielt seine Brücke auch bei
  fern geladenen Seiten ein (`WebViewCompat.addDocumentStartJavaScript`).

**Eine neue APK ist nur nötig, wenn sich am nativen Teil etwas ändert:** Plugins,
Berechtigungen, App-Symbol, App-Name, Android-Version oder `offline.html`.
Genau darauf ist der Workflow `build-apk.yml` eingestellt – `index.html` löst
bewusst keinen Build mehr aus.

> Achtung bei künftigen Änderungen: `server.url` bestimmt auch den Speicher-Ursprung
> (Anmeldung, Einstellungen, Offline-Warteschlange liegen dort). Wird die Adresse
> geändert, müssen sich alle Nutzer einmalig neu anmelden.

## So bekommst du die APK aufs Handy

1. Auf GitHub → Reiter **Actions** → Workflow **„Android-APK bauen"** → **Run workflow**.
   (Läuft auch automatisch, sobald sich etwas in diesem `mobile/`-Ordner ändert.)
2. Nach ein paar Minuten liegt die fertige App unter **Releases** → Tag `apk-latest`
   als Datei `alltrack.apk`.
3. Diese Datei auf dem Handy herunterladen und antippen → installieren.
   (Einmalig „Installation aus unbekannten Quellen" erlauben.)

## Was steckt drin

- **Login & Dateiablage:** identisch zur Web-App (dieselbe Supabase-Datenbank).
- **Kamera:** Dokumente/Abrechnungen lassen sich beim Hochladen direkt
  abfotografieren (nativer Datei-Dialog, `@capacitor/camera` liefert die Berechtigung).
- **Teilen/Speichern:** Export (Excel/JSON) läuft über das native Teilen-Menü
  (`@capacitor/share` + `@capacitor/filesystem`).
- **Erinnerung:** frei einstellbare lokale Benachrichtigungen ans Ablesen
  (`@capacitor/local-notifications`, kein Server nötig). Die Einstellungen liegen in
  Supabase (`user_prefs.notif`) und überleben deshalb auch eine Neuinstallation.
- **Fingerabdruck-Schutz:** optional im Konto-Bereich aktivierbar
  (`capacitor-native-biometric`); sperrt nie aus – Passwort bleibt der Ausweg.

Der native Code lebt vollständig in `../index.html`, ist aber mit
`Capacitor.isNativePlatform()` abgesichert und im normalen Browser komplett inaktiv.

## Lokal bauen (optional, braucht Android-SDK + JDK 17)

```bash
cd mobile
npm install
node copy-web.mjs
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
# Ergebnis: app/build/outputs/apk/debug/app-debug.apk
```
