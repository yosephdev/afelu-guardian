#!/bin/bash

# 🚀 Deploy Afelu Guardian to Railway - Automated Script

echo "🔄 Starting Railway deployment for Afelu Guardian..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the correct project directory. Please run from project root."
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Git repository not initialized. Please run 'git init' first."
    exit 1
fi

# Stage all changes
echo "📦 Staging all changes..."
git add .

# Show status
echo "📊 Git status:"
git status --short

# Check if there are changes to commit
if [ -z "$(git diff --cached --name-only)" ]; then
    echo "✅ No changes to commit. Everything is up to date."
else
    # Commit with descriptive message
    echo "💾 Committing changes..."
    git commit -m "fix: Resolve Railway homepage routing and deployment issues

- Fix Express route patterns causing path-to-regexp errors
- Add explicit root route handler for homepage serving
- Update Railway configuration with health checks
- Simplify routing to avoid wildcard pattern issues
- Ensure static files serve correctly from /public
- Add comprehensive deployment documentation"

    echo "✅ Changes committed successfully!"
fi

# Push to main branch
echo "🚀 Pushing to Railway (main branch)..."
if git push origin main; then
    echo "✅ Successfully pushed to Railway!"
    echo ""
    echo "🎉 Deployment initiated! Check your Railway dashboard for progress."
    echo ""
    echo "📍 Next steps:"
    echo "   1. Monitor Railway logs for successful startup"
    echo "   2. Visit your app URL to verify homepage loads"
    echo "   3. Test health endpoint: /api/health"
    echo ""
    echo "🔗 Useful Railway commands:"
    echo "   railway logs        # View live logs"
    echo "   railway status      # Check deployment status"
    echo "   railway open        # Open app in browser"
else
    echo "❌ Failed to push to Railway. Please check your git configuration."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   - Verify Railway project is connected: 'railway status'"
    echo "   - Check git remote: 'git remote -v'"
    echo "   - Ensure you're logged in: 'railway login'"
    exit 1
fi

echo ""
echo "🎯 Your Afelu Guardian app should be live shortly!"
echo "   Check Railway dashboard for the live URL."
