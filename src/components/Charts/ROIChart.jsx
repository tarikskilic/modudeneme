import { useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildTenYearRoiProjection } from '../../utils/roiProjection.js';

function formatAxis(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return String(Math.round(v));
}

function formatFullTl(n) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(n));
}

function ChartTooltip({ active, payload, investment, investmentFitsScale }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <div className="mb-1.5 border-b border-border pb-1.5 font-semibold text-foreground">{row.label}</div>
      <div className="space-y-1 text-[11px] text-muted">
        <div className="flex justify-between gap-6">
          <span>MODÜ-GRID</span>
          <span className="font-mono font-semibold text-success">{formatFullTl(row.modu)} ₺</span>
        </div>
        <div className="flex justify-between gap-6">
          <span>Geleneksel</span>
          <span className="font-mono font-semibold text-muted-light">{formatFullTl(row.traditional)} ₺</span>
        </div>
        {row.gap > 0 ? (
          <div className="flex justify-between gap-6 border-t border-border pt-1">
            <span>Avantaj</span>
            <span className="font-mono font-semibold text-success">{formatFullTl(row.gap)} ₺</span>
          </div>
        ) : null}
        {investment > 0 && !investmentFitsScale ? (
          <div className="border-t border-border pt-1 text-red-300">
            Yatırım: {formatFullTl(investment)} ₺ (grafik ölçeği dışında)
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {number} props.yearlyProfit MODÜ-GRID yıllık net kâr (₺)
 * @param {number} props.investment Toplam yatırım maliyeti (₺)
 */
export default function ROIChart({ yearlyProfit, investment }) {
  const projection = useMemo(
    () => buildTenYearRoiProjection(yearlyProfit, investment),
    [yearlyProfit, investment]
  );

  const {
    rows: data,
    crossoverYear,
    showCrossoverMarker,
    investmentFitsScale,
    maxY,
  } = projection;

  const year10 = data[9];
  const diff =
    year10 && typeof year10.modu === 'number' && typeof year10.traditional === 'number'
      ? year10.modu - year10.traditional
      : 0;

  const crossoverBeyondWindow =
    typeof crossoverYear === 'number' &&
    Number.isFinite(crossoverYear) &&
    crossoverYear > 10 &&
    yearlyProfit > 0 &&
    investment > 0;

  const investmentAboveCurves =
    investment > 0 && year10 && investment > (year10.modu ?? 0);

  return (
    <div className="rounded-[12px] border border-border bg-card p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Yatırım Geri Dönüş Analizi</h3>
          <p className="mt-1 text-xs text-muted">
            10 yıl kümülatif tasarruf — parametre değişimine göre anlık güncellenir
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-[11px]">
          <span className="flex items-center gap-2 text-muted">
            <span className="h-0.5 w-5 rounded bg-success" />
            MODÜ-GRID
          </span>
          <span className="flex items-center gap-2 text-muted">
            <span className="h-0.5 w-5 rounded border-t-2 border-dashed border-muted-light" />
            Geleneksel
          </span>
          {investmentFitsScale ? (
            <span className="flex items-center gap-2 text-muted">
              <span className="h-0.5 w-5 rounded border-t-2 border-dashed border-red-300" />
              Yatırım eşiği
            </span>
          ) : null}
          {showCrossoverMarker ? (
            <span className="flex items-center gap-2 text-muted">
              <span className="h-2 w-2 rounded-full bg-warning" />
              Amortisman
            </span>
          ) : null}
        </div>
      </div>

      {!investmentFitsScale && investment > 0 ? (
        <p className="mb-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          Yatırım: <span className="font-semibold tabular-nums">{formatFullTl(investment)} ₺</span>
          {' — '}
          10 yıllık birikim bu tutarın altında; yatırım çizgisi okunabilirlik için ayrı gösterilir.
        </p>
      ) : null}

      <div className="chart-panel">
        <div className="chart-h-md w-full md:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 18, left: 4, bottom: 8 }}>
            <defs>
              <linearGradient id="roiAdvantageFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.42} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.04} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#1F2937" strokeDasharray="4 6" />

            <XAxis
              dataKey="year"
              type="number"
              domain={[1, 10]}
              ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
              tickFormatter={(y) => `Yıl ${y}`}
              tick={{ fill: '#6B7280', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#1F2937' }}
            />
            <YAxis
              domain={[0, maxY]}
              tick={{ fill: '#6B7280', fontSize: 11 }}
              tickFormatter={formatAxis}
              tickLine={false}
              axisLine={{ stroke: '#1F2937' }}
              label={{
                value: 'Kümülatif Tasarruf (₺)',
                angle: -90,
                position: 'insideLeft',
                fill: '#9CA3AF',
                fontSize: 11,
                dy: 48,
              }}
            />

            <Tooltip
              content={
                <ChartTooltip
                  investment={investment}
                  investmentFitsScale={investmentFitsScale}
                />
              }
              cursor={{ stroke: 'rgba(59,130,246,0.2)', strokeWidth: 1 }}
              labelFormatter={(_, p) => (p?.[0]?.payload?.label ? p[0].payload.label : '')}
            />

            <Area
              type="monotone"
              dataKey="traditional"
              stackId="advantage"
              stroke="none"
              fill="transparent"
              isAnimationActive
              animationDuration={520}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="gap"
              stackId="advantage"
              stroke="none"
              fill="url(#roiAdvantageFill)"
              isAnimationActive
              animationDuration={520}
              animationEasing="ease-out"
            />

            <Line
              type="monotone"
              dataKey="modu"
              name="MODÜ-GRID"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive
              animationDuration={520}
              animationEasing="ease-out"
            />

            <Line
              type="monotone"
              dataKey="traditional"
              name="Geleneksel"
              stroke="#6B7280"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive
              animationDuration={520}
              animationEasing="ease-out"
            />

            {investmentFitsScale ? (
              <ReferenceLine
                y={investment}
                stroke="rgba(239, 68, 68, 0.55)"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                label={{
                  value: `Yatırım: ${formatFullTl(investment)} ₺`,
                  position: 'insideTopRight',
                  fill: '#FCA5A5',
                  fontSize: 10,
                }}
              />
            ) : null}

            {showCrossoverMarker ? (
              <>
                <ReferenceLine
                  x={crossoverYear}
                  stroke="#F59E0B"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  label={{
                    value: `Amortisman — Yıl ${crossoverYear.toFixed(1)}`,
                    position: 'top',
                    fill: '#FBBF24',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
                <ReferenceDot
                  x={crossoverYear}
                  y={investment}
                  r={8}
                  fill="#F59E0B"
                  stroke="#0A0F1E"
                  strokeWidth={2}
                />
              </>
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        <span className="font-semibold text-foreground">Yıl 10 (kümülatif):</span>{' '}
        MODÜ-GRID{' '}
        <span className="font-bold text-success">{formatFullTl(year10?.modu ?? 0)} ₺</span>
        <span className="mx-1.5 text-border-strong">·</span>
        Geleneksel{' '}
        <span className="font-semibold text-muted-light">{formatFullTl(year10?.traditional ?? 0)} ₺</span>
        <span className="mx-1.5 text-border-strong">·</span>
        <span className="font-bold text-success">Avantaj: {formatFullTl(diff)} ₺</span>
      </p>

      {crossoverBeyondWindow ? (
        <p className="mt-2 text-xs text-warning">
          Amortisman tahmini:{' '}
          <span className="font-semibold tabular-nums">{crossoverYear.toFixed(1)} yıl</span>
          {' '}
          (10 yıllık grafik penceresinin dışında).
        </p>
      ) : null}

      {investmentAboveCurves && !crossoverBeyondWindow && investment > 0 ? (
        <p className="mt-2 text-xs text-muted-light">
          10 yıllık kümülatif tasarruf, yatırım maliyetinin (
          {formatFullTl(investment)} ₺) altında kalıyor.
        </p>
      ) : null}
    </div>
  );
}
