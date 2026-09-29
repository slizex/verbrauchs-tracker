# Änderungen an AllTrack

Versionsnummer: **Hauptzahl** = großer Umbau · **Mitte** = neue Funktionen · **hinten** = Korrekturen.
Die aktuelle Nummer steht in der App unter *Mehr → Rechenweg, Version, Umgebung* (`APP_VERSION` in `index.html`).

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
