import { useEffect, useMemo, useState } from "react";
import { listInterviews, createInterview, updateInterview, deleteInterview } from "../api/interviews";
import type { Interview } from "../types/interview";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import InterviewForm from "../components/InterviewForm";

// Hard-coded owner to satisfy RLS
const OWNER_USERNAME = "s4828221";

// Form payload from InterviewForm
type InterviewFormInput = {
  title: string;
  job_role: string;
  description: string;
  status: "Published" | "Draft" | "Archived";
  username?: string; // we inject this on create
};
type InterviewUpdate = Partial<Omit<InterviewFormInput, "username">>;

function errMsg(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function InterviewsPage() {
  const [items, setItems] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<Interview | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Interview | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch and refresh the list of interviews
  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await listInterviews();
      setItems(data);
    } catch (e: unknown) {
      setError(errMsg(e, "Failed to load"));
    } finally {
      setLoading(false);
    }
  }
  // Run once on mount to load interviews
  useEffect(() => {
    void refresh();
  }, []);

  // Memoized count of published interviews
  const totalPublished = useMemo(
    () => items.filter((i) => i.status === "Published").length,
    [items]
  );

  // Render
  return (
    <div className="grid gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Interviews</h1>
          <p className="text-slate-600 text-sm">Manage the interviews you publish to applicants.</p>
          <p className="text-xs text-slate-500 mt-1">
            {items.length} total • {totalPublished} published
          </p>
        </div>
        <button
          onClick={() => setOpenCreate(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
        >
          + New Interview
        </button>
      </div>

      {loading && <div className="animate-pulse text-slate-500">Loading interviews…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="grid gap-3">
          {items.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="[&>th]:py-3 [&>th]:px-4 text-left">
                    <th>Title</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th className="w-40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="[&>td]:py-3 [&>td]:px-4 border-t">
                      <td className="font-medium">{it.title}</td>
                      <td className="text-slate-600">{it.job_role}</td>
                      <td>
                        <span
                          className={
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs " + badgeClass(it.status)
                          }
                        >
                          {it.status}
                        </span>
                      </td>
                      <td className="text-slate-600">{it.username}</td>
                      <td className="flex gap-2">
                        <button
                          className="rounded-lg border px-3 py-1 hover:bg-slate-50"
                          onClick={() => setEditing(it)}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-lg bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                          onClick={() => setPendingDelete(it)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create */}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Create Interview">
        <InterviewForm
          // Prefill + gray-out username inside the form (form makes it readOnly)
          initial={{ username: OWNER_USERNAME } as Partial<Interview>}
          submitting={submitting}
          onSubmit={async (payload: InterviewFormInput) => {
            setSubmitting(true);
            try {
              await createInterview({ ...payload, username: OWNER_USERNAME });
              setOpenCreate(false);
              await refresh();
            } catch (e: unknown) {
              alert(errMsg(e, "Failed to create interview"));
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </Modal>

      {/* Edit */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Interview">
        {editing && (
          <InterviewForm
            initial={editing}
            submitting={submitting}
            onSubmit={async (changes: InterviewUpdate) => {
              setSubmitting(true);
              try {
                await updateInterview(editing.id, changes);
                setEditing(null);
                await refresh();
              } catch (e: unknown) {
                alert(errMsg(e, "Failed to update interview"));
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
        title="Delete interview"
        message={`This will permanently delete "${pendingDelete?.title ?? ""}".`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteInterview(pendingDelete.id);
            setPendingDelete(null);
            await refresh();
          } catch (e: unknown) {
            alert(errMsg(e, "Failed to delete"));
          }
        }}
      />
    </div>
  );
}

function Empty() {
  return (
    <div className="grid place-items-center rounded-2xl border bg-white py-16 text-center text-slate-600">
      <div className="max-w-md">
        <div className="text-3xl mb-2">🗂️</div>
        <p className="mb-4">No interviews yet. Create your first interview to get started.</p>
        <p className="text-xs">Use the “New Interview” button above.</p>
      </div>
    </div>
  );
}

function badgeClass(status: Interview["status"]) {
  switch (status) {
    case "Published":
      return "bg-green-100 text-green-700 border border-green-200";
    case "Draft":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    case "Archived":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}
