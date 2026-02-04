/**
 * Question Generator API
 * Using Google Cloud Vertex AI
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJSON } from "@/lib/vertex-ai";

export const runtime = "nodejs";

const CEFR = z.enum(["A1", "A2", "B1", "B2", "C1"]);

const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["mcq", "typing", "fill"]),
  prompt: z.string(),
  choices: z.array(z.string()).optional(),
  answer: z.string(),
  skill: z.enum(["vocab", "grammar", "reading", "writing", "listening", "speaking"]),
  difficulty: z.coerce.number().int().min(1).max(5),
});

const ResponseSchema = z.object({
  questions: z.array(QuestionSchema).min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cefr = body?.cefr || "B1";
    const count = Math.min(Number(body?.count) || 10, 30);
    const skill = body?.skill || "mixed";

    const prompt = `Generate ${count} English ${skill} questions for CEFR ${cefr} level.
Mix of MCQ and fill-in types. Each MCQ needs exactly 4 choices.

Return JSON: {"questions": [{id, type, prompt, choices?, answer, skill, difficulty}]}`;

    const result = await generateJSON(prompt, ResponseSchema, "You are an English teacher.");

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || "Generation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (e: any) {
    console.error("Generate API error:", e);
    return NextResponse.json(
      { error: "Server error", details: e?.message },
      { status: 500 }
    );
  }
}
