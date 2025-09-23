# ReadySetHire — Project Setup (Vite + React + TypeScript)

Generated: 2025-09-23T03:05:50.075911

This guide sets up a clean React project in **VSCode** that will call your API at:

```
BASE: https://comp2140a2.uqcloud.net/api
AUTH: JWT (put it in `.env.local` — do NOT commit it)
```

> Anonymous access is disabled. All requests must include a valid JWT in the Authorization header.

---

## 1) Prerequisites

- Node.js 18+ (Node 20 recommended): `node -v`
- VSCode with extensions:
  - **ESLint** (dbaeumer.vscode-eslint)
  - **Prettier** (esbenp.prettier-vscode)
  - **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
  - **REST Client** (humao.rest-client) — optional, for quick API tests
- Package manager: `npm` (or `pnpm`/`yarn` if you prefer)

---

## 2) Create the app

```bash
npm create vite@latest readysethire -- --template react-ts
cd readysethire
```

---

## 3) Install UI & quality tooling

```bash
# Styling
npm i -D tailwindcss postcss autoprefixer

# Linting/formatting
npm i -D eslint prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react eslint-plugin-react-hooks eslint-config-prettier

# Testing (optional for now)
npm i -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw
```

---

## 4) Initialize Tailwind

```bash
npx tailwindcss init -p
```

**tailwind.config.js**

```js
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

**src/index.css** — replace contents with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 5) Environment variables (IMPORTANT: keep your JWT out of git)

Create **.env.local** (NOT committed) from the provided `.env.example`:

```
VITE_API_BASE=https://comp2140a2.uqcloud.net/api
VITE_API_JWT=REPLACE_WITH_YOUR_JWT
```

Add to **.gitignore** (if not already):

```
.env.local
```

---

## 6) (Optional) Vite dev proxy (helps with CORS)

Create or edit **vite.config.ts** to proxy `/api` calls during `npm run dev`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://comp2140a2.uqcloud.net",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
```

---

## 7) Minimal API fetch wrapper (low-level, learning-first)

Create **src/lib/fetchJson.ts**:

```ts
export async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = import.meta.env.VITE_API_BASE as string;
  const jwt = import.meta.env.VITE_API_JWT as string;

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}
```

---

## 8) Quick API test in VSCode (REST Client)

Open **request.http** and hit **Send Request**:

```http
@base = https://comp2140a2.uqcloud.net/api
@jwt = REPLACE_WITH_YOUR_JWT

GET {{base}}/health
Authorization: Bearer {{jwt}}
```

---

## 9) VSCode settings (optional)

**.vscode/extensions.json**

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "humao.rest-client"
  ]
}
```

**.vscode/settings.json**

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

---

## 10) Scripts

Add to **package.json**:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest"
  }
}
```

---

## 11) Start dev

```bash
npm run dev
```

Open http://localhost:5173 and you’re set.
