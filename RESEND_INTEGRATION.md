# Connecting to Your Existing Resend Integration

Since you already have Resend configured with Supabase, you need to create a **Supabase Edge Function** to handle email sending.

## Option 1: Create Supabase Edge Function (Recommended)

### 1. Create the Edge Function

In your Supabase project, create a new Edge Function called `send-email`:

```typescript
// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const { to, subject, html } = await req.json();

    const recipients = Array.isArray(to) ? to : [to];

    // Send email using Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "نظام النماذج <noreply@yourdomain.com>", // Update with your verified domain
        to: recipients,
        subject: subject,
        html: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
```

### 2. Deploy the Edge Function

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy send-email --no-verify-jwt

# Set the Resend API key secret
supabase secrets set RESEND_API_KEY=your_resend_api_key
```

### 3. Update Your Next.js API Route

Update `app/api/send-email/route.ts` to call the Edge Function:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEmailHTML } from "@/lib/email-template";

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  content: string;
  stage?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendEmailRequest = await request.json();
    const { to, subject, content } = body;

    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate HTML email with logo
    const htmlContent = generateEmailHTML(content, subject);

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: to,
        subject: subject,
        html: htmlContent,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    const recipients = Array.isArray(to) ? to : [to];

    return NextResponse.json({
      success: true,
      message: `Email sent to ${recipients.length} recipient(s)`,
      recipients: recipients.length,
    });
  } catch (error: any) {
    console.error("Error in send-email API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Option 2: Use Resend Directly (If You Have the API Key)

If you have access to the Resend API key, you can use it directly:

### 1. Install Resend

```bash
npm install resend
```

### 2. Add to .env.local

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### 3. Update lib/email-template.ts

Replace the `sendEmail` function with:

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
  to: string,
  subject: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
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
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
}
```

### 4. Update API Route

The API route in `app/api/send-email/route.ts` will automatically use the updated function.

## Testing

1. Go to any stage settings page
2. Fill in subject and content
3. Click "Send to all users"
4. Check the response in browser console
5. Verify emails were received

## Which Option to Choose?

- **Edge Function**: Better if you want centralized email logic in Supabase
- **Direct Integration**: Simpler if you have the API key and want fewer moving parts

Choose based on your preference and existing setup!
