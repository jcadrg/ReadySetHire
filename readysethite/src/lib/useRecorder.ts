/**
 * useRecorder - minimal audio recorder using MediaRecorder
 * - allows pause/resume
 * - single recording per question (can't restart once stopped)
 */
import { useEffect, useRef, useState } from "react";

type RecorderState = "idle" | "recording" | "paused" | "stopped";

export function useRecorder() {
  const mediaStream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  async function start() {
    try {
      setError(null);
      chunks.current = [];
      setBlob(null);
      mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder.current = new MediaRecorder(mediaStream.current);
      recorder.current.ondataavailable = (e) => e.data && chunks.current.push(e.data);
      recorder.current.onstop = () => {
        const out = new Blob(chunks.current, { type: "audio/webm" });
        setBlob(out);
        mediaStream.current?.getTracks().forEach((t) => t.stop());
        mediaStream.current = null;
      };
      recorder.current.start();
      setState("recording");
    } catch (e: any) {
      setError(e?.message ?? "Failed to access microphone");
    }
  }

  function pause() {
    if (recorder.current && state === "recording") {
      recorder.current.pause();
      setState("paused");
    }
  }

  function resume() {
    if (recorder.current && state === "paused") {
      recorder.current.resume();
      setState("recording");
    }
  }

  // Stop cannot be restarted; caller should enforce single use per question
  function stop() {
    if (recorder.current && (state === "recording" || state === "paused")) {
      recorder.current.stop();
      setState("stopped");
    }
  }

  function reset() {
    // Only used if we want to allow re-attempt (we won't expose in UI)
    setBlob(null);
    setState("idle");
  }

  useEffect(() => {
    return () => {
      if (recorder.current && recorder.current.state !== "inactive") {
        try { recorder.current.stop(); } catch {}
      }
      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach((t) => {
          try { t.stop(); } catch {}
        });
      }
    };
  }, []);

  return { state, error, blob, start, pause, resume, stop, reset };
}
