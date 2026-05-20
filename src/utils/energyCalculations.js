import {
  APARTMENT_KWH_PER_DAY,
  BATTERY_DISPATCH,
  BATTERY_PARAMS,
  COMMON_AREA_KWH_PER_APT,
  CO2_FACTORS,
  CONSUMPTION_PROFILE,
  ELECTRICITY_PRICES,
  INVESTMENT_COSTS,
  SUNSHINE_HOURS,
  computeInvestment,
  computeRoiYears,
} from '../constants/simulationDefaults.js';

export { SUNSHINE_HOURS };

function consumptionWeight(hour) {
  const { daytime, peak, night } = CONSUMPTION_PROFILE;
  if (hour >= daytime.from && hour <= daytime.to) return daytime.weight;
  if (hour >= peak.from && hour <= peak.to) return peak.weight;
  return night.weight;
}

/** @returns {number[]} */
function normalizedHourlyWeights() {
  const w = Array.from({ length: 24 }, (_, h) => consumptionWeight(h));
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / sum);
}

/**
 * raw üretim eğrisi (çan); normalize edilmeden
 */
function rawProductionShape(hour) {
  if (hour < 6 || hour > 18) return 0;
  return Math.exp(-0.5 * Math.pow((hour - 12) / 2.5, 2));
}

/**
 * @param {number} panelCapacity kWp
 * @param {number} month 1-12
 */
export function getDailyProduction(panelCapacity, month) {
  const k = SUNSHINE_HOURS[month] ?? SUNSHINE_HOURS[7];
  return panelCapacity * k;
}

function isPeakHour(hour) {
  const { peak } = CONSUMPTION_PROFILE;
  return hour >= peak.from && hour <= peak.to;
}

/**
 * @param {number} apartmentCount
 */
export function getDailyConsumptionSplit(apartmentCount) {
  const apartment = apartmentCount * APARTMENT_KWH_PER_DAY;
  const commonArea = apartmentCount * COMMON_AREA_KWH_PER_APT;
  return { apartment, commonArea, total: apartment + commonArea };
}

/**
 * @param {number} apartmentCount
 */
export function getDailyConsumption(apartmentCount) {
  return getDailyConsumptionSplit(apartmentCount).total;
}

/**
 * @param {number} panelCapacity
 * @param {number} apartmentCount
 * @param {number} batteryCapacity
 * @param {number} month
 */
export function getHourlyData(panelCapacity, apartmentCount, batteryCapacity, month) {
  const dailyProd = getDailyProduction(panelCapacity, month);
  const { apartment: apartmentDaily, commonArea: commonDaily } =
    getDailyConsumptionSplit(apartmentCount);

  const rawProd = Array.from({ length: 24 }, (_, h) => rawProductionShape(h));
  const prodSum = rawProd.reduce((a, b) => a + b, 0) || 1;
  const production = rawProd.map((r) => (dailyProd * r) / prodSum);

  const weights = normalizedHourlyWeights();
  const apartmentCons = weights.map((w) => apartmentDaily * w);
  const commonCons = weights.map((w) => commonDaily * w);
  const consumption = apartmentCons.map((a, i) => a + commonCons[i]);

  const cap = Math.max(0, batteryCapacity);
  const eMin = cap * BATTERY_PARAMS.minSocFraction;
  const eff = BATTERY_PARAMS.roundTripEfficiency;
  let stored = cap * BATTERY_PARAMS.initialSocFraction;
  const result = [];

  for (let h = 0; h < 24; h++) {
    const p = production[h];
    const aptC = apartmentCons[h];
    const commonC = commonCons[h];
    const c = consumption[h];
    const eStart = stored;

    let directUse = 0;
    let batteryUse = 0;
    let gridImport = 0;
    let gridExport = 0;
    let batteryChargeKwh = 0;

    // 1) Güneş → önce daire, sonra ortak alan (direkt)
    const aptDirect = Math.min(p, aptC);
    let pRem = p - aptDirect;
    const commonDirect = Math.min(pRem, commonC);
    pRem -= commonDirect;
    directUse = aptDirect + commonDirect;

    const aptDef = aptC - aptDirect;
    const commonDef = commonC - commonDirect;

    // 2) Fazla üretim → batarya (öncelik), kalan şebekeye satış
    if (pRem > 0 && cap > 0) {
      const space = Math.max(0, cap - eStart);
      batteryChargeKwh = Math.min(pRem, space);
      stored = eStart + batteryChargeKwh;
      gridExport = pRem - batteryChargeKwh;
    } else if (pRem > 0) {
      stored = eStart;
      gridExport = pRem;
    } else {
      stored = eStart;
      gridExport = 0;
    }

    // 3) Daire açığı → şebeke
    gridImport = aptDef;

    // 4) Ortak alan açığı → pik saatte batarya peak shaving, diğer saatler şebeke
    if (commonDef > 0) {
      if (
        cap > 0 &&
        BATTERY_DISPATCH.peakShavingOnly &&
        isPeakHour(h)
      ) {
        const maxDischarge = Math.max(0, stored - eMin);
        const maxDeliverable = maxDischarge * eff;
        batteryUse = Math.min(commonDef, maxDeliverable);
        stored -= batteryUse / eff;
        gridImport += commonDef - batteryUse;
      } else {
        gridImport += commonDef;
      }
    }

    stored = Math.min(Math.max(stored, cap > 0 ? eMin : 0), cap);
    const batterySoC = cap > 0 ? (stored / cap) * 100 : 0;

    result.push({
      hour: h,
      production: p,
      consumption: c,
      apartmentConsumption: aptC,
      commonConsumption: commonC,
      batterySoC,
      gridImport,
      gridExport,
      directUse,
      batteryUse,
      batteryChargeKwh,
      storedKwh: stored,
    });
  }

  return result;
}

