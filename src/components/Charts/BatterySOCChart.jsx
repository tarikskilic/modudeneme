import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function BatterySOCChart({ hourlyData = [] }) {
  const data = hourlyData.map((row) => ({
    hour: `${String(row.hour).padStart(2, '0')}:00`,
    soc: Number(row.batterySoC.toFixed(1)),
  }));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
          <XAxis
            dataKey="hour"
            tick={{ fill: '#6B7280', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#1F2937' }}
            interval={2}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#6B7280', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#1F2937' }}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              border: '1px solid #1F2937',
              borderRadius: 8,
              color: '#F9FAFB',
            }}
            formatter={(v) => [`${v}%`, 'Batarya SoC']}
          />
          <Line
            type="monotone"
            dataKey="soc"
            stroke="#F59E0B"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
