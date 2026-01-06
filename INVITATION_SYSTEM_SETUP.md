# Invitation System Setup Guide

## Overview

The invitation system allows admins to send registration invites via email and WhatsApp to potential participants.

## Features

✅ Dual-tab interface (Content Configuration + Invitee Management)
✅ Bulk email and WhatsApp sending
✅ Import/Export invitees via Excel
✅ CRUD operations for invitees
✅ Automatic detection of email/phone availability
✅ Tracking of sent invitations

## Database Tables

### 1. `invitees` Table

Stores information about people to be invited:

- `id`: UUID primary key
- `name`: Person's name (required)
- `email`: Email address (optional)
- `phone`: Phone number (optional)
- `city`: City/location (optional)
- `invited_at`: Timestamp of when invitation was sent
- `email_sent`: Boolean flag for email delivery
- `whatsapp_sent`: Boolean flag for WhatsApp delivery
- `created_at` / `updated_at`: Timestamps

**Constraint**: Either email OR phone must be provided (at least one)

### 2. `invitation_settings` Table

Stores the invitation content configuration:

- `email_subject`: Subject line for invitation emails
- `email_content`: Email body content
- `whatsapp_template`: Template name for WhatsApp API
- `whatsapp_param_1` / `whatsapp_param_2`: Optional template parameters
- `whatsapp_url_button`: Optional button URL for WhatsApp message

## Setup Instructions

### 1. Run Database Migration

Execute the migration in Supabase SQL Editor:

```sql
-- Located in: supabase/migrations/create_invitations_tables.sql
```

This will create:

- `invitees` table
- `invitation_settings` table
- Indexes for performance
- RLS policies for admin access
- Default settings row

### 2. Access the Page

Navigate to: `/admin/invitations`

The page is already added to the admin navigation menu with a Mail icon.

### 3. Configure Invitation Content

#### Tab 1: Content Configuration

1. **Email Settings**:

   - Email Subject: Subject line that recipients will see
   - Email Content: Body of the email (supports multi-line text)
   - Logo is automatically included in emails via the email template system

2. **WhatsApp Settings**:

   - Template Name: The name of your WhatsApp template (must be pre-configured in your WhatsApp Business API)
   - Parameter 1 & 2: Optional dynamic values to insert into template
   - URL Button: Optional button link in WhatsApp message

3. Click "حفظ الإعدادات" (Save Settings)

### 4. Add Invitees

#### Manual Addition:

1. Switch to "المدعوين" (Invitees) tab
2. Click "إضافة مدعو" (Add Invitee)
3. Fill in:
   - Name (required)
   - Email (optional)
   - Phone (optional)
   - City (optional)
4. At least one of Email or Phone must be provided

#### Excel Import:

1. Click "استيراد Excel" (Import Excel)
2. Upload Excel file with columns:
   - الاسم / name
   - البريد الإلكتروني / email
   - رقم الهاتف / phone
   - المدينة / city

#### Excel Export:

- Click "تصدير Excel" (Export Excel) to download current invitees list

### 5. Send Invitations

1. Select invitees using checkboxes (or select all)
2. Click "إرسال الدعوات" (Send Invitations) button
3. Confirm the action
4. System will:
   - Send email if invitee has email AND email content is configured
   - Send WhatsApp if invitee has phone AND WhatsApp template is configured
   - Update `email_sent` and `whatsapp_sent` flags
   - Set `invited_at` timestamp

### 6. Manage Invitees

- **Edit**: Click pencil icon, modify fields, click check to save
- **Delete**: Click trash icon, confirm deletion
- **View Status**: Icons show if email 📧 or WhatsApp 📱 was sent

## API Integration

### Endpoint: `/api/send-invitations`

**Method**: POST

**Request Body**:

```json
{
  "invitees": [
    {
      "id": "uuid",
      "name": "Name",
      "email": "email@example.com",
      "phone": "+1234567890"
    }
  ],
  "settings": {
    "email_subject": "Subject",
    "email_content": "Content",
    "whatsapp_template": "template_name",
    "whatsapp_param_1": "value1",
    "whatsapp_param_2": "value2",
    "whatsapp_url_button": "https://example.com"
  }
}
```

**Response**:

```json
{
  "success": true,
  "emailsSent": 5,
  "whatsappsSent": 7,
  "totalProcessed": 7,
  "errors": []
}
```

## Email Template

Uses the existing `generateEmailHTML()` function from `lib/email-template.ts`:

- Includes Growth Plus logo
- RTL support for Arabic content
- Responsive design
- Professional styling

## WhatsApp Integration

Uses the existing WhatsApp API configuration:

- Environment variables: `WHATSAPP_API`, `WHATSAPP_SENDER_ID`, `WHATSAPP_API_TOKEN`
- Template-based messaging
- Support for parameters and URL buttons

## Sending Logic

For each selected invitee:

1. **If email exists**:

   - Check if `email_subject` and `email_content` are configured
   - Send email via Resend API
   - Mark `email_sent = true` on success

2. **If phone exists**:

   - Check if `whatsapp_template` is configured
   - Send WhatsApp message via configured API
   - Mark `whatsapp_sent = true` on success

3. **Update database**:
   - Set `invited_at` to current timestamp
   - Update `email_sent` and `whatsapp_sent` flags

## Error Handling

- Individual failures are logged but don't stop batch processing
- Errors are collected and returned in the response
- Database updates happen regardless of send success/failure
- User-friendly error messages in Arabic

## Navigation

The invitation page is accessible from the admin sidebar:

- Icon: Mail/Envelope
- Label: "إدارة الدعوات" (Invitation Management)
- Position: Between Stages and Admins

## Security

- Protected by admin authentication
- RLS policies ensure only authenticated users can access
- Admin-only access via `ProtectedRoute` wrapper

## Tips

1. **Test with yourself first**: Add your own email/phone and test the flow
2. **WhatsApp Templates**: Make sure template is approved in WhatsApp Business API before using
3. **Email Content**: Use clear, welcoming language with registration links
4. **Bulk Import**: Prepare Excel files with correct column names for smooth import
5. **Status Tracking**: Check the status icons to see who has been successfully invited

## Troubleshooting

### Emails not sending:

- Verify `RESEND_API_KEY` in environment variables
- Check "from" address is verified in Resend dashboard
- Verify email content is saved in settings

### WhatsApp not sending:

- Verify all WhatsApp environment variables are set
- Confirm template name matches exactly
- Check template is approved in WhatsApp Business API
- Verify phone numbers are in correct format

### Import fails:

- Check Excel column names match expected format
- Ensure at least name + (email OR phone) in each row
- Try exporting first to see the correct format
