const STORAGE_KEY = "frame-gerrit-feedback-v2";
const QUESTIONS = [
  { key: "korrekt", label: "Fachlich korrekt?" },
  { key: "verwendbar", label: "Direkt verwendbar?" },
  { key: "verstaendlich", label: "Verständlich?" }
];

function loadFeedback() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveFeedback(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function highlightUnklar(text) {
  return text.replace(/\[UNKLAR: ([^\]]+)\]/g, '<span class="unklar">UNKLAR: $1</span>');
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderCase(c, feedback) {
  const { note, brief } = compressTranscript(c.input);

  const article = document.createElement("article");
  article.className = "case-card";
  article.innerHTML = `
    <h2>${escapeHtml(c.title)}</h2>
    <div class="case-columns">
      <section class="col">
        <h3>Input</h3>
        <pre class="text-block">${escapeHtml(c.input)}</pre>
      </section>
      <section class="col">
        <h3>Session-Notiz</h3>
        <pre class="text-block">${highlightUnklar(escapeHtml(note))}</pre>
      </section>
      <section class="col">
        <h3>Next Session Brief</h3>
        <pre class="text-block">${highlightUnklar(escapeHtml(brief))}</pre>
      </section>
    </div>
    <div class="feedback" data-case="${c.id}">
      ${QUESTIONS.map(q => `
        <div class="question" data-key="${q.key}">
          <span class="question-label">${q.label}</span>
          <div class="toggle-group" role="group" aria-label="${q.label}">
            <button type="button" class="toggle" data-value="ja">Ja</button>
            <button type="button" class="toggle" data-value="nein">Nein</button>
          </div>
        </div>
      `).join("")}
      <p class="saved-indicator" aria-live="polite"></p>
    </div>
  `;

  const feedbackEl = article.querySelector(".feedback");
  const savedIndicator = feedbackEl.querySelector(".saved-indicator");
  const caseFeedback = feedback[c.id] || {};

  feedbackEl.querySelectorAll(".question").forEach(qEl => {
    const key = qEl.dataset.key;
    const current = caseFeedback[key];
    qEl.querySelectorAll(".toggle").forEach(btn => {
      if (btn.dataset.value === current) btn.classList.add("active");
      btn.addEventListener("click", () => {
        qEl.querySelectorAll(".toggle").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const all = loadFeedback();
        all[c.id] = all[c.id] || {};
        all[c.id][key] = btn.dataset.value;
        saveFeedback(all);
        savedIndicator.textContent = "Gespeichert (nur lokal in diesem Browser).";
      });
    });
  });

  if (Object.keys(caseFeedback).length > 0) {
    savedIndicator.textContent = "Gespeichert (nur lokal in diesem Browser).";
  }

  return article;
}

function init() {
  const container = document.getElementById("cases");
  const feedback = loadFeedback();
  CASES.forEach(c => container.appendChild(renderCase(c, feedback)));
}

init();
