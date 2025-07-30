# 🌐 Zoho Domain Setup Guide - Step by Step

## Step 1: Sign Up for Zoho Mail ✅

1. Go to: <https://www.zoho.com/mail/zohomail-pricing.html>
2. Choose **Mail Lite** (FREE for up to 5 users)
3. Click **Get Started**
4. Create Zoho account or login

---

## Step 2: Add Your Domain 🏗️

1. **Login to Zoho Mail Admin**: <https://mailadmin.zoho.com/>
2. **Click "Add Domain"**
3. **Enter**: `afelu.com`
4. **Select**: "I own this domain"
5. **Click**: "Add Domain"

---

## Step 3: Domain Verification 🔍

Zoho will provide DNS records to add to your domain:

### **DNS Records to Add:**

```
Type: MX
Name: @
Value: mx.zoho.com
Priority: 10

Type: TXT  
Name: @
Value: zoho-verification=zb12345678 (Zoho will give you this)

Type: TXT
Name: @  
Value: v=spf1 include:zoho.com ~all

Type: CNAME
Name: zmail._domainkey
Value: zmail._domainkey.zoho.com
```

### **Where to Add These:**

- **Railway**: If your domain DNS is managed by Railway
- **Cloudflare**: If using Cloudflare
- **Domain Registrar**: Where you bought afelu.com
- **Other DNS Provider**: Wherever your domain DNS is managed

---

## Step 4: Create Email Accounts 📧

After domain verification:

1. **Go to**: Users → Add User
2. **Create**: `support@afelu.com`
3. **Set password** for the account
4. **Verify**: Account is active

---

## Step 5: Generate App Password 🔐

1. **Login to**: <https://mail.zoho.com/> with `support@afelu.com`
2. **Go to**: Settings → Security
3. **Enable**: Two-Factor Authentication
4. **Go to**: App Passwords
5. **Generate**: New password for "Afelu Guardian"
6. **Copy**: The password (format: 16 characters)

---

## Step 6: Update Railway Config 🚀

```bash
railway variables --set "SMTP_PASS=your_new_app_password"
```

---

## 🆘 Common Issues

### Issue: Domain verification fails

**Solution**: Wait 24-48 hours for DNS propagation

### Issue: Can't access mailadmin.zoho.com  

**Solution**: Make sure you signed up for Zoho Mail (not just Zoho)

### Issue: Domain already exists

**Solution**: Domain might be registered with another Zoho account

---

## 📞 Need Help?

- **Zoho Support**: <https://help.zoho.com/portal/en/home>
- **DNS Help**: Check with your domain provider
- **Alternative**: Use Gmail temporarily while setting up

---

**Current Status**: ✅ Step 1-3 Complete! DNS configured on Namecheap → Ready for Step 4
