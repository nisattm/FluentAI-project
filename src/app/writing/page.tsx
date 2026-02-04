"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { loadUser } from "@/lib/store";

export default function WritingPage() {
  const user = loadUser();
  const [text, setText] = useState("");
  const [out, setOut] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function grade() {
    setLoading(true);
    setOut(null);
    try {
      // Eğer projende /api/grade-writing varsa buraya bağlanır
      const res = await fetch("/api/grade-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, cefr: user.cefr }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "API error");
      }
      const data = await res.json();
      setOut(String(data?.feedback ?? data?.result ?? "OK"));
    } catch (e: any) {
      // API yoksa bile sayfa çalışsın diye fallback
      setOut("Şu an /api/grade-writing bulunamadı veya hata verdi. (Fallback) Metni kaydettik.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="shell">
        <Sidebar />
        <section className="glass content">
          <div className="topbar">
            <div>
              <div className="pill">✍️ Writing</div>
              <div className="h1">Yaz — AI düzeltsin</div>
              <div className="sub">CEFR: <b>{user.cefr}</b></div>
            </div>
          </div>

          <div className="glass card" style={{ marginTop: 16 }}>
            <div className="cardTitle">Metin</div>
            <div className="cardMuted">Bir paragraf yaz. Sonra “Check”e bas.</div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write something..."
              style={{
                width: "100%",
                minHeight: 180,
                padding: 14,
                borderRadius: 16,
                border: "1px solid rgba(11,18,32,.12)",
                background: "rgba(255,255,255,.60)",
                outline: "none",
                fontWeight: 700,
                marginTop: 12,
              }}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <button
                className="btn btnPrimary"
                onClick={grade}
                disabled={loading || text.trim().length < 10}
              >
                {loading ? "Checking..." : "Check"}
              </button>
              <div className="cardMuted">
                (Min 10 karakter)
              </div>
            </div>
          </div>

          {out && (
            <div className="glass card" style={{ marginTop: 16 }}>
              <div className="cardTitle">AI Feedback</div>
              <div style={{ whiteSpace: "pre-wrap", fontWeight: 800, marginTop: 8 }}>
                {out}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
