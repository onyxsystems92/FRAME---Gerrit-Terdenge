// Thin, bounded public boundary for the Gerrit Session Intelligence pilot.
//
// This Worker owns NO LLM provider key. It only:
//   1. validates the incoming transcript,
//   2. forwards it to the existing n8n execution (which holds the account's
//      existing OpenAI credential and does the actual structuring), using a
//      bounded header token that gates this one webhook,
//   3. relays the structured {befund, therapie, verlauf, fokus} response
//      (or an honest error) back to the browser with the right CORS headers.
//
// Secrets (Worker-side, set via `wrangler secret put`):
//   N8N_WEBHOOK_TOKEN — shared header token for the n8n webhook. NOT an
//   OpenAI key; the OpenAI credential stays entirely inside n8n.

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

const N8N_WEBHOOK_URL = "https://n8n.franklyn-busse.com/webhook/frame-gerrit-structure";

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

    if (!env.N8N_WEBHOOK_TOKEN) {
      return jsonResponse({ error: "Server misconfigured" }, 500, env);
    }

    let upstream;
    try {
      upstream = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Token": env.N8N_WEBHOOK_TOKEN,
        },
        body: JSON.stringify({ transcript }),
      });
    } catch (err) {
      return jsonResponse({ error: "Structuring service unreachable" }, 502, env);
    }

    let upstreamBody;
    try {
      upstreamBody = await upstream.json();
    } catch {
      return jsonResponse({ error: "Invalid response from structuring service" }, 502, env);
    }

    if (!upstream.ok || upstreamBody.error) {
      return jsonResponse({ error: upstreamBody.error || "Structuring failed" }, 502, env);
    }

    const toArray = (v) => (Array.isArray(v) ? v.filter((s) => typeof s === "string") : []);
    const result = {
      befund: toArray(upstreamBody.befund),
      therapie: toArray(upstreamBody.therapie),
      verlauf: toArray(upstreamBody.verlauf),
      fokus: toArray(upstreamBody.fokus),
    };

    return jsonResponse(result, 200, env);
  },
};
