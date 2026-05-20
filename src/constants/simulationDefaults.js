/**
 * MODÜ-GRID — Simülasyon sabitleri
 * Resmi senaryo: Emlak Konut IDEathon / ELYSIUM_MODU-GRID.pptx
 * @see CANONICAL_SCENARIO
 */

/** @type {const} */
export const SUNSHINE_HOURS = {
  1: 2.1,
  2: 3.0,
  3: 3.8,
  4: 4.2,
  5: 4.5,
  6: 5.0,
  7: 5.2,
  8: 4.8,
  9: 4.0,
  10: 3.2,
  11: 2.8,
  12: 1.8,
};

/** EPDK Nisan 2024 — mesken ortak kullanım grubu, vergiler dahil (TL/kWh) */
export const ELECTRICITY_PRICES = {
  gridImport: 3.2,
  gridExport: 1.45,
  directAvoided: 3.2,
  batteryAvoided: 3.2,
};

export const BATTERY_PARAMS = {
  minSocFraction: 0.1,
  initialSocFraction: 0.2,
  dod: 0.9,
  roundTripEfficiency: 0.9,
};

/** Ortak alan günlük tüketim (kWh/daire/gün) — asansör, aydınlatma, hidrofor */
export const COMMON_AREA_KWH_PER_APT = 2.5;

/** Daire günlük tüketim (kWh/daire/gün) */
export const APARTMENT_KWH_PER_DAY = 10;

/** Batarya deşarjı yalnızca akşam pikinde ortak alan peak shaving için */
export const BATTERY_DISPATCH = {
  peakShavingOnly: true,
  /** Fazla üretim önce bataryayı doldurur, kalan şebekeye */
  surplusToBatteryFirst: true,
};

/** Proje hedefi — 100 dairelik site LiFePO4 BESS (kWh) */
export const BATTERY_TARGET_KWH = 45;

/** CAPEX senaryoları — ROI hesabında kullanılır */
export const SCENARIO_PRESETS = {
  demo: {
    id: 'demo',
    label: 'Demo',
    description: 'Sunum / MVP — düşük CAPEX',
    panelPerKwp: 8000,
    batteryPerKwh: 3000,
  },
  base: {
    id: 'base',
    label: 'Pilot',
    description: 'Türkiye piyasası — orta CAPEX, güncel tarife',
    panelPerKwp: 15000,
    batteryPerKwh: 5500,
  },
  conservative: {
    id: 'conservative',
    label: 'Conservative',
    description: 'Due diligence — yüksek CAPEX',
    panelPerKwp: 28800,
    batteryPerKwh: 11200,
  },
  subsidized: {
    id: 'subsidized',
    label: 'Teşvikli',
    description: 'Pilot CAPEX + %50 hibe (KOSGEB / TÜBİTAK / bölgesel)',
    panelPerKwp: 7500,
    batteryPerKwh: 2750,
  },
};

/** @param {keyof typeof SCENARIO_PRESETS} [scenarioId] */
export function getInvestmentCosts(scenarioId = 'base') {
  const preset = SCENARIO_PRESETS[scenarioId] ?? SCENARIO_PRESETS.base;
  return {
    panelPerKwp: preset.panelPerKwp,
    batteryPerKwh: preset.batteryPerKwh,
  };
}

/** Varsayılan senaryo maliyetleri (Pilot) */
export const INVESTMENT_COSTS = getInvestmentCosts('base');

/**
 * @param {number} panelCapacity kWp
 * @param {number} batteryCapacity kWh
 * @param {{ panelPerKwp: number, batteryPerKwh: number }} investmentCosts
 */
export function computeInvestment(panelCapacity, batteryCapacity, investmentCosts) {
  return (
    batteryCapacity * investmentCosts.batteryPerKwh +
    panelCapacity * investmentCosts.panelPerKwp
  );
}

/**
 * ROI (yıl) — geçersiz veya sıfır tasarruf durumunda null döner (UI: "—").
 * @returns {number | null}
 */
export function computeRoiYears(investment, annualSavings) {
  if (!(investment > 0) || !(annualSavings > 0)) return null;
  const roi = investment / annualSavings;
  return Number.isFinite(roi) && roi > 0 && roi < 1e6 ? roi : null;
}

/** @param {number | null | undefined} roiYears */
export function isRoiDisplayable(roiYears) {
  return typeof roiYears === 'number' && Number.isFinite(roiYears) && roiYears > 0 && roiYears < 1e6;
}

