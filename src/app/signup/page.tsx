"use client";

import { useState } from "react";
import Link from "next/link";
import { loginUser, userExists } from "@/lib/store";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("İsim gerekli");
      return;
    }
    if (!email.trim()) {
      setError("E-posta adresi gerekli");
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError("Şifre en az 6 karakter olmalı");
      return;
    }
    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }
    if (!agreed) {
      setError("Kullanım şartlarını kabul etmelisiniz");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    // Check if user already exists
    if (userExists(email)) {
      setError("Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın.");
      setLoading(false);
      return;
    }

    // Create new user with loginUser (handles both creation and login)
    loginUser(email, name);
    window.location.href = "/welcome/reason";
  }

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { width: "0%", color: "bg-white/10", text: "" };
    if (password.length < 6) return { width: "25%", color: "bg-red-500", text: "Zayıf" };
    if (password.length < 8) return { width: "50%", color: "bg-yellow-500", text: "Orta" };
    if (password.length < 12) return { width: "75%", color: "bg-blue-500", text: "İyi" };
    return { width: "100%", color: "bg-green-500", text: "Güçlü" };
  };

  const strength = getPasswordStrength();

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0a0a1a]">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-600/30 to-pink-600/30 blur-[100px] animate-blob" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-600/30 blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute top-[50%] right-[40%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-[80px] animate-blob animation-delay-4000" />
        
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
        {/* Left Panel - Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white text-2xl font-black">
                  F
                </div>
                <span className="text-xl font-bold text-white">FluentAI</span>
              </Link>
            </div>

            {/* Form Card */}
            <div className="relative animate-scale-in">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-3xl blur opacity-20 animate-gradient" />
              <div className="relative p-8 sm:p-10 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-black text-white mb-2">Hesap Oluştur</h2>
                  <p className="text-white/60">Ücretsiz kaydol ve öğrenmeye başla</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-fade-in flex items-center gap-3">
                      <span className="text-lg">⚠️</span>
                      {error}
                    </div>
                  )}

                  {/* Name Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white/80">Ad Soyad</label>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-0 group-focus-within:opacity-50 blur transition duration-300" />
                      <div className="relative flex items-center">
                        <span className="absolute left-4 text-white/40">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </span>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Adınız Soyadınız"
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 font-medium transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 focus:outline-none focus:bg-white/[0.08] focus:border-purple-500/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white/80">E-posta</label>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-0 group-focus-within:opacity-50 blur transition duration-300" />
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
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 font-medium transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 focus:outline-none focus:bg-white/[0.08] focus:border-purple-500/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white/80">Şifre</label>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-0 group-focus-within:opacity-50 blur transition duration-300" />
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
                          placeholder="En az 6 karakter"
                          className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 font-medium transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 focus:outline-none focus:bg-white/[0.08] focus:border-purple-500/50"
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
                    {/* Password Strength */}
                    {password && (
                      <div className="space-y-1">
                        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                          <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }} />
                        </div>
                        <p className="text-xs text-white/50">{strength.text}</p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white/80">Şifre Tekrar</label>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-0 group-focus-within:opacity-50 blur transition duration-300" />
                      <div className="relative flex items-center">
                        <span className="absolute left-4 text-white/40">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </span>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Şifrenizi tekrar girin"
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 font-medium transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 focus:outline-none focus:bg-white/[0.08] focus:border-purple-500/50"
                        />
                        {confirmPassword && password === confirmPassword && (
                          <span className="absolute right-4 text-green-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Terms Agreement */}
                  <label className="flex items-start gap-3 cursor-pointer group pt-2">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 transition-all ${agreed ? 'bg-purple-500 border-purple-500' : 'border-white/20 group-hover:border-white/40'}`}>
                        {agreed && (
                          <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-white/60 group-hover:text-white/80 transition">
                      <Link href="#" className="text-purple-400 hover:text-purple-300">Kullanım Şartları</Link> ve{" "}
                      <Link href="#" className="text-purple-400 hover:text-purple-300">Gizlilik Politikası</Link>&apos;nı okudum, kabul ediyorum.
                    </span>
                  </label>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full group mt-2"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300" />
                    <div className="relative w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-base transition-all duration-300 group-hover:shadow-lg group-hover:shadow-purple-500/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Hesap oluşturuluyor...
                        </>
                      ) : (
                        <>
                          Ücretsiz Kaydol
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </div>
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[#0a0a1a] text-white/40">veya şununla devam et</span>
                  </div>
                </div>

                {/* Social Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/[0.05] border border-white/10 font-semibold text-white/80 transition-all hover:bg-white/[0.1] hover:border-white/20">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/[0.05] border border-white/10 font-semibold text-white/80 transition-all hover:bg-white/[0.1] hover:border-white/20">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    Apple
                  </button>
                </div>

                {/* Login link */}
                <p className="text-center text-white/60 mt-6">
                  Zaten hesabın var mı?{" "}
                  <Link href="/login" className="font-semibold text-purple-400 hover:text-purple-300 transition">
                    Giriş yap
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-purple-500/25 transition-transform group-hover:scale-105">
                  F
                </div>
            <span className="text-xl font-bold text-white">FluentAI</span>
          </Link>

          {/* Main Content */}
          <div className="max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-6">
              Öğrenme Yolculuğun
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Burada Başlıyor
              </span>
            </h1>

            <p className="text-white/70 text-lg mb-8">
              Yapay zeka destekli kişisel öğrenme planı, interaktif dersler ve gerçek zamanlı geri bildirimlerle İngilizce öğren.
            </p>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: "🎯", title: "Kişisel Plan", desc: "Seviyene uygun içerik", color: "from-blue-500/20 to-cyan-500/20" },
                { icon: "🤖", title: "AI Destekli", desc: "Akıllı geri bildirim", color: "from-purple-500/20 to-pink-500/20" },
                { icon: "📈", title: "Hızlı İlerleme", desc: "Görünür sonuçlar", color: "from-green-500/20 to-emerald-500/20" },
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl`}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-bold text-white">{item.title}</div>
                    <div className="text-sm text-white/50">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/5">
              <p className="text-white/80 italic mb-4">
                &quot;3 ayda B1 seviyesinden B2&apos;ye geçtim. AI destekli pratikler gerçekten işe yarıyor!&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  E
                </div>
                <div>
                  <div className="font-semibold text-white">Elif K.</div>
                  <div className="text-sm text-white/50">B2 Seviye Öğrenci</div>
                </div>
              </div>
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
      </div>
    </main>
  );
}
