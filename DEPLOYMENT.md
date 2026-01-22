# Magazin CMS - Deployment & Maintenance

## Server Information

- **Location**: `/home/zaja/magazin-cms`
- **Node.js**: v20.20.0 (via nvm)
- **Database**: PostgreSQL 16
- **Process Manager**: PM2
- **Reverse Proxy**: Nginx

---

## Credentials

### Database
- **Host**: 127.0.0.1
- **Port**: 5432
- **Database**: `payload_cms_db`
- **User**: `payload_user`
- **Password**: `PayloadCms2026Secure`

### Admin Panel
- **URL**: http://localhost/admin (or http://SERVER_IP/admin)
- **Email**: Create first user at /admin

---

## Service Management

### PM2 Commands
```bash
# Load nvm first
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# View status
pm2 status

# View logs
pm2 logs magazin-cms

# Restart
pm2 restart magazin-cms

# Stop
pm2 stop magazin-cms

# Start
pm2 start magazin-cms
```

### Nginx Commands
```bash
# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/magazin-cms.access.log
sudo tail -f /var/log/nginx/magazin-cms.error.log
```

### PostgreSQL Commands
```bash
# Connect to database
sudo -u postgres psql -d payload_cms_db

# Backup
pg_dump -U payload_user -h localhost payload_cms_db > backup_$(date +%Y%m%d).sql

# Restore
psql -U payload_user -h localhost payload_cms_db < backup.sql
```

---

## Deployment Workflow

### Update Code
```bash
cd /home/zaja/magazin-cms
git pull origin main

# Load nvm
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Install dependencies
npm install

# Build
npm run build

# Restart PM2
pm2 restart magazin-cms
```

### Database Migrations
```bash
# Create migration (after schema changes)
npm run payload migrate:create

# Run migrations
npm run payload migrate
```

---

## Firewall Status

```bash
sudo ufw status
```

Open ports:
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS - for future SSL)

---

## Troubleshooting

### Check if services are running
```bash
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
```

### Check ports
```bash
lsof -i :3000  # Payload
lsof -i :80    # Nginx
lsof -i :5432  # PostgreSQL
```

### View application logs
```bash
pm2 logs magazin-cms --lines 100
cat /home/zaja/magazin-cms/logs/error.log
```

---

## SSL (Future)

To add Let's Encrypt SSL:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Created: January 2026
