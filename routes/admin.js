// routes/admin.js
const express = require('express');
const prisma = require('../prisma');
const loggingService = require('../services/logging');

const router = express.Router();

// Simple authentication middleware (basic protection)
const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
        return res.status(500).json({ error: 'Admin dashboard not configured' });
    // admin.js
    // Express route for Afelu Guardian admin dashboard and management
    // Provides authentication, statistics, code generation, and user management for admins
    }
    
    if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    next();
};

// Dashboard overview
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        const [stats, recentUsers, usageStats] = await Promise.all([
            // Basic statistics
            prisma.$queryRaw`
                SELECT 
                    (SELECT COUNT(*) FROM "Sponsor") as sponsors,
                    (SELECT COUNT(*) FROM "AccessCode" WHERE status = 'NEW') as available_codes,
                    (SELECT COUNT(*) FROM "AccessCode" WHERE status = 'USED') as used_codes,
                    (SELECT COUNT(*) FROM "User") as total_users,
                    (SELECT COUNT(*) FROM "User" WHERE last_active >= NOW() - INTERVAL '7 days') as active_users_7d,
                    (SELECT COUNT(*) FROM "UsageLog" WHERE created_at >= NOW() - INTERVAL '24 hours') as requests_24h
            `,
            
            // Recent users
            prisma.user.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    telegramId: true,
                    quotaGpt: true,
                    quotaFetch: true,
                    createdAt: true,
                    lastActive: true
                }
            }),
            
            // Usage statistics for the last 7 days
            loggingService.getUsageStats(
                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                new Date()
            )
        ]);

        const response = {
            overview: stats[0],
            recentUsers,
            usageStats,
            timestamp: new Date().toISOString()
        };

        res.json(response);
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});

// Get sponsor information
router.get('/sponsors', adminAuth, async (req, res) => {
    try {
        const sponsors = await prisma.sponsor.findMany({
            include: {
                accessCodes: {
                    select: {
                        id: true,
                        code: true,
                        status: true,
                        usedAt: true,
                        createdAt: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(sponsors);
    } catch (error) {
        console.error('Sponsors query error:', error);
        res.status(500).json({ error: 'Failed to fetch sponsors' });
    }
});

// Get detailed usage analytics
router.get('/analytics', adminAuth, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        const [dailyUsage, topUsers, actionBreakdown] = await Promise.all([
            // Daily usage over time
            prisma.$queryRaw`
                SELECT 
                    DATE(created_at) as date,
                    action,
                    COUNT(*) as count
                FROM "UsageLog"
                WHERE created_at >= ${startDate}
                GROUP BY DATE(created_at), action
                ORDER BY date DESC
            `,
            
            // Most active users
            loggingService.getMostActiveUsers(20),
            
            // Action breakdown
            prisma.$queryRaw`
                SELECT 
                    action,
                    COUNT(*) as total_count,
                    COUNT(DISTINCT user_id) as unique_users
                FROM "UsageLog"
                WHERE created_at >= ${startDate}
                GROUP BY action
                ORDER BY total_count DESC
            `
        ]);

        res.json({
            period: `${days} days`,
            dailyUsage,
            topUsers,
            actionBreakdown,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Analytics query error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Generate new access codes manually
router.post('/generate-codes', adminAuth, async (req, res) => {
    try {
        const { sponsorEmail, count = 1, tier = 'Manual' } = req.body;
        
        if (!sponsorEmail || count < 1 || count > 50) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        // Find or create sponsor
        const sponsor = await prisma.sponsor.upsert({
            where: { email: sponsorEmail },
            update: {},
            create: {
                email: sponsorEmail,
                stripeCustomerId: `manual_${Date.now()}`,
                subscriptionTier: tier
            }
        });

        // Generate codes
        const { generateSecureRandomString } = require('../utils/validation');
        const codes = [];
        
        for (let i = 0; i < count; i++) {
            const randomPart = generateSecureRandomString(8);
            const code = `ET-${randomPart.slice(0, 4)}-${randomPart.slice(4, 8)}`;
            
            const accessCode = await prisma.accessCode.create({
                data: {
                    code,
                    sponsorId: sponsor.id
                }
            });
            
            codes.push(accessCode.code);
        }

        res.json({
            success: true,
            sponsor: sponsor.email,
            codesGenerated: codes.length,
            codes
        });
    } catch (error) {
        console.error('Code generation error:', error);
        res.status(500).json({ error: 'Failed to generate codes' });
    }
});

module.exports = router;
