/**
 * CEFR Placement Test Generator - Professional Edition
 * Using Google Cloud Vertex AI - Gemini 2.0 Flash
 * 30 Questions: A1-A2 (6), B1-B2 (10), C1 (10), C2 (4)
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJSON } from "@/lib/vertex-ai";

export const runtime = "nodejs";

const CEFR = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

const PlacementQuestionSchema = z.object({
  id: z.string().min(2),
  cefrLevel: CEFR,
  type: z.enum(["mcq", "fill"]),
  prompt: z.string().min(5),
  choices: z.array(z.string()).min(4).max(4).optional(),
  answer: z.string().min(1),
  topic: z.enum(["grammar", "vocabulary", "reading", "idioms", "academic"]),
  difficulty: z.coerce.number().int().min(1).max(10),
  explanation: z.string().optional(),
});

const PlacementSchema = z.object({
  title: z.string().min(3),
  objective: z.string().min(5),
  questions: z.array(PlacementQuestionSchema).length(30),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const prompt = `Generate a professional CEFR English placement test with EXACTLY 30 questions.

CRITICAL DISTRIBUTION (must follow exactly):
- Questions 1-3: A1 level (very basic: "I ___ a student", present simple, common words)
- Questions 4-6: A2 level (basic: past simple, basic phrases, everyday topics)
- Questions 7-11: B1 level (intermediate: present perfect, conditionals, connectors)
- Questions 12-16: B2 level (upper-intermediate: passive voice, reported speech, complex sentences)
- Questions 17-26: C1 level (advanced: subjunctive, inversions, idioms, nuanced vocabulary)
- Questions 27-30: C2 level (proficiency: subtle distinctions, collocations, academic register, rare idioms)

DIFFICULTY PROGRESSION:
- Questions must get progressively harder from 1 to 30
- difficulty field: 1-3 (A1-A2), 4-6 (B1-B2), 7-9 (C1), 10 (C2)
- Each level should feel distinctly harder than the previous

QUESTION TYPES (CRITICAL - use exact values):
- 70% type: "mcq" (multiple choice with EXACTLY 4 options in "choices" array)
- 30% type: "fill" (fill-in-the-blank, NO choices array)
- Topics: "grammar", "vocabulary", "reading", "idioms", "academic"
- NEVER use "multiple-choice", "fill-in", "text", or any other type value
- ONLY "mcq" or "fill" - these are the ONLY valid values

JSON FORMAT (COPY THIS STRUCTURE EXACTLY):
{
  "title": "CEFR English Placement Test",
  "objective": "Comprehensive English proficiency assessment (A1-C2)",
  "questions": [
    {
      "id": "q1",
      "cefrLevel": "A1",
      "type": "mcq",
      "prompt": "I ___ a teacher.",
      "choices": ["am", "is", "are", "be"],
      "answer": "am",
      "topic": "grammar",
      "difficulty": 1,
      "explanation": "Use 'am' with 'I'"
    },
    {
      "id": "q2",
      "cefrLevel": "A1",
      "type": "fill",
      "prompt": "She ___ to school every day. (go)",
      "answer": "goes",
      "topic": "grammar",
      "difficulty": 1,
      "explanation": "Third person singular adds -s"
    },
    {
      "id": "q10",
      "cefrLevel": "B1",
      "type": "mcq",
      "prompt": "If I ___ more time, I would travel the world.",
      "choices": ["have", "had", "will have", "would have"],
      "answer": "had",
      "topic": "grammar",
      "difficulty": 5,
      "explanation": "Second conditional uses 'if + past simple'"
    },
    {
      "id": "q15",
      "cefrLevel": "B2",
      "type": "fill",
      "prompt": "The report ___ by the committee yesterday. (complete)",
      "answer": "was completed",
      "topic": "grammar",
      "difficulty": 6,
      "explanation": "Passive voice in past simple"
    },
    {
      "id": "q20",
      "cefrLevel": "C1",
      "type": "mcq",
      "prompt": "Seldom ___ such a magnificent performance.",
      "choices": ["have I seen", "I have seen", "I saw", "did I saw"],
      "answer": "have I seen",
      "topic": "grammar",
      "difficulty": 8,
      "explanation": "Inversion after negative adverbs"
    },
    {
      "id": "q28",
      "cefrLevel": "C2",
      "type": "mcq",
      "prompt": "The data ___ a significant correlation between the variables.",
      "choices": ["evinces", "shows", "tells", "proves"],
      "answer": "evinces",
      "topic": "academic",
      "difficulty": 10,
      "explanation": "C2 academic vocabulary: 'evince' is more sophisticated"
    }
  ]
}

CRITICAL TYPE RULES:
- type must be EXACTLY "mcq" or "fill" (lowercase, no other variations)
- MCQ questions MUST have "choices" array with 4 strings
- FILL questions must NOT have "choices" array
- Generate exactly 21 MCQ and 9 FILL questions (total 30)

QUALITY STANDARDS:
- A1-A2: Simple sentences, common vocabulary
- B1-B2: Compound sentences, phrasal verbs, intermediate grammar
- C1: Complex structures, idioms, abstract concepts, collocations
- C2: Nuanced distinctions, academic register, rare vocabulary, stylistic awareness

Generate ALL 30 questions following this distribution. NO shortcuts!`;

    const systemInstruction = `You are a Cambridge/IELTS-certified English language assessment specialist.
You create professional CEFR placement tests used by language schools worldwide.

CRITICAL JSON RULES (MUST FOLLOW EXACTLY):
1. "type" field must be EXACTLY "mcq" or "fill" - NO OTHER VALUES ALLOWED
   - NOT "multiple-choice", "multiple_choice", "fill-in", "fill_in", "text", "short_answer"
   - ONLY "mcq" or "fill" (lowercase, exact spelling)
2. MCQ questions: must have "choices" array with exactly 4 strings
3. FILL questions: must NOT have "choices" field at all
4. "cefrLevel" must be one of: "A1", "A2", "B1", "B2", "C1", "C2"
5. "topic" must be one of: "grammar", "vocabulary", "reading", "idioms", "academic"
6. "difficulty" must be a number 1-10

CONTENT QUALITY RULES:
1. Questions 1-6 must be genuinely easy (A1-A2) - a beginner should get these right
2. Questions 7-16 must be intermediate (B1-B2) - require solid grammar knowledge
3. Questions 17-26 must be advanced (C1) - complex structures, idioms, nuanced vocabulary
4. Questions 27-30 must be proficiency (C2) - extremely challenging, subtle distinctions

Return ONLY valid JSON - no markdown, no code blocks, no explanations outside the JSON.`;

    const result = await generateJSON(prompt, PlacementSchema, systemInstruction);

    if (!result.success || !result.data) {
      // Debug: Log first question type to see what AI is sending
      try {
        const parsed = JSON.parse(result.rawText || "{}");
        const firstQuestionType = parsed?.questions?.[0]?.type;
        console.error("[Placement] AI sent type:", firstQuestionType, "Expected: 'mcq' or 'fill'");
      } catch (e) {
        console.error("[Placement] Could not parse AI response");
      }

      return NextResponse.json(
        { 
          error: result.error || "Failed to generate placement test",
          details: result.rawText?.substring(0, 300)
        },
        { status: 500 }
      );
    }

    // Validate question distribution
    const levelCounts: Record<string, number> = {
      A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0
    };

    for (const q of result.data.questions) {
      levelCounts[q.cefrLevel] = (levelCounts[q.cefrLevel] || 0) + 1;

      // Validate MCQ choices
      if (q.type === "mcq") {
        if (!q.choices || q.choices.length !== 4) {
          return NextResponse.json(
            { 
              error: `Question ${q.id}: MCQ must have exactly 4 choices`,
              badQuestion: q 
            },
            { status: 422 }
          );
        }
      }
    }

    // Ensure exactly 30 questions
    if (result.data.questions.length !== 30) {
      return NextResponse.json(
        { 
          error: `Expected 30 questions, got ${result.data.questions.length}`,
        },
        { status: 422 }
      );
    }

    // Log distribution for debugging
    console.log("[Placement] CEFR distribution:", levelCounts);

    return NextResponse.json(result.data);
    
  } catch (e: any) {
    console.error("Placement API error:", e);
    return NextResponse.json(
      { error: "Server error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
