#!/usr/bin/env bash
# Run this ON franklyn-runtime-prod (or via: ssh franklyn-runtime-prod 'bash -s' < setup-webhook-credential.sh)
#
# Creates the bounded header-auth credential this workflow's webhook requires,
# imports the workflow (n8n/frame-gerrit-structure-workflow.json in this repo),
# activates it, and prints the ONE value you still need to hand to Cloudflare
# (never printed anywhere else, never committed).
#
# Does NOT touch the existing OpenAI credential (id xEy4jRC43l5LYHQt,
# "ONYX • OpenAI") — the workflow references it by id only, read-only.

set -euo pipefail

CRED_ID="69a9cfd9-bd78-4b87-956a-34f6364e210c"
TOKEN="$(openssl rand -hex 32)"
WORKFLOW_FILE="$(dirname "$0")/frame-gerrit-structure-workflow.json"

TMP_CRED="$(mktemp)"
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

echo "1/3 Importing header-auth credential..."
docker cp "$TMP_CRED" n8n:/tmp/frame-gerrit-cred.json
docker exec n8n n8n import:credentials --input=/tmp/frame-gerrit-cred.json
docker exec n8n rm -f /tmp/frame-gerrit-cred.json
rm -f "$TMP_CRED"

echo "2/3 Importing workflow..."
docker cp "$WORKFLOW_FILE" n8n:/tmp/frame-gerrit-workflow.json
docker exec n8n n8n import:workflow --input=/tmp/frame-gerrit-workflow.json
docker exec n8n rm -f /tmp/frame-gerrit-workflow.json

echo "3/3 Activating workflow..."
WF_ID=$(docker exec n8n n8n list:workflow 2>/dev/null | grep "FRAME . Gerrit . Structure Session Note" | awk '{print $1}')
if [ -z "$WF_ID" ]; then
  echo "Could not find workflow id after import -- activate it manually in the n8n UI (FRAME Gerrit Structure Session Note), then continue below."
else
  docker exec n8n n8n publish:workflow --id="$WF_ID" || echo "publish:workflow failed -- activate manually in the n8n UI if this errors."
fi

echo ""
echo "Testing webhook responds (expect a 400 response body, proving the route is live and header-auth is honored)..."
curl -s -o /dev/null -w "HTTP %{http_code}\n" -X POST https://n8n.franklyn-busse.com/webhook/frame-gerrit-structure \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Token: ${TOKEN}" \
  -d '{}'

echo ""
echo "=================================================================="
echo "Set this as the Cloudflare Worker secret (paste when prompted):"
echo ""
echo "  cd ~/Projects/frame-gerrit-terdenge/worker && npx wrangler secret put N8N_WEBHOOK_TOKEN"
echo ""
echo "Value to paste:"
echo "${TOKEN}"
echo "=================================================================="
echo ""
echo "NOTE: if the webhook test above returned HTTP 404 instead of 400, the"
echo "running n8n process did not pick up the newly activated workflow's"
echo "route and needs a restart:"
echo "  docker restart n8n"
echo "This restarts the shared n8n container -- it will briefly interrupt"
echo "any in-flight executions of OTHER active workflows on this instance."
echo "Confirm that is acceptable before running it."
