import express from 'express';
import cors from 'cors';
import { createDb, type AppDatabase } from './db.js';
import { gamesRouter } from './routes/games.js';
import { shotsRouter } from './routes/shots.js';
import { endsRouter } from './routes/ends.js';
import { statsRouter } from './routes/stats.js';

export interface AppContext {
  db: AppDatabase;
}

export function createApp(dbPath: string): { app: express.Express; close: () => void } {
  const db = createDb(dbPath);
  const app = express();

  app.use(cors());
  app.use(express.json());

  const ctx: AppContext = { db };

  app.use('/api/games', gamesRouter(ctx));
  app.use('/api/games/:id/shots', shotsRouter(ctx));
  app.use('/api/games/:id/ends', endsRouter(ctx));
  app.use('/api/games/:id/stats', statsRouter(ctx));

  return {
    app,
    close: () => db.close(),
  };
}

// Start server only when run directly
const isMainModule = process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js');
if (isMainModule) {
  const PORT = process.env['PORT'] ?? 3001;
  const dbPath = process.env['DB_PATH'] ?? './curling-stats.db';
  const { app } = createApp(dbPath);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
