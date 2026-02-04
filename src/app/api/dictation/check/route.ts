/**
 * Dictation Check API - Compare user input with original
 * Using AI for intelligent feedback
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJSON } from "@/lib/vertex-ai";

export const runtime = "nodejs";

const FeedbackSchema = z.object({
  accuracy: z.coerce.number().min(0).max(100),
  isCorrect: z.boolean(),
  mistakes: z.array(
    z.object({
      type: z.enum(["spelling", "grammar", "missing", "extra"]),
      original: z.string(),
      userInput: z.string(),
      correction: z.string(),
    })
  ),
  feedback: z.string(),
  correctedSentence: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const originalSentence = body?.original || "";
    const userInput = body?.userInput || "";

    if (!originalSentence || !userInput) {
      return NextResponse.json(
        { error: "Original sentence and user input are required" },
        { status: 400 }
      );
    }

    // Simple exact match check first
    const exactMatch = originalSentence.trim().toLowerCase() === userInput.trim().toLowerCase();

    if (exactMatch) {
      return NextResponse.json({
        accuracy: 100,
        isCorrect: true,
        mistakes: [],
        feedback: "Perfect! Your dictation is 100% correct!",
        correctedSentence: originalSentence,
      });
    }

    // Use AI for detailed analysis
    const prompt = `Compare these two sentences for dictation practice:

ORIGINAL SENTENCE:
"${originalSentence}"

USER WROTE:
"${userInput}"

Analyze the differences and provide detailed feedback.

MISTAKE TYPES:
- "spelling": Wrong spelling of a word
- "grammar": Grammatical error (tense, article, etc.)
- "missing": Word(s) from original are missing
- "extra": User added word(s) not in original

JSON FORMAT:
{
  "accuracy": 85,
  "isCorrect": false,
  "mistakes": [
    {
      "type": "spelling",
      "original": "accommodation",
      "userInput": "acommodation",
      "correction": "Missing one 'm' - it's 'accommodation'"
    }
  ],
  "feedback": "Very close! You got most of it right, but...",
  "correctedSentence": "The correct sentence"
}

RULES:
- Calculate accuracy as percentage (0-100)
- If accuracy >= 95%, mark as correct
- List ALL mistakes with clear explanations
- Provide encouraging feedback
- Return ONLY valid JSON`;

    const systemInstruction = `You are an English dictation teacher.
Compare sentences carefully and identify all differences.
Provide clear, constructive feedback.
Be encouraging but accurate.
Return ONLY valid JSON.`;

    const result = await generateJSON(prompt, FeedbackSchema, systemInstruction);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || "Check failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (e: any) {
    console.error("Dictation check error:", e);
    return NextResponse.json(
      { error: "Server error", details: e?.message },
      { status: 500 }
    );
  }
}
