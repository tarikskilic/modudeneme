import { useEffect, useRef, useState } from 'react';
import { animate, motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

const iconColor = {
  success: '#10B981',
  primary: '#3B82F6',
  warning: '#F59E0B',
};

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.value — Biçimlendirilmiş gösterim (numericValue yoksa doğrudan kullanılır)
 * @param {string} props.unit
 * @param {string} props.subtitle
 * @param {import('lucide-react').LucideIcon} props.icon
 * @param {'success' | 'primary' | 'warning'} props.color
 * @param {string} [props.trend] — Sağ üst rozet; örn. geçen aya göre değişim
 * @param {number} [props.numericValue] — Verilirse sayı count-up ile güncellenir
 * @param {number} [props.decimals]
 * @param {number} [props.staggerIndex] — Açılış gecikmesi (sıra)
 * @param {number} [props.gaugePercent] — 0–100; verilirse sağ üstte mini halka gösterilir
 */
export default function KPICard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  color = 'primary',
  trend,
  numericValue,
  decimals = 0,
  staggerIndex = 0,
  gaugePercent,
}) {
  const ic = iconColor[color] ?? iconColor.primary;
  const [display, setDisplay] = useState(() => (numericValue != null ? 0 : null));
  const lastNumericRef = useRef(0);

  useEffect(() => {
    if (numericValue == null || !Number.isFinite(numericValue)) {
      setDisplay(null);
      lastNumericRef.current = 0;
      return undefined;
    }
    const from = lastNumericRef.current;
    const c = animate(from, numericValue, {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
      onComplete: () => {
        lastNumericRef.current = numericValue;
      },
    });
    return () => c.stop();
  }, [numericValue]);

  const mainText =
    numericValue != null && display != null && Number.isFinite(numericValue)
      ? display.toLocaleString('tr-TR', {
          maximumFractionDigits: decimals,
          minimumFractionDigits: decimals,
        })
      : value;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: staggerIndex * 0.08,
        duration: 0.42,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="flex flex-col rounded-[12px] border border-primary/[0.22] bg-card p-5 transition-colors hover:border-primary"
    >
      <div className="flex items-start justify-between gap-3">
        <Icon className="h-6 w-6 shrink-0" strokeWidth={2} style={{ color: ic }} aria-hidden />
        {gaugePercent != null && Number.isFinite(gaugePercent) ? (
          <MiniGauge percent={gaugePercent} color={ic} />
        ) : null}
        {trend ? (
          <span className="inline-flex max-w-[55%] items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold leading-tight text-success sm:text-[11px]">
            <TrendingUp className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{trend}</span>
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>

      <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
        <motion.span
          key={`${title}-${mainText}`}
          className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl"
          initial={{ opacity: 0.4, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          {mainText}
        </motion.span>
        {unit ? <span className="text-sm font-semibold text-muted">{unit}</span> : null}
      </div>

      <p className="mt-3 text-[11px] leading-snug text-muted">{subtitle}</p>
    </motion.article>
  );
}

function MiniGauge({ percent, color }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = c - (clamped / 100) * c;

  return (
    <div
      className="relative h-11 w-11 shrink-0"
      role="img"
      aria-label={`Gösterge: %${clamped.toFixed(0)}`}
    >
      <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44" aria-hidden>
        <circle cx="22" cy="22" r={r} fill="none" stroke="#1F2937" strokeWidth="4" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.45s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums text-foreground">
        {clamped.toFixed(0)}
      </span>
    </div>
  );
}
