"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadUser } from "@/lib/store";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface User {
  name: string;
  cefr: string;
  streak: number;
  xpTotal: number;
  levelXp: number;
  mastery: Record<string, number>;
  history: Array<{
    atISO: string;
    lessonTitle: string;
    correct: number;
    total: number;
    xpEarned: number;
    skill?: string;
  }>;
}

export default function ProgressPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    const u = loadUser();
    if (!u.isAuthed) {
      window.location.href = "/login";
      return;
    }
    setUser(u as any);
    generateAIInsight(u as any);
  }, []);

  async function generateAIInsight(userData: User) {
    setLoadingInsight(true);
    try {
      const res = await fetch("/api/progress-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cefr: userData.cefr,
          streak: userData.streak,
          mastery: userData.mastery,
          recentHistory: userData.history?.slice(0, 10) || [],
        }),
      });

      const data = await res.json();
      if (res.ok && data.insight) {
        setAiInsight(data.insight);
      } else {
        setAiInsight("Keep practicing daily to improve your English skills!");
      }
    } catch {
      setAiInsight("Keep practicing daily to improve your English skills!");
    } finally {
      setLoadingInsight(false);
    }
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
      </main>
    );
  }

  // Calculate stats
  const wordsLearned = user.history?.filter(h => h.skill === "vocab" || h.lessonTitle?.includes("Vocab")).length * 20 || 0;
  const writingActivities = user.history?.filter(h => h.skill === "writing" || h.lessonTitle?.includes("Writing"));
  const avgWritingScore = writingActivities?.length > 0
    ? Math.round(writingActivities.reduce((acc, h) => acc + (h.correct / h.total) * 100, 0) / writingActivities.length)
    : 0;

  // Prepare chart data
  const skillData = [
    { skill: "Vocabulary", value: Math.round((user.mastery?.vocab || 0.2) * 100), fullMark: 100 },
    { skill: "Grammar", value: Math.round((user.mastery?.grammar || 0.2) * 100), fullMark: 100 },
    { skill: "Reading", value: Math.round((user.mastery?.reading || 0.2) * 100), fullMark: 100 },
    { skill: "Writing", value: Math.round((user.mastery?.writing || 0.2) * 100), fullMark: 100 },
    { skill: "Listening", value: Math.round((user.mastery?.listening || 0.2) * 100), fullMark: 100 },
    { skill: "Speaking", value: Math.round((user.mastery?.speaking || 0.2) * 100), fullMark: 100 },
  ];

  // Progress over time (simulate from history)
  const progressData = user.history?.slice(0, 10).reverse().map((h, i) => ({
    day: `Day ${i + 1}`,
    xp: (i + 1) * 50 + (h.correct || 0) * 10,
    score: h.total > 0 ? Math.round((h.correct / h.total) * 100) : 0,
  })) || [
    { day: "Day 1", xp: 50, score: 60 },
    { day: "Day 2", xp: 120, score: 65 },
    { day: "Day 3", xp: 200, score: 70 },
  ];

  const last5Activities = user.history?.slice(0, 5) || [];

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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                {user.cefr} Level
              </span>
              <span className="text-white/50 text-sm">📊 Progress Dashboard</span>
            </div>
            <h1 className="text-2xl font-black text-white">Your Learning Journey</h1>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/80 hover:text-white font-semibold transition"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats Grid - 4 Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          {/* Current Level */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20" />
            <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="text-white/50 text-sm font-semibold mb-2">Current Level</div>
              <div className="text-5xl font-black text-white mb-1">{user.cefr}</div>
              <div className="text-indigo-400 text-sm">CEFR Standard</div>
            </div>
          </div>

          {/* Daily Streak */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur opacity-20" />
            <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="text-white/50 text-sm font-semibold mb-2">Daily Streak</div>
              <div className="text-5xl font-black text-white mb-1">🔥 {user.streak || 0}</div>
              <div className="text-orange-400 text-sm">Days in a row</div>
            </div>
          </div>

          {/* Words Learned */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-20" />
            <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="text-white/50 text-sm font-semibold mb-2">Words Learned</div>
              <div className="text-5xl font-black text-white mb-1">{wordsLearned}</div>
              <div className="text-emerald-400 text-sm">Vocabulary items</div>
            </div>
          </div>

          {/* Avg Writing Score */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl blur opacity-20" />
            <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="text-white/50 text-sm font-semibold mb-2">Avg. Writing Score</div>
              <div className="text-5xl font-black text-white mb-1">{avgWritingScore || "—"}</div>
              <div className="text-pink-400 text-sm">Out of 100</div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Line Chart - Progress Over Time */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-20" />
            <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📈</span>
                Progress Over Time
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(10,10,26,0.9)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="xp"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ fill: "#6366f1", strokeWidth: 2 }}
                      name="XP"
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: "#10b981", strokeWidth: 2 }}
                      name="Score %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-white/70">XP Earned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-white/70">Score %</span>
                </div>
              </div>
            </div>
          </div>

          {/* Radar Chart - Skills Distribution */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-20" />
            <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>🎯</span>
                Skills Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={skillData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                    />
                    <Radar
                      name="Skills"
                      dataKey="value"
                      stroke="#a855f7"
                      fill="#a855f7"
                      fillOpacity={0.4}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* AI Coach Insight */}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-xl blur opacity-30" />
          <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🤖</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">AI Coach Insight</h3>
                {loadingInsight ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                    <span className="text-white/70">Analyzing your progress...</span>
                  </div>
                ) : (
                  <p className="text-white/90 text-lg leading-relaxed">
                    "{aiInsight}"
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-gray-500 rounded-xl blur opacity-20" />
          <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📋</span>
              Recent Activity
            </h3>

            {last5Activities.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-white/60">No activities yet. Start learning to see your progress!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/50 font-semibold text-sm">Date</th>
                      <th className="text-left py-3 px-4 text-white/50 font-semibold text-sm">Activity</th>
                      <th className="text-left py-3 px-4 text-white/50 font-semibold text-sm">Skill</th>
                      <th className="text-right py-3 px-4 text-white/50 font-semibold text-sm">Score</th>
                      <th className="text-right py-3 px-4 text-white/50 font-semibold text-sm">XP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {last5Activities.map((activity, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4 text-white/70 text-sm">
                          {new Date(activity.atISO).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-white font-medium">
                          {activity.lessonTitle || "Practice Session"}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            activity.skill === "vocab" ? "bg-emerald-500/20 text-emerald-400" :
                            activity.skill === "grammar" ? "bg-blue-500/20 text-blue-400" :
                            activity.skill === "reading" ? "bg-cyan-500/20 text-cyan-400" :
                            activity.skill === "writing" ? "bg-pink-500/20 text-pink-400" :
                            activity.skill === "listening" ? "bg-orange-500/20 text-orange-400" :
                            "bg-purple-500/20 text-purple-400"
                          }`}>
                            {activity.skill || "mixed"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-white font-bold">
                          {activity.correct}/{activity.total}
                        </td>
                        <td className="py-3 px-4 text-right text-yellow-400 font-bold">
                          +{activity.xpEarned || 0} XP
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Total XP Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl blur opacity-30" />
          <div className="relative bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/50 text-sm font-semibold">Total XP Earned</div>
                <div className="text-4xl font-black text-white">{user.xpTotal || 0} XP</div>
              </div>
              <div className="text-right">
                <div className="text-white/50 text-sm font-semibold">Level Progress</div>
                <div className="text-2xl font-bold text-white">{user.levelXp || 0} / 300</div>
                <div className="w-40 h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${Math.min(((user.levelXp || 0) / 300) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
