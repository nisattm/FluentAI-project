"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  XP,
  loadUser,
  saveUser,
  needsLevelUp,
  type Skill,
  type User,
} from "@/lib/store";

type ScenarioId = "hotel" | "hospital" | "airport";

type ScenarioData = {
  scenarioId: ScenarioId;
  title: string;
  cefr: string;
  vocab: { term: string; tr: string; example: string }[];
  dialogue: { role: "AI" | "You"; text: string }[];
  quiz: {
    id: string;
    type: "mcq";
    prompt: string;
    choices: string[];
    answerIndex: number;
    explanation?: string;
    skill?: Skill;
  }[];
};

type Step = "pick" | "vocab" | "dialogue" | "quiz" | "done";

export default function AiLearnPage() {
  const [user, setUser] = useState<User>(() => loadUser());

  const [step, setStep] = useState<Step>("pick");
  const [scenario, setScenario] = useState<ScenarioId>("hotel");
  const [data, setData] = useState<ScenarioData | null>(null);
  const [loading, setLoading] = useState(false);

  // quiz state
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [showExplain, setShowExplain] = useState(false);

  // Guard
  useEffect(() => {
    const u = loadUser();
    if (!u.isAuthed) return void (window.location.href = "/login");
    if (!u.lastPlacement) return void (window.location.href = "/placement");
    if (!u.dailyMinutes) return void (window.location.href = "/onboarding/minutes");
    if (needsLevelUp(u)) return void (window.location.href = "/levelup");
    setUser(u);
  }, []);

  const scenarioCards = useMemo(
    () =>
      [
        { id: "hotel", title: "Hotel", sub: "Check-in / room", emoji: "🏨" },
        { id: "hospital", title: "Hospital", sub: "Doctor visit", emoji: "🏥" },
        { id: "airport", title: "Airport", sub: "Check-in / gate", emoji: "✈️" },
      ] as const,
    []
  );

  async function fetchScenario(nextScenario: ScenarioId) {
    setLoading(true);
    setData(null);
    setStep("vocab");
    setScenario(nextScenario);

    try {
      const u = loadUser();
      const res = await fetch(`/api/scenario?scenario=${nextScenario}&cefr=${u.cefr}`);
      const json = (await res.json()) as ScenarioData;
      if (!res.ok) throw new Error("scenario api error");
      setData(json);

      // reset quiz state
      setQIndex(0);
      setPicked(null);
      setAnswers({});
      setShowExplain(false);
    } catch {
      // fallback: geri pick ekranına
      setStep("pick");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function grantXP(amount: number, title: string, correct: number, total: number, skill: Skill) {
    const u = loadUser();
    const next: User = {
      ...u,
      xpTotal: (u.xpTotal ?? 0) + amount,
      levelXp: (u.levelXp ?? 0) + amount,
      history: [
        {
          atISO: new Date().toISOString(),
          lessonTitle: title,
          correct,
          total,
          xpEarned: amount,
          skill,
        },
        ...(u.history ?? []),
      ],
    };
    saveUser(next);
    setUser(next);
  }

  const currentQ = data?.quiz?.[qIndex];

  function answer(choiceIndex: number) {
    if (!currentQ || showExplain) return;
    setPicked(choiceIndex);

    const ok = choiceIndex === currentQ.answerIndex;
    setAnswers((p) => ({ ...p, [currentQ.id]: ok }));
    setShowExplain(true);

    if (ok) {
      grantXP(
        XP.CORRECT_ANSWER,
        `AI Learn Quiz: ${data?.title ?? "Scenario"}`,
        1,
        1,
        (currentQ.skill ?? "vocab") as Skill
      );
    }
  }

  function nextQ() {
    if (!data) return;
    setPicked(null);
    setShowExplain(false);

    if (qIndex + 1 >= data.quiz.length) {
      setStep("done");
      return;
    }
    setQIndex((x) => x + 1);
  }

  const quizScore = useMemo(() => {
    const vals = Object.values(answers);
    const correct = vals.filter(Boolean).length;
    const total = data?.quiz?.length ?? 0;
    return { correct, total };
  }, [answers, data]);

  return (
    <main className="page">
      <div className="shell">
        <Sidebar />

        <section className="glass content">
          <div className="topbar">
            <div>
              <div className="pill">🤖 AI ile öğrenme</div>
              <div className="h1">Senaryo → Kelimeler → Diyalog → Quiz</div>
              <div className="sub">
                CEFR: <b>{user.cefr}</b>
                {data ? (
                  <>
                    {" "}
                    • Senaryo: <b>{data.title}</b>
                  </>
                ) : null}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" onClick={() => setStep("pick")}>
                🧭 Senaryo değiştir
              </button>
              {data && (
                <button className="btn btnPrimary" onClick={() => fetchScenario(scenario)}>
                  ↻ Yenile
                </button>
              )}
            </div>
          </div>

          {/* STEPS */}
          <div className="glass card" style={{ marginTop: 16 }}>
            <div className="cardTitle">Adımlar</div>
            <div className="cardMuted" style={{ marginTop: 6 }}>
              1) Senaryo seç • 2) Kelime öğren • 3) Mini diyalog • 4) Quiz
            </div>
          </div>

          {/* PICK */}
          {step === "pick" && (
            <div className="grid3" style={{ marginTop: 16 }}>
              {scenarioCards.map((c) => (
                <button
                  key={c.id}
                  className="glass card"
                  style={{ textAlign: "left", cursor: "pointer" }}
                  onClick={() => fetchScenario(c.id)}
                >
                  <div className="cardTitle">
                    {c.emoji} {c.title}
                  </div>
                  <div className="cardMuted">{c.sub}</div>
                </button>
              ))}
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div className="glass card" style={{ marginTop: 16 }}>
              <div className="cardTitle">Yükleniyor…</div>
              <div className="cardMuted">Senaryo hazırlanıyor.</div>
            </div>
          )}

          {/* VOCAB */}
          {step === "vocab" && data && (
            <div className="glass card" style={{ marginTop: 16 }}>
              <div className="cardTitle">📚 Kelimeler</div>
              <div className="cardMuted">Önce kelimeleri oku. Sonra diyaloga geç.</div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {data.vocab.map((v) => (
                  <div
                    key={v.term}
                    className="glass card"
                    style={{ padding: 14, background: "rgba(255,255,255,.60)" }}
                  >
                    <div style={{ fontWeight: 950 }}>{v.term} — {v.tr}</div>
                    <div style={{ opacity: 0.8, marginTop: 4 }}>{v.example}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <button className="btn" onClick={() => setStep("pick")}>← Geri</button>
                <button className="btn btnPrimary" onClick={() => setStep("dialogue")}>
                  Diyalog → 
                </button>
              </div>
            </div>
          )}

          {/* DIALOGUE */}
          {step === "dialogue" && data && (
            <div className="glass card" style={{ marginTop: 16 }}>
              <div className="cardTitle">💬 Mini Diyalog</div>
              <div className="cardMuted">Satırları oku. Sonra quiz’e geç.</div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {data.dialogue.map((d, i) => (
                  <div
                    key={i}
                    className="glass card"
                    style={{
                      padding: 14,
                      background: d.role === "AI" ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.60)",
                      border: "1px solid rgba(0,0,0,.08)",
                    }}
                  >
                    <div style={{ fontWeight: 950 }}>
                      {d.role === "AI" ? "AI" : "You"}:
                    </div>
                    <div style={{ marginTop: 4, fontWeight: 700 }}>{d.text}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <button className="btn" onClick={() => setStep("vocab")}>← Kelimeler</button>
                <button className="btn btnPrimary" onClick={() => setStep("quiz")}>
                  Quiz →
                </button>
              </div>
            </div>
          )}

          {/* QUIZ */}
          {step === "quiz" && data && (
            <div className="glass card" style={{ marginTop: 16 }}>
              <div className="cardTitle">✅ Quiz</div>
              <div className="cardMuted">
                Soru {qIndex + 1}/{data.quiz.length} • Skor: {quizScore.correct}/{quizScore.total}
              </div>

              {currentQ && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 950, fontSize: 18 }}>{currentQ.prompt}</div>

                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    {currentQ.choices.map((c, i) => {
                      const isCorrect = i === currentQ.answerIndex;
                      const chosen = picked === i;

                      const style =
                        showExplain
                          ? isCorrect
                            ? "border-emerald-300/60 bg-emerald-300/15"
                            : chosen
                            ? "border-rose-300/60 bg-rose-300/15"
                            : "border-white/10 bg-black/10"
                          : "border-white/10 bg-black/10 hover:bg-white/10";

                      return (
                        <button
                          key={i}
                          className={`btn ${style}`}
                          style={{ textAlign: "left", padding: 14 }}
                          disabled={showExplain}
                          onClick={() => answer(i)}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>

                  {showExplain && (
                    <div className="glass card" style={{ marginTop: 12 }}>
                      <div style={{ fontWeight: 950 }}>
                        Doğru cevap: {currentQ.choices[currentQ.answerIndex]}
                        {" "}
                        {picked === currentQ.answerIndex ? "✅" : "❌"}
                      </div>
                      {currentQ.explanation && (
                        <div className="cardMuted" style={{ marginTop: 6 }}>
                          {currentQ.explanation}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                    <button className="btn" onClick={() => setStep("dialogue")}>← Diyalog</button>
                    <button className="btn btnPrimary" onClick={nextQ} disabled={!showExplain}>
                      {qIndex + 1 >= data.quiz.length ? "Bitir →" : "Sonraki →"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DONE */}
          {step === "done" && data && (
            <div className="glass card" style={{ marginTop: 16 }}>
              <div className="cardTitle">🎉 Tamamlandı!</div>
              <div className="cardMuted" style={{ marginTop: 6 }}>
                Senaryo: <b>{data.title}</b> • Quiz skoru: <b>{quizScore.correct}/{quizScore.total}</b>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <button className="btn" onClick={() => setStep("pick")}>Yeni senaryo</button>
                <button className="btn btnPrimary" onClick={() => setStep("vocab")}>
                  Aynı senaryoyu tekrar et
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
