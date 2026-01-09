# WhatsApp Integration for Stage Messages - Setup Guide

## Overview

This update adds WhatsApp messaging capabilities to the pre-stage and post-stage communication system. Now admins can send both emails and WhatsApp messages to users at different stages of the form submission process.

## What's New

### 1. Database Schema Updates

Run the SQL migration file `ADD_WHATSAPP_STAGE_FIELDS.sql` to add the following columns to the `stage_settings` table:

- `pre_stage_whatsapp_template` - Template name for pre-stage WhatsApp messages
- `pre_stage_whatsapp_image` - Optional image URL for pre-stage WhatsApp messages
- `passed_whatsapp_template` - Template name for passed users
- `passed_whatsapp_image` - Optional image URL for passed users
- `failed_whatsapp_template` - Template name for failed users
- `failed_whatsapp_image` - Optional image URL for failed users

### 2. New API Endpoints

#### `/api/send-stage-messages` (POST)

Sends both email and WhatsApp messages to a list of recipients in batches of 50.

**Request Body:**

```json
{
  "recipients": [
    {
      "name": "User Name",
      "email": "user@example.com",
      "phone": "0501234567"
    }
  ],
  "emailSubject": "Subject",
  "emailContent": "Content",
  "whatsappTemplate": "template_name",
  "whatsappImage": "https://example.com/image.jpg" // optional
}
```

**Response:**

```json
{
  "success": true,
  "emailsSent": 50,
  "whatsappsSent": 48,
  "errors": [],
  "totalRecipients": 50
}
```

#### `/api/end-stage` (POST)

Ends a stage and sends post-stage messages to nominated and excluded users.

**Request Body:**

```json
{
  "stage": 1,
  "settings": {
    "passedEmailSubject": "Congratulations!",
    "passedEmailContent": "You passed...",
    "failedEmailSubject": "Thank you",
    "failedEmailContent": "Unfortunately...",
    "passedWhatsappTemplate": "stage_1_passed",
    "passedWhatsappImage": "https://...",
    "failedWhatsappTemplate": "stage_1_failed",
    "failedWhatsappImage": "https://..."
  }
}
```

**Response:**

```json
{
  "success": true,
  "totalEmailsSent": 100,
  "totalWhatsappsSent": 95,
  "nominatedCount": 50,
  "excludedCount": 50,
  "autoCount": 10,
  "errors": []
}
```

### 3. Updated Stage Settings Pages

All three stage settings pages (Stage 1, 2, and 3) now include:

**Pre-Stage Tab:**

- Email subject and content fields
- WhatsApp template name field
- WhatsApp image URL field (optional)
- "Send Email and WhatsApp to All Users" button

**Post-Stage Tab:**

- Passed Users section:
  - Email subject and content
  - WhatsApp template and image
- Failed Users section:
  - Email subject and content
  - WhatsApp template and image
- "End Stage" button that sends messages to nominated and excluded users

## How It Works

### Pre-Stage Messages

1. Admin configures email and WhatsApp content in the "Pre-Stage" tab
2. Admin clicks "Send Email and WhatsApp to All Users"
3. System fetches all users who submitted forms for that stage
4. Creates unique recipient list (deduplicates by email)
5. Sends messages in batches of 50 with 2-second delays between batches
6. Shows success message with counts

**Audience:** All users who have submitted a form in that stage

### Post-Stage Messages

1. Admin configures email and WhatsApp content for both passed and failed users in "Post-Stage" tab
2. Admin clicks "End Stage" button
3. System fetches all submissions for that stage
4. Filters users by `filtering_decision`:
   - `nominated` → receives "passed" messages
   - `exclude` → receives "failed" messages
   - `auto` → receives nothing
5. Sends messages in batches of 50 with 2-second delays between batches
6. Shows success message with detailed counts

### Personalization

All messages (both email and WhatsApp) support `{{name}}` variable:

- In emails: Automatically prepended as "مرحباً [Name]"
- In WhatsApp: Passed as `param_1` to the template

### Batch Processing

- All messages are sent in batches of 50
- 2-second delay between batches to avoid rate limiting
- Separate error tracking for each recipient
- Continues processing even if individual messages fail

## Environment Variables Required

Make sure these are set in your `.env.local`:

```
WHATSAPP_API=https://your-whatsapp-api-url
WHATSAPP_API_TOKEN=your-token
WHATSAPP_SENDER_ID=your-sender-id
```

## Usage Instructions

### Setting Up Pre-Stage Messages

1. Navigate to Admin → Stages → Stage [X] → Settings
2. Click on "Pre-Stage Messages" tab
3. Fill in email subject and content
4. Fill in WhatsApp template name (must match your WhatsApp Business template)
5. Optionally add an image URL
6. Click "Save Content"
7. When ready, click "Send Email and WhatsApp to All Users"

### Setting Up Post-Stage Messages

1. Navigate to Admin → Stages → Stage [X] → Settings
2. Click on "Post-Stage Messages" tab
3. Configure passed users:
   - Email subject and content
   - WhatsApp template and image
4. Configure failed users:
   - Email subject and content
   - WhatsApp template and image
5. Click "Save Settings"
6. When ready to end the stage, click "End Stage" → Confirm

### Notes on WhatsApp Templates

- Template names must match exactly what's configured in your WhatsApp Business account
- Use `{{1}}` in your WhatsApp template where you want the user's name to appear
- The system will automatically pass the user's name as `param_1`
- Images are optional but must be publicly accessible URLs

## Error Handling

- Individual message failures don't stop the batch process
- All errors are collected and reported at the end
- Errors include the user's name and specific error message
- Check console logs for detailed error information

## Testing

Before sending to all users, consider:

1. Test with a small group first
2. Verify WhatsApp templates are approved and active
3. Check that image URLs are accessible
4. Confirm environment variables are set correctly

## Migration from Old System

The old `send-email` API still exists and works, but the new system provides:

- Integrated WhatsApp support
- Better batch processing
- More detailed error reporting
- Proper recipient deduplication
- Support for filtering decisions

Old pre-stage email sends will continue to work but won't send WhatsApp messages.
