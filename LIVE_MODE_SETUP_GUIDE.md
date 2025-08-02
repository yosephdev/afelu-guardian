# 🔴 LIVE MODE PAYMENT LINKS CREATION GUIDE

## STEP 1: Switch to Live Mode
1. Go to Stripe Dashboard
2. Toggle "Test mode" OFF (switch to Live mode)
3. You'll see the live dashboard

## STEP 2: Create Live Payment Links

### 1. Weekly Access Code - $5.00 USD
- **Billing**: Weekly
- **Amount**: $5.00 USD
- **Description**: Weekly access to AI tools and courses
- **Copy the Payment Link URL and Price ID**

### 2. Family Plan - $25.00 USD/month
- **Billing**: Monthly  
- **Amount**: $25.00 USD
- **Description**: Family plan for 4 members in Ethiopia
- **Copy the Payment Link URL and Price ID**

### 3. Community Plan - $50.00 USD/month
- **Billing**: Monthly
- **Amount**: $50.00 USD  
- **Description**: Community plan supporting 10 people
- **Copy the Payment Link URL and Price ID**

### 4. AI Training Bootcamp - $299.00 USD
- **Billing**: One-time payment
- **Amount**: $299.00 USD
- **Description**: 4-week intensive AI training with certification
- **Copy the Payment Link URL and Price ID**

### 5. Premium Access - $79.00 USD/month
- **Billing**: Monthly
- **Amount**: $79.00 USD
- **Description**: Unlimited AI tools with priority support
- **Copy the Payment Link URL and Price ID**

## STEP 3: Update Environment Variables

After creating all Payment Links, update your .env file:

```bash
# LIVE MODE Stripe Configuration
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET

# LIVE MODE Price IDs
STRIPE_PRICE_ID_WEEKLY=price_LIVE_WEEKLY_ID
STRIPE_PRICE_ID_FAMILY=price_LIVE_FAMILY_ID  
STRIPE_PRICE_ID_COMMUNITY=price_LIVE_COMMUNITY_ID
STRIPE_PRICE_ID_BOOTCAMP=price_LIVE_BOOTCAMP_ID
STRIPE_PRICE_ID_PREMIUM=price_LIVE_PREMIUM_ID
```

## STEP 4: Update Payment Links in Code

Update payment-links.js with the new LIVE Payment Links:

```javascript
const STRIPE_PAYMENT_LINKS = {
    bootcamp: "https://buy.stripe.com/LIVE_BOOTCAMP_LINK",
    premium: "https://buy.stripe.com/LIVE_PREMIUM_LINK", 
    family: "https://buy.stripe.com/LIVE_FAMILY_LINK",
    community: "https://buy.stripe.com/LIVE_COMMUNITY_LINK",
    weekly: "https://buy.stripe.com/LIVE_WEEKLY_LINK"
};
```

## STEP 5: Update HTML Files

Replace all test_ Payment Links with live Payment Links in:
- public/index.html
- public/bootcamp.html

## STEP 6: Set Production Mode

```bash
NODE_ENV=production
```

## IMPORTANT NOTES

⚠️ **LIVE MODE = REAL MONEY**: All payments will charge real credit cards
⚠️ **Test Cards Won't Work**: Only real credit cards will work in live mode
⚠️ **Webhook URL**: Update webhook endpoint to production URL
⚠️ **SSL Required**: Must use HTTPS for live payments

## SAFETY CHECKLIST

□ Backup current .env file
□ Test one payment link before updating all
□ Verify webhook is working in live mode
□ Double-check all amounts are correct
□ Ensure refund policy is in place
