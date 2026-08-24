/*
 * DOM wiring for the live "Neue Nach-Diktierung" flow. No data leaves this
 * page except audio going to the browser's own speech engine while
 * recording (see recorder.js) — the transcript and outputs stay in memory
 * only and are cleared on "Neue Session" or page reload. Nothing here is
 * persisted to localStorage.
 */

(function () {
  const els = {
    message: document.getElementById("pilot-message"),
    idle: document.getElementById("recorder-idle"),
    recording: document.getElementById("recorder-recording"),
    timer: document.getElementById("timer"),
    interim: document.getElementById("interim-transcript"),
    review: document.getElementById("transcript-review"),
    transcriptText: document.getElementById("transcript-text"),
    outputs: document.getElementById("outputs"),
    kurznotiz: document.getElementById("output-kurznotiz"),
    brief: document.getElementById("output-brief"),
    unklarBox: document.getElementById("unklar-box"),
    unklarList: document.getElementById("unklar-list"),
    btnStart: document.getElementById("btn-start"),
    btnManual: document.getElementById("btn-manual"),
    btnStop: document.getElementById("btn-stop"),
    btnCancel: document.getElementById("btn-cancel"),
    btnCompress: document.getElementById("btn-compress"),
    btnReset1: document.getElementById("btn-reset-1"),
    btnReset2: document.getElementById("btn-reset-2")
  };

  function showMessage(text, kind) {
    els.message.textContent = text;
    els.message.className = "pilot-status-message" + (kind ? ` ${kind}` : "");
  }

  function clearMessage() {
    els.message.textContent = "";
    els.message.className = "pilot-status-message";
  }

  function formatTimer(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const ss = String(totalSeconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function showOnly(section) {
    [els.idle, els.recording, els.review, els.outputs].forEach(el => {
      el.hidden = el !== section;
    });
  }

  function resetAll() {
    recorder.cancel();
    els.transcriptText.value = "";
    els.kurznotiz.value = "";
    els.brief.value = "";
    els.unklarList.innerHTML = "";
    els.unklarBox.hidden = true;
    els.timer.textContent = "00:00";
    els.interim.textContent = "";
    clearMessage();
    showOnly(els.idle);
  }

  const ERROR_MESSAGES = {
    unsupported:
      "Spracherkennung wird von diesem Browser nicht unterstützt. Bitte Chrome, Edge oder Safari verwenden, oder das Transkript manuell eingeben.",
    "not-allowed":
      "Mikrofonzugriff wurde verweigert. Bitte Zugriff erlauben oder das Transkript manuell eingeben.",
    "service-not-allowed":
      "Mikrofonzugriff wurde verweigert. Bitte Zugriff erlauben oder das Transkript manuell eingeben.",
    network:
      "Verbindungsproblem bei der Spracherkennung. Bitte erneut versuchen oder das Transkript manuell eingeben.",
    "no-speech": "Es wurde keine Sprache erkannt. Bitte erneut versuchen.",
    "start-failed":
      "Aufnahme konnte nicht gestartet werden. Bitte erneut versuchen oder das Transkript manuell eingeben.",
    unknown:
      "Bei der Aufnahme ist ein Fehler aufgetreten. Bitte erneut versuchen oder das Transkript manuell eingeben."
  };

  const recorder = createRecorder({
    onStateChange(state) {
      if (state === "recording") {
        showOnly(els.recording);
        clearMessage();
      }
    },
    onTick(elapsedMs) {
      els.timer.textContent = formatTimer(elapsedMs);
    },
    onInterim(finalSoFar, interim) {
      els.interim.textContent = [finalSoFar, interim].filter(Boolean).join(" ");
    },
    onFinal(transcript) {
      els.transcriptText.value = transcript;
      els.interim.textContent = "";
      showOnly(els.review);
    },
    onError(err) {
      showMessage(ERROR_MESSAGES[err.type] || ERROR_MESSAGES.unknown, "warning");
      showOnly(els.idle);
    }
  });

  if (!recorder.isSupported()) {
    els.btnStart.disabled = true;
    showMessage(ERROR_MESSAGES.unsupported, "warning");
  }

  els.btnStart.addEventListener("click", () => {
    clearMessage();
    recorder.start();
  });

  els.btnManual.addEventListener("click", () => {
    clearMessage();
    els.transcriptText.value = "";
    showOnly(els.review);
  });

  els.btnStop.addEventListener("click", () => recorder.stop());
  els.btnCancel.addEventListener("click", resetAll);

  els.btnCompress.addEventListener("click", () => {
    const text = els.transcriptText.value.trim();
    if (!text) {
      showMessage("Bitte zuerst ein Transkript eingeben oder aufnehmen.", "warning");
      return;
    }
    clearMessage();
    const { kurznotiz, brief, unklarItems } = compressTranscript(text);
    els.kurznotiz.value = kurznotiz;
    els.brief.value = brief;

    if (unklarItems.length > 0) {
      els.unklarList.innerHTML = "";
      unklarItems.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        els.unklarList.appendChild(li);
      });
      els.unklarBox.hidden = false;
    } else {
      els.unklarBox.hidden = true;
    }

    showOnly(els.outputs);
  });

  document.querySelectorAll(".btn-copy").forEach(btn => {
    btn.addEventListener("click", async () => {
      const target = document.getElementById(btn.dataset.target);
      const original = btn.textContent;
      try {
        await navigator.clipboard.writeText(target.value);
        btn.textContent = "Kopiert";
      } catch (err) {
        target.select();
        try {
          document.execCommand("copy");
          btn.textContent = "Kopiert";
        } catch (fallbackErr) {
          btn.textContent = "Bitte manuell kopieren";
        }
      }
      setTimeout(() => {
        btn.textContent = original;
      }, 1800);
    });
  });

  els.btnReset1.addEventListener("click", resetAll);
  els.btnReset2.addEventListener("click", resetAll);

  resetAll();
})();
