# 🚂 Railway Deployment Guide for Afelu Guardian

## 🎯 Why Railway is Perfect for Your Project

Railway will handle everything automatically:

- ✅ **PostgreSQL database** (no setup needed)
- ✅ **HTTPS certificates** (automatic)
- ✅ **Environment variables** (web UI management)
- ✅ **GitHub integration** (auto-deploy on push)
- ✅ **Logs and monitoring** (built-in)

## 🚀 Step-by-Step Deployment

### 1. Prepare Your Environment Variables

Create a `.env.production` file with these values:

```bash
# Production Environment
NODE_ENV=production
PORT=3000

# Database (Railway will auto-provide this)
# DATABASE_URL=postgresql://... (automatically set by Railway)

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_production_bot_token
TELEGRAM_WEBHOOK_URL=https://your-app-name.railway.app/webhook

# AI Services
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_fallback_key

# Stripe (USE LIVE KEYS FOR PRODUCTION)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service
EMAIL_SERVICE=gmail
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Security
JWT_SECRET=your-super-secure-random-string
DOMAIN=https://your-app-name.railway.app
```

### 2. Deploy to Railway

1. **Go to [railway.app](https://railway.app)** and sign up with GitHub

2. **Click "Deploy from GitHub repo"**

3. **Select your `afelu-guardian` repository**

4. **Railway will automatically:**
   - Detect it's a Node.js project
   - Create a PostgreSQL database
   - Set up the environment

5. **Add Environment Variables:**
   - Go to your project dashboard
   - Click "Variables" tab
   - Add all the variables from `.env.production` above
   - **Don't add DATABASE_URL** - Railway provides this automatically

6. **Deploy automatically!**
   - Railway will build and deploy your app
   - You'll get a URL like `https://your-app-name.railway.app`

### 3. Post-Deployment Setup

#### Update Telegram Webhook

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-app-name.railway.app/webhook"}'
```

#### Update Stripe Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Update your webhook URL to: `https://your-app-name.railway.app/stripe/webhook`
3. Make sure these events are selected:
   - `checkout.session.completed`
   - `payment_intent.succeeded`

#### Run Database Migrations

Railway will automatically run `npm install`, but you might need to run:

```bash
# Railway should handle this, but if needed:
npx prisma migrate deploy
npx prisma generate
```

### 4. Verify Everything Works

✅ **Test your website**: Visit `https://your-app-name.railway.app`
✅ **Test Telegram bot**: Send `/start` to your bot
✅ **Test payments**: Try buying a plan (use test mode first)
✅ **Check database**: Verify data is being stored

## 📊 Cost Estimation

### Railway Pricing

- **Starter Plan**: $5/month
  - Includes PostgreSQL database
  - 500 hours of usage (more than enough)
  - Custom domain support

### Expected Monthly Costs

```
Railway Hosting:        $5
Claude API (1000 req):  ~$10-15
Stripe Processing:      ~3% of revenue
Domain (optional):      ~$12/year

Total: ~$15-20/month
```

### Revenue vs Costs

```
If you sell just 2 Family Plans ($24.99 each):
Revenue: $49.98/month
Costs: ~$15-20/month
Profit: ~$30/month (60% margin)
```

## 🔧 Troubleshooting

### Common Issues

#### Build Failures

```bash
# If build fails, check these:
1. Ensure package.json has correct dependencies
2. Check if any console.log statements are causing issues
3. Verify environment variables are set
```

#### Database Connection Issues

```bash
# Railway provides DATABASE_URL automatically
# Don't set it manually in variables
# If issues persist, check Railway logs
```

#### Telegram Webhook Not Working

```bash
# Verify webhook is set correctly:
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Should show your Railway URL
```

## 🎯 Advanced: Custom Domain

### Add Your Own Domain (Optional)

1. **Buy a domain** (Namecheap, GoDaddy, etc.)

2. **In Railway:**
   - Go to Settings → Domains
   - Click "Add Custom Domain"
   - Enter your domain (e.g., `afeliguardian.com`)

3. **Update DNS:**
   - Add CNAME record: `www` → `your-app-name.railway.app`
   - Add A record: `@` → Railway's IP (they'll provide it)

4. **Update Environment Variables:**

   ```bash
   DOMAIN=https://afeliguardian.com
   TELEGRAM_WEBHOOK_URL=https://afeliguardian.com/webhook
   ```

5. **Update Stripe webhook URL** to your custom domain

## 🎉 You're Live

Once deployed on Railway:

- ✅ **Secure HTTPS** automatically
- ✅ **Auto-scaling** based on traffic
- ✅ **Database backups** handled by Railway
- ✅ **Easy monitoring** through Railway dashboard
- ✅ **Git-based deployment** (push to deploy)

Your Afelu Guardian platform is now production-ready and serving users! 🇪🇹✨

## 📞 Support

If you encounter issues:

1. Check Railway logs in the dashboard
2. Verify all environment variables are set
3. Test Telegram webhook with `/getWebhookInfo`
4. Ensure Stripe webhooks point to the right URL

Railway has excellent documentation and support if you need help!
