import { useEffect, useState } from "react";
import type { Interview, InterviewCreate, InterviewStatus } from "../types/interview";

const statuses: InterviewStatus[] = ["Published", "Draft", "Archived"];

export default function InterviewForm({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: Partial<Interview>;
  onSubmit: (data: InterviewCreate | Partial<Interview>) => void;
  submitting?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [jobRole, setJobRole] = useState(initial?.job_role ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<InterviewStatus>(
    (initial?.status as InterviewStatus) ?? "Draft"
  );
  const [username, setUsername] = useState(initial?.username ?? "");
  // Reset form when initial changes (e.g. when editing a different item)
  useEffect(() => {
    if (initial) {
      setTitle(initial.title ?? "");
      setJobRole(initial.job_role ?? "");
      setDescription(initial.description ?? "");
      setStatus((initial.status as InterviewStatus) ?? "Draft");
      setUsername(initial.username ?? "");
    }
  }, [initial]);

  const valid =
    title.trim() && jobRole.trim() && status && username.trim();
  // render
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({
          title,
          job_role: jobRole,
          description,
          status,
          username,
        } as any);
      }}
      className="grid gap-3"
    >
      <Field label="Title" required>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Frontend Developer Interview"
        />
      </Field>
      <Field label="Job role" required>
        <input
          className="input"
          value={jobRole}
          onChange={(e) => setJobRole(e.target.value)}
          placeholder="Senior Front-end Developer"
        />
      </Field>
      <Field label="Description">
        <textarea
          className="input min-h-[100px]"
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this interview assesses..."
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status" required>
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as InterviewStatus)}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Username (owner)" required>
          <input
            className="input"
            value="s4828221"
            readOnly
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={!valid || submitting}
          className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-slate-600">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      <div className="[&_input.input]:w-full [&_textarea.input]:w-full">
        {children}
      </div>
    </label>
  );
}
