# AGENTS.md — FRAME · Session Intelligence (Gerrit-Pilot)

Status: CURRENT ENGINEERING ENTRYPOINT
Updated: 2026-09-13

This contract applies equally to Claude Code and Codex. Claude Code remains the primary substantive builder; Codex is an equivalent capability-fit surface when explicitly selected. For access, secret and current-session capability proof, follow `onyxsystems92/onyx-core/docs/engineering/BUILDER_CAPABILITY_PARITY.md`.

No builder receives n8n, Cloudflare or provider authority merely from repository access. Prove the task-required live capability before mutation. Do not copy the existing n8n OpenAI credential or webhook token into a builder workspace merely to create parity.

## Scope

This repository is an independent minimal test — not part of ONYX Core and not a starting point for a larger product architecture or new FRAME platform.

- Static page, no build pipeline, database, accounts, analytics, tracking or Lemmiscus integration.
- **Speech recognition**: browser-native `SpeechRecognition` / `webkitSpeechRecognition` only. No custom STT server, no API key in client/repo. Audio is never recorded or stored; only browser-returned text is used.
- **Session note** (`compress.js`): primary path is Browser → Cloudflare Worker (`worker/`) → n8n workflow (`n8n/frame-gerrit-structure-workflow.json`, `FRAME · Gerrit · Structure Session Note`) → existing OpenAI credential in n8n → structured JSON `{befund: [], therapie: [], verlauf: [], fokus: []}` back to the browser.
- The Worker holds no LLM provider key. It uses only the bounded `N8N_WEBHOOK_TOKEN` for the single webhook. The OpenAI credential remains in n8n; do not create a second provider credential or copy the key.
- Fail honestly: explicitly labelled input may use the deterministic local `parseTranscript` fallback, clearly identified as limited fallback. Unlabelled natural dictation must not render misleading structure when the AI path is unavailable.
- Both successful paths pass the same client-side UNKLAR vocabulary check.
- Transcript and outputs live only in browser state for the session. Reload/new session clears them. No persistence/transmission except the already-bounded optional validation feedback in `localStorage`.
- Exactly three fixed anonymized reference cases live in `cases.js`; do not add cases without explicit Franklyn approval.

## Product rules

- Documentation should be concise, understandable and not depend on Gerrit's personal shorthand.
- Established abbreviations such as HWS/BWS/LWS/WS are allowed; personal shorthand is not forced.
- Never add medical statements that are absent from input.
- Do not guess/correct unclear therapy terms; mark them `UNKLAR` and list them for review.
- Gerrit remains the professional decision authority. Manual transfer into Lemmiscus is a conscious separate step outside this tool.
- A Gerrit-specific glossary is not a requirement unless real future evidence proves a genuine recurring practice-specific vocabulary need.

## Engineering boundaries

- No overengineering: no framework, build tool or new dependency without a concrete requirement.
- The Cloudflare Worker is the only public endpoint and the n8n workflow is the only AI structuring path unless Franklyn explicitly changes the architecture.
- No direct OpenAI key in the Worker and no second OpenAI credential.
- No real Lemmiscus integration or audio persistence in this repository.
- No new assessment dimensions, fields or cases without approval.
- Do not recreate retired ONYX/OpenClaw actor architecture around this pilot. Historical names in credentials/files are implementation residue only.

## Builder pre-flight

Before work that goes beyond repository-only edits, report only the task-required capabilities under the central parity contract:

- GitHub repository access;
- Cloudflare Worker access if Worker deployment/readback is required;
- n8n access if workflow inspection/mutation is required;
- browser/visual validation if behavior proof is required.

`UNKNOWN` or `BLOCKED` live access stops at that boundary. Repository-only work may continue independently.

## Hygiene

`AGENTS.md` is the canonical active instruction file. `CLAUDE.md` is a compatibility pointer only. Historical Claude-specific handoffs remain in Git history and must not compete with this contract.
