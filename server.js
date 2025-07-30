require('dotenv').config();
const express = require('express');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const prisma = require('./prisma');
const { provisionAccessCodes } = require('./provisioning');
// const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const loggingService = require('./services/logging');

const app = express();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Security middleware
app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content Security Policy
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://js.stripe.com",
        "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com https://cdnjs.cloudflare.com",
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.stripe.com",
        "frame-src https://js.stripe.com"
    ].join('; ');
    res.setHeader('Content-Security-Policy', csp);
    
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    next();
});

// Rate limiting for API endpoints
const apiRateLimit = new Map();
function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100; // per window
    
    const clientRequests = apiRateLimit.get(ip) || { count: 0, resetTime: now + windowMs };
    
    if (now > clientRequests.resetTime) {
        clientRequests.count = 0;
        clientRequests.resetTime = now + windowMs;
    }
    
    if (clientRequests.count >= maxRequests) {
        return res.status(429).json({ error: 'Too many requests' });
    }
    
    clientRequests.count++;
    apiRateLimit.set(ip, clientRequests);
    next();
}

// Apply rate limiting to API routes
app.use('/api/', rateLimitMiddleware);

// Body parsing middleware (placed before routes, Stripe webhook has its own raw parser)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Contact routes (replaces the old contact handler)
// Contact routes
app.use('/api/contact', contactRoutes);

// Admin routes
// app.use('/admin', adminRoutes);

// A simple API endpoint for health checks
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API endpoint to get system status (protected)
app.get('/api/status', async (req, res) => {
    try {
        const stats = await prisma.$queryRaw`
            SELECT 
                (SELECT COUNT(*) FROM "Sponsor") as sponsors,
                (SELECT COUNT(*) FROM "AccessCode" WHERE status = 'NEW') as available_codes,
                (SELECT COUNT(*) FROM "AccessCode" WHERE status = 'USED') as used_codes,
                (SELECT COUNT(*) FROM "User") as users
        `;
        
        res.json({
            status: 'operational',
            stats: stats[0],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Status check failed:', error);
        res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
});

// Stripe webhook handler
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (request, response) => {
    const sig = request.headers['stripe-signature'];
    let event;

    try {
        if (!endpointSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET not configured');
        }
        
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
        // Log webhook events only in development
        if (process.env.NODE_ENV !== 'production') {
            console.log(`📧 Received webhook: ${event.type}`);
        }
        
    } catch (err) {
        console.log(`❌ Webhook signature verification failed:`, err.message);
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                // Log payment success only in development
                if (process.env.NODE_ENV !== 'production') {
                    console.log('💳 Payment successful for session:', session.id);
                }

                // Fulfill the purchase by provisioning access codes
                const result = await provisionAccessCodes(session);
                
                if (result?.success) {
                    console.log(`✅ Successfully provisioned ${result.codes.length} codes for ${result.tier} plan`);
                } else {
                    console.error('❌ Failed to provision codes');
                }
                break;
                
            case 'invoice.payment_succeeded':
                console.log('💰 Recurring payment succeeded:', event.data.object.id);
                // Handle recurring payments if needed
                break;
                
            case 'customer.subscription.deleted':
                console.log('🔴 Subscription cancelled:', event.data.object.id);
                // Handle subscription cancellation if needed
                break;
                
            default:
                console.log(`ℹ️ Unhandled event type: ${event.type}`);
        }

        // Return a 200 response to acknowledge receipt of the event
        response.json({received: true, processed: true});
        
    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        response.status(500).json({received: true, processed: false, error: 'Internal server error'});
    }
});

// Serve static files with caching headers
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    etag: true,
    lastModified: true
}));

// Root route handler
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;