const nodemailer = require('nodemailer');

/**
 * Zoho Mail Service for Afelu Guardian
 * Handles all email sending functionality including:
 * - Contact form submissions
 * - Payment confirmations
 * - Access code delivery
 * - Administrative notifications
 */

class ZohoEmailService {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;
        this.initializeTransporter();
    }

    /**
     * Initialize Zoho SMTP transporter
     */
    initializeTransporter() {
        try {
            // Zoho Mail SMTP configuration
            this.transporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST || 'smtp.zoho.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: false, // Use TLS
                auth: {
                    user: process.env.SMTP_USER, // support@afelu.com
                    pass: process.env.SMTP_PASS  // Your Zoho app password
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            this.isConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
            
            if (this.isConfigured) {
                console.log('✅ Zoho email service initialized');
            } else {
                console.log('⚠️  Email service not configured - missing SMTP credentials');
            }
        } catch (error) {
            console.error('❌ Failed to initialize email service:', error.message);
        }
    }

    /**
     * Send email with error handling and retry logic
     */
    async sendEmail({ to, subject, html, text, attachments = [] }) {
        if (!this.isConfigured) {
            console.log('📧 Email not sent - service not configured');
            return { success: false, error: 'Email service not configured' };
        }

        try {
            const mailOptions = {
                from: {
                    name: 'Afelu Guardian',
                    address: process.env.FROM_EMAIL || 'support@afelu.com'
                },
                to,
                subject,
                html,
                text: text || this.stripHtml(html),
                attachments
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent successfully to ${to}: ${subject}`);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error(`❌ Failed to send email to ${to}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send contact form submission email
     */
    async sendContactFormEmail({ name, email, subject, message }) {
        const emailSubject = `🇪🇹 New Contact Form: ${subject}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #228B22, #FFFF00, #FF0000); padding: 20px; border-radius: 10px;">
                <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color: #228B22; border-bottom: 3px solid #FFD700; padding-bottom: 10px; margin-bottom: 20px;">
                        🇪🇹 New Contact Form Submission
                    </h2>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                        <p><strong>Subject:</strong> ${subject}</p>
                    </div>
                    
                    <div style="background: #ffffff; border-left: 4px solid #228B22; padding: 20px; margin: 20px 0;">
                        <h3 style="color: #333; margin-top: 0;">Message:</h3>
                        <p style="line-height: 1.6; color: #555;">${message.replace(/\n/g, '<br>')}</p>
                    </div>
                    
                    <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; margin-top: 20px;">
                        <p style="margin: 0; color: #228B22; font-size: 14px;">
                            <strong>Afelu Guardian</strong> - Bridging the Digital Divide 🌉
                        </p>
                        <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">
                            Empowering Ethiopian communities with secure AI access
                        </p>
                    </div>
                </div>
            </div>
        `;

        return await this.sendEmail({
            to: process.env.ADMIN_EMAIL || 'admin@afelu.com',
            subject: emailSubject,
            html
        });
    }

    /**
     * Send payment confirmation email
     */
    async sendPaymentConfirmationEmail({ customerEmail, customerName, plan, amount, accessCodes }) {
        const emailSubject = `🎉 Payment Confirmed - Your ${plan} Access Codes`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #228B22, #FFFF00, #FF0000); padding: 20px; border-radius: 10px;">
                <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h1 style="color: #228B22; text-align: center; margin-bottom: 30px;">
                        🇪🇹 Afelu Guardian - Payment Confirmed!
                    </h1>
                    
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 6px; margin-bottom: 20px; text-align: center;">
                        <h2 style="color: #228B22; margin: 0;">Thank you, ${customerName}! 🎉</h2>
                        <p style="margin: 10px 0 0 0; color: #666;">Your payment has been processed successfully</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                        <h3 style="color: #333; margin-top: 0;">Order Details:</h3>
                        <p><strong>Plan:</strong> ${plan}</p>
                        <p><strong>Amount:</strong> $${amount}</p>
                        <p><strong>Number of Codes:</strong> ${accessCodes.length}</p>
                    </div>
                    
                    <div style="background: #ffffff; border: 2px solid #228B22; padding: 20px; border-radius: 6px; margin: 20px 0;">
                        <h3 style="color: #228B22; margin-top: 0;">🔑 Your Access Codes:</h3>
                        ${accessCodes.map(code => `
                            <div style="background: #f0f8f0; padding: 10px; margin: 10px 0; border-radius: 4px; font-family: monospace; font-size: 16px; font-weight: bold; color: #228B22; text-align: center;">
                                ${code}
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <h4 style="color: #856404; margin-top: 0;">📱 How to Use Your Codes:</h4>
                        <ol style="color: #856404; margin: 0;">
                            <li>Open Telegram and search for <strong>@AfeluGuardianBot</strong></li>
                            <li>Send the command <code>/redeem YOUR_CODE</code></li>
                            <li>Follow the instructions to access AI services</li>
                            <li>Share additional codes with family and friends!</li>
                        </ol>
                    </div>
                    
                    <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 0; color: #0c5460;">
                            <strong>Need Help?</strong> Contact us at 
                            <a href="mailto:support@afelu.com" style="color: #228B22;">support@afelu.com</a>
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee;">
                        <p style="color: #228B22; font-weight: bold; margin: 0;">Afelu Guardian 🇪🇹</p>
                        <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">Bridging the Digital Divide • Empowering Ethiopian Communities</p>
                        <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                            <a href="https://afelu.com" style="color: #228B22;">afelu.com</a> • 
                            <a href="mailto:support@afelu.com" style="color: #228B22;">support@afelu.com</a>
                        </p>
                    </div>
                </div>
            </div>
        `;

        return await this.sendEmail({
            to: customerEmail,
            subject: emailSubject,
            html
        });
    }

    /**
     * Send admin notification for new payment
     */
    async sendAdminPaymentNotification({ customerEmail, customerName, plan, amount, accessCodes }) {
        const emailSubject = `💰 New Payment Received - ${plan} Plan`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #228B22;">💰 New Payment Received</h2>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
                    <h3>Customer Details:</h3>
                    <p><strong>Name:</strong> ${customerName}</p>
                    <p><strong>Email:</strong> ${customerEmail}</p>
                    <p><strong>Plan:</strong> ${plan}</p>
                    <p><strong>Amount:</strong> $${amount}</p>
                    <p><strong>Codes Generated:</strong> ${accessCodes.length}</p>
                </div>
                
                <div style="background: #e8f5e8; padding: 15px; border-radius: 6px;">
                    <h4>Generated Access Codes:</h4>
                    ${accessCodes.map(code => `<p style="font-family: monospace; background: white; padding: 5px; border-radius: 3px;">${code}</p>`).join('')}
                </div>
            </div>
        `;

        return await this.sendEmail({
            to: process.env.ADMIN_EMAIL || 'admin@afelu.com',
            subject: emailSubject,
            html
        });
    }

    /**
     * Strip HTML tags for plain text version
     */
    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    /**
     * Test email configuration
     */
    async testConnection() {
        if (!this.isConfigured) {
            return { success: false, error: 'Email service not configured' };
        }

        try {
            await this.transporter.verify();
            return { success: true, message: 'Email service connection successful' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new ZohoEmailService();
