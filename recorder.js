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
  let state = "idle"; // idle | recording | stopping | stopped
  let startedAt = null;
  let timerHandle = null;
  let finishFallbackHandle = null;
  let finalTranscript = "";
  let latestInterim = "";
  let userInitiatedStop = false;
  let cancelled = false;
  let finished = false;

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

  function clearFinishFallback() {
    if (finishFallbackHandle) {
      clearTimeout(finishFallbackHandle);
      finishFallbackHandle = null;
    }
  }

  function start() {
    if (!supported) {
      onError({ type: "unsupported" });
      return;
    }
    if (state === "recording" || state === "stopping") return;

    finalTranscript = "";
    latestInterim = "";
    userInitiatedStop = false;
    cancelled = false;
    finished = false;
    clearFinishFallback();

    recognition = new SpeechRecognitionImpl();
    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      if (finished || cancelled) return;

      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece + " ";
        } else {
          interim += transcriptPiece;
        }
      }

      latestInterim = interim.trim();
      onInterim(finalTranscript.trim(), latestInterim);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" && (userInitiatedStop || cancelled)) return;
      if (finished || cancelled) return;

      clearFinishFallback();
      stopTimer();
      setState("idle");
      onError({ type: event.error || "unknown" });
    };

    recognition.onend = () => {
      stopTimer();
      if (cancelled || finished) return;

      if (state === "recording" || state === "stopping") {
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

  function composedTranscript() {
    return [finalTranscript.trim(), latestInterim.trim()]
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  function finish() {
    if (finished || cancelled) return;

    finished = true;
    clearFinishFallback();
    stopTimer();

    const transcript = composedTranscript();
    if (!transcript) {
      setState("idle");
      onError({ type: "no-speech" });
      return;
    }

    setState("stopped");
    onFinal(transcript);
  }

  function stop() {
    if (state !== "recording" || !recognition) return;

    userInitiatedStop = true;
    setState("stopping");

    try {
      recognition.stop();

      // SpeechRecognition implementations do not all finalize synchronously.
      // Wait for final onresult/onend events, but fail safe to the best text
      // already visible to the user if a browser never emits onend.
      finishFallbackHandle = setTimeout(() => {
        if (!finished && !cancelled && state === "stopping") finish();
      }, 1000);
    } catch (err) {
      // Preserve the best recognized text rather than dropping a visible
      // interim transcript if stop() itself fails on a browser edge case.
      finish();
    }
  }

  function cancel() {
    cancelled = true;
    userInitiatedStop = true;
    clearFinishFallback();

    if (recognition) {
      try {
        recognition.abort();
      } catch (err) {
        /* no-op: recognition may already be stopped */
      }
    }

    finalTranscript = "";
    latestInterim = "";
    startedAt = null;
    finished = false;
    stopTimer();
    setState("idle");
  }

  return { start, stop, cancel, isSupported: () => supported };
}
