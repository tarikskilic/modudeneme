import { Children, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Clock,
  Leaf,
  TrendingDown,
  TrendingUp,
  Wind,
  XCircle,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import HardwareStatusBanner from '../components/HardwareStatusBanner.jsx';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { LEGACY_BASELINE, isRoiDisplayable, scaleLegacyBaseline } from '../constants/simulationDefaults.js';
import { useSimulation } from '../context/SimulationContext.jsx';
import {
  getAnnualFinancialMetrics,
  getFinancialMetrics,
} from '../utils/energyCalculations.js';

function formatTl(n) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(n));
}

function formatTlCompact(n) {
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(2).replace('.', ',')}M`;
  return `₺${formatTl(n)}`;
}

const rowVariant = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const INVESTMENT_BULLETS = ['roi', 'ten', 'scr', 'law', 'v2g', 'lora'];

export default function Comparison() {
  const { panelCapacity, batteryCapacity, apartmentCount, hourlyData, investmentCosts } =
    useSimulation();

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

  const gridExportDaily = useMemo(
    () => hourlyData.reduce((s, r) => s + r.gridExport, 0),
    [hourlyData]
  );

  const legacyScaled = useMemo(() => scaleLegacyBaseline(apartmentCount), [apartmentCount]);

  const {
    monthlyProfit,
    selfConsumptionRate,
  } = metrics;

  const { annualSavings: yearlyProfit, roiYears } = annual;

  const roiOk = isRoiDisplayable(roiYears);
  const roiDisplay = roiOk ? roiYears.toFixed(1) : '—';
  const legacyEff = LEGACY_BASELINE.profitEfficiencyVsModu;

  const moduCo2Emission = useMemo(() => {
    const ratio =
      legacyScaled.dailyGridLossKwh > 0
        ? Math.min(1, gridExportDaily / legacyScaled.dailyGridLossKwh)
        : 0.26;
    return Math.max(0, legacyScaled.monthlyCo2EmissionKg * ratio);
  }, [legacyScaled, gridExportDaily]);

  const cumulative = useMemo(() => {
    const yp = Math.max(0, yearlyProfit);
    return Array.from({ length: 10 }, (_, i) => {
      const yıl = i + 1;
      return {
        yıl,
        modu: yp * yıl,
        geleneksel: yp * legacyEff * yıl,
      };
    });
  }, [yearlyProfit, legacyEff]);

  const yıl10Modu = yearlyProfit * 10;
  const yıl10Geleneksel = yearlyProfit * legacyEff * 10;
  const fark10 = yıl10Modu - yıl10Geleneksel;
  const showAmortInChart = roiOk && roiYears >= 1 && roiYears <= 10;

  const bulletTexts = useMemo(
    () => ({
      roi: roiOk
        ? `Yatırım ${roiDisplay} yılda kendini amorti eder`
        : 'Yatırım amortismanı için pozitif yıllık kâr gerekir',
      ten: `10 yılda ${formatTlCompact(fark10)} ek getiri`,
      scr: `%${selfConsumptionRate.toFixed(0)} öz-tüketim oranı`,
      law: '2 Nisan mevzuatına tam uyum',
      v2g: 'V2G entegrasyonuna hazır altyapı',
      lora: 'LoRaWAN ile internet bağımsız haberleşme',
    }),
    [roiOk, roiDisplay, fark10, selfConsumptionRate]
  );

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <HardwareStatusBanner />
      <Sidebar />

      <main className="shell-admin lg:pl-[240px]">
        <div className="page-inner space-y-8 md:space-y-10">
          {/* TOP ROW — Screen header */}
          <motion.header
            initial={{ opacity: 0, y: -28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <h1 className="text-[28px] font-bold tracking-tight text-foreground md:text-[40px] lg:text-[44px]">
              Geleneksel Sistem vs MODÜ-GRID
            </h1>
            <p className="mt-3 text-base text-muted-light md:text-lg">
              Aynı site, aynı paneller — fark sadece zekada
            </p>
          </motion.header>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-10 grid grid-cols-1 md:grid-cols-[1fr_1px_1fr]"
          >
            <div className="flex items-center justify-center gap-3 rounded-t-xl border border-b-0 border-border bg-gradient-to-r from-red-950/30 to-transparent px-6 py-4 md:justify-end md:rounded-tr-none md:rounded-tl-2xl">
              <AlertTriangle
                className="h-7 w-7 shrink-0 text-warning"
                strokeWidth={2}
                aria-hidden
              />
              <span className="text-lg font-bold text-red-300 md:text-xl">
                Geleneksel Sistem
              </span>
            </div>

            <div
              className="hidden bg-gradient-to-b from-warning/40 via-border to-success/40 md:block"
              aria-hidden
            />

            <div className="flex items-center justify-center gap-3 rounded-t-xl border border-b-0 border-border bg-gradient-to-l from-emerald-950/35 to-transparent px-6 py-4 md:justify-start md:rounded-tl-none md:rounded-tr-2xl">
              <CheckCircle
                className="h-7 w-7 shrink-0 text-success"
                strokeWidth={2}
                aria-hidden
              />
              <span className="text-lg font-bold text-success md:text-xl">MODÜ-GRID</span>
            </div>
          </motion.div>

          {/* MIDDLE ROW — Comparison table */}
          <section
            className="overflow-hidden rounded-b-2xl border border-border bg-card shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            aria-label="Sistem karşılaştırması"
          >
            <ComparisonRow rowIndex={0} zebra>
              <TradCol>
                <div className="h-3 w-full max-w-[140px] overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-red-500/90"
                    style={{ width: `${LEGACY_BASELINE.selfConsumptionPercent}%` }}
                  />
                </div>
                <span className="mt-3 text-3xl font-bold tabular-nums text-red-400 md:text-4xl">
                  %{LEGACY_BASELINE.selfConsumptionPercent}
                </span>
              </TradCol>
              <CenterLabel>Öz-Tüketim Oranı</CenterLabel>
              <ModuCol glow>
                <div className="h-3 w-full max-w-[220px] overflow-hidden rounded-full bg-border">
                  <motion.div
                    className="h-full rounded-full bg-success shadow-[0_0_20px_rgba(16,185,129,0.65)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, selfConsumptionRate)}%` }}
                    transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <span className="mt-3 text-3xl font-bold tabular-nums text-success md:text-4xl">
                  %{selfConsumptionRate.toFixed(0)}
                </span>
              </ModuCol>
            </ComparisonRow>

            <ComparisonRow rowIndex={1}>
              <TradCol>
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-7 w-7 text-red-400" strokeWidth={2.5} />
                  <span className="text-2xl font-bold tabular-nums text-red-400 md:text-3xl">
                    -₺ {formatTl(legacyScaled.monthlyLossTl)}
                  </span>
                </div>
              </TradCol>
              <CenterLabel>Aylık Net Finansal Etki</CenterLabel>
              <ModuCol glow>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-7 w-7 text-success" strokeWidth={2.5} />
                  <span className="text-2xl font-bold tabular-nums text-success md:text-3xl">
                    +₺ {formatTl(monthlyProfit)}
                  </span>
                </div>
              </ModuCol>
            </ComparisonRow>

            <ComparisonRow rowIndex={2} zebra>
              <TradCol>
                <span className="text-4xl font-bold tabular-nums text-red-400 md:text-5xl">
                  {formatTl(legacyScaled.dailyGridLossKwh)}{' '}
                  <span className="text-2xl font-semibold text-red-400/80 md:text-3xl">kWh</span>
                </span>
              </TradCol>
              <CenterLabel>Günlük Şebeke Kaybı</CenterLabel>
              <ModuCol glow>
                <span className="text-2xl font-bold tabular-nums text-success md:text-3xl">
                  {formatTl(gridExportDaily)}{' '}
                  <span className="text-xl font-semibold text-success/85">kWh</span>
                </span>
              </ModuCol>
            </ComparisonRow>

            <ComparisonRow rowIndex={3}>
              <TradCol>
                <div className="flex items-center gap-3">
                  <Clock className="h-7 w-7 text-red-400/90" strokeWidth={2} />
                  <span className="text-2xl font-bold text-red-400 md:text-3xl">
                    {LEGACY_BASELINE.roiLabel}
                  </span>
                </div>
              </TradCol>
              <CenterLabel>Yatırım Geri Dönüş Süresi</CenterLabel>
              <ModuCol glow>
                <div className="flex items-center gap-3">
                  <Clock className="h-7 w-7 text-success" strokeWidth={2} />
                  <span className="text-2xl font-bold tabular-nums text-success md:text-3xl">
                    {roiDisplay} Yıl
                  </span>
                  {roiOk && (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20 ring-2 ring-success/50">
                      <Check className="h-5 w-5 text-success" strokeWidth={3} />
                    </span>
                  )}
                </div>
              </ModuCol>
            </ComparisonRow>

            <ComparisonRow rowIndex={4} zebra>
              <TradCol>
                <div className="flex items-center gap-3">
                  <Wind className="h-7 w-7 text-red-400/90" strokeWidth={2} />
                  <span className="text-2xl font-bold tabular-nums text-red-400 md:text-3xl">
                    {formatTl(legacyScaled.monthlyCo2EmissionKg)}{' '}
                    <span className="text-lg font-semibold text-red-400/75">kg/ay</span>
                  </span>
                </div>
              </TradCol>
              <CenterLabel>Aylık Karbon Emisyonu</CenterLabel>
              <ModuCol glow>
                <div className="flex items-center gap-3">
                  <Leaf className="h-7 w-7 text-success" strokeWidth={2} />
                  <span className="text-2xl font-bold tabular-nums text-success md:text-3xl">
                    {formatTl(moduCo2Emission)}{' '}
                    <span className="text-lg font-semibold text-success/85">kg/ay</span>
                  </span>
                </div>
              </ModuCol>
            </ComparisonRow>

            <ComparisonRow rowIndex={5}>
              <TradCol>
                <div className="flex items-center gap-2.5">
                  <XCircle className="h-7 w-7 text-red-400" strokeWidth={2} />
                  <span className="text-xl font-bold text-red-400">Uyumsuz</span>
                </div>
              </TradCol>
              <CenterLabel>2 Nisan Yönetmeliği</CenterLabel>
              <ModuCol glow>
                <div className="flex items-center gap-2.5 drop-shadow-[0_0_16px_rgba(16,185,129,0.45)]">
                  <CheckCircle className="h-7 w-7 text-success" strokeWidth={2} />
                  <span className="text-xl font-bold text-success">Tam Uyumlu</span>
                </div>
              </ModuCol>
            </ComparisonRow>

            <ComparisonRow rowIndex={6} zebra>
              <TradCol>
                <div className="flex items-center gap-2.5">
                  <XCircle className="h-7 w-7 text-red-400" strokeWidth={2} />
                  <span className="text-xl font-bold text-red-400">Hazır Değil</span>
                </div>
              </TradCol>
              <CenterLabel>Elektrikli Araç Şarj (V2G)</CenterLabel>
              <ModuCol glow>
                <div className="flex items-center gap-2.5 drop-shadow-[0_0_14px_rgba(16,185,129,0.35)]">
                  <CheckCircle className="h-7 w-7 text-success" strokeWidth={2} />
                  <span className="text-xl font-bold text-success">Entegre Hazır</span>
                </div>
              </ModuCol>
            </ComparisonRow>
          </section>

          {/* BOTTOM ROW */}
          <div className="mt-10 grid grid-cols-1 gap-8 xl:grid-cols-2">
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.25 }}
              className="rounded-2xl border border-border bg-card p-5 md:p-6"
            >
              <h2 className="text-lg font-semibold text-foreground md:text-xl">
                10 Yıllık Kümülatif Tasarruf Karşılaştırması
              </h2>
              <p className="mt-1 text-xs text-muted">
                Kümülatif TL — MODÜ-GRID vs geleneksel senaryo
              </p>

              <div className="chart-panel">
                <div className="chart-h-md w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulative} margin={{ top: 28, right: 16, left: 4, bottom: 8 }}>
                    <defs>
                      <linearGradient id="cmpModuArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.42} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0.04} />
                      </linearGradient>
                      <linearGradient id="cmpGelArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6B7280" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6B7280" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1F2937" strokeDasharray="4 8" vertical={false} />
                    <XAxis
                      dataKey="yıl"
                      type="number"
                      domain={[1, 10]}
                      tickFormatter={(v) => `Yıl ${v}`}
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: '#1F2937' }}
                      allowDecimals={false}
                    />
                    <YAxis
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: '#1F2937' }}
                      tickFormatter={(v) =>
                        v >= 1_000_000
                          ? `${(v / 1_000_000).toFixed(1)}M`
                          : `${(v / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}k`
                      }
                      label={{
                        value: 'Kümülatif TL',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#9CA3AF',
                        fontSize: 11,
                        dx: 8,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#111827',
                        border: '1px solid #1F2937',
                        borderRadius: 12,
                        fontSize: 12,
                        color: '#F9FAFB',
                      }}
                      formatter={(val, name) => [
                        `₺ ${Number(val).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`,
                        name === 'modu' ? 'MODÜ-GRID' : 'Geleneksel',
                      ]}
                      labelFormatter={(y) => `Yıl ${y}`}
                    />
                    {showAmortInChart && (
                      <ReferenceLine
                        x={roiYears}
                        stroke="#F59E0B"
                        strokeWidth={2}
                        strokeDasharray="8 6"
                        label={{
                          value: `Amortisman — Yıl ${roiDisplay}`,
                          fill: '#FBBF24',
                          position: 'top',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="modu"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      fill="url(#cmpModuArea)"
                      name="modu"
                      animationDuration={700}
                    />
                    <Area
                      type="monotone"
                      dataKey="geleneksel"
                      stroke="#9CA3AF"
                      strokeWidth={2}
                      fill="url(#cmpGelArea)"
                      name="geleneksel"
                      animationDuration={700}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    Yıl 10 — MODÜ-GRID
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-success md:text-2xl">
                    ₺ {formatTl(yıl10Modu)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    Yıl 10 — Geleneksel
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-muted-light md:text-2xl">
                    ₺ {formatTl(yıl10Geleneksel)}
                  </p>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.45 }}
                className="mt-4 rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-center"
              >
                <p className="text-base font-bold text-foreground md:text-lg">
                  10 Yılda{' '}
                  <span className="text-success">₺{formatTl(fark10)}</span> Fark
                </p>
              </motion.div>

              {roiOk && roiYears > 10 ? (
                <p className="mt-3 text-center text-xs text-warning">
                  Amortisman tahmini:{' '}
                  <span className="font-semibold tabular-nums">{roiDisplay} yıl</span>
                  {' '}
                  (10 yıllık grafik penceresinin dışında).
                </p>
              ) : null}
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.32 }}
              className="flex flex-col rounded-2xl border border-border bg-gradient-to-br from-card via-card to-surface-alt p-6 md:p-7"
            >
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-semibold text-foreground md:text-2xl">
                  Yatırım Özeti
                </h2>
                <p className="mt-1 text-xs text-muted">Karar özeti — yatırım notu</p>
              </div>

              <p className="mt-6 text-sm font-bold uppercase tracking-wide text-muted-light">
                MODÜ-GRID ile:
              </p>

              <motion.ul
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
                }}
                initial="hidden"
                animate="show"
                className="mt-5 flex-1 space-y-4"
              >
                {INVESTMENT_BULLETS.map((key) => (
                  <motion.li
                    key={key}
                    variants={{
                      hidden: { opacity: 0, x: 12 },
                      show: { opacity: 1, x: 0 },
                    }}
                    className="flex gap-3 text-[15px] leading-snug text-gray-200 md:text-base"
                  >
                    <CheckCircle
                      className="mt-0.5 h-5 w-5 shrink-0 text-success"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <span>{bulletTexts[key]}</span>
                  </motion.li>
                ))}
              </motion.ul>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  boxShadow: [
                    '0 0 0 rgba(16,185,129,0)',
                    '0 0 36px rgba(16,185,129,0.28)',
                    '0 0 0 rgba(16,185,129,0)',
                  ],
                }}
                transition={{
                  opacity: { delay: 0.55, duration: 0.5 },
                  y: { delay: 0.55, duration: 0.5 },
                  boxShadow: { repeat: Infinity, duration: 3.2, ease: 'easeInOut' },
                }}
                className="mt-8 rounded-2xl border-2 border-success/50 bg-gradient-to-br from-success/15 via-success/5 to-transparent px-6 py-7 text-center"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-success/90">
                  MODÜ-GRID
                </p>
                <p className="mt-3 text-lg font-bold leading-snug text-foreground md:text-xl">
                  Enerjiyi Sadece Ölçmüyoruz, Yönetiyoruz
                </p>
              </motion.div>
            </motion.section>
          </div>
        </div>
      </main>
    </div>
  );
}

