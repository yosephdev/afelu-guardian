const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const emailService = require('./services/email');

const prisma = new PrismaClient();

/**
 * Create Stripe Checkout Session for Bootcamp Enrollment
 */
async function createBootcampCheckoutSession(customerEmail, customerName) {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: customerEmail,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'AI Training Bootcamp - Premium Certificate Program',
                            description: '4-week intensive AI training with professional certification (AFCP)',
                            images: ['https://your-domain.com/images/bootcamp-cover.jpg'],
                        },
                        unit_amount: 29900, // $299.00 in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.DOMAIN}/bootcamp-success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.DOMAIN}/bootcamp.html?canceled=true`,
            metadata: {
                customer_name: customerName,
                course_type: 'premium_bootcamp',
                certificate_type: 'AFCP'
            },
            allow_promotion_codes: true,
        });

        return { success: true, url: session.url, sessionId: session.id };
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Handle successful bootcamp payment
 */
async function handleBootcampPaymentSuccess(sessionId) {
    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session.payment_status === 'paid') {
            // Create course enrollment record
            const enrollment = await prisma.courseEnrollment.create({
                data: {
                    userEmail: session.customer_details.email,
                    userName: session.metadata.customer_name,
                    courseType: 'premium_bootcamp',
                    paymentAmount: 299.00,
                    stripeSessionId: sessionId,
                    enrollmentDate: new Date(),
                    progress: 0,
                    isActive: true
                }
            });

            // Send welcome email with bootcamp access details
            await sendBootcampWelcomeEmail(enrollment);

            return { success: true, enrollment };
        } else {
            throw new Error('Payment not completed');
        }
    } catch (error) {
        console.error('Error handling bootcamp payment success:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send bootcamp welcome email
 */
async function sendBootcampWelcomeEmail(enrollment) {
    try {
        const result = await emailService.sendBootcampWelcomeEmail(enrollment);
        if (result.success) {
            console.log(`✅ Welcome email sent to ${enrollment.userEmail}`);
        } else {
            console.error(`❌ Failed to send welcome email: ${result.error}`);
        }
        return result;
    } catch (error) {
        console.error('Error sending bootcamp welcome email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create promotional discount codes
 */
async function createBootcampPromoCodes() {
    try {
        // Early bird discount
        const earlyBirdCoupon = await stripe.coupons.create({
            percent_off: 20,
            duration: 'once',
            id: 'EARLY_BIRD_20',
            name: 'Early Bird Discount - 20% Off'
        });

        // Diaspora community discount
        const diasporaCoupon = await stripe.coupons.create({
            percent_off: 15,
            duration: 'once',
            id: 'DIASPORA_15',
            name: 'Ethiopian Diaspora Discount - 15% Off'
        });

        // Student discount
        const studentCoupon = await stripe.coupons.create({
            percent_off: 25,
            duration: 'once',
            id: 'STUDENT_25',
            name: 'Student Discount - 25% Off'
        });

        console.log('Promotional codes created successfully');
        return { success: true, coupons: [earlyBirdCoupon, diasporaCoupon, studentCoupon] };
    } catch (error) {
        console.error('Error creating promo codes:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    createBootcampCheckoutSession,
    handleBootcampPaymentSuccess,
    sendBootcampWelcomeEmail,
    createBootcampPromoCodes
};
