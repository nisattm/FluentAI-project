"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  XP,
  loadUser,
  saveUser,
  needsLevelUp,
  type User,
  type Skill,
  type PracticeQuestion,
} from "@/lib/store";

type PracticeResult = { correct: boolean; userAnswer: string };

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

function getChoices(q: PracticeQuestion): string[] {
  if (q.type !== "mcq") return [];
  const anyQ = q as any;
  const c1 = Array.isArray(anyQ.choices) ? anyQ.choices : [];
  const c2 = Array.isArray(anyQ.choiceList) ? anyQ.choiceList : [];
  return (c1.length ? c1 : c2).map(String);
}

function getAnswerIndex(q: PracticeQuestion): number {
  if (q.type !== "mcq") return 0;
  const anyQ = q as any;
  const idx = Number(anyQ.answerIndex);
  if (Number.isFinite(idx)) return idx;
  const ans = String(anyQ.answer ?? "");
  const choices = getChoices(q);
  const found = choices.findIndex((c) => c.toLowerCase() === ans.toLowerCase());
  return found >= 0 ? found : 0;
}

function getTypingAnswer(q: PracticeQuestion): string {
  if (q.type !== "typing") return "";
  const anyQ = q as any;
  return String(anyQ.answer ?? anyQ.answerText ?? "").trim();
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
      : toStringArray(q?.options);

    const fixedChoices = choices.slice(0, 4);

    let answerIndex = Number(q?.answerIndex);
    if (!Number.isFinite(answerIndex) || answerIndex < 0) {
      const ans = String(q?.answer ?? "");
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
  } as any;
}

