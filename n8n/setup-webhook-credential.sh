#!/usr/bin/env bash
# Run this ON franklyn-runtime-prod (or via: ssh franklyn-runtime-prod 'bash -s' < setup-webhook-credential.sh).
#
# SELF-CONTAINED: this script embeds the full workflow definition inline
# (heredoc below) instead of reading a separate file. An earlier version
# resolved the workflow JSON via `dirname "$0"`, which breaks under
# `ssh ... 'bash -s' < script` (stdin piping sets $0 to the shell name, not
# a real path, so dirname resolved to the remote's cwd, not this repo).
# That external-file dependency is the reason a prior run got partway
# through (credential import) and then failed on workflow import. Fixed by
# removing the dependency entirely -- everything this script needs travels
# with it in one piece.
#
# The canonical copy of the workflow definition lives in
# n8n/frame-gerrit-structure-workflow.json in this repo for review/diffing;
# keep the embedded copy below in sync with it.
#
# SAFETY
#   - Does NOT read, export, copy, replace or mutate the existing
#     "ONYX • OpenAI" credential (id xEy4jRC43l5LYHQt). The workflow only
#     references that id as a read-only pointer.
#   - Touches exactly two entities, both pinned to fixed ids so re-running
#     this script reconciles to the SAME rows instead of creating duplicates:
#       credential 69a9cfd9-bd78-4b87-956a-34f6364e210c  "FRAME Gerrit Webhook Auth"
#       workflow   ef678095-a3ae-420e-89d6-baeb85d3357a  "FRAME · Gerrit · Structure Session Note"
#     Re-importing the workflow also rebinds its webhook node's credential
#     reference back to this pinned credential id, which reconciles away
#     any drift from a credential created out-of-band (e.g. via the n8n
#     Web UI) with a different id -- that old credential is simply left
#     unreferenced afterward, not deleted (see ROLLBACK).
#   - Does not touch any other workflow or credential.
#   - Does not restart n8n. If the smoke test below shows the route isn't
#     live, it tells you the exact command and why -- it does not run it.
#
# RE-RUN BEHAVIOR
#   Safe to re-run. Generates a FRESH random token every time. If you
#   re-run this after already setting the Cloudflare secret, re-run
#   `wrangler secret put N8N_WEBHOOK_TOKEN` with the newly printed value
#   too, or the Worker -> n8n leg will start failing auth.
#
# ROLLBACK
#   This n8n version's CLI has no delete:workflow / delete:credentials
#   command. To fully undo, remove both via the n8n Web UI
#   (https://n8n.franklyn-busse.com/):
#     - Workflow  "FRAME · Gerrit · Structure Session Note"
#     - Credential "FRAME Gerrit Webhook Auth" (there may be more than one
#       row with this name from earlier troubleshooting -- only the one
#       with id 69a9cfd9-bd78-4b87-956a-34f6364e210c is referenced by the
#       live workflow after this script runs; any other same-named row is
#       inert leftover, safe to delete or ignore).
#   Until rollback, simply not setting the Cloudflare secret leaves the
#   pilot's AI path harmlessly returning "Server misconfigured" -- the
#   deterministic fallback and fail-honest UI still work.

set -euo pipefail

CRED_ID="69a9cfd9-bd78-4b87-956a-34f6364e210c"
WORKFLOW_ID="ef678095-a3ae-420e-89d6-baeb85d3357a"
TOKEN="$(openssl rand -hex 32)"

TMP_CRED="$(mktemp)"
TMP_WF="$(mktemp)"
cleanup() { rm -f "$TMP_CRED" "$TMP_WF"; }
trap cleanup EXIT

cat > "$TMP_CRED" <<EOF
[
  {
    "id": "${CRED_ID}",
    "name": "FRAME Gerrit Webhook Auth",
    "type": "httpHeaderAuth",
    "data": { "name": "X-Webhook-Token", "value": "${TOKEN}" }
  }
]
EOF

