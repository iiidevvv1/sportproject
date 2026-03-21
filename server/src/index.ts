import express from 'express';
import cors from 'cors';
import { createDb, type AppDatabase } from './db.js';
import { gamesRouter } from './routes/games.js';

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
