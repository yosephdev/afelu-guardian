# 🔧 Zoho Mail Authentication Troubleshooting

## 🚨 **Current Issue**: 535 Authentication Failed

The error "535 Authentication Failed" with Zoho Mail typically indicates one of these problems:

---

## **✅ Checklist: Zoho Mail Setup Requirements**

### **1. Domain Verification**

- [ ] Domain `afelu.com` is added to Zoho Mail
- [ ] Domain ownership is verified (DNS records)
- [ ] Domain status shows "Verified" in Zoho Admin Panel

### **2. Email Account Creation**

- [ ] Email account `support@afelu.com` exists in Zoho
- [ ] Account is active and accessible
- [ ] You can log into Zoho Mail with this account

### **3. Security Settings**

- [ ] Two-Factor Authentication (2FA) is **enabled**
- [ ] Account security is up to date
- [ ] No suspicious activity blocks

### **4. App Password Generation**

- [ ] App password is generated specifically for `support@afelu.com`
- [ ] Password is copied exactly (no spaces/typos)
- [ ] Password is recent (generated within last few days)

---

## **🔍 Step-by-Step Zoho Setup**

### **Step 1: Verify Domain Setup**

1. **Login to Zoho Mail Admin**: <https://mailadmin.zoho.com/>
2. **Go to**: Domains → `afelu.com`
3. **Check Status**: Should show "Verified" ✅
4. **If not verified**: Follow DNS setup instructions

### **Step 2: Create/Verify Email Account**

1. **Go to**: Users → Add User or View Users
2. **Create**: `support@afelu.com` if it doesn't exist
3. **Test Login**: Try logging into <https://mail.zoho.com/>
4. **Verify**: Account is accessible and functional

### **Step 3: Enable Two-Factor Authentication**

1. **Login to**: <https://mail.zoho.com/> with `support@afelu.com`
2. **Go to**: Settings → Security → Two Factor Authentication
3. **Enable**: SMS or Authenticator App based 2FA
4. **Verify**: 2FA is working properly

### **Step 4: Generate App Password**

1. **In Zoho Mail**: Settings → Security → App Passwords
2. **Generate**: New app password for "Afelu Guardian Platform"
3. **Copy**: The password exactly (format: usually 16 characters)
4. **Note**: This is different from your login password

---

## **🔧 Common Solutions**

### **Solution 1: Domain Not Verified**

```bash
# Check your DNS records include:
# MX Record: mx.zoho.com (priority 10)
# TXT Record: zoho-verification=your_verification_code
```

### **Solution 2: Account Doesn't Exist**

- Create the account in Zoho Admin Panel
- Assign proper permissions
- Test login manually

### **Solution 3: Wrong App Password**

- Delete old app passwords
- Generate a fresh one
- Copy without spaces or extra characters

### **Solution 4: 2FA Not Enabled**

- Enable 2FA in Zoho Security settings
- Verify with SMS or authenticator
- Then generate app password

---

## **🧪 Testing Steps**

### **Test 1: Manual Login**

1. Go to <https://mail.zoho.com/>
2. Login with `support@afelu.com` and regular password
3. If this fails, account setup is wrong

### **Test 2: SMTP Settings**

```
Host: smtp.zoho.com
Port: 587
Security: STARTTLS
Username: support@afelu.com
Password: [App Password]
```

### **Test 3: Alternative Zoho Settings**

If port 587 doesn't work, try:

```
Host: smtp.zoho.com
Port: 465
Security: SSL/TLS
```

---

## **📧 Alternative Email Providers**

If Zoho continues to fail, consider:

### **1. Gmail (Quick Setup)**

- Host: smtp.gmail.com
- Port: 587
- Generate app password
- Usually works immediately

### **2. SendGrid (Professional)**

- Reliable email delivery
- Better for production
- API-based sending

### **3. Mailgun (Developer Friendly)**

- Easy setup
- Good documentation
- Free tier available

---

## **🔍 Debug Commands**

Test the current setup:

```bash
# Check connection
curl -X GET "https://afelu.up.railway.app/api/contact/test-connection" \
     -H "Authorization: Bearer HagosaAdey08960396@"

# Test email sending
curl -X GET "https://afelu.up.railway.app/api/contact/test" \
     -H "Authorization: Bearer HagosaAdey08960396@"
```

---

## **✅ Success Indicators**

You'll know Zoho is working when:

- Connection test returns `"success": true`
- Test email sends without errors
- You receive emails at the admin address
- Payment confirmations work automatically

---

## **🆘 Next Steps if Zoho Still Fails**

1. **Contact Zoho Support** with domain verification issues
2. **Use Gmail temporarily** for immediate functionality
3. **Consider professional email service** for production
4. **Check Zoho service status** for outages

The email service architecture is solid - it's just an authentication configuration issue! 🎯
