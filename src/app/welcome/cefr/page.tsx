"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadUser, patchUser, type CEFR } from "@/lib/store";

const LEVELS: Array<{ cefr: CEFR; emoji: string; title: string; sub: string; color: string }> = [
  { cefr: "A1", emoji: "🌱", title: "Beginner A1", sub: "Temel başlangıç", color: "from-emerald-500 to-green-500" },
  { cefr: "A2", emoji: "📗", title: "Elementary A2", sub: "Günlük ifadeler", color: "from-teal-500 to-cyan-500" },
  { cefr: "B1", emoji: "📘", title: "Intermediate B1", sub: "Akıcı olmaya giriş", color: "from-blue-500 to-indigo-500" },
  { cefr: "B2", emoji: "📙", title: "Upper Intermediate B2", sub: "Karmaşık konular", color: "from-orange-500 to-amber-500" },
  { cefr: "C1", emoji: "🏆", title: "Advanced C1", sub: "İleri seviye", color: "from-purple-500 to-pink-500" },
];

export default function CefrPickPage() {
  const [picked, setPicked] = useState<CEFR | null>(null);

  useEffect(() => {
    const u = loadUser();
    if (!u.isAuthed) window.location.href = "/login";
  }, []);

  function next() {
    if (!picked) return;

    patchUser({
      intendedCefr: picked,
      knowsCefr: true,
    } as any);

    window.location.href = `/welcome/cefr-test?cefr=${picked}`;
  }

  return (
    <main className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-cyan-600/20 to-blue-600/20 blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-600/20 blur-[80px] animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-400 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-cyan-500/25 transition-transform group-hover:scale-105">
            F
          </div>
          <span className="text-lg font-bold text-white">FluentAI</span>
        </Link>
      </header>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-2xl">
          {/* Card */}
          <div className="relative animate-scale-in">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-3xl blur opacity-20" />
            <div className="relative p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
                  <span>🌿</span>
                  <span className="text-sm font-medium text-cyan-400">Choose your level</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
                  Select your CEFR level
                </h1>
                <p className="text-white/60">Seviyeni seç — sonra 30 soruluk doğrulama testi.</p>
              </div>

              {/* Options */}
              <div className="grid gap-3 mb-6">
                {LEVELS.map((l) => {
                  const active = picked === l.cefr;
                  return (
                    <button
                      key={l.cefr}
                      onClick={() => setPicked(l.cefr)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left group ${
                        active
                          ? "bg-cyan-500/10 border-cyan-500/50"
                          : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
                      }`}
                    >
                      <span className="flex items-center gap-4">
                        <span className={`w-12 h-12 rounded-xl bg-gradient-to-br ${l.color} flex items-center justify-center text-2xl`}>
                          {l.emoji}
                        </span>
                        <span>
                          <div className={`font-bold text-lg ${active ? "text-white" : "text-white/90"}`}>
                            {l.title}
                          </div>
                          <div className="text-sm text-white/50">{l.sub}</div>
                        </span>
                      </span>
                      <span className={`text-xl transition-transform group-hover:translate-x-1 ${active ? "text-cyan-400" : "text-white/30"}`}>
                        ›
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Info Card */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📝</span>
                  <div>
                    <p className="text-sm text-white/70">
                      <span className="text-white font-medium">30 Soru Test:</span> Seçtiğin seviyeyi doğrulamak için kısa bir test yapacağız.
                    </p>
                    <p className="text-xs text-white/50 mt-1">
                      85%+ başarı ile seviye onaylanır. Başaramazsan genel placement teste yönlendirilirsin.
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
                  <div className={`absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur transition ${picked ? "opacity-60 group-hover:opacity-100" : "opacity-0"}`} />
                  <div className="relative px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-500 text-white font-bold flex items-center gap-2">
                    Start Level Test
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
