import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GPT_API_KEY,
});

interface AIPromptData {
  instruction: string;
  context?: string;
  rubric?: {
    headers: string[];
    rows: Array<{
      id: string;
      cells: Array<{ id: string; value: string }>;
    }>;
  };
  examples?: string;
}

interface EvaluationRequest {
  submissionId: string;
  userEmail: string;
  formData: Record<string, any>;
}

async function evaluateWithRetry(
  prompt: string,
  userAnswer: string,
  retries = 3,
  delay = 1000
): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.15,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an expert evaluator. Respond with valid JSON containing 'score' (number) and 'explanation' (string) fields.",
          },
          {
            role: "user",
            content: `${prompt}\n\nUser's Answer: ${userAnswer}\n\nProvide your evaluation as JSON with 'score' and 'explanation' fields.`,
          },
        ],
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) {
        throw new Error("Empty response from OpenAI");
      }

      return JSON.parse(result);
    } catch (error: any) {
      console.error(`Evaluation attempt ${attempt} failed:`, error.message);

      if (attempt === retries) {
        // Last attempt failed, return error response
        return {
          score: 0,
          explanation: `Evaluation failed after ${retries} attempts: ${error.message}`,
          error: true,
        };
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
}

function buildPromptText(promptData: AIPromptData): string {
  let promptText = promptData.instruction;

  if (promptData.context) {
    promptText += `\n\nContext: ${promptData.context}`;
  }

  if (promptData.rubric && promptData.rubric.rows.length > 0) {
    promptText += "\n\nEvaluation Rubric:";
    const headers = promptData.rubric.headers.join(" | ");
    promptText += `\n${headers}`;
    promptText += "\n" + "-".repeat(headers.length);

    promptData.rubric.rows.forEach((row) => {
      const rowText = row.cells.map((cell) => cell.value).join(" | ");
      if (rowText.trim()) {
        promptText += `\n${rowText}`;
      }
    });
  }

  if (promptData.examples) {
    promptText += `\n\nExamples: ${promptData.examples}`;
  }

  return promptText;
}

export async function POST(request: NextRequest) {
  try {
    const body: EvaluationRequest = await request.json();
    const { submissionId, formData } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: "Missing submissionId" },
        { status: 400 }
      );
    }

    // Get form fields with AI prompts for stage 1
    const supabase = await createClient();
    const { data: fields, error: fieldsError } = await supabase
      .from("form_fields")
      .select("*")
      .eq("stage", 1)
      .eq("is_ai_calculated", true);

    if (fieldsError) {
      console.error("Error fetching fields:", fieldsError);
      return NextResponse.json(
        { error: "Failed to fetch form fields" },
        { status: 500 }
      );
    }

 

    if (!fields || fields.length === 0) {
      // No AI fields to evaluate
      return NextResponse.json({ message: "No AI fields to evaluate" });
    }

    // Process each AI-calculated field
    const evaluations: Record<string, any> = {};

    for (const field of fields) {
      if (!field.ai_prompt || !field.question_title) {
        continue;
      }

      const userAnswer = formData[field.field_name];
      if (!userAnswer) {
        continue; // Skip if user didn't answer this question
      }

      try {
        const promptData: AIPromptData = field.ai_prompt;
        const promptText = buildPromptText(promptData);

        const evaluation = await evaluateWithRetry(promptText, userAnswer);

        // Store evaluation using question_title as key
        evaluations[field.question_title] = {
          field_name: field.field_name,
          user_answer: userAnswer,
          evaluation: evaluation,
          evaluated_at: new Date().toISOString(),
        };
      } catch (error: any) {
        console.error(`Error evaluating field ${field.question_title}:`, error);
        evaluations[field.question_title] = {
          field_name: field.field_name,
          user_answer: userAnswer,
          evaluation: {
            score: 0,
            explanation: `Evaluation error: ${error.message}`,
            error: true,
          },
          evaluated_at: new Date().toISOString(),
        };
      }
    }

    // Save evaluations to database
    const { error: updateError } = await supabase
      .from("form_submissions")
      .update({
        ai_evaluations: evaluations,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    if (updateError) {
      console.error("Error updating submission:", updateError);
      return NextResponse.json(
        { error: "Failed to save evaluations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Evaluations completed",
      evaluations,
    });
  } catch (error: any) {
    console.error("Error in evaluate-submission API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
