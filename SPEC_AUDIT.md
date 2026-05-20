# MODÜ-GRID — Spec Audit Raporu

> `PRODUCT.md` ↔ kod uyumu. **Son tarama: 2026-05-20** (dokümantasyon ve implementasyon senkronu).

**Dokümantasyon**: [README.md](./README.md) · [DESIGN.md](./DESIGN.md) · [PRODUCT.md](./PRODUCT.md) (üst “Son güncelleme” notu).

---

## Yönetici Özeti

| Katman | Uyum | Not |
|--------|------|-----|
| Foundation (motor, constants, context) | **~95%** | `SLIDER_RANGES`, `modugrid:sim` persist, CAPEX senaryoları |
| Auth (login, üye ol, demo) | **~95%** | Supabase + yerel fallback |
| Admin sayfalar + slider UX | **~92%** | Manuel giriş, mobil drawer |
| Karbon / Karşılaştırma / Sakin | **~90%** | BESS 45 kWh formülleri kodda güncel |
| **Genel** | **~92%** | Kalan boşluklar çoğunlukla PDF export ve kozmetik |

Önceki P0 maddelerinin çoğu **kapatıldı** (aşağıda ✅). Açık iş: **PDF export**, bazı P2 kozmetik, isteğe bağlı testler.

---

## ✅ Önceki P0 — Durum (2026-05-20)

| ID | Konu | Durum |
|----|------|--------|
| P0-1 | `modugrid:sim` localStorage persist | ✅ `SimulationContext.jsx` |
| P0-2 | Navbar admin reset | ✅ `RotateCcw` → `reset()` |
| P0-3 | Mobil hamburger + drawer | ✅ `Navbar.jsx` (`lg:hidden` Menu) |
| P0-4 | Comparison `apartmentCount` scaling | ✅ `scaleLegacyBaseline()` |

---

## 🔴 Açık — Öncelikli

### A-1. PDF / CSV export (M-2)
- **Yer**: `PeriodAnalysisTab.jsx` — "Raporu İndir" `disabled`
- **Spec**: A4 yatay PDF (`jspdf` + `html2canvas` bağımlılıkta hazır)
- **Çözüm**: Export handler + dosya adı `MODU-GRID-Donem-Raporu-{tarih}.pdf`

---

## 🟠 P1 — Önemli

### P1-1. `CONSUMPTION_PROFILE` saat 17 ✅ düzeltildi
- Kod: `daytime.to: 17`, `peak.from: 18` — spec ile uyumlu.

### P1-2. `LEGACY_BASELINE` ✅ genişletildi
- `dailyGridLossKwh`, `monthlyCo2EmissionKg`, `scaleLegacyBaseline()` — Comparison kullanıyor.

### P1-3. `SLIDER_RANGES` / `MONTH_NAMES` ✅ export
- `simulationDefaults.js`; slider bileşenleri `SLIDER_RANGES` tüketiyor.

### P1-4. Daire seed sabitleri
- Spec: `9301`, `49297` — Kod: farklı sabitler, **fonksiyonel eşdeğer**. Spec veya kod tek satırda hizalanabilir (düşük öncelik).

### P1-5. ROI geleneksel oran ✅
- `LEGACY_BASELINE.profitEfficiencyVsModu` (0,35) — ROIChart + Comparison.

### P1-6. HardwareStatusBanner mobil
- Kısmi: `truncate` var; spec’teki kısa metin + `RadioTower` ikon-only **eksik** (P2’ye indirilebilir).

---

## 🟡 P2 — Kozmetik

| # | Bulgu |
|---|--------|
| P2-1 | KPI stagger 0,08s vs spec 0,1s |
| P2-2 | Admin KPI grid `sm:` vs spec `md:` |
| P2-3 | SliderPanel +/- touch 32px vs spec 44px |
| P2-4 | EnergyFlow timeline konumu |
| P2-5 | CarbonChart selected fill dead branch |
| P2-6 | `BatterySOCChart.jsx` dosyası yok (M-1) |

---

## 🆕 Kodda var, eski spec’te eksik (pozitif)

| # | Özellik |
|---|---------|
| E-1 | `SliderValueInput` — manuel parametre girişi |
| E-2 | `CostScenarioSelector` + `costScenario` state |
| E-3 | `signUp` + Üye Ol UI |
| E-4 | `CANONICAL_SCENARIO` + `BATTERY_TARGET_KWH` (45) |
| E-5 | `getAnnualFinancialMetrics` / yıllık ROI |
| E-6 | Eski persist 500 kWh → 45 kWh migrasyonu (`loadInitial`) |

---

## Öneri yol haritası

1. **PDF export** (A-1) — tek net özellik borcu  
2. **HardwareStatusBanner** mobil metin/ikon (P1-6)  
3. **Unit test** — `energyCalculations.js` regression (ürün şartı değil, öneri)  
4. **Lighthouse** — production build ölçümü (§22 kriteri)

---

## Karar kaydı

| Konu | Karar |
|------|--------|
| PDF | Planlı; UI placeholder disabled — README/PRODUCT’ta belirtildi |
| BESS | 45 kWh hedef, slider 0–150 kWh |
| Auth | Demo + Üye Ol + Supabase opsiyonel |
| Dokümantasyon | README + DESIGN + PRODUCT üst notu senkron |
