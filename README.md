# FRAME · Session Intelligence — Gerrit-Pilot

Funktionaler Test für Gerrit Terdenge: nach jeder Behandlung kurz einsprechen,
Transkript prüfen, verdichten lassen, manuell nach Lemmiscus übernehmen. Lemmiscus
bleibt das führende System — dieses Tool ersetzt es nicht, es nimmt nur das Schreiben ab.

## Was das hier ist

- Reine statische Seite (HTML/CSS/Vanilla JS), kein Build-Schritt, keine Abhängigkeiten.
- Kein Backend, keine API, kein LLM-Aufruf, keine Lemmiscus-Integration, keine Datenbank,
  kein Tracking.
- **Spracherkennung**: der Browser-eigene `SpeechRecognition`/`webkitSpeechRecognition`
  (Chrome, Edge, Safari). Kein eigener API-Key, kein eigener Server — Audio geht direkt
  an die Spracherkennung des Browsers, nie an diesen Code. Es wird nie Audio
  aufgenommen oder gespeichert, nur der resultierende Text.
- **Verdichtung** ([`compress.js`](compress.js)): vollständig deterministische,
  regelbasierte Textverarbeitung im Browser — kein Netzwerkaufruf, kein LLM. Trennt
  Befund/Therapie/Verlauf/Fokus, wendet Gerrits Abkürzungslogik an und markiert jeden
  Therapie-Begriff, der nicht in der bekannten Vokabelliste steht, als `UNKLAR` statt
  ihn zu erraten oder zu korrigieren.
- Transkript und beide Outputs sind editierbar, mit Kopieren-Button. „Neue Session"
  setzt den gesamten lokalen Zustand zurück — nichts wird in `localStorage` oder sonst
  irgendwo persistiert.
- Unterhalb der Live-Funktion: drei anonymisierte Referenzbeispiele
  ([`cases.js`](cases.js)) mit Ja/Nein-Bewertung, ausschließlich lokal in `localStorage`
  gespeichert — dienen nur zur Orientierung, nicht als Live-Funktion.

## Lokal ansehen

Da die Seite ohne Build-Schritt auskommt, reicht ein einfacher statischer Server:

```bash
python3 -m http.server 8080
```

Danach `http://localhost:8080` öffnen. Mikrofonzugriff braucht HTTPS oder
`localhost` — auf einem reinen `file://`-Pfad fragt der Browser die Spracherkennung
unter Umständen nicht an; „Transkript manuell eingeben" funktioniert immer.

## Scope-Grenzen

Siehe [`CLAUDE.md`](CLAUDE.md) für die verbindlichen Produkt- und Erweiterungsregeln
dieses Piloten.
