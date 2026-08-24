const STORAGE_KEY = "frame-gerrit-feedback-v1";
const QUESTIONS = [
  { key: "korrekt", label: "Fachlich korrekt?" },
  { key: "uebernehmbar", label: "Direkt übernehmbar?" },
  { key: "wiedereinstieg", label: "Hilft beim Wiedereinstieg?" }
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

function renderCase(c, feedback) {
  const article = document.createElement("article");
  article.className = "case-card";
  article.innerHTML = `
    <h2>${c.title}</h2>
    <div class="case-columns">
      <section class="col">
        <h3>Input</h3>
        <pre class="text-block">${c.input}</pre>
      </section>
      <section class="col">
        <h3>Lemmiscus-Kurznotiz</h3>
        <pre class="text-block">${highlightUnklar(c.note)}</pre>
      </section>
      <section class="col">
        <h3>Next Session Brief</h3>
        <pre class="text-block">${highlightUnklar(c.brief)}</pre>
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
