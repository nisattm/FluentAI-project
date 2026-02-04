import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJSON } from "@/lib/vertex-ai";

export const runtime = "nodejs";

const StudyPlanSchema = z.object({
  summary: z.string(),
  dailyGoal: z.string(),
  weeklyPlan: z.array(
    z.object({
      day: z.coerce.number(),
      focus: z.string(),
      duration: z.string(),
      activities: z.array(z.string()),
    })
  ),
  tips: z.array(z.string()),
  weakSkills: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const cefr = body?.cefr || body?.currentCefr || "A2";
  const target = body?.targetCefr || "B1";
  const minutes = body?.dailyMinutes || 30;

  const prompt = `Create a 7-day personalized English study plan.
Current CEFR: ${cefr}, Target: ${target}, Daily time: ${minutes} minutes

IMPORTANT: Return ONLY valid JSON with this EXACT structure:
{
  "summary": "Brief overview of the 7-day plan (2-3 sentences)",
  "dailyGoal": "Main daily goal summary",
  "weeklyPlan": [
    {"day": 1, "focus": "Day 1 focus (e.g., Grammar Basics)", "duration": "${minutes} min", "activities": ["activity 1", "activity 2", "activity 3"]},
    {"day": 2, "focus": "Day 2 focus", "duration": "${minutes} min", "activities": ["activity 1", "activity 2", "activity 3"]},
    {"day": 3, "focus": "Day 3 focus", "duration": "${minutes} min", "activities": ["activity 1", "activity 2", "activity 3"]},
    {"day": 4, "focus": "Day 4 focus", "duration": "${minutes} min", "activities": ["activity 1", "activity 2", "activity 3"]},
    {"day": 5, "focus": "Day 5 focus", "duration": "${minutes} min", "activities": ["activity 1", "activity 2", "activity 3"]},
    {"day": 6, "focus": "Day 6 focus", "duration": "${minutes} min", "activities": ["activity 1", "activity 2", "activity 3"]},
    {"day": 7, "focus": "Day 7 focus (Review)", "duration": "${minutes} min", "activities": ["activity 1", "activity 2", "activity 3"]}
  ],
  "tips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"],
  "weakSkills": ["vocab", "grammar"]
}

CRITICAL RULES:
- "day" must be NUMBER (1-7)
- Each day needs exactly 3 activities
- Provide exactly 5 practical study tips
- Focus should be specific (e.g., "Present Tense Practice", "Vocabulary Building")
- Generate all 7 days, no shortcuts!`;

  const systemInstruction = `You are an expert English language study planner.
Create realistic, achievable daily plans that help students progress from ${cefr} to ${target}.
Each day should have clear focus areas and specific, actionable activities.
Return ONLY valid JSON - no markdown, no explanations.`;

  const result = await generateJSON(prompt, StudyPlanSchema, systemInstruction);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data);
}
