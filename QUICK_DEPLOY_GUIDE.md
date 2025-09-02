# 🚀 Quick Deploy Guide - Port Forwarding Setup

## Prerequisites
- Digital Ocean or Hetzner server
- Domain name (athleteai.com)
- SSH access to your server

## Step 1: Server Setup (2 minutes)

### Digital Ocean
```bash
# Create droplet
doctl compute droplet create athleteai-prod \
  --region nyc3 \
  --image ubuntu-24-04-x64 \
  --size s-2vcpu-4gb \
  --ssh-keys your-key

# Get server IP
doctl compute droplet list
```

### Hetzner
```bash
# Create server
hcloud server create \
  --name athleteai-prod \
  --type cx31 \
  --image ubuntu-24.04 \
  --location nbg1

# Get server IP
hcloud server list
```

## Step 2: Initial Server Configuration (5 minutes)

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Install Git
apt install -y git

# Clone your repository
git clone https://github.com/Shatzii/AthleteAI.git
cd AthleteAI

# Run port forwarding setup
sudo ./port-forwarding-setup.sh
```

## Step 3: SSL Certificate Setup (2 minutes)

```bash
# Install Let's Encrypt certificate
certbot --nginx -d athleteai.com -d www.athleteai.com

# Test SSL
curl -I https://athleteai.com
```

## Step 4: Deploy Application (3 minutes)

```bash
# Create application directory
mkdir -p /var/www/athleteai
cd /var/www/athleteai

# Copy application files
cp -r ~/AthleteAI/backend ./backend
cp -r ~/AthleteAI/frontend ./frontend

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Build frontend
cd frontend && npm run build

# Start services
sudo systemctl start athleteai-backend
sudo systemctl start athleteai-frontend
```

## Step 5: Test Deployment (1 minute)

```bash
# Test health endpoint
curl https://athleteai.com/health

# Test main application
curl -I https://athleteai.com

# Check service status
sudo systemctl status athleteai-backend
sudo systemctl status athleteai-frontend
```

## Port Configuration Summary

| Port | Purpose | Access |
|------|---------|--------|
| 22 | SSH | Internal |
| 80 | HTTP | Redirect to HTTPS |
| 443 | HTTPS | Public (main app) |
| 3000 | Frontend | Internal only |
| 5000 | Backend API | Internal only |

## Firewall Rules Applied

```bash
# Active firewall rules
sudo ufw status

# Should show:
# 22/tcp ALLOW Anywhere
# 80/tcp ALLOW Anywhere  
# 443/tcp ALLOW Anywhere
# 2376/tcp ALLOW Anywhere (Docker)
# 7946/tcp ALLOW Anywhere (Docker Swarm)
# 4789/udp ALLOW Anywhere (Docker Overlay)
```

## Troubleshooting

### Common Issues

**Nginx fails to start:**
```bash
# Check configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log
```

**Services won't start:**
```bash
# Check service status
sudo systemctl status athleteai-backend
sudo systemctl status athleteai-frontend

# View service logs
sudo journalctl -u athleteai-backend -f
```

**SSL certificate issues:**
```bash
# Renew certificate
sudo certbot renew

# Test certificate
openssl s_client -connect athleteai.com:443
```

## Performance Optimization

### Enable HTTP/2
- ✅ Already configured in nginx
- Test with: `curl -I https://athleteai.com`

### Compression
- ✅ Gzip enabled for all text content
- ✅ Static file caching (1 year)

### Security Headers
- ✅ HSTS, CSP, X-Frame-Options
- ✅ XSS protection enabled

## Monitoring

### Basic Monitoring
```bash
# Check nginx status
sudo systemctl status nginx

# Monitor resource usage
htop
df -h
free -h

# View access logs
sudo tail -f /var/log/nginx/access.log
```

### Application Logs
```bash
# Backend logs
sudo journalctl -u athleteai-backend -f

# Frontend logs  
sudo journalctl -u athleteai-frontend -f
```

## Next Steps

1. **Domain DNS**: Point your domain to server IP
2. **CDN Setup**: Configure Cloudflare or Bunny.net
3. **Database**: Set up MongoDB (managed service)
4. **Monitoring**: Add Prometheus + Grafana
5. **Backup**: Configure automated backups

## Emergency Contacts

- **Digital Ocean Support**: https://digitalocean.com/support
- **Hetzner Support**: https://hetzner.com/support
- **Let's Encrypt**: https://letsencrypt.org/docs

---

**Total Deployment Time**: ~15 minutes
**Cost**: $12-24/month (server + domain)
**Expected Performance**: < 100ms response times

Ready to deploy? Run the setup script! 🚀
