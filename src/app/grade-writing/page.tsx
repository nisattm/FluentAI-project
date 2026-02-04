"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadUser, saveUser, XP } from "@/lib/store";

interface WritingError {
  type: "grammar" | "spelling" | "vocabulary" | "punctuation";
  original: string;
  corrected: string;
  explanation: string;
  position?: number;
}

interface VocabSuggestion {
  original: string;
  suggested: string;
  reason: string;
}

interface GradeResult {
  score: number;
  cefrLevel: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
  errors: WritingError[];
  vocabularySuggestions: VocabSuggestion[];
  correctedText: string;
}

const WRITING_PROMPTS: Record<string, string[]> = {
  A1: [
    "Tell me about your family.",
    "Describe your daily routine.",
    "What is your favorite food and why?",
  ],
  A2: [
    "Write about your last vacation.",
    "Describe your hometown.",
    "What are your hobbies and interests?",
  ],
  B1: [
    "Discuss the advantages and disadvantages of social media.",
    "Describe an important event in your life.",
    "What are your plans for the future?",
  ],
  B2: [
    "Discuss the impact of technology on modern communication.",
    "Should universities be free for everyone? Why or why not?",
    "Describe a book or movie that influenced you.",
  ],
  C1: [
    "Discuss the impact of AI on job security.",
    "Analyze the role of government in environmental protection.",
    "Evaluate the benefits and drawbacks of globalization.",
  ],
  C2: [
    "Critically assess the philosophical implications of artificial intelligence.",
    "Examine the socioeconomic factors contributing to inequality.",
    "Analyze the intersection of ethics and modern biotechnology.",
  ],
};

