# Security Configuration Guide

This document outlines the security measures implemented in the AI Grammar Checker application and provides recommendations for maintaining security in production.

## 🔒 Security Features Implemented

### 1. Container Security

✅ **Non-root User**: Application runs as `nodejs` user (UID 1001)
✅ **Multi-stage Build**: Minimizes attack surface by excluding build dependencies
✅ **Alpine Linux**: Uses minimal base image with reduced attack surface
✅ **Health Checks**: Monitors application health and enables automatic recovery

### 2. Network Security

✅ **HTTPS Enforcement**: All HTTP traffic redirected to HTTPS
✅ **TLS 1.2/1.3**: Modern SSL/TLS protocols only
✅ **Strong Ciphers**: ECDHE cipher suites with perfect forward secrecy
✅ **Rate Limiting**: API (10 req/s) and general (100 req/s) rate limits

### 3. HTTP Security Headers

✅ **HSTS**: Strict-Transport-Security with 2-year max-age
✅ **X-Frame-Options**: DENY to prevent clickjacking
✅ **X-Content-Type-Options**: nosniff to prevent MIME sniffing
✅ **X-XSS-Protection**: Browser XSS protection enabled
✅ **CSP**: Content Security Policy restricts resource loading
✅ **Referrer-Policy**: Limits referrer information leakage

### 4. Application Security

✅ **Environment Variables**: Sensitive data stored in environment variables
✅ **Session Security**: Secure session management with strong secrets
✅ **JWT Security**: JSON Web Tokens with strong signing keys
✅ **Input Validation**: Server-side validation for all inputs
✅ **CORS Configuration**: Proper Cross-Origin Resource Sharing setup

### 5. Dependency Security

✅ **Vulnerability Scanning**: Regular `npm audit` checks
✅ **Updated Dependencies**: Latest security patches applied
✅ **Production Dependencies**: Only necessary packages in production

## 🛡️ Security Checklist

### Before Deployment

- [ ] **Change Default Secrets**
  - [ ] Generate strong `SESSION_SECRET` (min 32 characters)
  - [ ] Generate strong `JWT_SECRET` (min 32 characters)
  - [ ] Generate strong `ENCRYPTION_KEY` (exactly 32 characters)

- [ ] **SSL/TLS Configuration**
  - [ ] Obtain valid SSL certificates
  - [ ] Update domain names in nginx.conf
  - [ ] Test SSL configuration with SSL Labs

- [ ] **Environment Variables**
  - [ ] Create `.env.production` with real values
  - [ ] Verify no secrets in source code
  - [ ] Ensure `.env*` files in .gitignore

- [ ] **Firewall Configuration**
  - [ ] Open only necessary ports (80, 443)
  - [ ] Block direct access to application port (3001)
  - [ ] Configure fail2ban for brute force protection

### Regular Maintenance

- [ ] **Security Updates**
  - [ ] Run `npm audit` monthly
  - [ ] Update dependencies quarterly
  - [ ] Monitor security advisories

- [ ] **Log Monitoring**
  - [ ] Review access logs weekly
  - [ ] Monitor error logs daily
  - [ ] Set up alerting for suspicious activity

- [ ] **Backup Security**
  - [ ] Encrypt backup files
  - [ ] Secure backup storage
  - [ ] Test backup restoration

## 🔧 Security Configuration

### Required Environment Variables

```env
# Strong secrets (generate with: openssl rand -base64 32)
SESSION_SECRET=your-super-secure-session-secret-min-32-chars
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
ENCRYPTION_KEY=your-32-character-encryption-key-here

# API Keys (store securely)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
```

### SSL Certificate Setup

1. **Obtain Certificates**:
   ```bash
   # Let's Encrypt (recommended)
   certbot certonly --webroot -w /var/www/html -d your-domain.com
   
   # Copy to nginx directory
   cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
   cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
   ```

2. **Update nginx.conf**:
   ```nginx
   server_name your-actual-domain.com www.your-actual-domain.com;
   ```

### Firewall Configuration

```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 🚨 Security Monitoring

### Log Files to Monitor

- **Nginx Access Logs**: `/var/log/nginx/access.log`
- **Nginx Error Logs**: `/var/log/nginx/error.log`
- **Application Logs**: `docker-compose logs ai-grammar-app`
- **System Logs**: `/var/log/syslog`

### Security Alerts

Set up monitoring for:
- Multiple failed login attempts
- Unusual API usage patterns
- High error rates
- Disk space usage
- Memory/CPU spikes

### Recommended Tools

- **Fail2ban**: Automatic IP blocking
- **Logwatch**: Log analysis and reporting
- **OSSEC**: Host-based intrusion detection
- **Sentry**: Error tracking and monitoring

## 🔍 Security Testing

### SSL/TLS Testing

```bash
# Test SSL configuration
ssl-labs-scan --host=your-domain.com

# Test with OpenSSL
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### Security Headers Testing

```bash
# Test security headers
curl -I https://your-domain.com

# Use online tools
# - securityheaders.com
# - observatory.mozilla.org
```

### Vulnerability Scanning

```bash
# Scan for vulnerabilities
nmap -sV --script vuln your-domain.com

# Application security testing
# - OWASP ZAP
# - Burp Suite
```

## 📋 Incident Response

### Security Incident Checklist

1. **Immediate Response**
   - [ ] Isolate affected systems
   - [ ] Preserve evidence
   - [ ] Assess impact

2. **Investigation**
   - [ ] Review logs
   - [ ] Identify attack vector
   - [ ] Determine data exposure

3. **Recovery**
   - [ ] Patch vulnerabilities
   - [ ] Restore from clean backups
   - [ ] Update security measures

4. **Post-Incident**
   - [ ] Document lessons learned
   - [ ] Update security procedures
   - [ ] Notify stakeholders if required

## 🔗 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Nginx Security Guide](https://nginx.org/en/docs/http/securing_nginx.html)
- [Let's Encrypt](https://letsencrypt.org/)

## 📞 Security Contacts

- **Security Team**: security@your-company.com
- **Emergency Contact**: +1-xxx-xxx-xxxx
- **Incident Response**: incident@your-company.com

---

**⚠️ Important**: This security guide should be reviewed and updated regularly. Security is an ongoing process, not a one-time setup.

**🔄 Last Updated**: [Update this date when making changes]
**👤 Reviewed By**: [Security team member]
**📅 Next Review**: [Schedule next review date]