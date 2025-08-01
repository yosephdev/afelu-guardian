const prisma = require('../prisma');
const { PrismaClient } = require('@prisma/client');
const emailService = require('./email');

class CertificateService {
    constructor() {
        this.courseDetails = {
            fundamentals: {
                title: "AI Fundamentals: Your Guide to the Future",
                duration: "2 Weeks",
                modules: 16, // 4.1 to 4.4 = 16 modules total
                type: "free",
                level: "beginner"
            },
            chatgpt_mastery: {
                title: "ChatGPT Mastery: Advanced AI Communication",
                duration: "3 Weeks", 
                modules: 20, // Estimated based on advanced course
                type: "free",
                level: "intermediate"
            },
            ai_business: {
                title: "AI for Business: Growth & Productivity",
                duration: "4 Weeks",
                modules: 24, // Estimated for comprehensive business course
                type: "free",
                level: "advanced"
            },
            digital_literacy: {
                title: "Digital Literacy: Essential Skills for Modern Ethiopia",
                duration: "2 Weeks",
                modules: 12, // Estimated for foundation course
                type: "free",
                level: "foundation"
            },
            ai_training_bootcamp: {
                title: "AI Training Bootcamp: The Ultimate 4-Week Intensive Program",
                subtitle: "For Professionals and Innovators",
                duration: "4 Weeks Intensive",
                modules: 32, // 12 main modules + 20 detailed topics
                type: "premium",
                level: "professional",
                price: "$299",
                features: [
                    "4-week intensive program",
                    "Advanced ChatGPT techniques", 
                    "Business automation strategies",
                    "Industry-specific applications",
                    "Professional Certification of Completion",
                    "Two 1-on-1 mentoring sessions",
                    "Lifetime access to all materials and updates",
                    "Capstone project with ROI documentation"
                ],
                description: "This is not just another AI course. This is a rigorous 4-week bootcamp designed to transform you into a high-impact AI power user. We move beyond the basics into the realm of professional application, focusing on tangible results and ROI. You will master advanced prompt engineering, design sophisticated business automation workflows, and learn to apply these skills directly to your industry. Guided by expert instruction and personalized 1-on-1 mentoring, you will build a capstone project that automates a real-world task, culminating in a professional certification that validates your expertise.",
                weeks: {
                    1: {
                        title: "Mastering Advanced AI Interaction & Prompt Engineering",
                        goal: "Move beyond basic prompting and develop a scientific approach to controlling AI behavior for complex and reliable outputs",
                        modules: {
                            "1.1": "Beyond CORE: Chain-of-Thought (CoT), Tree of Thoughts (ToT), and Self-Correction",
                            "1.2": "Structured Output Mastery: JSON, XML, and Markdown integration",
                            "1.3": "Meta-Prompting & Prompt Chaining for complex tasks",
                            "2.1": "The Persona Matrix: Ultra-detailed expert personas",
                            "2.2": "Contextual Priming & In-Session Training techniques",
                            "2.3": "Custom Instructions for Long-Term Memory"
                        },
                        activity: "Identify complex workflow for capstone project",
                        mentorship: "1-on-1 Session #1: Strategy and workflow analysis"
                    },
                    2: {
                        title: "Business Automation Strategies", 
                        goal: "Translate advanced AI techniques into powerful automation workflows that save time, reduce costs, and increase productivity",
                        modules: {
                            "3.1": "Unstructured Data Analysis: Extract insights from large text volumes",
                            "3.2": "Sentiment & Trend Analysis from customer feedback and market data",
                            "4.1": "End-to-End Campaign Generation: Complete marketing automation",
                            "4.2": "Sales Funnel Automation: Email sequences and personalized follow-ups",
                            "5.1": "Internal Process Documentation: SOPs and training materials",
                            "5.2": "HR Streamlining: Job descriptions, interviews, and policy documents"
                        },
                        activity: "Build prompt chains and workflows for capstone project"
                    },
                    3: {
                        title: "Industry-Specific Applications",
                        goal: "Apply automation strategies to specialized professional fields with domain-relevant context",
                        modules: {
                            "6.1": "Tech & Software Development: Code generation, debugging, documentation",
                            "7.1": "Marketing & Creative: Advanced concepts, long-form content, video scripts",
                            "8.1": "Business & Finance: Financial analysis, earnings summaries, investment memos",
                            "9.1": "Healthcare & Academia: Research summaries, literature reviews, education materials"
                        },
                        activity: "Refine capstone project with industry-specific prompts",
                        mentorship: "1-on-1 Session #2: Project troubleshooting and expert feedback"
                    },
                    4: {
                        title: "Integration, Final Project, and Certification",
                        goal: "Finalize project implementation, understand software integration, and earn professional certification",
                        modules: {
                            "10.1": "The Power of APIs: Business overview of software connections", 
                            "10.2": "No-Code Automation: Zapier/Make.com integration without coding",
                            "11.1": "Project Implementation: Finalizing capstone automation project",
                            "11.2": "Documenting ROI: Calculate hours saved, costs reduced, revenue generated",
                            "12.1": "Ethical Framework: Data privacy, transparency, accountability in business",
                            "12.2": "Future of Your Role: Positioning as AI-augmented professional"
                        },
                        activity: "Submit documented capstone project for certification review",
                        certification: "AI Training Bootcamp Certification of Completion"
                    }
                }
            }
        };
    }