export default function GradeWritingPage() {
  const router = useRouter();
  const [user, setUser] = useState(() => loadUser());
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [rewriting, setRewriting] = useState(false);

  useEffect(() => {
    const u = loadUser();
    if (!u.isAuthed) {
      window.location.href = "/login";
      return;
    }
    setUser(u);
  }, []);

  const prompts = WRITING_PROMPTS[user.cefr || "B1"] || WRITING_PROMPTS.B1;

  async function analyzeWriting() {
    if (!text.trim() || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/grade-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grade",
          text: text.trim(),
          cefr: user.cefr || "B1",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);

      // Grant XP for completing writing
      const u = loadUser();
      const xpEarned = XP.WRITING_DONE;
      const next = {
        ...u,
        xpTotal: (u.xpTotal ?? 0) + xpEarned,
        levelXp: (u.levelXp ?? 0) + xpEarned,
        history: [
          {
            atISO: new Date().toISOString(),
            lessonTitle: `Writing Analysis (Score: ${data.score})`,
            correct: 1,
            total: 1,
            xpEarned,
            skill: "writing" as any,
          },
          ...(u.history ?? []),
        ],
      };
      saveUser(next);
      setUser(next);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function rewriteText() {
    if (!text.trim() || rewriting) return;

    setRewriting(true);

    try {
      const res = await fetch("/api/grade-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rewrite",
          text: text.trim(),
          targetLevel: "C1",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Rewrite failed");
      }

      setText(data.rewrittenText);
      alert(`Text rewritten to C1 level!\n\nChanges made:\n${data.changes.slice(0, 3).join("\n")}`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setRewriting(false);
    }
  }

  const errorTypeColors: Record<string, string> = {
    grammar: "bg-red-500/20 text-red-400 border-red-500/40",
    spelling: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    vocabulary: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    punctuation: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  };

  return (
    <main className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-600/20 blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-600/20 blur-[90px] animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                {user.cefr} Level
              </span>
              <span className="text-white/50 text-sm">✍️ Writing Analyzer</span>
            </div>
            <h1 className="text-2xl font-black text-white">Advanced Writing Analysis</h1>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/80 hover:text-white font-semibold transition"
          >
            ← Back
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Writing Prompts */}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-20" />
          <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <h3 className="text-white font-bold mb-2">Writing Prompts for {user.cefr}</h3>
                <div className="flex flex-wrap gap-2">
                  {prompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setText(prompt)}
                      className="px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-white/70 hover:text-white transition"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Text Input */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20" />
            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Your Writing</h2>
                <span className="text-white/50 text-sm">{text.length} characters</span>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Start writing here, or click a prompt above..."
                className="w-full h-80 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 resize-none leading-relaxed"
              />

              <div className="flex gap-3">
                <button
                  onClick={analyzeWriting}
                  disabled={loading || !text.trim()}
                  className={`flex-1 relative group ${!text.trim() || loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className={`absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur transition ${
                    text.trim() && !loading ? "opacity-60 group-hover:opacity-100" : "opacity-20"
                  }`} />
                  <div className="relative px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 text-white font-bold flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze Writing
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </>
                    )}
                  </div>
                </button>

                <button
                  onClick={rewriteText}
                  disabled={rewriting || !text.trim()}
                  className="px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Rewrite to C1 level"
                >
                  {rewriting ? "..." : "✨ Rewrite"}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="space-y-4">
            {!result && !loading && (
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-slate-500 to-gray-500 rounded-2xl blur opacity-10" />
                <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-bold text-white mb-2">No Analysis Yet</h3>
                  <p className="text-white/60">Write something and click "Analyze Writing" to get detailed feedback</p>
                </div>
              </div>
            )}

            {result && (
              <>
                {/* Score Card */}
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-30" />
                  <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm text-white/60 font-semibold">Overall Score</div>
                        <div className="text-5xl font-black text-white">{result.score}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-white/60 font-semibold">CEFR Level</div>
                        <div className="text-3xl font-black text-emerald-400">{result.cefrLevel}</div>
                      </div>
                    </div>
                    <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                        style={{ width: `${result.score}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-20" />
                  <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                      <span>💬</span>
                      Feedback
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed">{result.feedback}</p>
                  </div>
                </div>

                {/* Errors */}
                {result.errors.length > 0 && (
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur opacity-20" />
                    <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4 space-y-3">
                      <h3 className="text-white font-bold flex items-center gap-2">
                        <span>❌</span>
                        Errors Found ({result.errors.length})
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {result.errors.map((error, i) => (
                          <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                            <div className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full border text-xs font-bold mb-2 ${errorTypeColors[error.type]}`}>
                              {error.type}
                            </div>
                            <div className="text-sm space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-red-400 line-through">{error.original}</span>
                                <span className="text-white/40">→</span>
                                <span className="text-emerald-400 font-semibold">{error.corrected}</span>
                              </div>
                              <div className="text-white/60 text-xs">{error.explanation}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Vocabulary Suggestions */}
                {result.vocabularySuggestions.length > 0 && (
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl blur opacity-20" />
                    <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4 space-y-3">
                      <h3 className="text-white font-bold flex items-center gap-2">
                        <span>💡</span>
                        Vocabulary Improvements
                      </h3>
                      <div className="space-y-2">
                        {result.vocabularySuggestions.map((sug, i) => (
                          <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-yellow-400">{sug.original}</span>
                              <span className="text-white/40">→</span>
                              <span className="text-emerald-400 font-semibold">{sug.suggested}</span>
                            </div>
                            <div className="text-white/60 text-xs">{sug.reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-20" />
                    <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4">
                      <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-1">
                        <span>✅</span>
                        Strengths
                      </h4>
                      <ul className="space-y-1">
                        {result.strengths.map((s, i) => (
                          <li key={i} className="text-white/70 text-xs flex items-start gap-2">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur opacity-20" />
                    <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4">
                      <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-1">
                        <span>📈</span>
                        To Improve
                      </h4>
                      <ul className="space-y-1">
                        {result.improvements.map((imp, i) => (
                          <li key={i} className="text-white/70 text-xs flex items-start gap-2">
                            <span className="text-orange-400 mt-0.5">•</span>
                            {imp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Corrected Text */}
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-20" />
                  <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                      <span>✨</span>
                      Corrected Version
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed bg-white/[0.02] border border-white/5 rounded-lg p-3">
                      {result.correctedText}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
