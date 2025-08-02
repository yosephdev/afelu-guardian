const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

// Revenue Analytics Dashboard
router.get('/revenue-analytics', async (req, res) => {
    try {
        // Get current month revenue data
        const currentMonth = new Date();
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        // Monthly Recurring Revenue (MRR) calculation
        const payments = await prisma.payment.findMany({
            where: {
                status: 'completed',
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            },
            include: {
                accessCodes: true
            }
        });

        // Calculate MRR by plan type
        const revenueByPlan = payments.reduce((acc, payment) => {
            const planType = payment.planType || 'unknown';
            if (!acc[planType]) {
                acc[planType] = {
                    revenue: 0,
                    customers: 0,
                    codes: 0
                };
            }
            acc[planType].revenue += parseFloat(payment.amount);
            acc[planType].customers += 1;
            acc[planType].codes += payment.accessCodes.length;
            return acc;
        }, {});

        // Active users this month
        const activeUsers = await prisma.user.count({
            where: {
                lastActive: {
                    gte: startOfMonth
                }
            }
        });

        // Usage statistics
        const totalGptRequests = await prisma.actionLog.count({
            where: {
                action: 'gpt_request',
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });

        const totalFetchRequests = await prisma.actionLog.count({
            where: {
                action: 'fetch_request',
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });

        // Customer retention rate
        const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        const previousMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
        
        const previousMonthUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: previousMonth,
                    lte: previousMonthEnd
                }
            }
        });

        const retainedUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: previousMonth,
                    lte: previousMonthEnd
                },
                lastActive: {
                    gte: startOfMonth
                }
            }
        });

        const retentionRate = previousMonthUsers > 0 ? (retainedUsers / previousMonthUsers * 100) : 0;

        // Total revenue to date
        const totalRevenue = await prisma.payment.aggregate({
            where: {
                status: 'completed'
            },
            _sum: {
                amount: true
            }
        });

        // User growth metrics
        const totalUsers = await prisma.user.count();
        const newUsersThisMonth = await prisma.user.count({
            where: {
                createdAt: {
                    gte: startOfMonth
                }
            }
        });

        // AI cost tracking (estimated)
        const estimatedAICost = (totalGptRequests * 0.002) + (totalFetchRequests * 0.001); // Rough estimates

        const analytics = {
            month: currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            mrr: {
                total: Object.values(revenueByPlan).reduce((sum, plan) => sum + plan.revenue, 0),
                byPlan: revenueByPlan,
                growth: 0 // TODO: Calculate month-over-month growth
            },
            users: {
                total: totalUsers,
                active: activeUsers,
                new: newUsersThisMonth,
                retentionRate: Math.round(retentionRate * 100) / 100
            },
            usage: {
                gptRequests: totalGptRequests,
                fetchRequests: totalFetchRequests,
                avgRequestsPerUser: activeUsers > 0 ? Math.round(totalGptRequests / activeUsers) : 0
            },
            financials: {
                totalRevenue: totalRevenue._sum.amount || 0,
                estimatedCosts: Math.round(estimatedAICost * 100) / 100,
                grossMargin: totalRevenue._sum.amount ? 
                    Math.round(((totalRevenue._sum.amount - estimatedAICost) / totalRevenue._sum.amount) * 100) : 0
            },
            unitEconomics: {
                avgRevenuePerUser: activeUsers > 0 ? 
                    Math.round((Object.values(revenueByPlan).reduce((sum, plan) => sum + plan.revenue, 0) / activeUsers) * 100) / 100 : 0,
                customerAcquisitionCost: 0, // TODO: Calculate based on marketing spend
                lifetimeValue: 0 // TODO: Calculate based on retention and ARPU
            }
        };

        res.json(analytics);

    } catch (error) {
        console.error('Revenue analytics error:', error);
        res.status(500).json({ error: 'Failed to generate analytics' });
    }
});

