import { useEffect, useState } from "react";
import type { Applicant, ApplicantCreate, ApplicantStatus } from "../types/applicant";

const STATUSES: ApplicantStatus[] = ["Not Started", "Completed"];

export default function ApplicantForm({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: Partial<Applicant>;
  onSubmit: (data: Omit<ApplicantCreate, "interview_id" | "username">) => void;
  submitting?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [firstname, setFirstname] = useState(initial?.firstname ?? "");
  const [surname, setSurname] = useState(initial?.surname ?? "");
  const [phone, setPhone] = useState(initial?.phone_number ?? "");
  const [email, setEmail] = useState(initial?.email_address ?? "");
  const [status, setStatus] = useState<ApplicantStatus>(
    (initial?.interview_status as ApplicantStatus) ?? "Not Started"
  );

  useEffect(() => {
    if (!initial) return;
    setTitle(initial.title ?? "");
    setFirstname(initial.firstname ?? "");
    setSurname(initial.surname ?? "");
    setPhone(initial.phone_number ?? "");
    setEmail(initial.email_address ?? "");
    setStatus((initial.interview_status as ApplicantStatus) ?? "Not Started");
  }, [initial]);

  const valid =
    title.trim() && firstname.trim() && surname.trim() && email.trim() && status;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({
          title,
          firstname,
          surname,
          phone_number: phone || null,
          email_address: email,
          interview_status: status,
        });
      }}
      className="grid gap-3"
    >
      <div className="grid grid-cols-3 gap-3">
        <Field label="Title" required>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mr / Ms / Dr" />
        </Field>
        <Field label="First name" required>
          <input className="input" value={firstname} onChange={(e) => setFirstname(e.target.value)} placeholder="John" />
        </Field>
        <Field label="Surname" required>
          <input className="input" value={surname} onChange={(e) => setSurname(e.target.value)} placeholder="Smith" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone">
          <input className="input" value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} placeholder="+61 412 345 678" />
        </Field>
        <Field label="Email address" required>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john.smith@example.com" />
        </Field>
      </div>

      <Field label="Interview status" required>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value as ApplicantStatus)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" disabled={!valid || submitting} className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50">
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-slate-600">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      <div className="[&_input.input]:w-full [&_textarea.input]:w-full">{children}</div>
    </label>
  );
}
