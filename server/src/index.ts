import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers/index.js';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.CLIENT_URL ?? '',
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}),
    onError: ({ error, path }) => {
      console.error(`tRPC error on ${path}:`, error.message);
    },
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📡 tRPC endpoint: http://localhost:${PORT}/trpc`);
});
