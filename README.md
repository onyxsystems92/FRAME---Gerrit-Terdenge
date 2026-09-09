# FRAME · Session Intelligence — Gerrit-Pilot

Funktionaler Test für Gerrit Terdenge: nach jeder Behandlung kurz einsprechen,
Session-Notiz erstellen lassen, prüfen, manuell nach Lemmiscus übernehmen.
Lemmiscus bleibt das führende System — dieses Tool nimmt nur das Schreiben ab.

## Was das hier ist

- Reine statische Seite (HTML/CSS/Vanilla JS), kein Build-Schritt, keine Abhängigkeiten.
- Kein Backend, keine API, kein LLM-Aufruf, keine Lemmiscus-Integration, keine Datenbank,
  kein Tracking.
- **Spracherkennung**: der Browser-eigene `SpeechRecognition`/`webkitSpeechRecognition`
  (Chrome, Edge, Safari). Kein eigener API-Key, kein eigener Server — Audio geht direkt
  an die Spracherkennung des Browsers, nie an diesen Code.
- **Session-Notiz** ([`compress.js`](compress.js)): vollständig deterministische,
  regelbasierte Strukturierung im Browser — kein Netzwerkaufruf, kein LLM. Trennt
  Befund/Therapie/Verlauf/Fokus und markiert jeden Therapie-Begriff, der nicht in der
  physiotherapeutischen Standardvokabelliste steht, als `UNKLAR` statt ihn zu erraten.
  Nur etablierte Fachkürzel (HWS, BWS, LWS) werden angewendet — persönliche Kurzformen
  werden nicht erzwungen.
- Session-Notiz und Next Session Brief sind editierbar, mit Kopieren-Button. „Neue Session"
  setzt den gesamten Zustand zurück — nur optionales Validierungs-Feedback (Ja/Nein) wird
  lokal gespeichert.
- Unterhalb der Live-Funktion: drei anonymisierte Referenzbeispiele
  ([`cases.js`](cases.js)) mit dynamisch erzeugter Notiz/Brief und Feedback-Bewertung.

## Lokal ansehen

Da die Seite ohne Build-Schritt auskommt, reicht ein einfacher statischer Server:

```bash
python3 -m http.server 8080
```

Danach `http://localhost:8080` öffnen. Mikrofonzugriff braucht HTTPS oder
`localhost` — auf einem reinen `file://`-Pfad fragt der Browser die Spracherkennung
unter Umständen nicht an; „Transkript manuell eingeben" funktioniert immer.

## Tests

`tests.html` im Browser öffnen — läuft selbständig und zeigt pass/fail für
alle Kompressions-/Strukturierungstests.

## Scope-Grenzen

Siehe [`CLAUDE.md`](CLAUDE.md) für die verbindlichen Produkt- und Erweiterungsregeln
dieses Piloten.
