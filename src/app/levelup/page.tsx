"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { loadUser, saveUser, XP } from "@/lib/store";

interface Question {
  id: string;
  category: "grammar" | "vocabulary" | "reading" | "listening";
  type: "mcq" | "fill";
  prompt: string;
  passage?: string;
  audioText?: string;
  audio?: string;
  choices?: string[];
  answer: string;
  explanation: string;
  difficulty: number;
}

interface LevelUpTest {
  title: string;
  targetLevel: string;
  questions: Question[];
}

interface Analysis {
  passed: boolean;
  score: number;
  breakdown: {
    grammar: number;
    vocabulary: number;
    reading: number;
    listening: number;
  };
  weaknesses: string[];
  recommendations: string[];
  feedback: string;
}

export default function LevelUpPage() {
  const router = useRouter();
  const [user, setUser] = useState(() => loadUser());
  const [loading, setLoading] = useState(false);
  const [test, setTest] = useState<LevelUpTest | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const u = loadUser();
    if (!u.isAuthed) {
      window.location.href = "/login";
      return;
    }
    setUser(u);
    generateTest();
  }, []);

  async function generateTest() {
    setLoading(true);
    setTest(null);
    setCurrentIndex(0);
    setAnswers([]);
    setShowExplanation(false);
    setIsCorrect(null);
    setShowResults(false);
    setAnalysis(null);

    try {
      const res = await fetch("/api/levelup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cefr: user.cefr || "B1",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Test generation failed");
      }

      setTest(data);
      setAnswers(new Array(data.questions.length).fill(""));
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function checkAnswer() {
    if (!test || !currentQuestion) return;

    const userAnswer = answers[currentIndex].trim().toLowerCase();
    const correctAnswer = currentQuestion.answer.trim().toLowerCase();
    const correct = userAnswer === correctAnswer;

    setIsCorrect(correct);
    setShowExplanation(true);
  }

  function nextQuestion() {
    if (!test) return;

    if (currentIndex < test.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowExplanation(false);
      setIsCorrect(null);
    } else {
      finishTest();
    }
  }

  async function finishTest() {
    if (!test) return;

    setAnalyzing(true);
    setShowResults(true);

    // Prepare results
    const results = test.questions.map((q, idx) => ({
      category: q.category,
      correct:
        answers[idx].trim().toLowerCase() === q.answer.trim().toLowerCase(),
    }));

    try {
      const res = await fetch("/api/levelup/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results,
          targetLevel: test.targetLevel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setAnalysis(data);

      // Update user level if passed
      if (data.passed) {
        const u = loadUser();
        const xpEarned = 200;
        const next = {
          ...u,
          cefr: test.targetLevel as any,
          xpTotal: (u.xpTotal ?? 0) + xpEarned,
          levelXp: 0,
          history: [
            {
              atISO: new Date().toISOString(),
              lessonTitle: `Level Up: ${u.cefr} → ${test.targetLevel}`,
              correct: results.filter((r) => r.correct).length,
              total: results.length,
              xpEarned,
              skill: "grammar" as any,
            },
            ...(u.history ?? []),
          ],
        };
        saveUser(next);
        setUser(next);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  }

  function playAudio() {
    if (audioRef.current && currentQuestion?.audio) {
      audioRef.current.src = `data:audio/mp3;base64,${currentQuestion.audio}`;
      audioRef.current.play();
    }
  }

  const currentQuestion = test?.questions[currentIndex];
  const progress = test
    ? Math.round(((currentIndex + 1) / test.questions.length) * 100)
    : 0;

  const categoryColors: Record<string, string> = {
    grammar: "from-blue-500 to-indigo-500",
    vocabulary: "from-purple-500 to-pink-500",
    reading: "from-cyan-500 to-teal-500",
    listening: "from-orange-500 to-red-500",
  };

  const categoryEmojis: Record<string, string> = {
    grammar: "📖",
    vocabulary: "📚",
    reading: "📰",
    listening: "🎧",
  };

  return (
    <main className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-600/20 to-purple-600/20 blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-pink-500/20 to-rose-600/20 blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 blur-[90px] animate-blob animation-delay-4000" />
      </div>

      <audio ref={audioRef} />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                Current: {user.cefr}
              </span>
              {test && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  Target: {test.targetLevel}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-white">Level Up Test</h1>
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
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
            <div className="text-white font-bold text-lg">Generating your level-up exam...</div>
            <div className="text-white/50 text-sm">20 comprehensive questions</div>
          </div>
        )}

        {/* Test Interface */}
        {!loading && test && !showResults && currentQuestion && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Progress Bar */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20" />
              <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-white/70 text-sm">
                    Question {currentIndex + 1} of {test.questions.length}
                  </div>
                  <div className="text-white font-bold">{progress}%</div>
                </div>
                <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="relative">
              <div className={`absolute -inset-1 bg-gradient-to-r ${categoryColors[currentQuestion.category]} rounded-2xl blur opacity-30`} />
              <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
                {/* Category Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${categoryColors[currentQuestion.category]} text-white font-bold text-sm`}>
                      {categoryEmojis[currentQuestion.category]} {currentQuestion.category.toUpperCase()}
                    </div>
                    <div className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-white/70 text-xs">
                      Difficulty: {currentQuestion.difficulty}/10
                    </div>
                  </div>
                </div>

                {/* Reading Passage */}
                {currentQuestion.category === "reading" && currentQuestion.passage && (
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                    <div className="text-xs text-white/60 font-bold mb-3">📰 READING PASSAGE</div>
                    <p className="text-white/90 leading-relaxed">{currentQuestion.passage}</p>
                  </div>
                )}

                {/* Listening Audio */}
                {currentQuestion.category === "listening" && currentQuestion.audio && (
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 text-center">
                    <div className="text-xs text-white/60 font-bold mb-4">🎧 LISTEN TO THE AUDIO</div>
                    <button
                      onClick={playAudio}
                      className="relative group mx-auto"
                    >
                      <div className="absolute -inset-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition" />
                      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-600 to-red-500 flex items-center justify-center shadow-2xl hover:scale-105 transition">
                        <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </button>
                    <div className="text-white/50 text-xs mt-3">Click to play audio</div>
                  </div>
                )}

                {/* Question Prompt */}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">{currentQuestion.prompt}</h3>

                  {/* MCQ Choices */}
                  {currentQuestion.type === "mcq" && currentQuestion.choices && (
                    <div className="space-y-3">
                      {currentQuestion.choices.map((choice, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const newAnswers = [...answers];
                            newAnswers[currentIndex] = choice;
                            setAnswers(newAnswers);
                          }}
                          disabled={showExplanation}
                          className={`w-full text-left px-6 py-4 rounded-xl border transition ${
                            answers[currentIndex] === choice
                              ? "bg-indigo-500/20 border-indigo-500 text-white"
                              : "bg-white/[0.03] border-white/10 text-white/80 hover:bg-white/[0.05] hover:border-white/20"
                          } ${showExplanation ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          <span className="font-semibold mr-3">{String.fromCharCode(65 + i)}.</span>
                          {choice}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Fill-in Input */}
                  {currentQuestion.type === "fill" && (
                    <input
                      type="text"
                      value={answers[currentIndex] || ""}
                      onChange={(e) => {
                        const newAnswers = [...answers];
                        newAnswers[currentIndex] = e.target.value;
                        setAnswers(newAnswers);
                      }}
                      disabled={showExplanation}
                      placeholder="Type your answer..."
                      className="w-full px-6 py-4 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  )}
                </div>

                {/* Explanation */}
                {showExplanation && (
                  <div
                    className={`p-6 rounded-xl border ${
                      isCorrect
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-red-500/10 border-red-500/30"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-3xl">{isCorrect ? "✅" : "❌"}</span>
                      <div>
                        <div className="text-white font-bold text-lg mb-1">
                          {isCorrect ? "Correct!" : "Incorrect"}
                        </div>
                        {!isCorrect && (
                          <div className="text-white/80 text-sm mb-2">
                            Correct answer: <span className="font-bold">{currentQuestion.answer}</span>
                          </div>
                        )}
                        <div className="text-white/90 text-sm">{currentQuestion.explanation}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                  {!showExplanation ? (
                    <button
                      onClick={checkAnswer}
                      disabled={!answers[currentIndex]?.trim()}
                      className="flex-1 relative group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition" />
                      <div className="relative px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-500 text-white font-bold">
                        Check Answer
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={nextQuestion}
                      className="flex-1 relative group"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition" />
                      <div className="relative px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 text-white font-bold">
                        {currentIndex === test.questions.length - 1 ? "Finish Test" : "Next Question →"}
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && analysis && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Score Card */}
            <div className="relative">
              <div className={`absolute -inset-1 rounded-2xl blur opacity-40 ${
                analysis.passed
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
                  : "bg-gradient-to-r from-orange-500 to-red-500"
              }`} />
              <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
                <div className="text-8xl mb-6">{analysis.passed ? "🎉" : "📚"}</div>
                <h2 className="text-4xl font-black text-white mb-3">
                  {analysis.passed ? "LEVEL UP!" : "Keep Practicing"}
                </h2>
                <div className="text-6xl font-black text-white mb-4">{analysis.score}%</div>
                <p className="text-white/80 text-lg max-w-2xl mx-auto">{analysis.feedback}</p>
                
                {analysis.passed && (
                  <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    <span>🏆</span>
                    <span>New Level: {test?.targetLevel}</span>
                    <span>+200 XP</span>
                  </div>
                )}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20" />
              <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-xl p-8">
                <h3 className="text-2xl font-black text-white mb-6">Performance Breakdown</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(analysis.breakdown).map(([category, score]) => (
                    <div key={category} className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{categoryEmojis[category as keyof typeof categoryEmojis]}</span>
                          <span className="text-white font-bold capitalize">{category}</span>
                        </div>
                        <span className={`text-2xl font-black ${
                          score >= 80 ? "text-emerald-400" : score >= 60 ? "text-yellow-400" : "text-red-400"
                        }`}>
                          {score}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            score >= 80
                              ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
                              : score >= 60
                              ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                              : "bg-gradient-to-r from-red-500 to-rose-500"
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weaknesses */}
            {analysis.weaknesses.length > 0 && (
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur opacity-20" />
                <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-xl p-8">
                  <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                    <span>⚠️</span>
                    Areas to Improve
                  </h3>
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((weakness, i) => (
                      <li key={i} className="flex items-start gap-3 text-white/80">
                        <span className="text-orange-400 mt-1">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-20" />
              <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-xl p-8">
                <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                  <span>💡</span>
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/80">
                      <span className="text-cyan-400 mt-1">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-8 py-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-bold transition"
              >
                Back to Dashboard
              </button>
              {!analysis.passed && (
                <button
                  onClick={generateTest}
                  className="relative group"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition" />
                  <div className="relative px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 text-white font-bold">
                    🔄 Try Again
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Analyzing State */}
        {showResults && analyzing && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 border-4 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
            <div className="text-white font-bold text-lg">Analyzing your performance...</div>
          </div>
        )}
      </div>
    </main>
  );
}
