import { useEffect, useMemo, useState } from "react";
import { listInterviews } from "../api/interviews";
import {
  createApplicant,
  deleteApplicant,
  listApplicants,
  updateApplicant,
} from "../api/applicants";
import type { Interview } from "../types/interview";
import type { Applicant } from "../types/applicant";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import ApplicantForm from "../components/ApplicantForm";
import { listQuestions } from "../api/questions";
import { listAnswersByApplicant } from "../api/applicantAnswers";
import { aiSummarizeAnswers } from "../api/genai";

// 🔒 Hard-coded owner to satisfy RLS
const OWNER_USERNAME = "s4828221";

// Narrow helper to render errors without using `any`
function errMsg(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

// Shape that the ApplicantForm yields on submit
type ApplicantFormInput = {
  title: string;
  firstname: string;
  surname: string;
  phone_number?: string | null;
  email_address: string;
  interview_status: "Not Started" | "Completed";
};

// Narrow update shape (what we pass to updateApplicant)
type ApplicantUpdate = Partial<ApplicantFormInput>;

export default function ApplicantsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [items, setItems] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<Applicant | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Applicant | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // AI summary UI state
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await listInterviews();
        setInterviews(data);
        if (data.length && selectedId == null) setSelectedId(data[0].id);
      } catch (e: unknown) {
        // keep silent here; page has its own error area
        console.error(e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId == null) return;
    void refresh(selectedId);
  }, [selectedId]);

  async function refresh(interviewId: number) {
    setLoading(true);
    setError(null);
    try {
      const data = await listApplicants(interviewId);
      setItems(data);
    } catch (e: unknown) {
      setError(errMsg(e, "Failed to load applicants"));
    } finally {
      setLoading(false);
    }
  }

  const selectedInterview = useMemo(
    () => interviews.find((i) => i.id === selectedId) ?? null,
    [interviews, selectedId]
  );

  function inviteUrlFor(app: Applicant) {
    const url = new URL(window.location.origin + "/take");
    url.searchParams.set("interview_id", String(app.interview_id));
    url.searchParams.set("applicant_id", String(app.id));
    return url.toString();
  }

  async function copyInvite(app: Applicant) {
    const url = inviteUrlFor(app);
    await navigator.clipboard.writeText(url);
    alert("Invite link copied to clipboard:\n\n" + url);
  }

  async function summarize(applicant: Applicant, interviewId: number) {
    setAiBusy(true);
    setSummary(null);
    setSummaryOpen(true);
    try {
      const [answers, questions] = await Promise.all([
        listAnswersByApplicant(applicant.id),
        listQuestions(interviewId),
      ]);

      // Join Q&A for the model
      const qa = questions.map((q) => ({
        question: q.question,
        answer: answers.find((a) => a.question_id === q.id)?.answer ?? null,
      }));

      const jobRole = selectedInterview?.job_role ?? "Candidate";
      const result = await aiSummarizeAnswers({
        jobRole,
        answers: qa,
      });

      setSummary(result.summary);
    } catch (e: unknown) {
      setSummary(`Failed to summarize: ${errMsg(e, "Unknown error")}`);
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Applicants</h1>
          <p className="text-slate-600 text-sm">
            Manage applicants for a specific interview and share invite links.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input"
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(Number(e.target.value))}
          >
            {interviews.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title} — {i.job_role}
              </option>
            ))}
          </select>
          <button
            onClick={() => setOpenCreate(true)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
            disabled={selectedId == null}
          >
            + New Applicant
          </button>
        </div>
      </div>

      {selectedInterview == null && (
        <div className="rounded-2xl border bg-white p-6 text-slate-600">
          Select an interview to view and manage its applicants.
        </div>
      )}

      {selectedInterview && (
        <>
          {loading && (
            <div className="animate-pulse text-slate-500">
              Loading applicants…
            </div>
          )}
          {error && <div className="text-red-600">{error}</div>}

          {!loading && !error && (
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="[&>th]:py-3 [&>th]:px-4 text-left">
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th className="w-[360px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => (
                    <tr key={a.id} className="[&>td]:py-3 [&>td]:px-4 border-t">
                      <td className="font-medium">
                        {a.title} {a.firstname} {a.surname}
                      </td>
                      <td className="text-slate-600">{a.email_address}</td>
                      <td className="text-slate-600">
                        {a.phone_number ?? "—"}
                      </td>
                      <td>
                        <span
                          className={
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs " +
                            (a.interview_status === "Completed"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200")
                          }
                        >
                          {a.interview_status}
                        </span>
                      </td>
                      <td className="text-slate-600">{a.username}</td>
                      <td className="flex flex-wrap gap-2">
                        <button
                          className="rounded-lg border px-3 py-1 hover:bg-slate-50"
                          onClick={() => setEditing(a)}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-lg bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700"
                          onClick={() => void copyInvite(a)}
                        >
                          Copy Invite Link
                        </button>
                        <button
                          className="rounded-lg bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                          onClick={() => setPendingDelete(a)}
                        >
                          Delete
                        </button>
                        <button
                          className="rounded-lg border px-3 py-1 hover:bg-slate-50"
                          onClick={() => void summarize(a, a.interview_id)}
                        >
                          Summarize
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {items.length === 0 && (
                <div className="px-4 py-12 text-center text-slate-600">
                  No applicants for <strong>{selectedInterview.title}</strong>{" "}
                  yet — add your first one.
                </div>
              )}
            </div>
          )}

          {/* Create */}
          <Modal
            open={openCreate}
            onClose={() => setOpenCreate(false)}
            title="Create Applicant"
          >
            <ApplicantForm
              submitting={submitting}
              onSubmit={async (payload: ApplicantFormInput) => {
                if (selectedId == null) return;
                setSubmitting(true);
                try {
                  await createApplicant({
                    ...payload,
                    interview_id: selectedId,
                    username: OWNER_USERNAME,
                  });
                  setOpenCreate(false);
                  await refresh(selectedId);
                } catch (e: unknown) {
                  alert(errMsg(e, "Failed to create applicant"));
                } finally {
                  setSubmitting(false);
                }
              }}
            />
          </Modal>

          {/* Edit */}
          <Modal
            open={!!editing}
            onClose={() => setEditing(null)}
            title="Edit Applicant"
          >
            {editing && (
              <ApplicantForm
                initial={editing}
                submitting={submitting}
                onSubmit={async (changes: ApplicantUpdate) => {
                  setSubmitting(true);
                  try {
                    await updateApplicant(editing.id, changes);
                    setEditing(null);
                    if (selectedId != null) await refresh(selectedId);
                  } catch (e: unknown) {
                    alert(errMsg(e, "Failed to update applicant"));
                  } finally {
                    setSubmitting(false);
                  }
                }}
              />
            )}
          </Modal>

          {/* Delete */}
          <ConfirmDialog
            open={!!pendingDelete}
            title="Delete applicant"
            message={`This will permanently delete the selected applicant.`}
            onCancel={() => setPendingDelete(null)}
            onConfirm={async () => {
              if (!pendingDelete || selectedId == null) return;
              try {
                await deleteApplicant(pendingDelete.id);
                setPendingDelete(null);
                await refresh(selectedId);
              } catch (e: unknown) {
                alert(errMsg(e, "Failed to delete"));
              }
            }}
          />

          {/* AI Summary Modal */}
          <Modal
            open={summaryOpen}
            onClose={() => {
              setSummaryOpen(false);
              setSummary(null);
            }}
            title="AI Summary"
          >
            {aiBusy && (
              <div className="text-slate-600">Summarizing answers…</div>
            )}
            {!aiBusy && (
              <div className="grid gap-3">
                {summary ? (
                  <pre className="whitespace-pre-wrap text-sm text-slate-800 rounded border bg-white p-3">
                    {summary}
                  </pre>
                ) : (
                  <div className="text-slate-600 text-sm">
                    No summary available.
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    className="rounded-lg border px-3 py-1 hover:bg-slate-50"
                    onClick={() => {
                      if (summary) void navigator.clipboard.writeText(summary);
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </Modal>
        </>
      )}
    </div>
  );
}
