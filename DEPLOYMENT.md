# Afelu Guardian - Deployment & Testing Guide

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone or ensure you're in the project directory
cd /home/yoseph/afelu-guardian

# Copy environment variables template
cp .env.example .env

# Edit .env with your actual values
nano .env
```

### 2. Database Setup

```bash
# Install dependencies if not already done
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Optional: View database in Prisma Studio
npx prisma studio
```

### 3. Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🧪 Testing Features

### Bot Commands Testing

Use these commands in your Telegram bot:

```
/start - Welcome message and features overview
/help - Complete command list and usage guide
/fetch https://example.com - Test web content fetching
/code javascript function hello() { return "Hello World"; } - Test secure code generation
/image sunset over mountains - Test AI image generation
/translate "Hello world" to Spanish - Test translation service
/news technology - Test news aggregation
/summarize https://example.com/article - Test content summarization
```

### Web Interface Testing

1. **Homepage**: Visit `http://localhost:3000`
   - Test responsive design on different screen sizes
   - Check all navigation links work
   - Verify pricing information displays correctly

2. **Contact Form**: Fill out the contact form
   - Test validation (try submitting empty fields)
   - Test rate limiting (submit multiple times quickly)
   - Check success/error messages

3. **Admin Dashboard**: Visit `http://localhost:3000/admin`
   - Login with credentials from .env file
   - Check usage statistics
   - View activity logs
   - Monitor system health

### API Testing

```bash
# Test contact form API
curl -X POST http://localhost:3000/api/contact/submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "API Test",
    "message": "Testing the contact API endpoint"
  }'

# Test admin stats (requires authentication)
curl http://localhost:3000/admin/stats
```

## 📊 Monitoring & Analytics

### System Health Checks

- **Memory Usage**: Monitor Node.js memory consumption
- **Database Connections**: Check Prisma connection pool
- **API Response Times**: Monitor endpoint performance
- **Error Rates**: Track failed requests and exceptions

### Key Metrics to Monitor

1. **Bot Usage**: Commands per day, unique users, response times
2. **Web Traffic**: Page views, contact form submissions, conversion rates
3. **API Performance**: Request volume, error rates, latency
4. **Security**: Failed login attempts, rate limit hits, suspicious activity

## 🔧 Configuration Options

### Rate Limiting

Adjust rate limits in your environment variables:

```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # Max requests per window
```

### Logging Configuration

```env
LOG_LEVEL=info               # debug, info, warn, error
LOG_FILE_PATH=./logs/app.log # Log file location
```

### OpenAI Settings

```env
OPENAI_API_KEY=sk-...        # Your OpenAI API key
OPENAI_MODEL=gpt-3.5-turbo   # Model to use
```

## 🔒 Security Checklist

### Before Production Deployment

- [ ] Change all default passwords in `.env`
- [ ] Use strong, unique session secrets
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure firewall rules
- [ ] Set `NODE_ENV=production`
- [ ] Review and test rate limiting
- [ ] Validate all input sanitization
- [ ] Enable security headers
- [ ] Configure proper CORS policies
- [ ] Set up monitoring and alerting

### Regular Security Maintenance

- [ ] Update dependencies regularly (`npm audit`)
- [ ] Rotate API keys and secrets
- [ ] Monitor security logs
- [ ] Review user access patterns
- [ ] Test backup and recovery procedures

## 🐛 Troubleshooting

### Common Issues

**Bot not responding:**

- Check `TELEGRAM_BOT_TOKEN` in `.env`
- Verify webhook URL is accessible
- Check bot logs for errors

**Database connection errors:**

- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database permissions

**OpenAI API errors:**

- Validate `OPENAI_API_KEY`
- Check API usage limits
- Review error messages in logs

**Contact form not working:**

- Check network requests in browser dev tools
- Verify API endpoint is accessible
- Review server logs for validation errors

### Debug Mode

Enable detailed logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Performance Optimization

```bash
# Analyze bundle size
npm run analyze

# Check for security vulnerabilities
npm audit

# Monitor memory usage
node --inspect server.js
```

## 📈 Scaling Considerations

### Horizontal Scaling

- Use PM2 for process management
- Implement Redis for session storage
- Configure load balancer (nginx)
- Set up database connection pooling

### Vertical Scaling

- Monitor CPU and memory usage
- Optimize database queries
- Implement caching layers
- Use CDN for static assets

### Database Optimization

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_usage_logs_user_id ON "UsageLog"("userId");
CREATE INDEX idx_usage_logs_created_at ON "UsageLog"("createdAt");
```

## 🔄 Backup Strategy

### Database Backups

```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore backup
psql $DATABASE_URL < backup_20240101.sql
```

### Application Backups

- Code repository (Git)
- Environment variables (secure storage)
- SSL certificates
- Log files
- User-generated content

## 📞 Support & Maintenance

### Log Monitoring

```bash
# Real-time log monitoring
tail -f logs/afelu-guardian.log

# Search for errors
grep "ERROR" logs/afelu-guardian.log

# Monitor specific user activity
grep "userId:12345" logs/afelu-guardian.log
```

### Health Check Endpoint

Visit `http://localhost:3000/admin/health` to check:

- Database connectivity
- OpenAI API status
- Memory usage
- Uptime statistics

---

## 🎯 Next Steps

1. **Testing Phase**: Complete comprehensive testing of all features
2. **Production Setup**: Configure production environment and deployment
3. **Monitoring**: Set up alerting and monitoring systems
4. **Documentation**: Create user guides and API documentation
5. **Marketing**: Launch website and begin user acquisition

For additional support or questions, check the admin dashboard logs or contact the development team.
