import { useMemo } from 'react';
import { motion } from 'framer-motion';

const TR_KWH = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
const TR_PCT = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });

/**
 * Tam halka donut + sade legend. Referans dashboard.jsx birebir uyarlaması.
 *
 * @param {object} props
 * @param {Array<{label: string, value: number, color: string}>} props.segments
 * @param {number} props.centerPct           — merkez büyük %
 * @param {string} [props.centerLabel='Öz-Tüketim']
 * @param {number} [props.size=210]
 * @param {number} [props.thickness=26]
 */
export default function DonutChart({
  segments,
  centerPct,
  centerLabel = 'Öz-Tüketim',
  size = 210,
  thickness = 26,
}) {
  const { paths, viewBox } = useMemo(() => {
    const r = (size - thickness) / 2;
    const cx = size / 2;
    const cy = size / 2;
    const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 1;
    let acc = 0;
    const out = segments.map((seg, i) => {
      const start = acc / total;
      acc += seg.value || 0;
      const end = acc / total;
      const pad = 0.004;
      const a0 = (start + pad) * Math.PI * 2 - Math.PI / 2;
      const a1 = (end - pad) * Math.PI * 2 - Math.PI / 2;
      if (a1 <= a0) return null;
      const x0 = cx + r * Math.cos(a0);
      const y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const large = end - start > 0.5 ? 1 : 0;
      return {
        key: `${i}-${seg.color}`,
        d: `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`,
        color: seg.color,
      };
    });
    return { paths: out.filter(Boolean), viewBox: `0 0 ${size} ${size}` };
  }, [segments, size, thickness]);

  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center">
      <div className="relative grid place-items-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={viewBox} aria-hidden>
          {/* track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(148,163,184,0.08)"
            strokeWidth={thickness}
          />
          {paths.map((p) => (
            <motion.path
              key={p.key}
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${p.color}88)` }}
              initial={{ pathLength: 0, opacity: 0.4 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}
        </svg>
        <div className="absolute text-center">
          <div className="text-[38px] font-bold leading-none tracking-tight tabular-nums text-success">
            {TR_PCT.format(centerPct)}%
          </div>
          <div className="mt-1 text-[10.5px] uppercase tracking-[0.18em] text-muted">
            {centerLabel}
          </div>
        </div>
      </div>

      <div className="mt-4 flex w-full flex-col gap-2" role="list">
        {segments.map((seg) => (
          <DonutLegendRow
            key={seg.label}
            color={seg.color}
            label={seg.label}
            value={`${TR_KWH.format(seg.value || 0)} kWh`}
          />
        ))}
      </div>
    </div>
  );
}

function DonutLegendRow({ color, label, value }) {
  return (
    <div
      role="listitem"
      className="flex items-center gap-2.5 rounded-lg border border-border bg-background/50 px-3 py-2 text-[12px] text-muted"
    >
      <span
        aria-hidden
        className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
        style={{ background: color, boxShadow: `0 0 6px ${color}99` }}
      />
      <span className="flex-1 truncate text-foreground/90">{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}
