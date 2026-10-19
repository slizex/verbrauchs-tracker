# Änderungen an AllTrack

Versionsnummer: **Hauptzahl** = großer Umbau · **Mitte** = neue Funktionen · **hinten** = Korrekturen.
Die aktuelle Nummer steht in der App unter *Mehr → Rechenweg und Version* (`APP_VERSION` in `index.html`).

## 7.4.1 – 19.10.2026

- Gesperrte Konten: Sperrt der Administrator ein Konto (in All-Home unter *Mehr → Zentrale*), zeigt AllTrack nur noch
  „Konto gesperrt“ – keine Daten, keine KI.
- Die KI-Grenzen (Tages- und Monatsbudget, Aufrufe je Person) gelten jetzt gemeinsam mit All-Home und werden dort eingestellt;
  abgewiesene KI-Aufrufe erscheinen im Ereignisprotokoll der Zentrale (KI-Funktion `tarif-extract` v15).

## 7.4.0 – 17.10.2026

- Neue Konten brauchen eine Freigabe: Die Registrierung fragt Vor- und Nachname ab, danach wartet das Konto,
  bis der Administrator es freigibt (per Mail oder in All-Home unter *Mehr → Zentrale*). Bis dahin sieht es keine Daten.
- *Passwort vergessen*: Die Meldung sagt jetzt ehrlich, dass nur bei einem bestehenden Konto eine Mail kommt,
  und erinnert an Schreibweise und Spam-Ordner.

## 7.3.0 – 17.10.2026

- Die Testumgebung (`/test/` mit eigenem Datenbereich) ist entfernt. AllTrack hat nur noch die Live-Fassung mit deinen echten Daten;
  der Umschalter unter *Mehr → Rechenweg und Version* entfällt.

## 7.2.2 – 17.10.2026

- Offline-Speicher: Ein Update räumt nur noch die eigenen alten Kopien von AllTrack weg.
  Bisher löschte es auch die Offline-Kopie von All-Home, das unter derselben Adresse slizex.github.io läuft.

## 7.2.1 – 10.10.2026

- Große Knöpfe (z. B. *Speichern & weiter*, *Anmelden*, *Analyse starten*) sind wieder rund statt fast eckig.
  Ursache: Die Legende im Verlaufsdiagramm nutzte denselben Klassennamen wie die Knopfgröße; sie heißt jetzt anders, ihr Aussehen bleibt gleich.

## 7.2.0 – 29.09.2026

**Klassisches Design archiviert**
- Das klassische Design wird nicht mehr verwendet. Der Umschalter unter *Mehr* und die automatische Designweiche sind entfernt.
- `/klassisch/` und `/test/klassisch/` leiten auf die App um; Passwort-Reset-Links funktionieren dabei weiter.
- Die letzte Fassung (Stand 7.1.0) liegt als reine Textdatei unter `archive/klassisch/` und läuft nicht mehr als App.
- Offline-Speicher: neuer Cache-Name, damit Geräte die alte klassische Kopie verwerfen.

**Neu im Standard-Design**
- *Lohnt sich ein Wechsel?* (Verträge → ⋯): laufender Tarif gegen ein Angebot, hochgerechnet auf den geschätzten Jahresverbrauch.
  Bisher gab es den Rechner nur im klassischen Design.

**Korrekturen**
- Jahresabrechnung: Ein negativ eingetragenes Ergebnis (z. B. −50) gilt jetzt als Nachzahlung statt als Guthaben.

## 7.1.0 – 29.09.2026

**Jahresabrechnungen**
- Eigene Seite *Jahresabrechnung* (aus Verträgen, dem Dokumenten-Archiv, der Startseite und dem klassischen Design):
  Beleg hochladen oder vorhandenes PDF wählen → Modell wählen → Bericht.
- Modellwahl nur Gründlich · Claude Sonnet 5.5 (≈ 6 ct) und Maximal · Claude Opus 5.5 (≈ 12 ct); die letzte Wahl ist pro Person vorausgewählt.
- Bericht: Beleg und App im Vergleich (Verbrauch, Kosten, Abschläge, Ergebnis), Abweichungen ab 5 % oder 10 €,
  Ursachen mit Korrektur-Knöpfen (Endstand, Arbeits-/Grundpreis, Abschläge, neuer Abschlag), Monatsaufstellung, Hinweise der KI.
