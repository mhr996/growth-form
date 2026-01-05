# Email System Setup Guide

## Overview

The form system now supports customizable email notifications with subject lines and branded templates including your logo.

## Features Implemented

### 1. Email Subject Fields

Added subject line configuration for all email types:

- **Pre-Stage Email Subject**: For notifications sent before a stage begins
- **Passed Email Subject**: For users who qualified for the next stage
- **Failed Email Subject**: For users who didn't qualify

### 2. Logo Integration

All emails now include your logo in the header:

- Logo URL: `https://ansjlhmmbkmytgkjpqie.supabase.co/storage/v1/object/public/images/logo.webp`
- Professional email template with gradient header
- Responsive design for all devices
- RTL (right-to-left) support for Arabic content

### 3. Email Template Features

- **Header**: Gradient background with centered logo
- **Body**: Clean, readable content area with proper spacing
- **Footer**: Automatic copyright notice and "do not reply" message
- **Styling**: Professional typography and color scheme

## Database Changes

### Migration Required

Run this SQL in your Supabase SQL Editor:

```sql
ALTER TABLE stage_settings
ADD COLUMN IF NOT EXISTS pre_stage_email_subject TEXT,
ADD COLUMN IF NOT EXISTS passed_email_subject TEXT,
ADD COLUMN IF NOT EXISTS failed_email_subject TEXT;
```

### New Columns in `stage_settings` table:

- `pre_stage_email_subject` - Subject for pre-stage notifications
- `passed_email_subject` - Subject for passed/qualified emails
- `failed_email_subject` - Subject for failed/disqualified emails

## Admin Interface Updates

### All Three Stages Updated

- `/admin/stages/stage-1/settings`
- `/admin/stages/stage-2/settings`
- `/admin/stages/stage-3/settings`

Each stage settings page now includes:

1. **Pre-Stage Tab**:

   - Email subject input field
   - Email content textarea
   - Save and Send buttons

2. **Post-Stage Tab**:
   - Passed users: subject + content
   - Failed users: subject + content
   - Save button

## Email Template Utility

### File: `lib/email-template.ts`

#### Functions Available:

**`generateEmailHTML(content: string, subject?: string): string`**

- Generates complete HTML email with logo
- Includes responsive styling
- RTL support for Arabic

**`sendEmail(to: string, subject: string, content: string): Promise<{success: boolean; error?: string}>`**

- Sends single email (needs implementation)
- Returns success/error status

**`sendBatchEmails(recipients: string[], subject: string, content: string): Promise<{success: number; failed: number; errors: string[]}>`**

- Sends emails to multiple recipients
- Returns statistics on success/failure

## Next Steps to Enable Email Sending

### Option 1: Resend (Recommended)

```bash
npm install resend
```

Update `lib/email-template.ts`:

```typescript
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, content: string) {
  const htmlContent = generateEmailHTML(content, subject);
  try {
    await resend.emails.send({
      from: "نظام النماذج <noreply@yourdomain.com>",
      to: [to],
      subject: subject,
      html: htmlContent,
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

### Option 2: SendGrid

```bash
npm install @sendgrid/mail
```

### Option 3: AWS SES

```bash
npm install @aws-sdk/client-ses
```

### Environment Variables

Add to `.env.local`:

```
RESEND_API_KEY=your_api_key_here
# or
SENDGRID_API_KEY=your_api_key_here
# or
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
```

## Usage Example

### In Stage Settings Page:

```typescript
import { sendEmail, sendBatchEmails } from "@/lib/email-template";

// Send single email
const result = await sendEmail(
  "user@example.com",
  preStageEmailSubject,
  preStageEmailContent
);

// Send to multiple users
const batchResult = await sendBatchEmails(
  ["user1@example.com", "user2@example.com"],
  passedEmailSubject,
  passedEmailContent
);
```

## Testing

### Test Email Template

1. Go to any stage settings page
2. Fill in subject and content
3. Save the content
4. Click "Send to all users" button
5. Check console logs for email preview

### Preview HTML

To see the generated HTML:

```typescript
import { generateEmailHTML } from "@/lib/email-template";

const html = generateEmailHTML("مرحباً بك في البرنامج!", "إعلان هام");
console.log(html);
```

## Email Types and Triggers

### 1. Pre-Stage Email

- **When**: Admin clicks "Send to all users" in pre-stage tab
- **To**: All users in current stage
- **Purpose**: Notifications before stage begins (deadlines, requirements, etc.)

### 2. Passed Email

- **When**: Admin ends stage (or automated trigger)
- **To**: Users with `filtering_decision = 'nominated'`
- **Purpose**: Congratulate and inform about next steps

### 3. Failed Email

- **When**: Admin ends stage (or automated trigger)
- **To**: Users with `filtering_decision = 'exclude'`
- **Purpose**: Thank users and provide feedback

## Customization

### Change Logo

Update the logo URL in `lib/email-template.ts`:

```typescript
const logoUrl = "https://your-new-logo-url.com/logo.png";
```

### Modify Colors

Edit the template's inline styles:

```typescript
background: linear-gradient(135deg, #2A3984 0%, #3a4a9f 100%);
// Change to your brand colors
```

### Add Footer Links

Extend the email footer section in `generateEmailHTML()`:

```html
<div class="email-footer">
  <p>اتصل بنا: support@example.com</p>
  <p>زيارة موقعنا: <a href="https://example.com">example.com</a></p>
</div>
```

## Troubleshooting

### Emails Not Sending

1. Check environment variables are set
2. Verify email service API key is valid
3. Check console for error messages
4. Test with a simple email first

### Logo Not Showing

1. Verify logo URL is publicly accessible
2. Check browser console for CORS errors
3. Try opening logo URL directly in browser

### Arabic Text Issues

1. Ensure email client supports RTL
2. Check that charset is set to UTF-8
3. Verify `dir="rtl"` attribute is present

## Security Considerations

1. **Rate Limiting**: Implement rate limiting for bulk emails
2. **Validation**: Validate email addresses before sending
3. **Spam Prevention**: Add unsubscribe links if required
4. **Privacy**: Don't log sensitive email content
5. **API Keys**: Never commit API keys to version control

## Support

For issues or questions:

1. Check console logs first
2. Verify database migrations are applied
3. Test email service separately
4. Review email provider documentation
