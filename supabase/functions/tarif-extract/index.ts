// Supabase Edge Function: tarif-extract (v15, AllTrack 7.4.1 – Grenzen aus der All-Home-Zentrale)
// Liest Tarif-/Vertragsdokumente, Jahres-/Schlussabrechnungen ODER Zaehler-Fotos
// (PDF/Bild, base64) per Claude-API aus und gibt die Felder als JSON zurueck.
// mode='tarif' (Default) | 'abrechnung' | 'zaehler'.
// level='basic' | 'advanced' | 'max' -> Modell wird HIER fest zugeordnet.
// Statt fileBase64 kann document_id kommen: dann laedt der Server das gespeicherte
// Dokument selbst (nur fuer Mitglieder des Haushalts).
// Nur fuer angemeldete Nutzer: ohne Nutzer-Token 401 {code:"login"}, bevor die KI laeuft.
// Jede Auswertung wird mit Tokens und Kosten in public.ai_calls protokolliert
// (lesbar nur fuer Admins des Haushalts). API-Schluessel nur hier als Secret.
// Ohne jsr-Importe: die liessen das Buendeln beim Deploy oft mit Timeout scheitern.

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

// Drei Stufen. Preise in US-Dollar je 1 Mio. Tokens (Anthropic, Stand 09/2026) –
// muessen zu AI_LEVELS in index.html passen. effort nur bei Modellen, die es kennen.
type Level = { model: string; maxTokens: number; effort?: string };
const LEVELS: Record<string, Level> = {
  basic: { model: "claude-haiku-4-5", maxTokens: 1024 },
  advanced: { model: "claude-sonnet-5-5", maxTokens: 6000, effort: "medium" },
  max: { model: "claude-opus-5-5", maxTokens: 8000, effort: "medium" },
};
// Wird ein Modell abgeschaltet (Haiku 4.5: fruehestens 15.10.2026), springt die Stufe hierauf.
const FALLBACK: Level = { model: "claude-sonnet-5-5", maxTokens: 4096, effort: "low" };
const PRICES: Record<string, [number, number]> = {
  "claude-haiku-4-5": [1, 5],
  "claude-sonnet-5-5": [2, 10],
  "claude-opus-5-5": [4, 20],
};
// Missbrauchsschutz: Dateigroesse, Aufrufe pro Person und Tag, Kosten aller Nutzer pro Tag und Monat.
// Die Grenzen stellt der Superadmin in der All-Home-Zentrale ein (public.ki_einstellungen, gemeinsam mit All-Home);
// nur wenn die Datenbank nicht antwortet, gelten diese Rueckfallwerte.
const MAX_B64 = 9_000_000;
const RUECKFALL = { limit: 60, tag: 5, monat: 50 };

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

function catName(category: string): string {
  return category === "gas" ? "Gas" : category === "wasser" ? "Wasser" : "Strom";
}

function fieldHint(category: string): string {
  if (category === "wasser") {
    return '- "wasserKanal": Preis fuer Wasser UND Abwasser/Kanal zusammen, in EURO pro Kubikmeter (EUR/m3). Falls Frisch- und Schmutzwasser getrennt ausgewiesen sind, addiere beide zu EINEM Wert. "arbeitspreis" bleibt null.';
  }
  return '- "arbeitspreis": Arbeitspreis in EURO pro Kilowattstunde (EUR/kWh). Falls der Beleg ct/kWh angibt, durch 100 teilen (z. B. 8,12 ct/kWh => 0.0812). "wasserKanal" bleibt null.';
}

