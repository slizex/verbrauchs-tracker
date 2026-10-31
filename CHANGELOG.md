# Änderungen an AllTrack

Versionsnummer: **Hauptzahl** = großer Umbau · **Mitte** = neue Funktionen · **hinten** = Korrekturen.
Die aktuelle Nummer steht in der App unter *Mehr → Rechenweg und Version* (`APP_VERSION` in `index.html`).

## 7.6.0 – 31.10.2026

**„Bitte prüfen“ auf der Startseite**: Widersprüche in den Daten stehen jetzt ganz oben, vor „Für dich“
(bis zu drei, sonst „Alle“). Jede Karte führt mit einem Knopf direkt zur Stelle, an der man prüft oder korrigiert.
Mit dem × blendest du einen Punkt aus, wenn er so stimmt.
- **Zwei Abschläge:** Bis drei Monate nach Tarifbeginn wurde der Abschlag auf einen anderen Betrag geändert als im
  Tarif steht. Der Knopf öffnet das Abschlag-Fenster, das jetzt auch den Betrag laut Tarif zeigt.
- **Offene Punkte der letzten Jahresabrechnung:** Warnungen und Korrekturen aus dem Abrechnungsbericht
  (z. B. andere Zahl an Abschlägen, neuer Abschlag mit anderem Beginn). Der Knopf öffnet den Bericht. Ist ein Punkt
  dort korrigiert, verschwindet er auch auf der Startseite.
- Dieselben Punkte erscheinen als Zeile in der Vertragskarte.
- Abschaltbar unter *Mehr → Intelligente Vorschläge → Bitte prüfen*.

## 7.5.4 – 31.10.2026

Ergebnis eines Gesamttests mit echten Daten (alle Ansichten auf Handy, Tablet und PC, hell und dunkel, alle Rechnungen
unabhängig nachgerechnet).
- Prognose, erwarteter Zählerstand und Verbrauchs-Auffälligkeiten vergleichen nur noch mit demselben Monat der
  **letzten zwei Jahre**. Vorher zählten auch Jahre vor dem Heizungswechsel mit: Die Gas-Prognose kam so auf eine
  Nachzahlung, obwohl ein Guthaben zu erwarten ist.
- Der empfohlene Abschlag rechnet jetzt mit dem **aktuellen Tarif** und dem Verbrauch der letzten 12 Monate.
  Vorher galten noch alte, teurere Preise.
- Vertragskarte: „Saldo seit Beginn“ nennt jetzt den Monat, ab dem gerechnet wird.
- Besser lesbar im hellen Modus: Grau-, Rot-, Grün-, Orange- und Blautöne etwas dunkler (wie in All-Home).
- Kleine Text-Knöpfe („Alle“, „Bericht“, „frühere Tarife“ …) und die Schalter unter *Mehr* haben eine größere,
  unsichtbare Tippfläche.
- Lange Dokumentnamen werden umbrochen statt abgeschnitten (in den Vertragskarten bis zu drei Zeilen).
  „+50 %“ in Auffälligkeiten bricht nicht mehr zwischen Zahl und Prozentzeichen um.
- *Mehr → Rechenweg* erklärt jetzt auch Prognose und empfohlenen Abschlag. Im Abrechnungsbericht und in der Vertragskarte stehen die
  Beträge auf einer Höhe, auch wenn eine Beschriftung zwei Zeilen braucht.
- Haushalts-Eingabefelder sind für Bildschirmleser beschriftet.

## 7.5.3 – 30.10.2026

- KI-Stufe „Schnell“ nutzt jetzt Claude Haiku 5.5 statt Haiku 4.5: rund ein Zehntel der Kosten, und das Modell
  prüft vor der Antwort mit. Nimmt es ein Dokument nicht an, springt wie bisher Haiku 4.5 ein; lehnt es ab, einmal Sonnet 5.5.
- „Gründlich“ und „Maximal“: Lehnt das Modell eine Anfrage ab, rechnet Anthropic selbst mit einem Ersatzmodell weiter.
- Edge Function `tarif-extract` v16 (Plattform-Version 17).

## 7.5.2 – 30.10.2026

- Android-App: Beim Öffnen erschien jedes Mal Androids Seite „Alarme und Erinnerungen“ mit einem gesperrten Schalter.
  Die Ablese-Erinnerung braucht keinen sekundengenauen Wecker und fragt jetzt nicht mehr danach.

## 7.5.1 – 25.10.2026

- Download-Eintrag (*Mehr → Android-App*) und der Hinweis in der alten App erscheinen erst, wenn die neue App
  veröffentlicht ist – vorher führte der Link ins Leere.

## 7.5.0 – 25.10.2026

**Android-App** (neu gebaut nach dem Vorbild der All-Home-App; Ordner `android-app/`, Kennung `de.slizex.alltrack`)
- Die App lädt diese Seite live – Web-Änderungen brauchen keine neue APK. Download unter *Mehr → Android-App*.
- In der App unter *Mehr → App*: App-Sperre (Fingerabdruck, Gesicht oder Geräte-PIN, nach 5 Minuten im Hintergrund),
  Bildschirmschutz (Standard aus), Ablese-Erinnerung (Tag 1.–28. und Uhrzeit wählbar, für alle Haushalte, nur wenn Zähler fällig sind),
  App-Version und Update. Beim ersten Start fragt die App einmal nach Sperre und Erinnerung.
- Tarifdokument und Jahresabrechnung lassen sich in der App scannen (Googles Dokumentenscanner, mehrere Seiten werden ein PDF).
- AllTrack steht im Teilen-Menü von Android: Jahresabrechnung, Tarif/Vertrag, Zählerfoto oder nur ablegen – erst nach Rückfrage.
- Dokumente öffnen in der App selbst; Sicherung und Excel-Export gehen über „Speichern unter“, der PDF-Bericht über den Android-Druckdialog.
- Kurzbefehl am App-Symbol: *Zähler ablesen*. All-Home öffnet über `alltrack://` die App statt des Browsers.
- Die alte App vom Juli zeigt auf der Startseite einen Hinweis auf die neue.

**Für alle**
- Registrierung und *Passwort vergessen* arbeiten mit einem Code aus der Mail (der Link in der Mail geht weiterhin).
- Der Offline-Speicher fragt die Seite immer beim Server nach – nach einem Update erscheint sofort die neue Fassung.

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
