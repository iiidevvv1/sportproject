# Yandex Cloud Deployment Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add production deployment configuration and CI/CD pipeline for Yandex Cloud with Let's Encrypt SSL and Telegram notifications.

**Architecture:** Create docker-compose.prod.yml for production stack (app + nginx reverse proxy), configure nginx with SSL/TLS termination, add GitHub Actions CD pipeline that builds Docker image and deploys to VM, and integrate Telegram notifications for build status.

**Tech Stack:** Docker, docker-compose, nginx, Let's Encrypt/certbot, GitHub Actions, Yandex Container Registry, Node.js/Express, React.

---

## Chunk 1: Docker & nginx Configuration

### Task 1: Create docker-compose.prod.yml

**Files:**
- Create: `docker-compose.prod.yml`

- [ ] **Step 1: Write docker-compose.prod.yml with app and nginx services**

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
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
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/games"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:1.27-alpine
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
      app:
        condition: service_healthy
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

- [ ] **Step 2: Verify syntax with docker-compose**

Run: `docker-compose -f docker-compose.prod.yml config > /dev/null && echo "Valid"`
Expected: Output "Valid" with no errors

- [ ] **Step 3: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "infra: add production docker-compose configuration"
```

---

### Task 2: Create nginx configuration directory and nginx.conf

**Files:**
- Create: `nginx/` directory
- Create: `nginx/nginx.conf`
- Create: `nginx/ssl/` directory

- [ ] **Step 1: Create nginx directory structure**

```bash
mkdir -p nginx/ssl
```

- [ ] **Step 2: Write nginx.conf (reverse proxy + SSL)**

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/atom+xml image/svg+xml;

    # HTTP redirect to HTTPS
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name kurling.inkpie.ru;

        ssl_certificate /etc/letsencrypt/live/kurling.inkpie.ru/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/kurling.inkpie.ru/privkey.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        root /usr/share/nginx/html;
        index index.html;

        # API proxy
        location /api/ {
            proxy_pass http://app:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Static files (client dist)
        location /static/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA fallback for React Router
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

- [ ] **Step 3: Create empty ssl directory (placeholder for certs)**

```bash
mkdir -p nginx/ssl
touch nginx/ssl/.gitkeep
```

- [ ] **Step 4: Add nginx to .gitignore**

```bash
echo "nginx/ssl/!(*.gitkeep)" >> .gitignore
```

- [ ] **Step 5: Commit**

```bash
git add nginx/nginx.conf nginx/ssl/.gitkeep
git commit -m "infra: add nginx reverse proxy configuration with SSL/TLS"
```

---

### Task 3: Update Dockerfile to serve React build

**Files:**
- Modify: `Dockerfile` (add build stage output to nginx)

- [ ] **Step 1: Read current Dockerfile**

```bash
cat Dockerfile
```

Expected: Shows current multi-stage build (build client, build server, final image)

- [ ] **Step 2: Verify client/dist is copied to server for serving**

Check if Dockerfile has: `COPY --from=client-build /app/client/dist /app/server/dist/public` or similar

If not present, add this line to the server build stage (after copying server code):

```dockerfile
# In the "server-build" stage, after line "COPY server server/":
COPY --from=client-build /app/client/dist /app/server/public
```

- [ ] **Step 3: Verify server exposes port 3001**

Check Dockerfile for: `EXPOSE 3001`

If not present, add: `EXPOSE 3001`

- [ ] **Step 4: Rebuild and test locally**

```bash
docker build -t curling-test:latest .
docker run -p 3001:3001 curling-test:latest
# Open http://localhost:3001 in browser
# Should show React app
```

Expected: React app loads, API endpoints work

- [ ] **Step 5: Commit (if changes made)**

```bash
git add Dockerfile
git commit -m "infra: verify Dockerfile serves client dist"
```

---

## Chunk 2: GitHub Actions CI/CD Pipeline

### Task 4: Create GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write deploy.yml workflow**

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build project
        run: npm run build

      - name: Build Docker image
        run: docker build -t curling:latest .

      - name: Notify Telegram - Build Started
        run: |
          curl -X POST https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/sendMessage \
            -d "chat_id=${{ secrets.TELEGRAM_CHAT_ID }}" \
            -d "text=🔄 Curling app: build started (commit ${{ github.sha }})"

      - name: Deploy to VM
        env:
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
          DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
          DEPLOY_SSH_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_SSH_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H $DEPLOY_HOST >> ~/.ssh/known_hosts 2>/dev/null || true
          
          ssh -i ~/.ssh/deploy_key $DEPLOY_USER@$DEPLOY_HOST << 'EOF'
          set -e
          cd /app
          git pull origin main
          NODE_ENV=development npm install
          npm run build
          docker-compose -f docker-compose.prod.yml pull || true
          docker-compose -f docker-compose.prod.yml up -d
          echo "Deploy complete"
          EOF

      - name: Notify Telegram - Deploy Success
        if: success()
        run: |
          curl -X POST https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/sendMessage \
            -d "chat_id=${{ secrets.TELEGRAM_CHAT_ID }}" \
            -d "parse_mode=HTML" \
            -d "text=✅ <b>Curling app deployed successfully!</b>%0ACommit: <code>${{ github.sha }}</code>%0AURL: https://kurling.inkpie.ru"

      - name: Notify Telegram - Deploy Failed
        if: failure()
        run: |
          curl -X POST https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/sendMessage \
            -d "chat_id=${{ secrets.TELEGRAM_CHAT_ID }}" \
            -d "parse_mode=HTML" \
            -d "text=❌ <b>Curling app deploy FAILED!</b>%0ACommit: <code>${{ github.sha }}</code>%0ACheck: https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}"
```