function buildTarifPrompt(category: string): string {
  const cat = catName(category);
  return [
    `Du bist ein praeziser Extraktions-Assistent fuer deutsche Energie-/Wasser-Vertraege.`,
    `Das angehaengte Dokument ist ein ${cat}-Tarif bzw. Neuvertrag. Lies die Tarifkonditionen aus.`,
    ``,
    `Gib AUSSCHLIESSLICH ein JSON-Objekt zurueck (kein Markdown, keine Erklaerung davor/danach) mit genau diesen Schluesseln:`,
    `- "anbieter": Name des Energie-/Wasserversorgers (string).`,
    `- "kategorie": "strom" | "gas" | "wasser" (deine Einschaetzung anhand des Dokuments).`,
    `- "grundpreisJahr": Grundpreis pro JAHR in EURO, brutto (inkl. MwSt.). Umrechnen falls noetig: ct/Tag => *365/100; EUR/Monat => *12; ct/Monat => *12/100. (number oder null)`,
    fieldHint(category),
    `- "abschlag": monatlicher Abschlag/Abschlagszahlung in EURO. (number oder null)`,
    `- "laufzeit": Vertrags-/Mindestlaufzeit als Code: "flex" wenn monatlich kuendbar / keine Mindestlaufzeit; "12" bei 12 Monaten (1 Jahr); "24" bei 24 Monaten (2 Jahre / mehrjaehrig); sonst "".`,
    `- "kuendigungsfrist": Kuendigungsfrist als Code: "keine" (jederzeit bzw. monatlich kuendbar), "2wochen", "4wochen", "6wochen", "1monat", "3monate". Nimm den am besten passenden Code; wenn nichts angegeben ist: "". Beispiel: "Kuendigungsfrist 6 Wochen zum Laufzeitende" => "6wochen".`,
    `- "vertragsstart": Vertragsbeginn / Lieferbeginn als ISO-Datum "YYYY-MM-DD" oder null.`,
    `- "kundennummer": Kunden-/Vertragsnummer als string oder null.`,
    `- "gueltigAb": Datum, ab dem dieser Tarif/Preis gilt (Lieferbeginn oder Preisgarantie-Beginn), ISO "YYYY-MM-DD" oder null.`,
    `- "hinweise": kurzer deutscher Hinweis (1-2 Saetze) zu Annahmen, Umrechnungen oder Unsicherheiten; leer "" wenn alles eindeutig.`,
    ``,
    `Regeln:`,
    `- Alle Preise BRUTTO (inkl. MwSt.). Wenn nur Netto angegeben ist, rechne mit der ausgewiesenen MwSt. (meist 19%) auf brutto hoch und vermerke das in "hinweise".`,
    `- Zahlen als JSON-Zahlen mit Punkt als Dezimaltrennzeichen (z. B. 0.0812), KEINE Tausenderpunkte, keine Einheiten im Wert.`,
    `- Unbekannte Werte: null (bzw. "" bei laufzeit/kuendigungsfrist). Rate nicht.`,
    `- Wenn das Dokument offensichtlich eine andere Sparte ist als ${cat}, trage das trotzdem so gut wie moeglich ein und weise in "hinweise" darauf hin.`,
  ].join("\n");
}

