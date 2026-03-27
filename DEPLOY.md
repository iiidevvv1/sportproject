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
