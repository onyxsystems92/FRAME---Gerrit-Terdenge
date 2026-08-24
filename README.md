# FRAME · Session Intelligence — Testfälle Gerrit Terdenge

Minimaler statischer Test für Gerrit Terdenge: drei anonymisierte Beispiele zeigen den Weg
von der freien Nach-Diktierung (Input) über eine Lemmiscus-Kurznotiz bis zum
Next Session Brief für den Folgetermin.

## Was das hier ist

- Reine statische Seite (HTML/CSS/Vanilla JS), kein Build-Schritt.
- Kein Backend, keine API, kein LLM-Aufruf, keine Lemmiscus-Integration.
- Drei feste, anonymisierte Testfälle in [`cases.js`](cases.js).
- Pro Fall drei Ja/Nein-Bewertungen (fachlich korrekt, direkt übernehmbar, hilft beim
  Wiedereinstieg), gespeichert ausschließlich in `localStorage` des jeweiligen Browsers.
  Es gibt keine Übertragung, keine Datenbank, keinen Server-State.

## Lokal ansehen

Da die Seite ohne Build-Schritt auskommt, reicht ein einfacher statischer Server:

```bash
python3 -m http.server 8080
```

Danach `http://localhost:8080` öffnen. Direktes Öffnen von `index.html` per
`file://` funktioniert ebenfalls, da keine Fetch-Requests genutzt werden.

## Scope-Grenzen

Siehe [`CLAUDE.md`](CLAUDE.md) für die verbindlichen Produkt- und Erweiterungsregeln
dieses Piloten.