export default function PracticePage() {
  const router = useRouter();

  const [user, setUser] = useState<User>(() => loadUser());
  const [loading, setLoading] = useState(false);
  const [qs, setQs] = useState<PracticeQuestion[]>([]);
  const [idx, setIdx] = useState(0);

  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [results, setResults] = useState<Record<string, PracticeResult>>({});
  const [showExplain, setShowExplain] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("AI is generating questions...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const u = loadUser();
    if (!u.isAuthed) return void (window.location.href = "/login");
    if (!u.lastPlacement) return void (window.location.href = "/placement");
    if (!u.dailyMinutes) return void (window.location.href = "/onboarding/minutes");
    if (needsLevelUp(u)) return void (window.location.href = "/levelup");
    setUser(u);
  }, []);

  const current = qs[idx];

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

  function grantXP(
    xp: number,
    lessonTitle: string,
    correct: number,
    total: number,
    skill: Skill
  ) {
    const u = loadUser();
    const next: User = {
      ...u,
      xpTotal: (u.xpTotal ?? 0) + xp,
      levelXp: (u.levelXp ?? 0) + xp,
      history: [
        {
          atISO: new Date().toISOString(),
          lessonTitle,
          correct,
          total,
          xpEarned: xp,
          skill,
        },
        ...(u.history ?? []),
      ],
    };
    saveUser(next);
    setUser(next);
  }

  async function generateAIQuestions() {
    setLoading(true);
    setShowExplain(false);
    setResults({});
    setIdx(0);
    setPicked(null);
    setTyped("");
    setError(null);
    setLoadingMessage("AI is generating questions...");

    const MAX_CLIENT_RETRIES = 2;
    const RETRY_DELAY = 3000; // 3 seconds
    
    const u = loadUser();
    const targetCount = 20; // Aligned with API limit

    for (let attempt = 0; attempt <= MAX_CLIENT_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          setLoadingMessage(`Retrying... (attempt ${attempt + 1}/${MAX_CLIENT_RETRIES + 1})`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }

        const res = await fetch("/api/practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: {
              cefr: u.cefr,
              dailyMinutes: u.dailyMinutes,
              lastPlacement: u.lastPlacement,
            },
            targetCount,
            challengingLevel: "mixed",
          }),
        });

        const data = await res.json().catch(() => null);
        
        if (!res.ok) {
          const errorMsg = data?.error ?? `API error ${res.status}`;
          console.error(`Practice API error (attempt ${attempt + 1}):`, errorMsg);
          
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

        const built = raw.map((x) => normalizeQuestion(x));
        setQs(built);
        setError(null);
        setLoading(false);
        return; // Success!
        
      } catch (error: any) {
        console.error(`Failed to generate practice (attempt ${attempt + 1}):`, error);
        
        if (attempt >= MAX_CLIENT_RETRIES) {
          setError(error.message || "AI soru oluşturulamadı. Lütfen tekrar deneyin.");
          setLoading(false);
          return;
        }
      }
    }
    
    setLoading(false);
  }

  useEffect(() => {
    if (qs.length === 0) generateAIQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function answerMCQ(choiceIndex: number) {
    if (!current || current.type !== "mcq") return;
    if (isAnswered) return;

    const choices = getChoices(current);
    const answerIndex = getAnswerIndex(current);

    const correct = choiceIndex === answerIndex;
    const userAnswer = choices[choiceIndex] ?? "";

    setPicked(choiceIndex);
    setResults((prev) => ({
      ...prev,
      [current.id]: { correct, userAnswer },
    }));

    const skill = (current as any).skill ? asSkill((current as any).skill) : "vocab";
    if (correct) {
      grantXP(XP.CORRECT_ANSWER, `Practice: ${current.prompt}`, 1, 1, skill);
    }
    setShowExplain(true);
  }

  function answerTyping() {
    if (!current || current.type !== "typing") return;
    if (isAnswered) return;

    const ua = typed.trim();
    const ans = getTypingAnswer(current);

    const correct = ua.toLowerCase() === ans.toLowerCase();

    setResults((prev) => ({
      ...prev,
      [current.id]: { correct, userAnswer: ua },
    }));

    const skill = (current as any).skill ? asSkill((current as any).skill) : "vocab";
    if (correct) {
      grantXP(XP.CORRECT_ANSWER, `Practice: ${current.prompt}`, 1, 1, skill);
    }
    setShowExplain(true);
  }

  function nextQ() {
    setShowExplain(false);
    setPicked(null);
    setTyped("");
    if (idx + 1 < qs.length) setIdx((x) => x + 1);
  }

  function finish() {
    router.push("/dashboard");
  }

  const currentSkill = current ? asSkill((current as any).skill) : "vocab";

  return (
    <main className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-600/20 blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-600/20 blur-[90px] animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">
                {user.cefr} Level
              </span>
              <span className="text-white/50 text-sm">✨ {user.xpTotal} XP</span>
            </div>
            <h1 className="text-2xl font-black text-white">AI Practice Session</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/80 hover:text-white font-semibold transition"
            >
              ← Back
            </button>
            <button
              onClick={generateAIQuestions}
              disabled={loading}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition" />
              <div className="relative px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold flex items-center gap-2">
                {loading ? "Generating..." : "New Practice ↻"}
              </div>
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-2xl blur-xl opacity-20" />
          <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            
            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60 font-semibold">
                  Progress: <span className="text-white">{Math.min(idx + 1, qs.length)}/{qs.length || "30"}</span>
                </span>
                <span className="text-white/60 font-semibold">
                  Score: <span className="text-white">{score.correct}/{qs.length}</span> ({pct}%)
                </span>
              </div>
              <div className="h-3 rounded-full bg-white/[0.05] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-500"
                  style={{
                    width: qs.length === 0 ? "0%" : `${Math.round(((idx + 1) / qs.length) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="py-12 text-center space-y-3 animate-fade-in">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
                <div className="text-white/70 font-semibold">
                  ✨ {loadingMessage}
                </div>
                <div className="text-white/40 text-sm">
                  Generating questions for {user.cefr} level...
                </div>
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="py-12 text-center space-y-4 animate-fade-in">
                <div className="text-5xl">⚠️</div>
                <div className="text-rose-400 font-bold text-lg">
                  Failed to generate questions
                </div>
                <div className="text-white/50 text-sm max-w-md mx-auto">
                  {error}
                </div>
                <button
                  onClick={generateAIQuestions}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold hover:opacity-90 transition"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* No Questions */}
            {!loading && !error && !current && (
              <div className="py-12 text-center text-white/60 font-semibold">
                No questions yet. Click <span className="text-purple-400">New Practice</span> to start.
              </div>
            )}

            {/* Question Display */}
            {!loading && !error && current && (
              <div className="space-y-6 animate-fade-in">
                {/* Question Header */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                      {current.type === "mcq" ? "Multiple Choice" : "Fill In"}
                    </span>
                  </div>
                  <span className="px-3 py-1.5 rounded-full bg-white/[0.05] text-white/70 text-xs font-bold uppercase tracking-wide">
                    {currentSkill}
                  </span>
                </div>

                {/* Question Text */}
                <div className="text-2xl font-black text-white leading-tight">
                  {current.prompt}
                </div>

                {/* MCQ Options */}
                {current.type === "mcq" && (
                  <div className="grid gap-3">
                    {getChoices(current).map((c, i) => {
                      const answered = results[current.id];
                      const isCorrect = i === getAnswerIndex(current);
                      const chosen = picked === i;

                      let className = "relative group rounded-xl px-6 py-4 font-semibold transition-all text-left ";
                      
                      if (answered != null) {
                        if (isCorrect) {
                          className += "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-300";
                        } else if (chosen) {
                          className += "bg-rose-500/20 border-2 border-rose-500 text-rose-300";
                        } else {
                          className += "bg-white/[0.02] border border-white/10 text-white/40";
                        }
                      } else {
                        className += "bg-white/[0.03] border border-white/10 text-white hover:bg-white/[0.08] hover:border-white/20 cursor-pointer";
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => answerMCQ(i)}
                          disabled={isAnswered}
                          className={className}
                        >
                          <span className="text-white/50 font-bold mr-3">{String.fromCharCode(65 + i)}.</span>
                          {c}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Typing Input */}
                {current.type === "typing" && (
                  <div className="space-y-3">
                    <input
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      disabled={isAnswered}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-6 py-4 text-white placeholder-white/30 outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition font-semibold"
                      placeholder="Type your answer..."
                      autoFocus
                    />
                    <button
                      onClick={answerTyping}
                      disabled={isAnswered || typed.trim().length === 0}
                      className={`w-full rounded-xl py-4 font-bold transition-all ${
                        isAnswered || typed.trim().length === 0
                          ? "bg-white/[0.05] text-white/30 border border-white/10 cursor-not-allowed"
                          : "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 shadow-lg"
                      }`}
                    >
                      Check Answer
                    </button>
                  </div>
                )}

                {/* Explanation */}
                {showExplain && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.05] p-5 space-y-3 animate-fade-in">
                    {results[current.id]?.correct ? (
                      <div className="flex items-center gap-2 text-emerald-400 font-black text-lg">
                        <span className="text-2xl">✅</span>
                        <span>Correct!</span>
                        <span className="text-white/50 text-sm font-semibold">
                          (+{XP.CORRECT_ANSWER} XP)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-rose-400 font-black text-lg">
                        <span className="text-2xl">❌</span>
                        <span>Incorrect</span>
                      </div>
                    )}

                    <div className="text-white/70 font-semibold">
                      Correct Answer:{" "}
                      <span className="text-emerald-400 font-bold">
                        {current.type === "mcq" 
                          ? getChoices(current)[getAnswerIndex(current)]
                          : getTypingAnswer(current)
                        }
                      </span>
                    </div>

                    {(current as any).explanation && (
                      <div className="text-white/60 leading-relaxed pt-2 border-t border-white/10">
                        {(current as any).explanation}
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between gap-3 pt-4">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/80 hover:text-white font-semibold transition"
                  >
                    Exit
                  </button>

                  {idx + 1 < qs.length ? (
                    <button
                      onClick={nextQ}
                      disabled={!isAnswered}
                      className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                        isAnswered
                          ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 shadow-lg"
                          : "bg-white/[0.05] text-white/30 border border-white/10 cursor-not-allowed"
                      }`}
                    >
                      Next Question
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={finish}
                      disabled={!isAnswered}
                      className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                        isAnswered
                          ? "bg-white text-[#0a0a1a] hover:bg-white/90 shadow-lg"
                          : "bg-white/[0.05] text-white/30 border border-white/10 cursor-not-allowed"
                      }`}
                    >
                      Finish Session
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
