/**
 * AI Story Generator API - CEFR-based Reading Stories
 * Using Google Cloud Vertex AI
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJSON } from "@/lib/vertex-ai";

export const runtime = "nodejs";

const VocabularyItemSchema = z.object({
  word: z.string(),
  turkish: z.string(),
  definition: z.string(),
});

const QuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.coerce.number().int().min(0).max(3),
});

const StorySchema = z.object({
  title: z.string(),
  content: z.string(),
  vocabulary: z.array(VocabularyItemSchema).min(5),
  questions: z.array(QuestionSchema).length(5),
  wordCount: z.coerce.number().int(),
});

const LEVEL_SPECS = {
  A1: {
    wordCount: "100-150",
    complexity: "very simple present tense, basic daily topics (family, food, home)",
    vocabulary: "common everyday words only",
    sentences: "short and simple (5-8 words per sentence)",
  },
  A2: {
    wordCount: "150-200",
    complexity: "simple past and future, personal experiences and routines",
    vocabulary: "basic vocabulary with some descriptive words",
    sentences: "simple sentences with occasional conjunctions",
  },
  B1: {
    wordCount: "250-350",
    complexity: "past, present, future with some modal verbs, narratives and opinions",
    vocabulary: "intermediate vocabulary, some idiomatic expressions",
    sentences: "mix of simple and compound sentences",
  },
  B2: {
    wordCount: "350-450",
    complexity: "complex tenses, passive voice, conditional structures, abstract topics",
    vocabulary: "rich vocabulary with nuanced meanings",
    sentences: "complex sentences with multiple clauses",
  },
  C1: {
    wordCount: "450-550",
    complexity: "advanced structures, subjunctive, subtle meanings, academic/professional topics",
    vocabulary: "sophisticated vocabulary, idiomatic expressions, collocations",
    sentences: "varied and complex sentence structures",
  },
  C2: {
    wordCount: "550-700",
    complexity: "native-like fluency, nuanced expressions, philosophical/literary themes",
    vocabulary: "extensive vocabulary with rare words and expressions",
    sentences: "highly sophisticated structures with embedded clauses",
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cefr = (body?.cefr || "B1") as keyof typeof LEVEL_SPECS;
    const topic = body?.topic || "general";

    const specs = LEVEL_SPECS[cefr] || LEVEL_SPECS.B1;

    const prompt = `Generate an original English reading story for CEFR level ${cefr}.

REQUIREMENTS:
- Topic: ${topic === "general" ? "Choose an interesting topic appropriate for this level" : topic}
- Word count: ${specs.wordCount} words
- Language complexity: ${specs.complexity}
- Vocabulary level: ${specs.vocabulary}
- Sentence structure: ${specs.sentences}

STORY STRUCTURE:
1. Title: Engaging and relevant
2. Content: A complete story with beginning, middle, and end
3. Vocabulary: Extract 8-12 key words from the story that learners should know
   - For each word: provide Turkish translation and short English definition
   - Choose words that are challenging but appropriate for ${cefr} level
4. Questions: 5 reading comprehension questions (multiple choice, 4 options each)
   - Test understanding of main idea, details, inference, and vocabulary
   - Mark the correct answer (0-3 index)

JSON FORMAT:
{
  "title": "Story Title",
  "content": "The complete story text...",
  "vocabulary": [
    {
      "word": "example",
      "turkish": "örnek",
      "definition": "a thing used to illustrate a point"
    }
  ],
  "questions": [
    {
      "question": "What is the main idea of the story?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0
    }
  ],
  "wordCount": 250
}

IMPORTANT:
- Write ORIGINAL content, not famous stories
- Match the exact CEFR level complexity
- Make questions meaningful, not too easy or too obvious
- Vocabulary should be useful and level-appropriate
- Return ONLY valid JSON`;

    const systemInstruction = `You are an expert English language content creator for ${cefr} level learners.
Create engaging, original stories that are pedagogically sound.
Ensure vocabulary and grammar match the CEFR level exactly.
Questions should test genuine comprehension.
Return ONLY valid JSON.`;

    const result = await generateJSON(prompt, StorySchema, systemInstruction);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || "Story generation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (e: any) {
    console.error("Story generation error:", e);
    return NextResponse.json(
      { error: "Server error", details: e?.message },
      { status: 500 }
    );
  }
}
