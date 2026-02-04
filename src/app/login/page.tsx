"use client";

import { useState } from "react";
import Link from "next/link";
import { loginUser, userExists } from "@/lib/store";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("E-posta adresi gerekli");
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError("Şifre en az 6 karakter olmalı");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    // Check if user exists (returning user)
    const exists = userExists(email);

    // Login (loads existing data or creates new user)
    const user = loginUser(email);

    // Redirect based on user status - check ALL required fields for dashboard
    const isFullySetup = user.lastPlacement && user.dailyMinutes;

    if (exists && isFullySetup) {
      // Returning user with completed setup - go to dashboard
      window.location.href = "/dashboard";
    } else if (exists && user.lastPlacement && !user.dailyMinutes) {
      // Has placement but no daily minutes - go to minutes setup
      window.location.href = "/onboarding/minutes";
    } else if (exists && !user.lastPlacement) {
      // Returning user but no placement - needs level check
      window.location.href = "/welcome/reason";
    } else {
      // New user - start onboarding
      window.location.href = "/welcome/reason";
    }
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0a0a1a]">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-600/30 to-purple-600/30 blur-[100px] animate-blob" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-[80px] animate-blob animation-delay-4000" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/25 transition-transform group-hover:scale-105">
              F
            </div>
            <span className="text-xl font-bold text-white">FluentAI</span>
          </Link>

          {/* Main Content */}
          <div className="max-w-lg">
            {/* Glassmorphic Card */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur opacity-25" />
              <div className="relative p-8 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-3xl">
                    🤖
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">AI Learning Platform</h3>
                    <p className="text-white/60 text-sm">Kişiselleştirilmiş dil öğrenimi</p>
                  </div>
                </div>

                <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4">
                  İngilizceyi
                  <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Akıllıca Öğren
                  </span>
                </h1>

                <p className="text-white/70 text-lg mb-8">
                  Yapay zeka destekli kişisel öğrenme planı ve gerçek zamanlı geri bildirimlerle hedeflerine ulaş.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: "10K+", label: "Öğrenci" },
                    { value: "95%", label: "Başarı" },
                    { value: "4.9", label: "Puan" },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-3 rounded-xl bg-white/[0.05]">
                      <div className="text-2xl font-black text-white">{stat.value}</div>
                      <div className="text-xs text-white/50 font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mt-8">
              {["AI Destekli", "Kişisel Plan", "Gerçek Zamanlı"].map((tag, i) => (
                <span key={i} className="px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 text-sm font-medium text-white/70">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 text-sm text-white/40">
            <span>© 2024 FluentAI</span>
            <span>•</span>
            <Link href="#" className="hover:text-white/70 transition">Gizlilik</Link>
            <span>•</span>
            <Link href="#" className="hover:text-white/70 transition">Şartlar</Link>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-2xl font-black">
                  F
                </div>
                <span className="text-xl font-bold text-white">FluentAI</span>
              </Link>
            </div>

            {/* Form Card */}
            <div className="relative animate-scale-in">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-3xl blur opacity-20 animate-gradient" />
              <div className="relative p-8 sm:p-10 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black text-white mb-2">Hoş Geldin!</h2>
                  <p className="text-white/60">Hesabına giriş yap ve öğrenmeye devam et</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-fade-in flex items-center gap-3">
                      <span className="text-lg">⚠️</span>
                      {error}
                    </div>
                  )}

                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white/80">E-posta</label>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-focus-within:opacity-50 blur transition duration-300" />
                      <div className="relative flex items-center">
                        <span className="absolute left-4 text-white/40">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </span>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ornek@email.com"
                          className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 font-medium transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 focus:outline-none focus:bg-white/[0.08] focus:border-blue-500/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white/80">Şifre</label>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-focus-within:opacity-50 blur transition duration-300" />
                      <div className="relative flex items-center">
                        <span className="absolute left-4 text-white/40">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </span>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-12 pr-12 py-4 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 font-medium transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 focus:outline-none focus:bg-white/[0.08] focus:border-blue-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 text-white/40 hover:text-white/70 transition"
                        >
                          {showPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remember & Forgot */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-md border-2 transition-all ${rememberMe ? 'bg-blue-500 border-blue-500' : 'border-white/20 group-hover:border-white/40'}`}>
                          {rememberMe && (
                            <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-white/60 group-hover:text-white/80 transition">Beni hatırla</span>
                    </label>
                    <Link href="#" className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition">
                      Şifremi unuttum
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full group"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300" />
                    <div className="relative w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-base transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Giriş yapılıyor...
                        </>
                      ) : (
                        <>
                          Giriş Yap
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </div>
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[#0a0a1a] text-white/40">veya şununla devam et</span>
                  </div>
                </div>

                {/* Social Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-white/[0.05] border border-white/10 font-semibold text-white/80 transition-all hover:bg-white/[0.1] hover:border-white/20">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-white/[0.05] border border-white/10 font-semibold text-white/80 transition-all hover:bg-white/[0.1] hover:border-white/20">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    Apple
                  </button>
                </div>

                {/* Sign up link */}
                <p className="text-center text-white/60 mt-8">
                  Hesabın yok mu?{" "}
                  <Link href="/signup" className="font-semibold text-blue-400 hover:text-blue-300 transition">
                    Ücretsiz kaydol
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
