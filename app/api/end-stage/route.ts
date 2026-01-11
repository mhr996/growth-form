import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email-template";

interface PostStageSettings {
  passedEmailSubject: string;
  passedEmailContent: string;
  failedEmailSubject: string;
  failedEmailContent: string;
  passedWhatsappTemplate: string;
  passedWhatsappImage: string;
  failedWhatsappTemplate: string;
  failedWhatsappImage: string;
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

    const { stage, settings, testMode, testRecipients, channels } =
      (await req.json()) as {
        stage: number;
        settings: PostStageSettings;
        testMode?: boolean;
        testRecipients?: Array<{
          user_name: string;
          user_email: string;
          user_phone: string | null;
          user_gender?: string | null;
          filtering_decision: string;
        }>;
        channels?: string[];
      };

    if (!stage || !settings) {
      return NextResponse.json(
        { error: "Stage and settings are required" },
        { status: 400 }
      );
    }

    let parsedSubmissions;

    // If in test mode, use provided test recipients
    if (testMode && testRecipients && testRecipients.length > 0) {
      parsedSubmissions = testRecipients;
    } else {
      // Build query with optional channel filter
      let query = supabase
        .from("form_submissions")
        .select("data, user_email, filtering_decision, channel")
        .eq("stage", stage);

      // Apply channel filter if channels are provided
      if (channels && channels.length > 0) {
        query = query.in("channel", channels);
      }

      const { data: submissions, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Failed to fetch submissions: ${fetchError.message}`);
      }

      if (!submissions || submissions.length === 0) {
        return NextResponse.json(
          { error: "No submissions found for this stage" },
          { status: 404 }
        );
      }

      // Parse submissions and extract names, phones, and gender from data JSON
      parsedSubmissions = submissions.map((s) => {
        const parsedData =
          typeof s.data === "string" ? JSON.parse(s.data) : s.data;
        return {
          user_name: parsedData.fullName || "مستخدم",
          user_email: s.user_email,
          user_phone: parsedData.phoneNumber || parsedData.phone || null,
          user_gender: parsedData.gender || null,
          filtering_decision: s.filtering_decision,
        };
      });
    }

    // Separate users by filtering_decision
    const nominatedUsers = parsedSubmissions.filter(
      (s) => s.filtering_decision === "nominated"
    );
    const excludedUsers = parsedSubmissions.filter(
      (s) => s.filtering_decision === "exclude"
    );
    // Note: users with "auto" are intentionally excluded

    let totalEmailsSent = 0;
    let totalWhatsappsSent = 0;
    const allErrors: string[] = [];
    const BATCH_SIZE = 50;

    // Helper function to send messages to a group
    const sendToGroup = async (
      users: typeof parsedSubmissions,
      emailSubject: string,
      emailContent: string,
      whatsappTemplate: string,
      whatsappImage: string,
      groupName: string
    ) => {
      let emailsSent = 0;
      let whatsappsSent = 0;

      // Process in batches of 50
      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);

        for (const user of batch) {
          // Send email
          if (user.user_email && emailSubject && emailContent) {
            try {
              const personalizedContent = `مرحباً ${user.user_name}\n\n${emailContent}`;

              const emailResult = await sendEmail(
                user.user_email,
                emailSubject,
                personalizedContent,
                whatsappImage
              );

              if (emailResult.success) {
                emailsSent++;
              } else {
                allErrors.push(
                  `[${groupName}] Email failed for ${user.user_name}: ${emailResult.error}`
                );
              }
            } catch (error: any) {
              allErrors.push(
                `[${groupName}] Email error for ${user.user_name}: ${error.message}`
              );
            }
          }

          // Send WhatsApp
          if (user.user_phone && whatsappTemplate) {
            try {
              if (
                !process.env.WHATSAPP_API ||
                !process.env.WHATSAPP_API_TOKEN ||
                !process.env.WHATSAPP_SENDER_ID
              ) {
                allErrors.push(
                  `[${groupName}] WhatsApp not configured for ${user.user_name}`
                );
                continue;
              }

              let formattedPhone = user.user_phone
                .replace(/^\+/, "")
                .replace(/^00/, "")
                .replace(/[\s\-()]/g, "")
                .trim();

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
              if (user.user_gender) {
                const genderSuffix = user.user_gender === "male" ? "_m" : "_f";
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
              whatsappUrl.searchParams.append("param_1", user.user_name);

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
                allErrors.push(
                  `[${groupName}] WhatsApp failed for ${user.user_name}: ${
                    parsedResult.error.message || "Unknown error"
                  }`
                );
              }
            } catch (error: any) {
              allErrors.push(
                `[${groupName}] WhatsApp error for ${user.user_name}: ${error.message}`
              );
            }
          }
        }

        // Delay between batches
        if (i + BATCH_SIZE < users.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      return { emailsSent, whatsappsSent };
    };

    // Send to nominated users (passed)
    if (nominatedUsers.length > 0) {
      const result = await sendToGroup(
        nominatedUsers,
        settings.passedEmailSubject,
        settings.passedEmailContent,
        settings.passedWhatsappTemplate,
        settings.passedWhatsappImage,
        "Passed"
      );
      totalEmailsSent += result.emailsSent;
      totalWhatsappsSent += result.whatsappsSent;
    }

    // Send to excluded users (failed)
    if (excludedUsers.length > 0) {
      const result = await sendToGroup(
        excludedUsers,
        settings.failedEmailSubject,
        settings.failedEmailContent,
        settings.failedWhatsappTemplate,
        settings.failedWhatsappImage,
        "Failed"
      );
      totalEmailsSent += result.emailsSent;
      totalWhatsappsSent += result.whatsappsSent;
    }

    // Move nominated users to the next stage (if not in test mode)
    if (!testMode && nominatedUsers.length > 0 && stage < 3) {
      const nextStage = stage + 1;
      const nominatedEmails = nominatedUsers.map((u) => u.user_email);

      const { error: updateError } = await supabase
        .from("form_submissions")
        .update({ stage: nextStage })
        .eq("stage", stage)
        .eq("filtering_decision", "nominated")
        .in("user_email", nominatedEmails);

      if (updateError) {
        console.error("Error moving users to next stage:", updateError);
        allErrors.push(
          `Failed to move users to stage ${nextStage}: ${updateError.message}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      totalEmailsSent,
      totalWhatsappsSent,
      nominatedCount: nominatedUsers.length,
      excludedCount: excludedUsers.length,
      autoCount: parsedSubmissions.filter(
        (s) => s.filtering_decision === "auto"
      ).length,
      errors: allErrors,
      movedToNextStage: !testMode && stage < 3 ? nominatedUsers.length : 0,
    });
  } catch (error: any) {
    console.error("Error in end-stage API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
