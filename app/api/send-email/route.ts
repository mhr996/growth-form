import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateEmailHTML,
  sendEmail,
  sendBatchEmails,
} from "@/lib/email-template";

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

    if (!to || !subject || !content) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, content" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Send emails using Resend
    const recipients = Array.isArray(to) ? to : [to];

    if (recipients.length === 1) {
      // Single email
      const result = await sendEmail(recipients[0], subject, content);

      if (!result.success) {
        throw new Error(result.error || "Failed to send email");
      }

      return NextResponse.json({
        success: true,
        message: "Email sent successfully",
        recipients: 1,
      });
    } else {
      // Batch emails
      const result = await sendBatchEmails(recipients, subject, content);

      return NextResponse.json({
        success: true,
        message: `Sent ${result.success} emails successfully${
          result.failed > 0 ? `, ${result.failed} failed` : ""
        }`,
        recipients: recipients.length,
        successful: result.success,
        failed: result.failed,
        errors: result.errors,
      });
    }
  } catch (error: any) {
    console.error("Error in send-email API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
