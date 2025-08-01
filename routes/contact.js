// routes/contact.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const loggingService = require('../services/logging');
const emailService = require('../services/email'); // Use Gmail email service
const rateLimit = require('express-rate-limit');

// Rate limiting for contact form
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour (increased from 15 minutes)
    max: 5, // limit each IP to 5 requests per hour
    message: {
        error: 'Too many contact requests from this IP, please try again later.',
        retry_after: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Test endpoint for email service (admin only)
router.get('/test', async (req, res) => {
    try {
        // Simple admin check
        const adminPassword = req.headers.authorization?.replace('Bearer ', '');
        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Test email sending
        console.log('🔍 Testing email service...');
        const testResult = await emailService.sendContactFormEmail({
            name: 'Test User',
            email: 'test@example.com',
            subject: 'Email Service Test',
            message: 'This is a test email to verify the Gmail integration is working correctly.'
        });

        if (testResult.success) {
            res.json({ 
                success: true, 
                message: 'Test email sent successfully!',
                details: testResult
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Test email failed to send',
                error: testResult.error
            });
        }
    } catch (error) {
        console.error('Email test error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Email test failed',
            error: error.message
        });
    }
});

// Simple connection test endpoint
router.get('/test-connection', async (req, res) => {
    try {
        // Simple admin check
        const adminPassword = req.headers.authorization?.replace('Bearer ', '');
        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Test the Zoho SMTP connection
        const connectionTest = await emailService.testConnection();
        
        res.json({
            success: connectionTest.success,
            message: connectionTest.success ? 'Gmail SMTP connection successful' : 'Gmail SMTP connection failed',
            error: connectionTest.error || null,
            debug: {
                smtp_host: process.env.SMTP_HOST || 'Not set',
                smtp_port: process.env.SMTP_PORT || 'Not set',
                smtp_user: process.env.SMTP_USER ? 'Set' : 'Not set',
                smtp_pass: process.env.SMTP_PASS ? 'Set' : 'Not set',
                from_email: process.env.FROM_EMAIL || 'Not set'
            }
        });

    } catch (error) {
        console.error('Connection test error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Connection test failed',
            error: error.message
        });
    }
});

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

        // Send contact form email to admin using our Zoho email service
        const emailResult = await emailService.sendContactFormEmail({
            name: contactData.name,
            email: contactData.email,
            subject: contactData.subject,
            message: contactData.message
        });

        // Log the submission
        await loggingService.logActivity(
            'contact_form',
            'form_submission',
            'system',
            {
                name: contactData.name,
                email: contactData.email,
                subject: contactData.subject,
                timestamp: new Date().toISOString(),
                emailSent: emailResult.success
            }
        );

        if (emailResult.success) {
            res.json({
                success: true,
                message: 'Thank you for your message! We will get back to you soon.',
                redirect: '/thank-you.html'
            });
        } else {
            // Email failed but don't expose details to user
            console.error('Contact form email failed:', emailResult.error);
            res.status(500).json({
                success: false,
                message: 'We\'re experiencing technical difficulties. Please try again later or email us directly at support@afelu.com'
            });
        }

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
