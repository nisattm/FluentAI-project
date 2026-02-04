"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadUser, patchUser, type LearningReason } from "@/lib/store";

const OPTIONS: Array<{ key: LearningReason; title: string; emoji: string; sub: string }> = [
  { key: "work", emoji: "🤝", title: "Work", sub: "İş için" },
  { key: "school", emoji: "🎓", title: "School", sub: "Okul / dersler" },
  { key: "travel", emoji: "✈️", title: "Travel", sub: "Seyahat" },
  { key: "culture", emoji: "🎭", title: "Culture", sub: "Kültür / içerik" },
  { key: "family", emoji: "🫶", title: "Family & community", sub: "Aile / çevre" },
  { key: "challenge", emoji: "💪", title: "Challenge myself", sub: "Kendimi geliştirmek" },
  { key: "other", emoji: "💬", title: "Other", sub: "Diğer" },
];

export default function ReasonPage() {
  const [picked, setPicked] = useState<LearningReason | null>(null);

  useEffect(() => {
    const u = loadUser();
    if (!u.isAuthed) window.location.href = "/login";
  }, []);

  function next() {
    if (!picked) return;
    patchUser({ reason: picked } as any);
    window.location.href = "/welcome/goal";
  }

  return (
    <main className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 blur-[80px] animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-blue-500/25 transition-transform group-hover:scale-105">
            F
          </div>
          <span className="text-lg font-bold text-white">FluentAI</span>
        </Link>
      </header>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-2xl">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-2 rounded-full transition-all ${
                  step === 1 ? "w-8 bg-gradient-to-r from-blue-500 to-cyan-500" : "w-2 bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* Card */}
          <div className="relative animate-scale-in">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-3xl blur opacity-20" />
            <div className="relative p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                  <span>✨</span>
                  <span className="text-sm font-medium text-blue-400">Welcome</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
                  Why are you learning English?
                </h1>
                <p className="text-white/60">Deneyimini sana göre ayarlıyoruz.</p>
              </div>

              {/* Options Grid */}
              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {OPTIONS.map((o) => {
                  const active = picked === o.key;
                  return (
                    <button
                      key={o.key}
                      onClick={() => setPicked(o.key)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left group ${
                        active
                          ? "bg-blue-500/10 border-blue-500/50"
                          : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-2xl">{o.emoji}</span>
                        <span>
                          <div className={`font-bold ${active ? "text-white" : "text-white/90"}`}>
                            {o.title}
                          </div>
                          <div className="text-sm text-white/50">{o.sub}</div>
                        </span>
                      </span>
                      <span className={`text-xl transition-transform group-hover:translate-x-1 ${active ? "text-blue-400" : "text-white/30"}`}>
                        ›
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Continue Button */}
              <div className="flex justify-end">
                <button
                  onClick={next}
                  disabled={!picked}
                  className={`relative group ${!picked ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className={`absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur transition ${picked ? "opacity-60 group-hover:opacity-100" : "opacity-0"}`} />
                  <div className="relative px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold flex items-center gap-2">
                    Continue
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
