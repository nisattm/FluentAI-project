"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadUser, saveUser, XP } from "@/lib/store";

interface VocabularyItem {
  word: string;
  turkish: string;
  definition: string;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Story {
  title: string;
  content: string;
  vocabulary: VocabularyItem[];
  questions: Question[];
  wordCount: number;
}

export default function LearnPage() {
  const router = useRouter();
  const [user, setUser] = useState(() => loadUser());
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<Story | null>(null);
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showQuestions, setShowQuestions] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const u = loadUser();
    if (!u.isAuthed) {
      window.location.href = "/login";
      return;
    }
    setUser(u);
  }, []);

  async function generateStory(topic: string = "general") {
    setLoading(true);
    setStory(null);
    setShowQuestions(false);
    setShowResults(false);
    setAnswers([]);

    try {
      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cefr: user.cefr || "B1",
          topic,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Story generation failed");
      }

      setStory(data);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleWordClick(e: React.MouseEvent<HTMLSpanElement>, word: string) {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:'"]/g, "");
    const vocabItem = story?.vocabulary.find(
      (v) => v.word.toLowerCase() === cleanWord
    );

    if (vocabItem) {
      setSelectedWord(vocabItem);
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    }
  }

  function submitAnswers() {
    if (!story || answers.length !== 5) {
      alert("Please answer all questions!");
      return;
    }

    setShowResults(true);

    const correct = answers.filter((ans, i) => ans === story.questions[i].correctAnswer).length;
    const score = (correct / 5) * 100;

    // Grant XP
    const u = loadUser();
    const xpEarned = correct * 10;
    const next = {
      ...u,
      xpTotal: (u.xpTotal ?? 0) + xpEarned,
      levelXp: (u.levelXp ?? 0) + xpEarned,
      history: [
        {
          atISO: new Date().toISOString(),
          lessonTitle: `Reading: ${story.title}`,
          correct,
          total: 5,
          xpEarned,
          skill: "reading" as any,
        },
        ...(u.history ?? []),
      ],
    };
    saveUser(next);
    setUser(next);

    alert(`You got ${correct}/5 correct! +${xpEarned} XP`);
  }

  const TOPICS = [
    { id: "general", label: "🎲 Surprise Me", desc: "Random topic" },
    { id: "travel", label: "✈️ Travel", desc: "Adventures & places" },
    { id: "technology", label: "💻 Technology", desc: "AI, apps, future" },
    { id: "nature", label: "🌿 Nature", desc: "Animals, environment" },
    { id: "culture", label: "🎭 Culture", desc: "Art, music, traditions" },
    { id: "daily life", label: "☕ Daily Life", desc: "Routines & hobbies" },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-600/20 to-purple-600/20 blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-pink-500/20 to-rose-600/20 blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 blur-[90px] animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                {user.cefr} Level
              </span>
              <span className="text-white/50 text-sm">📖 AI Reading Stories</span>
            </div>
            <h1 className="text-2xl font-black text-white">Interactive Reading</h1>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/80 hover:text-white font-semibold transition"
          >
            ← Back
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Topic Selection */}
        {!story && !loading && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-black text-white">Choose Your Reading Topic</h2>
              <p className="text-white/60">AI will generate a unique story tailored to your {user.cefr} level</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => generateStory(topic.id)}
                  className="relative group"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition" />
                  <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/[0.05] transition">
                    <div className="text-3xl mb-2">{topic.label.split(" ")[0]}</div>
                    <div className="text-white font-bold mb-1">{topic.label.split(" ").slice(1).join(" ")}</div>
                    <div className="text-white/50 text-sm">{topic.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
            <div className="text-white font-bold text-lg">Generating your story...</div>
            <div className="text-white/50 text-sm">AI is crafting a unique {user.cefr} level story</div>
          </div>
        )}

        {/* Story Display */}
        {story && !loading && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Story Card */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20" />
              <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl p-8 lg:p-12">
                {/* Title */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold mb-4">
                    <span>📚</span>
                    <span>{story.wordCount} words</span>
                    <span>•</span>
                    <span>{user.cefr} Level</span>
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-black text-white mb-2">{story.title}</h2>
                  <p className="text-white/50 text-sm">Click on any word to see its meaning</p>
                </div>

                {/* Story Content */}
                <div className="prose prose-invert max-w-none">
                  <div className="text-white/90 leading-relaxed text-lg space-y-4">
                    {story.content.split("\n\n").map((paragraph, i) => (
                      <p key={i} className="text-justify">
                        {paragraph.split(" ").map((word, j) => {
                          const cleanWord = word.toLowerCase().replace(/[.,!?;:'"]/g, "");
                          const isVocab = story.vocabulary.some(
                            (v) => v.word.toLowerCase() === cleanWord
                          );
                          return (
                            <span
                              key={j}
                              onClick={(e) => handleWordClick(e, word)}
                              className={`${
                                isVocab
                                  ? "text-yellow-300 font-semibold cursor-pointer hover:text-yellow-200 hover:underline decoration-yellow-400/50 decoration-2 underline-offset-2 transition"
                                  : ""
                              }`}
                            >
                              {word}{" "}
                            </span>
                          );
                        })}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Vocabulary Section */}
                <div className="mt-8 pt-8 border-t border-white/10">
                  <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                    <span>📝</span>
                    Key Vocabulary ({story.vocabulary.length} words)
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {story.vocabulary.map((item, i) => (
                      <div
                        key={i}
                        className="bg-white/[0.03] border border-white/10 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-yellow-300 font-bold">{item.word}</span>
                          <span className="text-white/50 text-sm">{item.turkish}</span>
                        </div>
                        <div className="text-white/70 text-sm italic">{item.definition}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Show Questions Button */}
                {!showQuestions && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setShowQuestions(true)}
                      className="relative group"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition" />
                      <div className="relative px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-500 text-white font-bold text-lg">
                        📋 Take Comprehension Quiz
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Questions Section */}
            {showQuestions && (
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-20" />
                <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                  <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                    <span>❓</span>
                    Reading Comprehension Questions
                  </h3>

                  <div className="space-y-6">
                    {story.questions.map((q, qIdx) => (
                      <div key={qIdx} className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                        <div className="text-white font-bold mb-4">
                          {qIdx + 1}. {q.question}
                        </div>
                        <div className="space-y-2">
                          {q.options.map((option, oIdx) => {
                            const isSelected = answers[qIdx] === oIdx;
                            const isCorrect = q.correctAnswer === oIdx;
                            const showCorrect = showResults && isCorrect;
                            const showWrong = showResults && isSelected && !isCorrect;

                            return (
                              <button
                                key={oIdx}
                                onClick={() => {
                                  if (!showResults) {
                                    const newAnswers = [...answers];
                                    newAnswers[qIdx] = oIdx;
                                    setAnswers(newAnswers);
                                  }
                                }}
                                disabled={showResults}
                                className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                                  showCorrect
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                                    : showWrong
                                    ? "bg-red-500/20 border-red-500 text-red-300"
                                    : isSelected
                                    ? "bg-indigo-500/20 border-indigo-500 text-white"
                                    : "bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/[0.05] hover:border-white/20"
                                }`}
                              >
                                <span className="font-semibold mr-2">
                                  {String.fromCharCode(65 + oIdx)}.
                                </span>
                                {option}
                                {showCorrect && " ✓"}
                                {showWrong && " ✗"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {!showResults && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={submitAnswers}
                        disabled={answers.length !== 5}
                        className={`relative group ${
                          answers.length !== 5 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition" />
                        <div className="relative px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 text-white font-bold">
                          Submit Answers
                        </div>
                      </button>
                    </div>
                  )}

                  {showResults && (
                    <div className="mt-6 flex gap-4 justify-center">
                      <button
                        onClick={() => {
                          setStory(null);
                          setShowQuestions(false);
                          setShowResults(false);
                          setAnswers([]);
                        }}
                        className="px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-semibold transition"
                      >
                        📖 Read Another Story
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="text-center">
              <button
                onClick={() => setStory(null)}
                className="px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/70 hover:text-white font-semibold transition"
              >
                ← Choose Another Topic
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Word Tooltip */}
      {selectedWord && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setSelectedWord(null)}
          />
          <div
            className="fixed z-50 animate-scale-in"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y - 10,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg blur opacity-40" />
              <div className="relative bg-[#0a0a1a] border border-yellow-500/50 rounded-lg p-4 min-w-[200px] max-w-[300px] shadow-2xl">
                <div className="text-yellow-300 font-black text-lg mb-1">
                  {selectedWord.word}
                </div>
                <div className="text-white/90 text-sm mb-2">
                  🇹🇷 {selectedWord.turkish}
                </div>
                <div className="text-white/70 text-xs italic">
                  "{selectedWord.definition}"
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                  <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-yellow-500/50" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
