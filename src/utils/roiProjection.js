import { LEGACY_BASELINE } from '../constants/simulationDefaults.js';

/**
 * 10 yıllık kümülatif tasarruf serisi ve amortisman yılı.
 * @param {number} yearlyProfit MODÜ-GRID yıllık net kâr (₺)
 * @param {number} investment Toplam yatırım (₺)
 */
export function buildTenYearRoiProjection(yearlyProfit, investment) {
  const yp = Math.max(0, yearlyProfit);
  const inv = Math.max(0, investment);
  const legacyRate = LEGACY_BASELINE.profitEfficiencyVsModu;

  const rows = Array.from({ length: 10 }, (_, i) => {
    const year = i + 1;
    const modu = yp * year;
    const traditional = yp * legacyRate * year;
    return {
      year,
      label: `Yıl ${year}`,
      modu,
      traditional,
      gap: Math.max(0, modu - traditional),
    };
  });

  const curvePeak = rows.length
    ? Math.max(...rows.map((r) => Math.max(r.modu, r.traditional)))
    : 0;

  const crossoverYear = yp > 0 && inv > 0 ? inv / yp : null;
  const showCrossoverMarker =
    typeof crossoverYear === 'number' &&
    Number.isFinite(crossoverYear) &&
    crossoverYear >= 1 &&
    crossoverYear <= 10 &&
    yp > 0 &&
    inv > 0;

  /** Yatırım çizgisi yalnızca kümülatif eğriye yakınsa aynı ölçekte gösterilir */
  const investmentFitsScale = inv > 0 && inv <= curvePeak * 1.35;
  const maxY = Math.max(
    curvePeak * 1.18,
    investmentFitsScale ? inv * 1.06 : 0,
    1000
  );

  return {
    rows,
    curvePeak,
    crossoverYear,
    showCrossoverMarker,
    investmentFitsScale,
    maxY,
  };
}