// Investor-ready metrics
router.get('/investor-metrics', async (req, res) => {
    try {
        // Last 6 months of data for trends
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyMetrics = [];
        
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date();
            monthDate.setMonth(monthDate.getMonth() - i);
            const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
            const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

            // Revenue for this month
            const monthlyRevenue = await prisma.payment.aggregate({
                where: {
                    status: 'completed',
                    createdAt: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                },
                _sum: {
                    amount: true
                }
            });

            // Users for this month
            const monthlyUsers = await prisma.user.count({
                where: {
                    createdAt: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                }
            });

            // Active users for this month
            const activeUsers = await prisma.user.count({
                where: {
                    lastActive: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                }
            });

            monthlyMetrics.push({
                month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                revenue: monthlyRevenue._sum.amount || 0,
                newUsers: monthlyUsers,
                activeUsers: activeUsers
            });
        }

        // Calculate growth rates
        const revenueGrowth = monthlyMetrics.length >= 2 ? 
            ((monthlyMetrics[5].revenue - monthlyMetrics[4].revenue) / (monthlyMetrics[4].revenue || 1)) * 100 : 0;

        const userGrowth = monthlyMetrics.length >= 2 ?
            ((monthlyMetrics[5].newUsers - monthlyMetrics[4].newUsers) / (monthlyMetrics[4].newUsers || 1)) * 100 : 0;

        // Key metrics for investors
        const investorMetrics = {
            traction: {
                totalUsers: await prisma.user.count(),
                monthlyActiveUsers: monthlyMetrics[5]?.activeUsers || 0,
                currentMRR: monthlyMetrics[5]?.revenue || 0,
                revenueGrowthRate: Math.round(revenueGrowth * 100) / 100,
                userGrowthRate: Math.round(userGrowth * 100) / 100
            },
            businessModel: {
                type: 'Pre-paid Access Codes',
                grossMargin: 85, // Software-based, high margin
                paymentTerms: 'Payment before access',
                recurringRevenue: true
            },
            marketMetrics: {
                targetMarket: '120M Ethiopians',
                governmentSupport: 'Digital Ethiopia 2025',
                competition: 'First mover in Ethiopian AI education',
                expansion: 'Pan-African potential (1.4B people)'
            },
            trends: monthlyMetrics,
            keyInsights: [
                'Zero AI costs without revenue (pre-paid model)',
                'High gross margins (85%+) due to software delivery',
                'Strong retention through credit-based system',
                'Government alignment with Digital Ethiopia 2025',
                'Scalable to entire African continent'
            ]
        };

        res.json(investorMetrics);

    } catch (error) {
        console.error('Investor metrics error:', error);
        res.status(500).json({ error: 'Failed to generate investor metrics' });
    }
});

// Real-time dashboard for live demos
router.get('/live-dashboard', async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Today's activity
        const todayStats = {
            newUsers: await prisma.user.count({
                where: { createdAt: { gte: today } }
            }),
            gptRequests: await prisma.actionLog.count({
                where: { 
                    action: 'gpt_request',
                    createdAt: { gte: today }
                }
            }),
            codesRedeemed: await prisma.accessCode.count({
                where: {
                    status: 'USED',
                    usedAt: { gte: today }
                }
            }),
            revenue: await prisma.payment.aggregate({
                where: {
                    status: 'completed',
                    createdAt: { gte: today }
                },
                _sum: { amount: true }
            })
        };

        // Platform health
        const platformHealth = {
            totalUsers: await prisma.user.count(),
            activeToday: await prisma.user.count({
                where: { lastActive: { gte: today } }
            }),
            availableCodes: await prisma.accessCode.count({
                where: { status: 'NEW' }
            }),
            usedCodes: await prisma.accessCode.count({
                where: { status: 'USED' }
            })
        };

        res.json({
            timestamp: now.toISOString(),
            todayStats,
            platformHealth,
            status: 'Live and Processing Payments'
        });

    } catch (error) {
        console.error('Live dashboard error:', error);
        res.status(500).json({ error: 'Failed to generate live dashboard' });
    }
});

module.exports = router;
