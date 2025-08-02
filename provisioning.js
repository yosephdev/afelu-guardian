const prisma = require('./prisma');
const { generateSecureRandomString } = require('./utils/validation');
const emailService = require('./services/email');

// Function to generate a unique, formatted access code using crypto-secure randomness
function generateAccessCode() {
    const randomPart = generateSecureRandomString(8);
    return `ET-${randomPart.slice(0, 4)}-${randomPart.slice(4, 8)}`;
}

// Validate price ID to prevent unauthorized provisioning
function validatePriceId(priceId) {
    const validPriceIds = [
        process.env.STRIPE_PRICE_ID_FAMILY,
        process.env.STRIPE_PRICE_ID_COMMUNITY,
        process.env.STRIPE_PRICE_ID_WEEKLY,
        process.env.STRIPE_PRICE_ID_BOOTCAMP,
        process.env.STRIPE_PRICE_ID_PREMIUM
    ].filter(Boolean); // Remove any undefined values
    
    return validPriceIds.includes(priceId);
}

// This is the core function that runs after a successful payment
async function provisionAccessCodes(session) {
    try {
        const stripeCustomerId = session.customer;
        const sponsorEmail = session.customer_details?.email;
        
        // Validation
        if (!stripeCustomerId || !sponsorEmail) {
            console.error('❌ Missing required session data:', { stripeCustomerId, sponsorEmail });
            return;
        }

        // Get line items to find the price ID
        if (!session.line_items?.data?.[0]?.price?.id) {
            console.error('❌ No line items found in session');
            return;
        }

        const priceId = session.line_items.data[0].price.id;
        
        // Validate price ID for security
        if (!validatePriceId(priceId)) {
            console.error('❌ Invalid or unauthorized price ID:', priceId);
            return;
        }

        // 1. Determine the plan and number of codes
        let planDetails = {};
        switch (priceId) {
            case process.env.STRIPE_PRICE_ID_FAMILY:
                planDetails = { tier: 'Family', codesToGenerate: 7 };
                break;
            case process.env.STRIPE_PRICE_ID_COMMUNITY:
                planDetails = { tier: 'Community', codesToGenerate: 20 };
                break;
            case process.env.STRIPE_PRICE_ID_WEEKLY:
                planDetails = { tier: 'Weekly', codesToGenerate: 1 };
                break;
            case process.env.STRIPE_PRICE_ID_BOOTCAMP:
                planDetails = { tier: 'Bootcamp', codesToGenerate: 1 };
                break;
            case process.env.STRIPE_PRICE_ID_PREMIUM:
                planDetails = { tier: 'Premium', codesToGenerate: 5 };
                break;
            default:
                console.error(`❌ Unknown Price ID: ${priceId}`);
                return;
        }

        // 2. Create or update the Sponsor in your database
        const sponsor = await prisma.sponsor.upsert({
            where: { email: sponsorEmail },
            update: { 
                stripeCustomerId, 
                subscriptionTier: planDetails.tier 
            },
            create: { 
                email: sponsorEmail, 
                stripeCustomerId, 
                subscriptionTier: planDetails.tier 
            },
        });

        // 3. Generate and store the access codes with duplicate checking
        const generatedCodes = [];
        for (let i = 0; i < planDetails.codesToGenerate; i++) {
            let code;
            let attempts = 0;
            const maxAttempts = 10;

            // Ensure code uniqueness
            do {
                code = generateAccessCode();
                attempts++;
                
                if (attempts > maxAttempts) {
                    throw new Error('Failed to generate unique access code after multiple attempts');
                }

                const existingCode = await prisma.accessCode.findUnique({
                    where: { code }
                });

                if (!existingCode) {
                    break;
                }
            } while (attempts <= maxAttempts);

            const accessCode = await prisma.accessCode.create({
                data: {
                    code,
                    sponsorId: sponsor.id,
                },
            });
            
            generatedCodes.push(accessCode.code);
        }

        console.log(`✅ Provisioned ${planDetails.codesToGenerate} codes for sponsor ${sponsorEmail}`);
        console.log(`📋 Generated codes: ${generatedCodes.join(', ')}`);

        // Send payment confirmation email to customer
        const customerName = session.customer_details?.name || sponsorEmail.split('@')[0];
        const amount = (session.amount_total / 100).toFixed(2); // Convert from cents

        try {
            // Send confirmation email to customer
            const customerEmailResult = await emailService.sendPaymentConfirmationEmail({
                customerEmail: sponsorEmail,
                customerName,
                plan: planDetails.tier,
                amount,
                accessCodes: generatedCodes
            });

            // Send notification email to admin
            const adminEmailResult = await emailService.sendAdminPaymentNotification({
                customerEmail: sponsorEmail,
                customerName,
                plan: planDetails.tier,
                amount,
                accessCodes: generatedCodes
            });

            console.log(`📧 Customer email sent: ${customerEmailResult.success ? '✅' : '❌'}`);
            console.log(`📧 Admin notification sent: ${adminEmailResult.success ? '✅' : '❌'}`);

        } catch (emailError) {
            console.error('❌ Error sending payment confirmation emails:', emailError.message);
            // Don't fail the entire provisioning process for email errors
        }

        return {
            success: true,
            sponsor,
            codes: generatedCodes,
            tier: planDetails.tier
        };

    } catch (error) {
        console.error('❌ Error in provisionAccessCodes:', error);
        throw error;
    }
}

module.exports = { provisionAccessCodes };