function buildAbrechnungPrompt(category: string): string {
  const cat = catName(category);
  const unit = category === "wasser" ? "Kubikmeter (m3)" : "Kilowattstunden (kWh)";
  const preisEinheit = category === "wasser" ? "EUR pro m3 (Wasser + Abwasser/Kanal zusammen)" : "EUR pro kWh";
  return [
    `Du bist ein praeziser Pruef-Assistent fuer deutsche Energie-/Wasser-JAHRESABRECHNUNGEN und SCHLUSSRECHNUNGEN.`,
    `Das angehaengte Dokument ist die Abrechnung eines ${cat}-Vertrags. Lies alle Werte aus, die fuer eine Nachpruefung noetig sind.`,
    ``,
    `Gib AUSSCHLIESSLICH ein JSON-Objekt zurueck (kein Markdown, keine Erklaerung) mit genau diesen Schluesseln:`,
    `- "anbieter": Versorger (string oder null).`,
    `- "kategorie": "strom" | "gas" | "wasser".`,
    `- "schlussrechnung": true wenn es eine Schluss-/Endabrechnung (Vertragsende, Umzug, Anbieterwechsel) ist, sonst false.`,
    `- "zeitraumVon": erster Tag des Abrechnungszeitraums, ISO "YYYY-MM-DD" oder null.`,
    `- "zeitraumBis": letzter Tag des Abrechnungszeitraums, ISO "YYYY-MM-DD" oder null.`,
    `- "zaehlernummer": Zaehlernummer (string oder null).`,
    `- "zaehlerstandStart": Anfangszaehlerstand als Zahl oder null. "datumStart": Datum dieses Stands, ISO oder null.`,
    `- "zaehlerstandEnde": Endzaehlerstand als Zahl oder null. "datumEnde": Datum dieses Stands, ISO oder null.`,
    `- "standArtEnde": "abgelesen" | "geschaetzt" | "" (wie der Endstand ermittelt wurde, falls angegeben).`,
    `- "zaehlerwechsel": true wenn im Zeitraum ein Zaehler getauscht wurde, sonst false.`,
    `- "verbrauch": Gesamtverbrauch im Zeitraum in ${unit} als Zahl (bei Gas in kWh, NICHT in m3) oder null.`,
    `- "arbeitspreis": Arbeitspreis brutto in ${preisEinheit}. Falls ct angegeben, durch 100 teilen. Bei mehreren Preisen den zuletzt gueltigen. Zahl oder null.`,
    `- "grundpreisJahr": Grundpreis brutto in EURO pro JAHR (ct/Tag => *365/100; EUR/Monat => *12). Bei mehreren den zuletzt gueltigen. Zahl oder null.`,
    `- "preise": Liste aller Preisphasen im Zeitraum, je {"von":"YYYY-MM-DD","bis":"YYYY-MM-DD","arbeitspreis":Zahl,"grundpreisJahr":Zahl} (brutto, Einheiten wie oben). Leere Liste, wenn nicht erkennbar.`,
    `- "gesamtkosten": Gesamtkosten des Zeitraums in EURO brutto (Summe aller Kostenbestandteile inkl. Steuern/Abgaben), NICHT der Nachzahlungsbetrag. Zahl oder null.`,
    `- "summeAbschlaege": Summe der im Zeitraum gezahlten bzw. berechneten Abschlaege in EURO. Zahl oder null.`,
    `- "anzahlAbschlaege": Anzahl dieser Abschlaege als Zahl oder null.`,
    `- "ergebnisBetrag": Betrag der Rechnung (Guthaben oder Nachzahlung) in EURO als POSITIVE Zahl, oder null.`,
    `- "ergebnisArt": "nachzahlung" (Kunde zahlt nach) oder "guthaben" (Kunde bekommt Geld zurueck) oder null.`,
    `- "neuerAbschlag": neuer monatlicher Abschlag in EURO oder null. "neuerAbschlagAb": ab wann, ISO oder null.`,
    `- "rechnungsnummer": string oder null. "kundennummer": string oder null. "rechnungsdatum": ISO oder null.`,
    `- "hinweise": kurzer deutscher Hinweis zu Annahmen/Unsicherheiten (z. B. geschaetzter Endstand, Bonus, Sonderposten); "" wenn eindeutig.`,
    ``,
    `Regeln: Alle Geldbetraege BRUTTO in EURO, Punkt als Dezimaltrennzeichen, keine Einheiten/Tausenderpunkte im Wert. Zaehlerstaende exakt wie gedruckt (Tausenderpunkte weglassen). Unbekannte Werte: null, nicht raten.`,
  ].join("\n");
}

function buildZaehlerPrompt(category: string): string {
  const cat = catName(category);
  const unit = category === "strom" ? "Kilowattstunden (kWh)" : "Kubikmeter (m3)";
  return [
    `Du liest den ZAEHLERSTAND von einem Foto eines ${cat}-Zaehlers ab. Einheit ist typischerweise ${unit}.`,
    ``,
    `Gib AUSSCHLIESSLICH ein JSON-Objekt zurueck (kein Markdown, keine Erklaerung) mit genau diesen Schluesseln:`,
    `- "zaehlerstand": die abgelesene Zahl als JSON-Zahl. Nimm die grossen Hauptziffern (meist schwarz/weiss auf schwarzem Grund). Nachkomma-/Dezimalstellen (oft rot umrandet oder rot) mit Punkt anhaengen, z. B. 90366.4. Fuehrende Nullen weglassen. Wenn nicht sicher lesbar: null.`,
    `- "einheit": "kWh" oder "m3" oder "" (was am Zaehler steht).`,
    `- "hinweise": kurzer deutscher Hinweis, z. B. wenn mehrere Zaehlwerke (HT/NT, Tag/Nacht, 1.8.0/2.8.0) sichtbar sind, welches du genommen hast, oder bei Unsicherheit. Sonst "".`,
    ``,
    `Regeln:`,
    `- Bei mehreren Zaehlwerken das Bezugs-/Gesamt-Zaehlwerk nehmen (bei Strom meist 1.8.0 bzw. das oberste) und das in "hinweise" vermerken.`,
    `- Punkt als Dezimaltrennzeichen, KEINE Tausenderpunkte, keine Einheit im Wert.`,
    `- Im Zweifel lieber null als raten.`,
  ].join("\n");
}

