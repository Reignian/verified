# Email Setup Guide for VerifiED

## Installation

First, install nodemailer package:

```bash
npm install nodemailer
```

## Configuration Options

### Option 1: Gmail (Recommended for Development)

#### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

#### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Click "Generate"
4. Copy the 16-character password

#### Step 3: Configure Environment Variables
Create or update `.env` file in project root:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM=VerifiED <your-email@gmail.com>
APP_URL=http://localhost:3000
```

### Option 2: SendGrid (Recommended for Production)

#### Step 1: Create SendGrid Account
1. Sign up at https://sendgrid.com
2. Verify your email
3. Complete sender verification

#### Step 2: Generate API Key
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Give it a name (e.g., "VerifiED Production")
4. Select "Full Access" or "Mail Send" permission
5. Copy the API key

#### Step 3: Configure Environment Variables
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=VerifiED <noreply@yourdomain.com>
APP_URL=https://yourdomain.com
```

### Option 3: Mailtrap (For Testing Only)

#### Step 1: Create Mailtrap Account
1. Sign up at https://mailtrap.io
2. Create a new inbox

#### Step 2: Get SMTP Credentials
1. Go to your inbox
2. Click "Show Credentials"
3. Copy SMTP settings

#### Step 3: Configure Environment Variables
```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=your-mailtrap-username
EMAIL_PASS=your-mailtrap-password
EMAIL_FROM=VerifiED <noreply@verified.com>
APP_URL=http://localhost:3000
```

**Note:** Mailtrap catches all emails - they won't actually be delivered. Perfect for testing!

### Option 4: Custom SMTP Server

```env
EMAIL_HOST=mail.yourdomain.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-password
EMAIL_FROM=VerifiED <noreply@yourdomain.com>
APP_URL=https://yourdomain.com
```

## Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP server port | `587` (TLS) or `465` (SSL) |
| `EMAIL_SECURE` | Use SSL/TLS | `false` for port 587, `true` for port 465 |
| `EMAIL_USER` | SMTP username | `your-email@gmail.com` |
| `EMAIL_PASS` | SMTP password or API key | `your-app-password` |
| `EMAIL_FROM` | Sender name and email | `VerifiED <noreply@verified.com>` |
| `APP_URL` | Your application URL | `http://localhost:3000` |

## Testing Email Configuration

### Method 1: Using the Application
1. Complete a signup request
2. Approve or reject it from admin Messages tab
3. Check if email was sent (check console if not configured)

### Method 2: Create a Test Script

Create `test-email.js` in project root:

```javascript
require('dotenv').config();
const emailService = require('./src/services/emailService');

async function testEmail() {
  console.log('Testing approval email...');
  const result = await emailService.sendApprovalEmail(
    'test@example.com',
    'Test University',
    'testuser'
  );
  console.log('Result:', result);
}

testEmail();
```

Run it:
```bash
node test-email.js
```

## Common Issues & Solutions

### Issue 1: "Invalid login" with Gmail
**Solution:** 
- Make sure 2FA is enabled
- Use App Password, not your regular password
- Check if "Less secure app access" is needed (older accounts)

### Issue 2: "Connection timeout"
**Solution:**
- Check firewall settings
- Verify port is not blocked
- Try different port (587 vs 465)
- Check if your ISP blocks SMTP

### Issue 3: Emails going to spam
**Solution:**
- Use a verified domain
- Set up SPF, DKIM, and DMARC records
- Use a reputable email service (SendGrid, Mailgun)
- Don't send too many emails at once

### Issue 4: "self signed certificate" error
**Solution:**
Add to email service configuration:
```javascript
tls: {
  rejectUnauthorized: false
}
```

### Issue 5: No emails in development
**Solution:**
- Check console logs - emails are logged if not configured
- Verify environment variables are loaded
- Restart the server after adding .env variables

## Development vs Production

### Development:
- Use Gmail or Mailtrap
- Emails logged to console as fallback
- Test with personal email addresses
- No domain verification needed

### Production:
- Use SendGrid, Mailgun, or AWS SES
- Configure proper domain authentication
- Set up SPF/DKIM/DMARC records
- Use professional sender address
- Monitor delivery rates
- Set up bounce handling

## Email Service Comparison

| Service | Free Tier | Pros | Cons | Best For |
|---------|-----------|------|------|----------|
| **Gmail** | 500/day | Easy setup, reliable | Daily limit, personal use | Development |
| **SendGrid** | 100/day | Professional, analytics | Requires verification | Production |
| **Mailgun** | 5,000/month | Flexible, good API | Complex setup | Production |
| **AWS SES** | 62,000/month | Cheap, scalable | AWS knowledge needed | Large scale |
| **Mailtrap** | Unlimited | Perfect for testing | No actual delivery | Testing only |

## Security Best Practices

### ✅ Do:
- Use environment variables for credentials
- Use App Passwords (Gmail)
- Enable 2FA on email accounts
- Use TLS/SSL encryption
- Rotate passwords regularly
- Monitor for suspicious activity

### ❌ Don't:
- Commit credentials to git
- Share email passwords
- Use personal email for production
- Send passwords in emails
- Store credentials in code
- Use unencrypted connections

## Monitoring & Maintenance

### What to Monitor:
- Email delivery rate
- Bounce rate
- Spam complaints
- API usage/limits
- Server response times

### Regular Tasks:
- Review bounce reports
- Update email templates
- Check spam score
- Verify domain authentication
- Monitor sending limits

## Troubleshooting Commands

### Check if .env is loaded:
```javascript
console.log('Email Host:', process.env.EMAIL_HOST);
console.log('Email User:', process.env.EMAIL_USER);
```

### Test SMTP connection:
```bash
telnet smtp.gmail.com 587
```

### Check email logs:
```bash
# In your server logs
npm run server
# Look for "Approval email sent:" or "Rejection email sent:"
```

## Getting Help

### Resources:
- Nodemailer Documentation: https://nodemailer.com
- Gmail SMTP Guide: https://support.google.com/mail/answer/7126229
- SendGrid Documentation: https://docs.sendgrid.com
- Stack Overflow: Search "nodemailer [your issue]"

### Support Channels:
- Check server console logs
- Review email service dashboard
- Test with different email addresses
- Contact your email service support
- Consult development team

---

**Last Updated**: January 26, 2025
**Version**: 1.0
