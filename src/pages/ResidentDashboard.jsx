import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Battery,
  Building2,
  CalendarDays,
  CheckCircle2,
  Home,
  Leaf,
  Receipt,
  ShieldCheck,
  Sun,
  TrendingUp,
  Wifi,
  Zap,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Navbar from '../components/Navbar.jsx';
import { ELECTRICITY_PRICES } from '../constants/simulationDefaults.js';
import { useSimulation } from '../context/SimulationContext.jsx';
import {
  getCarbonMetrics,
  getDailyConsumption,
  getDailyProduction,
  getFinancialMetrics,
  getPeriodAnalysis,
} from '../utils/energyCalculations.js';

const LAST_CHECK = 'bugün 14:32';

function apartmentVariationFactor(aptNum) {
  const t = (Math.sin(aptNum * 9301 + 49297) + 1) / 2;
  return 0.85 + t * 0.3;
}

function monthlySavingsTrendPct(aptNum) {
  const t = (Math.sin(aptNum * 49.413 + 2.17) + 1) / 2;
  return 8 + t * 7;
}

function monthlyConsumptionTrendPct(aptNum) {
  const t = (Math.sin(aptNum * 7.31 + 1.42) + 1) / 2;
  return -7 + t * 4;
}

function parseAptIndex(selectedApartment) {
  const m = /^daire(\d+)$/.exec(String(selectedApartment || ''));
  return m ? clamp(Number(m[1]), 1, 10) : 1;
}

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

function readAuthApartment() {
  try {
    const raw = localStorage.getItem('auth');
    if (!raw) return 'daire1';
    const j = JSON.parse(raw);
    const u = String(j.username || '');
    if (/^daire\d+$/.test(u)) return u;
    return 'daire1';
  } catch {
    return 'daire1';
  }
}

function gridStatusLabel(hour) {
  if (hour >= 8 && hour <= 18) return { text: 'Fazla üretim şebekeye', tone: 'text-success' };
  if (hour >= 18 && hour <= 23) return { text: 'Dengeli', tone: 'text-warning' };
  return { text: 'Şebekeden minimum', tone: 'text-muted' };
}

/** Sakin paneli için temsili "anlık" snapshot saati — öğle pikinde tutuyoruz ki
 *  görselleştirme duvar saatine değil simülasyon parametrelerine bağlı kalsın. */
const DEMO_SNAPSHOT_HOUR = 13;

