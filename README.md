# Curling Statistics PWA

Curling match statistics tracking application. Real-time data entry for throws, team scores, and player analytics.

## Development

### Setup
```bash
npm install
```

### Development Mode
```bash
# Terminal 1: Server
npm run dev:server

# Terminal 2: Client  
npm run dev:client
```

### Build
```bash
npm run build
```

### Testing
```bash
npm test
```

### Linting & Code Quality
```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

**Note:** Pre-commit hooks automatically run linting before each commit. Fix any linter errors before pushing to GitHub.

### Git Hooks Setup
Hooks are configured automatically. To manually enable:
```bash
git config core.hooksPath .githooks
```

## Production Deployment

See [DEPLOY.md](./DEPLOY.md) for Yandex Cloud deployment instructions.

## Project Structure
- `server/` — Node.js/Express backend, SQLite database, API routes
- `client/` — React frontend, Tailwind CSS, React Router
- `docker-compose.prod.yml` — Production Docker setup
- `.github/workflows/` — GitHub Actions CI/CD pipeline

## Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, framer-motion, lucide-react, React Router v7, TanStack Query v5
- **Backend:** Node.js 24, Express 5, SQLite (better-sqlite3), TypeScript
- **DevTools:** Vite, Vitest, React Testing Library, ESLint, Prettier
- **Infrastructure:** Docker, docker-compose, Yandex Cloud, Let's Encrypt, nginx

## License
MIT
