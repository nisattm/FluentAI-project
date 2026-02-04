# Adaptive Duo — Bilgisayarda Çalıştırma Rehberi

Bu proje **Next.js 16** ile yazılmış bir dil öğrenme uygulamasıdır. Aşağıdaki adımları takip ederek kendi bilgisayarınızda çalıştırabilirsiniz.

---

## 1. Gereksinimler

- **Node.js** sürüm **18** veya üzeri (tercihen 20+)
  - Yüklü değilse: [https://nodejs.org](https://nodejs.org) adresinden indirip kurun.
  - Kontrol için: `node -v` ve `npm -v` yazıp Enter'a basın.

---

## 2. Proje Klasörüne Girin

**PowerShell** veya **CMD** açın ve projenin bulunduğu klasöre gidin:

```powershell
cd "c:\Users\nisa_\Desktop\Projects (1)\Projects\adaptive-duo"
```

*(Kendi proje yolunuz farklıysa o yolu yazın.)*

---

## 3. Bağımlılıkları Yükleyin

İlk kez çalıştırıyorsanız mutlaka bir kez çalıştırın:

```powershell
npm install
```

Bu komut `package.json` içindeki tüm paketleri (Next.js, React, OpenAI, Zod vb.) indirir. Bittiğinde `node_modules` klasörü oluşur.

---

## 4. Ortam Değişkenleri (.env.local) — Opsiyonel

**Proje API anahtarı olmadan da açılır ve çalışır.** Ana sayfa, giriş, dashboard, onboarding vb. tüm sayfalar açılır. AI özellikleri (soru üretimi, yazı düzeltme, kelime setleri vb.) için AI anahtarı yoksa 503 döner.

**AI özelliklerini test etmek için**: Proje kök dizininde **`.env.local`** dosyası oluşturun:

```bash
# Gemini API via KIE.AI (PRIMARY - Get from https://api.kie.ai)
GEMINI_API_KEY=...

# OPTIONAL: ElevenLabs (Text-to-Speech)
ELEVENLABS_API_KEY=...

# OPTIONAL: OpenAI (Speech-to-Text)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
```

**UYARI**: `.env.local` dosyasını asla paylaşmayın veya Git'e commit etmeyin.

---

## 5. Geliştirme Sunucusunu Başlatın

Aynı klasörde:

```powershell
npm run dev
```

Çıktıda şuna benzer bir satır görürsünüz:

```
▲ Next.js 16.x.x
- Local:        http://localhost:3000
```

---

## 6. Tarayıcıda Açın

Tarayıcınızda şu adresi açın:

**http://localhost:3000**

Uygulama açılacaktır. Sayfayı veya kodu değiştirdğinizde sayfa otomatik yenilenir (hot reload).

---

## 7. Sunucuyu Durdurmak

Terminalde **Ctrl + C** tuşlarına basın. "Terminate batch job (Y/N)?" derse **Y** yazıp Enter’a basın.

---

## Özet Komutlar (Sırayla)

| Adım | Komut |
|------|--------|
| Klasöre gir | `cd "c:\Users\nisa_\Desktop\Projects (1)\Projects\adaptive-duo"` |
| Bağımlılıkları yükle | `npm install` |
| Sunucuyu başlat | `npm run dev` |
| Tarayıcıda aç | http://localhost:3000 |

---

## Sorun Çıkarsa

- **"AI provider not configured" (503)**  
  AI özellikleri için henüz API anahtarı tanımlı değil. Proje yine de açılır; AI kullanacaksanız ileride `.env.local` ile veya farklı AI sağlayıcı ile yapılandırın.

- **Port 3000 kullanımda**  
  Next.js farklı bir port (örn. 3001) önerecektir. Çıktıdaki `Local: http://localhost:3001` gibi adresi kullanın.

- **npm install hata veriyor**  
  Node.js sürümünüzü kontrol edin: `node -v` (18+ olmalı). Gerekirse Node’u güncelleyin veya `npm cache clean --force` sonra tekrar `npm install` deneyin.

Bu rehber projeyi bilgisayarınızda çalıştırmanız için yeterli olmalıdır.
