# Billing Email Setup Guide

## Quick Start

### Step 1: Install Dependencies
```bash
npm install
```
This will install `nodemailer` and all other required packages.

### Step 2: Configure Email Service

#### Option A: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication**
   - Go to myaccount.google.com
   - Security → 2-Step Verification → Follow setup

2. **Create App Password**
   - Go to myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the generated 16-character password

3. **Set Environment Variables**
   - Create `.env.local` in project root:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

#### Option B: SendGrid (Recommended for Production)

1. **Get SendGrid API Key**
   - Sign up at sendgrid.com
   - Create API key with Mail Send permission

2. **Update Email Configuration**
   - Modify `app/api/send-invoice-email/route.ts`
   - Replace Gmail transporter with SendGrid:
   ```typescript
   import sgMail from "@sendgrid/mail"
   sgMail.setApiKey(process.env.SENDGRID_API_KEY)
   
   await sgMail.send({
     to: email,
     from: process.env.SENDGRID_FROM_EMAIL,
     subject: "Invoice Receipt",
     html: emailHtml,
   })
   ```

#### Option C: Other SMTP Services

Update the transporter in `route.ts`:
```typescript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})
```

### Step 3: Test Email Sending

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Complete a Billing Entry**
   - Go to Billing Dashboard
   - Click on a completed appointment
   - Click "Proceed to Payment"
   - Fill in the billing form
   - **Make sure customer has an email address** 
   - Check the "📧 Send Invoice Email" checkbox
   - Click "✓ Complete Billing"

3. **Verify Email**
   - Check customer inbox for invoice
   - Verify content is formatted correctly

## Features Implemented

### ✅ Design Enhancements
- Professional gradient header
- Improved card styling
- Better typography hierarchy
- Smooth transitions and hover effects

### ✅ Tax Handling
- Tax already included in total
- No double-counting of tax
- Clear GST breakdown in invoice

### ✅ Email Functionality
- Automatic invoice generation
- Optional email sending (checkbox)
- Professional HTML email template
- Success/error notifications

### ✅ Invoice Contents
- Customer name and appointment date
- Service-wise pricing breakdown
- GST percentages and tax amounts
- Subtotal and total calculation
- Applied discounts
- Payment method information

## Troubleshooting

### Email Not Sending?

1. **Check Environment Variables**
   ```bash
   # Verify in Node terminal
   console.log(process.env.EMAIL_USER)
   console.log(process.env.EMAIL_PASSWORD)
   ```

2. **Gmail Issues**
   - Verify app password (not regular password)
   - Check 2-factor is enabled
   - Try "Less secure app access" setting

3. **Check API Response**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Click "Complete Billing" with email checked
   - Look for `/api/send-invoice-email` request
   - Check response for error details

4. **Check Server Logs**
   ```bash
   # Look for error messages in console where npm run dev is running
   ```

### Email Field Missing?

- Make sure appointment/customer has `customer_email` field
- Check that database schema includes email column:
  ```sql
  ALTER TABLE customers ADD COLUMN email VARCHAR(255);
  ```

### Email Not Showing Checkbox?

- Verify `appointment.customer_email` is populated
- Check browser console for any JavaScript errors

## Email Template Customization

To modify the email template:

1. Open `app/api/send-invoice-email/route.ts`
2. Edit the `emailHtml` template string
3. Update colors, text, or layout as needed
4. Test by sending invoice again

### Customization Examples

**Change Email Header Color**
```html
<!-- Find this line -->
<div class="header" style="background: linear-gradient(to right, #4f46e5 0%, #10b981 100%);">

<!-- Change to your colors -->
<div class="header" style="background: linear-gradient(to right, #your-color1 0%, #your-color2 100%);">
```

**Add Company Logo**
```html
<img src="https://your-domain.com/logo.png" alt="Company Logo" style="max-width: 200px; margin-bottom: 20px;">
```

**Modify Footer**
```html
<div class="footer">
  <p>Your Custom Footer Text</p>
  <p>Address: 123 Main St, City, State</p>
  <p>Phone: +1 (555) 123-4567</p>
</div>
```

## Security Notes

- **Never commit `.env.local`** to version control
- Use `.gitignore` to exclude environment files
- Rotate app passwords periodically
- Use production email service for deployed apps
- Validate email addresses before sending

## Monitoring & Logging

For production, consider:

1. **Email Delivery Tracking**
   - Log all sent emails to database
   - Store timestamp and recipient
   - Track delivery status

2. **Error Monitoring**
   - Set up error tracking (Sentry, etc.)
   - Alert on email send failures
   - Monitor email service uptime

3. **Analytics**
   - Track email open rates
   - Monitor click-through rates
   - Analyze invoice patterns

## Performance Optimization

- Email sending is non-blocking (async)
- Invoice generation is done server-side
- No impact on billing save operation
- Email errors don't prevent billing completion

## Future Enhancements

- [ ] Email templates per salon/branch
- [ ] Customizable from address
- [ ] CC/BCC support
- [ ] PDF attachment generation
- [ ] Scheduled email sending
- [ ] Email delivery webhooks
- [ ] Unsubscribe functionality
