import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { animate, AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  Battery,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Minus,
  Plus,
  Home,
  Sparkles,
  Sun,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import ROIChart from '../components/Charts/ROIChart.jsx';
import HardwareStatusBanner from '../components/HardwareStatusBanner.jsx';
import Navbar from '../components/Navbar.jsx';
import PeriodAnalysisTab from '../components/PeriodAnalysisTab.jsx';
import Sidebar from '../components/Sidebar.jsx';
import SliderValueInput from '../components/SliderValueInput.jsx';
import {
  ELECTRICITY_PRICES,
  LEGACY_BASELINE,
  BATTERY_TARGET_KWH,
  SCENARIO_PRESETS,
  SLIDER_RANGES,
  isRoiDisplayable,
  scaleLegacyBaseline,
} from '../constants/simulationDefaults.js';
import CostScenarioSelector from '../components/CostScenarioSelector.jsx';
import { useSimulation } from '../context/SimulationContext.jsx';
import {
  getAnnualFinancialMetrics,
  getFinancialMetrics,
} from '../utils/energyCalculations.js';

const MONTH_SHORT = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
];

const PANEL = SLIDER_RANGES.panelCapacity;
const BATTERY = SLIDER_RANGES.batteryCapacity;
const BLOCK = SLIDER_RANGES.blockCount;
const APT = SLIDER_RANGES.apartmentCount;

const BATTERY_SCENARIOS = [
  { v: 0, title: 'Bataryasız', desc: 'Sadece Akıllı Yönetim' },
  { v: BATTERY_TARGET_KWH, title: 'MODÜ-GRID Hedefi', desc: 'LiFePO4 BESS — proje tasarımı' },
  { v: 90, title: 'Genişletilmiş', desc: '2× hedef kapasite senaryosu' },
];

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function snap(n, step, min, max) {
  const s = Math.round((n - min) / step) * step + min;
  return clamp(s, min, max);
}

function formatTl0(n) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(n));
}

function formatTl2(n) {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function panelZone(cap) {
  if (cap < 150) return 'low';
  if (cap > 350) return 'high';
  return 'ok';
}

function panelZoneMessage(zone) {
  if (zone === 'low') {
    return {
      Icon: AlertTriangle,
      text: 'Yetersiz kapasite — batarya dolmayabilir',
      className: 'text-warning',
    };
  }
  if (zone === 'high') {
    return {
      Icon: AlertCircle,
      text: 'Aşırı kapasite — fazla enerji şebekeye gidecek',
      className: 'text-warning',
    };
  }
  return {
    Icon: CheckCircle2,
    text: 'Optimal aralık — maksimum verimlilik',
    className: 'text-success',
  };
}

function batteryScenarioHint(kwh) {
  if (kwh === 0) return 'Sadece akıllı yönetim — anında kâr, düşük verim';
  if (kwh < BATTERY_TARGET_KWH) return 'Hedef altı depolama — öz-tüketim sınırlı';
  if (kwh === BATTERY_TARGET_KWH) return 'Proje hedefi — LiFePO4 BESS optimizasyonu';
  return 'Hedef üstü kapasite — ek yatırım, marjinal kazanç';
}

function panelSliderTheme(zone) {
  if (zone === 'ok') {
    return {
      fill: '#10B981',
      thumb: '#10B981',
      glow: 'rgba(16, 185, 129, 0.28)',
    };
  }
  if (zone === 'high') {
    return {
      fill: '#F59E0B',
      thumb: '#F59E0B',
      glow: 'rgba(245, 158, 11, 0.28)',
    };
  }
  return {
    fill: '#3B82F6',
    thumb: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.22)',
  };
}

function batterySliderTheme(kwh) {
  if (kwh >= 475) {
    return {
      fill: '#10B981',
      thumb: '#10B981',
      glow: 'rgba(16, 185, 129, 0.32)',
    };
  }
  if (kwh >= 125) {
    return {
      fill: '#10B981',
      thumb: '#3B82F6',
      glow: 'rgba(59, 130, 246, 0.2)',
    };
  }
  return {
    fill: '#3B82F6',
    thumb: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.22)',
  };
}

function useSpringNumber(target) {
  const [v, setV] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const c = animate(fromRef.current, target, {
      type: 'spring',
      stiffness: 260,
      damping: 28,
      mass: 0.42,
      onUpdate: setV,
      onComplete: () => {
        fromRef.current = target;
      },
    });
    return () => c.stop();
  }, [target]);

  return v;
}

