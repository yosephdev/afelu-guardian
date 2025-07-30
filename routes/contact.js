// routes/contact.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const loggingService = require('../services/logging');
const rateLimit = require('express-rate-limit');

// Rate limiting for contact form
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 3 requests per windowMs
    message: {
        error: 'Too many contact requests from this IP, please try again later.',
        retry_after: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Email service placeholder (can be replaced with actual email service)
const emailService = {
    async sendContactNotification(contactData) {
        // TODO: Implement actual email service (NodeMailer, SendGrid, etc.)
        console.log('Contact form submission:', contactData);
        
        // Log to our logging service
        await loggingService.logActivity(
            'contact_form', 
            'form_submission', 
            'system',
            {
                name: contactData.name,
                email: contactData.email,
                subject: contactData.subject,
                timestamp: new Date().toISOString()
            }
        );
        
        return { success: true, message: 'Contact notification sent' };
    },

    async sendAutoReply(email, name) {
        // TODO: Implement auto-reply email
        console.log(`Auto-reply sent to ${email} for ${name}`);
        return { success: true };
    }
};

// Validation rules
const contactValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s\-\.]+$/)
        .withMessage('Name can only contain letters, spaces, hyphens, and periods'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    body('subject')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Subject must be between 5 and 200 characters'),
    
    body('message')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Message must be between 10 and 2000 characters')
];

// Contact form submission endpoint
router.post('/submit', contactLimiter, contactValidation, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, email, subject, message } = req.body;

        // Sanitize input data
        const contactData = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            subject: subject.trim(),
            message: message.trim(),
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        };

        // Send notification email
        await emailService.sendContactNotification(contactData);
        
        // Send auto-reply to user
        await emailService.sendAutoReply(contactData.email, contactData.name);

        // Log successful submission
        await loggingService.logActivity(
            'contact_form',
            'submission_success',
            'system',
            { email: contactData.email, subject: contactData.subject }
        );

        res.json({
            success: true,
            message: 'Thank you for your message! We will get back to you soon.',
            redirect: '/thank-you.html'
        });

    } catch (error) {
        console.error('Contact form error:', error);
        
        // Log error
        await loggingService.logActivity(
            'contact_form',
            'submission_error',
            'system',
            { error: error.message, ip: req.ip }
        );

        res.status(500).json({
            success: false,
            message: 'Sorry, there was an error sending your message. Please try again later.'
        });
    }
});

// Get contact statistics (for admin dashboard)
router.get('/stats', async (req, res) => {
    try {
        // TODO: Implement admin authentication check
        
        const stats = {
            totalContacts: 0, // TODO: Query from logging service
            recentContacts: [], // TODO: Get recent contact submissions
            dailyStats: [] // TODO: Get daily contact statistics
        };

        res.json(stats);
    } catch (error) {
        console.error('Contact stats error:', error);
        res.status(500).json({ error: 'Failed to fetch contact statistics' });
    }
});

module.exports = router;
