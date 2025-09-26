# ReadySetHire – GenAI Features (LangChain.js)

This document outlines the **two AI-powered features** to be implemented with LangChain.js. Both features run **server-side** (Node) and are exposed as small endpoints. The React frontend will consume these endpoints securely.

---

## Feature 1 – Applicant Summary + Feedback

**Purpose:** Provide recruiters with a concise overview of an applicant’s interview performance.

### Endpoint
POST /genai/summarize-applicant

### Request (JSON)
{
  "role": "Frontend Engineer",
  "seniority": "mid",
  "skillsHint": ["React", "TypeScript", "Testing Library"],
  "answers": [
    { "question": "Tell us about yourself", "transcript": "..." },
    { "question": "How do you test React components?", "transcript": "..." }
  ]
}

### Response (JSON)
{
  "summary": "5–7 sentence neutral summary",
  "strengths": ["clear testing mindset", "React hooks depth", "communicates tradeoffs"],
  "concerns": ["limited perf profiling", "scant a11y examples"],
  "overall_signal": "Proceed"
}

### LangChain flow
- PromptTemplate with role/seniority context.
- StructuredOutputParser or Zod schema for output validation.
- RunnableSequence → ChatOpenAI → parser.
- Optional map-reduce summarization if transcripts are very long.

### Guardrails
- Truncate transcripts (max ~1000 chars per answer).
- temperature: 0.2 for consistency.
- Cache results per applicant (avoid re-summarization).

### UI Placement
Appears on Applicant Review page (side card/panel).

---

## Feature 2 – Auto-Question Generator

**Purpose:** Help recruiters quickly bootstrap interviews with relevant, balanced questions.

### Endpoint
POST /genai/generate-questions

### Request (JSON)
{
  "role": "Frontend Engineer",
  "seniority": "mid",
  "techStack": ["React", "TypeScript", "Vite"],
  "count": 6
}

### Response (JSON)
{
  "items": [
    { "question": "Explain controlled vs uncontrolled components.", "difficulty": "Easy", "rationale": "Assesses React basics." },
    { "question": "How would you profile React performance issues?", "difficulty": "Intermediate", "rationale": "Real-world perf debugging." },
    { "question": "Design a test strategy for a data-heavy component.", "difficulty": "Advanced", "rationale": "Testing architecture thinking." }
  ]
}

### LangChain flow
- PromptTemplate with few-shot examples of good questions.
- StructuredOutputParser with schema validation.
- RunnableSequence → ChatOpenAI.
- Optional validator pass to drop duplicates or off-topic questions.

### Guardrails
- temperature: 0.7 for variety.
- Clamp count to max 10.
- Allow “regenerate” calls with a new random seed.

### UI Placement
Appears on Questions page via a modal: preview generated list → recruiter selects questions → saved to /question.

---

## Shared Notes

- Both features run only on the server. Never expose the LLM key in the browser.
- Secure endpoints with JWT + (optionally) a service key header.
- Implement lightweight caching and rate limits to control cost/latency.
- Keep prompts short and explicit, always request structured JSON.

---

## Types for Frontend (reference)

// summarize-applicant
type OverallSignal = "Proceed" | "Maybe" | "Pass";
interface ApplicantSummaryResponse {
  summary: string;
  strengths: string[];
  concerns: string[];
  overall_signal: OverallSignal;
}

// generate-questions
type Difficulty = "Easy" | "Intermediate" | "Advanced";
interface GeneratedQuestion {
  question: string;
  difficulty: Difficulty;
  rationale: string;
}
interface GenerateQuestionsResponse { items: GeneratedQuestion[]; }
