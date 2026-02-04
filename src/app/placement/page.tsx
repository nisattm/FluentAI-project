"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  loadUser,
  patchUser,
  type CEFR,
  type Skill,
  type PracticeQuestion,
} from "@/lib/store";

type PracticeResult = { correct: boolean };

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function asSkill(v: any): Skill {
  const s = String(v);
  if (
    s === "vocab" ||
    s === "grammar" ||
    s === "reading" ||
    s === "writing" ||
    s === "listening" ||
    s === "speaking"
  )
    return s as Skill;
  return "vocab";
}

function toStringArray(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x));
}

function normalizeQuestion(q: any): PracticeQuestion & { cefrLevel?: string; difficulty?: number } {
  const id = String(q?.id ?? uid());
  const prompt = String(q?.prompt ?? q?.question ?? "");
  const explanation = q?.explanation ? String(q.explanation) : undefined;
  const skill = asSkill(q?.skillTag ?? q?.skill ?? q?.topic);
  const rawType = String(q?.type ?? "mcq").toLowerCase();
  
  // Preserve CEFR level and difficulty for evaluation
  const cefrLevel = q?.cefrLevel || q?.cefrBand;
  const difficulty = q?.difficulty ? Number(q.difficulty) : undefined;

  if (rawType === "mcq") {
    const choices = toStringArray(q?.choices).length > 0
      ? toStringArray(q?.choices)
      : ["A", "B", "C", "D"];

    const fixedChoices = choices.slice(0, 4);
    
    let answerIndex = Number(q?.answerIndex);
    if (!Number.isFinite(answerIndex) || answerIndex < 0) {
      const ans = String(q?.answer ?? "").trim();
      const found = fixedChoices.findIndex(
        (c) => c.toLowerCase() === ans.toLowerCase()
      );
      answerIndex = found >= 0 ? found : 0;
    }

    return {
      id,
      type: "mcq",
      prompt,
      choices: fixedChoices,
      answerIndex,
      explanation,
      skill,
      cefrLevel,
      difficulty,
    } as any;
  }

  const answer = String(q?.answer ?? q?.answerText ?? "").trim();

  return {
    id,
    type: "typing",
    prompt,
    answer,
    explanation,
    skill,
    cefrLevel,
    difficulty,
  } as any;
}

// Legacy function - now using advanced placement evaluation API
function mapScoreToCefr(pct: number): CEFR {
  if (pct >= 85) return "C1";
  if (pct >= 70) return "B2";
  if (pct >= 55) return "B1";
  if (pct >= 40) return "A2";
  return "A1";
}

interface PlacementAnswer {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  cefrLevel: string;
  difficulty: number;
}

