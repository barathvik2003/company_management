# Deployment — RHEL 9

Target layout:

```
Internet / LAN
      │
      ▼
   Nginx (TLS, :443)
      ├── /      → web container  :3000
      └── /api/  → api container  :3001
                        │
                        ▼
                 postgres container (no published port)
```

## 1. Host preparation

```bash
sudo dnf install -y nginx git
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable --now docker nginx

# Application user — the stack never runs as root
sudo useradd -r -m -d /opt/company-management -s /sbin/nologin cmsapp
sudo usermod -aG docker cmsapp
```

## 2. Code and configuration

```bash
sudo -u cmsapp git clone <your-repo-url> /opt/company-management
sudo mkdir -p /etc/company-management
sudo cp /opt/company-management/.env.example /etc/company-management/.env
sudo chown root:cmsapp /etc/company-management/.env
sudo chmod 640 /etc/company-management/.env
sudo vi /etc/company-management/.env
```

Production values that must change:

```ini
NODE_ENV=production
COOKIE_SECURE=true
COOKIE_DOMAIN=company.example.com
WEB_ORIGIN=https://company.example.com
PUBLIC_API_URL=https://company.example.com
POSTGRES_PASSWORD=<long random string>
JWT_ACCESS_SECRET=<openssl rand -base64 48>
JWT_REFRESH_SECRET=<a different one>
DATABASE_URL=postgresql://cms_app:<password>@postgres:5432/cms?schema=public
```

The API refuses to start if `NODE_ENV=production` while the two JWT secrets
match or secure cookies are off. That is intentional.

## 3. Start the stack

```bash
cd /opt/company-management
sudo -u cmsapp docker compose -f deploy/docker-compose.prod.yml \
  --env-file /etc/company-management/.env up -d --build

# Apply migrations (never `migrate dev` in production, and never the seed)
sudo -u cmsapp docker compose -f deploy/docker-compose.prod.yml \
  exec api npx prisma migrate deploy
```

Create the first company head manually — the demo seed must never run here.
Use `npx prisma studio` over an SSH tunnel, or write a one-off admin script.

## 4. Nginx

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/conf.d/company-management.conf
sudo vi /etc/nginx/conf.d/company-management.conf   # replace the hostname
sudo nginx -t && sudo systemctl reload nginx
```

SELinux blocks Nginx from proxying by default, and the error message is not
obvious. Allow it once:

```bash
sudo setsebool -P httpd_can_network_connect 1
```

Firewall:

```bash
sudo firewall-cmd --permanent --add-service=http --add-service=https
sudo firewall-cmd --reload
```

PostgreSQL is not published to the host at all — only the api container can
reach it over the compose network. Do not add a `ports:` entry for it.

## 5. TLS

```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d company.example.com
```

Certbot installs its own renewal timer; confirm with
`systemctl list-timers | grep certbot`.

## 6. Start on boot

```bash
sudo cp deploy/company-management.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now company-management
```

## 7. Logs

```bash
docker compose -f deploy/docker-compose.prod.yml logs -f api
journalctl -u company-management -f
sudo tail -f /var/log/nginx/error.log
```

## 8. Backups

```bash
sudo cp /opt/company-management/scripts/backup.sh /opt/company-management/scripts/
sudo crontab -e
# 0 2 * * * /opt/company-management/scripts/backup.sh >> /var/log/cms-backup.log 2>&1
```

Daily dump, fourteen days retained. **Test the restore every quarter** — a
backup you have never restored is a guess, not a backup:

```bash
gunzip -c /var/backups/company-management/cms-YYYYMMDD-HHMMSS.sql.gz \
  | docker exec -i <postgres-container> psql -U cms_app -d cms
```

Restore into a scratch database first, not production.

## 9. Updating

```bash
cd /opt/company-management
sudo -u cmsapp git pull
sudo -u cmsapp docker compose -f deploy/docker-compose.prod.yml up -d --build
sudo -u cmsapp docker compose -f deploy/docker-compose.prod.yml exec api npx prisma migrate deploy
```

Take a backup before any update that carries a migration.

## Health check

`GET https://company.example.com/api/health` returns
`{"status":"ok","database":"connected", ...}`. Point your monitoring at it.
