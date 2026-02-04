"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadUser, XP, saveUser } from "@/lib/store";

interface VocabWord {
  word: string;
  type: "noun" | "verb" | "adjective" | "adverb";
  definition: string;
  example_sentence: string;
  turkish_translation: string;
}

export default function VocabPage() {
  const router = useRouter();
  const [user, setUser] = useState(() => loadUser());
  const [words, setWords] = useState<VocabWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [learnedCount, setLearnedCount] = useState(0);

  useEffect(() => {
    const u = loadUser();
    if (!u.isAuthed) {
      window.location.href = "/login";
      return;
    }
    setUser(u);
    generateVocab(u.cefr || "B1");
  }, []);

  async function generateVocab(cefr: string) {
    setLoading(true);
    setFlippedCards(new Set());
    setLearnedCount(0);

    try {
      const res = await fetch("/api/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cefr, count: 20 }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate vocabulary");
      }

      const data = await res.json();
      setWords(data.words || []);
    } catch (error) {
      console.error("Vocab generation error:", error);
      alert("Kelimeler oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  function toggleFlip(index: number) {
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
        // First time flipping = learned
        if (!prev.has(index)) {
          setLearnedCount((c) => c + 1);
        }
      }
      return newSet;
    });
  }

  function completeSession() {
    if (learnedCount === 0) {
      alert("En az bir kelimeyi öğrenin!");
      return;
    }

    // Grant XP
    const u = loadUser();
    const xpEarned = XP.DAILY_WORDS_DONE;
    const next = {
      ...u,
      xpTotal: (u.xpTotal ?? 0) + xpEarned,
      levelXp: (u.levelXp ?? 0) + xpEarned,
      history: [
        {
          atISO: new Date().toISOString(),
          lessonTitle: `Vocabulary: ${learnedCount} words learned`,
          correct: learnedCount,
          total: 20,
          xpEarned,
          skill: "vocab" as any,
        },
        ...(u.history ?? []),
      ],
    };
    saveUser(next);
    setUser(next);

    alert(`Tebrikler! ${learnedCount} kelime öğrendiniz!\n+${xpEarned} XP kazandınız!`);
    router.push("/dashboard");
  }

  const typeColors: Record<string, string> = {
    noun: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    verb: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    adjective: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    adverb: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };

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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                {user.cefr} Level
              </span>
              <span className="text-white/50 text-sm">
                📚 {learnedCount}/20 learned
              </span>
            </div>
            <h1 className="text-2xl font-black text-white">Vocabulary Builder</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/80 hover:text-white font-semibold transition"
            >
              ← Back
            </button>
            <button
              onClick={() => generateVocab(user.cefr || "B1")}
              disabled={loading}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition" />
              <div className="relative px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold flex items-center gap-2">
                {loading ? "Generating..." : "New Words ↻"}
              </div>
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Instructions */}
        <div className="mb-6 relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-20" />
          <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <h3 className="text-white font-bold mb-1">How to use Flashcards</h3>
                <p className="text-white/60 text-sm">
                  Click on any card to flip and see the Turkish translation, definition, and example sentence. 
                  Learn all 20 words to complete your daily vocabulary session!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <div className="text-white/70 font-semibold">
              ✨ Generating 20 vocabulary words for {user.cefr} level...
            </div>
          </div>
        )}

        {/* Flashcards Grid */}
        {!loading && words.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {words.map((word, index) => {
              const isFlipped = flippedCards.has(index);
              
              return (
                <div
                  key={index}
                  className="group perspective-1000 h-64 cursor-pointer"
                  onClick={() => toggleFlip(index)}
                >
                  <div
                    className={`relative w-full h-full transition-transform duration-500 preserve-3d ${
                      isFlipped ? "rotate-y-180" : ""
                    }`}
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* Front of Card */}
                    <div
                      className="absolute inset-0 backface-hidden"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div className="relative h-full">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition" />
                        <div className="relative h-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-white/[0.05] transition">
                          {/* Word Type Badge */}
                          <div className={`px-3 py-1 rounded-full border text-xs font-bold mb-4 ${typeColors[word.type]}`}>
                            {word.type}
                          </div>
                          
                          {/* Main Word */}
                          <div className="text-3xl font-black text-white mb-2 text-center">
                            {word.word}
                          </div>
                          
                          {/* Pronunciation Icon */}
                          <div className="mt-4 text-white/40 text-sm">
                            🔊 Click to learn
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Back of Card */}
                    <div
                      className="absolute inset-0 backface-hidden"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <div className="relative h-full">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur opacity-30" />
                        <div className="relative h-full bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-xl p-6 flex flex-col justify-between overflow-y-auto">
                          {/* Turkish Translation */}
                          <div>
                            <div className="text-emerald-400 text-sm font-bold mb-2">🇹🇷 Türkçe</div>
                            <div className="text-xl font-black text-white mb-4">
                              {word.turkish_translation}
                            </div>
                          </div>

                          {/* English Definition */}
                          <div className="mb-4">
                            <div className="text-blue-400 text-sm font-bold mb-2">📖 Definition</div>
                            <div className="text-white/80 text-sm leading-relaxed">
                              {word.definition}
                            </div>
                          </div>

                          {/* Example Sentence */}
                          <div>
                            <div className="text-purple-400 text-sm font-bold mb-2">💬 Example</div>
                            <div className="text-white/70 text-sm italic leading-relaxed">
                              "{word.example_sentence}"
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Complete Button */}
        {!loading && words.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={completeSession}
              disabled={learnedCount === 0}
              className={`relative group ${learnedCount === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className={`absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur transition ${
                learnedCount > 0 ? "opacity-60 group-hover:opacity-100" : "opacity-20"
              }`} />
              <div className="relative px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-500 text-white font-bold flex items-center gap-2">
                Complete Session
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
                  +{XP.DAILY_WORDS_DONE} XP
                </span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Custom CSS for 3D flip */}
      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </main>
  );
}
