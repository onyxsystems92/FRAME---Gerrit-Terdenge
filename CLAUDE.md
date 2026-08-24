# CLAUDE.md — FRAME · Session Intelligence (Gerrit-Pilot)

Dieses Repository ist ein eigenständiger, minimaler Test — kein Teil von ONYX Core und
kein Ausgangspunkt für eine größere Produktarchitektur.

## Scope

- Statische Seite, keine Build-Pipeline, kein Backend, keine API, kein LLM-Aufruf.
- Drei feste, anonymisierte Fälle in `cases.js`. Keine weiteren Fälle ohne
  ausdrückliche Freigabe von Franklyn hinzufügen.
- Feedback (Ja/Nein je Fall) wird ausschließlich lokal im Browser (`localStorage`)
  gespeichert. Keine Übertragung an einen Server, keine Analytics, kein Tracking.

## Produktregeln (nicht verhandelbar)

- Gerrits extrem knappe Dokumentationssprache erhalten — nicht ausformulieren oder
  klinisch aufwerten.
- Keine medizinischen Aussagen ergänzen, die nicht im Input stehen.
- Unklar diktierte Begriffe (aktuell: „Chiro Elves", „CBRTOT", „Star Tregerband",
  „Skriben", „Gluträgerpunkte") nicht erraten oder korrigieren — als `UNKLAR` kennzeichnen.
- Gerrit bleibt die fachliche Entscheidungsinstanz. Die Seite bewertet oder interpretiert
  nichts fachlich, sie stellt nur die drei Texte nebeneinander.

## Nicht tun

- Kein Overengineering: kein Framework, kein Build-Tool, keine Abhängigkeiten.
- Keine neuen Fälle, Felder oder Bewertungsdimensionen ohne Freigabe.
- Keine Erweiterung Richtung echtem Lemmiscus-Anschluss oder Diktat-Aufnahme in diesem
  Repository — das ist ausdrücklich ein späterer, separat zu entscheidender Schritt.
