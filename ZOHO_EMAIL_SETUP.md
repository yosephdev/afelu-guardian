# 📧 Zoho Mail Integration Setup Guide

## 🎯 **Complete Zoho Email Integration for Afelu Guardian**

Your platform now has **full email integration** with beautiful Ethiopian-themed email templates! Here's how to set it up:

---

## **Step 1: Set Up Zoho Mail Account**

### **Create Zoho Account:**
1. Go to [Zoho Mail](https://mail.zoho.com)
2. Sign up for a business account
3. Add your domain: `afelu.com`
4. Verify domain ownership via DNS

### **Create Email Accounts:**
- `support@afelu.com` (primary support email)
- `admin@afelu.com` (admin notifications)
- `noreply@afelu.com` (automated emails)

---

## **Step 2: Generate App Password**

### **In Zoho Mail:**
1. Go to **Settings** → **Security**
2. Enable **Two-Factor Authentication** (required)
3. Go to **App Passwords**
4. Generate new app password for "Afelu Guardian Platform"
5. **Copy the generated password** (you'll need this!)

---

## **Step 3: Configure Railway Environment**

Add your Zoho app password to Railway:

```bash
railway variables --set "SMTP_PASS=your_zoho_app_password_here"
```

**Important**: Use the **app password**, not your regular Zoho login password!

---

## **Step 4: Test Email Integration**

### **Test the email service:**
```bash
curl -X GET "https://afelu.up.railway.app/api/contact/test" \
     -H "Authorization: Bearer YOUR_ADMIN_PASSWORD"
```

### **Test contact form:**
```bash
curl -X POST "https://afelu.up.railway.app/api/contact/submit" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com", 
       "subject": "Test Contact Form",
       "message": "This is a test message from the contact form."
     }'
```

---

## **✨ Email Features Now Available:**

### **🔄 Automatic Emails:**
- ✅ **Payment Confirmations** with access codes
- ✅ **Admin Notifications** for new payments  
- ✅ **Contact Form Submissions** to support team
- ✅ **Beautiful Ethiopian-themed templates**

### **📧 Email Templates Include:**
- 🇪🇹 **Ethiopian flag gradient** styling
- 💎 **Professional branding** with Afelu Guardian logo
- 📱 **Mobile-responsive** design
- 🔒 **Security information** and support contacts
- 🎨 **Beautiful formatting** with code highlighting

### **🛡️ Security Features:**
- ✅ **Rate limiting** (5 emails per hour per IP)
- ✅ **Input validation** and sanitization
- ✅ **CSRF protection**
- ✅ **Email verification**

---

## **📋 Current Environment Variables:**

```env
# Zoho Mail Configuration
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=support@afelu.com
SMTP_PASS=your_zoho_app_password_here
FROM_EMAIL=support@afelu.com
ADMIN_EMAIL=admin@afelu.com
```

---

## **🔧 API Endpoints Available:**

### **Contact Form:**
- `POST /api/contact/submit` - Submit contact form
- `GET /api/contact/test` - Test email service (admin only)

### **Email Templates:**
- Payment confirmation emails (automatic)
- Admin payment notifications (automatic)
- Contact form submissions (automatic)

---

## **🎉 What Happens Now:**

### **When Someone Buys Access Codes:**
1. 💳 **Payment processed** via Stripe
2. 🔑 **Access codes generated** automatically
3. 📧 **Beautiful confirmation email** sent to customer with:
   - Ethiopian-themed design
   - Access codes in highlighted boxes
   - Instructions for Telegram bot usage
   - Support contact information
4. 📩 **Admin notification** sent to you with order details

### **When Someone Contacts You:**
1. 📝 **Contact form submitted** on website
2. 📧 **Email sent to admin** with Ethiopian flag styling
3. 🔄 **Automatic logging** for tracking
4. ✅ **Rate limiting** prevents spam

---

## **🚀 Next Steps:**

1. **Set up your Zoho account** and get app password
2. **Add SMTP_PASS** to Railway environment variables
3. **Deploy the updated code** (already done!)
4. **Test the email functionality**
5. **Start receiving beautiful emails!** 🎉

Your Afelu Guardian platform now has **professional email integration** that matches your Ethiopian branding! 🇪🇹✨

---

**Need Help?** The email service includes detailed error logging and graceful fallbacks, so your platform will continue working even if email is temporarily unavailable.
