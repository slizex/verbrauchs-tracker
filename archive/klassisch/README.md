# Klassisches Design (archiviert)

Stand: AllTrack **7.1.0**, archiviert mit 7.2.0 am 29.09.2026. Es wird nicht mehr verwendet.

- `index.html.txt` ist die letzte Fassung des klassischen Designs. Die Endung `.txt` ist Absicht:
  GitHub Pages liefert die Datei nur als Text aus, sie läuft also nicht als App.
- `klassisch/` und `test/klassisch/` leiten auf die App um. Anmelde-Links behalten dabei ihre Angaben.
- Alle Funktionen stecken im Standard-Design (`index.html`). Der Tarifwechsel-Rechner kam mit 7.2.0 dazu.
  Nicht übernommen wurden App-Schutz (Fingerabdruck) und Erinnerungen per Benachrichtigung. Beides gab es
  nur in der stillgelegten Android-App (`archive/mobile/`).

Zum Wiederbeleben: Datei als `klassisch/index.html` zurückkopieren und die Designweiche aus 7.1.0
(Git-Stand `6f433f2`, Kopf-Skript und `switchToClassic` in `index.html`) zurückholen.
