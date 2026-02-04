"use client";

import { useState } from "react";
import { loadUser, saveUser } from "@/lib/store";

export default function MinutesPage() {
  const u = loadUser();
  const [mins, setMins] = useState<number>(u.dailyMinutes ?? 10);

  function save() {
    const dailyWordTarget = Math.max(5, Math.min(30, Math.round(mins * 1.5)));
    saveUser({ ...u, dailyMinutes: mins, dailyWordTarget });
    window.location.href = "/dashboard";
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0B1020] text-white p-6">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/10 p-6">
        <h1 className="text-2xl font-black">Daily Minutes</h1>
        <p className="text-white/70 text-sm mt-2">Günde kaç dakika çalışacaksın?</p>

        <input
          type="number"
          className="mt-4 w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none"
          value={mins}
          min={5}
          max={60}
          onChange={(e) => setMins(Number(e.target.value))}
        />

        <button className="mt-4 w-full rounded-xl bg-white text-black py-3 font-bold" onClick={save}>
          Save & Continue →
        </button>
      </div>
    </main>
  );
}
