import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CartesianGrid,
  ComposedChart,
  Area,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs shadow-xl shadow-black/40">
      <div className="mb-2 border-b border-border pb-1.5 font-semibold text-foreground">{label}</div>
      <div className="space-y-1.5">
        {payload.map((p) => {
          const isSoc = p.dataKey === 'soc';
          const unit = isSoc ? '%' : ' kW';
          const v = typeof p.value === 'number' ? p.value : 0;
          return (
            <div
              key={String(p.dataKey)}
              className="flex items-center justify-between gap-8 text-[11px]"
            >
              <span className="text-muted">{p.name}</span>
              <span className="font-semibold tabular-nums text-foreground">
                {v.toFixed(1)}
                {unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartLegend({ payload }) {
  if (!payload?.length) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-2 pt-4">
      {payload.map((item) => {
        const dashed = item.dataKey === 'soc' || item.value === 'Batarya SoC';
        return (
          <div key={item.value} className="flex items-center gap-2 text-[11px] font-medium text-muted">
            {dashed ? (
              <svg width={28} height={8} className="shrink-0 overflow-visible">
                <line
                  x1={0}
                  y1={4}
                  x2={28}
                  y2={4}
                  stroke={item.color}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </svg>
            ) : (
              <span className="h-0.5 w-7 rounded-full" style={{ background: item.color }} />
            )}
            <span>{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DailyEnergyChart({ hourlyData }) {
  const data = useMemo(
    () =>
      hourlyData.map((r) => ({
        hourLabel: `${String(r.hour).padStart(2, '0')}:00`,
        hour: r.hour,
        prod: r.production,
        cons: r.consumption,
        soc: Number(r.batterySoC.toFixed(1)),
      })),
    [hourlyData]
  );

  return (
    <motion.div
      layout
      className="rounded-[12px] border border-border bg-card p-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">24 Saatlik Enerji Akışı</h3>
        <p className="mt-1 text-xs text-muted">
          Üretim ve tüketim (kW), batarya SoC (%) — saatlik enerji ≈ ortalama güç
        </p>
      </div>

      <div className="chart-panel">
        <div className="chart-h-md w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 12, right: 14, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="gradProd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradCons" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#1F2937" strokeDasharray="4 6" />

            <XAxis
              dataKey="hourLabel"
              tick={{ fill: '#6B7280', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#1F2937' }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#6B7280', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#1F2937' }}
              label={{
                value: 'kW',
                fill: '#9CA3AF',
                fontSize: 11,
                dx: -4,
                angle: -90,
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fill: '#6B7280', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#1F2937' }}
              label={{
                value: 'SoC %',
                fill: '#9CA3AF',
                fontSize: 11,
                dx: 6,
                angle: 90,
              }}
            />

            <Area
              yAxisId="left"
              type="monotone"
              dataKey="prod"
              name="Üretim"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#gradProd)"
              isAnimationActive
              animationDuration={400}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="cons"
              name="Tüketim"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#gradCons)"
              isAnimationActive
              animationDuration={400}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="soc"
              name="Batarya SoC"
              stroke="#F59E0B"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="5 5"
              isAnimationActive
              animationDuration={400}
            />

            <Tooltip
              content={<DarkTooltip />}
              cursor={{ stroke: 'rgba(59,130,246,0.25)', strokeWidth: 1 }}
            />
            <Legend content={(props) => <ChartLegend {...props} />} />
          </ComposedChart>
        </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
