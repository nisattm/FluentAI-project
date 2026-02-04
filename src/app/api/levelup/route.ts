/**
 * Level Up Test API - Comprehensive Progression Exam
 * Using Google Cloud Vertex AI + TTS
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJSON } from "@/lib/vertex-ai";
import { synthesizeSpeech } from "@/lib/tts";

export const runtime = "nodejs";

const QuestionSchema = z.object({
  id: z.string(),
  category: z.enum(["grammar", "vocabulary", "reading", "listening"]),
  type: z.enum(["mcq", "fill"]),
  prompt: z.string(),
  passage: z.string().optional(),
  audioText: z.string().optional(),
  choices: z.array(z.string()).length(4).optional(),
  answer: z.string(),
  explanation: z.string(),
  difficulty: z.coerce.number().int().min(1).max(10),
});

const LevelUpSchema = z.object({
  title: z.string(),
  targetLevel: z.string(),
  questions: z.array(QuestionSchema).length(20),
});

const LEVEL_PROGRESSION: Record<string, string> = {
  A1: "A2",
  A2: "B1",
  B1: "B2",
  B2: "C1",
  C1: "C2",
};

const LEVEL_SPECS: Record<string, string> = {
  A2: "Simple past/future tenses, basic phrasal verbs, everyday vocabulary (300-500 words)",
  B1: "Present perfect, conditionals (1st/2nd), intermediate vocabulary, simple connectors",
  B2: "Passive voice, complex conditionals, modal verbs, academic vocabulary, discourse markers",
  C1: "Advanced grammar (subjunctive, inversion), sophisticated vocabulary, idiomatic expressions, complex discourse",
  C2: "Native-like mastery, nuanced expressions, rare vocabulary, philosophical/literary language",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const currentCefr = body?.cefr || "B1";
    const targetCefr = LEVEL_PROGRESSION[currentCefr] || "B2";

    const specs = LEVEL_SPECS[targetCefr] || LEVEL_SPECS.B1;

    const prompt = `Generate a comprehensive Level-Up Exam from ${currentCefr} to ${targetCefr}.

TARGET LEVEL REQUIREMENTS:
${specs}

EXAM STRUCTURE (20 questions total):

1. GRAMMAR (5 questions):
   - Test the most challenging grammar structures of ${targetCefr}
   - Mix of MCQ (4 choices) and fill-in-the-blank
   - Examples: conditionals, passive voice, advanced tenses
   - Focus on structures students often struggle with

2. VOCABULARY (5 questions):
   - Advanced vocabulary appropriate for ${targetCefr}
   - Academic and professional words
   - Collocations and idiomatic expressions
   - Test understanding in context

3. READING (5 questions):
   - Provide ONE paragraph (150-200 words) at ${targetCefr} difficulty
   - 5 comprehension questions about the passage
   - Test: main idea, details, inference, vocabulary in context
   - All questions reference the same passage

4. LISTENING (5 questions):
   - Generate 5 different sentences/short texts for audio
   - Each will be converted to speech
   - Questions test comprehension of what was heard
   - Progressive difficulty (easier to harder)

JSON FORMAT:
{
  "title": "Level Up: ${currentCefr} → ${targetCefr}",
  "targetLevel": "${targetCefr}",
  "questions": [
    {
      "id": "grammar_1",
      "category": "grammar",
      "type": "mcq",
      "prompt": "Complete the sentence: If I ___ earlier, I wouldn't have missed the train.",
      "choices": ["knew", "had known", "know", "have known"],
      "answer": "had known",
      "explanation": "Third conditional uses 'had + past participle' in the if-clause.",
      "difficulty": 7
    },
    {
      "id": "vocabulary_1",
      "category": "vocabulary",
      "type": "mcq",
      "prompt": "The company's new policy will ___ significant changes in workflow.",
      "choices": ["effect", "affect", "implement", "instigate"],
      "answer": "instigate",
      "explanation": "'Instigate' means to cause or bring about, fitting the context.",
      "difficulty": 8
    },
    {
      "id": "reading_1",
      "category": "reading",
      "type": "mcq",
      "passage": "[The 150-200 word passage]",
      "prompt": "What is the main idea of the passage?",
      "choices": ["A", "B", "C", "D"],
      "answer": "B",
      "explanation": "The passage primarily discusses...",
      "difficulty": 7
    },
    {
      "id": "listening_1",
      "category": "listening",
      "type": "mcq",
      "audioText": "The conference has been postponed until next month due to unforeseen circumstances.",
      "prompt": "What happened to the conference?",
      "choices": ["It was cancelled", "It was moved to next month", "It happened yesterday", "It's happening today"],
      "answer": "It was moved to next month",
      "explanation": "Postponed means delayed, moved to a later date.",
      "difficulty": 6
    }
  ]
}

IMPORTANT RULES:
1. Exactly 20 questions (5 per category)
2. Reading: ALL 5 questions share ONE passage
3. Listening: audioText field must contain the sentence to be spoken
4. Difficulty: 6-10 (challenging questions only)
5. All MCQ must have exactly 4 choices
6. Fill-in type: answer is exact word/phrase expected
7. Return ONLY valid JSON`;

    const systemInstruction = `You are a Cambridge CEFR level assessment expert.
Create challenging questions that truly test if a student is ready for ${targetCefr}.
Questions must be pedagogically sound and match official CEFR criteria.
Provide clear explanations for learning.
Return ONLY valid JSON.`;

    console.log(`Generating level-up test: ${currentCefr} → ${targetCefr}`);

    const result = await generateJSON(prompt, LevelUpSchema, systemInstruction);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || "Level-up test generation failed" },
        { status: 500 }
      );
    }

    // Generate audio for listening questions
    const questionsWithAudio = await Promise.all(
      result.data.questions.map(async (q) => {
        if (q.category === "listening" && q.audioText) {
          try {
            const audioBase64 = await synthesizeSpeech({
              text: q.audioText,
              languageCode: "en-US",
              voiceName: "en-US-Neural2-J",
              speakingRate: 0.9,
            });
            return { ...q, audio: audioBase64 };
          } catch (error) {
            console.error(`Failed to generate audio for question ${q.id}:`, error);
            return { ...q, audio: "" };
          }
        }
        return q;
      })
    );

    return NextResponse.json({
      ...result.data,
      questions: questionsWithAudio,
    });
  } catch (e: any) {
    console.error("Level-up generation error:", e);
    return NextResponse.json(
      { error: "Server error", details: e?.message },
      { status: 500 }
    );
  }
}
