/*
 * Thin wrapper around the browser's native SpeechRecognition API.
 * No audio is ever captured or stored by this code — the browser streams
 * audio directly to its own speech engine and only text results come back
 * here. Nothing is persisted; state lives only in memory for this session.
 */

function createRecorder({ onInterim, onFinal, onStateChange, onError, onTick }) {
  const SpeechRecognitionImpl =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  let recognition = null;
  let state = "idle"; // idle | recording | stopped
  let startedAt = null;
  let timerHandle = null;
  let finalTranscript = "";
  let userInitiatedStop = false;

  const supported = Boolean(SpeechRecognitionImpl);

  function setState(next) {
    state = next;
    onStateChange(state);
  }

  function tick() {
    if (!startedAt) return;
    const elapsedMs = Date.now() - startedAt;
    onTick(elapsedMs);
  }

  function start() {
    if (!supported) {
      onError({ type: "unsupported" });
      return;
    }
    if (state === "recording") return;

    finalTranscript = "";
    userInitiatedStop = false;
    recognition = new SpeechRecognitionImpl();
    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece + " ";
        } else {
          interim += transcriptPiece;
        }
      }
      onInterim(finalTranscript.trim(), interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" && userInitiatedStop) return;
      onError({ type: event.error || "unknown" });
      stopTimer();
      setState("idle");
    };

    recognition.onend = () => {
      stopTimer();
      if (state === "recording" && !userInitiatedStop) {
        // Browser ended recognition on its own (silence timeout etc.) —
        // treat like a normal stop so the user still gets their transcript.
        finish();
      }
    };

    try {
      recognition.start();
      startedAt = Date.now();
      timerHandle = setInterval(tick, 250);
      setState("recording");
    } catch (err) {
      onError({ type: "start-failed" });
    }
  }

  function stopTimer() {
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
  }

  function finish() {
    stopTimer();
    setState("stopped");
    onFinal(finalTranscript.trim());
  }

  function stop() {
    if (state !== "recording" || !recognition) return;
    userInitiatedStop = true;
    recognition.stop();
    finish();
  }

  function cancel() {
    if (recognition) {
      userInitiatedStop = true;
      try {
        recognition.abort();
      } catch (err) {
        /* no-op: recognition may already be stopped */
      }
    }
    finalTranscript = "";
    startedAt = null;
    stopTimer();
    setState("idle");
  }

  return { start, stop, cancel, isSupported: () => supported };
}
