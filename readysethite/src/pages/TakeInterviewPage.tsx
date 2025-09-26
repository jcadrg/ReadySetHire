import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { listInterviews } from "../api/interviews";
import { listQuestions } from "../api/questions";
import { listApplicants, updateApplicant } from "../api/applicants";
import { createAnswer } from "../api/applicantAnswers";
import type { Interview } from "../types/interview";
import type { Question } from "../types/question";
import type { Applicant } from "../types/applicant";
import { useRecorder } from "../lib/useRecorder";

// owner to satisfy RLS (my student id)
const OWNER_USERNAME = "s4828221";

// Optional: your Node transcriber endpoint (FormData {audio})
const TRANSCRIBE_URL =
  (import.meta as any).env?.VITE_TRANSCRIBE_URL || "http://localhost:8080/api/transcribe";

export default function TakeInterviewPage() {
  // read optional route params /take/:interviewId/:applicantId
  const { interviewId: pInt, applicantId: pApp } = useParams();
  const [search] = useSearchParams();

  // initial ids (from params or query), may be NaN
  const initialInterviewId = Number(pInt ?? search.get("interview_id"));
  const initialApplicantId = Number(pApp ?? search.get("applicant_id"));

  // selector UI state (we use these when params are missing/invalid)
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterviewId, setSelectedInterviewId] = useState<number | null>(
    Number.isFinite(initialInterviewId) ? initialInterviewId : null
  );
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedApplicantId, setSelectedApplicantId] = useState<number | null>(
    Number.isFinite(initialApplicantId) ? initialApplicantId : null
  );

  // content state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [idx, setIdx] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [transcript, setTranscript] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { state, error: recErr, blob, start, pause, resume, stop } = useRecorder();

  const current = useMemo(() => questions[idx] ?? null, [questions, idx]);
  const isLast = idx === questions.length - 1;

  // Load all interviews once
  useEffect(() => {
    (async () => {
      try {
        const data = await listInterviews();
        setInterviews(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load interviews");
      }
    })();
  }, []);

  // Whenever interview is chosen, load its applicants + questions
  useEffect(() => {
    if (selectedInterviewId == null) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [apps, qs] = await Promise.all([
          listApplicants(selectedInterviewId),
          listQuestions(selectedInterviewId),
        ]);
        setApplicants(apps);
        setQuestions(qs);

        // auto-attach applicant if id was provided in URL and exists
        if (selectedApplicantId && !apps.find((a) => a.id === selectedApplicantId)) {
          setSelectedApplicantId(null);
        }
        // attach applicant if not yet chosen but there is only one
        if (!selectedApplicantId && apps.length === 1) {
          setSelectedApplicantId(apps[0].id);
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to load interview data");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedInterviewId]);

  // Attach the selected applicant object
  useEffect(() => {
    if (!selectedInterviewId || !selectedApplicantId) {
      setApplicant(null);
      return;
    }
    const a = applicants.find((x) => x.id === selectedApplicantId) || null;
    setApplicant(a);
  }, [selectedApplicantId, applicants, selectedInterviewId]);

  // Try to initialize from URL immediately (if ids valid)
  useEffect(() => {
    // guard: NaN becomes null
    const iId = Number.isFinite(initialInterviewId) ? initialInterviewId : null;
    const aId = Number.isFinite(initialApplicantId) ? initialApplicantId : null;
    if (iId != null) setSelectedInterviewId(iId);
    if (aId != null) setSelectedApplicantId(aId);
    // prevent back nav during flow
    window.history.pushState(null, "", window.location.href);
    const onPop = () => {
      window.history.pushState(null, "", window.location.href);
      alert("You cannot go back during the interview.");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function transcribeAudio(aBlob: Blob): Promise<string> {
    const fd = new FormData();
    fd.append("audio", aBlob, "answer.webm");
    const res = await fetch(TRANSCRIBE_URL, { method: "POST", body: fd });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Transcription failed: ${res.status} ${txt}`);
    }
    const data = await res.json().catch(() => ({}));
    return data.text ?? "";
  }

  async function handleSubmit() {
    if (!current || !applicant || !selectedInterviewId) return;
    setSaving(true);
    try {
      let text = transcript;
      if (!text && blob) {
        text = await transcribeAudio(blob);
      }
      await createAnswer({
        interview_id: selectedInterviewId,
        question_id: current.id,
        applicant_id: applicant.id,
        answer: text || null,
        username: OWNER_USERNAME,
      });
      setSubmitted(true);
      if (!isLast) {
        setTimeout(() => {
          setTranscript("");
          setSubmitted(false);
          setIdx((i) => i + 1);
        }, 400);
      } else {
        await updateApplicant(applicant.id, { interview_status: "Completed" });
      }
    } catch (e: any) {
      alert(e?.message ?? "Failed to save answer");
    } finally {
      setSaving(false);
    }
  }

  // If we’re missing selection, show the picker instead of the flow
  const needsSelection =
    !selectedInterviewId ||
    !Number.isFinite(selectedInterviewId) ||
    !selectedApplicantId ||
    !Number.isFinite(selectedApplicantId);

  if (needsSelection) {
    return (
      <div className="mx-auto max-w-3xl p-6 grid gap-6">
        <h1 className="text-2xl font-bold">Take Interview</h1>
        <div className="rounded-2xl border bg-white p-6 grid gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Select interview</label>
            <select
              value={selectedInterviewId ?? ""}
              onChange={(e) => {
                setSelectedInterviewId(e.target.value ? Number(e.target.value) : null);
                setIdx(0);
                setSelectedApplicantId(null);
                setQuestions([]);
                setApplicants([]);
              }}
              className="input"
            >
              <option value="">— Choose interview —</option>
              {interviews.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title} — {i.job_role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Select applicant</label>
            <select
              value={selectedApplicantId ?? ""}
              onChange={(e) => setSelectedApplicantId(e.target.value ? Number(e.target.value) : null)}
              className="input"
              disabled={!selectedInterviewId || applicants.length === 0}
            >
              <option value="">— Choose applicant —</option>
              {applicants.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} {a.firstname} {a.surname} ({a.email_address})
                </option>
              ))}
            </select>
          </div>

          {selectedInterviewId && applicants.length === 0 && !loading && (
            <div className="text-sm text-slate-600">
              No applicants found for this interview. Please add one first.
            </div>
          )}

          {selectedInterviewId && questions.length === 0 && !loading && (
            <div className="text-sm text-slate-600">
              This interview has no questions. Add questions before starting.
            </div>
          )}

          <div className="flex justify-end">
            <button
              className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
              disabled={!selectedInterviewId || !selectedApplicantId || questions.length === 0}
              onClick={() => {
                // start the flow → just render below by clearing any error flags
                setError(null);
              }}
            >
              Start
            </button>
          </div>
        </div>
      </div>
    );
  }

  // regular flow
  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!applicant || questions.length === 0)
    return <div className="p-6">Interview not found or has no questions.</div>;

  return (
    <div className="grid gap-6 max-w-3xl mx-auto p-6">
      {idx === 0 && (
        <div className="rounded-2xl border bg-white p-6">
          <h1 className="text-xl font-semibold mb-2">
            Welcome, {applicant.title} {applicant.firstname} {applicant.surname}
          </h1>
          <p className="text-sm text-slate-600">
            You will answer <strong>{questions.length}</strong> question(s). Each page records your
            spoken answer and sends a transcript.
          </p>
          <ul className="text-sm text-slate-600 list-disc pl-5 mt-2">
            <li>One question per page.</li>
            <li>You may pause/resume the recorder.</li>
            <li>Once you stop recording, you cannot re-record this question.</li>
            <li>Do not use the browser back button.</li>
          </ul>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Question {idx + 1} / {questions.length}
          </h2>
        </div>
        <p className="mb-4 whitespace-pre-wrap">{current?.question}</p>

        {/* Recorder */}
        <div className="grid gap-2 rounded-lg border p-3 bg-slate-50">
          <div className="flex gap-2">
            {state === "idle" && (
              <button className="rounded bg-slate-900 px-3 py-1 text-white" onClick={start}>
                Start Recording
              </button>
            )}
            {state === "recording" && (
              <>
                <button className="rounded border px-3 py-1" onClick={pause}>
                  Pause
                </button>
                <button className="rounded bg-red-600 px-3 py-1 text-white" onClick={stop}>
                  Stop
                </button>
              </>
            )}
            {state === "paused" && (
              <>
                <button className="rounded border px-3 py-1" onClick={resume}>
                  Resume
                </button>
                <button className="rounded bg-red-600 px-3 py-1 text-white" onClick={stop}>
                  Stop
                </button>
              </>
            )}
            {state === "stopped" && (
              <span className="text-xs text-slate-600">Recording captured.</span>
            )}
          </div>
          {recErr && <div className="text-red-600 text-sm">{recErr}</div>}
          {/* Playback */}
          {/* biome-ignore lint/a11y/useMediaCaption: dev tool */}
          {blob && <audio controls src={URL.createObjectURL(blob)} className="mt-2" />}
        </div>

        {/* Manual transcript fallback */}
        <label className="grid gap-1 text-sm mt-4">
          <span className="text-slate-600">Transcript (optional)</span>
          <textarea
            className="input min-h-[120px]"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="If transcription is unavailable, you may paste or type your answer."
          />
        </label>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={saving || submitted}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isLast ? (submitted ? "Saved" : "Submit & Finish") : submitted ? "Saved" : "Submit & Next"}
          </button>
        </div>
      </div>

      {isLast && submitted && (
        <div className="rounded-2xl border bg-white p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Thank you for completing the interview!</h3>
          <p className="text-slate-600 text-sm">Your responses have been recorded.</p>
        </div>
      )}
    </div>
  );
}
