# CLAUDE.md — FRAME · Session Intelligence (Gerrit-Pilot)

Dieses Repository ist ein eigenständiger, minimaler Test — kein Teil von ONYX Core und
kein Ausgangspunkt für eine größere Produktarchitektur oder eine neue FRAME-Plattform.

## Scope

- Statische Seite, keine Build-Pipeline, keine Datenbank, keine Accounts, keine
  Analytics, kein Tracking, keine Lemmiscus-Integration.
- **Spracherkennung**: ausschließlich der Browser-eigene `SpeechRecognition`/
  `webkitSpeechRecognition`. Kein eigener STT-Server, kein API-Key im Client oder im
  Repo. Es wird nie Audio aufgenommen oder gespeichert — nur der Text, den der Browser
  zurückgibt.
- **Session-Notiz** (`compress.js`): primär strukturiert über die Kette
  Browser → Cloudflare Worker (`worker/`) → n8n-Workflow (`n8n/frame-gerrit-structure-workflow.json`,
  `FRAME · Gerrit · Structure Session Note`) → bestehende OpenAI-Credential
  in n8n → strukturiertes JSON `{befund: [], therapie: [], verlauf: [], fokus: []}`
  zurück zum Browser. Der Worker besitzt **keinen** LLM-Provider-Key — er hält
  nur einen begrenzten Header-Token (`N8N_WEBHOOK_TOKEN`), der ausschließlich
  diesen einen n8n-Webhook autorisiert. Das eigentliche OpenAI-Credential
  (`ONYX • OpenAI`, bereits produktiv im Franklyn-Ökosystem) bleibt vollständig
  in n8n — keine zweite Provider-Credential, kein Key-Kopieren.
  Fail-honest bei Ausfall: bei explizit gelabeltem Input (`Befund:`/`Therapie:`)
  greift eine lokale, deterministische Rückfallebene (`parseTranscript`),
  klar als „Begrenzter Fallback" markiert. Bei unlabeled natürlichem Diktat
  wird **keine** irreführende Struktur gerendert — stattdessen ein ehrlicher
  Hinweis, das Transkript manuell zu prüfen oder es erneut zu versuchen
  (`compressTranscriptAsync` Status `"unavailable"`). Beide erfolgreichen Pfade
  (KI und begrenzter Fallback) durchlaufen dieselbe clientseitige
  UNKLAR-Vokabelprüfung. Architektur explizit freigegeben von Franklyn
  (Provider-Migration zu OpenAI/n8n, 2026-09-09). Minimale
  Token-Nutzungsdaten werden im n8n-Ausführungslog erfasst (kein Dashboard,
  keine Datenbank).
- Transkript und Outputs leben nur im Browser-Speicher (JS-Zustand) für die Dauer der
  Session. „Neue Session" und ein Seiten-Reload löschen alles vollständig. Keine
  Persistenz, keine Übertragung — ausgenommen optionales Validierungs-Feedback (Ja/Nein)
  in `localStorage`.
- Drei feste, anonymisierte Referenzfälle in `cases.js` unterhalb der Live-Funktion.
  Keine weiteren Fälle ohne ausdrückliche Freigabe von Franklyn hinzufügen.

## Produktregeln (nicht verhandelbar)

- **Verständliche, knappe Dokumentation** — die Session-Notiz soll direkt lesbar und
  ohne persönliche Kürzel-Kenntnis verständlich sein. Nur etablierte Fachkürzel
  (HWS, BWS, LWS, WS) werden angewendet. Persönliche Kurzformen (li., re., n., m.,
  Beschw., Schm. usw.) werden NICHT erzwungen.
- Keine medizinischen Aussagen ergänzen, die nicht im Input stehen.
- Unklar diktierte oder unbekannte Therapie-Begriffe nicht erraten oder korrigieren —
  als `UNKLAR` kennzeichnen und separat unter „Bitte prüfen / unklar" auflisten. Die
  Vokabelliste in `compress.js` (`KNOWN_TECHNIQUE_PHRASES`) enthält physiotherapeutische
  Standardbegriffe zur Transkriptionsfehler-Erkennung und darf erweitert werden, wenn
  sich ein Begriff als tatsächlich korrekt und wiederkehrend erweist.
- Gerrit bleibt die fachliche Entscheidungsinstanz. Die manuelle Übernahme nach
  Lemmiscus ist immer ein bewusster, separater Schritt außerhalb dieses Tools.
- Ein Gerrit-spezifisches Wörterbuch / Glossar ist KEINE Produktanforderung, es sei
  denn, reale zukünftige Evidenz zeigt genuinen praxisspezifischen Wortschatz, der
  anders nicht sicher gehandhabt werden kann.

## Nicht tun

- Kein Overengineering: kein Framework, kein Build-Tool, keine neuen Abhängigkeiten.
- Der Cloudflare Worker (`worker/`) ist der einzige öffentliche Endpunkt und der
  n8n-Workflow (`n8n/frame-gerrit-structure-workflow.json`) der einzige
  Strukturierungspfad. Kein weiterer Service, kein zweites OpenAI-Credential,
  kein direkter OpenAI-Key im Worker ohne ausdrückliche Freigabe von Franklyn.
- Keine echte Lemmiscus-Integration oder Audio-Persistenz in diesem Repository.
- Keine neuen Bewertungsdimensionen, Felder oder Fälle ohne Freigabe.
- Persönliche Kurzschrift nicht als Output-Sprache erzwingen — Gerrit nutzte starke
  Abkürzungen als Zeitkompensation beim manuellen Schreiben, nicht als gewünschte
  Dokumentationssprache.
