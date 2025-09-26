import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import genaiRouter from './routes/genai.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Require presence of Authorization header if enabled
app.use((req, res, next) => {
  if (process.env.REQUIRE_AUTH !== 'true') return next();
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'unauthorized', message: 'Missing or invalid Authorization header' } });
  }
  next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'readysethire-server', time: new Date().toISOString() });
});

app.use('/genai', genaiRouter);

const port = Number(process.env.PORT || 8080);
app.listen(port, () => console.log(`[server] listening on http://localhost:${port}`));
