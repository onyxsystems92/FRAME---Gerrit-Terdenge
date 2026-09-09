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
6. Therapie immer als kommaseparierte Liste formatieren (ein Eintrag pro Technik/Maßnahme).`;

const RESPONSE_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "session_note",
    strict: true,
    schema: {
      type: "object",
      properties: {
        befund: { type: "string" },
        therapie: { type: "string" },
        verlauf: { type: "string" },
        fokus: { type: "string" },
      },
      required: ["befund", "therapie", "verlauf", "fokus"],
      additionalProperties: false,
    },
  },
};

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(body, status, env, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(env),
      "Content-Type": "application/json",
      ...extraHeaders,
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

    if (!env.OPENAI_API_KEY) {
      return jsonResponse({ error: "Server misconfigured" }, 500, env);
    }

    let apiResponse;
    try {
      apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          max_tokens: 1024,
          temperature: 0,
          response_format: RESPONSE_SCHEMA,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: transcript },
          ],
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

    const message = apiBody.choices && apiBody.choices[0] && apiBody.choices[0].message;
    if (!message || !message.content) {
      return jsonResponse({ error: "Empty upstream response" }, 502, env);
    }

    let structured;
    try {
      structured = JSON.parse(message.content);
    } catch {
      return jsonResponse({ error: "Could not parse structured response" }, 502, env);
    }

    const result = {
      befund: typeof structured.befund === "string" ? structured.befund : "",
      therapie: typeof structured.therapie === "string" ? structured.therapie : "",
      verlauf: typeof structured.verlauf === "string" ? structured.verlauf : "",
      fokus: typeof structured.fokus === "string" ? structured.fokus : "",
    };

    // Minimal cost observability via response headers
    const usage = apiBody.usage;
    const usageHeaders = {};
    if (usage) {
      usageHeaders["X-Usage-Prompt-Tokens"] = String(usage.prompt_tokens || 0);
      usageHeaders["X-Usage-Completion-Tokens"] = String(usage.completion_tokens || 0);
      usageHeaders["X-Usage-Total-Tokens"] = String(usage.total_tokens || 0);
      console.log(
        `[usage] model=gpt-4.1-mini prompt=${usage.prompt_tokens} completion=${usage.completion_tokens} total=${usage.total_tokens}`
      );
    }

    return jsonResponse(result, 200, env, usageHeaders);
  },
};