- Werte laut Beleg lassen sich vor dem Übernehmen korrigieren; übernehmen und löschen dürfen alle Mitglieder.

**Offener Saldo**
- Der Saldo startet nach einer übernommenen Jahresabrechnung neu (Stichtag: Ende des Abrechnungszeitraums).
- Er läuft pro Anbieter: Preisänderungen beim selben Anbieter laufen weiter, ein Anbieterwechsel beginnt neu.
- Startseite, Verträge, Verlauf, PDF-Bericht und klassisches Design zeigen denselben Wert.
- Verlauf: echte Abrechnungen als eigener Block, berechnete Jahre heißen „Jahressumme (berechnet)“.
- Vorschlag „Jahresabrechnung da?“, sobald 12 oder mehr Monate offen sind.

**Kleinigkeiten**
- Dateien, die nur nach einer Kennung benannt sind, heißen in der Liste jetzt nach Art und Datum (z. B. „Abrechnung 01.03.2026.pdf“).
- Klassisches Design: alte Abrechnungsprüfung entfernt, der Knopf führt zur neuen Seite und wieder zurück.

## 7.0.1 – 29.09.2026

- Ablesen: Das Schließen-Kreuz im Ablese-Formular löste zusätzlich ein Absenden aus (Konsolenfehler, im ungünstigen Fall halber Speichervorgang). Behoben.

## 7.0.0 – 28.09.2026

**Neues Design ist Standard**
- Aufbau nach Aufgaben: Start · Verlauf · Ablesen · Verträge · Mehr; warme Farben, Schrift Nunito (selbst ausgeliefert).
- Das klassische Design bleibt unter `/klassisch/` erreichbar und lässt sich pro Person zurückholen:
  *Mehr → Klassisches Design*; zurück im klassischen Design über *Konto → Neues Design*.
- Alte Adressen (`/neu/`, `/v1/`) leiten automatisch auf die App um.

**Intelligente Vorschläge** (pro Person schaltbar, *Mehr → Intelligente Vorschläge*)
- Ablesen (erwarteter Stand, Ampel), Geld (Abschlag, Prognose), Verträge (Fristen, Preisänderungen),
  Auffälligkeiten (ungewöhnlicher Verbrauch, geschätzte Monate), Datensicherung (Kopie aufs Gerät alle 90 Tage).

**KI**
- Drei Modelle zur Wahl, mit erwarteten Kosten pro Foto: Schnell · Claude Haiku 4.5 (≈ 0,2 ct),
  Gründlich · Claude Sonnet 5.5 (≈ 0,8 ct, Standard), Maximal · Claude Opus 5.5 (≈ 1,6 ct).
- Admins sehen unter *Mehr → KI-Kosten*, wer wann mit welchem Modell welche Kosten verursacht hat.
- Schutz: 60 Auswertungen pro Person und Tag, 5 US-$ pro Tag für alle zusammen.
- Verständliche Fehlermeldungen (z. B. Tageslimit) statt technischer Texte.

**Darstellung**
- Desktop: einheitliche Breite und Kante auf allen Seiten, festes Abstandsraster, größere Schrift,
  Verlauf mit mitlaufendem Diagramm, Jahresvergleich luftiger (auch auf dem Handy ohne Querscrollen),
  Mehr zweispaltig, Verträge auf breiten Bildschirmen dreispaltig.
- Neue App-Symbole (Haus mit Balken), auch als Android-„maskable“-Symbol.

**Korrekturen**
- Abrechnungsprüfung zählt alle 12 Monate (auch im klassischen Design).
- Neuer Haushalt: Zähler ohne ersten Stand gelten als fällig („Startwert eintragen“).
- Klassisches Design lädt keine Google-Schriften mehr.

## Bis 6.x

Stand vor Einführung der Versionsnummern – siehe Git-Verlauf.