/**
 * @param {ReturnType<typeof getHourlyData>} hourlyData
 * @param {number} batteryCapacity
 * @param {number} apartmentCount
 * @param {number} panelCapacity
 */
export function getFinancialMetrics(
  hourlyData,
  batteryCapacity,
  apartmentCount,
  panelCapacity
) {
  let gridExportRevenue = 0;
  let gridImportCost = 0;
  let directSavings = 0;
  let batterySavings = 0;
  let totalDirect = 0;
  let totalBatteryUse = 0;
  let totalConsumption = 0;

  for (const row of hourlyData) {
    totalConsumption += row.consumption;
    totalDirect += row.directUse;
    totalBatteryUse += row.batteryUse;
    gridExportRevenue += row.gridExport * ELECTRICITY_PRICES.gridExport;
    gridImportCost += row.gridImport * ELECTRICITY_PRICES.gridImport;
    directSavings += row.directUse * ELECTRICITY_PRICES.directAvoided;
    batterySavings += row.batteryUse * ELECTRICITY_PRICES.directAvoided;
  }

  /**
   * Net tasarruf = öz-tüketim değeri + şebeke satış geliri.
   * gridImportCost ayrıca düşülmez — direct/battery savings zaten şebeke alışından
   * kaçınılan kWh'ı temsil eder; çift sayım ROI'yi yapay negatife çeker.
   */
  const dailyProfit = directSavings + batterySavings + gridExportRevenue;
  const monthlyProfit = dailyProfit * 30;
  const selfConsumptionRate =
    totalConsumption > 0
      ? ((totalDirect + totalBatteryUse) / totalConsumption) * 100
      : 0;

  return {
    dailyProfit,
    monthlyProfit,
    selfConsumptionRate,
    perApartmentMonthly: apartmentCount > 0 ? monthlyProfit / apartmentCount : 0,
    gridExportRevenue,
    gridImportCost,
    directSavings,
    batterySavings,
  };
}

/**
 * @param {number} dailyProduction
 * @param {number} selfConsumptionRate percent
 */
export function getCarbonMetrics(dailyProduction, selfConsumptionRate) {
  const rate = selfConsumptionRate / 100;
  /** kg CO₂ — formula: dailyProduction × öz-tüketim × 0,5 kg/kWh × 30 gün */
  const monthlyCO2Saved =
    dailyProduction * rate * CO2_FACTORS.perKwhKg * 30;
  return {
    monthlyCO2Saved,
    yearlyCO2Saved: monthlyCO2Saved * 12,
    equivalentTrees: monthlyCO2Saved / CO2_FACTORS.treeKgPerMonth,
    equivalentCars: (monthlyCO2Saved * 12) / CO2_FACTORS.carKgPerYear,
  };
}

