# AllTrack – native Android-App (Capacitor)

Dieser Ordner verpackt die vorhandene Web-App (`../index.html`) als echte
Android-App. Der Build läuft automatisch in der GitHub-Cloud – **auf dem eigenen
PC muss nichts installiert werden.**

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
- **Erinnerung:** monatliche lokale Benachrichtigung ans Ablesen
  (`@capacitor/local-notifications`, kein Server nötig).
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