- [ ] **Step 2: Verify workflow syntax**

```bash
# Check if file is valid YAML (optional, for local verification)
# Syntax will be validated by GitHub on push
cat .github/workflows/deploy.yml | head -20
```

Expected: File readable, no syntax errors visible

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions deploy pipeline with Telegram notifications"
```

---

### Task 5: Document required GitHub Secrets

**Files:**
- Create: `.github/SECRETS.md` (documentation only, not committed)

- [ ] **Step 1: Create .github/SECRETS.md locally (NOT committed)**

```markdown
# GitHub Actions Secrets

Set these secrets in GitHub repository settings (Settings → Secrets and variables → Actions):

## Yandex Cloud Registry (for Docker image push)
- `YANDEX_REGISTRY_USERNAME` — Username for Yandex Container Registry
- `YANDEX_REGISTRY_PASSWORD` — Password for Yandex Container Registry

## Deployment SSH
- `DEPLOY_HOST` — IP address of Yandex Cloud VM (e.g., `12.34.56.78`)
- `DEPLOY_USER` — SSH user (typically `root`)
- `DEPLOY_SSH_KEY` — Private SSH key (no passphrase)

## Telegram Notifications
- `TELEGRAM_BOT_TOKEN` — Bot token from @BotFather
- `TELEGRAM_CHAT_ID` — Chat ID for notifications (`-1003787150726` for MI5 group)

## How to Generate SSH Key
\`\`\`bash
ssh-keygen -t rsa -b 4096 -f deploy_key -N ""
# deploy_key = private key (set as DEPLOY_SSH_KEY)
# deploy_key.pub = public key (add to ~/.ssh/authorized_keys on VM)
\`\`\`
```

- [ ] **Step 2: Add .github/SECRETS.md to .gitignore**

```bash
echo ".github/SECRETS.md" >> .gitignore
```

