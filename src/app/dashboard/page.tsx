"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { XP, applyDailyLoginBonus, loadUser, logoutUser, needsLevelUp, saveUser } from "@/lib/store";

export default function DashboardPage() {
  const [user, setUser] = useState(() => loadUser());
  const [showMinutesModal, setShowMinutesModal] = useState(false);
  const [newMinutes, setNewMinutes] = useState(20);

  useEffect(() => {
    let u = loadUser();

    if (!u.isAuthed) {
      window.location.href = "/login";
      return;
    }
    if (!u.lastPlacement) {
      window.location.href = "/placement";
      return;
    }
    if (!u.dailyMinutes) {
      window.location.href = "/onboarding/minutes";
      return;
    }

    u = applyDailyLoginBonus(u);
    saveUser(u);
    setUser(u);
    setNewMinutes(u.dailyMinutes || 20);
  }, []);

  const levelUpRequired = useMemo(() => needsLevelUp(user), [user]);

  const progressPct = useMemo(() => {
    const pct = Math.round((user.levelXp / XP.LEVEL_UP_THRESHOLD) * 100);
    return Math.max(0, Math.min(100, pct));
  }, [user.levelXp]);

  const monthXp = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return user.history.reduce((sum, h) => {
      const d = new Date(h.atISO);
      if (d.getMonth() === month && d.getFullYear() === year) return sum + (h.xpEarned ?? 0);
      return sum;
    }, 0);
  }, [user.history]);

  function logout() {
    logoutUser();
    window.location.href = "/login";
  }

  function updateDailyMinutes() {
    const u = loadUser();
    const updated = { ...u, dailyMinutes: newMinutes };
    saveUser(updated);
    setUser(updated);
    setShowMinutesModal(false);
  }

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
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-black text-white">
              {user.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Welcome back, {user.name}! 👋</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">
                  {user.cefr} Level
                </span>
                <span className="text-white/50 text-sm">🔥 {user.streak} day streak</span>
                <span className="text-white/50 text-sm">✨ {user.xpTotal} XP</span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/80 hover:text-white font-semibold transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Hero Card - My Study Plan */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition" />
          <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-4">
                  <span className="text-xl">📅</span>
                  <span className="text-sm font-bold text-purple-300">Featured</span>
                </div>
                <h2 className="text-3xl font-black text-white mb-2">My Study Plan</h2>
                <p className="text-white/60 text-lg mb-6">
                  Get your personalized 7-day learning roadmap powered by AI
                </p>
                <Link href="/my-plan">
                  <button className="relative group/btn">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-60 group-hover/btn:opacity-100 transition" />
                    <div className="relative px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold flex items-center gap-2 hover:scale-105 transition">
                      Generate My Plan
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </button>
                </Link>
              </div>
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-6xl">
                🎯
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* XP Progress */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition" />
            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60 text-sm font-semibold">Level Progress</span>
                <span className="text-2xl">⚡</span>
              </div>
              <div className="mb-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{user.levelXp}</span>
                  <span className="text-white/50 text-sm">/ {XP.LEVEL_UP_THRESHOLD} XP</span>
                </div>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Monthly XP */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition" />
            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60 text-sm font-semibold">Monthly XP</span>
                <span className="text-2xl">📆</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{monthXp}</span>
                <span className="text-white/50 text-sm">XP</span>
              </div>
            </div>
          </div>

          {/* Daily Minutes */}
          <div className="relative group cursor-pointer" onClick={() => setShowMinutesModal(true)}>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition" />
            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/[0.05] transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60 text-sm font-semibold">Daily Goal</span>
                <span className="text-2xl">⏱</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{user.dailyMinutes}</span>
                <span className="text-white/50 text-sm">min</span>
              </div>
              <div className="text-xs text-white/40 mt-2">Click to change</div>
            </div>
          </div>
        </div>

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Practice */}
          <Link href="/practice">
            <div className="relative group h-full cursor-pointer">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition" />
              <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/[0.05] transition h-full">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="text-xl font-bold text-white mb-2">Practice</h3>
                <p className="text-white/60 text-sm mb-4">AI-powered questions for all skills</p>
                <div className="text-emerald-400 text-sm font-semibold">+{XP.PRACTICE_DONE} XP</div>
              </div>
            </div>
          </Link>

          {/* Vocab Builder */}
          <Link href="/vocab">
            <div className="relative group h-full cursor-pointer">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition" />
              <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/[0.05] transition h-full">
                <div className="text-4xl mb-3">📚</div>
                <h3 className="text-xl font-bold text-white mb-2">Vocab Builder</h3>
                <p className="text-white/60 text-sm mb-4">Learn new words with AI</p>
                <div className="text-emerald-400 text-sm font-semibold">+{XP.DAILY_WORDS_DONE} XP</div>
              </div>
            </div>
          </Link>

          {/* AI Tutor Chat */}
          <Link href="/ai-tutor">
            <div className="relative group h-full cursor-pointer">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition" />
              <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/[0.05] transition h-full">
                <div className="text-4xl mb-3">🤖</div>
                <h3 className="text-xl font-bold text-white mb-2">AI Tutor</h3>
                <p className="text-white/60 text-sm mb-4">Chat with your personal tutor</p>
                <div className="text-pink-400 text-sm font-semibold">Real-time help</div>
              </div>
            </div>
          </Link>

          {/* Level Up Test */}
          <Link href={levelUpRequired ? "/levelup" : "#"}>
            <div className={`relative group h-full cursor-pointer ${levelUpRequired ? "" : "opacity-60 pointer-events-none"}`}>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition" />
              <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/[0.05] transition h-full">
                <div className="text-4xl mb-3">{levelUpRequired ? "🚀" : "🔒"}</div>
                <h3 className="text-xl font-bold text-white mb-2">Level Up Test</h3>
                <p className="text-white/60 text-sm mb-4">
                  {levelUpRequired ? "Ready to advance!" : "Earn more XP first"}
                </p>
                <div className="text-yellow-400 text-sm font-semibold">
                  {levelUpRequired ? "Take test now!" : `${XP.LEVEL_UP_THRESHOLD - user.levelXp} XP needed`}
                </div>
              </div>
            </div>
          </Link>

          {/* Writing Practice */}
          <Link href="/grade-writing">
            <div className="relative group h-full cursor-pointer">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition" />
              <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/[0.05] transition h-full">
                <div className="text-4xl mb-3">✍️</div>
                <h3 className="text-xl font-bold text-white mb-2">Writing</h3>
                <p className="text-white/60 text-sm mb-4">Get AI feedback on your writing</p>
                <div className="text-indigo-400 text-sm font-semibold">Instant correction</div>
              </div>
            </div>
          </Link>

          {/* Listening Practice */}
          <Link href="/listening">
            <div className="relative group h-full cursor-pointer">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition" />
              <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/[0.05] transition h-full">
                <div className="text-4xl mb-3">🎧</div>
                <h3 className="text-xl font-bold text-white mb-2">Listening</h3>
                <p className="text-white/60 text-sm mb-4">Dictation practice with AI</p>
                <div className="text-purple-400 text-sm font-semibold">Listen & write</div>
              </div>
            </div>
          </Link>

          {/* Reading Stories */}
          <Link href="/learn">
            <div className="relative group h-full cursor-pointer">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition" />
              <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/[0.05] transition h-full">
                <div className="text-4xl mb-3">📖</div>
                <h3 className="text-xl font-bold text-white mb-2">Reading</h3>
                <p className="text-white/60 text-sm mb-4">AI-generated stories</p>
                <div className="text-cyan-400 text-sm font-semibold">Learn by reading</div>
              </div>
            </div>
          </Link>

          {/* Progress Tracking */}
          <Link href="/progress">
            <div className="relative group h-full cursor-pointer">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition" />
              <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/[0.05] transition h-full">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-xl font-bold text-white mb-2">Progress</h3>
                <p className="text-white/60 text-sm mb-4">Track your learning journey</p>
                <div className="text-violet-400 text-sm font-semibold">Detailed stats</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        {user.history.length > 0 && (
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-gray-500 rounded-2xl blur opacity-10" />
            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📈</span>
                Recent Activity
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {user.history.slice(0, 6).map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition">
                    <div className="flex-1">
                      <div className="text-white/90 font-semibold text-sm">{h.lessonTitle}</div>
                      <div className="text-white/40 text-xs mt-0.5">
                        {new Date(h.atISO).toLocaleDateString()} • {new Date(h.atISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                      +{h.xpEarned} XP
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Daily Minutes Modal */}
      {showMinutesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowMinutesModal(false)}>
          <div className="relative max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur opacity-30" />
            <div className="relative bg-[#0a0a1a] border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-black text-white mb-2">Daily Study Goal</h3>
              <p className="text-white/60 mb-6">Set your daily study time in minutes</p>
              
              <input
                type="number"
                value={newMinutes}
                onChange={(e) => setNewMinutes(Number(e.target.value))}
                min={5}
                max={180}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white text-center text-2xl font-bold focus:outline-none focus:border-orange-500/50 transition"
              />
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowMinutesModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={updateDailyMinutes}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-500 text-white font-bold hover:scale-105 transition"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
