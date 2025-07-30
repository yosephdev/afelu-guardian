// Debug navigation script - forces navigation to work
console.log('🔧 Debug navigation script loaded');

function forceShowArticle(articleId) {
    console.log('Forcing article:', articleId);
    
    // Hide all articles first
    const allArticles = document.querySelectorAll('#main article');
    allArticles.forEach(article => {
        article.style.display = 'none';
        article.classList.remove('active');
    });
    
    // Show the target article
    const targetArticle = document.getElementById(articleId);
    const main = document.getElementById('main');
    const body = document.body;
    
    if (targetArticle && main) {
        // Make sure main is visible
        main.style.display = 'block';
        main.classList.add('is-article-visible');
        
        // Make sure body has the right classes
        body.classList.add('is-article-visible');
        body.classList.remove('is-preload');
        
        // Show and activate the article
        targetArticle.style.display = 'block';
        setTimeout(() => {
            targetArticle.classList.add('active');
        }, 50);
        
        console.log('✅ Article shown:', articleId);
    } else {
        console.error('❌ Article not found:', articleId);
    }
}

function setupForcedNavigation() {
    console.log('🔧 Setting up forced navigation...');
    
    // Wait for DOM to be ready
    if (document.readyState !== 'loading') {
        initForcedNav();
    } else {
        document.addEventListener('DOMContentLoaded', initForcedNav);
    }
}

function initForcedNav() {
    console.log('🚀 Initializing forced navigation');
    
    // Force remove preload class
    document.body.classList.remove('is-preload');
    
    // Set up click handlers for all navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.length > 1) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const articleId = href.substring(1);
                console.log('🖱️ Clicked link to:', articleId);
                forceShowArticle(articleId);
                
                // Update URL hash
                history.pushState(null, null, href);
            });
        }
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', function() {
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
            forceShowArticle(hash.substring(1));
        }
    });
    
    // If there's a hash in the URL on load, show that article
    if (window.location.hash && window.location.hash.length > 1) {
        const articleId = window.location.hash.substring(1);
        forceShowArticle(articleId);
    } else {
        // Default to hiding main
        const main = document.getElementById('main');
        if (main) {
            main.style.display = 'none';
            main.classList.remove('is-article-visible');
        }
    }
    
    console.log('✅ Forced navigation setup complete');
}

// Global function for debugging
window.debugNav = {
    showArticle: forceShowArticle,
    showMission: () => forceShowArticle('mission'),
    showHowItWorks: () => forceShowArticle('how-it-works'),
    showFeatures: () => forceShowArticle('features'),
    showPricing: () => forceShowArticle('pricing'),
    showContact: () => forceShowArticle('contact')
};

// Start the forced navigation setup
setupForcedNavigation();

console.log('🎯 Debug navigation ready! Try: debugNav.showMission()');
