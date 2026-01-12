import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Store OTPs in global object to persist across API route calls
if (!(global as any).otpStore) {
  (global as any).otpStore = new Map<
    string,
    { otp: string; expiresAt: number }
  >();
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const supabase = await createClient();

    // Check if email exists in form_submissions (returning user)
    const { data: submission } = await supabase
      .from("form_submissions")
      .select("user_email")
      .eq("user_email", trimmedEmail)
      .maybeSingle();

    let isValid = !!submission;

    // If not in submissions, check invitees (new user)
    if (!isValid) {
      const { data: invitees } = await supabase
        .from("invitees")
        .select("email");

      isValid =
        invitees?.some(
          (inv) => inv.email?.toLowerCase().trim() === trimmedEmail
        ) || false;
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Email not found in system" },
        { status: 404 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP in global store
    (global as any).otpStore.set(trimmedEmail, { otp, expiresAt });

    // Send OTP email
    const { data, error: emailError } = await resend.emails.send({
      from: "GrowthPlus Registration <registration@growthplus.me>",
      to: trimmedEmail,
      subject: "رمز التحقق - Growth Plus",
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; padding: 20px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2A3984 0%, #3a4a9f 100%); padding: 40px 20px; text-align: center;">
             <img src="https://ansjlhmmbkmytgkjpqie.supabase.co/storage/v1/object/public/images/logo.webp" alt="Growth Plus Logo" style="max-width: 150px; height: auto; border-radius: 12px;" />
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                مرحباً،
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                استخدم رمز التحقق التالي للدخول إلى نموذج التسجيل:
              </p>
              
              <!-- OTP Display -->
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <div style="font-size: 48px; font-weight: bold; color: #2A3984; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </div>
                <p style="color: #666; font-size: 14px; margin: 15px 0 0 0;">
                  صالح لمدة 10 دقائق
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px; padding: 15px; background-color: #fff3cd; border-right: 4px solid #ffc107; border-radius: 8px;">
                <strong>ملاحظة:</strong> إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد الإلكتروني.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                © 2026 Growth Plus. جميع الحقوق محفوظة.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Error sending OTP email:", emailError);
      throw new Error("Failed to send OTP email");
    }

    return NextResponse.json({
      message: "OTP sent successfully",
      email: trimmedEmail,
    });
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}
