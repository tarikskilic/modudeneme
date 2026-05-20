import { useMemo, useState } from 'react';
import {
  getCarbonMetrics,
  getDailyProduction,
  getFinancialMetrics,
  getPeriodAnalysis,
} from '../utils/energyCalculations.js';
import { CO2_FACTORS, LEGACY_BASELINE, scaleLegacyBaseline } from '../constants/simulationDefaults.js';
import { motion } from 'framer-motion';
import {
  Car,
  CheckCircle,
  Circle,
  Info,
  Leaf,
  TreePine,
  Wind,
  Zap,
} from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as PieTooltip,
} from 'recharts';
import CarbonChart from '../components/CarbonChart.jsx';
import HardwareStatusBanner from '../components/HardwareStatusBanner.jsx';
import HeroImpactCard from '../components/HeroImpactCard.jsx';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useSimulation } from '../context/SimulationContext.jsx';

const MILESTONE_TIERS = [
  { at: 250, label: 'Başlangıç', pct: 25 },
  { at: 500, label: 'Gelişmekte', pct: 50 },
  { at: 750, label: 'İyi', pct: 75 },
  { at: 1000, label: 'Mükemmel', pct: 100 },
];

const trFmt0 = (n) =>
  new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(n));
const trFmt1 = (n) =>
  new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(n);

const COMPLIANCE_BADGES = [
  { label: '2 Nisan Yönetmeliği · Hedef', tone: 'success' },
  { label: 'Saatlik Mahsuplaşma · Hedef', tone: 'success' },
  { label: 'V2G Entegrasyonu · Planlanan', tone: 'future' },
];

function CarWithLeafIcon() {
  return (
    <>
      <Car className="h-14 w-14 text-success" strokeWidth={1.25} aria-hidden />
      <Leaf
        className="absolute -bottom-0.5 -right-1 h-6 w-6 text-success"
        strokeWidth={2}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 h-[2px] w-[90%] -translate-x-1/2 -translate-y-1/2 rotate-[-14deg] rounded-full bg-success/45"
        aria-hidden
      />
    </>
  );
}

function EnergyMixTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <span className="font-semibold text-foreground">
        {p.name}: %{p.value}
      </span>
    </div>
  );
}

