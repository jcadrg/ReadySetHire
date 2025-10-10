Use of Generative AI (GenAI)

We integrated and tested GenAI models in two main areas of the application:

Question Generation (AI Suggest Questions)

Used ChatGPT (OpenAI GPT-4o-mini) through a backend endpoint (/genai/suggest-questions).

Purpose: automatically generate short, role-specific interview questions from job description, difficulty, and context.

Benefit: saves recruiters time in curating balanced question sets.

Answer Summarization (AI Summarize Answers)

Used ChatGPT (OpenAI GPT-4o-mini) via backend endpoint (/genai/summarize-answers).

Purpose: transform raw applicant Q&A transcripts into recruiter-friendly summaries (strengths, concerns, recommendation).

Benefit: supports reviewers but does not replace human judgment.

Development Process

During coding and documentation, I used ChatGPT to debug integration errors, refactor TypeScript, and write structured outlines (responsible AI, accessibility).

For evaluation of code quality and explanations, I relied on ChatGPT only, not on Claude or Gemini.