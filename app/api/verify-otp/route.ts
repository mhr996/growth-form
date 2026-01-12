import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Get stored OTP from the global module cache
    const storedData = (global as any).otpStore?.get(trimmedEmail);

    if (!storedData) {
      return NextResponse.json(
        { error: "OTP not found or expired" },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (Date.now() > storedData.expiresAt) {
      (global as any).otpStore?.delete(trimmedEmail);
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // OTP is valid, delete it
    (global as any).otpStore?.delete(trimmedEmail);

    // Create Supabase admin client with service role for admin operations
    const supabase = await createAdminClient();

    // Generate a magic link token for the user
    // This works for both new and existing users - Supabase will create the user if needed
    console.log("Generating magic link for:", trimmedEmail);
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: trimmedEmail,
        options: {
          // Optional: set redirect URL to your site URL
          redirectTo: process.env.NEXT_PUBLIC_SITE_URL || undefined,
        },
      });

    if (linkError || !linkData) {
      console.error("Error generating link:", linkError);
      return NextResponse.json(
        { error: "Failed to generate session" },
        { status: 500 }
      );
    }

    console.log("Magic link generated successfully");
    return NextResponse.json({
      message: "OTP verified successfully",
      email: trimmedEmail,
      hashed_token: linkData.properties.hashed_token,
      verification_type: linkData.properties.verification_type,
      redirect_to: linkData.properties.redirect_to,
    });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
