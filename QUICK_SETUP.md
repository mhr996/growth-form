# Quick Setup Guide - WhatsApp Stage Messages

## 1️⃣ Run Database Migration

Open your Supabase SQL Editor and run:

```sql
-- File: ADD_WHATSAPP_STAGE_FIELDS.sql

ALTER TABLE public.stage_settings
ADD COLUMN IF NOT EXISTS pre_stage_whatsapp_template text,
ADD COLUMN IF NOT EXISTS pre_stage_whatsapp_image text,
ADD COLUMN IF NOT EXISTS passed_whatsapp_template text,
ADD COLUMN IF NOT EXISTS passed_whatsapp_image text,
ADD COLUMN IF NOT EXISTS failed_whatsapp_template text,
ADD COLUMN IF NOT EXISTS failed_whatsapp_image text;
```

## 2️⃣ Verify Environment Variables

Make sure these are in your `.env.local`:

```env
WHATSAPP_API=https://your-whatsapp-api-url
WHATSAPP_API_TOKEN=your-token-here
WHATSAPP_SENDER_ID=your-sender-id-here
```

## 3️⃣ Set Up WhatsApp Templates

Create templates in your WhatsApp Business account with these patterns:

**Pre-Stage Template Example:**

```
مرحباً {{1}}

هذا إعلان هام عن المرحلة الأولى...
[Your message content]
```

**Passed Template Example:**

```
مبروك {{1}}!

تم قبولك للمرحلة التالية...
[Your message content]
```

**Failed Template Example:**

```
عزيزي {{1}}

شكراً لتقديمك على البرنامج...
[Your message content]
```

Template names might be like:

- `pre_stage_1_announcement`
- `stage_1_passed`
- `stage_1_failed`

## 4️⃣ Configure in Admin Panel

### For Pre-Stage Messages:

1. Go to **Admin → Stages → Stage [X] → Settings**
2. Click **"Pre-Stage Messages"** tab
3. Fill in:
   - Email subject (e.g., "إعلان هام")
   - Email content
   - WhatsApp template name (e.g., "pre_stage_1_announcement")
   - WhatsApp image URL (optional, e.g., "https://example.com/image.jpg")
4. Click **"Save Content"**
5. When ready, click **"Send Email and WhatsApp to All Users"**

### For Post-Stage Messages:

1. Go to **Admin → Stages → Stage [X] → Settings**
2. Click **"Post-Stage Messages"** tab
3. Configure for **Passed Users**:
   - Email subject and content
   - WhatsApp template (e.g., "stage_1_passed")
   - WhatsApp image (optional)
4. Configure for **Failed Users**:
   - Email subject and content
   - WhatsApp template (e.g., "stage_1_failed")
   - WhatsApp image (optional)
5. Click **"Save Settings"**
6. When ready to end stage, click **"End Stage"** and confirm

## 5️⃣ How the Audiences Work

### Pre-Stage Messages

**Sent to:** All users who submitted a form in that stage

```
SELECT user_name, user_email, user_phone
FROM form_submissions
WHERE stage = X
```

### Post-Stage Messages

**Sent to:** Users filtered by `filtering_decision`

- `filtering_decision = 'nominated'` → Receives **PASSED** messages
- `filtering_decision = 'exclude'` → Receives **FAILED** messages
- `filtering_decision = 'auto'` → Receives **NOTHING**

```sql
-- Passed users
SELECT * FROM form_submissions
WHERE stage = X AND filtering_decision = 'nominated'

-- Failed users
SELECT * FROM form_submissions
WHERE stage = X AND filtering_decision = 'exclude'
```

## 6️⃣ Testing

### Test Pre-Stage Messages

1. Add test data to `form_submissions` with `stage = 1`
2. Configure email and WhatsApp content in admin panel
3. Click "Send Email and WhatsApp to All Users"
4. Check your email and WhatsApp for the messages
5. Verify the success message shows correct counts

### Test Post-Stage Messages

1. Add test submissions with different `filtering_decision` values:
   - Some with `'nominated'`
   - Some with `'exclude'`
   - Some with `'auto'`
2. Configure both passed and failed messages
3. Click "End Stage" and confirm
4. Verify:
   - Nominated users got passed messages
   - Excluded users got failed messages
   - Auto users got nothing
   - Success message shows correct counts

## 🎯 Important Notes

### About {{name}} Variable

- The system automatically uses the user's name from `form_submissions.user_name`
- In emails: Prepended as "مرحباً [Name]"
- In WhatsApp: Passed as parameter to replace `{{1}}` in your template

### About Batching

- All messages sent in batches of 50
- 2-second delay between batches
- Total process might take a few minutes for large audiences

### About Phone Numbers

- System handles Saudi formats: 05xxxxxxxx or 5xxxxxxxx
- Converts to international: 9665xxxxxxxx
- Also handles +966 and 00966 formats

### About Images

- Must be publicly accessible URLs
- Recommended formats: JPG, PNG
- Optional field - leave empty if not needed

## 📊 Expected Results

After sending, you'll see a success message like:

```
تم الإرسال بنجاح! إيميلات: 50، واتساب: 48، أخطاء: 2
```

After ending a stage:

```
تم إنهاء المرحلة بنجاح!
تم الإرسال: إيميلات: 100، واتساب: 95
ناجحين: 50، راسبين: 50
```

## 🔍 Troubleshooting

**No WhatsApp messages sent?**

- Check environment variables are set
- Verify template names match exactly
- Check WhatsApp Business account for template approval
- Check console for error messages

**Phone numbers not working?**

- Verify format in database (should have country code or Saudi format)
- Check console logs for formatted phone numbers
- Test with +966 format directly

**Emails not sending?**

- Verify Resend API configuration
- Check `from` email is verified
- Check console logs for email errors

**Getting authentication errors?**

- Make sure you're logged in as admin
- Check your admin account exists in `admins` table
- Verify your email matches exactly

## 📝 Need Help?

Check these files for more details:

- `IMPLEMENTATION_SUMMARY.md` - Complete technical details
- `WHATSAPP_STAGE_SETUP.md` - Comprehensive setup guide
- `ADD_WHATSAPP_STAGE_FIELDS.sql` - Database migration script

Or check the API route files:

- `app/api/send-stage-messages/route.ts` - Pre-stage sending
- `app/api/end-stage/route.ts` - Post-stage sending
