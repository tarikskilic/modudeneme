# MODÜ-GRID — Ürün Spesifikasyonu

> Akıllı mikro-şebeke yönetim sistemi. SaaS kalitesinde web uygulaması. Jüri ve yatırımcı sunumu için hazırlanır.

**İlgili dokümanlar**: [README.md](./README.md) (kurulum + özet), [DESIGN.md](./DESIGN.md) (UI/tasarım sistemi), [SPEC_AUDIT.md](./SPEC_AUDIT.md) (kod uyumu).

**Son güncelleme (2026-05-20)**: BESS **45 kWh**; slider **0–150 kWh**; **Üye Ol**; **CAPEX** senaryoları; **manuel giriş**; **`modugrid:sim` persist** + mobil drawer + navbar reset; PDF **disabled**. Detay uyum: [SPEC_AUDIT.md](./SPEC_AUDIT.md).

---

## 1. Vizyon

MODÜ-GRID, çok bloklu konut sitelerinde **güneş paneli + batarya + şebeke** üçlüsünü optimize eden bir enerji yönetim platformudur. Yönetici (admin) tesis genelini izler ve simüle eder; daire sakini kendi tüketimini ve tasarrufunu görür.

**Bu sürüm**: Donanım entegrasyonu yok — tamamen simülasyon. `hardwareConnected: false` sabit. Bütün veriler `energyCalculations.js` motorundan üretilir.

---

## 2. Hedef Kullanıcılar

| Rol | İhtiyaç |
|------|---------|
| **Site yöneticisi (admin)** | Tesis genelinde üretim/tüketim, finansal ROI, karbon etkisi, senaryo simülasyonu |
| **Daire sakini (resident)** | Kendi tüketim payı, kendi tasarrufu, aylık fatura tahmini |
| **Yatırımcı / Jüri** | Sistem fizibilitesi, geri ödeme süresi, çevresel etki |

---

## 3. Teknoloji Yığını

- **React 18 + Vite** — hızlı dev server, modern bundler
- **React Router v6** — sayfa yönlendirme
- **Tailwind CSS** — utility-first stil, koyu tema
- **Recharts** — tüm grafikler (alanı + bar + line + gauge)
- **Lucide React** — TÜM ikonlar (emoji ve fotoğraf yasak)
- **Framer Motion** — sayfa geçişi, kart hover, panel açılış animasyonları
- **Context API** — global simülasyon state'i (Redux/Zustand'a gerek yok)

### Paket kurulumu

```bash
npm install react-router-dom recharts lucide-react framer-motion @supabase/supabase-js
npm install -D tailwindcss postcss autoprefixer
```

> `jspdf` + `html2canvas` — `package.json`'da mevcut; **Dönem Analizi → "Raporu İndir"** henüz bağlanmadı (buton `disabled`). Hedef: A4 yatay PDF, `MODU-GRID-Donem-Raporu-{tarih}.pdf`.

---

## 4. Tasarım Sistemi

> **Güncel UI referansı**: [DESIGN.md](./DESIGN.md) (token listesi, login, slider, responsive). Aşağıdaki özet spec ile uyumludur; çelişki durumunda DESIGN + `tailwind.config.js` esas alınır.

### 4.1. Renk Paleti (Tailwind config)

```js
colors: {
  background: '#0A0F1E',  // ana arka plan (koyu lacivert)
  card: '#111827',         // kart yüzeyleri
  primary: '#3B82F6',      // mavi — birincil aksiyon
  success: '#10B981',      // yeşil — üretim, kâr, pozitif
  warning: '#F59E0B',      // amber — uyarı, batarya, dikkat
  foreground: '#F9FAFB',   // ana metin (kırık beyaz)
  muted: '#6B7280',        // ikincil metin (gri)
  'muted-light': '#9CA3AF',
  border: '#1F2937',       // çerçeve / ayraç
  'border-strong': '#374151',
  'surface-alt': '#0D1321',
  danger: '#EF4444',
}
```

### 4.2. Tipografi

- Başlıklar: `font-bold`, hierarchy `text-4xl / text-2xl / text-lg`
- Body: `text-base text-foreground`
- KPI sayıları: `text-3xl font-bold tabular-nums`
- Para birimi: `1.234,56 ₺` (TR locale, `Intl.NumberFormat('tr-TR')`)

### 4.3. İkon Politikası

- **SADECE** Lucide React. Örnek: `<Zap />`, `<Sun />`, `<Battery />`, `<Home />`, `<Shield />`, `<Leaf />`, `<TrendingUp />`
- Emoji yasak (🌞, ⚡ vs).
- Fotoğraf yasak. SVG illüstrasyon gerekirse inline yazılır.

### 4.4. Anti-Template Kuralları

