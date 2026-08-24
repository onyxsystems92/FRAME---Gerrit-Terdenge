/*
 * Deterministic, rule-based compression of a free dictation transcript into
 * a Lemmiscus-Kurznotiz and a Next Session Brief. No network call, no LLM —
 * everything here runs synchronously in the browser on the edited transcript
 * text only. Nothing is invented: fields are omitted when not mentioned, and
 * therapy items that don't match the known vocabulary are flagged UNKLAR
 * instead of being guessed or corrected.
 */

const KNOWN_TECHNIQUE_PHRASES = [
  "Vibro PPT", "Neuralmassage", "Schiebetechnik", "Schiebe", "Release",
  "FDM Jones", "FDM", "Jones", "Mobilisation", "Chirotherapie", "Chiro",
  "Massage", "Manuelle Therapie", "Dehnung", "Dehnübung",
  "Triggerpunktbehandlung", "Triggerpunkt", "Wärme", "Kälte", "Taping",
  "Tape", "Ultraschall", "Elektrotherapie", "Lymphdrainage", "Osteopathie",
  "Faszientechnik", "Weichteiltechnik", "Quadrizeps", "Quad", "Faszien",
  "Fuß", "Kniegelenk", "Knie", "Schultergelenk", "Schulter", "Hüftgelenk",
  "Hüfte", "Ellenbogen", "Handgelenk", "Sprunggelenk", "Kopf", "Nacken",
  "Rücken", "Becken", "Iliosakralgelenk", "ISG", "Tibiofibulargelenk",
  "Lendenwirbelsäule", "Halswirbelsäule", "Brustwirbelsäule", "Wirbelsäule",
  "Gelenk", "Bandscheibe", "Muskulatur"
];

const KNOWN_WORDS = new Set(
  KNOWN_TECHNIQUE_PHRASES.flatMap(p => p.toLowerCase().split(/\s+/))
);

const CONNECTOR_WORDS = new Set([
  "mit", "ohne", "und", "sowie", "dann", "noch", "auch", "bisschen",
  "etwas", "sehr", "komplett", "kompl", "links", "li", "rechts", "re",
  "beidseits", "beidseitig", "der", "die", "das", "den", "dem", "am", "im"
]);

const SPINE_LEVEL_RE = /^[a-zA-Z]{1,3}\d{1,2}(\/[a-zA-Z]{0,3}\d{1,2})?$/;

const VERLAUF_KEYWORDS = [
  "besser", "schlechter", "schlimmer", "unverändert", "gleich geblieben",
  "gleichgeblieben", "stärker", "schwächer", "verschlechtert", "verbessert",
  "deutlich", "kaum noch", "nachgelassen", "zugenommen"
];

const FOKUS_KEYWORDS = [
  "nächstes mal", "nächste sitzung", "weiter beobachten", "fokus",
  "dranbleiben", "ziel", "weiterhin", "künftig", "im auge behalten"
];

const THERAPIE_TRIGGER_KEYWORDS = [
  "gemacht", "behandelt", "durchgeführt", "angewendet", "eingesetzt",
  "therapie war", "behandlung war", "dann noch"
];

// Strips conversational lead-in ("Ich habe gemacht ...", "Behandelt wurde
// mit ...") from a freeform therapy sentence before item-splitting, so the
// filler words don't get swallowed into (and flag) the first technique item.
const THERAPIE_FILLER_PREFIX_RE =
  /^(ich\s+habe\s+)?(dann\s+)?(noch\s+)?(gemacht|durchgeführt|angewendet|eingesetzt|behandelt\w*)(\s+wurde)?\s*(mit\s+|:)?\s*/i;

function stripTherapieFiller(sentence) {
  return sentence.replace(THERAPIE_FILLER_PREFIX_RE, "").trim();
}

// Strips a stray structural label (e.g. a lone "Befund:" without a paired
// "Therapie:") from the start of a sentence so it never leaks into output
// text when the labeled fast-path above doesn't apply.
const STRAY_LABEL_RE =
  /^(Befund|Beschwerden|Therapie|Verlauf|Reaktion|Fokus|Nächstes Mal)\s*:?\s*/i;

function stripStrayLabel(sentence) {
  return sentence.replace(STRAY_LABEL_RE, "").trim();
}

const ABBREVIATIONS = [
  [/Lendenwirbelsäule/gi, "LWS"],
  [/Halswirbelsäule/gi, "HWS"],
  [/Brustwirbelsäule/gi, "BWS"],
  [/Wirbelsäule/gi, "WS"],
  [/Kniegelenk/gi, "Knie"],
  [/Schultergelenk/gi, "Schulter"],
  [/\blinks\b/gi, "li."],
  [/\brechts\b/gi, "re."],
  [/\bnach\b/gi, "n."],
  [/\bmit\b/gi, "m."],
  [/\bbis\b/gi, "b."],
  [/\bWochen\b/gi, "Wo."],
  [/\bWoche\b/gi, "Wo."],
  [/\bTage\b/gi, "Tg."],
  [/\bTag\b/gi, "Tg."],
  [/\bkomplett\b/gi, "kompl."],
  [/\bBeschwerden\b/gi, "Beschw."],
  [/\bSchmerzen\b/gi, "Schm."]
];

function abbreviate(text) {
  let out = text;
  for (const [pattern, replacement] of ABBREVIATIONS) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\.{2,}/g, ".").replace(/\s+/g, " ").trim();
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function splitLabel(text, labelPattern) {
  const match = text.match(labelPattern);
  if (!match) return null;
  return { index: match.index, length: match[0].length };
}

