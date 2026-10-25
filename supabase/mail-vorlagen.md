# Mailvorlagen (Supabase Auth) – gemeinsam für AllTrack und All-Home

AllTrack und All-Home nutzen **ein** Supabase-Projekt und damit dieselben Mailvorlagen.
Seit AllTrack 7.5.0 und der All-Home-App gibt man bei Registrierung und *Passwort vergessen* einen **Code** ein,
weil ein Link auf dem Handy den Browser öffnet und nicht die App. Die Vorlagen enthalten deshalb Code **und** Link;
der Text nennt keine App, damit er für beide passt.

Eintragen: Supabase-Dashboard → **Authentication → Emails → Templates**.

## „Confirm signup“

Betreff:

```
Deine E-Mail-Adresse bestätigen
```

Inhalt:

```html
<h2>E-Mail-Adresse bestätigen</h2>
<p>Dein Code:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
<p>Gib den Code in der App ein (AllTrack oder All-Home) – oder öffne diesen Link:</p>
<p><a href="{{ .ConfirmationURL }}">E-Mail-Adresse bestätigen</a></p>
<p>Danach gibt der Administrator dein Konto frei.</p>
```

## „Reset Password“

Betreff:

```
Passwort zurücksetzen
```

Inhalt:

```html
<h2>Passwort zurücksetzen</h2>
<p>Dein Code:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
<p>Gib den Code in der App ein (AllTrack oder All-Home) – oder öffne diesen Link:</p>
<p><a href="{{ .ConfirmationURL }}">Neues Passwort vergeben</a></p>
<p>Du hast das nicht angefordert? Dann ignoriere diese Mail.</p>
```

## Empfohlen

**Authentication → Sign In / Providers → Email:** *Email OTP Expiration* auf `900` Sekunden (15 Minuten) statt 1 Stunde.
