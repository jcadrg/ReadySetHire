import { useEffect, useMemo, useState } from "react";
import { listInterviews } from "../api/interviews";
import { createQuestion, deleteQuestion, listQuestions, updateQuestion } from "../api/questions";
import type { Interview } from "../types/interview";
import type { Question } from "../types/question";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import QuestionForm from "../components/QuestionForm";
import { aiSuggestQuestions } from "../api/genai";

type Difficulty = Question["difficulty"];

type QuestionCreateInput = {
  question: string;
  difficulty: Difficulty;
  username?: string;
};
type QuestionUpdateInput = Partial<Omit<QuestionCreateInput, "username">>;

function errMsg(err: unknown) {
  return err instanceof Error ? err.message : "Unexpected error";
}

export default function QuestionsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [items, setItems] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Question | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // AI suggest questions
  const [openAISuggest, setOpenAISuggest] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOut, setAiOut] = useState<string[]>([]);

  // Load interviews once on mount
  useEffect(() => {
    async function loadInterviews() {
      try {
        const data = await listInterviews();
        setInterviews(data);
        if (data.length && selectedId == null) setSelectedId(data[0].id);
      } catch (err: unknown) {
        alert(errMsg(err));
      }
    }
    void loadInterviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load questions when selected interview changes
  useEffect(() => {
    if (selectedId == null) return;
    void refresh(selectedId);
  }, [selectedId]);

  async function refresh(interviewId: number) {
    setLoading(true);
    setError(null);
    try {
      const data = await listQuestions(interviewId);
      setItems(data);
    } catch (e: unknown) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }
  
  // Memoized selected interview
  const selectedInterview = useMemo(
    () => interviews.find((i) => i.id === selectedId) ?? null,
    [interviews, selectedId]
  );

  return (
    <div className="grid gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Questions</h1>
          <p className="text-slate-600 text-sm">Manage questions for a specific interview.</p>
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
            + New Question
          </button>
          <button className="rounded-lg border px-3 py-2" onClick={() => setOpenAISuggest(true)}>
            ⚡ AI Suggest
          </button>
        </div>
      </div>

      {selectedInterview == null && (
        <div className="rounded-2xl border bg-white p-6 text-slate-600">
          Select an interview to view and manage its questions.
        </div>
      )}

      {selectedInterview && (
        <>
          {loading && <div className="animate-pulse text-slate-500">Loading questions…</div>}
          {error && <div className="text-red-600">{error}</div>}

          {!loading && !error && (
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="[&>th]:py-3 [&>th]:px-4 text-left">
                    <th>Question</th>
                    <th>Difficulty</th>
                    <th>Owner</th>
                    <th className="w-40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((q) => (
                    <tr key={q.id} className="[&>td]:py-3 [&>td]:px-4 border-t">
                      <td className="max-w-xl">{q.question}</td>
                      <td>
                        <span
                          className={
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs " + badgeClass(q.difficulty)
                          }
                        >
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="text-slate-600">{q.username}</td>
                      <td className="flex gap-2">
                        <button className="rounded-lg border px-3 py-1 hover:bg-slate-50" onClick={() => setEditing(q)}>
                          Edit
                        </button>
                        <button
                          className="rounded-lg bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                          onClick={() => setPendingDelete(q)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {items.length === 0 && (
                <div className="px-4 py-12 text-center text-slate-600">
                  No questions yet for <strong>{selectedInterview.title}</strong> — add your first one.
                </div>
              )}
            </div>
          )}

          {/* Create */}
          <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Create Question">
            <QuestionForm
              submitting={submitting}
              onSubmit={async (payload: QuestionCreateInput) => {
                if (selectedId == null) return;
                setSubmitting(true);
                try {
                  await createQuestion({
                    ...payload,
                    interview_id: selectedId,
                  });
                  setOpenCreate(false);
                  await refresh(selectedId);
                } catch (e: unknown) {
                  alert(errMsg(e));
                } finally {
                  setSubmitting(false);
                }
              }}
            />
          </Modal>

          {/* Edit */}
          <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Question">
            {editing && (
              <QuestionForm
                initial={editing}
                submitting={submitting}
                onSubmit={async (changes: QuestionUpdateInput) => {
                  setSubmitting(true);
                  try {
                    await updateQuestion(editing.id, changes);
                    setEditing(null);
                    if (selectedId != null) await refresh(selectedId);
                  } catch (e: unknown) {
                    alert(errMsg(e));
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
            title="Delete question"
            message={`This will permanently delete the selected question.`}
            onCancel={() => setPendingDelete(null)}
            onConfirm={async () => {
              if (!pendingDelete || selectedId == null) return;
              try {
                await deleteQuestion(pendingDelete.id);
                setPendingDelete(null);
                await refresh(selectedId);
              } catch (e: unknown) {
                alert(errMsg(e));
              }
            }}
          />

          {/* AI Suggest */}
          <Modal
            open={openAISuggest}
            onClose={() => {
              setOpenAISuggest(false);
              setAiOut([]);
            }}
            title="AI Suggest Questions"
          >
            <form
              className="grid gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedInterview) return;

                const form = e.currentTarget as HTMLFormElement;
                const formData = new FormData(form);

                const difficulty = (formData.get("difficulty") as Difficulty | null) ?? "Intermediate";
                const countRaw = formData.get("count");
                const count = typeof countRaw === "string" ? Number(countRaw) : 5;

                setAiLoading(true);
                try {
                  const { questions } = await aiSuggestQuestions({
                    jobRole: String(formData.get("jobRole") ?? selectedInterview.job_role ?? ""),
                    description: String(formData.get("description") ?? selectedInterview.description ?? ""),
                    difficulty,
                    count: Number.isFinite(count) ? count : 5,
                  });
                  setAiOut(questions);
                } finally {
                  setAiLoading(false);
                }
              }}
            >
              <input
                name="jobRole"
                className="input"
                placeholder="Job role (e.g., Front-end Developer)"
                defaultValue={selectedInterview?.job_role ?? ""}
                required
              />
              <textarea
                name="description"
                className="input min-h-[80px]"
                placeholder="Context (tech stack, seniority, focus areas)"
                defaultValue={selectedInterview?.description ?? ""}
              />
              <div className="flex gap-2">
                <select name="difficulty" className="input" defaultValue="Intermediate">
                  <option>Easy</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
                <input type="number" name="count" min={1} max={10} defaultValue={5} className="input w-24" />
              </div>
              <button className="rounded bg-slate-900 text-white px-4 py-2 disabled:opacity-50" disabled={aiLoading}>
                {aiLoading ? "Thinking…" : "Generate"}
              </button>
            </form>

            {aiOut.length > 0 && (
              <div className="mt-4 grid gap-2">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm text-slate-600">{aiOut.length} suggestion(s)</div>
                  <button
                    className="text-xs rounded border px-2 py-1"
                    onClick={async () => {
                      if (selectedId == null) return;
                      await Promise.all(
                        aiOut.map((q) =>
                          createQuestion({
                            interview_id: selectedId,
                            question: q,
                            difficulty: "Intermediate",
                            username: "s4828221",
                          })
                        )
                      );
                      setOpenAISuggest(false);
                      setAiOut([]);
                      await refresh(selectedId);
                    }}
                  >
                    Add all
                  </button>
                </div>

                {aiOut.map((q, i) => (
                  <div key={i} className="rounded border bg-white p-3 flex items-center gap-2">
                    <span className="text-slate-600 text-xs w-6">{i + 1}.</span>
                    <span className="flex-1">{q}</span>
                    <button
                      className="rounded border px-2 py-1 text-xs"
                      onClick={async () => {
                        if (selectedId == null) return;
                        await createQuestion({
                          interview_id: selectedId,
                          question: q,
                          difficulty: "Intermediate",
                          username: "s4828221",
                        });
                        await refresh(selectedId);
                      }}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Modal>
        </>
      )}
    </div>
  );
}

function badgeClass(difficulty: Question["difficulty"]) {
  switch (difficulty) {
    case "Easy":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Intermediate":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "Advanced":
      return "bg-rose-100 text-rose-700 border border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}
