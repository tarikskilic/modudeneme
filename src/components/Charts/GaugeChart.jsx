import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

/**
 * Yarım daire gauge: günlük direkt, batarya çekişi ve şebeke satışı (kWh) oranları.
 * Orta metin: öz-tüketim oranı (%).
 */
export default function GaugeChart({
  directKwh,
  batteryKwh,
  exportKwh,
  selfConsumptionRate,
}) {
  const data = useMemo(() => {
    const sum = directKwh + batteryKwh + exportKwh;
    if (sum <= 0) {
      return [
        { name: 'Direkt', value: 1, color: 'rgba(16,185,129,0.22)' },
        { name: 'Batarya', value: 1, color: 'rgba(59,130,246,0.22)' },
        { name: 'Satış', value: 1, color: 'rgba(245,158,11,0.22)' },
      ];
    }
    return [
      { name: 'Direkt', value: directKwh, color: '#10B981' },
      { name: 'Batarya', value: batteryKwh, color: '#3B82F6' },
      { name: 'Satış', value: exportKwh, color: '#F59E0B' },
    ];
  }, [directKwh, batteryKwh, exportKwh]);

  const rateText = `${Number(selfConsumptionRate ?? 0).toFixed(0)}%`;

  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="84%"
              innerRadius="58%"
              outerRadius="92%"
              startAngle={180}
              endAngle={0}
              stroke="rgba(10,15,30,0.95)"
              strokeWidth={2}
              paddingAngle={2}
              animationDuration={420}
              isAnimationActive
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-2">
        <motion.div
          key={rateText}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          className="text-4xl font-bold tabular-nums text-foreground"
        >
          {rateText}
        </motion.div>
        <p className="mt-1 text-xs font-medium text-muted">Öz-Tüketim Oranı</p>
      </div>
    </div>
  );
}
