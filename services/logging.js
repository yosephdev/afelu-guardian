// services/logging.js
const prisma = require('../prisma');

class LoggingService {
    /**
     * Log user actions for analytics and monitoring
     * @param {string} userId - User ID
     * @param {string} action - Action performed
     * @param {object} details - Additional details
     */
    async logAction(userId, action, details = {}) {
        try {
            await prisma.usageLog.create({
                data: {
                    userId,
                    action,
                    details
                }
            });
        } catch (error) {
            console.error('❌ Failed to log action:', error);
            // Don't throw - logging failures shouldn't break the main functionality
        }
    }

    /**
     * Update user's last active timestamp
     * @param {BigInt} telegramId - Telegram user ID
     */
    async updateLastActive(telegramId) {
        try {
            await prisma.user.update({
                where: { telegramId },
                data: { lastActive: new Date() }
            });
        } catch (error) {
            console.error('❌ Failed to update last active:', error);
        }
    }

    /**
     * Get usage statistics for a date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<object>} - Usage statistics
     */
    async getUsageStats(startDate, endDate) {
        try {
            const stats = await prisma.$queryRaw`
                SELECT 
                    action,
                    COUNT(*) as count,
                    DATE(created_at) as date
                FROM "UsageLog"
                WHERE created_at >= ${startDate} AND created_at <= ${endDate}
                GROUP BY action, DATE(created_at)
                ORDER BY date DESC, action
            `;

            return stats;
        } catch (error) {
            console.error('❌ Failed to get usage stats:', error);
            return [];
        }
    }

    /**
     * Get most active users
     * @param {number} limit - Number of users to return
     * @returns {Promise<Array>} - Active users list
     */
    async getMostActiveUsers(limit = 10) {
        try {
            const activeUsers = await prisma.$queryRaw`
                SELECT 
                    u.telegram_id,
                    COUNT(ul.id) as action_count,
                    MAX(ul.created_at) as last_action
                FROM "User" u
                LEFT JOIN "UsageLog" ul ON u.id = ul.user_id
                WHERE ul.created_at >= NOW() - INTERVAL '30 days'
                GROUP BY u.id, u.telegram_id
                ORDER BY action_count DESC
                LIMIT ${limit}
            `;

            return activeUsers;
        } catch (error) {
            console.error('❌ Failed to get active users:', error);
            return [];
        }
    }
}

module.exports = new LoggingService();
