# 🚄 RAILWAY DEPLOYMENT TEMPLATE

## Environment Variables Required on Railway

### 1. Stripe Configuration (LIVE MODE)

```bash
STRIPE_SECRET_KEY=sk_live_[YOUR_SECRET_KEY_HERE]
STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR_PUBLISHABLE_KEY_HERE]
STRIPE_WEBHOOK_SECRET=whsec_[YOUR_WEBHOOK_SECRET_HERE]
```

### 2. Live Price IDs

```bash
STRIPE_PRICE_ID_WEEKLY=price_[YOUR_WEEKLY_PRICE_ID]
STRIPE_PRICE_ID_FAMILY=price_[YOUR_FAMILY_PRICE_ID]
STRIPE_PRICE_ID_COMMUNITY=price_[YOUR_COMMUNITY_PRICE_ID]
STRIPE_PRICE_ID_BOOTCAMP=price_[YOUR_BOOTCAMP_PRICE_ID]
STRIPE_PRICE_ID_PREMIUM=price_[YOUR_PREMIUM_PRICE_ID]
```

### 3. Production Configuration

```bash
NODE_ENV=production
WEBHOOK_URL=https://[YOUR_DOMAIN]
DOMAIN=https://[YOUR_DOMAIN]
```

### 4. Email Configuration

```bash
ZOHO_EMAIL=[YOUR_SUPPORT_EMAIL]
ZOHO_APP_PASSWORD=[YOUR_APP_PASSWORD]
ADMIN_EMAIL=[YOUR_ADMIN_EMAIL]
```

### 5. AI Service Keys

```bash
OPENAI_API_KEY=sk-proj-[YOUR_OPENAI_KEY]
ANTHROPIC_API_KEY=sk-ant-[YOUR_CLAUDE_KEY]
```

### 6. Telegram Bot

```bash
TELEGRAM_BOT_TOKEN=[YOUR_BOT_TOKEN]
```

## How to Update Railway Variables

### Option 1: Railway CLI (Recommended)

```bash
# Install Railway CLI if not installed
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Set variables (replace [YOUR_VALUES] with actual values)
railway variables set STRIPE_SECRET_KEY="[YOUR_SECRET_KEY]"
railway variables set STRIPE_PUBLISHABLE_KEY="[YOUR_PUBLISHABLE_KEY]"
# ... continue with all variables
```

### Option 2: Railway Dashboard

1. Go to **railway.app**
2. Select your project
3. Click **Variables** tab
4. Update each variable with your actual values

## Deploy Updated Code

```bash
# Add all changes
git add .

# Commit changes
git commit -m "🚀 LIVE MODE: Updated Payment Links and configuration"

# Push to trigger deployment
git push origin main
```

## ⚠️ Security Notes

- **NEVER** commit actual API keys to git
- Always use environment variables for secrets
- Keep sensitive deployment docs local only
- Use .gitignore to prevent accidental commits

## Verification Steps

1. Check Railway logs after deployment
2. Test payment flow with small amount
3. Monitor Stripe Dashboard for transactions
4. Verify webhook functionality
5. Check all services are running properly

## Webhook Configuration

Set up webhook endpoint in Stripe Dashboard:
- URL: `https://[YOUR_DOMAIN]/api/stripe-webhook`
- Events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`
