"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { loadUser, saveUser, XP } from "@/lib/store";

interface Mistake {
  type: "spelling" | "grammar" | "missing" | "extra";
  original: string;
  userInput: string;
  correction: string;
}

interface CheckResult {
  accuracy: number;
  isCorrect: boolean;
  mistakes: Mistake[];
  feedback: string;
  correctedSentence: string;
}

interface DictationData {
  sentence: string;
  audio: string;
  difficulty: number;
  grammarFocus: string;
  vocabularyFocus: string[];
}

export default function ListeningPage() {
  const router = useRouter();
  const [user, setUser] = useState(() => loadUser());
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [dictation, setDictation] = useState<DictationData | null>(null);
  const [userInput, setUserInput] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const u = loadUser();
    if (!u.isAuthed) {
      window.location.href = "/login";
      return;
    }
    setUser(u);
  }, []);

  async function generateDictation(category: string = "general") {
    setLoading(true);
    setDictation(null);
    setUserInput("");
    setResult(null);
    setShowAnswer(false);
    setPlayCount(0);

    try {
      const res = await fetch("/api/dictation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cefr: user.cefr || "B1",
          category,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503 && data.details) {
          // TTS API not enabled
          alert(`❌ Text-to-Speech API Not Enabled\n\n${data.details}\n\nSteps:\n1. Go to Google Cloud Console\n2. Enable Cloud Text-to-Speech API\n3. Wait a few minutes and try again`);
        } else {
          alert(`Error: ${data.error || "Generation failed"}\n\n${data.details || ""}`);
        }
        setLoading(false);
        return;
      }

      setDictation(data);
    } catch (error: any) {
      console.error("Dictation error:", error);
      alert(`Error: ${error.message || "Something went wrong"}`);
    } finally {
      setLoading(false);
    }
  }

  function playAudio() {
    if (audioRef.current && dictation) {
      audioRef.current.src = `data:audio/mp3;base64,${dictation.audio}`;
      audioRef.current.play();
      setPlayCount((prev) => prev + 1);
    }
  }

  async function checkAnswer() {
    if (!dictation || !userInput.trim() || checking) return;

    setChecking(true);
    setResult(null);

    try {
      const res = await fetch("/api/dictation/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original: dictation.sentence,
          userInput: userInput.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Check failed");
      }

      setResult(data);

      // Grant XP
      const u = loadUser();
      const xpEarned = data.isCorrect ? 50 : Math.floor(data.accuracy / 2);
      const next = {
        ...u,
        xpTotal: (u.xpTotal ?? 0) + xpEarned,
        levelXp: (u.levelXp ?? 0) + xpEarned,
        history: [
          {
            atISO: new Date().toISOString(),
            lessonTitle: `Dictation (${data.accuracy}% accuracy)`,
            correct: data.isCorrect ? 1 : 0,
            total: 1,
            xpEarned,
            skill: "listening" as any,
          },
          ...(u.history ?? []),
        ],
      };
      saveUser(next);
      setUser(next);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setChecking(false);
    }
  }

  const CATEGORIES = [
    { id: "general", label: "🎯 General", emoji: "🎯" },
    { id: "travel", label: "✈️ Travel", emoji: "✈️" },
    { id: "business", label: "💼 Business", emoji: "💼" },
    { id: "daily life", label: "☕ Daily Life", emoji: "☕" },
    { id: "technology", label: "💻 Technology", emoji: "💻" },
    { id: "education", label: "📚 Education", emoji: "📚" },
  ];

  const mistakeTypeColors: Record<string, string> = {
    spelling: "bg-red-500/20 text-red-400 border-red-500/40",
    grammar: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    missing: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    extra: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  };

  return (
    <main className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-600/20 blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-600/20 blur-[90px] animate-blob animation-delay-4000" />
      </div>

      <audio ref={audioRef} />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">
                {user.cefr} Level
              </span>
              <span className="text-white/50 text-sm">🎧 Dictation Practice</span>
            </div>
            <h1 className="text-2xl font-black text-white">AI Listening & Writing</h1>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/80 hover:text-white font-semibold transition"
          >
            ← Back
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {/* Category Selection */}
        {!dictation && !loading && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-black text-white">Choose a Category</h2>
              <p className="text-white/60">AI will speak a sentence, you write what you hear</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => generateDictation(cat.id)}
                  className="relative group"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition" />
                  <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/[0.05] transition">
                    <div className="text-4xl mb-2">{cat.emoji}</div>
                    <div className="text-white font-bold">{cat.label.split(" ").slice(1).join(" ")}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin" />
            <div className="text-white font-bold text-lg">Generating sentence...</div>
            <div className="text-white/50 text-sm">AI is preparing your dictation</div>
          </div>
        )}

        {/* Dictation Interface */}
        {dictation && !loading && !result && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Audio Player Card */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-2xl blur opacity-30" />
              <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold mb-4">
                    <span>📊</span>
                    <span>Difficulty: {dictation.difficulty}/10</span>
                    <span>•</span>
                    <span>{user.cefr} Level</span>
                  </div>
                </div>

                <button
                  onClick={playAudio}
                  className="relative group mx-auto"
                >
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition animate-pulse" />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-2xl hover:scale-105 transition">
                    <svg className="w-12 h-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </button>

                <div className="mt-6 text-white/80 text-lg font-semibold">
                  {playCount === 0 ? "Click to play audio" : `Played ${playCount} time${playCount > 1 ? "s" : ""}`}
                </div>

                <div className="mt-8 flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-white/50 text-xs mb-1">Grammar Focus</div>
                    <div className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-white/80 text-sm">
                      {dictation.grammarFocus}
                    </div>
                  </div>
                  {dictation.vocabularyFocus.length > 0 && (
                    <div className="text-center">
                      <div className="text-white/50 text-xs mb-1">Key Words</div>
                      <div className="flex gap-2">
                        {dictation.vocabularyFocus.slice(0, 3).map((word, i) => (
                          <div
                            key={i}
                            className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold"
                          >
                            {word}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20" />
              <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>✍️</span>
                    Write what you heard
                  </h3>
                  <button
                    onClick={() => setShowAnswer(!showAnswer)}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/70 hover:text-white text-sm transition"
                  >
                    {showAnswer ? "Hide" : "Show"} Answer
                  </button>
                </div>

                {showAnswer && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="text-yellow-300 text-sm font-semibold mb-1">Correct Answer:</div>
                    <div className="text-white text-lg">{dictation.sentence}</div>
                  </div>
                )}

                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type the sentence you heard..."
                  className="w-full h-32 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 resize-none text-lg"
                  disabled={checking}
                />

                <div className="flex gap-3">
                  <button
                    onClick={checkAnswer}
                    disabled={!userInput.trim() || checking}
                    className={`flex-1 relative group ${!userInput.trim() || checking ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className={`absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur transition ${
                      userInput.trim() && !checking ? "opacity-60 group-hover:opacity-100" : "opacity-20"
                    }`} />
                    <div className="relative px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-500 text-white font-bold flex items-center justify-center gap-2">
                      {checking ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          Check Answer
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={playAudio}
                    className="px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-semibold transition"
                  >
                    🔊 Replay
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && dictation && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Score Card */}
            <div className="relative">
              <div className={`absolute -inset-1 rounded-2xl blur opacity-30 ${
                result.isCorrect
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
                  : "bg-gradient-to-r from-orange-500 to-red-500"
              }`} />
              <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">{result.isCorrect ? "🎉" : "📝"}</div>
                  <h3 className="text-3xl font-black text-white mb-2">
                    {result.accuracy}% Accuracy
                  </h3>
                  <p className="text-white/70">{result.feedback}</p>
                </div>

                <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      result.isCorrect
                        ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
                        : "bg-gradient-to-r from-orange-500 to-yellow-500"
                    }`}
                    style={{ width: `${result.accuracy}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Comparison */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-20" />
                <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <span>✅</span>
                    Correct Sentence
                  </h4>
                  <p className="text-emerald-300 text-lg leading-relaxed">{result.correctedSentence}</p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-20" />
                <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <span>✏️</span>
                    Your Answer
                  </h4>
                  <p className="text-white/90 text-lg leading-relaxed">{userInput}</p>
                </div>
              </div>
            </div>

            {/* Mistakes */}
            {result.mistakes.length > 0 && (
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur opacity-20" />
                <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-3">
                  <h4 className="text-white font-bold flex items-center gap-2">
                    <span>❌</span>
                    Mistakes to Learn From ({result.mistakes.length})
                  </h4>
                  <div className="space-y-2">
                    {result.mistakes.map((mistake, i) => (
                      <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                        <div className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full border text-xs font-bold mb-2 ${mistakeTypeColors[mistake.type]}`}>
                          {mistake.type}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-red-400 line-through">{mistake.userInput}</span>
                            <span className="text-white/40">→</span>
                            <span className="text-emerald-400 font-semibold">{mistake.original}</span>
                          </div>
                          <div className="text-white/70 text-sm">{mistake.correction}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setDictation(null);
                  setUserInput("");
                  setResult(null);
                  setShowAnswer(false);
                  setPlayCount(0);
                }}
                className="px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-semibold transition"
              >
                ← Choose Another Category
              </button>
              <button
                onClick={() => generateDictation("general")}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition" />
                <div className="relative px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold">
                  🔄 Try Another Sentence
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