# Quoted heredoc delimiter ('WFEOF') -- disables shell expansion entirely,
# required because the embedded Code-node JS contains ${...} template
# literals that must stay literal, not be expanded by bash.
cat > "$TMP_WF" <<'WFEOF'
{
  "id": "ef678095-a3ae-420e-89d6-baeb85d3357a",
  "name": "FRAME · Gerrit · Structure Session Note",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "frame-gerrit-structure",
        "authentication": "headerAuth",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "b1000000-0000-4000-8000-000000000001",
      "name": "Webhook (bounded, header-auth)",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [180, 400],
      "credentials": {
        "httpHeaderAuth": {
          "id": "69a9cfd9-bd78-4b87-956a-34f6364e210c",
          "name": "FRAME Gerrit Webhook Auth"
        }
      },
      "webhookId": "frame-gerrit-structure"
    },
    {
      "parameters": {
        "jsCode": "const SYSTEM_PROMPT = `Du strukturierst deutschsprachige physiotherapeutische Sitzungsdiktate.\n\nGegeben ist ein frei gesprochenes Diktat nach einer Behandlung, ohne Labels oder feste Reihenfolge. Extrahiere ausschliesslich Information, die explizit im Diktat genannt wird, in vier Kategorien:\n\n- befund: Beschwerde, Befund oder Beobachtung, die explizit genannt wird (z. B. Schmerzlokalisation, Ausloeser, Vorgeschichte)\n- therapie: durchgefuehrte Behandlung(en)/Intervention(en), die explizit genannt werden -- jede einzelne Massnahme als eigener Listeneintrag\n- verlauf: Veraenderung, Reaktion oder Entwicklung seit der letzten Sitzung, die explizit genannt wird\n- fokus: Plan oder Schwerpunkt fuer die naechste Sitzung, NUR wenn explizit genannt\n\nRegeln:\n1. Nur Information verwenden, die explizit im Diktat steht. Nichts hinzufuegen, nichts erfinden.\n2. Keine Diagnosen stellen, keine medizinischen Schlussfolgerungen ziehen, die nicht genannt wurden.\n3. Ursache, Dauer, Verbesserung, naechste Schritte NICHT ergaenzen, wenn nicht genannt.\n4. Wenn eine Kategorie nicht vorkommt: leeres Array zurueckgeben.\n5. Bei materieller Unklarheit: die Unsicherheit beibehalten statt zu raten -- Originalformulierung uebernehmen statt zu interpretieren.\n6. Originalformulierung so weit wie moeglich beibehalten -- nur zuordnen und strukturieren, nicht umformulieren oder ausschmuecken.\n7. Standard-Fachkuerzel (HWS, BWS, LWS) duerfen im Originaltext erhalten bleiben, wenn Gerrit sie so sagt.\n8. Gerrit muss KEINE Labels wie 'Befund:' oder 'Therapie:' sagen -- die Zuordnung erfolgt ausschliesslich anhand der inhaltlichen Bedeutung.\n\nAntworte ausschliesslich mit einem JSON-Objekt, exakt im vorgegebenen Schema.`;\n\nconst SCHEMA = {\n  type: \"object\",\n  properties: {\n    befund: { type: \"array\", items: { type: \"string\" } },\n    therapie: { type: \"array\", items: { type: \"string\" } },\n    verlauf: { type: \"array\", items: { type: \"string\" } },\n    fokus: { type: \"array\", items: { type: \"string\" } }\n  },\n  required: [\"befund\", \"therapie\", \"verlauf\", \"fokus\"],\n  additionalProperties: false\n};\n\nconst body = $input.first().json.body || {};\nconst transcript = typeof body.transcript === \"string\" ? body.transcript.trim() : \"\";\n\nif (!transcript) {\n  return [{ json: { ok: false, error: \"transcript required\", statusCode: 400 } }];\n}\nif (transcript.length > 10000) {\n  return [{ json: { ok: false, error: \"transcript too long\", statusCode: 400 } }];\n}\n\n// PILOT: smallest-effort correct default -- reuses the exact model+endpoint\n// already proven live for this OpenAI credential (HI product), so the FIRST\n// natural-dictation proof is not also a model-compatibility gamble. This is a\n// single field: swap to a cheaper sibling once correctness is proven and cost\n// data (see usage logging downstream) shows it is worth optimizing.\nconst MODEL = \"gpt-5.5-2026-04-23\";\n\nconst openai_request_body = {\n  model: MODEL,\n  input: [\n    { role: \"system\", content: [{ type: \"input_text\", text: SYSTEM_PROMPT }] },\n    { role: \"user\", content: [{ type: \"input_text\", text: transcript }] }\n  ],\n  text: { format: { type: \"json_schema\", name: \"session_note\", strict: true, schema: SCHEMA } }\n};\n\nreturn [{ json: { ok: true, openai_request_body } }];"
      },
      "id": "b1000000-0000-4000-8000-000000000002",
      "name": "Build Request (bounded, no-invention prompt)",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [420, 400]
    },
    {
      "parameters": {
        "conditions": {
          "options": { "caseSensitive": true, "leftValue": "", "typeValidation": "loose" },
          "conditions": [
            {
              "id": "c1",
              "leftValue": "={{ $json.ok }}",
              "rightValue": true,
              "operator": { "type": "boolean", "operation": "true", "singleValue": true }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "b1000000-0000-4000-8000-000000000003",
      "name": "Input valid?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [660, 400]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.openai.com/v1/responses",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "openAiApi",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify($json.openai_request_body) }}",
        "options": { "timeout": 30000 },
        "onError": "continueRegularOutput"
      },
      "id": "b1000000-0000-4000-8000-000000000004",
      "name": "Call OpenAI (existing ONYX credential)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [900, 300],
      "credentials": {
        "openAiApi": { "id": "xEy4jRC43l5LYHQt", "name": "ONYX • OpenAI" }
      },
      "notes": "Reuses the existing production OpenAI credential (ONYX • OpenAI). No new credential, no key extraction. Pure semantic structuring — no order/patient/customer state read or written here."
    },
    {
      "parameters": {
        "jsCode": "const json = $input.first().json;\n\nif (json.error) {\n  return [{ json: { ok: false, error: \"Upstream OpenAI request failed\", statusCode: 502 } }];\n}\n\ntry {\n  const messageItem = Array.isArray(json.output) ? json.output.find((o) => o.type === \"message\") : null;\n  const textContent = messageItem && messageItem.content && messageItem.content.find((c) => c.text !== undefined);\n  if (!textContent) {\n    return [{ json: { ok: false, error: \"No structured output in OpenAI response\", statusCode: 502 } }];\n  }\n  const parsed = typeof textContent.text === \"object\" ? textContent.text : JSON.parse(textContent.text);\n\n  const toArray = (v) => Array.isArray(v) ? v.filter((s) => typeof s === \"string\" && s.trim()).map((s) => s.trim()) : [];\n\n  const result = {\n    befund: toArray(parsed.befund),\n    therapie: toArray(parsed.therapie),\n    verlauf: toArray(parsed.verlauf),\n    fokus: toArray(parsed.fokus)\n  };\n\n  // Minimal cost observability (execution-log only, no dashboard/db):\n  const usage = json.usage || {};\n  console.log(`[frame-gerrit usage] model=${json.model || \"unknown\"} input_tokens=${usage.input_tokens ?? \"?\"} output_tokens=${usage.output_tokens ?? \"?\"} total_tokens=${usage.total_tokens ?? \"?\"}`);\n\n  return [{ json: { ok: true, statusCode: 200, ...result } }];\n} catch (e) {\n  return [{ json: { ok: false, error: \"Could not parse structured response\", statusCode: 502 } }];\n}"
      },
      "id": "b1000000-0000-4000-8000-000000000005",
      "name": "Extract + Validate Output (grounding safety net)",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1140, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json.ok ? { befund: $json.befund, therapie: $json.therapie, verlauf: $json.verlauf, fokus: $json.fokus } : { error: $json.error } }}",
        "options": {
          "responseCode": "={{ $json.statusCode || (($json.ok) ? 200 : 502) }}"
        }
      },
      "id": "b1000000-0000-4000-8000-000000000006",
      "name": "Respond (success)",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [1380, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { error: $json.error } }}",
        "options": {
          "responseCode": "={{ $json.statusCode || 400 }}"
        }
      },
      "id": "b1000000-0000-4000-8000-000000000007",
      "name": "Respond (invalid input)",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [900, 520]
    }
  ],
  "connections": {
    "Webhook (bounded, header-auth)": {
      "main": [[{ "node": "Build Request (bounded, no-invention prompt)", "type": "main", "index": 0 }]]
    },
    "Build Request (bounded, no-invention prompt)": {
      "main": [[{ "node": "Input valid?", "type": "main", "index": 0 }]]
    },
    "Input valid?": {
      "main": [
        [{ "node": "Call OpenAI (existing ONYX credential)", "type": "main", "index": 0 }],
        [{ "node": "Respond (invalid input)", "type": "main", "index": 0 }]
      ]
    },
    "Call OpenAI (existing ONYX credential)": {
      "main": [[{ "node": "Extract + Validate Output (grounding safety net)", "type": "main", "index": 0 }]]
    },
    "Extract + Validate Output (grounding safety net)": {
      "main": [[{ "node": "Respond (success)", "type": "main", "index": 0 }]]
    }
  },
  "settings": {
    "executionOrder": "v1"
  },
  "meta": {
    "description": "Bounded pilot workflow for the Gerrit Terdenge FRAME Session Intelligence pilot. Receives an anonymized German post-session dictation transcript from the Cloudflare Worker boundary (worker/src/index.js in onyxsystems92/FRAME---Gerrit-Terdenge), structures it into {befund, therapie, verlauf, fokus} arrays via the existing ONYX OpenAI credential, and returns it synchronously. No diagnosis, no invented facts, no patient-record persistence. Reuses the account's existing OpenAI credential -- does not create a second one."
  }
}
WFEOF