function TradCol({ children }) {
  return (
    <div className="flex min-h-[88px] flex-col justify-center border-l-[3px] border-red-500/80 px-5 py-6 shadow-[inset_10px_0_32px_rgba(239,68,68,0.07)] md:px-8 md:py-7">
      {children}
    </div>
  );
}

function ModuCol({ children, glow = false }) {
  return (
    <div
      className={[
        'flex min-h-[88px] flex-col justify-center border-l-[3px] border-success px-5 py-6 md:px-8 md:py-7',
        glow
          ? 'shadow-[inset_10px_0_36px_rgba(16,185,129,0.12)]'
          : 'shadow-[inset_10px_0_28px_rgba(16,185,129,0.08)]',
      ].join(' ')}
    >
      {children}
    </div>
  );
}

function CenterLabel({ children }) {
  return (
    <div className="relative flex min-h-[88px] items-center justify-center border-x border-border bg-background/60 px-4 py-6 text-center md:px-5">
      <div
        className="pointer-events-none absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-border-strong to-transparent md:hidden"
        aria-hidden
      />
      <span className="text-[11px] font-semibold uppercase leading-tight tracking-wider text-muted-light md:text-xs">
        {children}
      </span>
    </div>
  );
}

function ComparisonRow({ children, zebra, rowIndex = 0 }) {
  const arr = Children.toArray(children);
  const [left, center, right] = arr;
  return (
    <motion.div
      custom={rowIndex}
      variants={rowVariant}
      initial="hidden"
      animate="show"
      className={[
        'relative grid grid-cols-1 md:grid-cols-[1fr_minmax(148px,200px)_1fr]',
        zebra ? 'bg-surface-alt' : 'bg-card',
      ].join(' ')}
    >
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-10 hidden w-px -translate-x-1/2 bg-gradient-to-b from-border via-border-strong to-border md:block"
        aria-hidden
      />
      {left}
      {center}
      {right}
    </motion.div>
  );
}
