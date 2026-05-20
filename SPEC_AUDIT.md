# MODÜ-GRID — Spec Audit Raporu

> Mevcut implementasyonun `PRODUCT.md` ile uyumluluk denetimi. Tarama tarihi: 2026-05-20.

## Yönetici Özeti

| Katman | Match | Minor | Major | Missing | Extra | Uyum |
|---|---:|---:|---:|---:|---:|---:|
| Foundation (config + engine + state) | 27 | 5 | 2 | 4 | 3 | **~88%** |
| Components + Admin sayfalar | 42 | 8 | 3 | 6 | 7 | **~85%** |
| Feature sayfalar (Financial/Resident/Carbon/Comparison) | 26 | 5 | 1 | 1 | 3 | **~92%** |
| **TOPLAM** | **95** | **18** | **6** | **11** | **13** | **~88%** |

**Genel değerlendirme**: Implementasyon olgun. Tüm sayfalar mevcut, formüller (sürdürülebilirlik skoru, finansal hesaplamalar, karbon metrikleri) spec ile birebir. Görsel katman %85+ uyumlu. Kritik kullanıcı akışı eksikleri **mobil navigasyon** ve **state persist** tarafında.

---

## 🔴 P0 — Ship-Blocker

Bunlar şipten önce çözülmeli; kullanıcı akışını kırıyor veya kararlı spec kararlarına aykırı.

### P0-1. localStorage state persist eksik (§20)
- **Yer**: `src/context/SimulationContext.jsx`
- **Spec §20**: "localStorage'a persist (`modugrid:sim`). Navbar'da admin için Sıfırla butonu."
- **Durum**: Context yalnızca bellek içi state. Sayfa yenilemede tüm slider değerleri sıfırlanır.
- **Çözüm**: `useEffect` ile `localStorage.setItem('modugrid:sim', ...)` ve mount'ta okuma.

### P0-2. Navbar admin reset butonu yok (§12.2, §20)
- **Yer**: `src/components/Navbar.jsx`
- **Spec**: Sağda `<RotateCcw />` ikon-buton (sadece admin, slider reset).
- **Durum**: Buton mevcut değil. Context'te `reset` fonksiyonu mevcut ama tetikleyici UI yok.
- **Çözüm**: Navbar sağ alanına role==='admin' guard'lı reset butonu.

### P0-3. Mobil hamburger + drawer eksik (§12.3)
- **Yer**: `src/components/Sidebar.jsx`, `src/components/Navbar.jsx`
- **Spec §12.3**: "`<lg` sidebar gizlenir, navbar'a `<Menu />` hamburger butonu eklenir. Drawer (sol slayd-in) açılır, backdrop overlay ile."
- **Durum**: Sidebar `hidden lg:flex` ile mobilde tamamen kayboluyor. Navbar'da hamburger yok, drawer state yok. **Mobil admin kullanıcılar sayfalar arası geçemez.**
- **Çözüm**: Navbar'a `<Menu />` butonu + Drawer komponenti (Framer Motion slide-in + backdrop).

### P0-4. Comparison tablosu apartmentCount scaling uygulanmıyor (§18)
- **Yer**: `src/pages/Comparison.jsx:172-188`, 3-5. satırlar
- **Spec §18**: "Geleneksel rakamlar 100 daireli referans tesisten **`apartmentCount/100`** ile orantısal scale edilir."
- **Durum**: Aylık finansal etki (-₺14.000), günlük şebeke kaybı (725 kWh), aylık CO₂ (485 kg) hardcoded sabit. Slider'da daire sayısı 200'e çekilse de geleneksel taraf 100-daire referansta kalıyor → karşılaştırma yanıltıcı.
- **Çözüm**: `LEGACY_BASELINE.monthlyLossTl * apartmentCount / 100` benzeri scale.

---

## 🟠 P1 — Önemli (Spec sapması, davranış etkili)

### P1-1. `CONSUMPTION_PROFILE` saat 17 off-by-one
- **Yer**: `src/constants/simulationDefaults.js:50-55`
- **Spec §9.4**: "08-17 gündüz 0.035, **17-23 akşam 0.085**"
- **Durum**: Kod `daytime: { from: 8, to: 16 }` + `peak: { from: 17, to: 23 }`. Saat 17 gündüz dilimine ait olmalıyken peak'e yazılı. Toplam normalize edildiğinden günlük tüketim doğru ama saat 17'deki tüketim ~2.4× şişiyor.
- **Çözüm**: `daytime.to: 17` yap.

