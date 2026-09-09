# FRAME · Session Intelligence — Gerrit-Pilot

Funktionaler Test für Gerrit Terdenge: nach jeder Behandlung kurz einsprechen,
Session-Notiz erstellen lassen, prüfen, manuell nach Lemmiscus übernehmen.
Lemmiscus bleibt das führende System — dieses Tool nimmt nur das Schreiben ab.

## Was das hier ist

- Reine statische Seite (HTML/CSS/Vanilla JS), kein Build-Schritt, keine Abhängigkeiten.
- Kein lokales Backend, keine Datenbank, kein Tracking, keine Lemmiscus-Integration.
- **Spracherkennung**: der Browser-eigene `SpeechRecognition`/`webkitSpeechRecognition`
  (Chrome, Edge, Safari). Kein eigener API-Key, kein eigener Server — Audio geht direkt
  an die Spracherkennung des Browsers, nie an diesen Code.
- **Session-Notiz** ([`compress.js`](compress.js)): strukturiert den anonymisierten
  Text über einen Cloudflare Worker ([`worker/`](worker/)), der OpenAI (gpt-4.1-mini,
  structured output) als begrenzten Strukturierungsdienst nutzt — kein API-Key im
  Client, keine Diagnosefunktion, keine erfundenen Inhalte. Bei Worker-Ausfall greift
  eine lokale, deterministische Rückfallebene. Beide Pfade durchlaufen dieselbe
  clientseitige UNKLAR-Vokabelprüfung: jeder Therapie-Begriff, der nicht in der
  physiotherapeutischen Standardvokabelliste steht, wird als `UNKLAR` markiert statt
  erraten. Nur etablierte Fachkürzel (HWS, BWS, LWS) werden angewendet — persönliche
  Kurzformen werden nicht erzwungen.
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
