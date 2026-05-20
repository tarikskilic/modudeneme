# MODÜ-GRID

> Akıllı mikro-şebeke yönetim platformu. Çok bloklu konut sitelerinde **güneş paneli + batarya + şebeke** üçlüsünü simüle eden, SaaS kalitesinde web uygulaması.

[modu-grid.com](https://modu-grid.com)

---

## İçerik

- [Genel Bakış](#genel-bakış)
- [Özellikler](#özellikler)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Kimlik Doğrulama](#kimlik-doğrulama)
- [Proje Yapısı](#proje-yapısı)
- [Ortam Değişkenleri](#ortam-değişkenleri)
- [Komutlar](#komutlar)
- [Deploy](#deploy)
- [Dokümantasyon](#dokümantasyon)

---

## Genel Bakış

MODÜ-GRID, site yöneticileri ve daire sakinleri için iki rol bazlı arayüz sunar. Tüm enerji ve finans verileri **simülasyon motoru** (`src/utils/energyCalculations.js`) üzerinden üretilir — bu sürümde saha donanımı yoktur (`hardwareConnected: false`).

**Referans senaryo** (jüri / IDEathon): 100 daire, 250 kWp GES, **45 kWh** LiFePO4 BESS (ortak alan peak shaving) — `CANONICAL_SCENARIO` in `simulationDefaults.js`.

**Hedef kullanıcılar**:

| Rol | İhtiyaç |
|-----|---------|
| Site yöneticisi (`admin`) | Tesis geneli üretim/tüketim, finansal ROI, karbon, senaryo simülasyonu |
| Daire sakini (`resident`) | Kendi tüketim payı, aylık fatura tahmini, kişisel tasarruf |
| Yatırımcı / Jüri | Geri ödeme süresi, CAPEX senaryoları, çevresel etki |

---

## Özellikler

### Kimlik ve erişim

- **Giriş** + **Üye Ol** (Supabase veya yerel simülasyon modu)
- **Demo hesaplar** giriş ekranında tek tıkla
- Rol bazlı yönlendirme: `admin` → `/admin/*`, `resident` → `/resident`

### Admin

- **Kontrol Paneli** — KPI, `SliderPanel` (slider + manuel sayı girişi), günlük enerji grafiği
- **CAPEX senaryoları** — Demo / Pilot / Teşvikli / Conservative (`CostScenarioSelector`)
- **Enerji Akışı** — SVG diyagram, 24 saat timeline
- **Finansal Simülatör** — Anlık ROI + **Dönem Analizi** sekmesi (`PeriodAnalysisTab`)
- **Karbon Paneli** — CO₂, sürdürülebilirlik skoru, aylık trend
- **Karşılaştırma** — MODÜ-GRID vs geleneksel site (10 yıllık kümülatif)

### Sakin

- **Daire paneli** — Seed bazlı kişisel metrikler, blok/daire bağlamı

### UX / teknik

- **Slider + manuel giriş** — `SliderValueInput` (ör. daire sayısı 63)
- **Simülasyon state persist** — `localStorage` `modugrid:sim` (yenilemede korunur)
- **Mobil admin menü** — hamburger + drawer
- **Responsive** — mobil / tablet / masaüstü (`md:`, `lg:`, `xl:`)
- **Koyu tema** — Tailwind + Lucide; login ekranı özel CSS (`styles/login.css`)

### Planlanan (henüz aktif değil)

- **PDF rapor indirme** — `jspdf` / `html2canvas` bağımlılıkta var; Dönem Analizi’ndeki “Raporu İndir” şu an **disabled**

---

## Teknoloji Yığını

| Katman | Araç |
|--------|------|
| Framework | React 18 + Vite 5 |
| Routing | React Router v6 |
| Stil | Tailwind CSS 3 + login özel CSS |
| Grafikler | Recharts |
| İkonlar | Lucide React |
| Animasyon | Framer Motion |
| Auth | Supabase Auth + `profiles` (opsiyonel) / yerel demo |
| Deploy | Traefik + Docker, GitHub Actions |

---

## Hızlı Başlangıç

**Gereksinimler**: Node.js 18+, npm

```bash
git clone https://github.com/yunusarda-sudo/modu-grid.git
cd modu-grid
npm install
cp .env.example .env.local
# Supabase kullanacaksanız VITE_SUPABASE_* değerlerini doldurun
npm run dev
```

Dev server: `http://localhost:5173`

Supabase **tanımlı değilse** uygulama otomatik **yerel demo moduna** geçer (aşağıdaki demo hesaplar).

---

## Kimlik Doğrulama

### Demo hesaplar (her zaman)

| Kullanıcı | Şifre | Rol |
|-----------|-------|-----|
| `admin` | `modigrid2024` | Yönetici → `/admin` |
| `daire1` … `daire10` | `1234` | Sakin → `/resident` |

### Üye Ol

- Giriş ekranında **Üye Ol** → kullanıcı adı, şifre, şifre tekrar, rol
- **Supabase açık**: `auth.signUp` + `profiles` trigger (`supabase/migrations/`)
- **Supabase kapalı**: kayıt `localStorage` (`modigrid_registered_users`); demo kullanıcı adları rezerve

Oturum: `localStorage.auth` — yalnızca `role`, `username`, `loginAt` (parola saklanmaz).

---

## Proje Yapısı

```
modu-grid/
├── src/
│   ├── App.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── EnergyFlow.jsx
│   │   ├── FinancialSimulator.jsx
│   │   ├── CarbonPanel.jsx
│   │   ├── Comparison.jsx
│   │   └── ResidentDashboard.jsx
│   ├── components/
│   │   ├── SliderPanel.jsx
│   │   ├── SliderValueInput.jsx
│   │   ├── CostScenarioSelector.jsx
│   │   ├── PeriodAnalysisTab.jsx
│   │   ├── EnergyFlowDiagram.jsx
│   │   └── Charts/
│   ├── context/SimulationContext.jsx
│   ├── constants/simulationDefaults.js   # SLIDER_RANGES, CAPEX, CANONICAL_SCENARIO
│   ├── utils/
│   │   ├── energyCalculations.js
│   │   └── roiProjection.js
│   ├── lib/auth.js, supabase.js
│   └── styles/login.css
├── supabase/migrations/
├── deploy/
├── PRODUCT.md          # Ürün spesifikasyonu
├── DESIGN.md           # Tasarım sistemi (UI)
├── DEPLOY.md
└── SPEC_AUDIT.md       # Spec uyum denetimi
```

---

## Ortam Değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `VITE_SUPABASE_URL` | Supabase proje URL (opsiyonel) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (opsiyonel) |

Boş bırakılırsa → yerel demo auth. Örnek: `.env.example`

---

## Komutlar

```bash
npm run dev       # Geliştirme (HMR)
npm run build     # dist/
npm run preview   # dist önizleme
```

---

## Deploy

`main` → GitHub Actions → VPS (Traefik, HTTPS). Detay: [DEPLOY.md](./DEPLOY.md)

**GitHub Secrets**: `VPS_SSH_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, (`VPS_HOST`, `VPS_USER` opsiyonel)

---

## Dokümantasyon

| Dosya | İçerik |
|-------|--------|
| [PRODUCT.md](./PRODUCT.md) | Sayfa şartnameleri, simülasyon motoru, sprint planı |
| [DESIGN.md](./DESIGN.md) | Renk, tipografi, login, bileşen kuralları |
| [DEPLOY.md](./DEPLOY.md) | VPS, Traefik, CI/CD |
| [SPEC_AUDIT.md](./SPEC_AUDIT.md) | Spec uyumu (~92%); açık iş: PDF export |

---

## Lisans

Özel proje — tüm hakları saklıdır.
