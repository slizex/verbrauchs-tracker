# 📊 AllTrack

Eine einfache, mobil- und desktoptaugliche Web-App zum Erfassen von **Strom-, Wasser- und Gas-Verbrauch** – mit Tarifverwaltung, monatlicher Differenz (Guthaben/Nachzahlung), Jahresabrechnung und Verlauf.

Die App besteht aus **einer einzigen `index.html`** (kein Build-Schritt, keine Abhängigkeiten zum Selbst-Bauen). Die Daten liegen in einer **Supabase-Datenbank** (Postgres) und sind nach Anmeldung auf allen Geräten verfügbar.

---

## Funktionen

- **Drei Bereiche:** Strom ⚡, Wasser 💧, Gas 🔥
- Aktuellen Zählerstand eingeben → sofortiges Ergebnis (Verbrauch, Kosten, Differenz)
- **Tarifverwaltung** mit taggenauer Gültigkeit; neue Tarife archivieren alte automatisch
- **Abschlag anpassen** ohne Tarifwechsel (vergangene Monate behalten ihren Abschlag)
- **Jahresabrechnung** nach je 12 Monaten, Tarif-Saldo (Guthaben/Nachzahlung)
- Gas: Umrechnung m³ → kWh (Wandelfaktor × Zustandszahl × Brennwert)
- **Zwei Designs** (Klassisch / Modern), umschaltbar
- Export/Import als CSV (Excel) und komplette JSON-Sicherung
- **Login** (E-Mail + Passwort), jeder sieht nur seine eigenen Daten

---

## Technik

- **Frontend:** eine `index.html` (Vanilla JavaScript, eingebettetes CSS)
- **Backend:** [Supabase](https://supabase.com) – Postgres-Datenbank + Auth
- **Hosting:** statisch (z. B. GitHub Pages)

Die Datenbank-Zugangsdaten in der `index.html` sind der **öffentliche** Supabase-URL und der **publishable key**. Diese dürfen öffentlich sein – der Schutz der Daten erfolgt über **Row Level Security (RLS)**: ohne gültige Anmeldung kommt man an keine Daten.

### Datenbank-Schema (Supabase)

Tabellen (je mit Spalte `category` = `strom` | `wasser` | `gas`):

| Tabelle | Zweck |
|---|---|
| `tariffs` | Tarife (Anbieter, Grundpreis/Jahr, Arbeitspreis bzw. Wasser+Kanal, Abschlag, gültig ab) |
| `readings` | Ablesungen (Datum, Zählerstand, optional Startwert/Zählerwechsel, kWh für Gas) |
| `abschlag_changes` | Abschlag-Anpassungen ohne Tarifwechsel |
| `gas_conversion` | Umrechnungskonstanten für Gas (eine Zeile pro Nutzer) |

Alle Tabellen haben RLS aktiviert; Richtlinien erlauben nur Zugriff auf eigene Zeilen (`auth.uid() = user_id`). Die Spalte `user_id` wird automatisch aus der Anmeldung gesetzt.

---

## Hosting auf GitHub Pages

1. Repository auf GitHub anlegen (öffentlich) und diesen Code hochladen.
2. **Settings → Pages → Build and deployment → Source: „Deploy from a branch"**, Branch `main`, Ordner `/ (root)`.
3. Nach kurzer Zeit ist die App unter `https://<benutzername>.github.io/<repo>/` erreichbar.

### Erste Anmeldung

Beim ersten Öffnen auf **„Neues Konto erstellen"** tippen (E-Mail + Passwort), danach immer **„Anmelden"**.

> Tipp: Damit die Anmeldung ohne E-Mail-Bestätigung sofort klappt, in Supabase unter **Authentication → Sign In / Providers → Email** die Option **„Confirm email" deaktivieren**. (Optional – mit aktivierter Bestätigung muss einmalig der Link aus der Bestätigungs-Mail angeklickt werden.)

---

## Lokale Vorschau

Die App braucht zum Laufen nur einen statischen Webserver (wegen der Anmeldung am besten über `http://localhost`, nicht direkt als Datei). Beispiel mit Python:

```bash
python -m http.server 8080
# dann http://localhost:8080 öffnen
```

---

*Daten werden ausschließlich in deiner eigenen Supabase-Datenbank gespeichert.*
