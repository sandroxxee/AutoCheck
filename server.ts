import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { apiRouter } from './server/api/routes.ts';
import { initServerSentry } from './server/services/sentry.ts';

// Carrega apenas o .env real. Nunca ler .env.example (contém só placeholders).
dotenv.config();

// Inicializa o Sentry para rastreamento silencioso de erros e performance
initServerSentry();

const app = express();
const PORT = 3000;

// Global middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global CORS and security headers (allowing iframe rendering for AI Studio preview)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'AutoCheck Brasil API',
    timestamp: new Date().toISOString(),
    demoMode: process.env.DEMO_MODE === 'true',
    apiBrasilTokenConfigured: Boolean((process.env.APIBRASIL_BEARER_TOKEN || '').trim()),
    apiBrasilHomolog: process.env.APIBRASIL_HOMOLOG === 'true'
  });
});

// Mount API router FIRST
app.use('/api', apiRouter);

// Set up server listener and Vite/static serving
async function initializeApp() {
  // If running on Vercel as a serverless function, we do not need to boot Vite or listen
  if (process.env.VERCEL === '1') {
    return;
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        cors: true
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AutoCheck Brasil] Servidor ativo em http://0.0.0.0:${PORT}`);
  });
}

initializeApp().catch(err => {
  console.error('Falha ao inicializar servidor AutoCheck:', err);
});

export default app;
