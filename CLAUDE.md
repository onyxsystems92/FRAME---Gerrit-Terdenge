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
- **Session-Notiz** (`compress.js`): deterministisch, regelbasiert, ohne Netzwerkaufruf
  und ohne LLM. Kein Wechsel auf einen LLM-Aufruf ohne ausdrückliche Freigabe von
  Franklyn — das würde einen serverseitigen Schlüssel-Proxy nötig machen, was bewusst
  vermieden wurde, solange die regelbasierte Lösung ausreicht.
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
- Kein LLM-/API-Aufruf, kein serverseitiger Endpunkt ohne ausdrückliche Freigabe von
  Franklyn — und dann nur der kleinstmögliche Processing-Endpunkt, kein neuer Service.
- Keine echte Lemmiscus-Integration oder Audio-Persistenz in diesem Repository.
- Keine neuen Bewertungsdimensionen, Felder oder Fälle ohne Freigabe.
- Persönliche Kurzschrift nicht als Output-Sprache erzwingen — Gerrit nutzte starke
  Abkürzungen als Zeitkompensation beim manuellen Schreiben, nicht als gewünschte
  Dokumentationssprache.
