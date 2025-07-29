require('dotenv').config();
const express = require('express');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // You'll need to get a secret key from your Stripe Dashboard's developer section
const prisma = require('./prisma');
const { provisionAccessCodes } = require('./provisioning'); // We will create this file next

const app = express();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// A simple API endpoint for health checks
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Stripe webhook handler
// Use express.raw({type: 'application/json'}) to get the raw body, which is needed for signature verification
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (request, response) => {
    const sig = request.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
        console.log(`❌ Webhook signature verification failed.`, err.message);
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('✅ Payment successful for session:', session.id);

            // Fulfill the purchase by provisioning access codes
            await provisionAccessCodes(session);

            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.json({received: true});
});

// Serve static files from the 'public' directory AFTER the webhook handler
app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;