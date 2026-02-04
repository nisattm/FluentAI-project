"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadUser } from "@/lib/store";

interface Message {
  role: "user" | "ai";
  text: string;
  timestamp: number;
}

export default function AITutorPage() {
  const router = useRouter();
  const [user, setUser] = useState(() => loadUser());
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Hello! I'm your personal English tutor. Ask me anything about grammar, vocabulary, or usage!",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = loadUser();
    if (!u.isAuthed) {
      window.location.href = "/login";
      return;
    }
    setUser(u);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      text: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Build conversation history
      const history = messages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const res = await fetch("/api/tutor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text,
          conversationHistory: history,
          cefr: user.cefr || "B1",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const aiMessage: Message = {
        role: "ai",
        text: data.response || data.aiResponse || "No response received",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: "ai",
        text: `Sorry, an error occurred: ${error.message}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  function useQuickQuestion(question: string) {
    setInput(question);
  }

  return (
    <main className="min-h-screen bg-[#0a0a1a] flex flex-col">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-600/20 blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-600/20 blur-[90px] animate-blob animation-delay-4000" />
      </div>

      {/* Fixed Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-white/[0.02] flex-shrink-0">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition border border-white/10"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                AI Tutor
              </h1>
              <p className="text-sm text-white/50">Your personal English assistant</p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-400 text-sm font-bold border border-purple-500/30">
            {user.cefr || "B1"} Level
          </div>
        </div>
      </header>

      {/* Chat Messages Area - Scrollable */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              <div className="flex items-start gap-3 max-w-[85%] md:max-w-[75%]">
                {msg.role === "ai" && (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 text-white font-black">
                    AI
                  </div>
                )}
                <div
                  className={`flex-1 ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl rounded-tr-md p-4"
                      : "bg-white/[0.05] backdrop-blur-xl border border-white/10 text-white rounded-2xl rounded-tl-md p-4"
                  }`}
                >
                  <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-xs opacity-50 mt-2 block">
                    {new Date(msg.timestamp).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {msg.role === "user" && (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 text-white font-black">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex items-start gap-3 max-w-[75%]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 text-white font-black">
                  AI
                </div>
                <div className="bg-white/[0.05] backdrop-blur-xl border border-white/10 p-4 rounded-2xl rounded-tl-md">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/50 animate-pulse" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/50 animate-pulse animation-delay-200" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/50 animate-pulse animation-delay-400" />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="relative z-10 border-t border-white/5 backdrop-blur-xl bg-white/[0.02] flex-shrink-0">
        <div className="max-w-5xl mx-auto px-6 py-4 space-y-3">
          {/* Quick Questions */}
          <div className="flex flex-wrap gap-2">
            {[
              "What's the difference between 'good' and 'well'?",
              "How do I use present perfect?",
              "Explain past tense irregular verbs",
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => useQuickQuestion(q)}
                disabled={loading}
                className="px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-white/70 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Field */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl blur opacity-20" />
            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-3 flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask about grammar, vocabulary, usage..."
                className="flex-1 bg-transparent text-white placeholder:text-white/30 focus:outline-none text-sm md:text-base"
                disabled={loading}
                autoFocus
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  loading || !input.trim()
                    ? "bg-white/[0.05] text-white/30 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:scale-105 shadow-lg"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animation delays */}
      <style jsx global>{`
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </main>
  );
}