/** Geleneksel (karşılaştırma) referansı — 100 daire bazlı, ölçek: apartmentCount/100 */
export const LEGACY_BASELINE = {
  baseApartments: 100,
  selfConsumptionPercent: 35,
  monthlyLossTl: 14_000,
  roiLabel: '8+ Yıl',
  /** Günlük şebeke kaybı (kWh), 100 daire referansı */
  dailyGridLossKwh: 725,
  /** Aylık emisyon (kg CO₂), 100 daire referansı */
  monthlyCo2EmissionKg: 485,
  /**
   * Geleneksel sistemin MODÜ-GRID yıllık kârına oranı (ROI/karşılaştırma grafikleri için).
   * Tek kaynak: hem ROIChart hem Comparison aynı değeri kullanmalı.
   */
  profitEfficiencyVsModu: 0.35,
};

export function scaleLegacyBaseline(apartmentCount) {
  const s = Math.max(0.01, apartmentCount / LEGACY_BASELINE.baseApartments);
  return {
    monthlyLossTl: LEGACY_BASELINE.monthlyLossTl * s,
    dailyGridLossKwh: LEGACY_BASELINE.dailyGridLossKwh * s,
    monthlyCo2EmissionKg: LEGACY_BASELINE.monthlyCo2EmissionKg * s,
  };
}

export const CO2_FACTORS = {
  perKwhKg: 0.45,
  treeKgPerMonth: 1.75,
  carKgPerYear: 2400,
};

/** Saat dilimleri: 8–17 gündüz, 18–23 akşam piki, diğer gece */
export const CONSUMPTION_PROFILE = {
  daytime: { from: 8, to: 17, weight: 0.035 },
  peak: { from: 18, to: 23, weight: 0.085 },
  night: { weight: 0.02 },
};

export const DEFAULT_SIMULATION = {
  panelCapacity: 250,
  batteryCapacity: BATTERY_TARGET_KWH,
  blockCount: 5,
  apartmentCount: 100,
  selectedMonth: 7,
  selectedApartment: 'daire1',
  costScenario: 'base',
  hardwareConnected: false,
};

/**
 * Resmi jüri / deck senaryosu — simülatör çıktılarıyla doğrulanmış tek kaynak.
 * CAPEX yuvarlak değerler (₺4M / ₺2M / ₺7,7M) tablo sunumu içindir; motor tam hesap kullanır.
 */
export const CANONICAL_SCENARIO = {
  source: 'Emlak Konut IDEathon · ELYSIUM_MODU-GRID.pptx',
  location: 'İzmir',
  apartmentCount: 100,
  blockCount: 5,
  panelCapacityKwp: 250,
  batteryCapacityKwh: 45,
  batteryType: 'LiFePO4',
  batteryScope: 'Ortak alan peak shaving (18:00–23:00)',
  apartmentKwhPerDay: APARTMENT_KWH_PER_DAY,
  commonAreaKwhPerAptPerDay: COMMON_AREA_KWH_PER_APT,
  /** Yıllık ort. tüketim karşılama oranı (getFinancialMetrics.consumptionCoverageRate) */
  selfConsumptionRatePct: 37,
  annualSavingsTl: 776_364,
  tariffs: {
    gridImport: ELECTRICITY_PRICES.gridImport,
    gridExport: ELECTRICITY_PRICES.gridExport,
  },
  roiYears: {
    pilot: 5.1,
    subsidized: 2.6,
    conservative: 9.9,
  },
  capexTl: {
    pilot: 4_000_000,
    subsidized: 2_000_000,
    conservative: 7_700_000,
  },
  juryNarrative:
    'MODÜ-GRID sistemi, 250 kWp GES ve ortak alan peak shaving odaklı 45 kWh BESS altyapısıyla tasarlandı. ' +
    'Mevcut EPDK tarifeleri ve sanal mahsuplaşma simülasyonumuza göre sistem, hiçbir hibe desteği olmaksızın kendisini 5,1 yılda finanse etmektedir. ' +
    'Projenin Emlak Konut veya belediye iş birlikleriyle %50 hibe/teşvik kapsamına alınması durumunda ise geri dönüş süresi 2,6 yıla düşmektedir. ' +
    'Sistemin öz-tüketim oranını %37\'ye çıkararak ürettiği yıllık ₺776K net tasarruf, projenin finansal olarak kurşun geçirmez olduğunun kanıtıdır.',
};

/** Slider min/max/step değerleri — UI sınırları */
export const SLIDER_RANGES = {
  panelCapacity: { min: 50, max: 400, step: 10 },
  batteryCapacity: { min: 0, max: 150, step: 5 },
  blockCount: { min: 1, max: 10, step: 1 },
  apartmentCount: { min: 20, max: 200, step: 1 },
};

/** Türkçe ay adları — döngü ve dropdown'lar için */
export const MONTH_NAMES = {
  1: 'Ocak',
  2: 'Şubat',
  3: 'Mart',
  4: 'Nisan',
  5: 'Mayıs',
  6: 'Haziran',
  7: 'Temmuz',
  8: 'Ağustos',
  9: 'Eylül',
  10: 'Ekim',
  11: 'Kasım',
  12: 'Aralık',
};
