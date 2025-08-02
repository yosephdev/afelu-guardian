# How to Update Stripe Price IDs for Payment Links

## Steps to Find Your Price IDs:

1. **Go to Stripe Dashboard** → Products and Pricing → Payment Links
2. **Click on each Payment Link** you created
3. **Copy the Price ID** (starts with `price_`)

## Update These in Your .env File:

Replace the placeholder values with your actual Price IDs from Stripe:

```bash
# Current Payment Links (update these)
STRIPE_PRICE_ID_WEEKLY=price_YOUR_WEEKLY_5_DOLLAR_ID_HERE
STRIPE_PRICE_ID_BOOTCAMP=price_YOUR_BOOTCAMP_299_DOLLAR_ID_HERE  
STRIPE_PRICE_ID_PREMIUM=price_YOUR_PREMIUM_79_DOLLAR_ID_HERE

# Existing Price IDs (verify these are correct)
STRIPE_PRICE_ID_FRIEND=price_1RqVfVA4fb84QLrklP2XEZNo
STRIPE_PRICE_ID_FAMILY=price_1RqGUtA4fb84QLrkmtc8MHM6
STRIPE_PRICE_ID_COMMUNITY=price_1RqGL9A4fb84QLrk8uEEjuDs
```

## Payment Link Mapping:

- **Weekly Access Code** ($5/week) → `STRIPE_PRICE_ID_WEEKLY`
- **Family Plan** ($25/month) → `STRIPE_PRICE_ID_FAMILY` 
- **Community Plan** ($50/month) → `STRIPE_PRICE_ID_COMMUNITY`
- **AI Training Bootcamp** ($299 one-time) → `STRIPE_PRICE_ID_BOOTCAMP`
- **Premium Access** ($79/month) → `STRIPE_PRICE_ID_PREMIUM`

## After Updating:

1. Update your .env file with actual Price IDs
2. Update Railway environment variables to match
3. Restart your application
4. Test payment links to ensure they work correctly

## Security Note:

The updated provisioning.js now:
- ✅ Removes hardcoded fallback Price IDs
- ✅ Only accepts Price IDs defined in environment variables
- ✅ Validates all Price IDs before processing
- ✅ Supports new payment link types (Weekly, Bootcamp, Premium)