    /**
     * Generate a unique certificate ID
     */
    generateCertificateId(courseId = null) {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
        
        // Premium certificates get special prefix
        if (courseId && this.courseDetails[courseId]?.type === 'premium') {
            return `AFCP-${year}-${random}`; // Afelu Professional Certificate
        }
        
        return `AFC-${year}-${random}`; // Standard Afelu Certificate
    }

    /**
     * Check if user has completed a course
     */
    async checkCourseCompletion(userId, courseId) {
        try {
            const enrollment = await prisma.courseEnrollment.findUnique({
                where: { 
                    userId_courseId: { 
                        userId, 
                        courseId 
                    } 
                }
            });

            if (!enrollment) {
                return { completed: false, reason: 'not_enrolled' };
            }

            const courseInfo = this.courseDetails[courseId];
            if (!courseInfo) {
                return { completed: false, reason: 'invalid_course' };
            }

            const completedModules = JSON.parse(enrollment.completedModules || '[]');
            const completionPercentage = (completedModules.length / courseInfo.modules) * 100;

            // Course completion requirements vary by type
            let requiredCompletion = 80; // Default 80% for free courses
            let requiresQuiz = true;
            
            if (courseInfo.type === 'premium') {
                requiredCompletion = 90; // Premium courses require 90% completion
                // Premium courses also require capstone project (tracked in quiz score)
                requiresQuiz = true;
            }

            // Course is considered complete if:
            // 1. Required percentage of modules are completed
            // 2. User has taken final quiz/project (if applicable)
            const isComplete = completionPercentage >= requiredCompletion && 
                              (!requiresQuiz || enrollment.quizScore !== null);

            return {
                completed: isComplete,
                completionPercentage,
                completedModules: completedModules.length,
                totalModules: courseInfo.modules,
                quizScore: enrollment.quizScore,
                requiredCompletion,
                courseType: courseInfo.type || 'free',
                reason: isComplete ? 'completed' : 'incomplete'
            };
        } catch (error) {
            console.error('Error checking course completion:', error);
            return { completed: false, reason: 'error' };
        }
    }