/**
 * Splits a comma/"und"/semicolon-separated therapy item list, classifies
 * each item as recognized or UNKLAR based on KNOWN_WORDS, and returns both
 * lists plus the raw items for display.
 */
function classifyTherapyItems(therapieText) {
  const items = therapieText
    .split(/,|;| und /i)
    .map(s => s.trim().replace(/[.!?]+$/, "").trim())
    .filter(Boolean);

  const recognized = [];
  const unklar = [];

  for (const item of items) {
    const tokens = item.split(/\s+/).filter(Boolean);
    const contentTokens = tokens.filter(tok => {
      const norm = tok.toLowerCase().replace(/[.,]/g, "");
      if (CONNECTOR_WORDS.has(norm)) return false;
      if (SPINE_LEVEL_RE.test(tok)) return false;
      return true;
    });

    const allKnown = contentTokens.every(tok =>
      KNOWN_WORDS.has(tok.toLowerCase().replace(/[.,]/g, ""))
    );

    if (contentTokens.length === 0 || allKnown) {
      recognized.push(item);
    } else {
      unklar.push(item);
    }
  }

  return { recognized, unklar, items };
}

/**
 * Parses free dictation text into Befund/Therapie/Verlauf/Fokus segments.
 * Prefers explicit "Befund:"/"Therapie:" labels (Gerrit's own habit);
 * falls back to keyword-based sentence classification otherwise.
 */
function parseTranscript(rawText) {
  const text = rawText.replace(/\s+/g, " ").trim();

  const befundLabel = splitLabel(text, /\b(Befund|Beschwerden)\s*:?\s*/i);
  const therapieLabel = splitLabel(text, /\bTherapie\s*:?\s*/i);
  const verlaufLabel = splitLabel(text, /\b(Verlauf|Reaktion)\s*:?\s*/i);
  const fokusLabel = splitLabel(text, /\b(Fokus|Nächstes Mal)\s*:?\s*/i);

  if (befundLabel && therapieLabel && therapieLabel.index > befundLabel.index) {
    const befundStart = befundLabel.index + befundLabel.length;
    const befundEnd = therapieLabel.index;
    const therapieStart = therapieLabel.index + therapieLabel.length;

    let therapieEnd = text.length;
    let verlaufText = "";
    let fokusText = "";

    const laterLabels = [verlaufLabel, fokusLabel]
      .filter(l => l && l.index > therapieStart)
      .sort((a, b) => a.index - b.index);

    if (laterLabels.length > 0) {
      therapieEnd = laterLabels[0].index;
    }

    if (verlaufLabel && verlaufLabel.index >= therapieStart) {
      const end = fokusLabel && fokusLabel.index > verlaufLabel.index
        ? fokusLabel.index
        : text.length;
      verlaufText = text.slice(verlaufLabel.index + verlaufLabel.length, end).trim();
    }
    if (fokusLabel && fokusLabel.index >= therapieStart) {
      fokusText = text.slice(fokusLabel.index + fokusLabel.length).trim();
    }

    return {
      befund: text.slice(befundStart, befundEnd).trim(),
      therapie: text.slice(therapieStart, therapieEnd).trim(),
      verlauf: verlaufText,
      fokus: fokusText
    };
  }

  const sentences = splitSentences(text).map(stripStrayLabel);
  const befundSentences = [];
  const therapieSentences = [];
  const verlaufSentences = [];
  const fokusSentences = [];

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (VERLAUF_KEYWORDS.some(k => lower.includes(k))) {
      verlaufSentences.push(sentence);
    } else if (FOKUS_KEYWORDS.some(k => lower.includes(k))) {
      fokusSentences.push(sentence);
    } else if (
      THERAPIE_TRIGGER_KEYWORDS.some(k => lower.includes(k)) ||
      (sentence.split(",").length >= 3)
    ) {
      therapieSentences.push(sentence);
    } else {
      befundSentences.push(sentence);
    }
  }

  return {
    befund: befundSentences.join(" "),
    therapie: therapieSentences.map(stripTherapieFiller).join(" "),
    verlauf: verlaufSentences.join(" "),
    fokus: fokusSentences.join(" ")
  };
}

function formatItemsForDisplay(recognized, unklar, items) {
  return items
    .map(item => (unklar.includes(item) ? `[UNKLAR: ${item}]` : item))
    .join(", ");
}

/**
 * Main entry point: takes the edited transcript text and returns
 * { kurznotiz, brief, unklarItems }.
 */
function compressTranscript(rawText) {
  const { befund, therapie, verlauf, fokus } = parseTranscript(rawText);
  const { recognized, unklar, items } = classifyTherapyItems(therapie);
  const therapieDisplay = formatItemsForDisplay(recognized, unklar, items);

  const kurznotizLines = [];
  if (befund) kurznotizLines.push(abbreviate(befund));
  if (items.length > 0) kurznotizLines.push(`Th: ${abbreviate(therapieDisplay)}`);
  const kurznotiz = kurznotizLines.join("\n");

  const briefLines = [];
  if (befund) briefLines.push(`Beschwerden / aktueller Stand: ${befund}`);
  if (items.length > 0) briefLines.push(`Letzte Intervention: ${therapieDisplay}`);
  if (verlauf) briefLines.push(`Verlauf/Veränderung: ${verlauf}`);
  if (fokus) briefLines.push(`Offener Fokus: ${fokus}`);
  const brief = briefLines.join("\n");

  return { kurznotiz, brief, unklarItems: unklar };
}
