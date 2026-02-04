"use client";

import { useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { loadUser, type CEFR } from "@/lib/store";

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const BANK: Record<CEFR, readonly string[]> = {
  A1: ["I have a pen.", "Where is the bus?", "I like coffee.", "This is my bag."],
  A2: [
    "I went to the market yesterday.",
    "Can you help me, please?",
    "I want to book a hotel room.",
  ],
  B1: [
    "I’m looking for a pharmacy near here.",
    "Could you repeat that more slowly?",
    "I need to reschedule my appointment.",
  ],
  B2: [
    "I’d like to file a complaint about my reservation.",
    "The flight has been delayed due to weather conditions.",
  ],
  C1: [
    "I’d appreciate it if you could clarify the terms and conditions before I proceed.",
  ],
};

export default function SpeakingPage() {
  const user = loadUser();

  const sentences = useMemo(() => {
    const arr = BANK[user.cefr] ?? BANK.A1;
    return arr.length ? arr : BANK.A1;
  }, [user.cefr]);

  // ✅ FIX: state'i açıkça string yap (literal union'a kilitlenmesin)
  const [current, setCurrent] = useState<string>(() => sentences[0] ?? "Hello!");
  const [input, setInput] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);

  function speak() {
    if (typeof window === "undefined") return;

    const u = new SpeechSynthesisUtterance(current);
    u.lang = "en-US";
    u.rate = 0.95;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setResult(null);
  }

  function next() {
    const pick = sentences[Math.floor(Math.random() * sentences.length)] ?? sentences[0];
    setCurrent(pick);
    setInput("");
    setResult(null);
  }

  function check() {
    const a = normalize(current);
    const b = normalize(input);

    if (!b) {
      setResult("Önce yaz ✍️");
      return;
    }

    if (a === b) {
      setResult("✅ Doğru!");
      return;
    }

    // basit yakınlık: kelime kesişimi
    const aw = new Set(a.split(" "));
    const bw = new Set(b.split(" "));
    let hit = 0;

    for (const w of bw) if (aw.has(w)) hit++;

    const pct = Math.round((hit / Math.max(1, aw.size)) * 100);
    setResult(`❌ Tam değil. Benzerlik: %${pct}. Tekrar dinle.`);
  }

  return (
    <main className="page">
      <div className="shell">
        <Sidebar />
        <section className="glass content">
          <div className="topbar">
            <div>
              <div className="pill">🎧 Listening</div>
              <div className="h1">AI konuşur, sen yazarsın</div>
              <div className="sub">
                CEFR: <b>{user.cefr}</b> • “Play” → yaz → Check
              </div>
            </div>
          </div>

          <div className="grid3">
            <div className="glass card" style={{ gridColumn: "span 2" }}>
              <div className="cardTitle">Cümle</div>
              <div className="cardMuted">Play’e bas — sonra duyduğunu yaz.</div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                <button className="btn btnPrimary" onClick={speak}>
                  ▶ Play
                </button>
                <button className="btn" onClick={next}>
                  🔁 Yeni cümle
                </button>
                <button
                  className="btn"
                  onClick={() =>
                    alert(
                      "İpucu: Daha yavaş dinlemek için u.rate değerini 0.8-0.9 yapabilirsin."
                    )
                  }
                >
                  💡 İpucu
                </button>
              </div>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Buraya yaz..."
                style={{
                  width: "100%",
                  minHeight: 140,
                  padding: 14,
                  borderRadius: 16,
                  border: "1px solid rgba(11,18,32,.12)",
                  background: "rgba(255,255,255,.60)",
                  outline: "none",
                  fontWeight: 800,
                  marginTop: 12,
                }}
              />

              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
                <button className="btn btnPrimary" onClick={check}>
                  Check
                </button>
                {result && <div style={{ fontWeight: 950 }}>{result}</div>}
              </div>
            </div>

            <div className="glass card">
              <div className="cardTitle">Doğru cümle</div>
              <div style={{ whiteSpace: "pre-wrap", fontWeight: 900, lineHeight: 1.5 }}>
                {current}
              </div>
              <div className="cardMuted" style={{ marginTop: 10 }}>
                Not: Şu an local cümle bankası. İstersen bir sonraki adımda bunu da AI API’den
                ürettiririz.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
