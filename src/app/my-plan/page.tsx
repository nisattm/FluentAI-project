"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadUser } from "@/lib/store";

export default function MyPlanPage() {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dailyMinutes, setDailyMinutes] = useState(20);
  const [targetCEFR, setTargetCEFR] = useState("B2");

  const user = loadUser();

  useEffect(() => {
    if (!user.isAuthed) {
      window.location.href = "/login";
    }
  }, [user]);

  async function generatePlan() {
    setLoading(true);

    try {
      // Mock history for demo
      const mockHistory = Array.from({ length: 30 }, (_, i) => ({
        questionId: `q${i}`,
        correct: Math.random() > 0.3,
        skill: ["vocab", "grammar", "reading", "writing"][Math.floor(Math.random() * 4)] as any,
        cefr: user.cefr || "B1",
        timestamp: Date.now() - i * 86400000,
      }));

      const res = await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: mockHistory,
          cefr: user.cefr || "B1",
          targetCefr: targetCEFR,
          dailyMinutes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate plan");
      }

      setPlan(data);
    } catch (error: any) {
      alert(`Hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-600/20 blur-[80px] animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 border-b border-white/5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-black text-white">📅 My Study Plan</h1>
              <p className="text-sm text-white/50">Personalized learning roadmap</p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-5xl mx-auto p-6 space-y-6">
        {/* Generator */}
        {!plan && (
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl blur opacity-20" />
            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">Generate Your Personalized Plan</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">
                    Daily study time (minutes)
                  </label>
                  <input
                    type="number"
                    value={dailyMinutes}
                    onChange={(e) => setDailyMinutes(Number(e.target.value))}
                    min={10}
                    max={120}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">Target CEFR Level</label>
                  <select
                    value={targetCEFR}
                    onChange={(e) => setTargetCEFR(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                  </select>
                </div>
              </div>

              <button
                onClick={generatePlan}
                disabled={loading}
                className="relative w-full group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition" />
                <div className="relative w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate My Plan"
                  )}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Plan Display */}
        {plan && (
          <div className="space-y-6 animate-scale-in">
            {/* Summary */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-20" />
              <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-3">Summary</h2>
                <p className="text-white/70 leading-relaxed">{plan.summary}</p>
                
                <div className="mt-4 p-4 rounded-xl bg-white/[0.05]">
                  <p className="text-sm font-semibold text-white/80">Daily Goal:</p>
                  <p className="text-white">{plan.dailyGoal}</p>
                </div>

                {plan.weakSkills && plan.weakSkills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-sm text-white/60">Focus areas:</span>
                    {plan.weakSkills.map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Plan */}
            <div className="grid md:grid-cols-2 gap-4">
              {plan.weeklyPlan?.map((day: any, i: number) => (
                <div
                  key={i}
                  className="relative group"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition" />
                  <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/[0.05] transition">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-black">
                        {day.day}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{day.focus}</h3>
                        <p className="text-xs text-white/50">{day.duration}</p>
                      </div>
                    </div>

                    <ul className="space-y-1.5">
                      {day.activities?.map((activity: string, j: number) => (
                        <li key={j} className="text-sm text-white/70 flex items-start gap-2">
                          <span className="text-green-400 mt-1">✓</span>
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Tips */}
            {plan.tips && plan.tips.length > 0 && (
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-20" />
                <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4">💡 Tips for Success</h2>
                  <ul className="space-y-2">
                    {plan.tips.map((tip: string, i: number) => (
                      <li key={i} className="text-white/70 flex items-start gap-3">
                        <span className="text-green-400 mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Reset Button */}
            <button
              onClick={() => setPlan(null)}
              className="w-full py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-semibold transition"
            >
              Generate New Plan
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
