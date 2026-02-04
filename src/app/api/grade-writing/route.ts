/**
 * Writing Grader & Analyzer API - Advanced Edition
 * Using Google Cloud Vertex AI
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJSON } from "@/lib/vertex-ai";

export const runtime = "nodejs";

const ErrorSchema = z.object({
  type: z.enum(["grammar", "spelling", "vocabulary", "punctuation"]),
  original: z.string(),
  corrected: z.string(),
  explanation: z.string(),
  position: z.coerce.number().optional(),
});

const GradeSchema = z.object({
  score: z.coerce.number().min(0).max(100),
  cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  feedback: z.string(),
  strengths: z.array(z.string()).min(1),
  improvements: z.array(z.string()).min(1),
  errors: z.array(ErrorSchema),
  vocabularySuggestions: z.array(
    z.object({
      original: z.string(),
      suggested: z.string(),
      reason: z.string(),
    })
  ),
  correctedText: z.string(),
});

const RewriteSchema = z.object({
  rewrittenText: z.string(),
  changes: z.array(z.string()),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body?.action || "grade";
    const text = body?.text || "";
    const cefr = body?.cefr || "B1";
    const targetLevel = body?.targetLevel || "C1";

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // REWRITE ACTION
    if (action === "rewrite") {
      const prompt = `Rewrite the following text to ${targetLevel} level English (professional and advanced):

Original text:
"${text}"

IMPORTANT: Maintain the same meaning and main ideas, but improve:
- Vocabulary (use more sophisticated words)
- Grammar structures (use complex sentences)
- Clarity and flow
- Professional tone

Return JSON: {rewrittenText: "improved version", changes: ["change 1", "change 2", "change 3"]}`;

      const systemInstruction = `You are an expert English writing coach specializing in improving text quality.
Rewrite the text to ${targetLevel} CEFR level while keeping the original meaning.
Focus on sophistication, not length.
Return ONLY valid JSON.`;

      const result = await generateJSON(prompt, RewriteSchema, systemInstruction);

      if (!result.success || !result.data) {
        return NextResponse.json(
          { error: result.error || "Rewrite failed" },
          { status: 500 }
        );
      }

      return NextResponse.json(result.data);
    }

    // GRADE ACTION (default)
    const prompt = `Analyze this English writing in detail:

Text:
"${text}"

Student's current level: ${cefr}

Provide a comprehensive analysis with:

1. ERRORS: List ALL grammar, spelling, vocabulary, and punctuation errors
   - For each error: type, original phrase, correction, explanation
   
2. VOCABULARY SUGGESTIONS: Find 3-5 words that could be improved
   - For each: original word, better alternative, why it's better

3. CEFR LEVEL: Determine the actual CEFR level of this writing (A1-C2)

4. SCORE: Give an overall score (0-100) based on:
   - Grammar accuracy (30%)
   - Vocabulary richness (25%)
   - Structure & organization (25%)
   - Clarity & coherence (20%)

5. FEEDBACK: 2-3 sentences of constructive feedback

6. STRENGTHS: List 2-3 things done well

7. IMPROVEMENTS: List 2-3 specific areas to improve

8. CORRECTED TEXT: Provide the fully corrected version

JSON FORMAT:
{
  "score": 75,
  "cefrLevel": "B1",
  "feedback": "Your writing shows...",
  "strengths": ["Good use of...", "Clear structure"],
  "improvements": ["Work on...", "Practice..."],
  "errors": [
    {
      "type": "grammar",
      "original": "I goes",
      "corrected": "I go",
      "explanation": "Use 'go' with 'I', not 'goes'",
      "position": 0
    }
  ],
  "vocabularySuggestions": [
    {
      "original": "good",
      "suggested": "excellent",
      "reason": "More sophisticated and specific"
    }
  ],
  "correctedText": "The fully corrected version..."
}`;

    const systemInstruction = `You are a Cambridge-certified English writing examiner.
Analyze writing with attention to detail.
Be constructive but honest about the actual level.
Provide specific, actionable feedback.
Return ONLY valid JSON.`;

    const result = await generateJSON(prompt, GradeSchema, systemInstruction);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || "Analysis failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (e: any) {
    console.error("Grade writing error:", e);
    return NextResponse.json(
      { error: "Server error", details: e?.message },
      { status: 500 }
    );
  }
}
