# ReadySetHire — **Corrected** Setup (Vite + React + TypeScript + Tailwind v4)

This guide uses **Tailwind CSS v4** with the **official Vite plugin** — no PostCSS config, no `tailwind.config.js` required (unless you want custom theme).

## 0) Clean slate (if you tried an older setup)
- Remove `postcss.config.js`, `tailwind.config.js`, and any `@tailwind` directives left from v3.
- Remove any old Tailwind packages added for v3.

---

## 1) Create the app
```bash
npm create vite@latest readysethire -- --template react-ts
cd readysethire
npm i
```

---

## 2) Install Tailwind v4 (with Vite plugin)
```bash
npm install tailwindcss @tailwindcss/vite
```

> You do **not** need `postcss` or `autoprefixer` for Tailwind v4’s Vite plugin.

---

## 3) Wire the Vite plugin
Edit **vite.config.ts** and add the Tailwind plugin:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // optional dev proxy to avoid CORS while developing
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

(You can download a ready-made `vite.config.ts` below.)

---

## 4) Import Tailwind into your CSS
Replace the contents of **`src/index.css`** with exactly:

```css
@import "tailwindcss";
```

Make sure **`src/main.tsx`** imports this file (the Vite template already does):
```ts
import "./index.css";
```

(You can download a ready-made `src/index.css` below.)

---

## 5) Verify it works
Start dev server:
```bash
npm run dev
```

Open `App.tsx` and add a Tailwind class:
```tsx
<h1 className="text-3xl font-bold text-indigo-600">Hello Tailwind v4</h1>
```

You should see a large indigo heading. If not:
- Restart dev server after installing the plugin
- Ensure `plugins: [react(), tailwindcss()]` are present
- Confirm `@import "tailwindcss";` is in `src/index.css`
- Confirm `import "./index.css"` exists in `main.tsx`

---

## 6) Environment for your API (JWT)
Create **`.env.local`** (do **not** commit it):
```
VITE_API_BASE=https://comp2140a2.uqcloud.net/api
VITE_API_JWT=REPLACE_WITH_YOUR_JWT
```

Add to **.gitignore** if not present:
```
.env.local
```

---

## 7) Minimal fetch helper
Use the `fetchJson.ts` file we generated earlier. It reads `VITE_API_BASE` and `VITE_API_JWT` and sets the `Authorization: Bearer` header automatically.

---

## 8) Optional: quick REST Client check
Create `request.http` (or use the one we provided):
```http
@base = https://comp2140a2.uqcloud.net/api
@jwt = REPLACE_WITH_YOUR_JWT

GET {{base}}/health
Authorization: Bearer {{jwt}}
```

---

### Common pitfalls fixed by this guide
- Old v3 approach (`postcss` + `tailwind.config.js`) → v4 uses `@tailwindcss/vite` plugin.
- Missing CSS import → Use `@import "tailwindcss";` in `src/index.css`.
- Styles not applied → Ensure `main.tsx` imports `./index.css` and plugin is registered in `vite.config.ts`.

Happy building!
