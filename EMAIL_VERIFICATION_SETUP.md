# Email Verification & Auto-Login Setup

This document explains the email verification flow using Supabase OTP authentication.

## How It Works

1. **User Access**: When a user visits the main form page ("/"), they see an email verification modal
2. **Email Entry**: User enters their email address
3. **OTP Sent**: Supabase sends a 6-digit OTP code to the user's email
4. **Verification**: User enters the OTP code
5. **Auto-Login**: Upon successful verification, the user is automatically logged in
6. **Form Access**: User can now access and submit the form

## Features

- ✅ Passwordless authentication using email OTP
- ✅ Automatic account creation on first login
- ✅ Beautiful modal with step-by-step flow
- ✅ Error handling and loading states
- ✅ RTL (Arabic) support

## Configuration

### Supabase Email Settings

1. Go to your Supabase Dashboard
2. Navigate to **Authentication > Email Templates**
3. Customize the "Confirm signup" template (OTP email)

### Email Provider (Optional - Using Resend)

If you want to use Resend instead of Supabase's default email provider:

1. Go to **Project Settings > Auth > SMTP Settings**
2. Configure Resend SMTP:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL) or `587` (TLS)
   - Username: `resend`
   - Password: Your Resend API Key

## Default Behavior

- **No passwords needed**: Users authenticate purely via email OTP
- **Auto-creation**: Accounts are created automatically when a new email is verified
- **Session persistence**: Users stay logged in across page refreshes
- **Security**: OTP codes expire after a short time for security

## Testing

1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000`
3. Enter your email address
4. Check your email for the OTP code
5. Enter the code to verify
6. You'll be automatically logged in and can access the form

## Customization

### OTP Code Length

The default is 6 digits. This is configured in Supabase and cannot be changed from the frontend.

### OTP Expiration

Default is 1 hour. Configure in Supabase Dashboard under Authentication settings.

### Email Template

You can customize the OTP email template in Supabase Dashboard > Authentication > Email Templates.

## Important Notes

- ✅ Users don't see or handle passwords
- ✅ Each email gets a unique OTP code
- ✅ OTP codes are single-use and time-limited
- ✅ The system automatically creates user accounts on first login
- ✅ All authentication is handled server-side by Supabase
