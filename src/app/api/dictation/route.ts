/**
 * Dictation Practice API - Generate sentence + audio
 * Using Google Cloud Vertex AI + TTS
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJSON } from "@/lib/vertex-ai";
import { synthesizeSpeech } from "@/lib/tts";

export const runtime = "nodejs";

const SentenceSchema = z.object({
  sentence: z.string(),
  difficulty: z.coerce.number().int().min(1).max(10),
  grammar_focus: z.string(),
  vocabulary_focus: z.array(z.string()),
});

const LEVEL_SPECS: Record<string, string> = {
  A1: "Very simple present tense, 5-7 words, basic everyday vocabulary (I have a cat, The book is blue)",
  A2: "Simple past/future, 8-10 words, personal experiences (I went to the store yesterday)",
  B1: "Mixed tenses, 10-15 words, opinions and narratives (I think we should visit the museum next week)",
  B2: "Complex structures, 15-20 words, abstract topics (The government has implemented new policies to address climate change)",
  C1: "Advanced structures, 20-25 words, academic/professional language (The research demonstrates that environmental factors significantly influence behavioral patterns)",
  C2: "Native-like fluency, 25-30 words, nuanced expressions (Contemporary discourse surrounding technological advancement necessitates careful consideration of ethical implications)",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cefr = body?.cefr || "B1";
    const category = body?.category || "general";

    const specs = LEVEL_SPECS[cefr] || LEVEL_SPECS.B1;

    const prompt = `Generate ONE English sentence for dictation practice at CEFR level ${cefr}.

REQUIREMENTS:
- Level: ${specs}
- Category: ${category === "general" ? "choose any appropriate topic" : category}
- Must be grammatically perfect
- Appropriate difficulty for ${cefr}
- Natural and realistic sentence

JSON FORMAT:
{
  "sentence": "The exact sentence to be dictated",
  "difficulty": 5,
  "grammar_focus": "present perfect tense",
  "vocabulary_focus": ["word1", "word2"]
}

IMPORTANT:
- Return ONLY valid JSON
- Sentence must be complete and natural
- Match CEFR level exactly`;

    const systemInstruction = `You are an English dictation expert.
Generate clear, natural sentences appropriate for ${cefr} level.
Sentences should be realistic and useful for language learners.
Return ONLY valid JSON.`;

    const result = await generateJSON(prompt, SentenceSchema, systemInstruction);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || "Sentence generation failed" },
        { status: 500 }
      );
    }

    // Generate audio using Google Cloud TTS
    let audioBase64 = "";
    
    try {
      audioBase64 = await synthesizeSpeech({
        text: result.data.sentence,
        languageCode: "en-US",
        voiceName: "en-US-Neural2-J",
        speakingRate: cefr === "A1" || cefr === "A2" ? 0.85 : 0.9,
      });
    } catch (ttsError: any) {
      console.error("TTS generation failed:", ttsError);
      
      // Check if TTS API is enabled
      if (ttsError.message?.includes("Text-to-Speech API has not been used") || 
          ttsError.message?.includes("API has not been enabled")) {
        return NextResponse.json({
          error: "Text-to-Speech API not enabled",
          details: "Please enable the Cloud Text-to-Speech API in your Google Cloud Console: https://console.cloud.google.com/apis/library/texttospeech.googleapis.com",
          sentence: result.data.sentence,
        }, { status: 503 });
      }
      
      throw ttsError;
    }

    return NextResponse.json({
      sentence: result.data.sentence,
      audio: audioBase64,
      difficulty: result.data.difficulty,
      grammarFocus: result.data.grammar_focus,
      vocabularyFocus: result.data.vocabulary_focus,
    });
  } catch (e: any) {
    console.error("Dictation generation error:", e);
    return NextResponse.json(
      { error: "Server error", details: e?.message },
      { status: 500 }
    );
  }
}
