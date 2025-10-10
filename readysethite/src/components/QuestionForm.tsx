import { useEffect, useState } from "react";
import type { Difficulty, Question, QuestionCreate } from "../types/question";

const difficulties: Difficulty[] = ["Easy", "Intermediate", "Advanced"];

export default function QuestionForm({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: Partial<Question>;
  onSubmit: (data: QuestionCreate | Partial<Question>) => void;
  submitting?: boolean;
}) {
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(
    (initial?.difficulty as Difficulty) ?? "Easy"
  );
  const [username, setUsername] = useState(initial?.username ?? "");
  // Reset form when initial changes (e.g. when editing a different item)
  useEffect(() => {
    if (initial) {
      setQuestion(initial.question ?? "");
      setDifficulty((initial.difficulty as Difficulty) ?? "Easy");
      setUsername(initial.username ?? "");
    }
  }, [initial]);

  const valid = question.trim() && difficulty && username.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({ question, difficulty, username } as any);
      }}
      className="grid gap-3"
    >
      <Field label="Question" required>
        <textarea
          className="input min-h-[100px]"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Explain the difference between let and const in JavaScript"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Difficulty" required>
          <select
            className="input"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          >
            {difficulties.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Username (owner)" required>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="s10000"
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
