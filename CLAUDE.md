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
- **Verdichtung** (`compress.js`): deterministisch, regelbasiert, ohne Netzwerkaufruf
  und ohne LLM. Kein Wechsel auf einen LLM-Aufruf ohne ausdrückliche Freigabe von
  Franklyn — das würde einen serverseitigen Schlüssel-Proxy nötig machen, was bewusst
  vermieden wurde, solange die regelbasierte Lösung ausreicht.
- Transkript und Outputs leben nur im Browser-Speicher (JS-Zustand) für die Dauer der
  Session. „Neue Session" und ein Seiten-Reload löschen alles vollständig. Keine
  Persistenz, keine Übertragung.
- Drei feste, anonymisierte Referenzfälle in `cases.js` unterhalb der Live-Funktion.
  Keine weiteren Fälle ohne ausdrückliche Freigabe von Franklyn hinzufügen. Deren
  Feedback (Ja/Nein) bleibt ausschließlich lokal in `localStorage` — separat von der
  Live-Funktion, die nichts persistiert.

## Produktregeln (nicht verhandelbar)

- Gerrits extrem knappe Dokumentationssprache erhalten — nicht ausformulieren oder
  klinisch aufwerten.
- Keine medizinischen Aussagen ergänzen, die nicht im Input stehen.
- Unklar diktierte oder unbekannte Therapie-Begriffe nicht erraten oder korrigieren —
  als `UNKLAR` kennzeichnen und separat unter „Bitte prüfen / unklar" auflisten. Die
  Vokabelliste in `compress.js` (`KNOWN_TECHNIQUE_PHRASES`) darf erweitert werden, wenn
  sich ein Begriff als tatsächlich korrekt und wiederkehrend erweist — nicht aber, um
  ein Erkennungsproblem zu kaschieren.
- Gerrit bleibt die fachliche Entscheidungsinstanz. Die manuelle Übernahme nach
  Lemmiscus ist immer ein bewusster, separater Schritt außerhalb dieses Tools.

## Nicht tun

- Kein Overengineering: kein Framework, kein Build-Tool, keine neuen Abhängigkeiten.
- Kein LLM-/API-Aufruf, kein serverseitiger Endpunkt ohne ausdrückliche Freigabe von
  Franklyn — und dann nur der kleinstmögliche Processing-Endpunkt, kein neuer Service.
- Keine echte Lemmiscus-Integration oder Audio-Persistenz in diesem Repository.
- Keine neuen Bewertungsdimensionen, Felder oder Fälle ohne Freigabe.