### P1-2. `LEGACY_BASELINE` eksik alanlar
- **Yer**: `src/constants/simulationDefaults.js`
- **Spec §18**: `baseApartments, selfConsumption, monthlyLoss, dailyGridLoss: 725, roiYears: 8.0, monthlyCO2: 485`
- **Durum**: `dailyGridLoss` ve `monthlyCO2` alanları yok. Comparison sayfası magic number kullanıyor.
- **Çözüm**: Alanları ekle, Comparison.jsx hardcoded değerleri buradan oku.

### P1-3. `MONTH_NAMES` ve `SLIDER_RANGES` export yok
- **Yer**: `src/constants/simulationDefaults.js`
- **Spec §10**: İkisi de constants'ta listeli.
- **Durum**: `AY_ADLARI` yalnızca `energyCalculations.js` içinde module-private. `SLIDER_RANGES` hiç yok — slider min/max/step hardcoded.
- **Çözüm**: Constants'a export et, mevcut hardcoded kullanımları refactor.

### P1-4. Daire seed formülü farklı sabitlerle
- **Yer**: `src/pages/ResidentDashboard.jsx:37-44`
- **Spec §16**: `Math.abs(Math.sin(n * 9301 + 49297)) % 1`
- **Durum**: Kod `(Math.sin(aptNum * 127.1823 + 9.721) + 1) / 2`. Aralık [0,1] aynı, variance `0.85 + t * 0.3` aynı → **fonksiyonel davranış eşdeğer**. Ama daire1'in spec ile aynı sabit veriyi üretmesi gerekiyorsa sapma var.
- **Çözüm**: Spec sabitlerine hizala, ya da spec'i koda göre güncelle.

### P1-5. ROIChart vs Comparison geleneksel sistem oranı — ✅ düzeltildi
- **Spec**: §15 ve §18 artık `yearlyProfit * 0.35` (`LEGACY_BASELINE.profitEfficiencyVsModu`)
- **Kod**: ROIChart + Comparison aynı sabiti kullanıyor; `roiProjection.js` tek hesap kaynağı

### P1-6. HardwareStatusBanner mobil eksik (§12.4)
- **Yer**: `src/components/HardwareStatusBanner.jsx`
- **Spec §12.4**: "Mobil: metin kısalır → 'Simülasyon Modu Aktif'; sağ buton ikon-only `<RadioTower />`"
- **Durum**: Sadece `truncate`. `<RadioTower />` ikonu kullanılmıyor, mobil metin kısaltması yok.
- **Çözüm**: `md:` breakpoint'lerle metin/ikon swap.

---

## 🟡 P2 — Minor (Kozmetik / kenar durumu)

| # | Bulgu | Yer |
|---|---|---|
| P2-1 | Stagger delay 0.08s, spec 0.1s | `KPICard.jsx:68-74` |
| P2-2 | Grid breakpoint `sm:grid-cols-2`, spec `md:grid-cols-2` | `AdminDashboard.jsx:114` |
| P2-3 | SliderPanel +/- butonları `h-8 w-8` (32px), spec mobil h-11 (44px) touch hedef | `SliderPanel.jsx:176-210` |
| P2-4 | EnergyFlow timeline spec'te "sayfa altında", kodda saat kontrolünün altında ortada | `EnergyFlow.jsx:182-198` |
| P2-5 | CarbonChart selected fill: `entry.selected ? entry.fill : entry.fill` (her iki branch aynı değer, açık ölü kod) | `CarbonChart.jsx:120` |
| P2-6 | `batterySavings` hesabı `ELECTRICITY_PRICES.batteryAvoided` (2.25) sabitini bypass edip `directAvoided * roundTripEfficiency` ile yeniden türetiyor (sonuç aynı, refactor riski) | `energyCalculations.js:153` |
| P2-7 | Akış çizgisi animasyonu `flow-line-active` CSS class — global CSS'de @keyframes flowDots olup olmadığı görsel testte doğrulanmalı | `EnergyFlowDiagram.jsx` |
| P2-8 | Navbar mobil dropdown menü yok (sadece truncate) | `Navbar.jsx` |

