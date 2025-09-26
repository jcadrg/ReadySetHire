import { NavLink, Route, Routes } from "react-router-dom";
import InterviewsPage from "./pages/InterviewsPage";
import QuestionsPage from "./pages/QuestionsPage";
import ApplicantsPage from "./pages/ApplicantsPage";
import TakeInterviewPage from "./pages/TakeInterviewPage";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
          <div className="font-bold text-xl">ReadySetHire</div>
          <nav className="flex gap-4 text-sm">
            <Nav to="/" label="Interviews" />
            <Nav to="/questions" label="Questions" />
            <Nav to="/applicants" label="Applicants" />
            <Nav to="/take" label="Take Interview" />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<InterviewsPage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/applicants" element={<ApplicantsPage />} />
          <Route path="/take" element={<TakeInterviewPage />} />
        </Routes>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-500">
          © {new Date().getFullYear()} ReadySetHire — built for learning React + PostgREST + LangChain
        </div>
      </footer>
    </div>
  );
}

function Nav({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        "rounded-full px-3 py-1 transition " +
        (isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")
      }
    >
      {label}
    </NavLink>
  );
}
