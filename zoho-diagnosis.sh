#!/bin/bash
# Zoho Diagnosis Script

echo "🔍 ZOHO EMAIL DIAGNOSIS"
echo "======================="
echo ""

echo "Current Zoho Settings:"
echo "SMTP_HOST: smtp.zoho.com"
echo "SMTP_PORT: 587"
echo "SMTP_USER: support@afelu.com"
echo "FROM_EMAIL: support@afelu.com"
echo ""

echo "❌ Error: 535 Authentication Failed"
echo ""

echo "This error means one of these issues:"
echo ""
echo "1. 🌐 Domain Issue:"
echo "   - Domain 'afelu.com' is not added to Zoho Mail"
echo "   - Domain is not verified with Zoho"
echo "   - Solution: Add domain in Zoho Mail admin panel"
echo ""

echo "2. 📧 Email Account Issue:"
echo "   - Email 'support@afelu.com' doesn't exist"
echo "   - Account is not created in Zoho"
echo "   - Solution: Create email account in Zoho admin"
echo ""

echo "3. 🔐 Password Issue:"
echo "   - Wrong app password"
echo "   - 2FA not enabled"
echo "   - Solution: Generate new app password"
echo ""

echo "4. ⚙️ Account Issue:"
echo "   - Zoho account suspended/limited"
echo "   - Payment issues with Zoho"
echo "   - Solution: Check Zoho account status"
echo ""

echo "📋 TO FIX THIS:"
echo "1. Go to https://mailadmin.zoho.com/"
echo "2. Check if 'afelu.com' domain is listed and verified"
echo "3. Check if 'support@afelu.com' user exists"
echo "4. If not, you need to set up the domain first"
echo ""

echo "🚀 QUICK WORKAROUND:"
echo "Use your existing email temporarily:"
echo ""
echo "If you have yoseph@zoho.com (or similar):"
echo "railway variables --set \"SMTP_USER=yoseph@zoho.com\""
echo "railway variables --set \"FROM_EMAIL=yoseph@zoho.com\""
echo "railway variables --set \"SMTP_PASS=your_app_password\""
echo ""

echo "Or use Gmail (already working):"
echo "railway variables --set \"SMTP_HOST=smtp.gmail.com\""
echo "railway variables --set \"SMTP_USER=mybirdsounds@gmail.com\""
echo "railway variables --set \"FROM_EMAIL=mybirdsounds@gmail.com\""
echo "railway variables --set \"SMTP_PASS=jewaayqtjnvpymcc\""
