# AI Grammar Checker - Quick Start Guide

Get your AI Grammar Checker up and running in production in under 10 minutes!

## 🚀 One-Command Deployment

### Prerequisites
- Docker and Docker Compose installed
- Domain name pointed to your server (optional)
- SSL certificates (optional, can use self-signed)

### Step 1: Clone and Configure

```bash
# Clone the repository
git clone <your-repository-url>
cd AI-grammar-web

# Copy and edit environment file
cp .env.example .env.production
```

### Step 2: Configure Environment

Edit `.env.production` with your settings:

```env
# Required - Update these
VITE_API_URL=https://your-domain.com/api
SESSION_SECRET=your-super-secret-session-key-min-32-chars
JWT_SECRET=your-jwt-secret-key-min-32-chars
ENCRYPTION_KEY=your-32-character-encryption-key

# Optional - Add your AI API keys
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GROQ_API_KEY=your-groq-api-key
```

### Step 3: Deploy

**Linux/macOS:**
```bash
chmod +x deploy.sh
./deploy.sh production
```

**Windows:**
```powershell
.\deploy.ps1 -Environment production
```

**Manual Docker:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Step 4: Verify

```bash
# Check if services are running
docker-compose -f docker-compose.prod.yml ps

# Test the application
curl http://localhost/health
```

## 🌐 Access Your Application

- **Frontend**: http://localhost (or https://your-domain.com)
- **API**: http://localhost/api (or https://your-domain.com/api)
- **Health Check**: http://localhost/health

## 🔧 Quick Configuration

### Enable HTTPS

1. **Place SSL certificates** in `nginx/ssl/`:
   ```
   nginx/ssl/cert.pem
   nginx/ssl/key.pem
   ```

2. **Update domain** in `nginx/nginx.conf`:
   ```nginx
   server_name your-domain.com www.your-domain.com;
   ```

3. **Restart Nginx**:
   ```bash
   docker-compose -f docker-compose.prod.yml restart nginx
   ```

### Add AI Providers

Edit `.env.production` and add your API keys:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Groq
GROQ_API_KEY=gsk_...

# Local Ollama (if using)
OLLAMA_URL=http://ollama:11434
```

Restart the application:
```bash
docker-compose -f docker-compose.prod.yml restart ai-grammar-app
```

## 📊 Monitoring

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f ai-grammar-app
```

### Check Status
```bash
# Container status
docker-compose -f docker-compose.prod.yml ps

# Resource usage
docker stats
```

## 🛠️ Common Commands

### Start/Stop Services
```bash
# Start
docker-compose -f docker-compose.prod.yml up -d

# Stop
docker-compose -f docker-compose.prod.yml down

# Restart
docker-compose -f docker-compose.prod.yml restart
```

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

### Backup
```bash
# Create backup
./deploy.sh production --backup-only

# View backups
ls -la backups/
```

## 🚨 Troubleshooting

### Application Won't Start

1. **Check logs**:
   ```bash
   docker-compose -f docker-compose.prod.yml logs ai-grammar-app
   ```

2. **Verify environment**:
   ```bash
   cat .env.production
   ```

3. **Check ports**:
   ```bash
   netstat -tulpn | grep :3001
   ```

### Can't Access Application

1. **Check Nginx**:
   ```bash
   docker-compose -f docker-compose.prod.yml logs nginx
   ```

2. **Test backend directly**:
   ```bash
   curl http://localhost:3001/health
   ```

3. **Check firewall**:
   ```bash
   # Ubuntu/Debian
   sudo ufw status
   
   # CentOS/RHEL
   sudo firewall-cmd --list-all
   ```

### SSL Issues

1. **Verify certificates**:
   ```bash
   openssl x509 -in nginx/ssl/cert.pem -text -noout
   ```

2. **Test SSL**:
   ```bash
   curl -I https://your-domain.com
   ```

## 📞 Need Help?

1. **Check the full deployment guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
2. **Review logs** for error messages
3. **Verify configuration** files
4. **Test individual components**

## 🔐 Security Notes

- Change all default passwords and secrets
- Use strong, unique API keys
- Enable HTTPS in production
- Regularly update dependencies
- Monitor access logs
- Set up proper firewall rules

## 🎯 Next Steps

1. **Configure monitoring** (Sentry, logs)
2. **Set up backups** (automated)
3. **Configure CDN** (for static assets)
4. **Set up CI/CD** (automated deployments)
5. **Load testing** (performance optimization)

---

**🎉 Congratulations!** Your AI Grammar Checker is now running in production!

For advanced configuration and troubleshooting, see the complete [Deployment Guide](./DEPLOYMENT.md).