    /**
     * Issue a certificate for completed course
     */
    async issueCertificate(userId, courseId, score = null) {
        try {
            // Check if course is completed
            const completion = await this.checkCourseCompletion(userId, courseId);
            if (!completion.completed) {
                return { 
                    success: false, 
                    reason: completion.reason,
                    details: completion
                };
            }

            // Check if certificate already exists
            const existingCert = await prisma.certificate.findFirst({
                where: { userId, courseId }
            });

            if (existingCert) {
                return {
                    success: false,
                    reason: 'already_issued',
                    certificate: existingCert
                };
            }

            // Generate new certificate
            const certificateId = this.generateCertificateId(courseId);
            const certificate = await prisma.certificate.create({
                data: {
                    userId,
                    courseId,
                    certificateId,
                    score: score || completion.quizScore,
                    issuedAt: new Date()
                }
            });

            // Mark course as completed
            await prisma.courseEnrollment.update({
                where: { 
                    userId_courseId: { 
                        userId, 
                        courseId 
                    } 
                },
                data: { completedAt: new Date() }
            });

            // Send certificate email
            try {
                const user = await prisma.user.findUnique({ where: { id: userId } });
                if (user && user.email) {
                    const certificateData = {
                        certificateId: certificate.certificateId,
                        type: certificate.certificateId.startsWith('AFCP') ? 'AFCP (Premium)' : 'AFC (Free)',
                        courseName: this.courseDetails[courseId]?.title || courseId,
                        issueDate: certificate.issuedAt
                    };
                    
                    await emailService.sendCertificateEmail(user.email, certificateData);
                }
            } catch (emailError) {
                console.error('Error sending certificate email:', emailError);
                // Don't fail the certificate issuance if email fails
            }

            return {
                success: true,
                certificate,
                courseInfo: this.courseDetails[courseId]
            };

        } catch (error) {
            console.error('Error issuing certificate:', error);
            return { success: false, reason: 'error', error: error.message };
        }
    }

    /**
     * Get all certificates for a user
     */
    async getUserCertificates(userId) {
        try {
            const certificates = await prisma.certificate.findMany({
                where: { userId },
                orderBy: { issuedAt: 'desc' }
            });

            return certificates.map(cert => ({
                ...cert,
                courseInfo: this.courseDetails[cert.courseId]
            }));
        } catch (error) {
            console.error('Error getting user certificates:', error);
            return [];
        }
    }

    /**
     * Validate a certificate by ID
     */
    async validateCertificate(certificateId) {
        try {
            const certificate = await prisma.certificate.findUnique({
                where: { certificateId },
                include: { 
                    user: { 
                        select: { telegramId: true, createdAt: true } 
                    } 
                }
            });

            if (!certificate) {
                return { valid: false, reason: 'not_found' };
            }

            return {
                valid: true,
                certificate: {
                    ...certificate,
                    courseInfo: this.courseDetails[certificate.courseId]
                }
            };
        } catch (error) {
            console.error('Error validating certificate:', error);
            return { valid: false, reason: 'error' };
        }
    }

