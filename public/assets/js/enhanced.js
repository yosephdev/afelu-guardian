// Enhanced contact form functionality
document.addEventListener('DOMContentLoaded', function() {
    // Enhanced navigation - ensure all anchor links work properly
    const navLinks = document.querySelectorAll('nav a[href^="#"], a[href^="#"]:not([href="#"])');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#') && href.length > 1) {
                // Let the main.js handle the navigation
                console.log('Navigating to:', href);
                // Force hash change if it's the same as current
                if (window.location.hash === href) {
                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                }
                // Fallback: directly trigger the article show if main.js fails
                setTimeout(() => {
                    const targetId = href.substring(1);
                    const targetArticle = document.getElementById(targetId);
                    const main = document.getElementById('main');
                    if (targetArticle && main && !targetArticle.classList.contains('active')) {
                        // Hide all articles
                        document.querySelectorAll('#main article').forEach(article => {
                            article.classList.remove('active');
                            article.style.display = 'none';
                        });
                        // Show target article
                        targetArticle.style.display = 'block';
                        setTimeout(() => targetArticle.classList.add('active'), 50);
                        main.classList.add('is-article-visible');
                        document.body.classList.add('is-article-visible');
                    }
                }, 100);
            }
        });
    });

    // Contact form handling
    const contactForm = document.getElementById('contact-form');
    
    // Ensure main navigation is working - force initialization if needed
    setTimeout(() => {
        if (window.location.hash && window.location.hash.length > 1) {
            // Trigger the hash change event to show the correct article
            window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
    }, 100);
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('input[type="submit"]');
            const originalText = submitBtn.value;
            submitBtn.value = 'Sending...';
            submitBtn.disabled = true;
            
            try {
                const formData = new FormData(contactForm);
                const data = Object.fromEntries(formData.entries());
                
                const response = await fetch('/api/contact/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: data.name,
                        email: data.email,
                        subject: data.subject || 'Website Inquiry',
                        message: data.message
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Show success message
                    const successMsg = document.createElement('div');
                    successMsg.className = 'box';
                    successMsg.style.backgroundColor = '#2ecc71';
                    successMsg.style.color = 'white';
                    successMsg.style.marginTop = '1rem';
                    successMsg.innerHTML = `
                        <h4>✅ Message Sent Successfully!</h4>
                        <p>${result.message}</p>
                    `;
                    
                    contactForm.appendChild(successMsg);
                    contactForm.reset();
                    
                    // Remove success message after 5 seconds
                    setTimeout(() => {
                        successMsg.remove();
                    }, 5000);
                } else {
                    throw new Error(result.error || 'Failed to send message');
                }
            } catch (error) {
                // Show error message
                const errorMsg = document.createElement('div');
                errorMsg.className = 'box';
                errorMsg.style.backgroundColor = '#e74c3c';
                errorMsg.style.color = 'white';
                errorMsg.style.marginTop = '1rem';
                errorMsg.innerHTML = `
                    <h4>❌ Error Sending Message</h4>
                    <p>${error.message}</p>
                    <p>Please try again or email us directly at support@afelu.com</p>
                `;
                
                contactForm.appendChild(errorMsg);
                
                // Remove error message after 8 seconds
                setTimeout(() => {
                    errorMsg.remove();
                }, 8000);
            } finally {
                submitBtn.value = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Enhance pricing buttons with analytics
    document.querySelectorAll('a[href*="stripe.com"]').forEach(button => {
        button.addEventListener('click', function() {
            const plan = this.textContent.includes('Friend') ? 'friend' : 
                        this.textContent.includes('Family') ? 'family' : 'community';
            
            // Track button clicks (analytics)
            console.log('Pricing button clicked:', plan);
            
            // Add visual feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
    
    // Add smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add copy-to-clipboard for demo codes (if any)
    function addCopyButton(element, text) {
        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy';
        copyBtn.className = 'button small';
        copyBtn.style.marginLeft = '10px';
        
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(text);
                copyBtn.textContent = 'Copied!';
                copyBtn.style.backgroundColor = '#2ecc71';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                    copyBtn.style.backgroundColor = '';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        });
        
        element.appendChild(copyBtn);
    }
});

// Add some visual enhancements
const style = document.createElement('style');
style.textContent = `
    .box {
        border-left: 4px solid #2ecc71;
        padding: 1rem;
        margin: 1rem 0;
        background: rgba(46, 204, 113, 0.05);
    }
    
    .table-wrapper table tbody tr:nth-child(2) {
        background-color: rgba(46, 204, 113, 0.1);
    }
    
    .button:hover {
        transform: translateY(-2px);
        transition: transform 0.2s ease;
    }
    
    .actions .button {
        margin: 0.5rem;
    }
    
    @media (max-width: 768px) {
        .table-wrapper {
            overflow-x: auto;
        }
        
        .row > div {
            margin-bottom: 1rem;
        }
    }
`;
document.head.appendChild(style);
