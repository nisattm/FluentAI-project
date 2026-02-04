/**
 * Level Up Analysis API - Weakness Analysis
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJSON } from "@/lib/vertex-ai";

export const runtime = "nodejs";

const AnalysisSchema = z.object({
  passed: z.boolean(),
  score: z.coerce.number().min(0).max(100),
  breakdown: z.object({
    grammar: z.coerce.number(),
    vocabulary: z.coerce.number(),
    reading: z.coerce.number(),
    listening: z.coerce.number(),
  }),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.string()),
  feedback: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const results = body?.results || []; // Array of {category, correct: boolean}
    const targetLevel = body?.targetLevel || "B2";

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: "Results array required" },
        { status: 400 }
      );
    }

    // Calculate scores by category
    const categoryScores: Record<string, { correct: number; total: number }> = {
      grammar: { correct: 0, total: 0 },
      vocabulary: { correct: 0, total: 0 },
      reading: { correct: 0, total: 0 },
      listening: { correct: 0, total: 0 },
    };

    results.forEach((r: any) => {
      const cat = r.category || "grammar";
      if (categoryScores[cat]) {
        categoryScores[cat].total++;
        if (r.correct) {
          categoryScores[cat].correct++;
        }
      }
    });

    const totalCorrect = results.filter((r: any) => r.correct).length;
    const totalQuestions = results.length;
    const overallScore = Math.round((totalCorrect / totalQuestions) * 100);
    const passed = overallScore >= 80;

    // Build breakdown
    const breakdown = {
      grammar: categoryScores.grammar.total > 0
        ? Math.round((categoryScores.grammar.correct / categoryScores.grammar.total) * 100)
        : 0,
      vocabulary: categoryScores.vocabulary.total > 0
        ? Math.round((categoryScores.vocabulary.correct / categoryScores.vocabulary.total) * 100)
        : 0,
      reading: categoryScores.reading.total > 0
        ? Math.round((categoryScores.reading.correct / categoryScores.reading.total) * 100)
        : 0,
      listening: categoryScores.listening.total > 0
        ? Math.round((categoryScores.listening.correct / categoryScores.listening.total) * 100)
        : 0,
    };

    const prompt = `Analyze this Level-Up exam result for ${targetLevel} level:

OVERALL SCORE: ${overallScore}% (${totalCorrect}/${totalQuestions})
PASS THRESHOLD: 80%
RESULT: ${passed ? "PASSED" : "FAILED"}

CATEGORY BREAKDOWN:
- Grammar: ${breakdown.grammar}% (${categoryScores.grammar.correct}/${categoryScores.grammar.total})
- Vocabulary: ${breakdown.vocabulary}% (${categoryScores.vocabulary.correct}/${categoryScores.vocabulary.total})
- Reading: ${breakdown.reading}% (${categoryScores.reading.correct}/${categoryScores.reading.total})
- Listening: ${breakdown.listening}% (${categoryScores.listening.correct}/${categoryScores.listening.total})

Provide detailed analysis:

JSON FORMAT:
{
  "passed": ${passed},
  "score": ${overallScore},
  "breakdown": {
    "grammar": ${breakdown.grammar},
    "vocabulary": ${breakdown.vocabulary},
    "reading": ${breakdown.reading},
    "listening": ${breakdown.listening}
  },
  "weaknesses": [
    "Specific weakness 1",
    "Specific weakness 2",
    "Specific weakness 3"
  ],
  "recommendations": [
    "Practice recommendation 1",
    "Practice recommendation 2",
    "Practice recommendation 3"
  ],
  "feedback": "${passed ? 'Congratulations! You demonstrated strong mastery...' : 'You showed good effort, but need more practice in...'}"
}

RULES:
1. Identify weaknesses based on categories scoring <70%
2. Provide specific, actionable recommendations
3. Be encouraging but honest
4. Focus on what to improve
5. Return ONLY valid JSON`;

    const systemInstruction = `You are an English language assessment expert.
Analyze exam performance and provide constructive feedback.
Identify specific areas for improvement.
Give practical study recommendations.
Return ONLY valid JSON.`;

    const result = await generateJSON(prompt, AnalysisSchema, systemInstruction);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || "Analysis failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (e: any) {
    console.error("Analysis error:", e);
    return NextResponse.json(
      { error: "Server error", details: e?.message },
      { status: 500 }
    );
  }
}
