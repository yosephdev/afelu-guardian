# Afelu Guardian

Bridge the digital divide by providing secure access to AI tools and information.

## 🎯 Mission

Afelu Guardian provides Ethiopians with access to censored information and AI tools like ChatGPT through a "Sponsored Access" model designed for user safety.

## 🏗️ Architecture

### Workflow

1. **Sponsor** (diaspora) buys subscription on `afelu.com`
2. **System** auto-generates unique access codes via Stripe webhook
3. **Sponsor** privately sends codes to **Users** in Ethiopia
4. **User** redeems code in private Telegram bot for quota
5. **User** sends `/gpt` or `/fetch` commands to access services

This decouples payment from usage, protecting end-user identity.

## 🛠️ Technical Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Stripe with webhooks
- **Bot**: node-telegram-bot-api
- **AI**: OpenAI API
- **Web Scraping**: JSDOM
- **Deployment**: Render/Railway/Heroku

## 🚀 Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Telegram Bot Token
- Stripe account
- OpenAI API key (optional)

### Installation

1. **Clone and install dependencies**

```bash
git clone <repository>
cd afelu-guardian
npm install
```

2. **Environment Setup**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**

```bash
npm run db:push
npm run db:generate
```

4. **Start the application**

```bash
npm run dev  # Development with Prisma Studio
npm start    # Production
```

## 🔧 Configuration

### Required Environment Variables

```env
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_FRIEND=price_...
STRIPE_PRICE_ID_FAMILY=price_...
STRIPE_PRICE_ID_COMMUNITY=price_...

# Database
DATABASE_URL=postgresql://...

# OpenAI (optional)
OPENAI_API_KEY=sk-...

# Admin Dashboard
ADMIN_PASSWORD=secure_password
```

### Stripe Setup

1. Create products and prices in Stripe Dashboard
2. Set up webhook endpoint pointing to `/api/stripe-webhook`
3. Enable `checkout.session.completed` events
4. Copy webhook secret and price IDs to `.env`

### Telegram Bot Setup

1. Create bot via @BotFather
2. Get bot token
3. Set webhook or use polling (default)

## 📱 Bot Commands

- `/start` - Get started
- `/redeem ET-XXXX-XXXX` - Redeem access code
- `/gpt <question>` - Ask AI a question
- `/fetch <url>` - Fetch website content
- `/myquota` - Check remaining quota
- `/help` - Show help

## 🔒 Security Features

### Input Validation

- Access code format validation
- URL safety checks for web fetching
- Input sanitization and length limits

### Rate Limiting

- Per-user rate limits on commands
- API endpoint rate limiting
- Strict redeem attempt limits

### Access Control

- Cryptographically secure code generation
- Admin dashboard authentication
- Webhook signature verification

### Privacy Protection

- No logging of personal data
- Minimal user tracking
- Secure code distribution model

## 📊 Admin Dashboard

Access admin features at `/admin/*` endpoints:

```bash
# Dashboard overview
curl -H "Authorization: Bearer $ADMIN_PASSWORD" \
     http://localhost:3000/admin/dashboard

# Generate codes manually
curl -X POST \
     -H "Authorization: Bearer $ADMIN_PASSWORD" \
     -H "Content-Type: application/json" \
     -d '{"sponsorEmail":"sponsor@example.com","count":5}' \
     http://localhost:3000/admin/generate-codes
```

## 🚀 Deployment

### Render/Railway Deployment

1. **Database**: Use managed PostgreSQL
2. **Environment**: Set all required variables
3. **Build**: `npm install && npx prisma generate`
4. **Start**: `npm start`

### Health Checks

- Health: `GET /api/health`
- Status: `GET /api/status`

## 📈 Monitoring

### Usage Analytics

- User activity tracking
- Command usage statistics
- Quota consumption monitoring

### Database Logging

- All user actions logged
- Sponsor and code provisioning tracked
- Error logging and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

ISC License - See LICENSE file

## 🆘 Support

For technical issues: <support@afelu.com>

---

**Note**: This system is designed to protect user privacy and provide safe access to information. Always follow local laws and regulations.