function extractJson(text: string): Record<string, unknown> | null {
  if (!text) return null;
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t);
  } catch (_) {
    const s = t.indexOf("{");
    const e = t.lastIndexOf("}");
    if (s >= 0 && e > s) {
      try {
        return JSON.parse(t.slice(s, e + 1));
      } catch (_) {
        return null;
      }
    }
    return null;
  }
}

// Oeffentlicher Projekt-Schluessel (Kontingent, Nutzer-Abfrage). Zuerst der neue
// "publishable key", nur als Rueckfall der alte anon-Schluessel (endet Ende 2026).
function publicKey(): string | undefined {
  try {
    const all = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
    if (all) {
      const k = JSON.parse(all)["default"];
      if (typeof k === "string" && k) return k;
    }
  } catch (_) {
    // unlesbar -> Rueckfall
  }
  return Deno.env.get("SUPABASE_ANON_KEY") || undefined;
}

// Geheimer Schluessel (umgeht RLS) - nur fuer Protokoll, Mitgliedschaft und Tagesbudget.
function secretHeaders(): Record<string, string> | null {
  let k: string | undefined;
  try {
    const all = Deno.env.get("SUPABASE_SECRET_KEYS");
    if (all) k = JSON.parse(all)["default"];
  } catch (_) {
    k = undefined;
  }
  if (typeof k === "string" && k) return { apikey: k };
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return { apikey: legacy, authorization: "Bearer " + legacy };
  return null;
}

const SB_URL = Deno.env.get("SUPABASE_URL") || "";

// Zaehlt den Aufruf auf das Tageskontingent des Users an. Liefert true, wenn erlaubt.
// Fail-open bei Infrastruktur-Fehlern (z. B. RPC fehlt), fail-closed nur bei echtem Limit
// und bei gesperrten bzw. nicht freigegebenen Konten.
async function withinQuota(authHeader: string, limit: number): Promise<{ ok: boolean; limited: boolean; gesperrt?: boolean }> {
  const key = publicKey();
  if (!SB_URL || !key || !authHeader) return { ok: true, limited: false };
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/ai_usage_bump`, {
      method: "POST",
      headers: { "content-type": "application/json", "apikey": key, "authorization": authHeader },
      body: JSON.stringify({ p_max: limit }),
    });
    if (r.ok) return { ok: true, limited: false };
    const t = await r.text();
    if (/nicht freigegeben/.test(t)) return { ok: false, limited: false, gesperrt: true };
    if (/ai_quota_exceeded/.test(t)) return { ok: false, limited: true };
    console.error("ai_usage_bump non-ok (Kontingent inaktiv):", r.status, t);
    return { ok: true, limited: false };
  } catch (e) {
    console.warn("ai_usage_bump failed:", String(e));
    return { ok: true, limited: false };
  }
}

// Nutzer-Token? Der oeffentliche anon-Schluessel ist ebenfalls ein gueltig signiertes JWT
// (verify_jwt prueft nur die Signatur), traegt aber die Rolle "anon" und kein sub.
function rolleAngemeldet(authHeader: string): boolean {
  const teil = authHeader.replace(/^Bearer\s+/i, "").split(".")[1];
  if (!teil) return false;
  try {
    const p = JSON.parse(atob(teil.replace(/-/g, "+").replace(/_/g, "/")));
    return p.role === "authenticated" && typeof p.sub === "string" && p.sub.length > 0;
  } catch (_) {
    return false;
  }
}

// Wer ruft auf? (id + E-Mail aus dem Nutzer-Token)
async function whoAmI(authHeader: string): Promise<{ id: string; email: string } | null> {
  const key = publicKey();
  if (!SB_URL || !key || !authHeader) return null;
  try {
    const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: key, authorization: authHeader } });
    if (!r.ok) return null;
    const u = await r.json();
    return u && u.id ? { id: String(u.id), email: String(u.email || "") } : null;
  } catch (_) {
    return null;
  }
}

async function isMember(hh: string, uid: string, sh: Record<string, string>): Promise<boolean> {
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/household_members?select=user_id&household_id=eq.${encodeURIComponent(hh)}&user_id=eq.${encodeURIComponent(uid)}`,
      { headers: sh },
    );
    if (!r.ok) return false;
    const rows = await r.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch (_) {
    return false;
  }
}