export default function ResidentDashboard() {
  const {
    panelCapacity,
    batteryCapacity,
    apartmentCount,
    selectedMonth,
    hourlyData,
    blockCount,
  } = useSimulation();

  const selectedApartment = readAuthApartment();
  const aptNum = parseAptIndex(selectedApartment);
  const variation = apartmentVariationFactor(aptNum);
  const trendPct = monthlySavingsTrendPct(aptNum);
  const consTrendPct = monthlyConsumptionTrendPct(aptNum);

  const metrics = useMemo(
    () =>
      getFinancialMetrics(hourlyData, batteryCapacity, apartmentCount, panelCapacity),
    [hourlyData, batteryCapacity, apartmentCount, panelCapacity]
  );

  const { selfConsumptionRate } = metrics;

  const greenShare = useMemo(() => {
    const nApt = Math.max(1, apartmentCount);
    const v = variation;
    let sum = 0;
    let count = 0;
    for (const row of hourlyData) {
      const solar = (row.directUse / nApt) * v;
      const battery = (row.batteryUse / nApt) * v;
      const grid = (row.gridImport / nApt) * v;
      const total = solar + battery + grid;
      if (total > 0) {
        sum += ((solar + battery) / total) * 100;
        count += 1;
      }
    }
    return count ? sum / count : selfConsumptionRate;
  }, [hourlyData, apartmentCount, variation, selfConsumptionRate]);

  const baseMonthlyKwh = getDailyConsumption(1) * 30;
  const daireTüketimi = baseMonthlyKwh * variation;
  const lastMonthKwh = daireTüketimi / (1 + consTrendPct / 100);
  const daireTasarrufu =
    (selfConsumptionRate / 100) * daireTüketimi * ELECTRICITY_PRICES.directAvoided;

  // Aylık fatura tahmini: tüketim × alış-tarifesi − tasarruf (net ödenecek)
  const baselineFaturaTl = daireTüketimi * ELECTRICITY_PRICES.gridImport;
  const netFaturaTl = Math.max(0, baselineFaturaTl - daireTasarrufu);

  // Yıllık kümülatif daire tasarrufu — 12 ay gerçek toplam × variation
  const yearlyApt = useMemo(() => {
    const period = getPeriodAnalysis(panelCapacity, batteryCapacity, apartmentCount, 1, 12);
    const perAptYearly = apartmentCount > 0
      ? (period.totalSavings / apartmentCount) * variation
      : 0;
    return {
      savingsTl: perAptYearly,
      months: period.periodMonths,
    };
  }, [panelCapacity, batteryCapacity, apartmentCount, variation]);

  // Bu ay engellenen CO₂ — daire payı (sitenin engellediği / daire × variation)
  const aptMonthlyCO2 = useMemo(() => {
    const dailyProd = getDailyProduction(panelCapacity, selectedMonth);
    const c = getCarbonMetrics(dailyProd, selfConsumptionRate);
    return apartmentCount > 0
      ? (c.monthlyCO2Saved / apartmentCount) * variation
      : 0;
  }, [panelCapacity, selectedMonth, selfConsumptionRate, apartmentCount, variation]);

  const blockIndex = useMemo(() => {
    const n = blockCount > 0 ? blockCount : 1;
    const idx = Math.floor(((aptNum - 1) * n) / 10);
    return clamp(idx, 0, n - 1);
  }, [aptNum, blockCount]);

  const blockLetter = String.fromCharCode(65 + blockIndex);

  const apartmentsPerBlock = useMemo(
    () => Math.max(1, Math.round(apartmentCount / Math.max(1, blockCount))),
    [apartmentCount, blockCount]
  );

  const hourlyBars = useMemo(() => {
    const nApt = Math.max(1, apartmentCount);
    const v = variation;
    return hourlyData.map((row) => {
      const solar = (row.directUse / nApt) * v;
      const battery = (row.batteryUse / nApt) * v;
      const grid = (row.gridImport / nApt) * v;
      const toplam = solar + battery + grid;
      const greenPct = toplam > 0 ? ((solar + battery) / toplam) * 100 : 0;
      return {
        label: `${String(row.hour).padStart(2, '0')}:00`,
        hour: row.hour,
        toplam,
        solar,
        battery,
        grid,
        greenPct,
      };
    });
  }, [hourlyData, apartmentCount, variation]);

  const avgSoC = useMemo(() => {
    if (!hourlyData.length) return 0;
    const s = hourlyData.reduce((a, r) => a + r.batterySoC, 0);
    return s / hourlyData.length;
  }, [hourlyData]);

  const blockMonthlyKwh = useMemo(() => {
    const siteMonthly = getDailyConsumption(apartmentCount) * 30;
    return Math.round(siteMonthly / Math.max(1, blockCount));
  }, [apartmentCount, blockCount]);

  const blockSelfRate = useMemo(() => {
    const offset = blockIndex * 3.7;
    const v = (Math.sin(offset) + 1) / 2;
    return Math.round(clamp(selfConsumptionRate - 2 + v * 4, 68, 82));
  }, [blockIndex, selfConsumptionRate]);

  const snapshotHour = DEMO_SNAPSHOT_HOUR;
  const gridStatus = gridStatusLabel(snapshotHour);

  const instProdKw = useMemo(() => {
    const fromHourly = hourlyData[snapshotHour]?.production;
    if (typeof fromHourly === 'number') return fromHourly;
    // Fallback: günlük üretimi aktif üretim saatlerine (06-18, ~12 saat) böl
    return getDailyProduction(panelCapacity, selectedMonth) / 12;
  }, [hourlyData, snapshotHour, panelCapacity, selectedMonth]);

  const stabiliteData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = i + 1;
      const base = 85 + ((Math.sin(aptNum * 11.17 + day * 3.1) + 1) / 2) * 15;
      return { gun: `Gün ${day}`, skor: Math.round(clamp(base, 85, 100)) };
    });
  }, [aptNum]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.06 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div
        className="fixed left-0 right-0 top-16 z-30 flex min-h-[2.75rem] items-center border-b border-warning/20 px-4 py-2 text-[11px] sm:min-h-[40px] sm:px-6 sm:text-sm"
        style={{ background: 'rgba(245, 158, 11, 0.08)' }}
        role="status"
      >
        <span className="flex min-w-0 items-center gap-2 text-warning/95">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden />
          <span className="min-w-0 leading-snug">
            <span className="font-medium text-amber-200">Simülasyon Modu</span>
            <span className="hidden text-warning/75 sm:inline">
              {' '}
              — Veriler örnek simülasyon verisine dayanmaktadır
            </span>
            <span className="text-warning/75 sm:hidden"> — Örnek veri</span>
          </span>
        </span>
      </div>

      <main className="shell-resident">
        <div className="page-inner mx-auto max-w-7xl space-y-6 sm:space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center gap-3 rounded-2xl border border-border/80 bg-gradient-to-r from-card to-card/60 px-5 py-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15">
              <Home className="h-5 w-5 text-success" strokeWidth={2} aria-hidden />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Hoş geldiniz, Daire {aptNum} — Blok {blockLetter}
              </h1>
              <p className="mt-0.5 text-xs text-muted">
                Kişisel enerji özeti ve apartman performansınız
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <motion.section
              variants={item}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-light">Bu Ayki Tasarruf</p>
                  <div className="mt-2 text-2xl font-bold tabular-nums text-success sm:text-3xl">
                    ₺ {Math.round(daireTasarrufu)}
                  </div>
                </div>
                <TrendingUp className="h-5 w-5 shrink-0 text-success" strokeWidth={2} />
              </div>
              <p className="mt-3 text-xs font-semibold text-success/90">
                Geçen aya göre +%{Math.round(trendPct)}
              </p>
              <p className="mt-2 flex items-center gap-1.5 border-t border-border pt-2 text-[11px] tabular-nums text-muted">
                <Receipt className="h-3 w-3 shrink-0 text-muted-light" strokeWidth={2} aria-hidden />
                Bu ayki fatura tahmini:{' '}
                <span className="font-semibold text-foreground/90">
                  ₺ {Math.round(netFaturaTl).toLocaleString('tr-TR')}
                </span>
              </p>
            </motion.section>

            <motion.section
              variants={item}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-light">Tüketimim</p>
                  <div className="mt-2 text-2xl font-bold tabular-nums text-primary sm:text-3xl">
                    {Math.round(daireTüketimi)} kWh
                  </div>
                </div>
                <Zap className="h-5 w-5 shrink-0 text-primary" strokeWidth={2} />
              </div>
              <p className={`mt-3 text-xs font-semibold ${consTrendPct < 0 ? 'text-success/90' : 'text-warning/90'}`}>
                Geçen aya göre {consTrendPct >= 0 ? '+' : ''}
                {Math.round(consTrendPct)}% ({Math.round(lastMonthKwh)} kWh)
              </p>
            </motion.section>

            <motion.section
              variants={item}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-light">Yeşil Enerji Payım</p>
                  <div className="mt-2 text-2xl font-bold tabular-nums text-success sm:text-3xl">
                    %{Math.round(greenShare)}
                  </div>
                </div>
                <Sun className="h-5 w-5 shrink-0 text-success" strokeWidth={2} />
              </div>
              <p className="mt-3 text-[11px] text-muted">Güneş + Bataryadan karşılandı</p>
            </motion.section>

            <motion.section
              variants={item}
              className="rounded-2xl border border-success/35 bg-card p-5 shadow-[0_0_24px_rgba(16,185,129,0.12)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-light">Akıllı Sigorta Durumu</p>
                  <div className="mt-2 text-2xl font-bold text-success">Aktif</div>
                </div>
                <ShieldCheck className="h-5 w-5 shrink-0 text-success" strokeWidth={2} />
              </div>
              <p className="mt-3 text-[11px] tabular-nums text-muted-light">
                Son kontrol: {LAST_CHECK}
              </p>
            </motion.section>
          </motion.div>

          {/* 2. KPI satırı — uzun vadeli ve etki */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <motion.section
              variants={item}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-light">Yıllık Tasarruf Tahmini</p>
                  <div className="mt-2 text-2xl font-bold tabular-nums text-success sm:text-3xl">
                    ₺ {Math.round(yearlyApt.savingsTl).toLocaleString('tr-TR')}
                  </div>
                </div>
                <CalendarDays className="h-5 w-5 shrink-0 text-success" strokeWidth={2} aria-hidden />
              </div>
              <p className="mt-3 text-[11px] text-muted">
                12 ay simülasyonun daire başı payı (mevsim ağırlıklı toplam)
              </p>
            </motion.section>

            <motion.section
              variants={item}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-light">Bu Ay Engellediğin CO₂</p>
                  <div className="mt-2 text-2xl font-bold tabular-nums text-success sm:text-3xl">
                    {Math.round(aptMonthlyCO2).toLocaleString('tr-TR')}{' '}
                    <span className="text-base text-muted-light">kg</span>
                  </div>
                </div>
                <Leaf className="h-5 w-5 shrink-0 text-success" strokeWidth={2} aria-hidden />
              </div>
              <p className="mt-3 text-[11px] text-muted">
                Senin payına düşen aylık atmosfer tasarrufu
              </p>
            </motion.section>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground">
                  Günlük Tüketim Profilim
                </h2>
                <p className="mt-1 text-xs text-muted">Saatlik dağılım (kendi daireniz)</p>
              </div>

              <div className="chart-panel">
                <div className="chart-h-sm w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyBars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#1F2937" strokeDasharray="4 8" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#6B7280', fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#1F2937' }}
                      interval={2}
                    />
                    <YAxis
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: '#1F2937' }}
                      label={{
                        value: 'kWh',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#9CA3AF',
                        fontSize: 11,
                      }}
                    />
                    <Tooltip content={<HourlyTooltip />} cursor={{ fill: 'rgba(59,130,246,0.06)' }} />
                    <Bar dataKey="solar" stackId="a" fill="#10B981" name="Güneş Enerjisi" />
                    <Bar dataKey="battery" stackId="a" fill="#3B82F6" name="Batarya" />
                    <Bar
                      dataKey="grid"
                      stackId="a"
                      fill="#4B5563"
                      radius={[3, 3, 0, 0]}
                      name="Şebeke"
                    />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1.5 text-[11px] text-muted-light">
                  <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
                  Güneş Enerjisi
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1.5 text-[11px] text-muted-light">
                  <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                  Batarya
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1.5 text-[11px] text-muted-light">
                  <span className="h-2 w-2 rounded-full bg-gray-600" aria-hidden />
                  Şebeke
                </span>
              </div>
            </motion.section>

            <div className="grid grid-cols-1 gap-6">
              <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-foreground" />
                  <h2 className="text-base font-semibold text-foreground">Bloğum — Blok {blockLetter}</h2>
                </div>

                <MiniBuildingDiagram aptNum={aptNum} />

                <div className="mt-4 space-y-2 text-xs text-muted-light">
                  <div className="flex justify-between gap-3">
                    <span>Blok Toplam Tüketim</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {blockMonthlyKwh.toLocaleString('tr-TR')} kWh
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Blok Öz-Tüketim Oranı</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      %{blockSelfRate}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Bloktaki Daire Sayısı</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {apartmentsPerBlock}
                    </span>
                  </div>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="mb-1 flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">Site Geneli</h2>
                </div>
                <p className="mb-4 text-[11px] text-muted">
                  Apartmanınızın anlık durumu (anonim toplam)
                </p>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-muted-light">
                      <Sun className="h-4 w-4 text-success" />
                      Çatıdan Üretim
                    </div>
                    <div className="text-right font-semibold tabular-nums text-success">
                      {Math.round(instProdKw)} kW
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-muted-light">
                        <Battery className="h-4 w-4 text-primary" />
                        Site Bataryası
                      </div>
                      <div className="font-semibold tabular-nums text-foreground">
                        {avgSoC.toFixed(0)}%
                      </div>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${clamp(avgSoC, 0, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-muted-light">
                      <Zap className={`h-4 w-4 ${gridStatus.tone}`} />
                      Şebeke
                    </div>
                    <div className={`text-right text-sm font-semibold ${gridStatus.tone}`}>
                      {gridStatus.text}
                    </div>
                  </div>
                </div>
              </motion.section>
            </div>
          </div>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Sistem Sağlığı — Detay</h2>
                <p className="mt-1 text-xs text-muted">Son kontrol: {LAST_CHECK}</p>
              </div>
              <ShieldCheck className="h-5 w-5 shrink-0 text-success" strokeWidth={2} aria-hidden />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span className="text-foreground">Aşırı Yük Koruması — Normal</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span className="text-foreground">Voltaj Dengesi — Normal</span>
                </div>
                <div className="flex items-start gap-2">
                  <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <span className="text-foreground">LoRaWAN Bağlantısı — Simülasyon Modu</span>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-muted-light">Son 7 Gün Stabilite</p>
                <div className="chart-panel">
                  <div className="h-[140px] min-w-[260px] w-full sm:min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stabiliteData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="#1F2937" strokeDasharray="4 8" vertical={false} />
                        <XAxis
                          dataKey="gun"
                          tick={{ fill: '#6B7280', fontSize: 10 }}
                          tickLine={false}
                          axisLine={{ stroke: '#1F2937' }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: '#6B7280', fontSize: 10 }}
                          tickLine={false}
                          axisLine={{ stroke: '#1F2937' }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#111827',
                            border: '1px solid #1F2937',
                            borderRadius: 12,
                            fontSize: 11,
                            color: '#F9FAFB',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="skor"
                          stroke="#10B981"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-5 border-t border-border pt-4 text-center text-[11px] text-muted">
              Gerçek saha verisi için donanım bağlantısı gereklidir
            </p>
          </motion.section>

        </div>
      </main>
    </div>
  );
}

function HourlyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  const time = row.label ?? '';
  const kwh = row.toplam.toFixed(1);
  const pct = Math.round(row.greenPct ?? 0);
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-foreground">
        {time} — {kwh} kWh tüketim, %{pct} güneşten
      </p>
    </div>
  );
}

function MiniBuildingDiagram({ aptNum }) {
  const floors = 5;
  const unitsPerFloor = 4;
  const flatIndexFromApt = clamp(aptNum - 1, 0, 19);

  return (
    <div className="mx-auto w-full max-w-[220px] rounded-2xl border border-border bg-background/40 p-3">
      <svg viewBox="0 0 120 160" className="h-44 w-full" role="img" aria-label="Blok diyagramı">
        <rect
          x="10"
          y="8"
          width="100"
          height="144"
          rx="10"
          fill="#111827"
          stroke="#1F2937"
          strokeWidth="2"
        />
        {Array.from({ length: floors }, (_, fi) => {
          const floor = floors - 1 - fi;
          return Array.from({ length: unitsPerFloor }, (_, ui) => {
            const idx = floor * unitsPerFloor + ui;
            const active = idx === flatIndexFromApt;
            const x = 20 + ui * 22;
            const y = 18 + fi * 26;
            return (
              <rect
                key={`${fi}-${ui}`}
                x={x}
                y={y}
                width="16"
                height="14"
                rx="2"
                fill={active ? '#1D4ED8' : '#111827'}
                stroke={active ? '#3B82F6' : '#374151'}
                strokeWidth={active ? 2 : 1}
                filter={active ? 'drop-shadow(0 0 10px rgba(59,130,246,0.65))' : undefined}
              />
            );
          });
        })}
      </svg>
      <p className="mt-2 text-center text-[11px] text-muted">Sizin daireniz vurgulu</p>
    </div>
  );
}
