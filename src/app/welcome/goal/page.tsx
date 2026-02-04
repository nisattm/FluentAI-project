"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadUser, patchUser } from "@/lib/store";

const GOALS = [
  { minutes: 5, label: "Casual", emoji: "🌱", sub: "Günde 5 dakika" },
  { minutes: 10, label: "Regular", emoji: "📚", sub: "Günde 10 dakika" },
  { minutes: 15, label: "Serious", emoji: "🎯", sub: "Günde 15 dakika" },
  { minutes: 25, label: "Intense", emoji: "🔥", sub: "Günde 25 dakika" },
];

export default function GoalPage() {
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    const u = loadUser();
    if (!u.isAuthed) window.location.href = "/login";
  }, []);

  function next() {
    if (!picked) return;
    patchUser({ dailyMinutes: picked } as any);
    window.location.href = "/welcome/level";
  }

  return (
    <main className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-green-600/20 to-emerald-600/20 blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-teal-500/20 to-green-600/20 blur-[80px] animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-green-500/25 transition-transform group-hover:scale-105">
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
                  step <= 2 
                    ? step === 2 
                      ? "w-8 bg-gradient-to-r from-green-500 to-emerald-500" 
                      : "w-8 bg-green-500/50"
                    : "w-2 bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* Card */}
          <div className="relative animate-scale-in">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-3xl blur opacity-20" />
            <div className="relative p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
                  <span>🎯</span>
                  <span className="text-sm font-medium text-green-400">Daily Goal</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
                  Set a daily study goal
                </h1>
                <p className="text-white/60">Her gün ne kadar çalışmak istiyorsun?</p>
              </div>

              {/* Options Grid */}
              <div className="grid gap-3 mb-6">
                {GOALS.map((g) => {
                  const active = picked === g.minutes;
                  return (
                    <button
                      key={g.minutes}
                      onClick={() => setPicked(g.minutes)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left group ${
                        active
                          ? "bg-green-500/10 border-green-500/50"
                          : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
                      }`}
                    >
                      <span className="flex items-center gap-4">
                        <span className="text-3xl">{g.emoji}</span>
                        <span>
                          <div className={`font-bold text-lg ${active ? "text-white" : "text-white/90"}`}>
                            {g.minutes} minutes / day
                          </div>
                          <div className="text-sm text-white/50">{g.sub}</div>
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          active 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-white/5 text-white/40"
                        }`}>
                          {g.label}
                        </span>
                        <span className={`text-xl transition-transform group-hover:translate-x-1 ${active ? "text-green-400" : "text-white/30"}`}>
                          ›
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Info Card */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="text-sm text-white/70">
                      <span className="text-white font-medium">Pro tip:</span> Küçük hedeflerle başla! 
                      Günde 5 dakika bile sürekli yapıldığında büyük ilerleme sağlar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <div className="flex justify-end">
                <button
                  onClick={next}
                  disabled={!picked}
                  className={`relative group ${!picked ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className={`absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur transition ${picked ? "opacity-60 group-hover:opacity-100" : "opacity-0"}`} />
                  <div className="relative px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold flex items-center gap-2">
                    Commit to daily goal
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
