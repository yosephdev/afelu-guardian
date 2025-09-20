// utils/validation.js
const crypto = require('crypto');

/**
 * Validates access code format
 * @param {string} code - The access code to validate
 * @returns {boolean} - Whether the code is valid format
 */
function validateAccessCodeFormat(code) {
    // ET-XXXX-XXXX format with alphanumeric characters
    const regex = /^ET-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return regex.test(code.trim().toUpperCase());
// validation.js
// Utility functions for validating access codes, sanitizing input, and checking Telegram IDs for Afelu Guardian bots
// Ensures security and data integrity
}

/**
 * Sanitizes user input to prevent injection attacks
 * @param {string} input - Raw user input
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    // Remove potentially dangerous characters
    return input
        .replace(/[<>\"'%;()&+]/g, '')
        .trim()
        .substring(0, 1000); // Limit length
}

/**
 * Validates Telegram ID
 * @param {BigInt|number|string} telegramId - The Telegram ID to validate
 * @returns {boolean} - Whether the ID is valid
 */
function validateTelegramId(telegramId) {
    try {
        const id = BigInt(telegramId);
        return id > 0 && id < BigInt('9223372036854775807'); // Max safe integer
    } catch {
        return false;
    }
}

/**
 * Rate limiting helper
 * @param {Map} rateLimitMap - Map to store rate limit data
 * @param {string} key - Unique identifier (e.g., user ID)
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - Whether request is within limits
 */
function checkRateLimit(rateLimitMap, key, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const userLimits = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };
    
    // Reset if window has passed
    if (now > userLimits.resetTime) {
        userLimits.count = 0;
        userLimits.resetTime = now + windowMs;
    }
    
    if (userLimits.count >= maxRequests) {
        return false; // Rate limit exceeded
    }
    
    userLimits.count++;
    rateLimitMap.set(key, userLimits);
    return true;
}

/**
 * Generate secure random string for codes
 * @param {number} length - Length of the random string
 * @returns {string} - Cryptographically secure random string
 */
function generateSecureRandomString(length = 8) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const bytes = crypto.randomBytes(length);
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += chars[bytes[i] % chars.length];
    }
    
    return result;
}

module.exports = {
    validateAccessCodeFormat,
    sanitizeInput,
    validateTelegramId,
    checkRateLimit,
    generateSecureRandomString
};