export default function CarbonPanel() {
  const { panelCapacity, batteryCapacity, apartmentCount, selectedMonth, hourlyData } =
    useSimulation();

  const metrics = useMemo(
    () => getFinancialMetrics(hourlyData, batteryCapacity, apartmentCount, panelCapacity),
    [hourlyData, batteryCapacity, apartmentCount, panelCapacity]
  );

  const chartScr = metrics.selfConsumptionRate;

  const dailyProduction = useMemo(
    () => getDailyProduction(panelCapacity, selectedMonth),
    [panelCapacity, selectedMonth]
  );

  const carbon = useMemo(
    () => getCarbonMetrics(dailyProduction, chartScr),
    [dailyProduction, chartScr]
  );

  // Enerji mix — saatlik veriden (Σ directUse / Σ consumption gibi)
  const energyMix = useMemo(() => {
    let cons = 0;
    let direct = 0;
    let battery = 0;
    let grid = 0;
    for (const r of hourlyData) {
      cons += r.consumption;
      direct += r.directUse;
      battery += r.batteryUse;
      grid += r.gridImport;
    }
    const safe = cons > 0 ? cons : 1;
    const sun = (direct / safe) * 100;
    const bat = (battery / safe) * 100;
    const gridPct = Math.max(0, (grid / safe) * 100);
    return [
      { key: 'sun', name: 'Güneş Paneli', value: +sun.toFixed(1), fill: '#10B981' },
      { key: 'bat', name: 'Batarya', value: +bat.toFixed(1), fill: '#3B82F6' },
      { key: 'grid', name: 'Şebeke', value: +gridPct.toFixed(1), fill: '#4B5563' },
    ];
  }, [hourlyData]);

  // Yıllık CO₂ — 12 ay toplamı (ay × 12 extrapolasyonu yerine gerçek toplam)
  const yearly = useMemo(() => {
    const period = getPeriodAnalysis(panelCapacity, batteryCapacity, apartmentCount, 1, 12);
    return {
      co2Kg: period.totalCO2,
      trees: period.totalTrees,
      cars: period.totalCO2 / CO2_FACTORS.carKgPerYear,
    };
  }, [panelCapacity, batteryCapacity, apartmentCount]);

  const greenEnergyPct = Math.round(chartScr);

  // Karbon yoğunluğu karşılaştırması — geleneksel scaled, MODÜ-GRID = geleneksel × (1 - selfCons/100)
  const carbonComparison = useMemo(() => {
    const legacyScaled = scaleLegacyBaseline(apartmentCount);
    const legacy = legacyScaled.monthlyCo2EmissionKg;
    const reductionFactor = Math.min(1, Math.max(0, chartScr / 100));
    const modu = legacy * (1 - reductionFactor);
    const reductionPct = legacy > 0 ? ((legacy - modu) / legacy) * 100 : 0;
    return { legacy, modu, reductionPct };
  }, [apartmentCount, chartScr]);

  // Sürdürülebilirlik skoru — spec §17 formülü
  const sustainability = useMemo(() => {
    const panelBonus = panelCapacity >= 150 && panelCapacity <= 350 ? 100 : 50;
    const score = Math.min(
      1000,
      chartScr * 5 + (batteryCapacity / 500) * 200 + panelBonus + 100 + 60
    );
    const subScores = [
      { label: 'Öz-Tüketim Oranı', value: Math.round(chartScr * 0.85), status: 'success' },
      {
        label: 'Batarya Kullanımı',
        value: Math.round((batteryCapacity / 500) * 100 * 0.78),
        status: 'success',
      },
      {
        label: 'Şebeke Bağımsızlığı',
        value: Math.round(chartScr * 0.72),
        status: 'success',
      },
      { label: 'Mevzuat Uyumu', value: 100, status: 'glow' },
      { label: 'V2G Hazırlığı', value: 60, status: 'future' },
    ];
    return { score: Math.round(score), subScores };
  }, [chartScr, batteryCapacity, panelCapacity]);

  const scorePct = (sustainability.score / 1000) * 100;

  // Mevcut milestone — score'a en yakın olanı işaretle
  const milestones = useMemo(() => {
    let currentIdx = 0;
    for (let i = 0; i < MILESTONE_TIERS.length; i++) {
      if (sustainability.score >= MILESTONE_TIERS[i].at - 125) currentIdx = i;
    }
    return MILESTONE_TIERS.map((m, i) => ({ ...m, current: i === currentIdx }));
  }, [sustainability.score]);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <HardwareStatusBanner />
      <Sidebar />

      <main className="shell-admin">
        <div className="page-inner space-y-6 sm:space-y-8">
          <header className="mb-8">
            <div className="flex items-center gap-2.5">
              <Leaf className="h-7 w-7 text-success" strokeWidth={2} aria-hidden />
              <h1 className="page-title">
                Karbon & Sürdürülebilirlik
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted">
              Çevresel etki ve yeşil enerji analizi — Simülasyon Modu
            </p>
          </header>

          {/* TOP ROW — Hero impact */}
          <section
            className="grid grid-cols-1 gap-5 xl:grid-cols-3"
            aria-label="Çevresel etki özeti"
          >
            <HeroImpactCard
              staggerIndex={0}
              label="Engellenen CO₂"
              numericValue={Math.round(carbon.monthlyCO2Saved)}
              formattedValue={trFmt0(carbon.monthlyCO2Saved)}
              suffix=" kg"
              subtext="Bu ay atmosfere salınmadı"
              secondary={
                <>
                  Yıllık toplam:{' '}
                  <span className="font-semibold text-foreground">
                    {trFmt0(yearly.co2Kg)} kg CO₂
                  </span>
                </>
              }
              icon={Wind}
            />
            <HeroImpactCard
              staggerIndex={1}
              label="Eşdeğer Kurtarılan Ağaç"
              numericValue={Math.round(yearly.trees)}
              formattedValue={trFmt0(yearly.trees)}
              subtext="Bir yılda kurtarılan ağaç sayısına eşdeğer"
              secondary={
                <>
                  1 ağaç = <span className="font-semibold text-foreground">21 kg CO₂/yıl</span>
                </>
              }
              icon={TreePine}
            />
            <HeroImpactCard
              staggerIndex={2}
              label="Trafikten Çekilen Araç"
              numericValue={Math.round(yearly.cars * 10) / 10}
              formattedValue={trFmt1(yearly.cars)}
              decimals={1}
              subtext="Bir yılda trafikten çekilen araç sayısına eşdeğer"
              secondary={
                <>
                  1 araç = <span className="font-semibold text-foreground">2,4 ton CO₂/yıl</span>
                </>
              }
              iconOverlay={<CarWithLeafIcon />}
            />
          </section>

          {/* MIDDLE ROW */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="rounded-xl border border-border bg-card p-5"
            >
              <CarbonChart
                panelCapacity={panelCapacity}
                selfConsumptionRate={chartScr}
                selectedMonth={selectedMonth}
              />
            </motion.section>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.28 }}
              className="flex flex-col gap-6"
            >
              <section className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-base font-semibold text-foreground">
                  Enerji Kaynağı Dağılımı
                </h2>
                <p className="mt-1 text-xs text-muted">Öz-tüketim ve depolama bileşenleri</p>

                <div className="relative mx-auto mt-2 h-[260px] max-w-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={energyMix}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="68%"
                        outerRadius="90%"
                        paddingAngle={3}
                        stroke="none"
                        isAnimationActive
                        animationDuration={900}
                      >
                        {energyMix.map((e) => (
                          <Cell key={e.key} fill={e.fill} />
                        ))}
                      </Pie>
                      <PieTooltip content={<EnergyMixTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl font-bold tabular-nums text-success">
                      %{greenEnergyPct}
                    </span>
                    <span className="mt-0.5 text-xs font-medium text-muted">Yeşil Enerji</span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-light">
                  {energyMix.map((item) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span>
                        {item.name}:{' '}
                        <span className="font-semibold text-foreground">%{item.value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">
                    Karbon Yoğunluğu Karşılaştırması
                  </h2>
                  <ProxyInfoTooltip />
                </div>
                <p className="mt-1 text-xs text-muted">Geleneksel site vs MODÜ-GRID</p>

                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
                  <ComparisonColumn
                    label="Geleneksel Sistem"
                    value={`${trFmt0(carbonComparison.legacy)} kg CO₂/ay`}
                    widthPct={100}
                    barClass="bg-gray-600"
                    labelClass="text-muted-light"
                  />
                  <ComparisonColumn
                    label="MODÜ-GRID"
                    value={`${trFmt0(carbonComparison.modu)} kg CO₂/ay`}
                    widthPct={
                      carbonComparison.legacy > 0
                        ? Math.max(2, (carbonComparison.modu / carbonComparison.legacy) * 100)
                        : 0
                    }
                    barClass="bg-success shadow-[0_0_14px_rgba(16,185,129,0.4)]"
                    labelClass="text-success"
                  />
                </div>

                <p className="mt-5 text-center text-sm font-bold text-success sm:text-left">
                  %{trFmt0(carbonComparison.reductionPct)} daha az emisyon
                </p>
              </section>
            </motion.div>
          </div>

          {/* BOTTOM ROW — Sustainability score */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="relative mt-8 rounded-xl border border-border bg-card p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    MODÜ-GRID Sürdürülebilirlik Skoru
                  </h2>
                  <ScoreInfoTooltip />
                </div>
                <p className="mt-1 text-xs text-muted">
                  Öz-tüketim, depolama, şebeke bağımsızlığı ve mevzuat uyumu
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-warning">
                <Info className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                Simülasyon Göstergesi
              </span>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_280px]">
              <div className="min-w-0 pr-0 xl:pr-4">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-4xl font-bold tabular-nums text-foreground md:text-5xl">
                    {sustainability.score.toLocaleString('tr-TR')}
                  </span>
                  <span className="text-xl text-muted">/ 1000</span>
                </div>

                <div className="relative mt-6">
                  <div className="h-5 overflow-hidden rounded-full bg-border">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-success to-emerald-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${scorePct}%` }}
                      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                      style={{ boxShadow: '0 0 24px rgba(16,185,129,0.5)' }}
                    />
                  </div>
                  <motion.div
                    className="absolute top-1/2 z-10 h-7 w-7 -translate-y-1/2 rounded-full border-2 border-card bg-success shadow-[0_0_16px_rgba(16,185,129,0.7)]"
                    initial={{ left: 0, opacity: 0 }}
                    animate={{ left: `calc(${scorePct}% - 14px)`, opacity: 1 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                    aria-hidden
                  />
                </div>

                <div className="relative mt-8 grid grid-cols-2 gap-2 text-center sm:grid-cols-4 sm:gap-1">
                  {milestones.map((m) => (
                    <div
                      key={m.at}
                      className={
                        m.current
                          ? 'rounded-lg border border-success/45 bg-success/[0.12] px-1 py-2.5'
                          : 'px-1 py-2.5'
                      }
                    >
                      <div
                        className={`text-[10px] font-semibold tabular-nums sm:text-xs ${
                          m.current ? 'text-success' : 'text-muted'
                        }`}
                      >
                        {m.at}
                      </div>
                      <div
                        className={`mt-1 text-[10px] sm:text-[11px] ${
                          m.current ? 'font-semibold text-success' : 'text-muted'
                        }`}
                      >
                        {m.label}
                        {m.current ? (
                          <span className="mt-0.5 block text-[9px] font-normal text-success/80">
                            ← mevcut
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 border-t border-border pt-6 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
                {sustainability.subScores.map((row) => (
                  <ScoreRow key={row.label} {...row} />
                ))}
              </div>
            </div>

            <aside className="mt-6 flex flex-col gap-2 sm:absolute sm:bottom-6 sm:right-6 sm:mt-0 sm:max-w-[240px]">
              <div className="rounded-xl border border-border bg-background/80 p-3 backdrop-blur-sm">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Mevzuat uyum hedefi
                </p>
                <div className="flex flex-col gap-2">
                  {COMPLIANCE_BADGES.map((badge) => (
                    <ComplianceBadge key={badge.label} {...badge} />
                  ))}
                </div>
                <p className="mt-2 text-[10px] leading-snug text-muted">
                  Sistem bu yönetmeliklere uygun tasarlandı; canlı sertifika doğrulaması donanım entegrasyonu sonrasıdır.
                </p>
              </div>
            </aside>
          </motion.section>
        </div>
      </main>
    </div>
  );
}

function ComparisonColumn({ label, value, widthPct, barClass, labelClass }) {
  return (
    <div className="flex flex-col">
      <p className={`text-xs font-semibold ${labelClass}`}>{label}</p>
      <p className="mt-1 text-sm font-bold tabular-nums text-foreground">{value}</p>
      <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-border">
        <motion.div
          className={`h-full rounded-full ${barClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${widthPct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
        />
      </div>
    </div>
  );
}

function ScoreRow({ label, value, status }) {
  const Icon = status === 'future' ? Circle : CheckCircle;
  const iconCls =
    status === 'glow'
      ? 'text-success drop-shadow-[0_0_8px_rgba(16,185,129,0.55)]'
      : status === 'future'
        ? 'text-primary'
        : 'text-success';

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="inline-flex items-center gap-2 text-muted-light">
        <Icon className={`h-4 w-4 shrink-0 ${iconCls}`} strokeWidth={2} aria-hidden />
        {label}
      </span>
      <span
        className={`font-mono text-sm font-semibold tabular-nums ${
          status === 'glow' ? 'text-success' : 'text-foreground'
        }`}
      >
        {typeof value === 'number' ? `${value}/100` : value}
        {status === 'success' ? (
          <span className="sr-only"> tamamlandı</span>
        ) : status === 'future' ? (
          <span className="sr-only"> geliştiriliyor</span>
        ) : null}
      </span>
    </div>
  );
}

function ComplianceBadge({ label, tone }) {
  const isFuture = tone === 'future';
  const Icon = isFuture ? Zap : CheckCircle;

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium leading-tight',
        isFuture
          ? 'border-primary/30 bg-primary/10 text-primary'
          : 'border-success/30 bg-success/10 text-success',
      ].join(' ')}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
      {label}
    </span>
  );
}

function ProxyInfoTooltip() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-light transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label="Karşılaştırma formülü hakkında bilgi"
        aria-expanded={open}
      >
        <Info className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 rounded-lg border border-border bg-card px-3 py-2 text-[11px] leading-relaxed text-foreground/90 shadow-xl"
        >
          MODÜ emisyonu = geleneksel baseline × (1 − öz-tüketim oranı). Yukarıdaki "Engellenen CO₂" hero kartı ile aynı slider'dan beslenir ama farklı yöntemle hesaplanan bir göstergedir.
        </span>
      )}
    </span>
  );
}

function ScoreInfoTooltip() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-light transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label="Skor formülü hakkında bilgi"
        aria-expanded={open}
      >
        <Info className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-card px-3 py-2 text-[11px] leading-relaxed text-foreground/90 shadow-xl"
        >
          Yatırım fizibilite indeksi. Öz-tüketim, depolama oranı, panel optimumu ve hedeflenen mevzuat uyumu üzerinden hesaplanır. Denetlenmiş bir endeks değildir.
        </span>
      )}
    </span>
  );
}
