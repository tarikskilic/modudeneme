/** @type {const} */
export const SUNSHINE_HOURS = {
  1: 2.5,
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
  12: 2.3,
};

export const ELECTRICITY_PRICES = {
  gridImport: 2.5,
  gridExport: 1.5,
  directAvoided: 2.5,
  batteryAvoided: 2.25,
};

export const BATTERY_PARAMS = {
  minSocFraction: 0.1,
  initialSocFraction: 0.2,
  dod: 0.9,
  roundTripEfficiency: 0.9,
};

export const INVESTMENT_COSTS = {
  batteryPerKwh: 3000,
  panelPerKwp: 8000,
};

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
  perKwhKg: 0.5,
  treeKgPerMonth: 1.75,
  carKgPerYear: 2400,
};

/** Saat dilimleri: 8–16 düşük gündüz, 17–23 akşam piki, diğer gece */
export const CONSUMPTION_PROFILE = {
  daytime: { from: 8, to: 16, weight: 0.035 },
  peak: { from: 17, to: 23, weight: 0.085 },
  night: { weight: 0.02 },
};

export const DEFAULT_SIMULATION = {
  panelCapacity: 250,
  batteryCapacity: 500,
  blockCount: 5,
  apartmentCount: 100,
  selectedMonth: 7,
  selectedApartment: 'daire1',
  hardwareConnected: false,
};

/** Slider min/max/step değerleri — UI sınırları */
export const SLIDER_RANGES = {
  panelCapacity: { min: 50, max: 400, step: 10 },
  batteryCapacity: { min: 0, max: 500, step: 50 },
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