- Generic Tailwind dashboard görünmesin
- Her sayfanın editorial hiyerarşisi olsun (büyük KPI + destekleyici grafik)
- Hover/focus/active state'leri tasarlanmış olsun
- Bento veya grid-breaking layout tercih edilsin (uniform kart grid'i hayır)

### 4.5. Responsive uyumluluk (breakpoint’ler)

Uygulama **tek kod tabanı** ile ekran genişliğine göre düzen değiştirir; masaüstü “tam panel”, telefon “okunabilir ve kullanılabilir” hedeflenir (admin panelleri mobilde sadeleşebilir, içerik kaybolmaz).

| Kırılım | Genişlik (Tailwind) | Beklenti |
|--------|----------------------|----------|
| **Mobil** | `< 768px` (`default`, `sm` öncesi) | Tek sütun akış; kenar boşlukları `px-4`; başlık/KPI ölçekleri küçülür; **touch hedefi ≥ 44px**; sidebar yerine hamburger / üst bar veya altta sekmeler |
| **Tablet** | `768px+` (`md:`) | 2 sütun grid mümkün; grafikler ve tablolar taşmadan veya yatay kaydırılabilir |
| **Masaüstü** | `1024px+` (`lg:`) | Tam layout: sidebar + ana içerik; spec’teki bento / grid hiyerarşisi |
| **Geniş ekran** | `1280px+` (`xl:`) | İçerik `max-w-*` ile merkezlenebilir; satır uzunluğu okunabilirlik için sınırlanır |

**Grafikler (Recharts)**: Küçük ekranda container genişliğine sığdırmak için `ResponsiveContainer`; gerekirse grafik altında yatay scroll (overflow-x) — eksen etiketleri küçültülür veya özet KPI öne alınır.

**Tipografi**: `text-4xl` gibi masaüstü başlıklar mobilde `text-2xl` / `md:text-4xl` ile kademeli büyür.

**Karar**: Mobil “opsiyonel demo” değil; **tüm kamuya açık akışlar (login dahil)** ve mümkün olan ölçüde admin/resident dashboard’ları bu kırılımlarda kırılmadan kullanılabilir olmalı. Kompleks analiz sayfalarında mobilde önce özet kartlar, detay “genişlet” ile sunulabilir.

---

## 5. Klasör Yapısı

```
src/
├── pages/
│   ├── Login.jsx
│   ├── AdminDashboard.jsx
│   ├── EnergyFlow.jsx
│   ├── FinancialSimulator.jsx
│   ├── ResidentDashboard.jsx
│   ├── CarbonPanel.jsx
│   └── Comparison.jsx
├── components/
│   ├── Navbar.jsx, Sidebar.jsx, KPICard.jsx
│   ├── SliderPanel.jsx, SliderValueInput.jsx
│   ├── CostScenarioSelector.jsx, PeriodAnalysisTab.jsx
│   ├── EnergyFlowDiagram.jsx, HardwareStatusBanner.jsx
│   ├── ElectricGridBackground.jsx, CarbonChart.jsx, …
│   └── Charts/ (DailyEnergy, ROI, Gauge, BatterySOC, …)
├── context/SimulationContext.jsx
├── lib/auth.js, supabase.js
├── utils/energyCalculations.js, roiProjection.js
├── constants/simulationDefaults.js
├── styles/login.css
├── App.jsx
└── main.jsx
```

---

## 6. Yönlendirme (Routing)

| Yol | Sayfa | Erişim |
|------|-------|--------|
| `/` | Login | Public |
| `/admin` | AdminDashboard | Protected — sadece `role === 'admin'` |
| `/admin/energy-flow` | EnergyFlow | Protected — admin |
| `/admin/financial` | FinancialSimulator | Protected — admin |
| `/admin/carbon` | CarbonPanel | Protected — admin |
| `/admin/comparison` | Comparison | Protected — admin |
| `/resident` | ResidentDashboard | Protected — `role === 'resident'` |

**Protected route mantığı**: `localStorage.getItem('auth')` yoksa veya rol uymuyorsa `/` 'e yönlendir.

---

## 7. Kimlik Doğrulama

`src/lib/auth.js` — iki mod:

| Mod | Koşul | Davranış |
|-----|--------|----------|
| **Supabase** | `VITE_SUPABASE_*` tanımlı | `signInWithPassword`, `signUp`, `profiles` tablosu |
| **Yerel demo** | Env yok | Demo kullanıcılar + `modigrid_registered_users` kayıtları |

### Giriş ekranı (`Login.jsx`)

- Modlar: **Sisteme Giriş** | **Üye Ol** (toggle)
- Rol pill: `admin` | `resident`
- Demo hesaplar (yalnızca giriş modunda)

### Demo kullanıcılar (her zaman)

| Kullanıcı Adı | Şifre | Rol |
|---------------|-------|-----|
| `admin` | `modigrid2024` | `admin` |
| `daire1` … `daire10` | `1234` | `resident` |

### Üye Ol

- Validasyon: kullanıcı adı ≥ 3, şifre ≥ 6, şifre tekrar eşleşmeli
- Supabase: `signUp({ email: username@modigrid.app, options.data: { username, role } })` → trigger `handle_new_user` → `profiles`
- Yerel: `modigrid_registered_users` (demo adları rezerve: `admin`, `daire1`…`daire10`)

### Oturum (`localStorage.auth`)

```js
{ role: 'admin' | 'resident', username: string, loginAt: number }
```

Parola **asla** saklanmaz.

### Logout

`signOut()` + `localStorage.removeItem('auth')` → `/`

### Güvenlik notu (jüri)

Demo/yerel katman üretim için yeterli değildir. Üretimde sunucu tarafı oturum + httpOnly cookie önerilir.

---

## 8. Global State — `SimulationContext.jsx`

Tüm sayfalar bu context'i tüketir. Slider değişikliği anında bütün sayfaları günceller.

```js
// DEFAULT_SIMULATION + SLIDER_RANGES → simulationDefaults.js
{
  panelCapacity: 250,       // kWp — SLIDER: 50–400, step 10 (sürükleme)
  batteryCapacity: 45,      // kWh — BATTERY_TARGET_KWH (LiFePO4 BESS hedefi)
  blockCount: 5,
  apartmentCount: 100,      // SLIDER: 20–200, step 1
  selectedMonth: 7,
  selectedApartment: 'daire1',
  costScenario: 'base',     // demo | base | subsidized | conservative
  hardwareConnected: false
}

// Batarya slider UI: 0–150 kWh, step 5 (sürükleme); manuel giriş tam sayı
```

**CAPEX**: `costScenario` → `getInvestmentCosts()` → ROI ve yatırım çizgisi.

**Manuel giriş**: `SliderValueInput` — min/max clamp; slider ile aynı context.

Context API: `value = { ...state, setters, reset, investmentCosts }`

---

## 9. Enerji Hesaplama Motoru — `energyCalculations.js`

### 9.1. Aylık güneşlenme katsayıları (kWh/kWp/gün)

```js
const sunshineHours = {
  1: 2.5, 2: 3.0, 3: 3.8, 4: 4.2, 5: 4.5, 6: 5.0,
  7: 5.2, 8: 4.8, 9: 4.0, 10: 3.2, 11: 2.8, 12: 2.3
};
```

### 9.2. `getDailyProduction(panelCapacity, month)`

```
return panelCapacity * sunshineHours[month]   // kWh/gün
```

### 9.3. `getDailyConsumption(apartmentCount)`

```
daire     = apartmentCount * 10        // kWh/gün, ortalama daire başına
ortakAlan = apartmentCount * 2.5       // asansör, aydınlatma, hidrofor vs
return daire + ortakAlan
```

### 9.4. `getHourlyData(panelCapacity, apartmentCount, batteryCapacity, month)`

24 elemanlı dizi döndürür. Her eleman:

```js
{
  hour,          // 0-23
  production,    // kWh, üretim
  consumption,   // kWh, tüketim
  batterySoC,    // %, batarya doluluk
  gridImport,    // kWh, şebekeden alınan
  gridExport,    // kWh, şebekeye satılan
  directUse,     // kWh, panelden anlık tüketilen
  batteryUse     // kWh, bataryadan çekilen
}
```

#### Üretim eğrisi (çan, sadece 06-18 arası)

```
production[h] = günlükÜretim * exp(-0.5 * ((h-12)/2.5)^2)
              * (h >= 6 && h <= 18 ? 1 : 0)
```

Normalize: toplam = günlükÜretim olacak şekilde ölçekle.

#### Tüketim eğrisi

| Saat aralığı | Çarpan (günlük tüketimin yüzdesi/saat) |
|--------------|----------------------------------------|
| 08-16 (gündüz, evde az kişi) | 0.035 |
| 17-23 (akşam piki, 17:00 dahil) | 0.085 |
| Diğer (gece) | 0.020 |

#### Saatlik öncelik mantığı

```
if production > consumption:
    directUse = consumption
    fazla = production - consumption
    if batarya kapasitesi doluya kadar boşsa:
        batteryCharge = min(fazla, batteryCapacity - currentSoC*cap)
        gridExport = fazla - batteryCharge
    else:
        gridExport = fazla
else:
    directUse = production
    açık = consumption - production
    if batarya boşalmamışsa (SoC > 10%):
        batteryUse = min(açık, çekilebilir)
        gridImport = açık - batteryUse
    else:
        gridImport = açık
```

#### Batarya parametreleri

- **DoD (Depth of Discharge)**: %90 — bataryanın %10'undan aşağı inilmez
- **Başlangıç SoC**: %20 (sabit, h=0'da)
- **Şarj/deşarj verimliliği**: %90 (batarya tasarrufu hesabında kullanılır)

### 9.5. `getFinancialMetrics(hourlyData, batteryCapacity, apartmentCount)`

#### Fiyat sabitleri (TL/kWh)

| Akım | Fiyat |
|------|------:|
| Şebekeden alış | 2.50 |
| Şebekeye satış | 1.50 |
| Panel direkt tasarruf | 2.50 (alıştan kaçınılan) |
| Batarya tasarruf | 2.25 (2.50 × 0.90 verim) |

#### Dönüş

```js
{
  dailyProfit,            // günlük net kazanç (TL)
  monthlyProfit,          // dailyProfit * 30
  yearlyProfit,           // dailyProfit * 365
  selfConsumptionRate,    // % — (directUse_total + batteryUse_total) / consumption_total * 100
  roiYears,               // yatırım / yıllıkKar
  perApartmentMonthly,    // monthlyProfit / apartmentCount
  gridExportRevenue,      // günlük satış geliri
  gridImportCost,         // günlük alış maliyeti
  directSavings,          // panel direkt tasarrufu
  batterySavings          // batarya tasarrufu
}
```

#### ROI

```
investmentCosts = getInvestmentCosts(costScenario)   // SCENARIO_PRESETS
yatırım = computeInvestment(panelCapacity, batteryCapacity, investmentCosts)
roiYears = computeRoiYears(yatırım, yıllıkTasarruf)   // geçersizse null → UI "—"
```

Senaryolar: `demo` | `base` (Pilot) | `subsidized` (Teşvikli) | `conservative`. Jüri referansı: `CANONICAL_SCENARIO` (`simulationDefaults.js`).

### 9.6. `getCarbonMetrics(dailyProduction, selfConsumptionRate)`

```
yeşilEnerji      = dailyProduction * (selfConsumptionRate / 100)
co2Saved_daily   = yeşilEnerji * CO2_FACTORS.perKwhKg  // 0.45 kg CO₂/kWh
monthlyCO2Saved  = co2Saved_daily * 30
equivalentTrees  = monthlyCO2Saved / CO2_FACTORS.treeKgPerMonth
equivalentCars   = (monthlyCO2Saved * 12) / CO2_FACTORS.carKgPerYear
```

Dönüş:

```js
{ monthlyCO2Saved, equivalentTrees, equivalentCars, yearlyCO2Saved }
```

### 9.7. `getPeriodAnalysis(panelCapacity, batteryCapacity, apartmentCount, startMonth, endMonth)`

Başlangıç–bitiş ayı arasındaki her ay için döngüyle finansal ve karbon metriklerini hesaplar, kümülatif toplar ve en iyi/en kötü ayı işaretler.

```js
const ayAdlari = {
  1:'Ocak', 2:'Şubat', 3:'Mart', 4:'Nisan',
  5:'Mayıs', 6:'Haziran', 7:'Temmuz', 8:'Ağustos',
  9:'Eylül', 10:'Ekim', 11:'Kasım', 12:'Aralık'
};

let cumulativeSavings = 0;
let cumulativeCO2     = 0;
const monthlyResults  = [];

for (let m = startMonth; m <= endMonth; m++) {
  const dailyProduction = getDailyProduction(panelCapacity, m);
  const hourlyData      = getHourlyData(panelCapacity, apartmentCount, batteryCapacity, m);
  const financial       = getFinancialMetrics(hourlyData, batteryCapacity, apartmentCount);
  const carbon          = getCarbonMetrics(dailyProduction, financial.selfConsumptionRate);

  cumulativeSavings += financial.monthlyProfit;
  cumulativeCO2     += carbon.monthlyCO2Saved;

  monthlyResults.push({
    month: m,
    monthName: ayAdlari[m],
    dailyProduction,
    monthlyProduction: dailyProduction * 30,
    monthlyProfit: financial.monthlyProfit,
    selfConsumptionRate: financial.selfConsumptionRate,
    roiYears: financial.roiYears,
    perApartmentMonthly: financial.perApartmentMonthly,
    gridExportRevenue: financial.gridExportRevenue,
    batterySavings: financial.batterySavings,
    directSavings: financial.directSavings,
    monthlyCO2Saved: carbon.monthlyCO2Saved,
    equivalentTrees: carbon.equivalentTrees,
    cumulativeSavings,
    cumulativeCO2,
    bestMonth: false,
    worstMonth: false
  });
}

// Best/worst ay işaretle
const best  = monthlyResults.reduce((a,b) => b.monthlyProfit > a.monthlyProfit ? b : a);
const worst = monthlyResults.reduce((a,b) => b.monthlyProfit < a.monthlyProfit ? b : a);
best.bestMonth   = true;
worst.worstMonth = true;

return {
  monthlyResults,
  totalSavings: cumulativeSavings,
  totalCO2: cumulativeCO2,
  totalTrees: cumulativeCO2 / 1.75,
  averageSelfConsumption: Σ(selfConsumptionRate) / periodMonths,
  bestMonth: best,
  worstMonth: worst,
  periodMonths: endMonth - startMonth + 1
};
```

---

## 10. Sabitler — `simulationDefaults.js`

Tüm magic number'lar burada toplanır:

- `SUNSHINE_HOURS` (aylık katsayılar)
- `MONTH_NAMES` (TR ay adları, `getPeriodAnalysis` için)
- `ELECTRICITY_PRICES` (alış, satış, paneldenTasarruf, bataryaTasarruf)
- `BATTERY_PARAMS` (DoD, initialSoC, efficiency)
- `INVESTMENT_COSTS` (panelPerKwp: 8000, batteryPerKwh: 3000)
- `CO2_FACTORS` (perKwh: 0.5, treePerMonth: 1.75, carPerYear: 2400)
- `CONSUMPTION_PROFILE` (peakHours, daytime, night çarpanları)
- `LEGACY_BASELINE` (geleneksel sistem sabitleri — bkz. §18)
- `DEFAULT_SIMULATION` (varsayılan slider değerleri)
- `SLIDER_RANGES` (her slider için min/max/step)

---

## 11. Bu Sürümün Kapsamı (Sprint 0)

Bu adımda **sadece iskelet** kurulacak:

- [x] Tailwind config (renkler + temel ayarlar)
- [x] Paket kurulumları
- [x] Klasör yapısı (tüm dizinler ve dosyalar)
- [x] `App.jsx` (router + protected route)
- [x] `SimulationContext.jsx` (state + setter'lar)
- [x] `energyCalculations.js` (tüm fonksiyonlar implement)
- [x] `simulationDefaults.js` (sabitler)
- [x] Her sayfa için **placeholder** (sadece sayfa adını gösteren `<div>`)

**Henüz YOK**: gerçek UI, grafikler, login formu tasarımı, slider'lar, KPI kartları. Bunlar sonraki sprintlerde.

---

## 12. Sprint 1 — Login + Navigation

### 12.1. `Login.jsx`

**Arka plan animasyonu** (`<canvas>`):
- `#0A0F1E` arka plan
- 15-20 nokta: `{x, y, vx, vy, radius 2-3px}`
- `requestAnimationFrame` ile sürekli güncelle
- Kenar çarpışmasında yön değiştir
- İki nokta arası `<150px` → `rgba(59,130,246,0.3)` çizgi
- Nokta rengi: `rgba(59,130,246,0.8)`
- Arka grid: yatay+dikey 60px aralıklı `rgba(59,130,246,0.05)` çizgiler
- **Performans**: `document.visibilityState === 'hidden'` iken animasyon durdurulur (CPU/pil tasarrufu)

**Login kartı** (canvas üstünde absolute, ortalanmış):
- 420px genişlik (mobilde `w-full max-w-[420px] px-4`), 40px padding
- `bg-card`, `border-border`, `rounded-2xl`
- `box-shadow: 0 0 60px rgba(59,130,246,0.1)`
- Framer Motion fadeIn + slideUp giriş animasyonu

**Kart içeriği**:

1. **Logo alanı**: `<Zap />` (mavi, 32px) + "MODÜ-GRID" (bold beyaz) yan yana. Altında: "Akıllı Mikro-Şebeke Yönetim Sistemi" (gri, sm). *(Logo asset geldiğinde swap.)*
2. **Rol seçimi**: iki buton yan yana, tam genişlik.
   - "Yönetici" `<Users />` (sol)
   - "Daire Sakini" `<Home />` (sağ)
   - Seçili: `bg-primary text-white`. Seçilmemiş: `bg-border text-muted`. Framer Motion geçiş.
3. **Kullanıcı adı input**: `<User />` solda, placeholder "Kullanıcı adınız". `bg-background border-border`. Focus: `border-primary + ring-primary/10`.
4. **Şifre input**: `<Lock />` solda, sağda `<Eye />`/`<EyeOff />` toggle.
5. **Giriş Yap butonu**: tam genişlik, 48px, `bg-primary hover:bg-blue-600`, sağda `<LogIn />`. Hover'da `0 0 20px rgba(59,130,246,0.4)` glow.

**Donanım durumu pill** (kart altında, küçük):
- İlk 2sn: sarı pulse nokta + "Donanım Bağlantısı Aranıyor..."
- 2sn sonra: kırmızı nokta + "Donanım Bulunamadı — Simülasyon Modu Aktif"
- `useEffect` + `setTimeout`

**Giriş mantığı**:
```
admin / modigrid2024              → /admin
daire1..daire10 / 1234            → /resident
```

**Yanlış giriş**: kart shake `x: [0,-10,10,-10,10,0]` (0.4sn), altında kırmızı "Kullanıcı adı veya şifre hatalı".

### 12.2. `Navbar.jsx`

- Fixed top, full width, h-16, z-50
- `bg-card border-b border-border`
- **Sol**: `<Zap />` + "MODÜ-GRID"
- **Sağ** (sırasıyla):
  - Kırmızı pulse nokta + "Simülasyon Modu" pill
  - Kullanıcı adı + rol badge (admin → mavi "Yönetici" / resident → yeşil "Daire Sakini")
  - `<RotateCcw />` ikon-buton (sadece admin, slider reset)
  - `<LogOut />` çıkış — localStorage temizle, `/` 'e yönlendir
- **Mobil**: kullanıcı adı + rol badge collapse olur; sadece avatar ikonu + dropdown menüde rol/çıkış

### 12.3. `Sidebar.jsx` (sadece admin)

- Fixed left, top-16, full-height, w-60
- `bg-card border-r border-border`
- Menü:
  - `<LayoutDashboard />` "Dashboard" → `/admin`
  - `<Zap />` "Enerji Akışı" → `/admin/energy-flow`
  - `<TrendingUp />` "Finansal Simülatör" → `/admin/financial`
  - `<Leaf />` "Karbon Paneli" → `/admin/carbon`
  - `<BarChart2 />` "Karşılaştırma" → `/admin/comparison`
- **Aktif**: sol border `3px solid primary`, arka plan `rgba(59,130,246,0.1)`, ikon+yazı `text-primary`
- **Hover**: `rgba(59,130,246,0.05)` arka plan
- `useLocation` ile aktif yol tespiti
- **Mobil (`<lg`)**: sidebar gizlenir; navbar `<Menu />` → sol drawer (backdrop + Esc). Drawer menü `ADMIN_NAV_ITEMS` ile aynı.

### 12.4. `HardwareStatusBanner.jsx`

- Navbar altında, content üstünde
- h-9, full width
- `bg-red-500/10 border-b border-red-500/20`
- **Sol**: kırmızı pulse + "Donanım Bağlantısı Yok — Simülasyon Modu Aktif"
- **Sağ**: "Saha Verilerini Topla" butonu → Framer Motion modal: "Donanım bulunamadı. Simülasyon modu devam ediyor." (Kapat butonu)
- Tüm admin sayfalarında görünür
- **Mobil**: metin kısalır → "Simülasyon Modu Aktif"; sağ buton ikon-only (`<RadioTower />`)

---

## 13. Sprint 2 — Admin Dashboard

`AdminDashboard.jsx` layout: Navbar + HardwareStatusBanner + Sidebar + main (`lg:pl-60 p-6 bg-background`).

### Sayfa başlığı
- "Kontrol Paneli" (`text-2xl md:text-3xl font-bold`)
- Altında: "Site geneli enerji yönetimi — Simülasyon Modu" (gri sm)
- Sağda: ay dropdown (Oca-Ara) — `selectedMonth` güncellenir

### Bölüm 1 — KPI Kartları (`grid-cols-1 md:grid-cols-2 xl:grid-cols-4`)

**`KPICard.jsx`** props: `{ title, value, unit, subtitle, icon, color, trend }`
- `bg-card border-border rounded-xl p-5`
- Sol üst: ikon (24px, color)
- Sağ üst: trend pill (yeşil ok varsa)
- Orta: büyük value + unit (tabular-nums)
- Alt: subtitle (gri sm)
- Hover: `border-primary` geçişi
- Framer Motion stagger fadeIn (0.1sn)
- Değer değişiminde spring count-up animasyonu

Kartlar:
1. **Günlük Üretim** — `getDailyProduction(panelCapacity, selectedMonth)` kWh, `<Sun />`, success, "+%12 geçen aya göre"
2. **Öz-Tüketim Oranı** — `selfConsumptionRate` %, `<Target />`, primary
3. **Aylık Net Tasarruf** — `monthlyProfit.toLocaleString('tr-TR')` ₺, `<TrendingUp />`, success, alt: "Daire başı: ₺" + perApartmentMonthly
4. **ROI Süresi** — `roiYears.toFixed(1)` Yıl, `<Clock />`, warning

### Bölüm 2 — İki Kolon (`grid-cols-1 lg:grid-cols-2`)

**Sol — `SliderPanel.jsx`** ("Sistem Parametreleri")

Slider stili: thumb `bg-primary` 20px daire, track `bg-border`, dolu kısım mavi gradient. Touch hedefi ≥ 44px (mobil için `h-11`).

1. **Panel Gücü** — `<Sun />`, 50–400 kWp; slider step 10; **manuel giriş** tam sayı
   - Optimal 150–350 → yeşil track, dışı amber
2. **Batarya Kapasitesi** — `<Battery />`, 0–150 kWh, slider step 5; **manuel giriş**
   - Preset badge: `0` Bataryasız, `45` MODÜ-GRID Hedefi (LiFePO4), `90` Genişletilmiş
3. **Blok Sayısı** — 1–10; slider + +/- + manuel giriş (yalnızca görselleştirme)
4. **Daire Sayısı** — 20–200, step 1; slider + +/- + manuel giriş (ör. 63)
5. **CAPEX senaryosu** — `CostScenarioSelector` (Dashboard slider panelinde veya Finansal Simülatör üstünde)
6. **Ay seçimi** — dropdown

Tüm değişiklikler `SimulationContext`'i günceller.

**Sağ — Enerji Özeti** ("Günlük Enerji Dağılımı")

Üst — **`GaugeChart.jsx`** (Recharts PieChart yarım daire):
- Yeşil: direkt tüketim oranı
- Mavi: batarya tüketim oranı
- Amber: şebeke satışı oranı
- Ortada: büyük `% selfConsumptionRate` + "Öz-Tüketim Oranı"

Alt — 3 satır breakdown (her satır ikon + label + kWh + TL/kWh):
- `<Sun />` Panel → Direkt (yeşil)
- `<Battery />` Batarya → Tüketim (mavi)
- `<Zap />` Şebeke Satışı (amber)

### Bölüm 3 — `DailyEnergyChart.jsx` ("24 Saatlik Enerji Akışı")

Recharts LineChart (`ResponsiveContainer`):
- XAxis: 0-23 saat
- YAxis sol: kW
- YAxis sağ: SoC %

Çizgiler:
1. **Üretim**: success `#10B981`, strokeWidth 2.5, alan altı yeşil gradient
2. **Tüketim**: primary `#3B82F6`, strokeWidth 2, alan altı mavi gradient
3. **Batarya SoC**: warning `#F59E0B`, strokeWidth 1.5, `strokeDasharray "5 5"`, sağ Y ekseni

Legend altta. Context değişince yeniden render.

---

## 14. Sprint 3 — Energy Flow

`EnergyFlow.jsx` + `EnergyFlowDiagram.jsx`. Uygulamanın **görsel olarak en etkileyici** ekranı.

**Render kararı**: Custom SVG (react-flow değil). Performans ve kontrol bizde kalsın.

### Sayfa başlığı
- "Enerji Akış Diyagramı"
- Altında: "Anlık enerji yönlendirmesini izleyin"
- Sağda: saat göstergesi (`selectedHour` — local state), `<ChevronLeft />` `<ChevronRight />` butonlar, `<Play />`/`<Pause />` (her 1sn +1 saat otomatik)

### Bölüm 1 — `EnergyFlowDiagram.jsx`

Tam genişlik, min-h-500px. SVG tabanlı diyagram. Sol kaynaklar, sağ tüketiciler, ortada animasyonlu akış.

**Sol nodlar (3 adet, dikey)**:

1. **Güneş Paneli**: `<Sun />` (32px), "Güneş Paneli", "XXX kW", yeşil glow daire. Gece (18-06): dimmed + "Üretim Yok"
2. **Batarya**: `<Battery />` (32px, mavi), "Batarya", SoC %, kWh, durum (`Şarj Oluyor`/`Deşarj`/`Dolu`/`Boş`). Dikey doluluk bar (mavi). Şarj: yeşil pulse; Deşarj: mavi pulse.
3. **Şebeke**: `<Zap />` (32px, amber), "Şebeke", durum: "Satış: XX kW" (yeşil) veya "Alım: XX kW" (kırmızı)

**Sağ nodlar (dinamik, `blockCount` kadar)**:
- `<Building2 />` (24px), "Blok A/B/C…", anlık tüketim "XX kW", küçük indicator (kaynağa göre renk)

**Akış çizgileri (SVG path, animasyonlu)**:

| Akış | Renk | Aktif Koşul |
|------|------|-------------|
| Panel → Binalar | success | `production>0 && directUse>0` |
| Panel → Batarya | success kesikli | batarya şarj |
| Batarya → Binalar | primary | batarya deşarj |
| Panel → Şebeke | warning | `gridExport>0` |
| Şebeke → Binalar | danger | `gridImport>0` |

Aktif olmayan çizgiler: `opacity 0.15`, kesikli, akan nokta yok.

**Akan nokta animasyonu** (CSS):
```css
@keyframes flowDots {
  0%   { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
}
```
`strokeDasharray` ile uygulanır. Hız = akış miktarı (daha çok enerji → daha hızlı).

### Zaman kontrolü

Sayfa altında timeline:
- 0-23 saat kaydırıcı
- Seçili saate göre `hourlyData[selectedHour]` kullanılır
- Play modunda her 1sn +1 saat (sabit hız, ileride 1x/2x/4x eklenebilir)
- Bağlamsal açıklama:

| Saat | Metin |
|------|-------|
| 06-09 | "Sabah: Panel üretimi başlıyor, batarya şarj" |
| 10-14 | "Öğle: Maksimum üretim, batarya doluyor" |
| 15-17 | "Öğleden sonra: Üretim azalıyor" |
| 18-20 | "Akşam: Pik tüketim, batarya devrede" |
| 21-23 | "Gece: Şebekeden minimum alım" |
| 00-05 | "Gece yarısı: Sistem bekleme modunda" |

### Bölüm 2 — Alt Stat Kartları (3'lü)

1. **Anlık Panel Üretimi** — `<Sun />`, success, "XX.X kW", "Seçili saat üretimi"
2. **Batarya Durumu** — `<Battery />`, primary, "SoC% | XX kWh", durum
3. **Şebeke Durumu** — `<Zap />`, `gridExport>0`: yeşil "Satış: XX kW"; `gridImport>0`: kırmızı "Alım: XX kW"; ikisi de 0: gri "Bekleme"

**Mobil**: nodlar dikey dizilir (sol kaynaklar üst, sağ tüketiciler alt). Akış çizgileri yukarıdan aşağı çizilir.

---

## 15. Sprint 4 — Financial Simulator

İki sekme: **[Anlık Simülasyon] [Dönem Analizi]**
- Aktif: mavi alt çizgi + beyaz yazı
- Pasif: gri yazı
- Framer Motion ile sekme geçişi

### 15.A — Anlık Simülasyon (Tab 1)

#### Sayfa başlığı
- Sol: "Finansal Simülatör" / "Parametreleri değiştirerek yatırım getirisini anlık hesaplayın"
- Sağ: "Optimal Konfigürasyonu Göster" (`<Sparkles />`). Animasyon: `panelCapacity → 250`, `batteryCapacity → 45` (BESS hedefi), `apartmentCount → 100` (gerekirse).
- Üst: **CAPEX senaryo** seçici (`CostScenarioSelector`).

#### Sol kolon — Konfigürasyon Paneli

**Panel Gücü slider**:
- Üst: `<Sun />` + "Panel Gücü" sol, büyük değer badge sağ "250 kWp" (optimal→yeşil, değil→amber)
- Slider 50-400, step 10
- Alt: 3 zone bar `[🔴 Yetersiz 50-149][🟢 Optimal 150-350][🟡 Aşırı 351-400]` — mevcut zone highlight
- Uyarı mesajı:
  - `<150`: `<AlertTriangle />` + "Yetersiz kapasite — batarya dolmayabilir"
  - 150-350: `<CheckCircle />` + "Optimal aralık — maksimum verimlilik"
  - `>350`: `<AlertCircle />` + "Aşırı kapasite — fazla enerji şebekeye gidecek"

**Batarya Kapasitesi slider**:
- Üst: `<Battery />` + manuel giriş (`SliderValueInput`)
- Slider 0–150 kWh, HTML step 1, sürüklerken step 5 snap
- Alt: `[0 Bataryasız][45 MODÜ-GRID Hedefi][90 Genişletilmiş]`

**Blok / Daire**: +/- ve `SliderValueInput` (Finansal Simülatör stepper ile aynı mantık)

**Panel**: `ConfigSlider` + sağ üst manuel kWp girişi
**Ay Seçimi**: `<Calendar />` + 12 ay pill yatay (Oca Şub…). Seçili: mavi.

#### Sağ kolon — Finansal Çıktılar

**3 ana KPI** (Framer Motion spring count-up, eski → yeni değere kayma):
1. **Aylık Net Tasarruf** — büyük yeşil "₺ 14.250", alt "Daire başı: ₺ 142 / ay", `<TrendingUp />`
2. **Öz-Tüketim Oranı** — büyük mavi "%76", alt mini yatay bar, `<Target />`
3. **ROI Süresi** — büyük amber "4.2 Yıl", alt "Yatırım geri dönüş süresi", `<Clock />`

**Enerji breakdown tablosu** (5 satır + toplam):

```
<Sun />     Panel → Direkt Tüketim   425 kWh   2.50 ₺   1.062 ₺   (yeşil)
<Battery /> Batarya → Tüketim        412 kWh   2.25 ₺     927 ₺   (mavi)
<Zap />     Şebeke Satışı            288 kWh   1.50 ₺     432 ₺   (amber)
──────────────────────────────────────────────────────────────────
            Toplam Günlük Kâr                            2.421 ₺   (yeşil bold)

Aylık: ₺XX.XXX  |  Yıllık: ₺XXX.XXX
```

Framer Motion fade+slide.

**Karşılaştırma mini kartı**:
- Sol (kırmızı): "Geleneksel Sistem" — Öz-tüketim %35, Aylık kayıp -₺14.000 (apartmentCount'a orantılı), ROI 8+ Yıl
- Sağ (yeşil): "MODÜ-GRID" — context değerleri
- Ortada dikey ayırıcı

#### `ROIChart.jsx` ("Yatırım Geri Dönüş Analizi")

Recharts ComposedChart:
- XAxis: Yıl 1-10
- YAxis: Kümülatif Tasarruf (₺)

3 katman:
1. **MODÜ-GRID** — yeşil Area + gradient, her yıl: önceki + `yearlyProfit`, stroke `#10B981`
2. **Geleneksel** — gri kesikli Line, her yıl: önceki + `yearlyProfit * 0.35`, stroke `#6B7280` `strokeDasharray "4 4"`
3. **Yatırım Maliyeti** — sabit yatay ReferenceLine `batteryCapacity*3000 + panelCapacity*8000`, stroke `#EF4444` `strokeDasharray "8 4"`, label "Yatırım Maliyeti: ₺XXX.XXX". Y ekseni **kümülatif tasarruf eğrilerine** göre ölçeklenir; yatırım 10 yıllık birikimin çok üstündeyse çizgi grafik dışında metin olarak gösterilir (ölçeği bozmamak için).

**Amortisman** — MODÜ-GRID kümülatif tasarrufu yatırımı geçtiği yılda (`yatırım / yearlyProfit`) dikey amber kesikli ReferenceLine + amber marker + "Amortisman — Yıl X.X" label. Bu yıl **1–10 aralığında değilse** çizgi gösterilmez; grafik altında "Amortisman tahmini: X yıl (10 yıllık pencerede dışında)" notu verilir.

Grafik altı: "Yıl 10 (kümülatif): MODÜ-GRID: ₺X | Geleneksel: ₺X | Avantaj: ₺X" (yeşil bold).

`useMemo` ile hesaplamaları cache'le (slider drag sırasında performans).

### 15.B — Dönem Analizi (Tab 2)

#### Dönem seçimi
Card "Analiz Dönemi Seçin", iki kolon:
- Sol — "Başlangıç" + 12 ay pill yatay (default 1 Ocak)
- Sağ — "Bitiş" + 12 ay pill yatay (default 6 Haziran). `startMonth`'tan önceki aylar disabled (gri, tıklanamaz).

Alt: `<Calendar />` + "Ocak — Haziran arası 6 aylık analiz" (dinamik özet).

"Analizi Başlat" butonu: tam genişlik, mavi, `<PlayCircle />`, Framer Motion hover glow.

#### Özet KPI Kartları (4'lü, analiz sonrası fadeIn)

1. **Toplam Dönem Tasarrufu** — `<TrendingUp />`, "₺ " + `totalSavings.toLocaleString('tr-TR')`, "X aylık toplam net tasarruf"
2. **Ortalama Aylık Tasarruf** — `<BarChart2 />`, "₺ " + ortalamaAylık
3. **Toplam CO₂ Tasarrufu** — `<Leaf />`, success, `totalCO2` kg, alt: `totalTrees` ağaç
4. **Ortalama Öz-Tüketim** — `<Target />`, primary, `averageSelfConsumption`%

#### En İyi / En Zayıf Ay (2'li)

**Sol — En İyi Ay** (yeşil border glow):
- `<TrendingUp />` (success)
- "En Yüksek Verim Ayı"
- Büyük: `bestMonth.monthName`
- "₺ " + `bestMonth.monthlyProfit` + " tasarruf"
- "Üretim: " + `bestMonth.monthlyProduction.toFixed(0)` + " kWh"
- "Öz-tüketim: %" + `bestMonth.selfConsumptionRate.toFixed(0)`

**Sağ — En Zayıf Ay** (amber border):
- `<TrendingDown />` (warning)
- "En Düşük Verim Ayı"
- Aynı yapı (`worstMonth`)
- Alt not: "Kış aylarında güneşlenme azalır, batarya önemi artar"

#### Aylık Detay Grafiği (tam genişlik)

Card "Aylık Performans Karşılaştırması", Recharts ComposedChart:
- XAxis: seçilen aylar
- YAxis sol: Tasarruf ₺
- YAxis sağ: Öz-tüketim %

3 katman:
1. **Aylık tasarruf**: Bar yeşil. Best month: parlak yeşil + `<Star />` üstte. Worst month: amber.
2. **Öz-tüketim**: Line mavi (sağ Y), noktalarda label.
3. **Aylık üretim**: Line yeşil kesikli (sol Y).

Tooltip: "Temmuz / Tasarruf: ₺14.250 / Üretim: 33.750 kWh / Öz-tüketim: %76 / CO₂: 2.847 kg"

#### Kümülatif Birikim Grafiği

Card "Kümülatif Tasarruf Birikimi", Recharts AreaChart:
- XAxis: seçilen aylar
- YAxis: Kümülatif ₺
- Tek yeşil area + gradient (yukarı koyulaşır)
- Her nokta üstünde "₺XX.XXX" label
- Son noktada: büyük yeşil daire + "Toplam: ₺X" label + Framer Motion pulse
- Çizim: soldan sağa (1500ms `animationBegin`+`animationDuration`)

#### Aylık Detay Tablosu

Başlıklar: `Ay | Üretim (kWh) | Tasarruf (₺) | Öz-tüketim | CO₂ (kg) | Kümülatif (₺)`

Satır renkleri:
- Best month: yeşil arka plan tonu + `<Star />`
- Worst month: amber arka plan tonu
- Diğer: `surface-alt`/`card` alternating

Alt: kalın **TOPLAM** satırı.

Sağ alt: `<Download />` + "Raporu İndir" — **şu an `disabled`**. Hedef davranış: `html2canvas` + `jsPDF` → A4 yatay `MODU-GRID-Donem-Raporu-{tarih}.pdf`.

**Boş state**: analiz başlatılmadan grafikler/kartlar görünmez. Yerine `<BarChart2 />` + "Dönem seçin ve analizi başlatın" placeholder.

---

## 16. Sprint 5 — Resident Dashboard

`ResidentDashboard.jsx` — sidebar **yok**, daha sade.

### Layout
- Navbar (çıkış var, sidebar yok)
- Üst banner amber (yumuşak): pulse nokta + "Simülasyon Modu — Veriler örnek simülasyon verisine dayanmaktadır"
- Ana içerik: p-6, `bg-background`

### Sayfa başlığı
- `<Home />` + "Hoş geldiniz, [username]" (localStorage'dan)
- Altında: "Blok A — Daire 1"
- Sağda: daire dropdown (daire1-daire10), `selectedApartment` günceller

### Daire bazlı veri (seed'li pseudo-random)

```js
function daireSeed(username) {
  const n = parseInt(username.replace('daire', ''), 10) || 1;
  return Math.abs(Math.sin(n * 9301 + 49297)) % 1;        // [0..1)
}
const baseConsumption = getDailyConsumption(1) * 30;       // aylık tek daire
const variance        = 0.85 + daireSeed(username) * 0.3;  // 0.85-1.15
const daireMonthly    = baseConsumption * variance;        // sabit/seed bazlı
const daireSavings    = (selfConsumptionRate/100) * daireMonthly * 2.50;
```

### Bölüm 1 — Kişisel KPI Kartları (4'lü)

1. **Bu Ayki Tasarruf** — `<TrendingUp />`, success, "₺ " + tasarruf, trend "+8-15%" seed
2. **Aylık Tüketimim** — `<Zap />`, primary, `daireMonthly.toFixed(0)` kWh
3. **Yeşil Enerji Payım** — `<Sun />`, success, `selfConsumptionRate`%
4. **Akıllı Sigorta** — `<ShieldCheck />`, success, "Aktif", alt "Son kontrol: bugün 14:32", yeşil glow border

### Bölüm 2 — İki Kolon

#### Sol — Kişisel Tüketim Grafiği

Card "Günlük Tüketim Profilim". Recharts **stacked BarChart**:
- XAxis: 0-23 saat
- YAxis: kWh
- 3 stack: yeşil (Güneş) / mavi (Batarya) / gri (Şebeke) = toplam tüketim
- Tooltip: `14:00 / Toplam: 0.8 kWh / Güneş: 0.6 / Batarya: 0.1 / Şebeke: 0.1`
- Legend altta (renk kare + yazı)

#### Sağ — İki küçük kart

**Kart 1 — Bloğum**: "Blok A" + `<Building2 />`
- Mini bina SVG: 5 katlı, her katta 4 daire dikdörtgeni
- Kullanıcı dairesi: mavi glow parlak; diğerleri: koyu gri
- Bina çerçevesi: `border-border`
- Altında 3 stat: "Blok Toplam Tüketim: X kWh/gün", "Blok Öz-Tüketim: %X", "Aktif Daire: 20"

**Kart 2 — Site Geneli**: "Site Geneli" + `<Globe />`
- `<Sun />` (yeşil) — "Anlık Üretim: " + `(dailyProduction/12).toFixed(0)` kW
- `<Battery />` (mavi) — "Batarya Doluluk: %X" + mini progress bar
- `<Zap />` — "Şebeke Durumu":
  - 08-18: "Satış Yapılıyor" (yeşil)
  - 18-23: "Dengede" (amber)
  - Gece: "Minimum Alım" (gri)

### Bölüm 3 — Akıllı Sigorta Paneli (tam genişlik)

Card "Akıllı Sigorta Sistemi", 3 kolon:

**Sol — Büyük ikon**: `<ShieldCheck />` (64px, success). Framer Motion pulse (`scale 1→1.05→1` loop). "Aktif" yazısı.

**Orta — Durum satırları**:
- "● Aktif — Normal Çalışma" (yeşil, büyük)
- "Son kontrol: bugün 14:32"
- `<CheckCircle />` (yeşil) + "Aşırı Yük Koruması — Normal"
- `<CheckCircle />` (yeşil) + "Voltaj Dengesi — Normal"
- `<Wifi />` (amber) + "LoRaWAN Bağlantısı — Simülasyon Modu"

Alt not (gri sm italic): "Gerçek saha verisi için donanım bağlantısı gereklidir. Mevcut veriler simülasyona dayanmaktadır."

**Sağ — 7 Günlük Stabilite**:
- Küçük Recharts LineChart
- 7 günlük stabilite skoru (85-100 arası, daire seed'li sabit değerler)
- Yeşil çizgi minimal
- Alt not: "Son verileri için MODÜ-GRID donanım kurulumu gereklidir."

### Stagger
Tüm kartlar sayfa açılışında Framer Motion stagger 0.1sn fadeIn.

---

## 17. Sprint 6 — Carbon Panel

`CarbonPanel.jsx` — Layout: Navbar + HardwareStatusBanner + Sidebar + main p-6.

### Sayfa başlığı
- `<Leaf />` (success) + "Karbon & Sürdürülebilirlik"
- Altında: "Çevresel etki ve yeşil enerji analizi"

### Bölüm 1 — Hero Etki Kartları (3'lü, tam genişlik, yeşil glow border)

Tüm sayılar **count-up** animasyonu (Framer Motion useSpring veya 16ms interval, 60fps).

1. **Engellenen CO₂** — `<Wind />` (48px), büyük "X kg", "Bu ay atmosfere salınmadı", alt "Yıllık: X kg CO₂"
2. **Kurtarılan Ağaç** — `<Trees />` (48px), büyük "X", "Ağacın yıllık emdiği CO₂'ye eşdeğer", alt "1 ağaç = 21 kg CO₂/yıl"
3. **Trafikten Çekilen Araç** — `<Car />` (48px), büyük "X.X", "Araç yıllık emisyonuna eşdeğer", alt "1 araç = 2.4 ton CO₂/yıl"

### Bölüm 2 — İki Kolon

#### Sol — `CarbonChart.jsx` ("Aylık CO₂ Tasarrufu Trendi")

Recharts BarChart:
- XAxis: 12 ay (Oca-Ara)
- YAxis: CO₂ (kg)
- Her ay: `panelCapacity * sunshineHours[m] * selfConsumptionRate * 0.5 * 30`
- Bar renk:
  - Yaz (May-Eyl): parlak yeşil `#10B981`
  - Kış (Kas-Şub): soluk yeşil `#065F46`
- `selectedMonth`: amber border highlight
- Tooltip: "Temmuz: X.XXX kg CO₂ tasarruf"
- Grafik altı: `<Info />` + "Yaz aylarında güneşlenme artışıyla tasarruf zirveye ulaşır"

#### Sağ — Enerji Miksi

Card "Enerji Kaynağı Dağılımı", Recharts donut PieChart:
- Güneş: `selfConsumptionRate * 0.65`, `#10B981`
- Batarya: `selfConsumptionRate * 0.35`, `#3B82F6`
- Şebeke: `100 - selfConsumptionRate`, `#374151`

Donut merkezi: büyük yeşil "%XX" + "Yeşil Enerji" (gri).

Legend: kare + yazı + yüzde.

**İkinci küçük kart** ("Karbon Yoğunluğu Karşılaştırması"):
- Geleneksel: gri uzun bar, "485 kg CO₂/ay" sağda
- MODÜ-GRID: yeşil kısa bar, `monthlyCO2Saved` kg sağda
- Altında: "%XX daha az emisyon" (yeşil bold), `((485 - monthlyCO2Saved)/485*100).toFixed(0)`

### Bölüm 3 — Sürdürülebilirlik Skoru (tam genişlik)

Card "MODÜ-GRID Sürdürülebilirlik Skoru".

**Skor formülü** (`CarbonPanel.jsx`, `BATTERY_TARGET_KWH = 45`):
```
score = min(1000,
  selfConsumptionRate * 5
  + (batteryCapacity / 45) * 200                         // BESS hedefi referansı
  + (panelCapacity in 150..350 ? 100 : 50)
  + 100                                                // mevzuat (sabit)
  + 60                                                 // V2G (sabit)
)
```

**Görsel**:
- Üst: büyük "XXX / 1000"
- Geniş progress bar (yeşil gradient + glow)
- Bar altı 4 milestone: 250 "Başlangıç" / 500 "Gelişmekte" / 750 "İyi" / 1000 "Mükemmel"
- Mevcut skora göre aktif milestone highlight

**Sağ — skor bileşenleri** (5 satır):
- `<CheckCircle />` (yeşil) "Öz-Tüketim Oranı" `(selfConsumptionRate*0.85).toFixed(0)` / 100
- `<CheckCircle />` (yeşil) "Batarya Kullanımı" `min(100, (batteryCapacity/45*100*0.78))` / 100
- `<CheckCircle />` (yeşil) "Şebeke Bağımsızlığı" `(selfConsumptionRate*0.72).toFixed(0)` / 100
- `<CheckCircle />` (yeşil glow) "Mevzuat Uyumu" 100/100
- `<Circle />` (mavi) "V2G Hazırlığı" 60/100

**Mevzuat uyum kartı** (sağ alt, 3 badge):
- `<CheckCircle />` + "2 Nisan Yönetmeliği" (yeşil)
- `<CheckCircle />` + "Saatlik Mahsuplaşma Uyumlu" (yeşil)
- `<Zap />` + "V2G Entegrasyonuna Hazır" (mavi)

---

## 18. Sprint 7 — Comparison

`Comparison.jsx` — Layout: Navbar + HardwareStatusBanner + Sidebar + main p-6.

### Sayfa başlığı (ortalanmış)
- Büyük: "Geleneksel Sistem vs MODÜ-GRID"
- Alt: "Aynı site, aynı paneller — fark sadece zekada"
- Framer Motion fadeIn + slideDown

### İki kolon başlığı
- Sol: `<AlertTriangle />` (warning) + "Geleneksel Sistem" (amber/kırmızı ton)
- Sağ: `<CheckCircle />` (success) + "MODÜ-GRID" (yeşil ton)
- Ortada dikey ince `border-border` çizgi

### Bölüm 1 — Karşılaştırma Tablosu (7 satır)

Yapı: `[Sol değer] | [Merkez etiket] | [Sağ değer]`

| # | Etiket | Geleneksel | MODÜ-GRID |
|---|--------|-----------|-----------|
| 1 | Öz-Tüketim Oranı | "%35" kırmızı + kısa kırmızı bar | `selfConsumptionRate`% + uzun yeşil bar |
| 2 | Aylık Net Finansal Etki | "-₺X" `<TrendingDown />` kırmızı (`14000 * apartmentCount/100`) | "+₺X" `<TrendingUp />` yeşil |
| 3 | Günlük Şebeke Kaybı | "X kWh" kırmızı büyük (`725 * apartmentCount/100`) | `gridExportDaily.toFixed(0)` kWh yeşil |
| 4 | Yatırım Geri Dönüş | "8+ Yıl" `<Clock />` kırmızı | `roiYears.toFixed(1)` Yıl `<Clock />` yeşil |
| 5 | Aylık Karbon Emisyonu | "X kg/ay" `<Wind />` kırmızı (`485 * apartmentCount/100`) | `monthlyCO2Saved` kg/ay `<Leaf />` yeşil |
| 6 | 2 Nisan Yönetmeliği | `<XCircle />` (kırmızı) + "Uyumsuz" | `<CheckCircle />` (yeşil) + "Tam Uyumlu" + glow |
| 7 | V2G | `<XCircle />` (kırmızı) + "Hazır Değil" | `<CheckCircle />` (mavi) + "Entegre Hazır" |

> Geleneksel rakamlar 100 daireli referans tesisten **`apartmentCount/100`** ile orantısal scale edilir. Yüzde/yıl gibi oranlar sabit.

**Satır tasarımı**:
- Çift satır: `bg-surface-alt` (`#0D1321`)
- Tek satır: `bg-card`
- MODÜ-GRID kolonu: sol border `2px solid #10B981` + subtle glow
- Geleneksel kolon: sol border `2px solid #EF4444`
- Framer Motion satırlar stagger 0.1sn slideIn

**Geleneksel sabitleri** (`simulationDefaults.js → LEGACY_BASELINE`):
```js
{
  baseApartments: 100,
  selfConsumption: 35,
  monthlyLoss: 14000,
  dailyGridLoss: 725,
  roiYears: 8.0,
  monthlyCO2: 485
}
```

### Bölüm 2 — İki Kolon

#### Sol — Kümülatif 10 Yıllık Tasarruf

Card, Recharts AreaChart:
- XAxis: Yıl 1-10
- YAxis: Kümülatif ₺
- MODÜ-GRID: yeşil area + gradient, her yıl: önceki + `yearlyProfit`
- Geleneksel: gri area + gradient, her yıl: önceki + `yearlyProfit*0.35` (`LEGACY_BASELINE.profitEfficiencyVsModu`)
- Yatırım maliyeti: kırmızı ReferenceLine yatay, label "Yatırım Maliyeti"
- Amortisman: amber dikey ReferenceLine kesikli, "Amortisman — Yıl X.X"

Grafik altı:
```
Yıl 10'da:
  MODÜ-GRID:    ₺X (yeşil)
  Geleneksel:   ₺X (gri)
  Fark:         ₺X avantaj (yeşil bold)
```

#### Sağ — Karar Özeti (Yatırım Özeti)

Card, premium yatırım notu hissi, 7 madde stagger:
- `<CheckCircle />` "Yatırım `roiYears` yılda kendini amorti eder"
- `<CheckCircle />` "10 yılda ₺X ek getiri"
- `<CheckCircle />` "%X öz-tüketim oranı"
- `<CheckCircle />` "2 Nisan mevzuatına tam uyum"
- `<CheckCircle />` "V2G entegrasyonuna hazır altyapı"
- `<CheckCircle />` "LoRaWAN ile internet bağımsız haberleşme"
- `<CheckCircle />` "Daire başı aylık ₺X tasarruf"

### Kapanış Banner (tam genişlik)

- Yeşil subtle gradient + `border-success` + `box-shadow: 0 0 30px rgba(16,185,129,0.2)`
- Beyaz büyük "MODÜ-GRID"
- Altında italic yeşil "Enerjiyi Sadece Ölçmüyoruz, Yönetiyoruz"
- Framer Motion pulse (glow gelip gidiyor)

---

## 19. Sprint 8 — Polish

- Tüm sayfalar arası Framer Motion `AnimatePresence` ile fade geçişi
- KPI sayılarının değişiminde spring count-up
- Recharts smooth transition için `isAnimationActive`
- Page-level Suspense + skeleton placeholder'lar (slider hareketinde flash önlemek için)
- Accessibility pass: focus ring'leri, `aria-label`'lar, slider için `aria-valuenow`
- Lighthouse: production build > 90 performans
- Tab arası storage sync (`window.addEventListener('storage', ...)`)

---

## 20. Onaylı Kararlar

| Konu | Karar |
|------|-------|
| İş akışı | Tüm sayfaları sırayla yaz (tasarım gelmeden). Tasarım gelince refine. |
| Daire sakini datası | Daire numarasına bağlı seed (`Math.sin`). Sabit pseudo-random varyasyon. |
| State persist | ✅ `modugrid:sim` — `SimulationContext` persist + çoklu sekme `storage` sync. |
| Navbar reset | ✅ Admin `<RotateCcw />` → `context.reset()`. |
| Mobil admin nav | ✅ `<lg` hamburger + drawer (`Navbar.jsx`). |
| Comparison scale | ✅ `scaleLegacyBaseline(apartmentCount)`. |
| Geleneksel sistem rakamları | Sabit (hardcoded `LEGACY_BASELINE`), apartmentCount'a orantılı scale. |
| Currency format | `Intl.NumberFormat('tr-TR')` → `1.234,56 ₺` |
| Logo | Sprint 1'de placeholder: `<Zap />` + "MODÜ-GRID". Gerçek logo geldiğinde swap. |
| Toast/notification | Yok. Login için inline shake + kırmızı metin yeterli. |
| Stabilite skoru (resident) | 7 günlük 85-100 arası daire-seed bazlı sabit değerler. |
| Responsive | §4.5'e bakın — mobil + tablet + masaüstü tam destek. |
| EnergyFlow saat state'i | Local state (`useState`). Context'e taşınmaz. |
| Sürdürülebilirlik skoru | Sprint 6'daki formül (max 1000). |
| EnergyFlowDiagram render | Custom SVG (react-flow değil). |
| Login canvas perf | `document.visibilityState === 'hidden'` iken durdurulur. |
| Daire sakini login | `daire1`-`daire10` ayrı kullanıcı, her birinin kendi seed datası. |
| Hardware banner | Banner + tıklanınca tek mesajlı modal ("Donanım bulunamadı..."), CTA yok. |
| Tasarım kaynağı | HTML mock (Figma değil). Mock geldikçe sayfa sayfa port edilir. |
| EnergyFlow Play hızı | Sabit 1sn/saat. Hız kontrolü yok. |
| Raporu İndir | Planlı: jsPDF + html2canvas A4 yatay. **Mevcut: buton disabled.** |
| Üye Ol | Login toggle + Supabase signUp veya yerel kayıt. |
| Manuel slider girişi | `SliderValueInput` tüm parametrelerde. |
| BESS hedefi | 45 kWh (`BATTERY_TARGET_KWH`), slider max 150 kWh. |
| CAPEX senaryoları | `costScenario` + `SCENARIO_PRESETS` (4 preset). |
| Tasarım referansı | [DESIGN.md](./DESIGN.md) + `tailwind.config.js`. |
| Modal kapatma | Backdrop tıklama + Esc + X butonu (3 yol da çalışır). |

---

## 21. Tasarım Referansı

Kullanıcı tasarımları **HTML mock** olarak gönderecek (Figma yerine). Her sayfa için referans HTML/CSS verilecek; biz Tailwind + React + Lucide ile portlayacağız. HTML mock'ta gördüğümüz:
- Renkler → §4.1 paletine map
- Spacing → Tailwind scale
- İkonlar → Lucide karşılığı bulunur (emoji asla, raster asla)
- Animasyon ipuçları → Framer Motion ile uygulanır

Bir mock geldiğinde önce o sayfaya kilitleniriz, port biter, sonra diğerine geçeriz.

---

## 22. Başarı Kriterleri

- [ ] Jüri 5 dakikada ürünü anlayabilir
- [ ] Slider tepkisi ≤100ms
- [ ] Tüm sayfalar koyu temada profesyonel (template benzemez)
- [ ] Sayfa geçişleri sarsıntısız
- [ ] Hesaplamalar tutarlı: `production = directUse + batteryCharge + gridExport`
- [ ] Mobil + tablet + masaüstünde layout bozulmadan kullanılır (§4.5)
- [ ] Lighthouse performans > 90 (üretim build)
- [ ] Hiçbir emoji veya raster image yok
- [ ] Tüm metinler doğru Türkçe (Ş, Ğ, Ü, Ç, İ, Ö)
