"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { loadUser } from "@/lib/store";

export default function PronunciationPage() {
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [targetSentence, setTargetSentence] = useState(
    "Hello, how are you today?"
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const user = loadUser();

  const exampleSentences: Record<string, string[]> = {
    A1: ["Hello", "I am happy", "Where is the park?"],
    A2: ["I would like some coffee", "Can you help me?", "What time is it?"],
    B1: ["I'm trying to find a good restaurant", "Could you explain that again?"],
    B2: ["I'd appreciate it if you could clarify", "Due to unexpected circumstances..."],
    C1: ["I'd like to ensure I fully understand the terms", "Given the current situation..."],
  };

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await assessPronunciation(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setResult(null);
    } catch (error) {
      alert("Mikrofon erişimi gerekli!");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  async function assessPronunciation(audioBlob: Blob) {
    setLoading(true);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          // Remove data:audio/webm;base64, prefix
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });

      const res = await fetch("/api/pronunciation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: base64Audio,
          expectedText: targetSentence,
          cefr: user.cefr || "B1",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Assessment failed");
      }

      setResult(data);
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
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-green-600/20 to-emerald-600/20 blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-600/20 blur-[80px] animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 border-b border-white/5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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
              <h1 className="text-xl font-black text-white">🎙️ Pronunciation Practice</h1>
              <p className="text-sm text-white/50">Record & assess your pronunciation</p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto p-6 space-y-6">
        {/* Target Sentence */}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-20" />
          <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white/60 mb-3">Target Sentence:</h2>
            <p className="text-2xl font-bold text-white mb-4">&quot;{targetSentence}&quot;</p>
            
            {/* Example Sentences */}
            <div className="space-y-2">
              <p className="text-xs text-white/50">Quick examples ({user.cefr || "B1"}):</p>
              <div className="flex flex-wrap gap-2">
                {(exampleSentences[user.cefr || "B1"] || exampleSentences.B1).map((sentence, i) => (
                  <button
                    key={i}
                    onClick={() => setTargetSentence(sentence)}
                    className="px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-white/70 hover:text-white transition"
                  >
                    {sentence}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recording Control */}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-20" />
          <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
            {!recording && !loading && (
              <button
                onClick={startRecording}
                className="relative group mx-auto"
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur opacity-60 group-hover:opacity-100 transition" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                </div>
              </button>
            )}

            {recording && (
              <button
                onClick={stopRecording}
                className="relative group mx-auto animate-pulse"
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full blur opacity-60" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-r from-red-600 to-pink-500 flex items-center justify-center">
                  <div className="w-8 h-8 rounded bg-white" />
                </div>
              </button>
            )}

            {loading && (
              <div className="mx-auto w-24 h-24 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}

            <p className="mt-4 text-sm text-white/60">
              {recording ? "Recording... Click to stop" : loading ? "Analyzing..." : "Click to start recording"}
            </p>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="relative animate-scale-in">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-20" />
            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Results</h3>
                <div className="px-4 py-2 rounded-full bg-blue-500/20 text-blue-400 text-xl font-black">
                  {result.accuracy}%
                </div>
              </div>

              <div>
                <p className="text-sm text-white/50 mb-1">You said:</p>
                <p className="text-white font-medium">&quot;{result.transcribed}&quot;</p>
              </div>

              <div>
                <p className="text-sm text-white/50 mb-1">Expected:</p>
                <p className="text-white/70">&quot;{result.expected}&quot;</p>
              </div>

              {result.feedback && (
                <div className="p-4 rounded-xl bg-white/[0.05]">
                  <p className="text-white text-sm leading-relaxed">{result.feedback}</p>
                </div>
              )}

              {result.tips && result.tips.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-white/80 mb-2">Tips:</p>
                  <ul className="space-y-1">
                    {result.tips.map((tip: string, i: number) => (
                      <li key={i} className="text-sm text-white/60 flex items-start gap-2">
                        <span className="text-green-400">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