(This file should not be committed; it's just documentation for developers)

- [ ] **Step 3: Commit .gitignore update only**

```bash
git add .gitignore
git commit -m "chore: add .github/SECRETS.md to gitignore"
```

---

## Chunk 3: Deployment Documentation

### Task 6: Create DEPLOY.md with step-by-step instructions

**Files:**
- Create: `DEPLOY.md` (in repo root)

- [ ] **Step 1: Write comprehensive DEPLOY.md**

```markdown
# Deploying to Yandex Cloud

This guide walks through deploying the Curling Statistics app to Yandex Cloud.

## Prerequisites

- Yandex Cloud account with billing enabled
- Domain `kurling.inkpie.ru` registered and DNS accessible
- `git` installed locally
- SSH client

## 1. Create Yandex Cloud VM

### Create Compute Instance

1. Go to [Yandex Cloud Console](https://console.cloud.yandex.ru/)
2. Navigate to **Compute** → **Virtual Machines**
3. Click **Create VM**
4. Configure:
   - **Name:** curling-app
   - **Zone:** ru-central1-a
   - **OS:** Ubuntu 22.04 LTS
   - **vCPU:** 2
   - **Memory:** 4 GB
   - **Disk:** 50 GB SSD
   - **Platform:** Intel (standard)

5. **Network:**
   - Create new VPC or use default
   - Enable public IP (needed for external access)
   - Add security group:
     - Inbound: TCP 22 (SSH), TCP 80 (HTTP), TCP 443 (HTTPS)
     - Outbound: All

6. **SSH Key:**
   - Generate new key pair or use existing
   - Save private key to `~/.ssh/yandex-curling` locally
   - `chmod 600 ~/.ssh/yandex-curling`

7. Click **Create**. Wait ~1-2 minutes for initialization.

Note the **Public IP** address (e.g., `203.0.113.42`).

---

## 2. Setup VM

### SSH into VM

```bash
ssh -i ~/.ssh/yandex-curling root@<PUBLIC_IP>
```

### Install Docker and Docker Compose

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
apt install -y docker.io docker-compose

# Add root to docker group (optional)
# usermod -aG docker root

# Verify installation
docker --version
docker-compose --version
```

### Clone Repository

```bash
mkdir -p /app
cd /app
git clone https://github.com/iiidevvv1/sportproject.git .
ls -la
```

### Create Environment File

```bash
cat > /app/.env.prod << 'EOF'
NODE_ENV=production
DB_PATH=/data/curling.db
EOF
```

---

## 3. Setup SSL/TLS with Let's Encrypt

### Install Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### Obtain Certificate (Manual Process)

Before starting containers, request SSL certificate:

```bash
# Set your VM's public IP
export VM_IP=203.0.113.42

# Request certificate
certbot certonly --standalone -d kurling.inkpie.ru \
  --email admin@inkpie.ru \
  --non-interactive \
  --agree-tos
```

Expected output:
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/kurling.inkpie.ru/fullchain.pem
Key is saved at: /etc/letsencrypt/live/kurling.inkpie.ru/privkey.pem
```

Certificate is now available for nginx to use.

---

## 4. Configure DNS

### Add DNS A Record

1. Go to your domain registrar (where you registered `inkpie.ru`)
2. Add DNS record:
   - **Type:** A
   - **Name:** kurling
   - **TTL:** 3600
   - **Target:** `<PUBLIC_IP>` (e.g., `203.0.113.42`)

3. Full domain will be: `kurling.inkpie.ru`

4. Verify DNS propagation:
   ```bash
   nslookup kurling.inkpie.ru
   # Should resolve to VM's public IP
   ```

DNS propagation usually takes 5-15 minutes.

---

## 5. Start Application

### Build and Start Containers

```bash
cd /app

# Build app image (first time only)
docker build -t curling-app:latest .

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Verify Services Running

```bash
# Check containers
docker ps

# Test app health
curl http://localhost:3001/api/games
# Should return JSON (or empty array)

# Test nginx
curl -I http://localhost/
# Should return 301 redirect to HTTPS

# Test HTTPS
curl -I https://kurling.inkpie.ru/
# Should return 200 OK
```

---

## 6. Setup GitHub Actions Secrets

In GitHub repository settings (`Settings` → `Secrets and variables` → `Actions`), add:

### For Telegram Notifications
```
TELEGRAM_BOT_TOKEN = <bot-token-from-@BotFather>
TELEGRAM_CHAT_ID = -1003787150726
```

### For SSH Deployment
1. Generate SSH key for CI/CD:
   ```bash
   ssh-keygen -t rsa -b 4096 -f ci-deploy-key -N ""
   ```

2. Add public key to VM:
   ```bash
   cat ci-deploy-key.pub >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

3. In GitHub Secrets:
   ```
   DEPLOY_HOST = <PUBLIC_IP>
   DEPLOY_USER = root
   DEPLOY_SSH_KEY = <contents-of-ci-deploy-key>
   ```

4. Store private key safely, delete local copy after adding to secrets

### For Yandex Container Registry (optional, future use)
```
YANDEX_REGISTRY_USERNAME = (to be configured)
YANDEX_REGISTRY_PASSWORD = (to be configured)
```

---

## 7. Monitor and Maintain

### View Logs

```bash
# App container logs
docker logs curling-app

# Nginx logs
docker logs curling-nginx

# Real-time logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Check Certificate Renewal

Certbot auto-renewal cron job runs twice daily. To manually check:

```bash
certbot renew --dry-run
```

### Backup Database

To backup SQLite database:

```bash
docker cp curling-app:/data/curling.db ./curling-backup.db
# Download locally via SCP or other means
```

### Restart Services

If needed:

```bash
docker-compose -f docker-compose.prod.yml restart app
# or
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

### App not starting
```bash
docker logs curling-app
# Check error messages, typically NODE_ENV or DB_PATH issues
```

### Nginx SSL cert not found
```bash
# Verify cert exists
ls -la /etc/letsencrypt/live/kurling.inkpie.ru/

# Re-request if missing
certbot certonly --standalone -d kurling.inkpie.ru --agree-tos
```

### Port 443 already in use
```bash
lsof -i :443
# Kill existing process or change nginx listen port
```

### DNS not resolving
```bash
dig kurling.inkpie.ru
nslookup kurling.inkpie.ru
# Check TTL and propagation time
```

---

## Cost

Monthly cost estimate:
- Compute VM (2vCPU, 4GB): ~500₽
- Storage (50GB disk): ~50₽
- Outgoing traffic: ~50₽ (minimal)
- **Total: ~600₽/month**

Let's Encrypt and Docker are free.

---

## Security Notes

- Keep VM password and SSH keys secure
- Only ports 22, 80, 443 open to internet
- Database access restricted to app container only
- Use strong password for any user accounts created
- Regularly update system packages (`apt update && apt upgrade`)

---

## Next Steps

- Monitor app performance (logs, uptime)
- Setup automated daily backups (S3, git, etc.)
- Add monitoring dashboard (Prometheus + Grafana)
- Scale to PostgreSQL if needed (migratable)
- Setup CDN for static assets (CloudFlare, Yandex CDN)
```

- [ ] **Step 2: Commit**

```bash
git add DEPLOY.md
git commit -m "docs: add comprehensive Yandex Cloud deployment guide"
```

---

## Chunk 4: Integration & Testing

### Task 7: Update PROJECT.md with deployment notes

**Files:**
- Modify: `PROJECT.md`

- [ ] **Step 1: Read current PROJECT.md**

```bash
cat PROJECT.md | head -50
```

- [ ] **Step 2: Add Deployment section to PROJECT.md**

Append to PROJECT.md (before or after existing sections):

```markdown
## Deployment

**Target:** Yandex Cloud (kurling.inkpie.ru)

**Stack:**
- VM: Ubuntu 22.04 (2vCPU, 4GB RAM)
- Docker + docker-compose
- nginx reverse proxy with Let's Encrypt SSL/TLS
- SQLite on persistent volume
- GitHub Actions CI/CD with Telegram notifications

**Files:**
- `docker-compose.prod.yml` — Production Docker configuration
- `nginx/nginx.conf` — nginx reverse proxy (SSL, SPA fallback)
- `.github/workflows/deploy.yml` — GitHub Actions CD pipeline
- `DEPLOY.md` — Step-by-step deployment guide

**CI/CD Pipeline:**
1. Push to main → GitHub Actions
2. Lint, test, build (must pass)
3. Build Docker image
4. SSH deploy to VM
5. Telegram notification (success/failure)

**Secrets Required:**
- TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
- DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY
- (Optional) YANDEX_REGISTRY_USERNAME, YANDEX_REGISTRY_PASSWORD

**SSL/TLS:**
- Let's Encrypt (free, auto-renewed)
- Certbot in standalone mode
- HTTPS redirect configured in nginx

**Database Persistence:**
- SQLite file persists in docker volume
- Migration to PostgreSQL possible post-MVP
- Backups: manual for now (TODO: S3 automation)

**Cost:** ~600₽/month (VM + storage + traffic)
```

- [ ] **Step 3: Commit**

```bash
git add PROJECT.md
git commit -m "docs: add deployment section to PROJECT.md"
```

---

### Task 8: Validate all configurations

**Files:**
- Check: `docker-compose.prod.yml`
- Check: `nginx/nginx.conf`
- Check: `.github/workflows/deploy.yml`
- Check: `DEPLOY.md`

- [ ] **Step 1: Validate docker-compose.prod.yml syntax**

```bash
docker-compose -f docker-compose.prod.yml config > /dev/null
echo $?
```

Expected: Exit code 0 (success)

- [ ] **Step 2: Validate nginx.conf (local nginx check)**

```bash
# Only if nginx installed locally, otherwise skip
docker run --rm -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  nginx:latest nginx -t
```

Expected: "syntax is ok" and "configuration file test is successful"

- [ ] **Step 3: Check workflow for obvious errors**

```bash
cat .github/workflows/deploy.yml | grep -E "on:|jobs:|steps:" | head -10
```

Expected: Proper YAML structure visible

- [ ] **Step 4: Final checklist**

```
[ ] docker-compose.prod.yml valid YAML
[ ] nginx/nginx.conf present and readable
[ ] nginx/ssl/.gitkeep exists
[ ] DEPLOY.md comprehensive and accurate
[ ] .github/workflows/deploy.yml has all steps
[ ] Dockerfile unchanged from app build perspective
[ ] Project.md updated with deployment notes
[ ] All files committed
```

- [ ] **Step 5: Final commit (if any)**

```bash
git status
# Should show nothing uncommitted
```

Expected: Clean working directory

---

## Summary

**Files Created:**
- `docker-compose.prod.yml` — Production orchestration
- `nginx/nginx.conf` — Reverse proxy + SSL
- `.github/workflows/deploy.yml` — CI/CD pipeline
- `DEPLOY.md` — Deployment guide

**Files Modified:**
- `.gitignore` — Added nginx/ssl/
- `PROJECT.md` — Added deployment section

**Key Capabilities After Implementation:**
1. ✅ Docker images build successfully
2. ✅ docker-compose.prod.yml orchestrates app + nginx + volumes
3. ✅ GitHub Actions tests, builds, deploys on push to main
4. ✅ Telegram notifications for build status
5. ✅ DEPLOY.md enables self-service VM setup
6. ✅ SSL/TLS with Let's Encrypt configured
7. ✅ Database persists across restarts

**Next Steps (Post-MVP):**
- Setup Yandex Cloud VM following DEPLOY.md
- Add GitHub Secrets (Telegram, SSH keys)
- Test CD pipeline with first push to main
- Monitor Telegram for deployment notifications
- Implement S3 backup strategy (TODO)

---

**Ready for execution by:** Subagent-driven development or manual implementation following task steps.
