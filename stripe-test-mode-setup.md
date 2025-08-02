# Stripe Test Mode Setup Instructions

## Current Issue

- Your Payment Links were created in **LIVE MODE**
- Your application is now set to **TEST MODE**
- Test cards don't work with live Payment Links

## Solution: Create Test Payment Links

### Step 1: Switch to Test Mode

1. Go to your Stripe Dashboard
2. Look for the "Test mode" toggle in the top-left corner
3. Make sure it's **ON** (should show "Test mode")

### Step 2: Create Test Payment Links

Create these Payment Links in TEST MODE:

1. **Weekly Access Code**
   - Amount: $5.00 USD
   - Billing: Weekly
   - Copy the new test Price ID

2. **Family Plan**
   - Amount: $25.00 USD  
   - Billing: Monthly
   - Copy the new test Price ID

3. **Community Plan**
   - Amount: $50.00 USD
   - Billing: Monthly
   - Copy the new test Price ID

4. **AI Training Bootcamp**
   - Amount: $299.00 USD
   - Billing: One-time
   - Copy the new test Price ID

5. **Premium Access**
   - Amount: $79.00 USD
   - Billing: Monthly
   - Copy the new test Price ID

### Step 3: Update Environment Variables

Replace these in your .env file with the NEW test Price IDs:

```bash
# Test Mode Price IDs (replace with actual test Price IDs)
STRIPE_PRICE_ID_FAMILY=price_TEST_FAMILY_ID_HERE
STRIPE_PRICE_ID_COMMUNITY=price_TEST_COMMUNITY_ID_HERE
STRIPE_PRICE_ID_WEEKLY=price_TEST_WEEKLY_ID_HERE
STRIPE_PRICE_ID_BOOTCAMP=price_TEST_BOOTCAMP_ID_HERE
STRIPE_PRICE_ID_PREMIUM=price_TEST_PREMIUM_ID_HERE
```

### Step 4: Test with Test Cards

Use these test card numbers:

**Successful Payment:**

- Card: 4242 4242 4242 4242
- Expiry: Any future date
- CVC: Any 3 digits

**Declined Payment:**

- Card: 4000 0000 0000 0002
- Expiry: Any future date
- CVC: Any 3 digits

### Step 5: Update Railway Variables

After getting test Price IDs, update Railway:

```bash
railway variables --set STRIPE_PRICE_ID_FAMILY=price_TEST_FAMILY_ID
railway variables --set STRIPE_PRICE_ID_COMMUNITY=price_TEST_COMMUNITY_ID
railway variables --set STRIPE_PRICE_ID_WEEKLY=price_TEST_WEEKLY_ID
railway variables --set STRIPE_PRICE_ID_BOOTCAMP=price_TEST_BOOTCAMP_ID
railway variables --set STRIPE_PRICE_ID_PREMIUM=price_TEST_PREMIUM_ID
```

## Quick Fix for Immediate Testing

You can test the custom checkout form (not Payment Links) with test cards right now since I've switched Railway to test mode.