export default function PlacementPage() {
  const [loading, setLoading] = useState(false);
  const [qs, setQs] = useState<PracticeQuestion[]>([]);
  const [idx, setIdx] = useState(0);

  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [results, setResults] = useState<Record<string, PracticeResult>>({});
  const [showExplain, setShowExplain] = useState(false);

  const current = qs[idx];

  useEffect(() => {
    const u = loadUser();
    if (!u.isAuthed) {
      window.location.href = "/login";
      return;
    }
    if (qs.length === 0) {
      void generatePlacement();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAnswered = useMemo(() => {
    if (!current) return false;
    return results[current.id] != null;
  }, [current, results]);

  const score = useMemo(() => {
    const arr = Object.values(results);
    const correct = arr.filter((r) => r.correct).length;
    return { correct, total: arr.length };
  }, [results]);

  const pct = useMemo(() => {
    if (qs.length === 0) return 0;
    return Math.round((score.correct / qs.length) * 100);
  }, [score.correct, qs.length]);

  async function generatePlacement() {
    setLoading(true);
    setShowExplain(false);
    setResults({});
    setIdx(0);
    setPicked(null);
    setTyped("");

    try {
      const u = loadUser();
      
      const res = await fetch("/api/placement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            cefr: u.cefr,
          },
        }),
      });

      const data = await res.json().catch(() => null);
      
      if (!res.ok) {
        console.error("Placement API error:", data?.error);
        throw new Error(data?.error ?? `API error ${res.status}`);
      }

      const raw = (data?.questions ?? []) as any[];
      
      if (raw.length === 0) {
        throw new Error("No questions returned from AI");
      }

      const built = raw.map(normalizeQuestion);
      setQs(built);
      
    } catch (error) {
      console.error("Failed to generate placement test:", error);
      alert("AI soru oluşturulamadı. Lütfen tekrar deneyin veya sayfayı yenileyin.");
      setLoading(false);
      return;
    }
    
    setLoading(false);
  }

  function answerMCQ(choiceIndex: number) {
    if (!current || current.type !== "mcq") return;
    if (isAnswered) return;

    const correct = choiceIndex === current.answerIndex;

    setPicked(choiceIndex);
    setResults((prev) => ({ ...prev, [current.id]: { correct } }));
    setShowExplain(true);
  }

  function answerTyping() {
    if (!current || current.type !== "typing") return;
    if (isAnswered) return;

    const ua = typed.trim().toLowerCase();
    const ca = (current.answer ?? "").trim().toLowerCase();
    const correct = ua === ca;

    setResults((prev) => ({ ...prev, [current.id]: { correct } }));
    setShowExplain(true);
  }

  function nextQ() {
    setShowExplain(false);
    setPicked(null);
    setTyped("");
    if (idx + 1 < qs.length) setIdx((x) => x + 1);
  }

  async function finish() {
    if (Object.keys(results).length < qs.length) return;

    try {
      setLoading(true);

      // Build answers array for evaluation API
      const answers: PlacementAnswer[] = qs.map((q: any) => {
        const result = results[q.id];
        const isCorrect = result?.correct || false;

        // Get correct answer from question
        let correctAnswer = "";
        if (q.type === "mcq") {
          correctAnswer = q.choices[q.answerIndex];
        } else {
          correctAnswer = q.answer;
        }

        return {
          questionId: q.id,
          userAnswer: isCorrect ? correctAnswer : "wrong", // Simplified - we only need correct/incorrect
          correctAnswer,
          isCorrect,
          cefrLevel: q.cefrLevel || "B1",
          difficulty: q.difficulty || 5,
        };
      });

      // Call evaluation API
      const res = await fetch("/api/placement/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) {
        throw new Error("Evaluation failed");
      }

      const evaluation = await res.json();

      // Update user with determined level
      patchUser({
        cefr: evaluation.level,
        lastPlacement: { 
          cefr: evaluation.level, 
          targetSkill: "vocab" as Skill, 
          score: evaluation.score 
        },
      } as any);

      // Show results or redirect
      alert(`Your English level: ${evaluation.level}\n\nScore: ${evaluation.score}%\n\n${evaluation.reasoning}\n\nRecommendations:\n${evaluation.recommendations.slice(0, 3).join("\n")}`);

      window.location.href = "/dashboard";

    } catch (error: any) {
      console.error("Placement finish error:", error);
      // Fallback to old method
      const cefr = mapScoreToCefr(pct);
      patchUser({
        cefr,
        lastPlacement: { cefr, targetSkill: "vocab" as Skill, score: pct },
      } as any);
      window.location.href = "/dashboard";
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-cyan-600/20 to-blue-600/20 blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-600/20 blur-[80px] animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-400 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-cyan-500/25 transition-transform group-hover:scale-105">
              F
            </div>
            <span className="text-lg font-bold text-white">FluentAI</span>
          </Link>
          
          <button
            onClick={generatePlacement}
            disabled={loading}
            className={`px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white/70 font-medium hover:bg-white/[0.1] transition ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            🔁 {loading ? "Generating..." : "New Test"}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-3xl">
          {/* Card */}
          <div className="relative animate-scale-in">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 rounded-3xl blur opacity-20" />
            <div className="relative p-6 sm:p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
                  <span>🧭</span>
                  <span className="text-sm font-medium text-cyan-400">AI Placement Test</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
                  General Level Assessment
                </h1>
                <p className="text-white/60 text-sm">
                  30 AI-generated questions • Mixed difficulty • Auto CEFR result
                </p>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="text-sm text-white/60">
                  Progress: <span className="text-white font-bold">{Math.min(idx + 1, qs.length)}/{qs.length || "30"}</span>
                </div>
                <div className="text-sm text-white/60">
                  Score: <span className="text-white font-bold">{score.correct}/{qs.length} ({pct}%)</span>
                </div>
              </div>

              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: qs.length ? `${Math.round(((idx + 1) / qs.length) * 100)}%` : "0%" }}
                />
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                  </div>
                  <p className="text-white/70">AI is generating 30 challenging questions...</p>
                </div>
              )}

              {/* No Questions */}
              {!loading && !current && qs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-white/60">Ready! Click "New Test" to begin.</p>
                </div>
              )}

              {/* Question */}
              {!loading && current && (
                <div className="space-y-6">
                  {/* Question Type Badge */}
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-medium text-white/70 uppercase">
                      {current.type === "mcq" ? "Multiple Choice" : "Fill in"}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-400">
                      {current.skill ?? "vocab"}
                    </span>
                  </div>

                  {/* Question Prompt */}
                  <div className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                    {current.prompt}
                  </div>

                  {/* MCQ Options */}
                  {current.type === "mcq" && (
                    <div className="grid gap-3">
                      {current.choices.map((c, i) => {
                        const answered = results[current.id];
                        const isCorrect = i === current.answerIndex;
                        const chosen = picked === i;

                        let className = "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ";
                        
                        if (answered != null) {
                          if (isCorrect) {
                            className += "bg-emerald-500/10 border-emerald-500/50 text-white";
                          } else if (chosen) {
                            className += "bg-red-500/10 border-red-500/50 text-white";
                          } else {
                            className += "bg-white/[0.02] border-white/5 text-white/50";
                          }
                        } else {
                          className += "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20 text-white cursor-pointer";
                        }

                        return (
                          <button
                            key={i}
                            onClick={() => answerMCQ(i)}
                            disabled={isAnswered}
                            className={className}
                          >
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                              answered != null
                                ? isCorrect
                                  ? "bg-emerald-500 text-white"
                                  : chosen
                                    ? "bg-red-500 text-white"
                                    : "bg-white/10 text-white/50"
                                : "bg-white/10 text-white/70"
                            }`}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="flex-1 font-medium">{c}</span>
                            {answered != null && isCorrect && (
                              <span className="text-emerald-400">✓</span>
                            )}
                            {answered != null && chosen && !isCorrect && (
                              <span className="text-red-400">✗</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Typing Input */}
                  {current.type === "typing" && (
                    <div className="space-y-4">
                      <input
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        disabled={isAnswered}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition"
                        placeholder="Type your answer..."
                        autoFocus
                      />
                      <button
                        onClick={answerTyping}
                        disabled={isAnswered || typed.trim().length === 0}
                        className={`px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-500 text-white font-bold transition ${
                          isAnswered || typed.trim().length === 0 ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
                        }`}
                      >
                        Check Answer
                      </button>
                    </div>
                  )}

                  {/* Explanation */}
                  {showExplain && (
                    <div className={`p-4 rounded-xl border animate-scale-in ${
                      results[current.id]?.correct
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-red-500/10 border-red-500/30"
                    }`}>
                      <div className={`font-bold text-lg mb-2 ${
                        results[current.id]?.correct ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {results[current.id]?.correct ? "✅ Correct!" : "❌ Incorrect"}
                      </div>

                      <div className="text-white/80">
                        <span className="font-medium">Answer: </span>
                        <span className="text-emerald-400 font-bold">
                          {current.type === "mcq" ? current.choices[current.answerIndex] : current.answer}
                        </span>
                      </div>

                      {current.explanation && (
                        <div className="mt-3 text-sm text-white/60 leading-relaxed">
                          {current.explanation}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between gap-4 pt-4">
                    <button
                      onClick={() => (window.location.href = "/welcome/proficiency")}
                      className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white/70 font-medium hover:bg-white/[0.1] transition"
                    >
                      ← Back
                    </button>

                    {idx + 1 < qs.length ? (
                      <button
                        onClick={nextQ}
                        disabled={!isAnswered}
                        className={`relative group ${!isAnswered ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className={`absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur transition ${isAnswered ? "opacity-60 group-hover:opacity-100" : "opacity-0"}`} />
                        <div className="relative px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-500 text-white font-bold flex items-center gap-2">
                          Next
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </button>
                    ) : (
                      <button
                        onClick={finish}
                        disabled={Object.keys(results).length < qs.length}
                        className={`relative group ${Object.keys(results).length < qs.length ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className={`absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur transition ${Object.keys(results).length >= qs.length ? "opacity-60 group-hover:opacity-100" : "opacity-0"}`} />
                        <div className="relative px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-500 text-white font-bold flex items-center gap-2">
                          See Results
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
