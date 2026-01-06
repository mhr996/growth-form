import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email-template";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated (admin)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("Auth check:", { user: user?.email, authError });

    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .select("id")
      .eq("email", user.email)
      .single();

    if (adminError || !adminData) {
      console.error("Admin verification failed:", adminError);
      return NextResponse.json(
        { error: "Unauthorized - not an admin" },
        { status: 401 }
      );
    }

    const { invitees, settings } = await req.json();

    if (!invitees || !Array.isArray(invitees) || invitees.length === 0) {
      return NextResponse.json(
        { error: "No invitees provided" },
        { status: 400 }
      );
    }

    let emailsSent = 0;
    let whatsappsSent = 0;
    const errors: string[] = [];

    // Process each invitee
    for (const invitee of invitees) {
      let emailSuccess = false;
      let whatsappSuccess = false;

      // Send email if email exists
      if (invitee.email && settings.email_subject && settings.email_content) {
        try {
          const emailResult = await sendEmail(
            invitee.email,
            settings.email_subject,
            settings.email_content
          );

          if (emailResult.success) {
            emailsSent++;
            emailSuccess = true;
          } else {
            errors.push(
              `Email failed for ${invitee.name}: ${emailResult.error}`
            );
          }
        } catch (error: any) {
          errors.push(`Email error for ${invitee.name}: ${error.message}`);
        }
      }

      // Send WhatsApp if phone exists
      if (invitee.phone && settings.whatsapp_template) {
        try {
          // Check WhatsApp environment variables
          if (
            !process.env.WHATSAPP_API ||
            !process.env.WHATSAPP_API_TOKEN ||
            !process.env.WHATSAPP_SENDER_ID
          ) {
            errors.push(
              `WhatsApp not configured: Missing environment variables for ${invitee.name}`
            );
            continue;
          }

          // Format phone number: remove leading 00, +, spaces, dashes
          const formattedPhone = invitee.phone
            .replace(/^\+/, "") // Remove leading +
            .replace(/^00/, "") // Remove leading 00
            .replace(/[\s\-()]/g, "") // Remove spaces, dashes, parentheses
            .trim();

          const whatsappUrl = new URL(process.env.WHATSAPP_API);
          whatsappUrl.searchParams.append(
            "token",
            process.env.WHATSAPP_API_TOKEN
          );
          whatsappUrl.searchParams.append(
            "sender_id",
            process.env.WHATSAPP_SENDER_ID
          );
          whatsappUrl.searchParams.append("phone", formattedPhone);
          whatsappUrl.searchParams.append(
            "template",
            settings.whatsapp_template
          );

          if (settings.whatsapp_param_1) {
            whatsappUrl.searchParams.append("name", settings.whatsapp_param_1);
          }
          if (settings.whatsapp_param_2) {
            whatsappUrl.searchParams.append(
              "param_2",
              settings.whatsapp_param_2
            );
          }
          if (settings.whatsapp_url_button) {
            whatsappUrl.searchParams.append(
              "url_button",
              settings.whatsapp_url_button
            );
          }

          const whatsappResponse = await fetch(whatsappUrl.toString(), {
            method: "POST",
            redirect: "follow",
          });

          const whatsappResult = await whatsappResponse.text();
          let parsedResult;

          try {
            parsedResult = JSON.parse(whatsappResult);
          } catch {
            parsedResult = whatsappResult;
          }

          if (!parsedResult?.error) {
            whatsappsSent++;
            whatsappSuccess = true;
          } else {
            errors.push(
              `WhatsApp failed for ${invitee.name}: ${
                parsedResult.error.message || "Unknown error"
              }`
            );
          }
        } catch (error: any) {
          errors.push(`WhatsApp error for ${invitee.name}: ${error.message}`);
        }
      }

      // Update invitee record in database
      try {
        await supabase
          .from("invitees")
          .update({
            email_sent: emailSuccess,
            whatsapp_sent: whatsappSuccess,
            invited_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", invitee.id);
      } catch (error) {
        console.error(`Failed to update invitee ${invitee.name}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      whatsappsSent,
      totalProcessed: invitees.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Send invitations error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
