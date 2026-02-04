/**
 * Vocabulary Builder API - Flashcard Edition
 * Using Google Cloud Vertex AI
 * Generates 20 CEFR-appropriate words with full details
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJSON } from "@/lib/vertex-ai";

export const runtime = "nodejs";

const VocabSchema = z.object({
  words: z.array(
    z.object({
      word: z.string().min(2),
      type: z.enum(["noun", "verb", "adjective", "adverb"]),
      definition: z.string().min(10),
      example_sentence: z.string().min(10),
      turkish_translation: z.string().min(2),
    })
  ).length(20),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cefr = body?.cefr || "B1";

    const prompt = `Generate EXACTLY 20 English vocabulary words appropriate for CEFR ${cefr} level.

IMPORTANT RULES:
1. Words must match ${cefr} difficulty (not too easy, not too hard)
   - A1: Basic everyday words (house, book, run)
   - A2: Common words (comfortable, decide, prepare)
   - B1: Intermediate words (achieve, benefit, concern)
   - B2: Upper-intermediate (enhance, sustain, implement)
   - C1: Advanced (elucidate, procrastinate, meticulous)
   - C2: Sophisticated (recalcitrant, ubiquitous, ephemeral)

2. Mix word types: 50% nouns, 30% verbs, 15% adjectives, 5% adverbs

3. Each word must include:
   - word: the English word
   - type: "noun", "verb", "adjective", or "adverb"
   - definition: Clear English definition (1-2 sentences)
   - example_sentence: Natural example showing word usage
   - turkish_translation: Turkish meaning

JSON FORMAT:
{
  "words": [
    {
      "word": "sustain",
      "type": "verb",
      "definition": "To maintain or keep something going over time, especially at a steady or continuous level.",
      "example_sentence": "We need to sustain our efforts if we want to achieve long-term success.",
      "turkish_translation": "sürdürmek, devam ettirmek"
    },
    ... (19 more words)
  ]
}

Generate ALL 20 words with proper ${cefr} difficulty level.`;

    const systemInstruction = `You are an expert English vocabulary teacher specializing in CEFR-based learning.
Select words that are:
- Appropriate for ${cefr} level (neither too basic nor too advanced)
- Useful and practical for everyday communication
- Varied in type and usage
- Accompanied by clear definitions and natural examples

Return ONLY valid JSON - no markdown, no explanations.`;

    const result = await generateJSON(prompt, VocabSchema, systemInstruction);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || "Failed to generate vocabulary" },
        { status: 500 }
      );
    }

    // Log word types distribution for debugging
    const typeCounts = result.data.words.reduce((acc: any, w: any) => {
      acc[w.type] = (acc[w.type] || 0) + 1;
      return acc;
    }, {});
    console.log("[Vocab] Generated words by type:", typeCounts);

    return NextResponse.json(result.data);
  } catch (e: any) {
    console.error("Vocab API error:", e);
    return NextResponse.json(
      { error: "Server error", details: e?.message },
      { status: 500 }
    );
  }
}
