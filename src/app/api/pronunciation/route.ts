import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJSON } from "@/lib/vertex-ai";

export const runtime = "nodejs";

const PronunciationSchema = z.object({
  score: z.coerce.number().min(0).max(100),
  feedback: z.string(),
  tips: z.array(z.string()),
});

export async function POST(req: Request) {
  const { transcript, expected, cefr } = await req.json();

  const prompt = `Compare student pronunciation:
Expected: "${expected}"
Student said: "${transcript}"

Provide pronunciation feedback for CEFR ${cefr} student.
Return: {score: 0-100, feedback, tips: []}`;

  const result = await generateJSON(prompt, PronunciationSchema, "You are a pronunciation coach.");

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data);
}
