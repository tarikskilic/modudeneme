import { useEffect, useRef, useState } from 'react';
import { animate, motion } from 'framer-motion';

/**
 * @param {object} props
 * @param {string} props.label
 * @param {number} props.numericValue
 * @param {string} props.formattedValue — Gösterim (count-up bittiğinde)
 * @param {string} [props.suffix] — örn. " kg"
 * @param {string} props.subtext
 * @param {React.ReactNode} props.secondary
 * @param {import('lucide-react').LucideIcon} [props.icon]
 * @param {React.ReactNode} [props.iconOverlay]
 * @param {number} [props.decimals]
 * @param {number} [props.staggerIndex]
 */
export default function HeroImpactCard({
  label,
  numericValue,
  formattedValue,
  suffix = '',
  subtext,
  secondary,
  icon: Icon,
  iconOverlay,
  decimals = 0,
  staggerIndex = 0,
}) {
  const [display, setDisplay] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    const c = animate(0, numericValue, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
      onComplete: () => {
        doneRef.current = true;
      },
    });
    return () => c.stop();
  }, [numericValue]);

  const animatedText = doneRef.current
    ? formattedValue
    : display.toLocaleString('tr-TR', {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      });

  const particles = [
    { top: '12%', left: '8%', size: 3, delay: 0 },
    { top: '68%', left: '82%', size: 4, delay: 0.4 },
    { top: '28%', left: '72%', size: 2, delay: 0.8 },
    { top: '78%', left: '18%', size: 3, delay: 1.2 },
    { top: '45%', left: '92%', size: 2, delay: 0.2 },
    { top: '8%', left: '55%', size: 2, delay: 1 },
  ];

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: staggerIndex * 0.1,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative overflow-hidden rounded-2xl border border-success/35 bg-card p-6 shadow-[0_0_48px_rgba(16,185,129,0.18)]"
    >
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-success/8 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-success/6 blur-2xl"
        aria-hidden
      />

      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute rounded-full bg-success/25"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            boxShadow: '0 0 12px rgba(16,185,129,0.35)',
          }}
          animate={{ opacity: [0.2, 0.55, 0.2], y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
          aria-hidden
        />
      ))}

      <p className="text-xs font-semibold uppercase tracking-wider text-success/90">{label}</p>

      <div className="relative mt-4 inline-flex h-14 w-14 items-center justify-center">
        {iconOverlay ?? (
          <Icon className="h-14 w-14 text-success" strokeWidth={1.25} aria-hidden />
        )}
      </div>

      <p className="mt-5 text-4xl font-bold tabular-nums tracking-tight text-success sm:text-5xl lg:text-[3.25rem]">
        {animatedText}
        {suffix ? (
          <span className="ml-1 text-2xl font-semibold text-success/80 sm:text-3xl">{suffix}</span>
        ) : null}
      </p>

      <p className="mt-2 text-sm font-medium text-emerald-100">{subtext}</p>
      <p className="mt-5 text-xs text-muted">{secondary}</p>
    </motion.article>
  );
}