    /**
     * Generate certificate text for display
     */
    generateCertificateText(certificate, courseInfo, userInfo = null) {
        const date = certificate.issuedAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Enhanced certificate for premium bootcamp
        if (courseInfo.type === 'premium') {
            return `
🏆 **AFELU GUARDIAN PROFESSIONAL AI CERTIFICATION**

**CERTIFICATE OF COMPLETION**
**AI Training Bootcamp - Professional Level**

This is to certify that the learner has successfully completed the intensive professional training program:

📚 **Program:** ${courseInfo.title}
💼 **Level:** Professional Certification
⏱️ **Duration:** ${courseInfo.duration}
🎯 **Final Score:** ${certificate.score ? `${certificate.score}%` : 'Pass'}
📅 **Completed:** ${date}
🆔 **Certificate ID:** ${certificate.certificateId}

**PROGRAM ACHIEVEMENTS:**
✅ Mastered advanced prompt engineering and AI interaction techniques
✅ Developed sophisticated business automation workflows
✅ Applied AI solutions to industry-specific professional challenges
✅ Completed hands-on capstone project with documented ROI
✅ Participated in personalized 1-on-1 mentoring sessions
✅ Demonstrated ethical AI usage and professional responsibility

**VALIDATED PROFESSIONAL SKILLS:**
• Advanced ChatGPT and Large Language Model mastery
• Chain-of-Thought and meta-prompting techniques
• Business process automation and workflow optimization
• Data analysis and sentiment analysis capabilities
• Industry-specific AI application development
• API integration and no-code automation platforms
• ROI calculation and project documentation
• Ethical AI frameworks for professional environments

**CAPSTONE PROJECT:**
This certification validates completion of a real-world automation project that demonstrates practical AI implementation skills and measurable business impact.

**PROFESSIONAL VALUE:**
This intensive bootcamp certification represents 40+ hours of advanced training, personalized mentoring, and hands-on project work. Certificate holders are qualified to lead AI transformation initiatives in professional environments.

**VERIFICATION & AUTHENTICITY:**
This certificate can be verified at: afelu.com/verify/${certificate.certificateId}
Issued under the authority of Afelu Guardian Professional Education Division.

---
**Afelu Guardian AI Education Platform**
*Professional AI Certification Authority*
*Empowering Global AI Leadership*
            `.trim();
        }

        // Standard certificate for free courses
        return `
🎓 **AFELU GUARDIAN AI EDUCATION CERTIFICATE**

**Certificate of Completion**

This is to certify that the learner has successfully completed:

📚 **Course:** ${courseInfo.title}
⏱️ **Duration:** ${courseInfo.duration}
🏆 **Score:** ${certificate.score ? `${certificate.score}%` : 'Pass'}
📅 **Completed:** ${date}
🆔 **Certificate ID:** ${certificate.certificateId}

**About This Achievement:**
This certificate validates the holder's completion of comprehensive AI education designed specifically for Ethiopian learners. The coursework included theoretical understanding, practical applications, and hands-on experience with modern AI tools.

**Skills Demonstrated:**
• Understanding of AI fundamentals and applications
• Practical experience with AI tools and platforms
• Ethical AI usage and digital literacy
• Real-world problem-solving with AI assistance

**Verification:**
This certificate can be verified at: afelu.com/verify/${certificate.certificateId}

---
**Afelu Guardian AI Education Platform**
*Empowering Ethiopians with AI Skills*
        `.trim();
    }

    /**
     * Track module completion for a user
     */
    async markModuleComplete(userId, courseId, moduleId) {
        try {
            // Get or create enrollment
            let enrollment = await prisma.courseEnrollment.findUnique({
                where: { 
                    userId_courseId: { 
                        userId, 
                        courseId 
                    } 
                }
            });

            if (!enrollment) {
                enrollment = await prisma.courseEnrollment.create({
                    data: {
                        userId,
                        courseId,
                        currentModule: moduleId,
                        completedModules: JSON.stringify([moduleId])
                    }
                });
            } else {
                const completedModules = JSON.parse(enrollment.completedModules || '[]');
                if (!completedModules.includes(moduleId)) {
                    completedModules.push(moduleId);
                    
                    await prisma.courseEnrollment.update({
                        where: { 
                            userId_courseId: { 
                                userId, 
                                courseId 
                            } 
                        },
                        data: {
                            currentModule: moduleId,
                            completedModules: JSON.stringify(completedModules)
                        }
                    });
                }
            }

            // Check if course is now complete
            const completion = await this.checkCourseCompletion(userId, courseId);
            return {
                success: true,
                completion
            };

        } catch (error) {
            console.error('Error marking module complete:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Record quiz score for course completion
     */
    async recordQuizScore(userId, courseId, score) {
        try {
            await prisma.courseEnrollment.upsert({
                where: { 
                    userId_courseId: { 
                        userId, 
                        courseId 
                    } 
                },
                update: { quizScore: score },
                create: {
                    userId,
                    courseId,
                    quizScore: score
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Error recording quiz score:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new CertificateService();
