/**
 * AI Tutor Chat API
 * Using Google Cloud Vertex AI
 */

import { NextResponse } from "next/server";
import { generateText } from "@/lib/vertex-ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body?.message || "";
    const cefr = body?.cefr || "B1";
    const history = body?.conversationHistory || [];

    if (!message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Build conversation context
    let contextPrompt = message;
    if (history.length > 0) {
      const historyText = history
        .slice(-5) // Last 5 messages
        .map((h: any) => `${h.role === "user" ? "Student" : "Tutor"}: ${h.content}`)
        .join("\n");
      contextPrompt = `${historyText}\nStudent: ${message}`;
    }

    const systemInstruction = `You are a friendly English tutor helping a CEFR ${cefr} level student.
- Answer in simple, clear language appropriate for their level
- Be encouraging and supportive
- Explain grammar and vocabulary when needed
- Give examples
- Keep responses concise (2-3 sentences max)`;

    const result = await generateText({
      prompt: contextPrompt,
      systemInstruction,
      temperature: 0.8,
      maxTokens: 500,
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || "Failed to generate response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      response: result.data,
      usage: result.usage,
    });
  } catch (e: any) {
    console.error("Tutor chat error:", e);
    return NextResponse.json(
      { error: "Server error", details: e?.message },
      { status: 500 }
    );
  }
}
