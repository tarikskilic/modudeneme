import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart2,
  Calendar,
  Download,
  Leaf,
  PlayCircle,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getPeriodAnalysis } from '../utils/energyCalculations.js';

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

function formatTl0(n) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(n));
}

/** Yüzde formatlayıcı — TR locale, 1 ondalık (örn. 75,3). Toplu yuvarlama tuzağını önler. */
function formatPct1(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '0,0';
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n);
}

const WINTER_MONTHS = new Set([1, 2, 11, 12]);
const SUMMER_MONTHS = new Set([6, 7, 8]);

/** Worst-month bağlamına göre kısa açıklama metni. */
function worstMonthHint(worstMonthIndex) {
  if (worstMonthIndex == null) return null;
  if (WINTER_MONTHS.has(worstMonthIndex)) {
    return 'Kış aylarında güneşlenme azalır, batarya önemi artar.';
  }
  if (SUMMER_MONTHS.has(worstMonthIndex)) {
    return 'Yaz aylarında üretim yüksek; en zayıf ay bile pozitif.';
  }
  return 'Geçiş aylarında güneşlenme orta düzeyde; konfigürasyon dengeli.';
}

function PerformanceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <div className="mb-2 font-semibold text-foreground">{row.monthName}</div>
      <div className="space-y-1 text-[11px] text-muted-light">
        <div className="flex justify-between gap-8">
          <span>Tasarruf</span>
          <span className="font-mono font-semibold text-success">
            ₺{row.monthlyProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex justify-between gap-8">
          <span>Üretim</span>
          <span className="font-mono text-foreground">
            {row.monthlyProduction.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} kWh
          </span>
        </div>
        <div className="flex justify-between gap-8">
          <span>Öz-tüketim</span>
          <span className="font-mono text-primary">%{formatPct1(row.selfConsumptionRate)}</span>
        </div>
        <div className="flex justify-between gap-8">
          <span>CO₂ tasarrufu</span>
          <span className="font-mono text-foreground">
            {row.monthlyCO2Saved.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} kg
          </span>
        </div>
      </div>
    </div>
  );
}

function CumulativeTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-2 py-1 text-[11px] text-foreground">
      ₺ {formatTl0(row.cumulativeSavings)}
    </div>
  );
}

const barListVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const barItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function PeriodAnalysisTab({
  panelCapacity,
  batteryCapacity,
  apartmentCount,
}) {
  const [startMonth, setStartMonth] = useState(1);
  const [endMonth, setEndMonth] = useState(6);
  const [analysis, setAnalysis] = useState(null);

  const runAnalysis = useCallback(() => {
    const res = getPeriodAnalysis(
      panelCapacity,
      batteryCapacity,
      apartmentCount,
      startMonth,
      endMonth
    );
    setAnalysis(res);
  }, [panelCapacity, batteryCapacity, apartmentCount, startMonth, endMonth]);

  useEffect(() => {
    setAnalysis(null);
  }, [panelCapacity, batteryCapacity, apartmentCount, startMonth, endMonth]);

  const summaryText = useMemo(() => {
    const a = MONTH_SHORT[startMonth - 1];
    const b = MONTH_SHORT[endMonth - 1];
    const n = endMonth - startMonth + 1;
    return `${a} — ${b} arası ${n} aylık analiz`;
  }, [startMonth, endMonth]);

  const chartRows = useMemo(() => {
    if (!analysis?.monthlyResults?.length) return [];
    return analysis.monthlyResults.map((r) => ({
      ...r,
      label: MONTH_SHORT[r.month - 1],
    }));
  }, [analysis]);

  const totalsRow = useMemo(() => {
    if (!analysis?.monthlyResults?.length) return null;
    const m = analysis.monthlyResults;
    const sumProd = m.reduce((s, x) => s + x.monthlyProduction, 0);
    const sumProfit = m.reduce((s, x) => s + x.monthlyProfit, 0);
    const sumCo2 = m.reduce((s, x) => s + x.monthlyCO2Saved, 0);
    const lastCum = m[m.length - 1].cumulativeSavings;
    return {
      sumProd,
      sumProfit,
      sumCo2,
      lastCum,
      avgPct: analysis.averageSelfConsumption,
    };
  }, [analysis]);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Analiz Dönemi Seçin</h2>
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-light">Başlangıç</p>
            <div className="pill-scroll mt-2 sm:flex-wrap sm:overflow-visible">
              {MONTH_SHORT.map((m, i) => {
                const mo = i + 1;
                const sel = mo === startMonth;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setStartMonth(mo);
                      if (endMonth < mo) setEndMonth(mo);
                    }}
                    className={`min-h-11 rounded-full px-3 py-2 text-xs font-semibold transition ${
                      sel
                        ? 'bg-primary text-white'
                        : 'border border-border bg-background text-muted-light hover:border-primary/40'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-light">Bitiş</p>
            <div className="pill-scroll mt-2 sm:flex-wrap sm:overflow-visible">
              {MONTH_SHORT.map((m, i) => {
                const mo = i + 1;
                const sel = mo === endMonth;
                const disabled = mo < startMonth;
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={disabled}
                    onClick={() => setEndMonth(mo)}
                    className={`min-h-11 rounded-full px-3 py-2 text-xs font-semibold transition ${
                      disabled
                        ? 'cursor-not-allowed border border-border/50 bg-background/50 text-gray-600'
                        : sel
                          ? 'bg-primary text-white'
                          : 'border border-border bg-background text-muted-light hover:border-primary/40'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-6 flex items-center gap-2 text-sm text-muted-light">
          <Calendar className="h-4 w-4 shrink-0 text-primary" />
          {summaryText}
        </p>

        <motion.button
          type="button"
          onClick={runAnalysis}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(59,130,246,0.25)] transition"
          whileHover={{
            scale: 1.01,
            boxShadow: '0 0 32px rgba(59,130,246,0.45)',
          }}
          whileTap={{ scale: 0.99 }}
        >
          <PlayCircle className="h-5 w-5" strokeWidth={2} />
          Analizi Başlat
        </motion.button>
      </section>

      {!analysis ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-alt/40 px-6 py-20 text-center"
        >
          <BarChart2 className="h-12 w-12 text-gray-600" strokeWidth={1.5} />
          <p className="mt-4 max-w-md text-sm text-muted">
            Dönem seçin ve analizi başlatın — mevsimsel tasarruf ve öz-tüketim trendlerini
            görüntüleyin
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${panelCapacity}-${batteryCapacity}-${apartmentCount}-${startMonth}-${endMonth}-r`}
            variants={barListVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            <motion.div variants={barItem} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                icon={TrendingUp}
                iconClass="text-success"
                title="Toplam Dönem Tasarrufu"
                value={`₺ ${formatTl0(analysis.totalSavings)}`}
                sub={`${analysis.periodMonths} aylık toplam net tasarruf`}
              />
              <KpiCard
                icon={BarChart2}
                iconClass="text-primary"
                title="Ortalama Aylık Tasarruf"
                value={`₺ ${formatTl0(analysis.totalSavings / analysis.periodMonths)}`}
                sub="Aylık ortalama"
              />
              <KpiCard
                icon={Leaf}
                iconClass="text-success"
                title="Toplam CO₂ Tasarrufu"
                value={`${analysis.totalCO2.toFixed(0)} kg`}
                sub={`Eşdeğer ${analysis.totalTrees.toFixed(0)} ağaç`}
              />
              <KpiCard
                icon={Target}
                iconClass="text-primary"
                title="Ortalama Öz-Tüketim"
                value={`%${formatPct1(analysis.averageSelfConsumption)}`}
                sub="Dönem ortalaması"
              />
            </motion.div>

            <motion.div variants={barItem} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-success/40 bg-card p-5 shadow-[0_0_24px_rgba(16,185,129,0.15)]">
                <div className="flex items-center gap-2 text-amber-400">
                  <Star className="h-5 w-5" />
                  <h3 className="text-sm font-semibold text-foreground">En Verimli Ay</h3>
                </div>
                <p className="mt-3 text-2xl font-bold text-foreground">
                  {analysis.bestMonth?.monthName}
                </p>
                <p className="mt-2 text-sm text-muted-light">
                  ₺ {formatTl0(analysis.bestMonth?.monthlyProfit ?? 0)} tasarruf
                </p>
                <p className="mt-1 text-xs text-muted">
                  Üretim:{' '}
                  <span className="font-semibold text-foreground">
                    {analysis.bestMonth?.monthlyProduction?.toFixed(0)} kWh
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  Öz-tüketim:{' '}
                  <span className="font-semibold text-success">
                    %{formatPct1(analysis.bestMonth?.selfConsumptionRate ?? 0)}
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/40 bg-card p-5">
                <div className="flex items-center gap-2 text-amber-400">
                  <TrendingDown className="h-5 w-5" />
                  <h3 className="text-sm font-semibold text-foreground">En Düşük Verim Ayı</h3>
                </div>
                <p className="mt-3 text-2xl font-bold text-foreground">
                  {analysis.worstMonth?.monthName}
                </p>
                <p className="mt-2 text-sm text-muted-light">
                  ₺ {formatTl0(analysis.worstMonth?.monthlyProfit ?? 0)} tasarruf
                </p>
                <p className="mt-1 text-xs text-muted">
                  Üretim:{' '}
                  <span className="font-semibold text-foreground">
                    {analysis.worstMonth?.monthlyProduction?.toFixed(0)} kWh
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  Öz-tüketim:{' '}
                  <span className="font-semibold text-amber-200">
                    %{formatPct1(analysis.worstMonth?.selfConsumptionRate ?? 0)}
                  </span>
                </p>
                {(() => {
                  const hint = worstMonthHint(analysis.worstMonth?.month);
                  return hint ? (
                    <p className="mt-4 text-[11px] leading-relaxed text-muted">{hint}</p>
                  ) : null;
                })()}
              </div>
            </motion.div>

            <motion.section variants={barItem} className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-base font-semibold text-foreground">
                Aylık Performans Karşılaştırması
              </h2>
              <div className="chart-panel mt-4">
                <div className="chart-h-md w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartRows} margin={{ top: 24, right: 12, left: 8, bottom: 8 }}>
                    <CartesianGrid stroke="#1F2937" strokeDasharray="4 8" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#6B7280', fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#1F2937' }}
                    />
                    <YAxis
                      yAxisId="tl"
                      orientation="left"
                      tick={{ fill: '#6B7280', fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#1F2937' }}
                      tickFormatter={(v) => formatTl0(v)}
                      label={{
                        value: 'Tasarruf (₺)',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#9CA3AF',
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      yAxisId="kwh"
                      orientation="left"
                      hide
                      domain={['auto', 'auto']}
                    />
                    <YAxis
                      yAxisId="pct"
                      orientation="right"
                      domain={[0, 100]}
                      tick={{ fill: '#6B7280', fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#1F2937' }}
                      tickFormatter={(v) => `${v}%`}
                      label={{
                        value: 'Öz-tüketim (%)',
                        angle: 90,
                        position: 'insideRight',
                        fill: '#9CA3AF',
                        fontSize: 11,
                      }}
                    />
                    <Tooltip content={<PerformanceTooltip />} />
                    <Bar yAxisId="tl" dataKey="monthlyProfit" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {chartRows.map((entry) => (
                        <Cell
                          key={entry.month}
                          fill={
                            entry.bestMonth
                              ? '#34D399'
                              : entry.worstMonth
                                ? '#FBBF24'
                                : '#10B981'
                          }
                        />
                      ))}
                      <LabelList
                        dataKey="monthlyProfit"
                        content={(props) => {
                          const { x, y, width, index, value } = props;
                          if (!chartRows[index]?.bestMonth) return null;
                          const cx = Number(x) + Number(width) / 2;
                          const cy = Number(y) - 8;
                          return (
                            <g transform={`translate(${cx},${cy})`}>
                              <foreignObject x={-8} y={-8} width={16} height={16}>
                                <div className="flex justify-center text-amber-400">
                                  <Star className="h-4 w-4 fill-amber-400" />
                                </div>
                              </foreignObject>
                            </g>
                          );
                        }}
                      />
                    </Bar>
                    <Line
                      yAxisId="pct"
                      type="monotone"
                      dataKey="selfConsumptionRate"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }}
                      name="Öz-tüketim"
                    >
                      <LabelList
                        dataKey="selfConsumptionRate"
                        position="top"
                        formatter={(v) => `%${formatPct1(Number(v))}`}
                        fill="#93C5FD"
                        fontSize={10}
                      />
                    </Line>
                    <Line
                      yAxisId="kwh"
                      type="monotone"
                      dataKey="monthlyProduction"
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="6 6"
                      dot={false}
                      name="Üretim"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                </div>
              </div>
              <p className="mt-4 flex flex-wrap gap-4 text-[10px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-success" />
                  Tasarruf (sütun)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 bg-primary" />
                  Öz-tüketim %
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block h-0 w-4 border-b-2 border-dashed border-success"
                    aria-hidden
                  />
                  Üretim (kWh)
                </span>
              </p>
            </motion.section>

            <motion.section variants={barItem} className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-base font-semibold text-foreground">Kümülatif Tasarruf Birikimi</h2>
              <div className="chart-panel mt-4">
                <div className="chart-h-sm w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartRows}
                    margin={{ top: 28, right: 12, left: 8, bottom: 8 }}
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    <defs>
                      <linearGradient id="cumGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1F2937" strokeDasharray="4 8" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#6B7280', fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#1F2937' }}
                    />
                    <YAxis
                      tick={{ fill: '#6B7280', fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#1F2937' }}
                      tickFormatter={(v) => formatTl0(v)}
                    />
                    <Tooltip content={<CumulativeTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="cumulativeSavings"
                      stroke="#10B981"
                      strokeWidth={2}
                      fill="url(#cumGreen)"
                      name="Kümülatif"
                      isAnimationActive
                      animationBegin={0}
                      animationDuration={1500}
                      dot={(dotProps) => {
                        const { cx, cy, index } = dotProps;
                        if (cx == null || cy == null) return null;
                        const isLast = index === chartRows.length - 1;
                        if (!isLast) {
                          return <circle cx={cx} cy={cy} r={0} fill="transparent" />;
                        }
                        return (
                          <motion.g
                            transform={`translate(${cx},${cy})`}
                            initial={false}
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                          >
                            <circle r={10} fill="#10B981" stroke="#0A0F1E" strokeWidth={2} />
                          </motion.g>
                        );
                      }}
                    >
                      <LabelList
                        dataKey="cumulativeSavings"
                        position="top"
                        formatter={(v) => `₺${formatTl0(v)}`}
                        fill="#9CA3AF"
                        fontSize={10}
                      />
                    </Area>
                  </AreaChart>
                </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                <motion.div
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                  className="inline-flex items-center gap-2 rounded-full border border-success/40 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-success shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                >
                  <span className="h-3 w-3 rounded-full bg-success" />
                  Toplam: ₺ {formatTl0(analysis.totalSavings)}
                </motion.div>
              </div>
            </motion.section>

            <motion.section variants={barItem} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold text-foreground">Aylık Detay Raporu</h2>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 self-start rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-light opacity-70"
                  disabled
                >
                  <Download className="h-4 w-4" />
                  Raporu İndir
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted">
                      <th className="py-2 pr-2">Ay</th>
                      <th className="py-2 pr-2 text-right">Üretim (kWh)</th>
                      <th className="py-2 pr-2 text-right">Tasarruf (₺)</th>
                      <th className="py-2 pr-2 text-right">Öz-tüketim</th>
                      <th className="py-2 pr-2 text-right">CO₂ (kg)</th>
                      <th className="py-2 text-right">Kümülatif (₺)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.monthlyResults.map((row) => (
                      <tr
                        key={row.month}
                        className={[
                          'border-b border-border/80 transition hover:bg-border/30',
                          row.bestMonth ? 'bg-emerald-500/10' : '',
                          row.worstMonth ? 'bg-amber-500/10' : '',
                          !row.bestMonth && !row.worstMonth ? 'bg-card' : '',
                        ].join(' ')}
                      >
                        <td className="py-2.5 pr-2 font-medium text-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            {row.bestMonth ? (
                              <Star className="h-3.5 w-3.5 text-amber-400" strokeWidth={2} />
                            ) : null}
                            {row.worstMonth ? (
                              <TrendingDown className="h-3.5 w-3.5 text-amber-400" strokeWidth={2} />
                            ) : null}
                            {row.monthName}
                          </span>
                        </td>
                        <td className="py-2.5 pr-2 text-right font-mono tabular-nums text-gray-200">
                          {row.monthlyProduction.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2.5 pr-2 text-right font-mono tabular-nums text-success">
                          {formatTl0(row.monthlyProfit)}
                        </td>
                        <td className="py-2.5 pr-2 text-right font-mono tabular-nums text-primary">
                          %{formatPct1(row.selfConsumptionRate)}
                        </td>
                        <td className="py-2.5 pr-2 text-right font-mono tabular-nums text-gray-200">
                          {row.monthlyCO2Saved.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold tabular-nums text-foreground">
                          {formatTl0(row.cumulativeSavings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {totalsRow ? (
                    <tfoot>
                      <tr className="border-t-2 border-border bg-surface-alt font-bold">
                        <td className="py-3 pr-2 text-foreground">TOPLAM</td>
                        <td className="py-3 pr-2 text-right font-mono tabular-nums text-foreground">
                          {totalsRow.sumProd.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2.5 pr-2 text-right font-mono tabular-nums text-success">
                          {formatTl0(totalsRow.sumProfit)}
                        </td>
                        <td className="py-3 pr-2 text-right font-mono tabular-nums text-primary">
                          %{formatPct1(totalsRow.avgPct)} ort.
                        </td>
                        <td className="py-3 pr-2 text-right font-mono tabular-nums text-foreground">
                          {totalsRow.sumCo2.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-3 text-right font-mono tabular-nums text-foreground">
                          {formatTl0(totalsRow.lastCum)}
                        </td>
                      </tr>
                    </tfoot>
                  ) : null}
                </table>
              </div>
            </motion.section>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, iconClass, title, value, sub }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <Icon className={`h-5 w-5 ${iconClass}`} strokeWidth={2} />
      </div>
      <p className="mt-3 text-[11px] font-medium text-muted-light">{title}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-2 text-[11px] text-muted">{sub}</p>
    </div>
  );
}
