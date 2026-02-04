/**
 * Placement Test Evaluation API
 * Determines CEFR level based on test results
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluatePlacementTest, getRecommendations, getLevelDescription } from "@/lib/placement-evaluator";

export const runtime = "nodejs";

const AnswerSchema = z.object({
  questionId: z.string(),
  userAnswer: z.string(),
  correctAnswer: z.string(),
  isCorrect: z.boolean(),
  cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  difficulty: z.coerce.number(),
});

const EvaluateRequestSchema = z.object({
  answers: z.array(AnswerSchema).min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate request
    const validation = EvaluateRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Invalid request format",
          details: validation.error.issues[0]?.message 
        },
        { status: 400 }
      );
    }

    const { answers } = validation.data;

    // Evaluate the test
    const result = evaluatePlacementTest(answers);

    // Get recommendations
    const recommendations = getRecommendations(result);

    // Get level description
    const levelDescription = getLevelDescription(result.determinedLevel);

    // Build response
    const response = {
      level: result.determinedLevel,
      score: result.score,
      totalQuestions: result.totalQuestions,
      correctAnswers: answers.filter(a => a.isCorrect).length,
      confidence: result.confidence,
      reasoning: result.reasoning,
      levelDescription,
      recommendations,
      breakdown: {
        A1: result.correctByLevel.A1,
        A2: result.correctByLevel.A2,
        B1: result.correctByLevel.B1,
        B2: result.correctByLevel.B2,
        C1: result.correctByLevel.C1,
        C2: result.correctByLevel.C2,
      },
      highestCorrectLevel: result.highestCorrectLevel,
    };

    console.log("[Placement Evaluation]", {
      determinedLevel: result.determinedLevel,
      score: result.score,
      confidence: result.confidence,
    });

    return NextResponse.json(response);

  } catch (e: any) {
    console.error("Placement evaluation error:", e);
    return NextResponse.json(
      { error: "Evaluation failed", details: e?.message },
      { status: 500 }
    );
  }
}
