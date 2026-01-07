import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fieldId, stage } = body;

    if (!stage) {
      return NextResponse.json({ error: "Missing stage" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from("admins")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all weighted fields for this stage
    const { data: fields, error: fieldsError } = await supabase
      .from("form_fields")
      .select("*")
      .eq("stage", stage)
      .eq("has_weight", true);

    if (fieldsError) {
      console.error("Error fetching fields:", fieldsError);
      return NextResponse.json(
        { error: "Failed to fetch fields" },
        { status: 500 }
      );
    }

    if (!fields || fields.length === 0) {
      return NextResponse.json({
        message: "No weighted fields found for this stage",
      });
    }

    // Get all submissions for this stage
    const { data: submissions, error: submissionsError } = await supabase
      .from("form_submissions")
      .select("id, data")
      .eq("stage", stage);

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError);
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 }
      );
    }

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({
        message: "No submissions found for this stage",
      });
    }

    // Recalculate score for each submission
    let updatedCount = 0;
    const errors: string[] = [];

    for (const submission of submissions) {
      try {
        let totalScore = 0;

        // Calculate score based on current field weights
        for (const field of fields) {
          if (!field.options?.options) continue;

          const userValue = submission.data[field.field_name];
          if (userValue === undefined || userValue === null) continue;

          // Find the selected option and its weight
          const selectedOption = field.options.options.find(
            (opt: any) => opt.value === userValue
          );

          if (selectedOption && typeof selectedOption.weight === "number") {
            totalScore += selectedOption.weight;
          }
        }

        // Update the submission with the new score
        const { error: updateError } = await supabase
          .from("form_submissions")
          .update({
            score: totalScore,
            updated_at: new Date().toISOString(),
          })
          .eq("id", submission.id);

        if (updateError) {
          errors.push(`Failed to update submission ${submission.id}`);
          console.error("Update error:", updateError);
        } else {
          updatedCount++;
        }
      } catch (error: any) {
        errors.push(
          `Error processing submission ${submission.id}: ${error.message}`
        );
        console.error("Processing error:", error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully recalculated scores for ${updatedCount} submissions`,
      updatedCount,
      totalSubmissions: submissions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error in recalculate-scores API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
