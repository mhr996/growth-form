import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Email template with logo and styling
export function generateEmailHTML(content: string, subject?: string): string {
  const logoUrl =
    "https://ansjlhmmbkmytgkjpqie.supabase.co/storage/v1/object/public/images/logo.webp";

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject || "إشعار"}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      direction: rtl;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background: linear-gradient(135deg, #2A3984 0%, #3a4a9f 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      max-width: 200px;
      height: auto;
      margin-bottom: 20px;
    }
    .email-body {
      padding: 40px 30px;
      color: #333333;
      line-height: 1.8;
      font-size: 16px;
    }
    .email-footer {
      background-color: #f8f8f8;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #666666;
      border-top: 1px solid #e0e0e0;
    }
    .content {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <img src="${logoUrl}" alt="Logo" class="logo" />
    </div>
    <div class="email-body">
      <div class="content">${content}</div>
    </div>
    <div class="email-footer">
      <p>هذا البريد الإلكتروني تم إرساله تلقائياً، يرجى عدم الرد عليه.</p>
      <p style="margin-top: 10px; font-size: 12px; color: #999999;">
        © ${new Date().getFullYear()} جميع الحقوق محفوظة
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Function to send email using Resend
export async function sendEmail(
  to: string,
  subject: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const htmlContent = generateEmailHTML(content, subject);

  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const result = await resend.emails.send({
      from: "GrowthPlus Registration <registration@growthplus.me>",
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error sending email:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return { success: false, error: error.message };
  }
}

// Batch send emails to multiple recipients
export async function sendBatchEmails(
  recipients: string[],
  subject: string,
  content: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const email of recipients) {
    const result = await sendEmail(email, subject, content);
    if (result.success) {
      success++;
    } else {
      failed++;
      errors.push(`${email}: ${result.error || "Unknown error"}`);
    }
  }

  return { success, failed, errors };
}
