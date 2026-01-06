import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { phone, template, param_1, param_2, url_button, button_text } =
      await req.json();

    if (!phone || !template) {
      return NextResponse.json(
        { error: "Phone number and template name are required" },
        { status: 400 }
      );
    }

    // Trim all inputs to remove whitespace
    const trimmedTemplate = template.trim();
    const trimmedParam1 = param_1?.trim() || "";
    const trimmedParam2 = param_2?.trim() || "";
    const trimmedUrlButton = url_button?.trim() || "";
    const trimmedButtonText = button_text?.trim() || "";

    // Format phone number: remove leading 00, +, spaces, dashes
    let formattedPhone = phone
      .replace(/^\+/, "") // Remove leading +
      .replace(/^00/, "") // Remove leading 00
      .replace(/[\s\-()]/g, "") // Remove spaces, dashes, parentheses
      .trim();

    console.log("Phone number formatting:", {
      original: phone,
      formatted: formattedPhone,
    });

    const WHATSAPP_API = process.env.WHATSAPP_API;
    const WHATSAPP_SENDER_ID = process.env.WHATSAPP_SENDER_ID;
    const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;

    if (!WHATSAPP_API || !WHATSAPP_SENDER_ID || !WHATSAPP_API_TOKEN) {
      return NextResponse.json(
        { error: "WhatsApp API configuration is missing" },
        { status: 500 }
      );
    }

    // Build the API URL with query parameters
    const url = new URL(WHATSAPP_API);
    url.searchParams.append("token", WHATSAPP_API_TOKEN);
    url.searchParams.append("sender_id", WHATSAPP_SENDER_ID);
    url.searchParams.append("phone", formattedPhone);
    url.searchParams.append("template", trimmedTemplate);

    // Add optional parameters if provided (only if they have values)
    if (trimmedParam1) {
      url.searchParams.append("name", trimmedParam1);
    }
    if (trimmedParam2) {
      url.searchParams.append("param_2", trimmedParam2);
    }

    // Handle button parameters separately (not as JSON)
    if (trimmedButtonText) {
      url.searchParams.append("button_text", trimmedButtonText);
    }
    if (trimmedUrlButton) {
      url.searchParams.append("url_button", trimmedUrlButton);
    }

    console.log("WhatsApp API Request:", {
      phone: formattedPhone,
      template: trimmedTemplate,
      name: trimmedParam1 || "not provided",
      param_2: trimmedParam2 || "not provided",
      button_text: trimmedButtonText || "not provided",
      url_button: trimmedUrlButton || "not provided",
      fullUrl: url.toString(),
    });

    const response = await fetch(url.toString(), {
      method: "POST",
      redirect: "follow",
    });

    const result = await response.text();

    // Parse the result to check for errors
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch {
      parsedResult = result;
    }

    // Check if the result contains an error
    if (parsedResult?.error) {
      return NextResponse.json({
        success: false,
        error: parsedResult.error.message || "Failed to send WhatsApp message",
        details: parsedResult,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      result: parsedResult,
    });
  } catch (error) {
    console.error("WhatsApp API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
