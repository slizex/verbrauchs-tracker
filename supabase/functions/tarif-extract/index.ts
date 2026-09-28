// Supabase Edge Function: tarif-extract
// Liest Tarif-/Vertragsdokumente, Jahres-/Schlussabrechnungen ODER Zaehler-Fotos
// (PDF/Bild, base64) per Claude-API aus und gibt die Felder als JSON zurueck.
// mode='tarif' (Default) | 'abrechnung' | 'zaehler'.
// level='basic' (Haiku) oder 'advanced' (Sonnet, gruendlicher).
// API-Schluessel nur hier als Secret, nie im Browser.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
// Zwei Qualitaetsstufen, serverseitig fest zugeordnet (Client waehlt nur basic/advanced).
const MODEL_BASIC = "claude-haiku-4-5";
const MODEL_ADVANCED = "claude-sonnet-4-6";
// Missbrauchsschutz: max. Datei-Groesse (base64-Zeichen, ~6-7 MB Rohdatei) und Tageskontingent pro User.
const MAX_B64 = 9_000_000;
const DAILY_LIMIT = 60;

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
  return [
    `Du bist ein praeziser Pruef-Assistent fuer deutsche Energie-/Wasser-JAHRESABRECHNUNGEN (Schlussrechnungen).`,
    `Das angehaengte Dokument ist die Jahres-/Schlussabrechnung eines ${cat}-Vertrags. Lies die Abrechnungswerte aus.`,
    ``,
    `Gib AUSSCHLIESSLICH ein JSON-Objekt zurueck (kein Markdown, keine Erklaerung) mit genau diesen Schluesseln:`,
    `- "anbieter": Versorger (string oder null).`,
    `- "kategorie": "strom" | "gas" | "wasser".`,
    `- "zeitraumVon": Beginn des Abrechnungszeitraums, ISO "YYYY-MM-DD" oder null.`,
    `- "zeitraumBis": Ende des Abrechnungszeitraums, ISO "YYYY-MM-DD" oder null.`,
    `- "verbrauch": Gesamtverbrauch im Zeitraum in ${unit} als Zahl (bei Gas in kWh, NICHT in m3) oder null.`,
    `- "zaehlerstandStart": Anfangszaehlerstand als Zahl oder null.`,
    `- "zaehlerstandEnde": Endzaehlerstand als Zahl oder null.`,
    `- "gesamtkosten": Gesamtkosten des Zeitraums in EURO brutto (Summe aller Kostenbestandteile), NICHT der Nachzahlungsbetrag. Zahl oder null.`,
    `- "summeAbschlaege": Summe der im Zeitraum gezahlten Abschlaege/Vorauszahlungen in EURO. Zahl oder null.`,
    `- "ergebnisBetrag": Betrag der Schlussrechnung in EURO als POSITIVE Zahl, oder null.`,
    `- "ergebnisArt": "nachzahlung" (du musst nachzahlen) oder "guthaben" (du bekommst Geld zurueck) oder null.`,
    `- "neuerAbschlag": neuer monatlicher Abschlag ab naechster Periode in EURO. Zahl oder null.`,
    `- "rechnungsnummer": string oder null.`,
    `- "kundennummer": string oder null.`,
    `- "hinweise": kurzer deutscher Hinweis zu Annahmen/Unsicherheiten; "" wenn eindeutig.`,
    ``,
    `Regeln: Alle Geldbetraege BRUTTO in EURO, Punkt als Dezimaltrennzeichen, keine Einheiten/Tausenderpunkte im Wert. Unbekannte Werte: null, nicht raten.`,
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

// Oeffentlicher Projekt-Schluessel fuer den Kontingent-Aufruf. Zuerst der neue
// "publishable key" (SUPABASE_PUBLISHABLE_KEYS, JSON nach Namen), nur als Rueckfall
// der alte anon-Schluessel - den schaltet Supabase Ende 2026 ab. Ohne diese
// Reihenfolge wuerde das Tageskontingent dann still wegfallen (fail-open unten).
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

// Zaehlt den Aufruf auf das Tageskontingent des Users an. Liefert true, wenn erlaubt.
// Fail-open bei Infrastruktur-Fehlern (z. B. RPC fehlt), fail-closed nur bei echtem Limit.
async function withinQuota(authHeader: string): Promise<{ ok: boolean; limited: boolean }> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = publicKey();
  if (!url || !key || !authHeader) return { ok: true, limited: false };
  try {
    const r = await fetch(`${url}/rest/v1/rpc/ai_usage_bump`, {
      method: "POST",
      headers: { "content-type": "application/json", "apikey": key, "authorization": authHeader },
      body: JSON.stringify({ p_max: DAILY_LIMIT }),
    });
    if (r.ok) return { ok: true, limited: false };
    const t = await r.text();
    if (/ai_quota_exceeded/.test(t)) return { ok: false, limited: true };
    // Laut protokollieren: landet man hier, greift das Kontingent gerade NICHT.
    console.error("ai_usage_bump non-ok (Kontingent inaktiv):", r.status, t);
    return { ok: true, limited: false };
  } catch (e) {
    console.warn("ai_usage_bump failed:", String(e));
    return { ok: true, limited: false };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Nur POST." }, 405);

  if (!ANTHROPIC_API_KEY) {
    return json(
      {
        error:
          "Der KI-Schluessel ist noch nicht hinterlegt. Bitte ANTHROPIC_API_KEY in den Supabase Edge-Function-Secrets setzen.",
      },
      500,
    );
  }

  let payload: { fileBase64?: string; mimeType?: string; category?: string; mode?: string; level?: string };
  try {
    payload = await req.json();
  } catch (_) {
    return json({ error: "Ungueltige Anfrage." }, 400);
  }

  const { fileBase64, mimeType, category } = payload;
  if (!fileBase64) return json({ error: "Keine Datei empfangen." }, 400);
  if (fileBase64.length > MAX_B64) return json({ error: "Datei ist zu gross fuer die KI-Auswertung (max. ca. 6 MB)." }, 413);

  // Tageskontingent pruefen (Missbrauchsschutz).
  const q = await withinQuota(req.headers.get("Authorization") || "");
  if (!q.ok && q.limited) {
    return json({ error: `Tageslimit fuer KI-Auswertungen erreicht (${DAILY_LIMIT}/Tag). Bitte morgen erneut versuchen.` }, 429);
  }

  const cat = category === "gas" || category === "wasser" ? category : "strom";
  const mode = payload.mode === "abrechnung" ? "abrechnung" : payload.mode === "zaehler" ? "zaehler" : "tarif";
  // Client waehlt nur basic/advanced; das konkrete Modell bestimmt der Server.
  const model = payload.level === "advanced" ? MODEL_ADVANCED : MODEL_BASIC;
  const mt = mimeType || "application/pdf";
  const isPdf = mt === "application/pdf";

  const docBlock = isPdf
    ? {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: fileBase64 },
      }
    : {
        type: "image",
        source: { type: "base64", media_type: mt, data: fileBase64 },
      };

  const prompt = mode === "abrechnung"
    ? buildAbrechnungPrompt(cat)
    : mode === "zaehler"
    ? buildZaehlerPrompt(cat)
    : buildTarifPrompt(cat);

  let aResp: Response;
  try {
    aResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [
          { role: "user", content: [docBlock, { type: "text", text: prompt }] },
        ],
      }),
    });
  } catch (e) {
    return json({ error: "KI nicht erreichbar: " + String(e) }, 502);
  }

  if (!aResp.ok) {
    const detail = await aResp.text();
    let msg = "KI-Aufruf fehlgeschlagen (" + aResp.status + ").";
    if (aResp.status === 401) msg = "KI-Schluessel ungueltig (401). Bitte ANTHROPIC_API_KEY pruefen.";
    if (aResp.status === 429) msg = "KI-Limit erreicht (429). Bitte spaeter erneut versuchen.";
    return json({ error: msg, detail }, 502);
  }

  const data = await aResp.json();
  const text = (data.content || [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("\n");
  const parsed = extractJson(text);
  if (!parsed) return json({ error: "Antwort konnte nicht gelesen werden.", raw: text }, 500);

  if (mode === "abrechnung") return json({ abrechnung: parsed }, 200);
  if (mode === "zaehler") return json({ zaehler: parsed }, 200);
  return json({ tarif: parsed }, 200);
});
