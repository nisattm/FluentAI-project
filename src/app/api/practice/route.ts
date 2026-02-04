/**
 * Practice Question Generator
 * Using Google Cloud Vertex AI - Gemini 2.0 Flash
 * With retry logic and improved error handling
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJSON, resetVertexAIClient, isConfigured, getConfig } from "@/lib/vertex-ai";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60 seconds for AI generation with retries

const CEFR = z.enum(["A1", "A2", "B1", "B2", "C1"]);
const Skill = z.enum([
  "vocab",
  "grammar",
  "reading",
  "writing",
  "listening",
  "speaking",
]);

const QuestionSchema = z.object({
  id: z.string().min(2),
  type: z.enum(["mcq", "typing", "fill"]), // Accept both typing and fill
  prompt: z.string().min(5),
  choices: z.array(z.string()).optional(),
  answer: z.string().min(1),
  skill: Skill,
  explanation: z.string().optional(),
});

const PracticeSchema = z.object({
  title: z.string().min(3),
  questions: z.array(QuestionSchema).min(10),
});

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    // Check if Vertex AI is configured
    if (!isConfigured()) {
      console.error("[Practice API] Vertex AI not configured");
      const config = getConfig();
      console.error("[Practice API] Config status:", JSON.stringify(config));
      return NextResponse.json(
        { error: "AI service not configured. Please check environment variables." },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const user = body?.user ?? {};
    const requestedCount = Math.min(Math.max(Number(body?.targetCount) || 12, 10), 20);
    // Request 20% more questions to account for filtering invalid ones
    const targetCount = Math.min(Math.ceil(requestedCount * 1.2), 24);
    const userCefr = String(user?.cefr || "B1").toUpperCase();

    console.log(`[Practice API] Generating ${targetCount} questions (requested: ${requestedCount}) for CEFR ${userCefr}`);

    const prompt = `Generate EXACTLY ${targetCount} English practice questions for CEFR level ${userCefr}.

CRITICAL REQUIREMENTS:
- ${targetCount} questions total
- 70% MCQ (multiple choice), 30% typing (fill-in-the-blank)
- Each MCQ MUST have EXACTLY 4 choices
- EVERY question MUST have a non-empty "answer" field
- For MCQ: "answer" must be one of the choices (the correct one)
- For typing: "answer" must be the word/phrase to fill in the blank
- skill MUST be one of: "vocab", "grammar", "reading", "writing", "listening", "speaking"
- Difficulty: 20% easier, 60% at-level, 20% harder than ${userCefr}
- Skills mix: 30% vocab, 30% grammar, 20% reading, 10% writing, 5% listening, 5% speaking

JSON format (follow EXACTLY):
{
  "title": "English Practice - ${userCefr} Level",
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "prompt": "She ___ to work every day.",
      "choices": ["goes", "go", "going", "gone"],
      "answer": "goes",
      "skill": "grammar",
      "explanation": "Third person singular uses 'goes'"
    },
    {
      "id": "q2",
      "type": "typing",
      "prompt": "I have been living here ___ 2020.",
      "answer": "since",
      "skill": "grammar",
      "explanation": "'Since' is used with specific points in time"
    }
  ]
}

Generate ALL ${targetCount} questions with valid answers.`;

    const systemInstruction = `You are an expert English teacher creating practice exercises.
Questions should be realistic, useful, and appropriate for ${userCefr} level students.
Return ONLY valid JSON.`;

    const result = await generateJSON(prompt, PracticeSchema, systemInstruction);

    const duration = Date.now() - startTime;
    console.log(`[Practice API] Generation completed in ${duration}ms, success: ${result.success}`);

    if (!result.success || !result.data) {
      console.error("[Practice API] Generation failed:", result.error);
      
      // If there's a persistent error, reset the client for the next request
      if (result.error?.includes('exception posting request')) {
        console.log("[Practice API] Resetting Vertex AI client due to persistent error");
        resetVertexAIClient();
      }
      
      return NextResponse.json(
        { 
          error: result.error || "Failed to generate practice questions",
          retryable: true, // Let the frontend know it can retry
        },
        { status: 500 }
      );
    }

    // Filter and validate questions
    const validQuestions = result.data.questions.filter((q) => {
      // Check MCQ questions have exactly 4 choices
      if (q.type === "mcq") {
        if (!q.choices || q.choices.length < 2) {
          console.log(`[Practice API] Filtering out MCQ with invalid choices: ${q.id}`);
          return false;
        }
        // Pad choices to 4 if needed (AI sometimes returns 3)
        while (q.choices.length < 4) {
          q.choices.push("(no option)");
        }
        // Trim to 4 if more than 4
        if (q.choices.length > 4) {
          q.choices = q.choices.slice(0, 4);
        }
      }
      return true;
    });

    // Make sure we have at least 10 valid questions
    if (validQuestions.length < 10) {
      console.error(`[Practice API] Not enough valid questions: ${validQuestions.length}`);
      return NextResponse.json(
        { 
          error: `Generated only ${validQuestions.length} valid questions, need at least 10`,
          retryable: true,
        },
        { status: 500 }
      );
    }

    // Return validated questions (trim to requested count)
    const finalQuestions = validQuestions.slice(0, requestedCount);
    
    console.log(`[Practice API] Successfully generated ${finalQuestions.length} valid questions`);
    return NextResponse.json({
      ...result.data,
      questions: finalQuestions,
    });
    
  } catch (e: any) {
    const duration = Date.now() - startTime;
    console.error(`[Practice API] Error after ${duration}ms:`, e);
    
    // Reset client on unexpected errors
    resetVertexAIClient();
    
    return NextResponse.json(
      { 
        error: "Server error", 
        details: e?.message ?? String(e),
        retryable: true,
      },
      { status: 500 }
    );
  }
}
