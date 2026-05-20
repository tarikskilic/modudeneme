import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Sun, Target, TrendingUp } from 'lucide-react';
import DailyEnergyChart from '../components/Charts/DailyEnergyChart.jsx';
import DonutChart from '../components/Charts/DonutChart.jsx';
import HardwareStatusBanner from '../components/HardwareStatusBanner.jsx';
import KPICard from '../components/KPICard.jsx';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import SliderPanel from '../components/SliderPanel.jsx';
import { ELECTRICITY_PRICES, SCENARIO_PRESETS, isRoiDisplayable } from '../constants/simulationDefaults.js';
import { useSimulation } from '../context/SimulationContext.jsx';
import { METRIC_COPY } from '../constants/metricDefinitions.js';
import {
  ayAdlari,
  getAnnualFinancialMetrics,
  getDailyProduction,
  getFinancialMetrics,
} from '../utils/energyCalculations.js';

function formatTl0(n) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n);
}

export default function AdminDashboard() {
  const {
    panelCapacity,
    batteryCapacity,
    apartmentCount,
    selectedMonth,
    hourlyData,
    investmentCosts,
    costScenario,
  } = useSimulation();

  const metrics = useMemo(
    () => getFinancialMetrics(hourlyData, batteryCapacity, apartmentCount, panelCapacity),
    [hourlyData, batteryCapacity, apartmentCount, panelCapacity]
  );

  const annual = useMemo(
    () =>
      getAnnualFinancialMetrics(
        panelCapacity,
        batteryCapacity,
        apartmentCount,
        investmentCosts
      ),
    [panelCapacity, batteryCapacity, apartmentCount, investmentCosts]
  );

  const dailyProdKwh = useMemo(
    () => getDailyProduction(panelCapacity, selectedMonth),
    [panelCapacity, selectedMonth]
  );

  const productionTrend = useMemo(() => {
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const curr = getDailyProduction(panelCapacity, selectedMonth);
    const prev = getDailyProduction(panelCapacity, prevMonth);
    if (prev <= 0) return '+0% geçen aya göre';
    const pct = ((curr - prev) / prev) * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(0)}% geçen aya göre`;
  }, [panelCapacity, selectedMonth]);

  const dayTotals = useMemo(() => {
    let direct = 0;
    let battery = 0;
    let exp = 0;
    for (const r of hourlyData) {
      direct += r.directUse;
      battery += r.batteryUse;
      exp += r.gridExport;
    }
    return { direct, battery, exp };
  }, [hourlyData]);

  const perAptSubtitle = `Daire başı: ₺${formatTl0(metrics.perApartmentMonthly)}`;

  const scenarioLabel =
    SCENARIO_PRESETS[costScenario]?.label ?? 'Pilot';

  const roiFinite = isRoiDisplayable(annual.roiYears);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HardwareStatusBanner />
      <Sidebar />
      <main className="shell-admin lg:pl-[240px]">
        <div className="page-inner space-y-6 sm:space-y-8">
          <div>
            <h1 className="page-title">Kontrol Paneli</h1>
            <p className="mt-1 text-sm text-muted">
              Site geneli enerji yönetimi — Simülasyon Modu
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KPICard
              staggerIndex={0}
              title="Günlük Üretim"
              value={dailyProdKwh.toFixed(0)}
              numericValue={dailyProdKwh}
              decimals={0}
              unit="kWh"
              subtitle={METRIC_COPY.dailyProduction.subtitle}
              icon={Sun}
              color="success"
              trend={productionTrend}
            />
            <KPICard
              staggerIndex={1}
              title={METRIC_COPY.consumptionCoverage.title}
              value={metrics.consumptionCoverageRate.toFixed(0)}
              numericValue={metrics.consumptionCoverageRate}
              decimals={0}
              unit={METRIC_COPY.consumptionCoverage.unit}
              subtitle={METRIC_COPY.consumptionCoverage.subtitle}
              icon={Target}
              color="primary"
              gaugePercent={metrics.consumptionCoverageRate}
            />
            <KPICard
              staggerIndex={2}
              title={METRIC_COPY.monthlyNetSavings.title}
              value={formatTl0(metrics.monthlyNetSavings)}
              numericValue={metrics.monthlyNetSavings}
              decimals={0}
              unit={METRIC_COPY.monthlyNetSavings.unit}
              subtitle={`${perAptSubtitle} · ${METRIC_COPY.monthlyNetSavings.subtitle}`}
              icon={TrendingUp}
              color="success"
            />
            <KPICard
              staggerIndex={3}
              title="ROI Süresi"
              value={roiFinite ? annual.roiYears.toFixed(1) : '—'}
              numericValue={roiFinite ? annual.roiYears : undefined}
              decimals={1}
              unit="Yıl"
              subtitle={`${scenarioLabel} CAPEX · 12 ay`}
              icon={Clock}
              color="warning"
            />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SliderPanel />

            <motion.section
              layout
              className="rounded-[12px] border border-border bg-card p-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">Enerji Özeti</h2>
                <span className="text-[11px] uppercase tracking-[0.16em] text-muted">
                  {ayAdlari[selectedMonth]} • Günlük
                </span>
              </div>

              <div className="mt-4">
                <DonutChart
                  segments={[
                    { label: 'Panel → Direkt Tüketim', value: dayTotals.direct, color: '#10B981' },
                    { label: 'Batarya → Tüketim', value: dayTotals.battery, color: '#3B82F6' },
                    { label: 'Şebeke Satışı', value: dayTotals.exp, color: '#F59E0B' },
                  ]}
                  centerPct={metrics.selfUseOfProductionRate}
                  centerLabel={METRIC_COPY.selfUseOfProduction.donutLabel}
                />
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                Tüketim karşılama{' '}
                <span className="font-semibold tabular-nums text-foreground">
                  %{metrics.consumptionCoverageRate.toFixed(0)}
                </span>
                {' · '}
                Yerinde kullanım{' '}
                <span className="font-semibold tabular-nums text-foreground">
                  %{metrics.selfUseOfProductionRate.toFixed(0)}
                </span>
                {' '}
                (üretim dağılımı ortada)
              </p>

              <p className="mt-4 border-t border-border pt-3 text-[11px] tabular-nums text-muted">
                Tarife:{' '}
                <span className="text-foreground/80">
                  {ELECTRICITY_PRICES.directAvoided.toFixed(2)} ₺ panel
                </span>
                <span className="mx-1.5 text-muted">•</span>
                <span className="text-foreground/80">
                  {ELECTRICITY_PRICES.batteryAvoided.toFixed(2)} ₺ batarya
                </span>
                <span className="mx-1.5 text-muted">•</span>
                <span className="text-foreground/80">
                  {ELECTRICITY_PRICES.gridExport.toFixed(2)} ₺ satış
                </span>
              </p>
            </motion.section>
          </div>

          <div className="mt-8">
            <DailyEnergyChart hourlyData={hourlyData} />
          </div>
        </div>
      </main>
    </div>
  );
}