---

## 🚫 Eksik (Specte var, kodda yok)

| # | Eksik | Spec ref |
|---|---|---|
| M-1 | `BatterySOCChart.jsx` chart dosyası | §5 klasör yapısı |
| M-2 | "Raporu İndir" gerçek PDF/CSV export (şu an disabled placeholder) | §15.B (§21'de "sonraki sürüm" denmiş — tartışılır) |
| M-3 | EnergyFlow Play hız kontrolü (1x/2x/4x) | §21 "iterasyona ertelendi" notu var, kabul edilebilir |

---

## 🆕 Ekstra (Kodda var, specte yok — pozitif)

| # | Ekstra | Yer |
|---|---|---|
| E-1 | `hourlyData` context'te `useMemo` ile pre-compute | `SimulationContext.jsx:33-36` |
| E-2 | `KPICard` `numericValue + decimals + staggerIndex` propları (count-up için temiz API) | `KPICard.jsx:20-22` |
| E-3 | EnergyFlowDiagram akış çizgisi kalınlığı yoğunluğa bağlı (`strokeForFlow`) | `EnergyFlowDiagram.jsx:34-43` |
| E-4 | EnergyFlowDiagram'da kW label badge'leri (floating) | `EnergyFlowDiagram.jsx:500-510` |
| E-5 | AdminDashboard `productionTrend` dinamik hesaplama (spec sadece örnek vermişti) | `AdminDashboard.jsx:56-65` |
| E-6 | HardwareStatusBanner modal: backdrop tık + Esc + X üç kapatma yolu (§21 sorulan soruya cevap olarak) | `HardwareStatusBanner.jsx` |
| E-7 | `hourlyData[h].batteryChargeKwh` ve `storedKwh` ek alanları | `energyCalculations.js:108-110` |

---

## Öneri Yol Haritası

### Sprint Patch 1 (1-2 saat) — P0 düzeltmeleri
1. `SimulationContext` localStorage persist (P0-1)
2. Navbar reset butonu (P0-2)
3. Comparison apartmentCount scaling (P0-4)

### Sprint Patch 2 (2-4 saat) — Mobil + spec sapmaları
4. Mobil hamburger + drawer (P0-3)
5. CONSUMPTION_PROFILE saat 17 düzeltmesi (P1-1)
6. `LEGACY_BASELINE`, `MONTH_NAMES`, `SLIDER_RANGES` constants tamamlama (P1-2, P1-3)
7. HardwareStatusBanner mobil responsive (P1-6)

### Sprint Patch 3 (opsiyonel) — Polish
8. ROIChart/Comparison oran tutarlılığı (P1-5) — önce spec güncellenmeli
9. Daire seed sabit hizalama (P1-4)
10. P2 listesindeki kozmetik düzeltmeler

### Karar gereken (spec netleştirme)
- ~~**Spec içi tutarsızlık**: §15/§18 geleneksel oran~~ → **0,35** olarak hizalandı
- **PDF export**: §15.B mi yoksa sonraki sürüm mü? §21'de "sonraki" denmiş ama §18 "Raporu İndir" görsel placeholder dediği için ayrım net değil.
- **Daire seed**: spec sabitleri (`9301`, `49297`) vs kod sabitleri (`127.1823`, `9.721`) — fonksiyonel eşdeğer, sadece kararlılaştırılması gerek.

---

## Kapsam Dışı Notlar

- **Test coverage**: Proje testsiz. PRODUCT.md test gereksinimi belirtmiyor — Sprint 0 spec'i sadece iskelet diyor. Üretim öncesi en az `energyCalculations.js` için unit test (mevcut formüllerin regression koruması) önerilir.
- **Accessibility**: §1092 "Sprint 8 Polish" aşamasında "focus ring, aria-label, slider aria-valuenow" planlı. Şu an bu pas atlanmış görünüyor — `<button>` tag'leri var ama `aria-label` eksik gözlemlendi (örn. Navbar logout butonu).
- **Lighthouse**: §22 "üretim build > 90 performans" — bu denetimde ölçülmedi. Sprint Patch sonrası ölçülmeli.
