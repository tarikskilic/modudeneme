import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Info } from 'lucide-react';
import {
  getCarbonMetrics,
  getFinancialMetrics,
  getHourlyData,
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

const FULL_NAMES = [
  '',
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

function barGradientId(month) {
  if (month >= 5 && month <= 9) return 'url(#co2BarSummer)';
  if (month <= 2 || month === 11 || month === 12) return 'url(#co2BarWinter)';
  return 'url(#co2BarMid)';
}

function co2ForMonth(panelCapacity, apartmentCount, batteryCapacity, month) {
  const hourly = getHourlyData(panelCapacity, apartmentCount, batteryCapacity, month);
  const financial = getFinancialMetrics(
    hourly,
    batteryCapacity,
    apartmentCount,
    panelCapacity
  );
  return getCarbonMetrics(financial.solarUsedKwh).monthlyCO2Saved;
}

function CarbonTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <div className="font-semibold text-foreground">
        {FULL_NAMES[p.month]}:{' '}
        {p.co2.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
        CO₂ tasarruf
      </div>
    </div>
  );
}

export default function CarbonChart({
  panelCapacity,
  apartmentCount,
  batteryCapacity,
  selectedMonth,
}) {
  const data = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const co2 = co2ForMonth(panelCapacity, apartmentCount, batteryCapacity, month);
      return {
        month,
        label: MONTH_SHORT[i],
        co2,
        fill: barGradientId(month),
        selected: month === selectedMonth,
      };
    });
  }, [panelCapacity, apartmentCount, batteryCapacity, selectedMonth]);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Aylık CO₂ Tasarrufu Trendi</h2>
        <p className="mt-1 text-xs text-muted">Aylık simülasyon (12 ay)</p>
      </div>

      <div className="chart-panel">
        <div className="chart-h-sm w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <defs>
              <linearGradient id="co2BarSummer" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
              <linearGradient id="co2BarWinter" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0D9488" />
                <stop offset="100%" stopColor="#065F46" />
              </linearGradient>
              <linearGradient id="co2BarMid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
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
              label={{
                value: 'CO₂ Tasarrufu (kg)',
                angle: -90,
                position: 'insideLeft',
                fill: '#9CA3AF',
                fontSize: 11,
              }}
            />
            <Tooltip content={<CarbonTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.06)' }} />
            <Bar dataKey="co2" radius={[6, 6, 0, 0]} maxBarSize={28}>
              {data.map((entry) => (
                <Cell
                  key={entry.month}
                  fill={entry.fill}
                  fillOpacity={entry.selected ? 1 : 0.92}
                  stroke={entry.selected ? '#F59E0B' : 'transparent'}
                  strokeWidth={entry.selected ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
        Yaz aylarında güneşlenme artışıyla tasarruf zirveye ulaşır
      </p>
    </div>
  );
}