echo "1/3 Importing header-auth credential (id ${CRED_ID})..."
docker cp "$TMP_CRED" n8n:/tmp/frame-gerrit-cred.json
docker exec -u 0 n8n chown node:node /tmp/frame-gerrit-cred.json
docker exec n8n n8n import:credentials --input=/tmp/frame-gerrit-cred.json
docker exec n8n rm -f /tmp/frame-gerrit-cred.json

echo "2/3 Importing workflow (id ${WORKFLOW_ID}), rebinding its webhook credential reference to ${CRED_ID}..."
docker cp "$TMP_WF" n8n:/tmp/frame-gerrit-workflow.json
docker exec -u 0 n8n chown node:node /tmp/frame-gerrit-workflow.json
docker exec n8n n8n import:workflow --input=/tmp/frame-gerrit-workflow.json
docker exec n8n rm -f /tmp/frame-gerrit-workflow.json

echo "3/3 Activating workflow (id ${WORKFLOW_ID})..."
docker exec n8n n8n publish:workflow --id="$WORKFLOW_ID" \
  || echo "publish:workflow failed -- activate manually in the n8n UI (FRAME · Gerrit · Structure Session Note) if this errors."

echo ""
echo "Testing webhook responds (expect a 400 response body, proving the route is live and header-auth is honored)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://n8n.franklyn-busse.com/webhook/frame-gerrit-structure \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Token: ${TOKEN}" \
  -d '{}')
echo "HTTP ${HTTP_CODE}"

echo ""
echo "=================================================================="
echo "Set this as the Cloudflare Worker secret (paste when prompted):"
echo ""
echo "  cd ~/Projects/frame-gerrit-terdenge/worker && npx wrangler secret put N8N_WEBHOOK_TOKEN"
echo ""
echo "Value to paste:"
echo "${TOKEN}"
echo "=================================================================="

if [ "$HTTP_CODE" != "400" ]; then
  echo ""
  echo "NOTE: expected HTTP 400 (empty body correctly rejected) but got ${HTTP_CODE}."
  echo "If this is 404: the running n8n process likely did not pick up the"
  echo "newly activated workflow's route and needs a restart:"
  echo "  docker restart n8n"
  echo "This restarts the shared n8n container -- it will briefly interrupt"
  echo "any in-flight executions of OTHER active workflows on this instance"
  echo "(e.g. the HI Auto-Dispatch Poller). Confirm that is acceptable before"
  echo "running it. Do not restart automatically."
fi
