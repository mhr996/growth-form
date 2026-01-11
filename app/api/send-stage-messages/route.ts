import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email-template";

interface Recipient {
  name: string;
  email: string;
  phone: string | null;
  gender?: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated (admin)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .select("id")
      .eq("email", user.email)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json(
        { error: "Unauthorized - not an admin" },
        { status: 401 }
      );
    }

    const {
      recipients,
      emailSubject,
      emailContent,
      whatsappTemplate,
      whatsappImage,
    } = await req.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients provided" },
        { status: 400 }
      );
    }

    let emailsSent = 0;
    let whatsappsSent = 0;
    const errors: string[] = [];
    const BATCH_SIZE = 50;

    // Process in batches of 50
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);

      // Process each recipient in the batch
      for (const recipient of batch) {
        // Send email if email content exists
        if (recipient.email && emailSubject && emailContent) {
          try {
            // Personalize email with user's name
            const personalizedContent = `مرحباً ${recipient.name}\n\n${emailContent}`;

            const emailResult = await sendEmail(
              recipient.email,
              emailSubject,
              personalizedContent,
              whatsappImage
            );

            if (emailResult.success) {
              emailsSent++;
            } else {
              errors.push(
                `Email failed for ${recipient.name}: ${emailResult.error}`
              );
            }
          } catch (error: any) {
            errors.push(`Email error for ${recipient.name}: ${error.message}`);
          }
        }

        // Send WhatsApp if phone exists and template provided
        if (recipient.phone && whatsappTemplate) {
          try {
            // Check WhatsApp environment variables
            if (
              !process.env.WHATSAPP_API ||
              !process.env.WHATSAPP_API_TOKEN ||
              !process.env.WHATSAPP_SENDER_ID
            ) {
              errors.push(`WhatsApp not configured for ${recipient.name}`);
              continue;
            }

            // Format phone number
            let formattedPhone = recipient.phone
              .replace(/^\+/, "")
              .replace(/^00/, "")
              .replace(/[\s\-()]/g, "")
              .trim();

            // Handle Saudi numbers
            if (formattedPhone.startsWith("05")) {
              formattedPhone = "966" + formattedPhone.substring(1);
            } else if (
              formattedPhone.startsWith("5") &&
              !formattedPhone.startsWith("966")
            ) {
              formattedPhone = "966" + formattedPhone;
            }

            // Modify template based on gender
            let finalTemplate = whatsappTemplate;
            if (recipient.gender) {
              const genderSuffix = recipient.gender === "male" ? "_m" : "_f";
              finalTemplate = whatsappTemplate + genderSuffix;
            }

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
            whatsappUrl.searchParams.append("template", finalTemplate);
            whatsappUrl.searchParams.append("param_1", recipient.name);

            if (whatsappImage) {
              whatsappUrl.searchParams.append("image", whatsappImage);
            }

            const whatsappResponse = await fetch(whatsappUrl.toString(), {
              method: "POST",
              body: "",
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
            } else {
              errors.push(
                `WhatsApp failed for ${recipient.name}: ${
                  parsedResult.error.message || "Unknown error"
                }`
              );
            }
          } catch (error: any) {
            errors.push(
              `WhatsApp error for ${recipient.name}: ${error.message}`
            );
          }
        }
      }

      // Add delay between batches (except for the last batch)
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      whatsappsSent,
      errors,
      totalRecipients: recipients.length,
    });
  } catch (error: any) {
    console.error("Error in send-stage-messages API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
