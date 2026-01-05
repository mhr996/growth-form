import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { phone, template, param_1, param_2, url_button } = await req.json();

    if (!phone || !template) {
      return NextResponse.json(
        { error: "Phone number and template name are required" },
        { status: 400 }
      );
    }

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
    url.searchParams.append("phone", phone);
    url.searchParams.append("template", template);

    // Add optional parameters if provided
    if (param_1) url.searchParams.append("param_1", param_1);
    if (param_2) url.searchParams.append("param_2", param_2);
    if (url_button) url.searchParams.append("url_button", url_button);

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
