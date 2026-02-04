"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadUser, patchUser } from "@/lib/store";

const OPTIONS = [
  { 
    key: "know" as const, 
    emoji: "👍", 
    title: "I know my level", 
    sub: "Seçmek istiyorum",
    desc: "CEFR seviyemi zaten biliyorum (A1, A2, B1, B2, C1)"
  },
  { 
    key: "help" as const, 
    emoji: "🔍", 
    title: "I need help to find my level", 
    sub: "Seviye testi yap",
    desc: "Benim için kısa bir test yaparak seviyemi belirle"
  },
];

export default function ProficiencyPage() {
  const [picked, setPicked] = useState<"know" | "help" | null>(null);

  useEffect(() => {
    const u = loadUser();
    if (!u.isAuthed) window.location.href = "/login";
  }, []);

  function next() {
    if (!picked) return;

    const knowsCefr = picked === "know";
    patchUser({ knowsCefr } as any);

    // sonraki adım: biliyorsa seviye seçme ekranı, bilmiyorsa placement test
    window.location.href = knowsCefr ? "/welcome/cefr" : "/placement";
  }

  return (
    <main className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 blur-[80px] animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-purple-500/25 transition-transform group-hover:scale-105">
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
                  step <= 4 
                    ? step === 4 
                      ? "w-8 bg-gradient-to-r from-purple-500 to-pink-500" 
                      : "w-8 bg-purple-500/50"
                    : "w-2 bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* Card */}
          <div className="relative animate-scale-in">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 rounded-3xl blur opacity-20" />
            <div className="relative p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                  <span>🔎</span>
                  <span className="text-sm font-medium text-purple-400">Level</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
                  Do you already know your level?
                </h1>
                <p className="text-white/60">Bilmiyorsan biz buluruz.</p>
              </div>

              {/* Options */}
              <div className="grid gap-4 mb-6">
                {OPTIONS.map((o) => {
                  const active = picked === o.key;
                  return (
                    <button
                      key={o.key}
                      onClick={() => setPicked(o.key)}
                      className={`flex items-start gap-4 p-5 rounded-xl border transition-all duration-200 text-left group ${
                        active
                          ? "bg-purple-500/10 border-purple-500/50"
                          : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
                      }`}
                    >
                      <span className="text-4xl">{o.emoji}</span>
                      <span className="flex-1">
                        <div className={`font-bold text-lg ${active ? "text-white" : "text-white/90"}`}>
                          {o.title}
                        </div>
                        <div className="text-sm text-white/50 mt-1">{o.desc}</div>
                      </span>
                      <span className="flex items-center gap-2 mt-1">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          active 
                            ? "bg-purple-500/20 text-purple-400" 
                            : "bg-white/5 text-white/40"
                        }`}>
                          {o.sub}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Info Card */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="text-sm text-white/70">
                      <span className="text-white font-medium">CEFR Seviyeleri:</span> A1 (Başlangıç) → A2 → B1 → B2 → C1 (İleri)
                    </p>
                    <p className="text-xs text-white/50 mt-1">
                      Emin değilsen seviye testi seçeneğini seç, 5 dakikada belirleyelim!
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
                  <div className={`absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur transition ${picked ? "opacity-60 group-hover:opacity-100" : "opacity-0"}`} />
                  <div className="relative px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold flex items-center gap-2">
                    {picked === "help" ? "Start Level Test" : "Continue"}
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
