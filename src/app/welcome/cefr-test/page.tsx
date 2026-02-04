"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadUser, patchUser, type CEFR, type Skill, type PracticeQuestion } from "@/lib/store";

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

function normalizeQuestion(q: any): PracticeQuestion {
  const id = String(q?.id ?? uid());
  const prompt = String(q?.prompt ?? q?.question ?? "");
  const explanation = q?.explanation ? String(q.explanation) : undefined;
  const skill = asSkill(q?.skillTag ?? q?.skill);
  const rawType = String(q?.type ?? "mcq").toLowerCase();

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
    } as PracticeQuestion;
  }

  const answer = String(q?.answer ?? q?.answerText ?? "").trim();

  return {
    id,
    type: "typing",
    prompt,
    answer,
    explanation,
    skill,
  } as PracticeQuestion;
}

function readCefrFromQuery(): CEFR {
  if (typeof window === "undefined") return "A1";
  const p = new URLSearchParams(window.location.search);
  const v = (p.get("cefr") ?? "").toUpperCase();
  if (v === "A1" || v === "A2" || v === "B1" || v === "B2" || v === "C1") return v;
  return "A1";
}

export default function CefrTestPage() {
  const [cefr, setCefr] = useState<CEFR>("A1");
  const [loading, setLoading] = useState(false);

  const [qs, setQs] = useState<PracticeQuestion[]>([]);
  const [idx, setIdx] = useState(0);

  const current = qs[idx];

  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [answers, setAnswers] = useState<Record<string, { correct: boolean }>>({});
  const [showExplain, setShowExplain] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("AI is generating questions...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const u = loadUser();
    if (!u.isAuthed) window.location.href = "/login";

    const c = readCefrFromQuery();
    setCefr(c);

    void generateQuestions(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAnswered = useMemo(() => {
    if (!current) return false;
    return answers[current.id] != null;
  }, [answers, current]);

  const score = useMemo(() => {
    const arr = Object.values(answers);
    const correct = arr.filter((x) => x.correct).length;
    return { correct, total: arr.length };
  }, [answers]);

  const pct = useMemo(() => {
    if (qs.length === 0) return 0;
    return Math.round((score.correct / qs.length) * 100);
  }, [score.correct, qs.length]);

  async function generateQuestions(target: CEFR) {
    setLoading(true);
    setQs([]);
    setIdx(0);
    setPicked(null);
    setTyped("");
    setAnswers({});
    setShowExplain(false);
    setError(null);
    setLoadingMessage("AI is generating questions...");

    const MAX_CLIENT_RETRIES = 2;
    const RETRY_DELAY = 3000; // 3 seconds

    for (let attempt = 0; attempt <= MAX_CLIENT_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          setLoadingMessage(`Retrying... (attempt ${attempt + 1}/${MAX_CLIENT_RETRIES + 1})`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }

        const res = await fetch("/api/cefr-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetCefr: target,
          }),
        });

        const data = await res.json().catch(() => null);
        
        if (!res.ok) {
          const errorMsg = data?.error ?? `API error ${res.status}`;
          console.error(`CEFR test API error (attempt ${attempt + 1}):`, errorMsg);
          
          // Check if the error is retryable
          const isRetryable = data?.retryable || res.status >= 500;
          
          if (isRetryable && attempt < MAX_CLIENT_RETRIES) {
            console.log("Retryable error, will retry...");
            continue; // Try again
          }
          
          throw new Error(errorMsg);
        }

        const raw = (data?.questions ?? []) as any[];
        
        if (raw.length === 0) {
          if (attempt < MAX_CLIENT_RETRIES) {
            console.log("No questions returned, will retry...");
            continue;
          }
          throw new Error("No questions returned from AI");
        }

        const built = raw.map(normalizeQuestion);
        setQs(built);
        setError(null);
        setLoading(false);
        return; // Success!
        
      } catch (err: any) {
        console.error(`Failed to generate CEFR test (attempt ${attempt + 1}):`, err);
        
        if (attempt >= MAX_CLIENT_RETRIES) {
          setError(err.message || "AI soru oluşturulamadı. Lütfen tekrar deneyin.");
          setLoading(false);
          return;
        }
      }
    }
    
    setLoading(false);
  }

  function answerMCQ(choiceIndex: number) {
    if (!current || current.type !== "mcq") return;
    if (isAnswered) return;

    const correct = choiceIndex === current.answerIndex;

    setPicked(choiceIndex);
    setAnswers((p) => ({ ...p, [current.id]: { correct } }));
    setShowExplain(true);
  }

  function answerTyping() {
    if (!current || current.type !== "typing") return;
    if (isAnswered) return;

    const ua = typed.trim().toLowerCase();
    const ca = (current.answer ?? "").trim().toLowerCase();
    const correct = ua === ca;

    setAnswers((p) => ({ ...p, [current.id]: { correct } }));
    setShowExplain(true);
  }

  function nextQ() {
    setShowExplain(false);
    setPicked(null);
    setTyped("");
    if (idx + 1 < qs.length) setIdx((x) => x + 1);
  }

  function finish() {
    if (Object.keys(answers).length < qs.length) return;

    const correctCount = score.correct;
    const requiredCorrect = 9; // Need 9 out of 10 (90%)

    if (correctCount >= requiredCorrect) {
      // PASSED: User validated their level
      patchUser({
        cefr,
        lastPlacement: { cefr, targetSkill: "vocab", score: pct },
      } as any);

      alert(`✅ Level Validated!\n\nYou scored ${correctCount}/${qs.length} (${pct}%)\n\nYour ${cefr} level is confirmed. Welcome to the platform!`);
      window.location.href = "/dashboard";
      return;
    }

    // FAILED: Redirect to full placement test
    patchUser({
      knowsCefr: false,
      intendedCefr: cefr,
      lastPlacement: undefined,
    } as any);

    alert(`📊 Level Validation Incomplete\n\nYou scored ${correctCount}/${qs.length} (${pct}%)\n\n${cefr} level might be challenging for you right now. Let's take a comprehensive placement test to find your optimal starting level.`);
    window.location.href = "/placement";
  }

  return (
    <main className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-600/20 to-purple-600/20 blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-600/20 blur-[80px] animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-400 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
            F
          </div>
          <span className="text-lg font-bold text-white">FluentAI</span>
        </Link>
      </header>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-3xl">
          {/* Card */}
          <div className="relative animate-scale-in">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-20" />
            <div className="relative p-6 sm:p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                  <span>🧪</span>
                  <span className="text-sm font-medium text-indigo-400">AI Level Check</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
                  Level Validation: {cefr}
                </h1>
                <p className="text-white/60 text-sm">
                  10 questions • Need 9/10 correct (90%+) to confirm your level
                </p>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="text-sm text-white/60">
                  Progress: <span className="text-white font-bold">{Math.min(idx + 1, qs.length)}/{qs.length || "10"}</span>
                </div>
                <div className="text-sm text-white/60">
                  Score: <span className="text-white font-bold">{score.correct}/{qs.length || "10"} ({pct}%)</span>
                </div>
              </div>

              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: qs.length ? `${Math.round(((idx + 1) / qs.length) * 100)}%` : "0%" }}
                />
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                  </div>
                  <p className="text-white/70">{loadingMessage}</p>
                  <p className="text-white/50 text-sm mt-2">Generating 10 {cefr} level validation questions...</p>
                </div>
              )}

              {/* Error State */}
              {!loading && error && (
                <div className="text-center py-12 space-y-4">
                  <div className="text-5xl">⚠️</div>
                  <div className="text-rose-400 font-bold text-lg">
                    Failed to generate questions
                  </div>
                  <div className="text-white/50 text-sm max-w-md mx-auto">
                    {error}
                  </div>
                  <button
                    onClick={() => generateQuestions(cefr)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 text-white font-bold hover:opacity-90 transition"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* No Questions */}
              {!loading && !error && !current && (
                <div className="text-center py-12">
                  <p className="text-white/60">No questions available. Please refresh.</p>
                </div>
              )}

              {/* Question */}
              {!loading && !error && current && (
                <div className="space-y-6">
                  {/* Question Type Badge */}
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-medium text-white/70 uppercase">
                      {current.type === "mcq" ? "Multiple Choice" : "Fill in"}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
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
                        const answered = answers[current.id];
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
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition"
                        placeholder="Type your answer..."
                        autoFocus
                      />
                      <button
                        onClick={answerTyping}
                        disabled={isAnswered || typed.trim().length === 0}
                        className={`px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 text-white font-bold transition ${
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
                      answers[current.id]?.correct
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-red-500/10 border-red-500/30"
                    }`}>
                      <div className={`font-bold text-lg mb-2 ${
                        answers[current.id]?.correct ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {answers[current.id]?.correct ? "✅ Correct!" : "❌ Incorrect"}
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
                      onClick={() => (window.location.href = "/welcome/cefr")}
                      className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white/70 font-medium hover:bg-white/[0.1] transition"
                    >
                      ← Change level
                    </button>

                    {idx + 1 < qs.length ? (
                      <button
                        onClick={nextQ}
                        disabled={!isAnswered}
                        className={`relative group ${!isAnswered ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className={`absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur transition ${isAnswered ? "opacity-60 group-hover:opacity-100" : "opacity-0"}`} />
                        <div className="relative px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 text-white font-bold flex items-center gap-2">
                          Next
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </button>
                    ) : (
                      <button
                        onClick={finish}
                        disabled={Object.keys(answers).length < qs.length}
                        className={`relative group ${Object.keys(answers).length < qs.length ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className={`absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur transition ${Object.keys(answers).length >= qs.length ? "opacity-60 group-hover:opacity-100" : "opacity-0"}`} />
                        <div className="relative px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-500 text-white font-bold flex items-center gap-2">
                          Finish
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
