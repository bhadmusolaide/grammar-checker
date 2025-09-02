# AI Grammar Checker - Production Deployment Guide

This guide provides comprehensive instructions for deploying the AI Grammar Checker application to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Manual Deployment](#manual-deployment)
5. [SSL/TLS Configuration](#ssltls-configuration)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Backup and Recovery](#backup-and-recovery)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ recommended), Windows Server 2019+, or macOS
- **Memory**: Minimum 4GB RAM (8GB+ recommended)
- **Storage**: Minimum 20GB free space
- **Network**: Stable internet connection for AI API calls

### Required Software

- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Node.js**: Version 18+ (for manual deployment)
- **npm**: Version 8+
- **Git**: For code deployment

### Optional Software

- **Nginx**: For reverse proxy (if not using Docker)
- **PM2**: For process management (manual deployment)
- **Redis**: For caching and session storage

## Environment Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd AI-grammar-web
```

### 2. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env.production
```

Edit `.env.production` with your production values:

```env
# Frontend Configuration
VITE_API_URL=https://your-domain.com/api
VITE_APP_NAME=AI Grammar Checker
VITE_ENVIRONMENT=production

# Backend Configuration
NODE_ENV=production
PORT=3001

# Security
SESSION_SECRET=your-super-secret-session-key
JWT_SECRET=your-jwt-secret-key
ENCRYPTION_KEY=your-32-character-encryption-key

# AI Provider Configuration
OLLAMA_URL=http://localhost:11434
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GROQ_API_KEY=your-groq-api-key

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info

# Database (if applicable)
# DATABASE_URL=your-database-connection-string
```

### 3. SSL/TLS Certificates

For HTTPS deployment, place your SSL certificates in the `nginx/ssl/` directory:

```
nginx/ssl/
├── cert.pem
└── key.pem
```

## Docker Deployment (Recommended)

### Quick Start

1. **Build and Deploy**:
   ```bash
   # Using the deployment script (Linux/macOS)
   chmod +x deploy.sh
   ./deploy.sh production
   
   # Using PowerShell script (Windows)
   .\deploy.ps1 -Environment production
   
   # Manual Docker Compose
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Verify Deployment**:
   ```bash
   # Check container status
   docker-compose -f docker-compose.prod.yml ps
   
   # View logs
   docker-compose -f docker-compose.prod.yml logs -f
   
   # Test health endpoint
   curl http://localhost/health
   ```

### Docker Services

The production deployment includes:

- **ai-grammar-app**: Main application (frontend + backend)
- **nginx**: Reverse proxy and static file server
- **redis**: Caching and session storage
- **ollama**: Local AI processing (optional)

### Scaling

To scale the application:

```bash
# Scale the main application
docker-compose -f docker-compose.prod.yml up -d --scale ai-grammar-app=3

# Update Nginx configuration for load balancing
# Edit nginx/nginx.conf upstream section
```

## Manual Deployment

### Frontend Deployment

1. **Build the Frontend**:
   ```bash
   cd grammar-checker
   npm install
   npm run build:prod
   ```

2. **Deploy Static Files**:
   ```bash
   # Copy built files to web server
   cp -r dist/* /var/www/html/
   
   # Or use a CDN
   aws s3 sync dist/ s3://your-bucket-name/
   ```

### Backend Deployment

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install --production
   ```

2. **Start with PM2**:
   ```bash
   # Install PM2 globally
   npm install -g pm2
   
   # Start the application
   pm2 start ecosystem.config.js --env production
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

3. **Configure Nginx** (if not using Docker):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           root /var/www/html;
           try_files $uri $uri/ /index.html;
       }
       
       location /api/ {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## SSL/TLS Configuration

### Using Let's Encrypt (Recommended)

1. **Install Certbot**:
   ```bash
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Obtain Certificate**:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Auto-renewal**:
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

### Using Custom Certificates

1. Place certificates in `nginx/ssl/`
2. Update `nginx/nginx.conf` with correct paths
3. Restart Nginx

## Monitoring and Logging

### Application Logs

```bash
# Docker deployment
docker-compose -f docker-compose.prod.yml logs -f ai-grammar-app

# PM2 deployment
pm2 logs
```

### Health Monitoring

- **Health Endpoint**: `GET /health`
- **API Status**: `GET /api/health`
- **Metrics**: Available via Sentry (if configured)

### Log Rotation

For Docker:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

## Backup and Recovery

### Automated Backups

The deployment scripts automatically create backups:

```bash
# View backups
ls -la backups/

# Manual backup
./deploy.sh production --backup-only
```

### Recovery Process

1. **Stop Services**:
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

2. **Restore from Backup**:
   ```bash
   ./deploy.sh production --rollback
   ```

3. **Verify Recovery**:
   ```bash
   curl http://localhost/health
   ```

## Troubleshooting

### Common Issues

#### 1. Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs ai-grammar-app

# Check environment variables
docker-compose -f docker-compose.prod.yml exec ai-grammar-app env
```

#### 2. SSL Certificate Issues

```bash
# Verify certificate
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Test SSL
curl -I https://your-domain.com
```

#### 3. API Connection Issues

```bash
# Test backend directly
curl http://localhost:3001/health

# Check network connectivity
docker network ls
docker network inspect ai-grammar-network
```

#### 4. Performance Issues

```bash
# Monitor resource usage
docker stats

# Check application metrics
curl http://localhost:3001/api/metrics
```

### Debug Mode

Enable debug logging:

```bash
# Set LOG_LEVEL=debug in .env.production
echo "LOG_LEVEL=debug" >> .env.production

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Support

For additional support:

1. Check application logs
2. Review environment configuration
3. Verify network connectivity
4. Test individual components
5. Consult the troubleshooting section

## Security Checklist

- [ ] Environment variables are properly configured
- [ ] SSL/TLS certificates are valid and up-to-date
- [ ] Firewall rules are configured
- [ ] API keys are secured
- [ ] Regular security updates are applied
- [ ] Backup procedures are tested
- [ ] Monitoring is configured
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured

## Performance Optimization

### Frontend Optimization

- Static assets are served with proper caching headers
- Gzip compression is enabled
- CDN is configured for static assets
- Bundle size is optimized

### Backend Optimization

- Redis caching is enabled
- Database queries are optimized
- Connection pooling is configured
- Rate limiting is implemented

### Infrastructure Optimization

- Load balancing is configured
- Auto-scaling is set up
- Resource limits are properly configured
- Monitoring and alerting are in place

---

**Note**: This deployment guide assumes a production environment. For development or staging deployments, adjust the configuration accordingly.