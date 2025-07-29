const prisma = require('./prisma');
const { customAlphabet } = require('nanoid');

// Function to generate a unique, formatted access code
function generateAccessCode() {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nanoid = customAlphabet(alphabet, 8);
    const randomPart = nanoid();
    return `ET-${randomPart.slice(0, 4)}-${randomPart.slice(4, 8)}`;
}

// This is the core function that runs after a successful payment
async function provisionAccessCodes(session) {
    const stripeCustomerId = session.customer;
    const priceId = session.line_items.data[0].price.id; // Get the price ID from the session
    const sponsorEmail = session.customer_details.email;

    // 1. Determine the plan and number of codes
    let planDetails = {};
    // IMPORTANT: Replace these with your ACTUAL Price IDs from your Stripe dashboard
    switch (priceId) {
        case 'price_1RqGJ9A4fb84QLrklEl9lQyv': // Friend Plan Price ID
            planDetails = { tier: 'Friend', codesToGenerate: 2 };
            break;
        case 'price_1RqGUtA4fb84QLrkmtc8MHM6': // Family Plan Price ID
            planDetails = { tier: 'Family', codesToGenerate: 7 };
            break;
        case 'price_1RqGL9A4fb84QLrk8uEEjuDs': // Community Plan Price ID
            planDetails = { tier: 'Community', codesToGenerate: 20 };
            break;
        default:
            console.error(`Unknown Price ID: ${priceId}`);
            return;
    }

    // 2. Create or update the Sponsor in your database
    const sponsor = await prisma.sponsor.upsert({
        where: { email: sponsorEmail },
        update: { stripeCustomerId, subscriptionTier: planDetails.tier },
        create: { email: sponsorEmail, stripeCustomerId, subscriptionTier: planDetails.tier },
    });

    // 3. Generate and store the access codes
    for (let i = 0; i < planDetails.codesToGenerate; i++) {
        await prisma.accessCode.create({
            data: {
                code: generateAccessCode(),
                sponsorId: sponsor.id,
            },
        });
    }

    console.log(`✅ Provisioned ${planDetails.codesToGenerate} codes for sponsor ${sponsorEmail}`);
}

module.exports = { provisionAccessCodes };