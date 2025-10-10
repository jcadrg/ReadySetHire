# ReadySetHire — React + Node Project

## Prerequisites
- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- npm 9+ (ships with Node)
- An OpenAI API key (for transcription / GenAI features)

## 1. Setup

Clone or download this project, then install dependencies:

```bash
cd readysethire
npm install
Do not commit or submit your node_modules folder.

2. Running the project
The project has two parts:

Frontend (React + Vite) — runs on port 5173

Backend (Express + GenAI routes) — runs on port 8080

Terminal 1: Start the backend
bash
Copy code
cd readysethire/server
npm install   # first time only
npx ts-node index.ts
The server will start at: http://localhost:8080

Terminal 2: Start the frontend
bash
Copy code
cd readysethire
npm run dev
The frontend will start at: http://localhost:5173

Now open your browser at http://localhost:5173.