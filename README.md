
# Afelu Guardian

**Empowering Ethiopians with AI education, professional training, and business solutions.**

Afelu Guardian is Ethiopia's leading hybrid platform for AI literacy, professional upskilling, and business transformation. We support diaspora families and Ethiopian professionals with secure, affordable access to world-class AI tools, training, and enterprise solutions.

---

## 🚀 What is Afelu Guardian?

Afelu Guardian bridges the digital divide by delivering:

- **AI Training & Education:** Bootcamps, corporate programs, and 1-on-1 coaching to master ChatGPT, Claude, and other AI tools.
- **Premium Access Plans:** Subscription-based access codes for families, sponsored by diaspora, starting from $5/week.
- **Business AI Solutions:** Custom AI integration, strategic consulting, and enterprise development for organizations.

### Hybrid Business Model

- **Diaspora Sponsorship:** Family access codes for Ethiopians, paid by sponsors abroad.
- **Professional Services:** Advanced training and business solutions for professionals and enterprises.

### Pricing Highlights

- Family Access: $5–$50/month
- Professional Bootcamp: $299+
- Premium Business Plans: $79+/month
- Enterprise Solutions: $5,000+

Learn more at [afelu.com](https://www.afelu.com)

---

## 🎯 Mission

To empower Ethiopians and the diaspora with digital literacy, professional AI skills, and business innovation—supporting families, careers, and enterprises for a brighter future.

---

## 🏗️ How It Works

1. **Sponsor** (diaspora) buys subscription on `afelu.com`
2. **System** auto-generates unique access codes via Stripe webhook
3. **Sponsor** privately sends codes to **Users** in Ethiopia
4. **User** redeems code in private Telegram bot for quota
5. **User** sends `/gpt` or `/fetch` commands to access services

This decouples payment from usage, protecting end-user identity and privacy.

---

## 🛠️ Technical Overview

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Payments:** Stripe with webhooks
- **Bot:** node-telegram-bot-api
- **AI:** OpenAI API
- **Web Scraping:** JSDOM
- **Deployment:** Render, Railway, Heroku

---

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Telegram Bot Token
- Stripe account
- OpenAI API key (optional)

### Installation

```bash
git clone https://github.com/yosephdev/afelu-guardian.git
cd afelu-guardian
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Database Setup

```bash
npm run db:push
npm run db:generate
```

### Start the Application

```bash
npm run dev  # Development with Prisma Studio
npm start    # Production
```

---

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

---

## 💳 Stripe Setup

1. Create products and prices in Stripe Dashboard
2. Set up webhook endpoint pointing to `/api/stripe-webhook`
3. Enable `checkout.session.completed` events
4. Copy webhook secret and price IDs to `.env`

## 🤖 Telegram Bot Setup

1. Create bot via @BotFather
2. Get bot token
3. Set webhook or use polling (default)

---

## 📱 Bot Commands

- `/start` - Get started
- `/redeem ET-XXXX-XXXX` - Redeem access code
- `/gpt <question>` - Ask AI a question
- `/fetch <url>` - Fetch website content
- `/myquota` - Check remaining quota
- `/help` - Show help

---

## 🔒 Security & Privacy

- Access code format validation
- URL safety checks for web fetching
- Input sanitization and length limits
- Per-user rate limits on commands
- API endpoint rate limiting
- Strict redeem attempt limits
- Cryptographically secure code generation
- Admin dashboard authentication
- Webhook signature verification
- No logging of personal data
- Minimal user tracking
- Secure code distribution model

---

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

---

## 🚀 Deployment

### Render/Railway Deployment

1. **Database:** Use managed PostgreSQL
2. **Environment:** Set all required variables
3. **Build:** `npm install && npx prisma generate`
4. **Start:** `npm start`

### Health Checks

- Health: `GET /api/health`
- Status: `GET /api/status`

---

## 📈 Monitoring & Analytics

- User activity tracking
- Command usage statistics
- Quota consumption monitoring
- Sponsor and code provisioning tracked
- Error logging and monitoring

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

---


## 📄 License

ISC License – See [LICENSE](./LICENSE) file

---

## 🆘 Support

For technical issues: <support@afelu.com>

---

**Note:** This system is designed to protect user privacy and provide safe access to information. Always follow local laws and regulations.

## 🏗️ Architecture & Workflow

1. **Sponsor** (diaspora) buys subscription on `afelu.com`
2. **System** auto-generates unique access codes via Stripe webhook
3. **Sponsor** privately sends codes to **Users** in Ethiopia
4. **User** redeems code in private Telegram bot for quota
5. **User** sends `/gpt` or `/fetch` commands to access services

This decouples payment from usage, protecting end-user identity and privacy.

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