/** Türkçe ay adları (dönem analizi ve raporlar) */
export const ayAdlari = {
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

const AY_ADLARI = ayAdlari;

/**
 * @param {number} panelCapacity
 * @param {number} batteryCapacity
 * @param {number} apartmentCount
 * @param {number} startMonth 1-12
 * @param {number} endMonth 1-12, >= startMonth
 */
export function getPeriodAnalysis(
  panelCapacity,
  batteryCapacity,
  apartmentCount,
  startMonth,
  endMonth
) {
  const monthlyResults = [];
  let cumulativeSavings = 0;
  let cumulativeCO2 = 0;
  let sumSelfConsumption = 0;

  for (let month = startMonth; month <= endMonth; month++) {
    const dailyProduction = getDailyProduction(panelCapacity, month);
    const hourlyData = getHourlyData(
      panelCapacity,
      apartmentCount,
      batteryCapacity,
      month
    );
    const financial = getFinancialMetrics(
      hourlyData,
      batteryCapacity,
      apartmentCount,
      panelCapacity
    );
    const carbon = getCarbonMetrics(
      dailyProduction,
      financial.selfConsumptionRate
    );

    cumulativeSavings += financial.monthlyProfit;
    cumulativeCO2 += carbon.monthlyCO2Saved;
    sumSelfConsumption += financial.selfConsumptionRate;

    monthlyResults.push({
      month,
      monthName: AY_ADLARI[month],
      dailyProduction,
      monthlyProduction: dailyProduction * 30,
      monthlyProfit: financial.monthlyProfit,
      selfConsumptionRate: financial.selfConsumptionRate,
      perApartmentMonthly: financial.perApartmentMonthly,
      gridExportRevenue: financial.gridExportRevenue,
      batterySavings: financial.batterySavings,
      directSavings: financial.directSavings,
      monthlyCO2Saved: carbon.monthlyCO2Saved,
      equivalentTrees: carbon.equivalentTrees,
      cumulativeSavings,
      cumulativeCO2,
      bestMonth: false,
      worstMonth: false,
    });
  }

  const n = monthlyResults.length;
  const periodMonths = endMonth - startMonth + 1;

  if (n === 0) {
    return {
      monthlyResults: [],
      totalSavings: 0,
      totalCO2: 0,
      totalTrees: 0,
      averageSelfConsumption: 0,
      bestMonth: null,
      worstMonth: null,
      periodMonths: 0,
    };
  }

  if (n === 1) {
    monthlyResults[0].bestMonth = true;
    monthlyResults[0].worstMonth = false;
    return {
      monthlyResults,
      totalSavings: cumulativeSavings,
      totalCO2: cumulativeCO2,
      totalTrees: cumulativeCO2 / CO2_FACTORS.treeKgPerMonth,
      averageSelfConsumption: sumSelfConsumption,
      bestMonth: monthlyResults[0],
      worstMonth: monthlyResults[0],
      periodMonths,
    };
  }

  let bestIdx = 0;
  let worstIdx = 0;
  for (let i = 1; i < n; i++) {
    if (monthlyResults[i].monthlyProfit > monthlyResults[bestIdx].monthlyProfit) {
      bestIdx = i;
    }
    if (monthlyResults[i].monthlyProfit < monthlyResults[worstIdx].monthlyProfit) {
      worstIdx = i;
    }
  }

  monthlyResults[bestIdx].bestMonth = true;
  if (bestIdx !== worstIdx) {
    monthlyResults[worstIdx].worstMonth = true;
  }

  return {
    monthlyResults,
    totalSavings: cumulativeSavings,
    totalCO2: cumulativeCO2,
    totalTrees: cumulativeCO2 / CO2_FACTORS.treeKgPerMonth,
    averageSelfConsumption: sumSelfConsumption / n,
    bestMonth: monthlyResults[bestIdx],
    worstMonth: monthlyResults[worstIdx],
    periodMonths,
  };
}

/**
 * 12 aylık mevsim ağırlıklı yıllık finansal özet.
 * ROI ve yıllık projeksiyonlar ay seçiminden bağımsız olmalıdır.
 */
export function getAnnualFinancialMetrics(
  panelCapacity,
  batteryCapacity,
  apartmentCount,
  investmentCosts = INVESTMENT_COSTS
) {
  const period = getPeriodAnalysis(
    panelCapacity,
    batteryCapacity,
    apartmentCount,
    1,
    12
  );
  const investment = computeInvestment(panelCapacity, batteryCapacity, investmentCosts);
  const annualSavings = period.totalSavings;
  const roiYears = computeRoiYears(investment, annualSavings);

  return {
    annualSavings,
    roiYears,
    averageSelfConsumption: period.averageSelfConsumption,
    investment,
  };
}
