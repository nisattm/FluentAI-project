/**
 * CEFR Level Validation Test API - Using Vertex AI
 * Generates 10 questions to validate user's selected CEFR level
 * With retry logic and improved error handling
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJSON, resetVertexAIClient, isConfigured, getConfig } from "@/lib/vertex-ai";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60 seconds for AI generation with retries

const CEFRTestSchema = z.object({
  title: z.string(),
  targetCefr: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  questions: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["mcq", "fill"]),
      prompt: z.string(),
      choices: z.array(z.string()).length(4).optional(),
      answer: z.string(),
      explanation: z.string(),
      skillTag: z.enum(["vocab", "grammar", "reading", "writing", "listening", "speaking"]),
      difficulty: z.coerce.number().int().min(1).max(10),
    })
  ).length(10),
});

const LEVEL_SPECS: Record<string, string> = {
  A1: "Basic greetings, simple present tense, numbers, colors, family vocabulary (I am, you are, he/she is)",
  A2: "Simple past tense, basic future (going to), daily routines, shopping, simple questions (What, Where, When)",
  B1: "Present perfect, can/could/should, expressing opinions, making comparisons, intermediate vocabulary",
  B2: "Passive voice, conditional sentences (2nd/3rd), relative clauses, phrasal verbs, formal/informal register",
  C1: "Advanced grammar (subjunctive, inversion), idiomatic expressions, academic vocabulary, complex discourse",
  C2: "Native-like mastery, nuanced meanings, literary language, subtle distinctions, sophisticated expressions",
};

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    // Check if Vertex AI is configured
    if (!isConfigured()) {
      console.error("[CEFR Test] Vertex AI not configured");
      const config = getConfig();
      console.error("[CEFR Test] Config status:", JSON.stringify(config));
      return NextResponse.json(
        { error: "AI service not configured. Please check environment variables." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const targetCefr = body?.targetCefr || "B1";

    const specs = LEVEL_SPECS[targetCefr] || LEVEL_SPECS.B1;

    console.log(`[CEFR Test] Generating validation test for ${targetCefr}`);

    const prompt = `Generate a Level Validation Test for CEFR ${targetCefr}.

PURPOSE: Validate if the user truly belongs at ${targetCefr} level.

CRITICAL REQUIREMENTS:
- Exactly 10 questions
- All questions must be at ${targetCefr} difficulty standards: ${specs}
- Mix: 70% MCQ (4 choices each), 30% fill-in-the-blank
- Cover all skills: grammar, vocabulary, reading comprehension
- Questions should be challenging but fair for ${targetCefr}
- EVERY question MUST have a non-empty "answer" field
- For MCQ: "answer" must be one of the choices (the correct one)
- For fill: "answer" must be the word/phrase to fill in
- skillTag MUST be one of: "vocab", "grammar", "reading", "writing", "listening", "speaking"

JSON FORMAT:
{
  "title": "Level Validation: ${targetCefr}",
  "targetCefr": "${targetCefr}",
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "prompt": "Complete the sentence: I ___ to Paris three times.",
      "choices": ["go", "went", "have been", "am going"],
      "answer": "have been",
      "explanation": "Present perfect is used for life experiences (no specific time).",
      "skillTag": "grammar",
      "difficulty": 7
    },
    {
      "id": "q2",
      "type": "fill",
      "prompt": "Complete: Despite ___ tired, she continued working.",
      "answer": "being",
      "explanation": "After 'despite', we use gerund (verb+ing).",
      "skillTag": "grammar",
      "difficulty": 6
    }
  ]
}

IMPORTANT:
1. ALL questions MUST match ${targetCefr} difficulty exactly
2. No easier or harder questions - strict level adherence
3. Provide clear explanations for learning
4. Return ONLY valid JSON
5. Exactly 10 questions with valid answers`;

    const systemInstruction = `You are a Cambridge CEFR assessment expert.
Generate questions that accurately test ${targetCefr} level proficiency.
Questions must be pedagogically sound and aligned with official CEFR standards.
Be strict - questions should challenge students at this level.
Return ONLY valid JSON.`;

    const result = await generateJSON(prompt, CEFRTestSchema, systemInstruction);

    const duration = Date.now() - startTime;
    console.log(`[CEFR Test] Generation completed in ${duration}ms, success: ${result.success}`);

    if (!result.success || !result.data) {
      console.error("[CEFR Test] Generation failed:", result.error);
      
      // If there's a persistent error, reset the client for the next request
      if (result.error?.includes('exception posting request')) {
        console.log("[CEFR Test] Resetting Vertex AI client due to persistent error");
        resetVertexAIClient();
      }
      
      return NextResponse.json(
        { 
          error: result.error || "Validation test generation failed",
          retryable: true,
        },
        { status: 500 }
      );
    }

    console.log(`[CEFR Test] Successfully generated ${result.data.questions.length} questions`);
    return NextResponse.json(result.data);
    
  } catch (e: any) {
    const duration = Date.now() - startTime;
    console.error(`[CEFR Test] Error after ${duration}ms:`, e);
    
    // Reset client on unexpected errors
    resetVertexAIClient();
    
    return NextResponse.json(
      { 
        error: "Server error", 
        details: e?.message,
        retryable: true,
      },
      { status: 500 }
    );
  }
}
