"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a1a] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/5' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-500/25 transition-transform group-hover:scale-105">
                F
              </div>
              <span className="text-lg font-bold hidden sm:block">FluentAI</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2.5 text-sm font-semibold text-white/70 hover:text-white transition"
              >
                Giriş Yap
              </Link>
              <Link
                href="/signup"
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition" />
                <div className="relative px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl">
                  Ücretsiz Başla
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-[10%] left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 blur-[120px] animate-blob" />
          <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 blur-[100px] animate-blob animation-delay-2000" />
          <div className="absolute top-[50%] left-[50%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-[80px] animate-blob animation-delay-4000" />
          
          {/* Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-medium text-white/70">AI Destekli Dil Öğrenimi</span>
              </div>

              {/* Heading */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] animate-slide-up">
                İngilizceyi
                <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
                  Akıllıca Öğren
                </span>
              </h1>

              {/* Description */}
              <p className="text-xl text-white/60 max-w-lg leading-relaxed animate-slide-up" style={{ animationDelay: '100ms' }}>
                Yapay zeka destekli kişisel öğrenme planı, interaktif dersler ve gerçek zamanlı geri bildirimlerle hedeflerine daha hızlı ulaş.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
                <Link href="/signup" className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-300" />
                  <div className="relative inline-flex items-center justify-center px-8 py-4 text-base font-bold bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl transition-transform group-hover:scale-[1.02]">
                    Ücretsiz Başla
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white/80 bg-white/[0.05] border border-white/10 rounded-2xl hover:bg-white/[0.1] hover:border-white/20 transition-all"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Demo İncele
                </Link>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-6 pt-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
                <div className="flex -space-x-3">
                  {["bg-blue-500", "bg-purple-500", "bg-cyan-500", "bg-pink-500"].map((color, i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-full ${color} border-2 border-[#0a0a1a] flex items-center justify-center text-sm font-bold`}
                    >
                      {["🎓", "📚", "🎯", "✨"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="font-bold">10,000+ Öğrenci</div>
                  <div className="text-sm text-white/50">hedeflerine ulaştı</div>
                </div>
              </div>
            </div>

            {/* Right Content - Dashboard Preview */}
            <div className="relative animate-scale-in" style={{ animationDelay: '400ms' }}>
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-2xl" />
              
              {/* Main Card */}
              <div className="relative p-1 rounded-3xl bg-gradient-to-br from-white/10 to-white/5">
                <div className="p-6 sm:p-8 rounded-3xl bg-[#0f0f23]/90 backdrop-blur-xl border border-white/5">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-3xl">
                      🤖
                    </div>
                    <div>
                      <div className="font-bold text-lg">AI Öğrenme Asistanı</div>
                      <div className="text-sm text-white/50">Kişisel ders planın hazır</div>
                    </div>
                    <div className="ml-auto w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                  </div>

                  {/* Stats */}
                  <div className="space-y-4 mb-6">
                    {[
                      { icon: "📚", title: "Günlük Kelime Hedefi", value: "15/20", progress: 75, color: "from-blue-500 to-cyan-500" },
                      { icon: "✅", title: "Tamamlanan Dersler", value: "3/5", progress: 60, color: "from-green-500 to-emerald-500" },
                      { icon: "🔥", title: "Günlük Seri", value: "7 gün", progress: 100, color: "from-orange-500 to-red-500" },
                    ].map((stat, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{stat.icon}</span>
                            <span className="font-medium text-white/80">{stat.title}</span>
                          </div>
                          <span className="font-bold">{stat.value}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${stat.color}`}
                            style={{ width: `${stat.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Suggestion */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💡</span>
                      <div>
                        <div className="font-semibold">Bugünün Önerisi</div>
                        <div className="text-sm text-white/60">Past Tense konusunu pratik yap</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur border border-white/10 animate-float">
                <div className="text-2xl">⚡</div>
                <div className="text-xs font-bold mt-1">+50 XP</div>
              </div>
              <div className="absolute -bottom-4 -left-4 p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur border border-white/10 animate-float" style={{ animationDelay: '1s' }}>
                <div className="text-2xl">🏆</div>
                <div className="text-xs font-bold mt-1">Level 5</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 mb-6">
              <span className="text-sm font-medium text-white/70">Özellikler</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              Neden{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                FluentAI?
              </span>
            </h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">
              Geleneksel yöntemlerden farklı, yapay zeka destekli modern öğrenme deneyimi
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Large Feature Card */}
            <div className="md:col-span-2 lg:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/5 hover:border-white/10 transition-all group">
              <div className="flex flex-col lg:flex-row items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                  🎯
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3">Kişisel Öğrenme Planı</h3>
                  <p className="text-white/60 text-lg leading-relaxed mb-4">
                    AI, seviyeni analiz eder ve sana özel bir öğrenme yolu oluşturur. Her gün senin için optimize edilmiş dersler ve alıştırmalar.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["CEFR Uyumlu", "Adaptif", "Kişiselleştirilmiş"].map((tag, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-white/[0.05] text-sm text-white/60">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Small Feature Cards */}
            {[
              { icon: "🤖", title: "AI Destekli Pratik", desc: "Yazma, okuma ve dinleme becerilerini AI ile geliştir", gradient: "from-purple-500/20 to-pink-500/20" },
              { icon: "📊", title: "Detaylı İlerleme", desc: "Güçlü ve zayıf yönlerini gör", gradient: "from-cyan-500/20 to-blue-500/20" },
              { icon: "🎮", title: "Oyunlaştırılmış", desc: "XP kazan, seviye atla, serilerini koru", gradient: "from-green-500/20 to-emerald-500/20" },
              { icon: "⚡", title: "Hızlı Sonuçlar", desc: "Spaced repetition ile kalıcı öğrenme", gradient: "from-orange-500/20 to-red-500/20" },
            ].map((feature, i) => (
              <div 
                key={i} 
                className={`p-6 rounded-3xl bg-gradient-to-br ${feature.gradient} border border-white/5 hover:border-white/10 transition-all group`}
              >
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              Nasıl{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Çalışır?
              </span>
            </h2>
            <p className="text-xl text-white/50">3 basit adımda öğrenmeye başla</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Seviyeni Belirle", desc: "Kısa bir test ile mevcut İngilizce seviyeni öğren", icon: "📝" },
              { step: "02", title: "Planını Al", desc: "AI senin için kişisel bir öğrenme planı oluşturur", icon: "🎯" },
              { step: "03", title: "Öğrenmeye Başla", desc: "İnteraktif dersler ve AI destekli pratiklerle ilerle", icon: "🚀" },
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-white/20 to-transparent" />
                )}
                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-4xl mx-auto mb-6">
                    {item.icon}
                  </div>
                  <div className="text-sm font-bold text-purple-400 mb-2">{item.step}</div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-white/60">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              Öğrenciler{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Ne Diyor?
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Elif K.", level: "B2 Seviye", text: "3 ayda B1'den B2'ye geçtim. AI destekli pratikler gerçekten işe yarıyor!", avatar: "E" },
              { name: "Mehmet A.", level: "B1 Seviye", text: "Kişiselleştirilmiş dersler sayesinde odaklanmam gereken konuları çok daha iyi anladım.", avatar: "M" },
              { name: "Zeynep S.", level: "A2 Seviye", text: "Oyunlaştırılmış sistem motivasyonumu yüksek tutuyor. Her gün düzenli çalışıyorum.", avatar: "Z" },
            ].map((testimonial, i) => (
              <div key={i} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/70 mb-6 leading-relaxed">&quot;{testimonial.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-white/50">{testimonial.level}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
            
            <div className="relative z-10 p-8 sm:p-12 lg:p-16 text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
                Öğrenmeye Başlamaya Hazır mısın?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Hemen ücretsiz kaydol ve kişiselleştirilmiş öğrenme yolculuğuna başla.
              </p>
              <Link href="/signup" className="relative inline-flex group">
                <div className="absolute -inset-1 bg-white/30 rounded-2xl blur group-hover:blur-md transition" />
                <div className="relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-blue-600 bg-white rounded-2xl transition-transform group-hover:scale-105">
                  Ücretsiz Kaydol
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xl font-black">
                F
              </div>
              <span className="text-lg font-bold">FluentAI</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-white/50">
              <Link href="#" className="hover:text-white transition">Hakkımızda</Link>
              <Link href="#" className="hover:text-white transition">Gizlilik</Link>
              <Link href="#" className="hover:text-white transition">Şartlar</Link>
              <Link href="#" className="hover:text-white transition">İletişim</Link>
            </div>
            <div className="text-sm text-white/40">
              © 2024 FluentAI. Tüm hakları saklıdır.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
