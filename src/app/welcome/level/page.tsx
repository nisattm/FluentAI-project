"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadUser, patchUser, type LevelPath } from "@/lib/store";

const OPTIONS: Array<{ key: LevelPath; emoji: string; title: string; sub: string; desc: string }> = [
  { 
    key: "beginner", 
    emoji: "🏁", 
    title: "I'm a complete beginner", 
    sub: "Sıfırdan başla",
    desc: "İngilizce konusunda çok az veya hiç bilgim yok"
  },
  { 
    key: "know_some", 
    emoji: "📘", 
    title: "I know some English", 
    sub: "Seviyeni belirle",
    desc: "Temel bilgilerim var, seviyemi öğrenmek istiyorum"
  },
];

export default function LevelStartPage() {
  const [picked, setPicked] = useState<LevelPath | null>(null);

  useEffect(() => {
    const u = loadUser();
    if (!u.isAuthed) window.location.href = "/login";
  }, []);

  function next() {
    if (!picked) return;
    
    patchUser({ levelPath: picked } as any);
    
    if (picked === "beginner") {
      // Beginner seçildi → A1 olarak ayarla ve direkt dashboard'a git
      patchUser({
        cefr: "A1",
        knowsCefr: true,
        lastPlacement: { cefr: "A1", targetSkill: "vocab", score: 100 },
      } as any);
      window.location.href = "/dashboard";
    } else {
      // "I know some English" seçildi → seviye belirleme akışına devam
      window.location.href = "/welcome/proficiency";
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-amber-600/20 to-orange-600/20 blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-600/20 blur-[80px] animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-amber-500/25 transition-transform group-hover:scale-105">
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
                  step <= 3 
                    ? step === 3 
                      ? "w-8 bg-gradient-to-r from-amber-500 to-orange-500" 
                      : "w-8 bg-amber-500/50"
                    : "w-2 bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* Card */}
          <div className="relative animate-scale-in">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-3xl blur opacity-20" />
            <div className="relative p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
                  <span>🏁</span>
                  <span className="text-sm font-medium text-amber-400">Start</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
                  How much English do you know?
                </h1>
                <p className="text-white/60">Sıfırdan mı başlayalım, yoksa üstüne mi?</p>
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
                          ? "bg-amber-500/10 border-amber-500/50"
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
                            ? "bg-amber-500/20 text-amber-400" 
                            : "bg-white/5 text-white/40"
                        }`}>
                          {o.sub}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Info based on selection */}
              {picked === "beginner" && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6 animate-scale-in">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🌱</span>
                    <div>
                      <p className="text-sm text-white/80">
                        <span className="text-emerald-400 font-medium">A1 Beginner</span> seviyesinden başlayacaksın!
                      </p>
                      <p className="text-xs text-white/50 mt-1">
                        Temel kelimeler ve basit cümlelerle öğrenmeye başla.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {picked === "know_some" && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6 animate-scale-in">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <p className="text-sm text-white/80">
                        <span className="text-amber-400 font-medium">Seviye testi</span> ile doğru seviyeni bulalım!
                      </p>
                      <p className="text-xs text-white/50 mt-1">
                        Kısa bir test ile A1-C1 arasında seviyeni belirleyeceğiz.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Continue Button */}
              <div className="flex justify-end">
                <button
                  onClick={next}
                  disabled={!picked}
                  className={`relative group ${!picked ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${picked === "beginner" ? "from-emerald-500 to-green-500" : "from-amber-500 to-orange-500"} rounded-xl blur transition ${picked ? "opacity-60 group-hover:opacity-100" : "opacity-0"}`} />
                  <div className={`relative px-6 py-3 rounded-xl bg-gradient-to-r ${picked === "beginner" ? "from-emerald-600 to-green-500" : "from-amber-600 to-orange-500"} text-white font-bold flex items-center gap-2`}>
                    {picked === "beginner" ? "Start Learning" : "Continue"}
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
