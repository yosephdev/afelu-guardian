const nodemailer = require('nodemailer');

/**
 * Email service for Afelu Guardian
 * Handles contact forms, bootcamp enrollment notifications, and certificates
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        // Configure email transport based on environment
        if (process.env.NODE_ENV === 'production') {
            // Production email configuration (replace with your SMTP provider)
            this.transporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            // Development - use test account
            this.setupTestAccount();
        }
    }

    async setupTestAccount() {
        try {
            const testAccount = await nodemailer.createTestAccount();
            
            this.transporter = nodemailer.createTransporter({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            
            console.log('📧 Test email account created:');
            console.log(`   User: ${testAccount.user}`);
            console.log(`   Pass: ${testAccount.pass}`);
        } catch (error) {
            console.error('Error setting up test email account:', error);
        }
    }

    /**
     * Send bootcamp welcome email
     */
    async sendBootcampWelcomeEmail(enrollment) {
        try {
            const mailOptions = {
                from: '"Afelu Guardian" <noreply@afeluguardian.com>',
                to: enrollment.userEmail,
                subject: '🎉 Welcome to the AI Training Bootcamp - Your Journey Begins!',
                html: this.generateBootcampWelcomeHTML(enrollment)
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            if (process.env.NODE_ENV !== 'production') {
                console.log('📧 Bootcamp welcome email sent:');
                console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
            }
            
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending bootcamp welcome email:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send certificate email
     */
    async sendCertificateEmail(userEmail, certificateData) {
        try {
            const mailOptions = {
                from: '"Afelu Guardian Certification Authority" <certificates@afeluguardian.com>',
                to: userEmail,
                subject: `🏆 Your ${certificateData.type} Certificate is Ready!`,
                html: this.generateCertificateHTML(certificateData)
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            if (process.env.NODE_ENV !== 'production') {
                console.log('📧 Certificate email sent:');
                console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
            }
            
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending certificate email:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send contact form notification
     */
    async sendContactFormNotification(contactData) {
        try {
            // Send confirmation to user
            const userMailOptions = {
                from: '"Afelu Guardian Support" <support@afeluguardian.com>',
                to: contactData.email,
                subject: 'Thank you for contacting Afelu Guardian',
                html: this.generateContactConfirmationHTML(contactData)
            };

            // Send notification to admin
            const adminMailOptions = {
                from: '"Afelu Guardian Website" <noreply@afeluguardian.com>',
                to: 'support@afeluguardian.com',
                subject: `New Contact Form Submission from ${contactData.name}`,
                html: this.generateContactAdminHTML(contactData)
            };

            const [userInfo, adminInfo] = await Promise.all([
                this.transporter.sendMail(userMailOptions),
                this.transporter.sendMail(adminMailOptions)
            ]);
            
            if (process.env.NODE_ENV !== 'production') {
                console.log('📧 Contact form emails sent:');
                console.log('   User confirmation:', nodemailer.getTestMessageUrl(userInfo));
                console.log('   Admin notification:', nodemailer.getTestMessageUrl(adminInfo));
            }
            
            return { success: true, userMessageId: userInfo.messageId, adminMessageId: adminInfo.messageId };
        } catch (error) {
            console.error('Error sending contact form emails:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate bootcamp welcome email HTML
     */
    generateBootcampWelcomeHTML(enrollment) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to AI Training Bootcamp</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #009639 0%, #FFDE00 100%); padding: 30px; text-align: center; border-radius: 15px; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to the AI Training Bootcamp!</h1>
                <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Your premium AI education journey begins now</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
                <h2 style="color: #009639; margin-top: 0;">Hello ${enrollment.userName}!</h2>
                <p>Congratulations on enrolling in our exclusive AI Training Bootcamp! You've taken an important step toward mastering artificial intelligence and advancing your career.</p>
                
                <h3 style="color: #333; margin-bottom: 15px;">📅 Your Bootcamp Details:</h3>
                <ul style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #009639;">
                    <li><strong>Program:</strong> AI Training Bootcamp - Premium Certificate Program</li>
                    <li><strong>Duration:</strong> 4 weeks intensive training</li>
                    <li><strong>Investment:</strong> $${enrollment.paymentAmount}</li>
                    <li><strong>Certification:</strong> AFCP (Afelu Fellowship Certified Professional)</li>
                    <li><strong>Enrollment Date:</strong> ${new Date(enrollment.enrollmentDate).toLocaleDateString()}</li>
                </ul>
            </div>

            <div style="background: #e8f5e8; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
                <h3 style="color: #009639; margin-top: 0;">🚀 What Happens Next?</h3>
                <ol>
                    <li><strong>Join Our Telegram Group:</strong> <a href="https://t.me/afeluguardian_bootcamp" style="color: #009639;">Click here to join</a></li>
                    <li><strong>Access Course Materials:</strong> Login details will be sent separately</li>
                    <li><strong>Kick-off Session:</strong> Monday at 2:00 PM EST (details in Telegram)</li>
                    <li><strong>Weekly Schedule:</strong> Live sessions + self-paced assignments</li>
                </ol>
            </div>

            <div style="background: #fff3cd; padding: 20px; border-radius: 10px; border-left: 4px solid #FFDE00; margin-bottom: 25px;">
                <h3 style="color: #856404; margin-top: 0;">📋 Course Structure Overview:</h3>
                <div style="display: grid; gap: 15px;">
                    <div style="background: white; padding: 15px; border-radius: 8px;">
                        <strong>Week 1:</strong> AI Foundations & Prompt Engineering
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 8px;">
                        <strong>Week 2:</strong> Business Applications & Automation
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 8px;">
                        <strong>Week 3:</strong> Advanced Tools & Data Analysis
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 8px;">
                        <strong>Week 4:</strong> Certification Project & Assessment
                    </div>
                </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="https://t.me/afeluguardian_bootcamp" style="background: linear-gradient(135deg, #009639 0%, #FFDE00 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Join Bootcamp Telegram Group</a>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 30px;">
                <h3 style="margin-top: 0;">📞 Need Help?</h3>
                <p>Our support team is here to help you succeed:</p>
                <ul>
                    <li>📧 Email: <a href="mailto:bootcamp@afeluguardian.com">bootcamp@afeluguardian.com</a></li>
                    <li>💬 Telegram: <a href="https://t.me/afeluguardian_support">@afeluguardian_support</a></li>
                    <li>🌐 Website: <a href="https://afeluguardian.com">afeluguardian.com</a></li>
                </ul>
            </div>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
                <p>© 2025 Afelu Guardian - Professional AI Education Authority</p>
                <p>Empowering Ethiopian professionals with cutting-edge AI skills</p>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Generate certificate email HTML
     */
    generateCertificateHTML(certificateData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Certificate is Ready</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 30px; text-align: center; border-radius: 15px; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🏆 Your Certificate is Ready!</h1>
                <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Congratulations on your achievement</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <h2 style="color: #009639;">Certificate Details</h2>
                <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;">
                    <p><strong>Certificate ID:</strong> ${certificateData.certificateId}</p>
                    <p><strong>Type:</strong> ${certificateData.type}</p>
                    <p><strong>Course:</strong> ${certificateData.courseName}</p>
                    <p><strong>Issue Date:</strong> ${new Date(certificateData.issueDate).toLocaleDateString()}</p>
                </div>
                
                <a href="https://afeluguardian.com/verify.html?id=${certificateData.certificateId}" 
                   style="background: linear-gradient(135deg, #009639 0%, #FFDE00 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 20px 0;">
                    View & Download Certificate
                </a>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Generate contact confirmation email HTML
     */
    generateContactConfirmationHTML(contactData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Thank you for contacting us</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #009639 0%, #FFDE00 100%); padding: 30px; text-align: center; border-radius: 15px; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Thank You for Contacting Us!</h1>
                <p style="color: white; margin: 10px 0 0 0;">We'll get back to you soon</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 10px;">
                <h2 style="color: #009639; margin-top: 0;">Hello ${contactData.name}!</h2>
                <p>Thank you for reaching out to Afelu Guardian. We've received your message and will respond within 24 hours.</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Your Message:</h3>
                    <p><strong>Subject:</strong> ${contactData.subject}</p>
                    <p><strong>Message:</strong></p>
                    <p style="font-style: italic;">"${contactData.message}"</p>
                </div>
                
                <p>If you have any urgent questions, you can also reach us:</p>
                <ul>
                    <li>📧 Email: support@afeluguardian.com</li>
                    <li>💬 Telegram: @afeluguardian_support</li>
                </ul>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Generate admin notification HTML
     */
    generateContactAdminHTML(contactData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Contact Form Submission</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #009639;">New Contact Form Submission</h1>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                <p><strong>Name:</strong> ${contactData.name}</p>
                <p><strong>Email:</strong> ${contactData.email}</p>
                <p><strong>Subject:</strong> ${contactData.subject}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                
                <h3>Message:</h3>
                <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #009639;">
                    ${contactData.message}
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

module.exports = new EmailService();
