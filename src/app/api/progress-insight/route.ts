/**
 * AI Progress Insight API - Personalized coaching advice
 * Using Google Cloud Vertex AI (Gemini 2.0 Flash)
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJSON } from "@/lib/vertex-ai";

export const runtime = "nodejs";

const InsightSchema = z.object({
  insight: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cefr = body?.cefr || "B1";
    const streak = body?.streak || 0;
    const mastery = body?.mastery || {};
    const recentHistory = body?.recentHistory || [];

    // Analyze mastery scores
    const masteryAnalysis = Object.entries(mastery)
      .map(([skill, score]) => `${skill}: ${Math.round(Number(score) * 100)}%`)
      .join(", ");

    // Analyze recent activity
    const activityCount = recentHistory.length;
    const avgScore = activityCount > 0
      ? Math.round(
          recentHistory.reduce((acc: number, h: any) => {
            const score = h.total > 0 ? (h.correct / h.total) * 100 : 0;
            return acc + score;
          }, 0) / activityCount
        )
      : 0;

    // Find weakest and strongest skills
    const sortedSkills = Object.entries(mastery)
      .map(([skill, score]) => ({ skill, score: Number(score) }))
      .sort((a, b) => a.score - b.score);

    const weakestSkill = sortedSkills[0]?.skill || "vocabulary";
    const strongestSkill = sortedSkills[sortedSkills.length - 1]?.skill || "grammar";

    const prompt = `Generate a single, personalized motivational coaching insight for an English learner.

LEARNER DATA:
- Current Level: ${cefr}
- Daily Streak: ${streak} days
- Skill Mastery: ${masteryAnalysis || "Not enough data"}
- Recent Sessions: ${activityCount} activities with ${avgScore}% average score
- Weakest Skill: ${weakestSkill}
- Strongest Skill: ${strongestSkill}

RULES:
1. Write ONE sentence only (max 30 words)
2. Be motivational but specific
3. Reference their actual data (streak, weak skill, strong skill)
4. Give actionable advice
5. Use encouraging tone

EXAMPLES:
- "Your ${strongestSkill} is improving fast! Try spending 10 more minutes on ${weakestSkill} to balance your skills."
- "Amazing ${streak}-day streak! Focus on ${weakestSkill} practice to reach the next level."
- "Your scores are rising! Add more ${weakestSkill} exercises to your daily routine."

JSON FORMAT:
{
  "insight": "Your single motivational sentence here."
}

Return ONLY valid JSON.`;

    const systemInstruction = `You are an encouraging English learning coach.
Give personalized, data-driven advice in a friendly tone.
Keep it brief and actionable.
Return ONLY valid JSON.`;

    const result = await generateJSON(prompt, InsightSchema, systemInstruction);

    if (!result.success || !result.data) {
      // Fallback insight
      return NextResponse.json({
        insight: `Great ${streak}-day streak! Focus on ${weakestSkill} to level up faster.`,
      });
    }

    return NextResponse.json(result.data);
  } catch (e: any) {
    console.error("Progress insight error:", e);
    return NextResponse.json({
      insight: "Keep practicing daily to improve your English skills!",
    });
  }
}