function ConfigSlider({
  label,
  icon: Icon,
  iconClass = 'text-primary',
  value,
  unit,
  min,
  max,
  step,
  fillPct,
  theme,
  onChange,
  onValueChange,
  warning,
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {Icon ? <Icon className={`h-5 w-5 shrink-0 ${iconClass}`} strokeWidth={2} /> : null}
          <span>{label}</span>
          {warning}
        </div>
        <SliderValueInput
          value={value}
          min={min}
          max={max}
          unit={unit}
          aria-label={`${label} manuel giriş`}
          onChange={onValueChange}
        />
      </div>
      <div className="relative pt-10">
        <motion.div
          layout
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-background px-3 py-1.5 text-base font-bold tabular-nums text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          style={{ left: `clamp(1.75rem, ${fillPct}%, calc(100% - 1.75rem))` }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        >
          {value}
          <span className="ml-1 text-xs font-semibold text-muted">{unit}</span>
        </motion.div>
        <input
          type="range"
          className="modu-range modu-range-lg"
          min={min}
          max={max}
          step={1}
          value={value}
          style={{
            '--fill-pct': `${fillPct}%`,
            '--range-fill': theme.fill,
            '--thumb-color': theme.thumb,
            '--thumb-glow': theme.glow,
          }}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

export default function FinancialSimulator() {
  const [simTab, setSimTab] = useState('instant');

  const {
    panelCapacity,
    setPanelCapacity,
    batteryCapacity,
    setBatteryCapacity,
    blockCount,
    setBlockCount,
    apartmentCount,
    setApartmentCount,
    selectedMonth,
    setSelectedMonth,
    hourlyData,
    costScenario,
    investmentCosts,
  } = useSimulation();

  const metrics = useMemo(
    () =>
      getFinancialMetrics(hourlyData, batteryCapacity, apartmentCount, panelCapacity),
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

  const investment = annual.investment;
  const roiValid = isRoiDisplayable(annual.roiYears);

  const monthlySpring = useSpringNumber(metrics.monthlyProfit);
  const selfSpring = useSpringNumber(metrics.selfConsumptionRate);
  const roiSpring = useSpringNumber(roiValid ? annual.roiYears : 0);

  const dayTotals = useMemo(() => {
    let dKwh = 0;
    let bKwh = 0;
    let eKwh = 0;
    for (const r of hourlyData) {
      dKwh += r.directUse;
      bKwh += r.batteryUse;
      eKwh += r.gridExport;
    }
    return { dKwh, bKwh, eKwh };
  }, [hourlyData]);

  const pZone = panelZone(panelCapacity);
  const panelTheme = panelSliderTheme(pZone);
  const panelFill = ((panelCapacity - PANEL.min) / (PANEL.max - PANEL.min)) * 100;
  const batteryFill =
    batteryCapacity <= 0 ? 0 : (batteryCapacity / BATTERY.max) * 100;

  const batteryTheme = batterySliderTheme(batteryCapacity);
  const isSystemOptimal = pZone === 'ok' && batteryCapacity === BATTERY_TARGET_KWH;

  const optimalCfg = useCallback(() => {
    const startP = panelCapacity;
    const startB = batteryCapacity;
    const startA = apartmentCount;

    animate(startP, 250, {
      duration: 0.95,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) =>
        setPanelCapacity(snap(v, PANEL.step, PANEL.min, PANEL.max)),
    });

    animate(startB, BATTERY_TARGET_KWH, {
      duration: 0.95,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) =>
        setBatteryCapacity(snap(v, BATTERY.step, BATTERY.min, BATTERY.max)),
    });

    // Daire sayısını referans 100'e yumuşakça çek (zaten 100'deyse no-op)
    if (startA !== 100) {
      animate(startA, 100, {
        duration: 0.95,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (v) => setApartmentCount(snap(v, APT.step, APT.min, APT.max)),
      });
    }

    // Pik üretim ayı (Temmuz) — aylık metrikler için en iyi senaryo
    setSelectedMonth(7);
  }, [
    apartmentCount,
    batteryCapacity,
    panelCapacity,
    setApartmentCount,
    setBatteryCapacity,
    setPanelCapacity,
    setSelectedMonth,
  ]);

  const legacyScaled = useMemo(
    () => scaleLegacyBaseline(apartmentCount),
    [apartmentCount]
  );

  const zoneMsg = panelZoneMessage(pZone);
  const ZoneIcon = zoneMsg.Icon;

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <HardwareStatusBanner />
      <Sidebar />
      <main className="shell-admin lg:pl-[240px]">
        <div className="page-inner space-y-6 sm:space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="page-title">Finansal Simülatör</h1>
              <p className="mt-1 max-w-xl text-sm text-muted">
                Parametreleri değiştirerek yatırım getirisini anlık hesaplayın
              </p>
            </div>
            <motion.button
              type="button"
              onClick={optimalCfg}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 self-start rounded-xl border border-success/30 bg-success/10 px-5 py-2.5 text-sm font-semibold text-success transition hover:border-success/45 hover:bg-success/[0.16] sm:w-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="h-4 w-4" strokeWidth={2} />
              Optimal Konfigürasyonu Göster
            </motion.button>
          </div>

          <nav
            className="pill-scroll gap-6 border-b border-border sm:flex-wrap sm:gap-8 sm:overflow-visible"
            aria-label="Simülasyon sekmeleri"
          >
            {[
              { id: 'instant', label: 'Anlık Simülasyon' },
              { id: 'period', label: 'Dönem Analizi' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSimTab(id)}
                className={`relative min-h-11 shrink-0 px-1 pb-3 text-sm font-semibold transition ${
                  simTab === id ? 'text-foreground' : 'text-muted hover:text-muted-light'
                }`}
              >
                {label}
                {simTab === id ? (
                  <motion.span
                    layoutId="sim-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                ) : null}
              </button>
            ))}
          </nav>

          <CostScenarioSelector className="rounded-xl border border-border bg-card p-4 sm:p-5" />

          <AnimatePresence mode="wait">
            {simTab === 'period' ? (
              <motion.div
                key="period"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
              >
                <PeriodAnalysisTab
                  panelCapacity={panelCapacity}
                  batteryCapacity={batteryCapacity}
                  apartmentCount={apartmentCount}
                />
              </motion.div>
            ) : (
              <motion.div
                key="instant"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
                className="space-y-8"
              >
                {/* MIDDLE ROW — two columns */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  {/* LEFT — parameters */}
                  <section className="rounded-[12px] border border-border bg-card p-5 md:p-6">
                    <h2 className="text-base font-semibold text-foreground">Sistem Konfigürasyonu</h2>

                    <div className="mt-8 space-y-10">
                      <div>
                        <ConfigSlider
                          label="Panel Gücü"
                          icon={Sun}
                          iconClass="text-amber-300"
                          value={panelCapacity}
                          unit="kWp"
                          min={PANEL.min}
                          max={PANEL.max}
                          step={PANEL.step}
                          fillPct={panelFill}
                          theme={panelTheme}
                          warning={
                            pZone === 'high' ? (
                              <motion.span
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                title="Aşırı kapasite"
                              >
                                <AlertTriangle
                                  className="h-4 w-4 text-warning"
                                  strokeWidth={2}
                                />
                              </motion.span>
                            ) : null
                          }
                          onChange={(e) =>
                            setPanelCapacity(
                              snap(Number(e.target.value), PANEL.step, PANEL.min, PANEL.max)
                            )
                          }
                          onValueChange={setPanelCapacity}
                        />
                        <div className="mt-4 grid grid-cols-1 gap-2 text-[11px] font-semibold sm:grid-cols-3">
                          <ZonePill
                            active={pZone === 'low'}
                            dotClass="bg-red-500"
                            title="Yetersiz"
                            range="50–149 kWp"
                            activeClass="bg-red-500/15 text-red-300 ring-1 ring-red-500/35"
                          />
                          <ZonePill
                            active={pZone === 'ok'}
                            dotClass="bg-success"
                            title="Optimal"
                            range="150–350 kWp"
                            activeClass="bg-success/15 text-success ring-1 ring-success/40"
                          />
                          <ZonePill
                            active={pZone === 'high'}
                            dotClass="bg-warning"
                            title="Aşırı Kapasite"
                            range="351–400 kWp"
                            activeClass="bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/35"
                          />
                        </div>
                        <p
                          className={`mt-3 flex items-start gap-2 text-xs leading-snug ${zoneMsg.className}`}
                        >
                          <ZoneIcon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                          {zoneMsg.text}
                        </p>
                      </div>

                      <div>
                        <ConfigSlider
                          label="Batarya Kapasitesi"
                          icon={Battery}
                          value={batteryCapacity}
                          unit="kWh"
                          min={BATTERY.min}
                          max={BATTERY.max}
                          step={BATTERY.step}
                          fillPct={batteryFill}
                          theme={batteryTheme}
                          onChange={(e) =>
                            setBatteryCapacity(
                              snap(
                                Number(e.target.value),
                                BATTERY.step,
                                BATTERY.min,
                                BATTERY.max
                              )
                            )
                          }
                          onValueChange={setBatteryCapacity}
                        />
                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {BATTERY_SCENARIOS.map(({ v, title, desc }) => {
                            const active = batteryCapacity === v;
                            const isTarget = v === BATTERY_TARGET_KWH;
                            return (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setBatteryCapacity(v)}
                                className={[
                                  'min-h-11 rounded-xl border px-3 py-3 text-left transition',
                                  active
                                    ? isTarget
                                      ? 'border-success/55 bg-success/[0.14] text-success shadow-[0_0_32px_rgba(16,185,129,0.25)]'
                                      : 'border-primary/45 bg-primary/10 text-blue-400'
                                    : 'border-border bg-background/50 text-muted-light hover:border-primary/30',
                                ].join(' ')}
                              >
                                <div className="text-xs font-bold tabular-nums">{v} kWh</div>
                                <div className="mt-1 text-[11px] font-semibold leading-snug">
                                  {title}
                                </div>
                                <div className="mt-0.5 text-[10px] font-medium opacity-85">
                                  {desc}
                                </div>
                                {isTarget && active ? (
                                  <CheckCircle2
                                    className="mt-2 h-4 w-4"
                                    strokeWidth={2}
                                    aria-hidden
                                  />
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                        <p className="mt-3 text-xs leading-snug text-muted-light">
                          {batteryScenarioHint(batteryCapacity)}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <StepperControl
                          label="Blok Sayısı"
                          icon={Building2}
                          value={blockCount}
                          min={BLOCK.min}
                          max={BLOCK.max}
                          onDec={() =>
                            setBlockCount((x) => clamp(x - BLOCK.step, BLOCK.min, BLOCK.max))
                          }
                          onInc={() =>
                            setBlockCount((x) => clamp(x + BLOCK.step, BLOCK.min, BLOCK.max))
                          }
                          onChange={setBlockCount}
                        />
                        <StepperControl
                          label="Daire Sayısı"
                          icon={Home}
                          value={apartmentCount}
                          min={APT.min}
                          max={APT.max}
                          onDec={() =>
                            setApartmentCount((x) => clamp(x - APT.step, APT.min, APT.max))
                          }
                          onInc={() =>
                            setApartmentCount((x) => clamp(x + APT.step, APT.min, APT.max))
                          }
                          onChange={setApartmentCount}
                        />
                      </div>

                      <div>
                        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Calendar className="h-4 w-4 text-warning" strokeWidth={2} />
                          Ay Seçimi
                        </div>
                        <p className="mb-3 text-[11px] text-muted">
                          Aylık tasarruf ve öz-tüketim için. ROI tüm yılı kapsar.
                        </p>
                        <div className="pill-scroll sm:flex-wrap sm:overflow-visible">
                          {MONTH_SHORT.map((m, i) => {
                            const month = i + 1;
                            const selected = month === selectedMonth;
                            return (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setSelectedMonth(month)}
                                className={[
                                  'min-h-11 min-w-[2.75rem] rounded-full px-3 py-2 text-xs font-semibold transition',
                                  selected
                                    ? 'bg-primary text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                                    : 'border border-border bg-background text-muted-light hover:border-primary/40 hover:text-foreground',
                                ].join(' ')}
                              >
                                {m}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* RIGHT — metrics */}
                  <motion.section
                    layout
                    className={[
                      'rounded-[12px] border border-border bg-card p-5 md:p-6',
                      isSystemOptimal ? 'metrics-optimal-pulse border-success/25' : '',
                    ].join(' ')}
                  >
                    <h2 className="text-base font-semibold text-foreground">Finansal Çıktılar</h2>
                    <p className="mt-1 text-xs text-muted">
                      Slider hareket ettikçe metrikler anlık güncellenir. ROI 12 aylık
                      mevsim ağırlıklı hesaplanır.
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-4">
                      <motion.div
                        layout
                        className="rounded-xl border border-success/25 bg-success/[0.06] p-5"
                      >
                        <div className="flex items-center justify-between">
                          <TrendingUp className="h-6 w-6 text-success" strokeWidth={2} />
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-success/90">
                            Aylık Net Tasarruf
                          </span>
                        </div>
                        <div className="mt-2 text-3xl font-black tracking-tight text-success sm:text-4xl md:text-[42px]">
                          ₺{' '}
                          <span className="tabular-nums">{formatTl0(monthlySpring)}</span>
                        </div>
                        <p className="mt-2 text-sm text-muted-light">
                          Daire başı:{' '}
                          <span className="font-semibold text-foreground">
                            ₺ {formatTl0(metrics.perApartmentMonthly)}/ay
                          </span>
                        </p>
                      </motion.div>

                      <motion.div
                        layout
                        className="rounded-xl border border-primary/22 bg-primary/[0.06] p-5"
                      >
                        <div className="flex items-center justify-between">
                          <Target className="h-6 w-6 text-primary" strokeWidth={2} />
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-400">
                            Öz-Tüketim Oranı
                          </span>
                        </div>
                        <div className="mt-2 text-3xl font-black tracking-tight text-primary sm:text-4xl md:text-[42px]">
                          %
                          <span className="tabular-nums">{selfSpring.toFixed(0)}</span>
                        </div>
                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-border">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-success"
                            initial={false}
                            animate={{ width: `${clamp(selfSpring, 0, 100)}%` }}
                            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                          />
                        </div>
                      </motion.div>

                      <motion.div
                        layout
                        className="rounded-xl border border-warning/28 bg-warning/[0.06] p-5"
                      >
                        <div className="flex items-center justify-between">
                          <Clock className="h-6 w-6 text-warning" strokeWidth={2} />
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/95">
                            ROI Süresi
                          </span>
                        </div>
                        <div className="mt-2 text-3xl font-black tracking-tight text-warning sm:text-4xl md:text-[42px]">
                          {roiValid ? (
                            <span className="tabular-nums">{roiSpring.toFixed(1)} Yıl</span>
                          ) : (
                            <span className="text-2xl text-muted">—</span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-muted-light">
                          12 aylık mevsim ağırlıklı ·{' '}
                          {SCENARIO_PRESETS[costScenario]?.label ?? 'Pilot'} CAPEX
                        </p>
                      </motion.div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <EnergyFlowRow
                        icon={Sun}
                        label="Panel → Direkt"
                        kwh={dayTotals.dKwh}
                        unitPrice={ELECTRICITY_PRICES.directAvoided}
                        totalTl={metrics.directSavings}
                        tone="text-success"
                        borderTone="border-success/20 bg-success/[0.06]"
                      />
                      <EnergyFlowRow
                        icon={Battery}
                        label="Batarya → Tüketim"
                        kwh={dayTotals.bKwh}
                        unitPrice={ELECTRICITY_PRICES.batteryAvoided}
                        totalTl={metrics.batterySavings}
                        tone="text-primary"
                        borderTone="border-primary/20 bg-primary/[0.06]"
                      />
                      <EnergyFlowRow
                        icon={Zap}
                        label="Şebeke Satışı"
                        kwh={dayTotals.eKwh}
                        unitPrice={ELECTRICITY_PRICES.gridExport}
                        totalTl={metrics.gridExportRevenue}
                        tone="text-warning"
                        borderTone="border-warning/20 bg-warning/[0.06]"
                      />
                      <div className="mt-3 rounded-xl border border-success/30 bg-success/[0.08] px-4 py-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-sm font-bold text-foreground">
                            Toplam Günlük Kâr
                          </span>
                          <span className="text-xl font-black tabular-nums text-success sm:text-2xl">
                            {formatTl2(metrics.dailyProfit)} ₺
                          </span>
                        </div>
                        <p className="mt-2 text-center text-[11px] tabular-nums text-muted-light sm:text-left">
                          Seçili ay ({MONTH_SHORT[selectedMonth - 1]}):{' '}
                          <span className="font-semibold text-foreground">
                            ₺ {formatTl0(metrics.monthlyProfit)}/ay
                          </span>
                          <span className="mx-2 text-border-strong">|</span>
                          Yıllık toplam (12 ay):{' '}
                          <span className="font-semibold text-success">
                            ₺ {formatTl0(annual.annualSavings)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <LegacyComparisonCard
                      selfRate={metrics.selfConsumptionRate}
                      monthlyProfit={metrics.monthlyProfit}
                      roiYears={annual.roiYears}
                      roiValid={roiValid}
                      legacyLoss={legacyScaled.monthlyLossTl}
                    />
                  </motion.section>
                </div>

                {/* BOTTOM ROW — ROI chart */}
                <ROIChart yearlyProfit={annual.annualSavings} investment={investment} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function ZonePill({ active, dotClass, title, range, activeClass }) {
  return (
    <div
      className={[
        'rounded-lg px-2 py-2 text-center transition',
        active ? activeClass : 'text-muted',
      ].join(' ')}
    >
      <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${dotClass}`} aria-hidden />
      {title}
      <div className="mt-0.5 text-[10px] font-normal opacity-80">{range}</div>
    </div>
  );
}

function LegacyComparisonCard({ selfRate, monthlyProfit, roiYears, roiValid, legacyLoss }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-3 border-t border-border pt-6 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch sm:gap-4">
      <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-red-300">
          Geleneksel Sistem
        </p>
        <ul className="mt-3 space-y-2 text-xs text-muted-light">
          <li className="flex justify-between gap-2">
            <span>Öz-tüketim</span>
            <span className="font-semibold text-red-300">
              %{LEGACY_BASELINE.selfConsumptionPercent}
            </span>
          </li>
          <li className="flex justify-between gap-2">
            <span>Aylık etki</span>
            <span className="flex items-center gap-1 font-semibold text-red-400">
              <TrendingDown className="h-3.5 w-3.5" strokeWidth={2} />
              -₺ {formatTl0(legacyLoss)}
            </span>
          </li>
          <li className="flex justify-between gap-2">
            <span>ROI</span>
            <span className="font-semibold text-red-300">{LEGACY_BASELINE.roiLabel}</span>
          </li>
        </ul>
      </div>

      <div
        className="hidden items-center justify-center sm:flex"
        aria-hidden
      >
        <div className="h-full w-px bg-border-strong" />
      </div>

      <div className="rounded-xl border border-success/30 bg-success/[0.08] p-4 shadow-[inset_0_0_24px_rgba(16,185,129,0.06)]">
        <p className="text-xs font-bold uppercase tracking-wide text-success">MODÜ-GRID</p>
        <ul className="mt-3 space-y-2 text-xs text-muted-light">
          <li className="flex justify-between gap-2">
            <span>Öz-tüketim</span>
            <span className="font-semibold text-success">%{selfRate.toFixed(0)}</span>
          </li>
          <li className="flex justify-between gap-2">
            <span>Aylık net</span>
            <span className="flex items-center gap-1 font-semibold text-success">
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
              +₺ {formatTl0(monthlyProfit)}
            </span>
          </li>
          <li className="flex justify-between gap-2">
            <span>ROI</span>
            <span className="font-semibold text-success">
              {roiValid ? `${roiYears.toFixed(1)} Yıl` : '—'}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function StepperControl({ label, icon: Icon, value, min, max, onDec, onInc, onChange }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
          {label}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:border-primary/40 hover:bg-primary/[0.08]"
            onClick={onDec}
            aria-label={`${label} azalt`}
          >
            <Minus className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <SliderValueInput
            value={value}
            min={min}
            max={max}
            aria-label={`${label} manuel giriş`}
            inputClassName="w-[3.5rem] text-center text-lg font-bold"
            onChange={onChange}
          />
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:border-primary/40 hover:bg-primary/[0.08]"
            onClick={onInc}
            aria-label={`${label} arttır`}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

function EnergyFlowRow({ icon: Icon, label, kwh, unitPrice, totalTl, tone, borderTone }) {
  return (
    <motion.div
      layout
      className={`flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${borderTone}`}
      initial={{ opacity: 0.85 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Icon className={`h-4 w-4 shrink-0 ${tone}`} strokeWidth={2} aria-hidden />
        <span className="truncate text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm tabular-nums sm:gap-4">
        <span className={`font-semibold ${tone}`}>{Math.round(kwh)} kWh</span>
        <span className="text-muted-light">{formatTl2(unitPrice)} ₺/kWh</span>
        <span className={`font-bold ${tone}`}>{formatTl2(totalTl)} ₺</span>
      </div>
    </motion.div>
  );
}