// Grenzen und bisherige Kosten (Tag/Monat, beide Apps) in einem Aufruf
type Grenzen = { limit?: number; tag?: number; monat?: number; heute?: number; monat_kosten?: number };
async function grenzen(sh: Record<string, string>): Promise<Grenzen | null> {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/ki_grenzen`, { method: "POST", headers: { ...sh, "content-type": "application/json" }, body: "{}" });
    return r.ok ? await r.json() : null;
  } catch (_) {
    return null;
  }
}

// Abgewiesenen Aufruf ins Ereignisprotokoll der Zentrale (best effort)
async function abgewiesen(sh: Record<string, string> | null, me: { id: string; email: string }, hh: string | null, grund: string, mode: string): Promise<void> {
  if (!sh || !SB_URL) return;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/ki_abgewiesen_melden`, {
      method: "POST", headers: { ...sh, "content-type": "application/json" },
      body: JSON.stringify({ p_user: me.id, p_email: me.email, p_household: hh, p_grund: grund, p_modus: mode }),
    });
    if (!r.ok) console.error("ki_abgewiesen_melden:", r.status, await r.text());
  } catch (e) {
    console.error("ki_abgewiesen_melden:", String(e));
  }
}

async function costToday(sh: Record<string, string>): Promise<number> {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/ai_cost_today`, {
      method: "POST",
      headers: { ...sh, "content-type": "application/json" },
      body: "{}",
    });
    if (!r.ok) return 0;
    return Number(await r.json()) || 0;
  } catch (_) {
    return 0;
  }
}

async function logCall(sh: Record<string, string> | null, row: Record<string, unknown>): Promise<void> {
  if (!sh || !SB_URL) return;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/ai_calls`, {
      method: "POST",
      headers: { ...sh, "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    if (!r.ok) console.error("ai_calls insert:", r.status, await r.text());
  } catch (e) {
    console.error("ai_calls insert failed:", String(e));
  }
}

// base64 ohne Bibliothek; in Stuecken, damit fromCharCode nicht zu viele Argumente bekommt.
function toBase64(buf: Uint8Array): string {
  let s = "";
  for (let i = 0; i < buf.length; i += 0x8000) {
    s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

type Doc = { household_id: string; storage_path: string; mime_type: string | null; category: string | null };
// Gespeichertes Dokument (Metadaten in public.documents, Datei im Bucket "documents").
async function loadDoc(id: string, sh: Record<string, string>): Promise<{ doc: Doc; b64: string } | { err: string; status: number }> {
  const r = await fetch(`${SB_URL}/rest/v1/documents?select=household_id,storage_path,mime_type,category&id=eq.${encodeURIComponent(id)}`, { headers: sh });
  if (!r.ok) return { err: "Dokument nicht lesbar.", status: 500 };
  const rows = await r.json();
  if (!Array.isArray(rows) || !rows.length) return { err: "Dokument nicht gefunden.", status: 404 };
  const doc = rows[0] as Doc;
  const path = doc.storage_path.split("/").map(encodeURIComponent).join("/");
  const fr = await fetch(`${SB_URL}/storage/v1/object/documents/${path}`, { headers: sh });
  if (!fr.ok) return { err: "Datei nicht im Speicher gefunden.", status: 404 };
  const buf = new Uint8Array(await fr.arrayBuffer());
  if (buf.length > 6_700_000) return { err: "Datei ist zu gross fuer die KI-Auswertung (max. ca. 6 MB).", status: 413 };
  return { doc, b64: toBase64(buf) };
}

function costUsd(model: string, inp: number, out: number): number {
  const p = PRICES[model] || [0, 0];
  return Math.round(((inp * p[0] + out * p[1]) / 1_000_000) * 1_000_000) / 1_000_000;
}

async function callClaude(lv: Level, docBlock: unknown, prompt: string): Promise<Response> {
  const body: Record<string, unknown> = {
    model: lv.model,
    max_tokens: lv.maxTokens,
    messages: [{ role: "user", content: [docBlock, { type: "text", text: prompt }] }],
  };
  if (lv.effort) body.output_config = { effort: lv.effort };
  return await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY as string,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Nur POST." }, 405);

  // Nur angemeldete Nutzer - der anon-Schluessel steht oeffentlich in der App.
  const auth = req.headers.get("Authorization") || "";
  const me = rolleAngemeldet(auth) ? await whoAmI(auth) : null;
  if (!me) return json({ error: "Bitte anmelden.", code: "login" }, 401);

  if (!ANTHROPIC_API_KEY) {
    return json(
      {
        error:
          "Der KI-Schluessel ist noch nicht hinterlegt. Bitte ANTHROPIC_API_KEY in den Supabase Edge-Function-Secrets setzen.",
      },
      500,
    );
  }

  let payload: {
    fileBase64?: string;
    mimeType?: string;
    category?: string;
    mode?: string;
    level?: string;
    household_id?: string;
    document_id?: string;
  };
  try {
    payload = await req.json();
  } catch (_) {
    return json({ error: "Ungueltige Anfrage." }, 400);
  }

  let { fileBase64, mimeType, category } = payload;
  const docId = typeof payload.document_id === "string" && /^[0-9a-f-]{36}$/i.test(payload.document_id) ? payload.document_id : null;
  if (!fileBase64 && !docId) return json({ error: "Keine Datei empfangen." }, 400);
  if (fileBase64 && fileBase64.length > MAX_B64) return json({ error: "Datei ist zu gross fuer die KI-Auswertung (max. ca. 6 MB)." }, 413);

  const sh = secretHeaders();
  let hh: string | null = typeof payload.household_id === "string" && /^[0-9a-f-]{36}$/i.test(payload.household_id)
    ? payload.household_id
    : null;
  if (hh && (!sh || !(await isMember(hh, me.id, sh)))) hh = null;
  const modus = payload.mode === "abrechnung" ? "abrechnung" : payload.mode === "zaehler" ? "zaehler" : "tarif";
  const g = sh ? await grenzen(sh) : null;

  // Tageskontingent pro Person (Missbrauchsschutz); gesperrte Konten bekommen keine KI.
  const limit = Number(g?.limit) || RUECKFALL.limit;
  const q = await withinQuota(auth, limit);
  if (!q.ok && q.gesperrt) return json({ error: "Dein Konto ist nicht freigegeben.", code: "gesperrt" }, 403);
  if (!q.ok && q.limited) {
    await abgewiesen(sh, me, hh, "limit", modus);
    return json({ error: `Tageslimit fuer KI-Auswertungen erreicht (${limit}/Tag). Bitte morgen erneut versuchen.` }, 429);
  }

  // Tages- und Monatsbudget ueber alle Nutzer und beide Apps (Schutz vor Kostenexplosion).
  if (g) {
    if (Number(g.heute) >= Number(g.tag ?? RUECKFALL.tag)) {
      await abgewiesen(sh, me, hh, "budget", modus);
      return json({ error: "Das Tagesbudget fuer KI-Auswertungen ist erreicht. Bitte morgen erneut versuchen." }, 429);
    }
    if (Number(g.monat_kosten) >= Number(g.monat ?? RUECKFALL.monat)) {
      await abgewiesen(sh, me, hh, "budget_monat", modus);
      return json({ error: "Das Monatsbudget fuer KI-Auswertungen ist erreicht." }, 429);
    }
  } else if (sh && (await costToday(sh)) >= RUECKFALL.tag) {
    await abgewiesen(sh, me, hh, "budget", modus);
    return json({ error: "Das Tagesbudget fuer KI-Auswertungen ist erreicht. Bitte morgen erneut versuchen." }, 429);
  }

  // Gespeichertes Dokument: nur Mitglieder des Haushalts, dem das Dokument gehoert.
  if (docId) {
    if (!sh) return json({ error: "Server nicht vollstaendig eingerichtet." }, 500);
    const got = await loadDoc(docId, sh);
    if ("err" in got) return json({ error: got.err }, got.status);
    if (!(await isMember(got.doc.household_id, me.id, sh))) return json({ error: "Kein Zugriff auf dieses Dokument." }, 403);
    fileBase64 = got.b64;
    mimeType = got.doc.mime_type || "application/pdf";
    if (!category && got.doc.category) category = got.doc.category;
    hh = got.doc.household_id;
  }

  const cat = category === "gas" || category === "wasser" ? category : "strom";
  const mode = modus;
  const level = LEVELS[payload.level || ""] ? (payload.level as string) : "basic";
  let lv = LEVELS[level];
  const mt = mimeType || "application/pdf";
  const isPdf = mt === "application/pdf";

  const docBlock = isPdf
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: fileBase64 } }
    : { type: "image", source: { type: "base64", media_type: mt, data: fileBase64 } };

  const prompt = mode === "abrechnung"
    ? buildAbrechnungPrompt(cat)
    : mode === "zaehler"
    ? buildZaehlerPrompt(cat)
    : buildTarifPrompt(cat);

  const baseRow = {
    household_id: hh,
    user_id: me.id,
    user_email: me.email,
    env: "live",
    mode,
    level,
  };

  let aResp: Response;
  try {
    aResp = await callClaude(lv, docBlock, prompt);
    // Modell abgeschaltet/unbekannt -> einmal mit dem Ersatzmodell
    if (aResp.status === 404 || aResp.status === 400) {
      const peek = await aResp.clone().text();
      if (/not_found_error|model/i.test(peek) && /model/i.test(peek) && lv.model !== FALLBACK.model) {
        console.warn("Modell nicht verfuegbar, nutze Ersatz:", lv.model, peek.slice(0, 200));
        lv = FALLBACK;
        aResp = await callClaude(lv, docBlock, prompt);
      }
    }
  } catch (e) {
    return json({ error: "KI nicht erreichbar: " + String(e) }, 502);
  }

  if (!aResp.ok) {
    const detail = await aResp.text();
    let msg = "KI-Aufruf fehlgeschlagen (" + aResp.status + ").";
    if (aResp.status === 401) msg = "KI-Schluessel ungueltig (401). Bitte ANTHROPIC_API_KEY pruefen.";
    if (aResp.status === 429) msg = "KI-Limit erreicht (429). Bitte spaeter erneut versuchen.";
    if (aResp.status === 402 || /credit balance|insufficient|billing|payment required|out of credits/i.test(detail)) {
      msg = "Das KI-Guthaben ist aufgebraucht. Bitte spaeter erneut versuchen.";
      await abgewiesen(sh, me, hh, "ki_guthaben", mode);
    } else if (aResp.status === 429) await abgewiesen(sh, me, hh, "ki_limit", mode);
    await logCall(sh, { ...baseRow, model: lv.model, ok: false });
    return json({ error: msg, detail }, 502);
  }

  const data = await aResp.json();
  const u = data.usage || {};
  const inTok = (Number(u.input_tokens) || 0) + (Number(u.cache_creation_input_tokens) || 0) + (Number(u.cache_read_input_tokens) || 0);
  const outTok = Number(u.output_tokens) || 0;
  const usedModel = String(data.model || lv.model);
  const priceKey = Object.keys(PRICES).find((k) => usedModel.indexOf(k) === 0) || lv.model;
  const cost = costUsd(priceKey, inTok, outTok);
  const usage = { model: usedModel, input_tokens: inTok, output_tokens: outTok, cost_usd: cost };

  const text = (data.content || [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("\n");
  const parsed = data.stop_reason === "refusal" ? null : extractJson(text);
  await logCall(sh, { ...baseRow, model: usedModel, input_tokens: inTok, output_tokens: outTok, cost_usd: cost, ok: !!parsed });

  if (data.stop_reason === "refusal") return json({ error: "Die KI hat dieses Dokument nicht ausgewertet.", usage }, 422);
  if (!parsed) {
    const cut = data.stop_reason === "max_tokens" ? " (Antwort abgeschnitten)" : "";
    return json({ error: "Antwort konnte nicht gelesen werden" + cut + ".", raw: text, usage }, 500);
  }

  if (mode === "abrechnung") return json({ abrechnung: parsed, usage }, 200);
  if (mode === "zaehler") return json({ zaehler: parsed, usage }, 200);
  return json({ tarif: parsed, usage }, 200);
});
