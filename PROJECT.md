# PROJECT.md — Curling Stats

## Стек
- **Язык:** TypeScript (monorepo: client + server)
- **Фреймворк:** React (Vite) + Express.js
- **DB:** SQLite (better-sqlite3)
- **Deploy:** Docker + nginx + Yandex Cloud VM

## Структура
```
├── client/                  — React фронтенд (Vite, TypeScript)
│   └── src/
│       ├── pages/           — страницы (Dashboard, InGame, NewGame, Teams, Stats)
│       ├── components/      — UI компоненты
│       └── api/             — API client (fetch)
├── server/                  — Express.js API
│   └── src/
│       ├── routes/          — API routes (games, ends, shots, stats)
│       ├── db/              — SQLite schema + queries
│       └── index.ts         — entry point (порт 3001)
├── docker-compose.yml       — локальная разработка
├── docker-compose.prod.yml  — продакшн (app + nginx)
├── nginx/nginx.conf         — reverse proxy + SSL
├── .github/workflows/
│   ├── ci.yml               — lint, test, build на PR
│   └── deploy.yml           — CD на push в main
└── DEPLOY.md                — гайд по деплою на Yandex Cloud
```

## Паттерны
- **API calls:** fetch через централизованный api/ модуль
- **Error Handling:** try/catch + логируем в консоль
- **Testing:** Jest + @testing-library/react, unit tests обязательны
- **Docker:** multi-stage build (client build → server build → final image)
- **DB:** SQLite файл монтируется как volume `/data/curling.db`

## Фичи
- API (games, ends, shots, stats): ✅ готово
- Фронтенд (React, все страницы): ✅ готово
- Docker (Dockerfile, docker-compose): ✅ готово
- CI (lint + test + build): ✅ готово
- CD (deploy workflow): ✅ готово (нужны GitHub Secrets)
- nginx + SSL конфиг: ✅ готово (нужно настроить на сервере)
- Yandex Cloud VM: 📋 не начато (следовать DEPLOY.md)

## Deployment

**Target:** Yandex Cloud (kurling.inkpie.ru)

**Stack:**
- VM: Ubuntu 22.04 (2vCPU, 4GB RAM)
- Docker + docker-compose
- nginx reverse proxy с Let's Encrypt SSL/TLS
- SQLite на persistent volume
- GitHub Actions CI/CD с Telegram уведомлениями

**Files:**
- `docker-compose.prod.yml` — Production Docker конфигурация
- `nginx/nginx.conf` — nginx reverse proxy (SSL, SPA fallback)
- `.github/workflows/deploy.yml` — GitHub Actions CD pipeline
- `DEPLOY.md` — Пошаговый гайд по деплою

**CI/CD Pipeline:**
1. Push в main → GitHub Actions
2. Lint, test, build (должны пройти)
3. SSH деплой на VM
4. Telegram уведомление (успех/ошибка)

**Secrets Required:**
- TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
- DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY

**SSL/TLS:**
- Let's Encrypt (бесплатно, автообновление certbot)
- HTTPS редирект в nginx

**Database Persistence:**
- SQLite в docker volume
- Бэкапы: пока ручные (TODO: S3 автоматизация)

**Cost:** ~600₽/месяц (VM + диск + трафик)

## Не делать
- ❌ API вызовы прямо в компонентах (только через api/ модуль)
- ❌ any типы в TypeScript
- ❌ Пушить в main без прохождения CI
- ❌ Хранить секреты в коде (GitHub Secrets)
