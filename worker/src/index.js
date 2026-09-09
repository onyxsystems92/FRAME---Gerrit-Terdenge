const SYSTEM_PROMPT = `Du strukturierst deutschsprachige physiotherapeutische Sitzungsdiktate.

Gegeben ist ein frei gesprochenes Diktat nach einer Behandlung. Strukturiere den Text in genau diese Kategorien:

- befund: Beschwerden, Befunde, Schmerzlokalisation, Auslöser, Vorgeschichte
- therapie: Durchgeführte Behandlungen und Techniken, als kommaseparierte Liste
- verlauf: Veränderung seit letzter Sitzung, Reaktion auf die Behandlung
- fokus: Plan oder Schwerpunkt für die nächste Sitzung

Regeln:
1. Nur Information aus dem Diktat verwenden. Nichts hinzufügen oder erfinden.
2. Wenn eine Kategorie im Diktat nicht vorkommt: leeren String zurückgeben.
3. Originalwörter des Diktats beibehalten — nur zuordnen, nicht umformulieren.
4. Keine Diagnosen stellen oder medizinische Schlussfolgerungen ziehen.
5. Therapie-Begriffe exakt wie diktiert übernehmen, auch wenn sie ungewöhnlich klingen.
6. Therapie immer als kommaseparierte Liste formatieren (ein Eintrag pro Technik/Maßnahme).

Antworte ausschließlich mit einem JSON-Objekt, ohne Erklärung:
{"befund":"...","therapie":"...","verlauf":"...","fokus":"..."}`;

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(body, status, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(env),
      "Content-Type": "application/json",
    },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, env);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400, env);
    }

    const transcript = body && body.transcript;
    if (!transcript || typeof transcript !== "string" || transcript.length > 10000) {
      return jsonResponse({ error: "transcript required (string, max 10000 chars)" }, 400, env);
    }

    if (!env.ANTHROPIC_API_KEY) {
      return jsonResponse({ error: "Server misconfigured" }, 500, env);
    }

    let apiResponse;
    try {
      apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: transcript }],
        }),
      });
    } catch (err) {
      return jsonResponse({ error: "Upstream request failed" }, 502, env);
    }

    if (!apiResponse.ok) {
      return jsonResponse({ error: "Upstream error" }, 502, env);
    }

    let apiBody;
    try {
      apiBody = await apiResponse.json();
    } catch {
      return jsonResponse({ error: "Invalid upstream response" }, 502, env);
    }

    const text =
      apiBody.content &&
      apiBody.content[0] &&
      apiBody.content[0].type === "text" &&
      apiBody.content[0].text;

    if (!text) {
      return jsonResponse({ error: "Empty upstream response" }, 502, env);
    }

    let structured;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      structured = JSON.parse(jsonMatch[0]);
    } catch {
      return jsonResponse({ error: "Could not parse structured response" }, 502, env);
    }

    const result = {
      befund: typeof structured.befund === "string" ? structured.befund : "",
      therapie: typeof structured.therapie === "string" ? structured.therapie : "",
      verlauf: typeof structured.verlauf === "string" ? structured.verlauf : "",
      fokus: typeof structured.fokus === "string" ? structured.fokus : "",
    };

    return jsonResponse(result, 200, env);
  },
};
