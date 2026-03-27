# Yandex Cloud Deployment Design

**Date:** 2026-03-27  
**Project:** Curling Statistics PWA  
**Author:** Спортсмен  
**Status:** Approved

---

## Overview

Deployment strategy for kurling.inkpie.ru on Yandex Cloud with automated CI/CD and Telegram notifications.

## Architecture

```
kurling.inkpie.ru (DNS A record)
    ↓
[Yandex Cloud Compute VM - Ubuntu 22.04]
    ├─ Docker Engine
    ├─ docker-compose (production)
    │  ├─ app: Node.js server + React SPA (port 3001 internal)
    │  ├─ nginx: reverse proxy + SSL/TLS (ports 80, 443)
    │  └─ volumes: db-data (/data/curling.db), letsencrypt (/etc/letsencrypt)
    └─ certbot: Let's Encrypt automation + renewal cron
```

## Infrastructure Decisions

### 1. Compute Platform: Yandex Cloud VM
- **Why:** Full control, Docker support, cost-effective (~500₽/month for 2vCPU, 4GB RAM)
- **OS:** Ubuntu 22.04 LTS
- **Specs:** 2 vCPU, 4GB RAM, 50GB SSD
- **Alternative rejected:** Kubernetes (overkill), managed platforms (less control, higher cost)

### 2. Database: SQLite on VM Disk
- **Why:** No external dependencies, data lives with app, sufficient for single-user MVP
- **Data Location:** `/data/curling.db` (docker volume `db-data`)
- **Persistence:** Data survives VM reboot (volume attached to VM disk)
- **Future Migration:** Can migrate to PostgreSQL (managed) if needed later. Migration path exists and documented.
- **Backup Strategy:** Manual for MVP (TODO: add S3 backups later with cron job)

### 3. Domain & SSL/TLS
- **Domain:** `kurling.inkpie.ru`
- **DNS:** A record pointing to VM IP
- **SSL/TLS:** Let's Encrypt (free), renewed automatically via certbot in container
- **HTTP Redirect:** All HTTP traffic → HTTPS

### 4. Containerization: Docker Compose
- **Images:** 
  - `app` service: node:24-slim (build from project Dockerfile)
  - `nginx` service: nginx:latest
- **Orchestration:** docker-compose (simple, no complexity overhead)
- **Production file:** `docker-compose.prod.yml` (volumes, networks, restart policies)

## Components

### docker-compose.prod.yml
```yaml
version: '3.8'
services:
  app:
    build: .
    container_name: curling-app
    restart: always
    volumes:
      - db-data:/data
    environment:
      - NODE_ENV=production
      - DB_PATH=/data/curling.db
    expose:
      - "3001"
    networks:
      - app-network

  nginx:
    image: nginx:latest
    container_name: curling-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - app
    networks:
      - app-network

volumes:
  db-data:
    driver: local
  letsencrypt:
    driver: local

networks:
  app-network:
    driver: bridge
```

### nginx/nginx.conf
- Reverse proxy: `/api/*` → `app:3001`
- SPA fallback: `/*` → `index.html` (React Router)
- SSL/TLS: Listen on 443, cert from `/etc/letsencrypt`
- Redirect: HTTP (80) → HTTPS
- Gzip compression enabled

### Certbot Integration
- Initial request: Manual (one-time, interactive)
- Renewal: Cron job inside or outside container (autorenew every 90 days)
- Path: `/etc/letsencrypt` (docker volume persists across restarts)

## CI/CD Pipeline

### GitHub Actions Workflow
**Trigger:** Push to `main` branch

**Steps:**
1. **Lint + Test + Build** (existing `ci.yml`)
   - ESLint, TypeScript check
   - Vitest (backend + frontend)
   - Vite build

2. **Build & Push Docker Image**
   - Build Dockerfile
   - Tag: `registry.yandex.cloud/sportproject:latest`
   - Push to Yandex Container Registry (requires credentials)

3. **Deploy to VM**
   - SSH into VM (private key from GitHub Secrets)
   - `cd /app && git pull && docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d`

4. **Notify Telegram**
   - Success: ✅ notification to MI5 chat
   - Failure: ❌ notification to MI5 chat

### GitHub Secrets Required
- `YANDEX_REGISTRY_USERNAME` — registry credentials
- `YANDEX_REGISTRY_PASSWORD` — registry credentials
- `DEPLOY_HOST` — VM IP address
- `DEPLOY_USER` — SSH user (e.g., `root`)
- `DEPLOY_SSH_KEY` — private SSH key (no passphrase)
- `TELEGRAM_BOT_TOKEN` — bot token from @BotFather
- `TELEGRAM_CHAT_ID` — chat ID (MI5 group: `-1003787150726`)

## Deployment Instructions

1. **Create Yandex Cloud VM:**
   - Ubuntu 22.04, 2vCPU, 4GB RAM, 50GB SSD
   - Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)
   - Note IP address

2. **SSH into VM, setup Docker:**
   ```bash
   ssh root@<VM_IP>
   apt update && apt install -y docker.io docker-compose git
   mkdir -p /app && cd /app
   git clone https://github.com/iiidevvv1/sportproject.git .
   ```

3. **Create `.env.prod` file:**
   ```
   NODE_ENV=production
   DB_PATH=/data/curling.db
   ```

4. **Set up DNS:**
   - Add A record: `kurling.inkpie.ru` → `<VM_IP>`
   - Wait for DNS propagation (~5-10 min)

5. **Initialize SSL Certificate:**
   ```bash
   docker-compose -f docker-compose.prod.yml run --rm nginx certbot certonly \
     --standalone -d kurling.inkpie.ru -n --agree-tos -m admin@inkpie.ru
   ```

6. **Start services:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

7. **Verify:**
   ```bash
   curl https://kurling.inkpie.ru
   docker logs curling-app
   docker logs curling-nginx
   ```

## Future Enhancements (Post-MVP)

- **S3 Backups:** Automated daily backup of SQLite to Yandex Object Storage
- **PostgreSQL Migration:** Move from SQLite to managed PostgreSQL in Yandex Cloud
- **Monitoring:** Prometheus + Grafana for metrics (CPU, memory, requests)
- **Log Aggregation:** Centralized logs (e.g., ELK stack or Yandex Cloud Logging)
- **CDN:** CloudFlare or Yandex CDN for static assets (if needed)

## Rollback Strategy

If deployment fails:
1. GitHub Actions stops (tests must pass first)
2. Manual rollback: SSH to VM, `docker-compose -f docker-compose.prod.yml down`, pull previous image

## Testing & Validation

Before going to production:
- [ ] All tests pass locally (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Docker build works (`docker build -t test .`)
- [ ] docker-compose.prod.yml syntax valid (`docker-compose config`)
- [ ] nginx config valid (check syntax in container)
- [ ] SSL certificate can be obtained (test certbot command)

## Security Considerations

- **Secrets:** GitHub Secrets only, never in code
- **SSH Key:** Unique key for deploy, no passphrase (acceptable for CI/CD)
- **Docker:** images pulled from registry, not built on VM
- **Firewall:** Only ports 22, 80, 443 open
- **HTTPS Redirect:** All HTTP → HTTPS
- **Database:** No external access, only app container

## Cost Estimate (Monthly)

- Compute VM (2vCPU, 4GB): ~500₽
- Storage (disk): ~100₽
- Traffic (egress): ~50₽ (minimal)
- **Total:** ~650₽/month

Let's Encrypt and Docker are free.

---

**Approved by:** Ирина (InkPie)  
**Date:** 2026-03-27
