import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Minimal setup: just serve static files and echo API
const app = express();
app.use(cors());
app.use(express.json());

// Simple games API stub
app.get('/api/games', (req, res) => {
  res.json([
    { id: 1, team_home: 'Home', team_away: 'Away', date: '2026-03-22', score_home: 0, score_away: 0, status: 'not_started' }
  ]);
});

app.post('/api/games', (req, res) => {
  res.json({ id: 2, ...req.body });
});

app.get('/api/games/:id', (req, res) => {
  res.json({ id: req.params.id, team_home: 'Home', team_away: 'Away' });
});

// Serve client dist
const clientDist = join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('/index.html', (req, res) => {
  res.sendFile(join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
