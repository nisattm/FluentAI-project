"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { loadUser } from "@/lib/store";

type Q = {
  id: string;
  type: "mcq" | "fill";
  prompt: string;
  choices?: string[];
  answer: string;
  explanation: string;
  skillTag: "vocab" | "grammar" | "reading";
  difficulty: 1 | 2 | 3 | 4 | 5;
};
type Lesson = { title: string; cefr: "A1" | "A2" | "B1" | "B2" | "C1"; objective: string; questions: Q[] };

const topicMap: Record<string, { title: string; emoji: string }> = {
  hospital: { title: "Hastane", emoji: "🏥" },
  school: { title: "Okul", emoji: "🏫" },
  travel: { title: "Seyahat", emoji: "🧳" },
  market: { title: "Market", emoji: "🛒" },
  hotel: { title: "Otel", emoji: "🏨" },
  airport: { title: "Havaalanı", emoji: "🛫" },
  bank: { title: "Banka", emoji: "🏦" },
};

export default function TopicLessonPage({ params }: { params: { topic: string } }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);

  const meta = useMemo(() => topicMap[params.topic] ?? { title: params.topic, emoji: "🤖" }, [params.topic]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLesson(null);
      setScore(null);
      try {
        const user = loadUser?.() ?? {};
        const r = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user,
            topic: { key: params.topic, title: meta.title },
          }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Lesson generation failed");
        setLesson(j);
      } catch (e: any) {
        alert(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [params.topic, meta.title]);

  function setA(qid: string, v: string) {
    setAnswers((p) => ({ ...p, [qid]: v }));
  }

  function finish() {
    if (!lesson) return;
    let correct = 0;
    for (const q of lesson.questions) {
      const a = (answers[q.id] ?? "").trim().toLowerCase();
      const b = q.answer.trim().toLowerCase();
      if (a === b) correct++;
    }
    setScore(Math.round((correct / lesson.questions.length) * 100));
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex gap-4">
        <Sidebar />

        <main className="flex-1 space-y-4">
          <div className="app-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold" style={{ color: "rgba(15,23,42,.65)" }}>
                  SENARYO
                </div>
                <div className="text-2xl font-black">{meta.emoji} {meta.title}</div>
                <div className="text-sm mt-1" style={{ color: "rgba(15,23,42,.65)" }}>
                  AI sana bu ortama uygun mini ders üretiyor.
                </div>
              </div>

              <button className="app-btn app-btn-primary" onClick={() => location.reload()}>
                Yenile / Yeni ders 🔄
              </button>
            </div>
          </div>

          {loading && (
            <div className="app-card p-6">
              <div className="text-lg font-black">Ders hazırlanıyor…</div>
              <div className="text-sm mt-2" style={{ color: "rgba(15,23,42,.65)" }}>
                AI senaryoya uygun soru hazırlıyor.
              </div>
            </div>
          )}

          {lesson && (
            <>
              <div className="app-card p-6">
                <div className="text-xl font-black">{lesson.title}</div>
                <div className="text-sm mt-1" style={{ color: "rgba(15,23,42,.65)" }}>
                  CEFR: <b>{lesson.cefr}</b> • Objective: {lesson.objective}
                </div>
              </div>

              <div className="space-y-4">
                {lesson.questions.map((q, idx) => (
                  <div key={q.id} className="app-card p-6">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-black">
                        {idx + 1}) {q.prompt}
                      </div>
                      <div className="text-xs font-extrabold" style={{ color: "rgba(15,23,42,.60)" }}>
                        {q.skillTag} • d{q.difficulty}
                      </div>
                    </div>

                    {q.type === "mcq" ? (
                      <div className="mt-3 grid md:grid-cols-2 gap-2">
                        {(q.choices ?? []).map((c) => {
                          const active = (answers[q.id] ?? "") === c;
                          return (
                            <button
                              key={c}
                              className="app-btn"
                              onClick={() => setA(q.id, c)}
                              style={{
                                background: active ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.7)",
                                outline: active ? "3px solid rgba(34,197,94,.35)" : "none",
                              }}
                            >
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        value={answers[q.id] ?? ""}
                        onChange={(e) => setA(q.id, e.target.value)}
                        placeholder="Cevabı yaz…"
                        className="mt-3 w-full rounded-2xl p-3 border bg-white/70 outline-none"
                        style={{ borderColor: "rgba(15,23,42,.10)" }}
                      />
                    )}

                    <div className="mt-3 text-xs" style={{ color: "rgba(15,23,42,.65)" }}>
                      İpucu: {q.explanation}
                    </div>
                  </div>
                ))}
              </div>

              <div className="app-card p-6">
                <button className="app-btn app-btn-primary" onClick={finish}>
                  Dersi bitir ve skoru gör →
                </button>

                {score !== null && (
                  <div className="mt-4 text-lg font-black">
                    Skor: {score}/100
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
