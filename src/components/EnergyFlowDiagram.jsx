import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Battery, Building2, Sun, Zap } from 'lucide-react';

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

function relRect(el, container) {
  if (!el || !container) return { left: 0, top: 0, width: 0, height: 0 };
  const cr = container.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return { left: r.left - cr.left, top: r.top - cr.top, width: r.width, height: r.height };
}

function anchor(rect, side) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  if (side === 'right') return { x: rect.left + rect.width, y: cy };
  if (side === 'left') return { x: rect.left, y: cy };
  if (side === 'top') return { x: cx, y: rect.top };
  if (side === 'bottom') return { x: cx, y: rect.top + rect.height };
  return { x: cx, y: cy };
}

function curvePath(a, b) {
  const dx = b.x - a.x;
  const c1 = { x: a.x + dx * 0.42, y: a.y };
  const c2 = { x: b.x - dx * 0.42, y: b.y };
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`;
}

function strokeForFlow(flow, maxF) {
  if (maxF <= 0) return 2;
  return clamp(1.5 + (flow / maxF) * 6, 1.5, 7);
}

function durationForFlow(flow, maxF) {
  if (maxF <= 0) return 2;
  return clamp(2.4 - (flow / maxF) * 1.5, 0.45, 2.4);
}

function maxFlowOfRow(row) {
  if (!row) return 1;
  return Math.max(
    row.directUse,
    row.batteryChargeKwh ?? 0,
    row.batteryUse,
    row.gridExport,
    row.gridImport,
    1e-9
  );
}

function FlowParticles({ pathD, color, duration, count = 4 }) {
  if (!pathD) return null;
  const dur = parseFloat(duration) || 1.5;
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} r={3.5} fill={color} opacity={0.95} filter="url(#particleGlow)">
          <animateMotion
            dur={`${dur}s`}
            repeatCount="indefinite"
            path={pathD}
            begin={`${(i / count) * dur}s`}
          />
        </circle>
      ))}
    </>
  );
}

function BatteryVisual({ soc, status }) {
  const fillPct = clamp(soc, 0, 100);
  const glow =
    status.charging
      ? 'shadow-[0_0_28px_rgba(16,185,129,0.45)]'
      : status.discharging
        ? 'shadow-[0_0_28px_rgba(59,130,246,0.4)]'
        : 'shadow-none';

  const fillColor = status.charging
    ? 'from-success to-emerald-300'
    : status.discharging
      ? 'from-blue-700 to-blue-400'
      : 'from-border-strong to-muted';

  return (
    <div
      className={`relative mx-auto h-[88px] w-[52px] rounded-xl border-2 border-border bg-background p-1.5 ${glow}`}
      aria-hidden
    >
      <div className="relative h-full w-full overflow-hidden rounded-lg bg-border">
        <motion.div
          className={`absolute bottom-0 left-0 right-0 rounded-md bg-gradient-to-t ${fillColor}`}
          initial={false}
          animate={{ height: `${fillPct}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        />
        {status.charging ? (
          <motion.div
            className="absolute inset-x-0 top-0 h-1 bg-success/60"
            animate={{ y: ['0%', '85%', '0%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : null}
      </div>
      <div className="absolute -top-1 left-1/2 h-2 w-4 -translate-x-1/2 rounded-sm bg-border" />
    </div>
  );
}

export default function EnergyFlowDiagram({
  hourlyData,
  selectedHour,
  blockCount,
  batteryCapacity,
}) {
  const containerRef = useRef(null);
  const solarRef = useRef(null);
  const batteryRef = useRef(null);
  const gridRef = useRef(null);
  const exportRef = useRef(null);
  const blockRefs = useRef([]);

  const [measureTick, setMeasureTick] = useState(0);
  const [layout, setLayout] = useState({ lines: [], labels: [], particles: [] });

  const row = hourlyData[selectedHour];

  const blocks = useMemo(() => {
    const n = clamp(Math.round(blockCount) || 5, 1, 10);
    return Array.from({ length: n }, (_, i) => ({
      id: i,
      label: `Blok ${String.fromCharCode(65 + i)}`,
    }));
  }, [blockCount]);

  const isNight = selectedHour >= 18 || selectedHour < 6;
  const solarIdle = isNight || (row?.production ?? 0) < 0.0001;

  const flows = useMemo(() => {
    if (!row) {
      return { max: 1, p2b: 0, p2bat: 0, bat2b: 0, p2g: 0, g2b: 0 };
    }
    const max = maxFlowOfRow(row);
    return {
      max,
      p2b: row.directUse,
      p2bat: row.batteryChargeKwh ?? 0,
      bat2b: row.batteryUse,
      p2g: row.gridExport,
      g2b: row.gridImport,
    };
  }, [row]);

  const batteryStatus = useMemo(() => {
    if (!row || batteryCapacity <= 0) {
      return { text: 'Pasif', charging: false, discharging: false, idle: true };
    }
    const charging = flows.p2bat > 0.0001;
    const discharging = row.batteryUse > 0.0001;
    const full = row.batterySoC >= 99;
    const empty = row.batterySoC <= 11;
    let text = 'Beklemede';
    if (full) text = 'Dolu';
    else if (empty) text = 'Boş';
    else if (charging) text = 'Şarj Oluyor';
    else if (discharging) text = 'Deşarj';
    return {
      text,
      charging,
      discharging,
      idle: !charging && !discharging,
    };
  }, [row, batteryCapacity, flows.p2bat]);

  const gridActive = (row?.gridImport ?? 0) > 0.0001;
  const exportActive = (row?.gridExport ?? 0) > 0.0001;

  useLayoutEffect(() => {
    blockRefs.current.length = blocks.length;
  }, [blocks.length]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !row) return undefined;

    const solarR = relRect(solarRef.current, container);
    const batR = relRect(batteryRef.current, container);
    const gridR = relRect(gridRef.current, container);
    const exportR = relRect(exportRef.current, container);

    const blockRects = blocks
      .map((_, i) => blockRefs.current[i])
      .filter(Boolean)
      .map((el) => relRect(el, container));

    const blockLefts = blockRects.map((r) => anchor(r, 'left'));
    const blocksCentroid = blockLefts.length
      ? {
          x: blockLefts.reduce((s, p) => s + p.x, 0) / blockLefts.length,
          y: blockLefts.reduce((s, p) => s + p.y, 0) / blockLefts.length,
        }
      : { x: container.clientWidth * 0.68, y: container.clientHeight * 0.42 };

    const aSolarR = anchor(solarR, 'right');
    const aSolarB = anchor(solarR, 'bottom');
    const aBatR = anchor(batR, 'right');
    const aBatT = anchor(batR, 'top');
    const aGridR = anchor(gridR, 'right');
    const aExportL = anchor(exportR, 'left');

    const maxF = flows.max;
    const lines = [];
    const labels = [];
    const particles = [];

    const addLine = ({
      id,
      a,
      b,
      color,
      active,
      flow,
      labelText,
      particleCount,
    }) => {
      const sw = strokeForFlow(flow, maxF);
      const dur = `${durationForFlow(flow, maxF)}s`;
      const d = curvePath(a, b);
      const isActive = active && flow > 0.0001;

      lines.push({
        id,
        d,
        color,
        active: isActive,
        width: sw,
        strokeDash: isActive ? '3 14' : '5 12',
        duration: dur,
        opacity: isActive ? 0.92 : 0.14,
        flowClass: isActive ? 'flow-line-active' : '',
      });

      if (isActive) {
        particles.push({
          id: `${id}-particles`,
          d,
          color,
          duration: dur,
          count: particleCount ?? clamp(Math.round(sw), 3, 6),
        });
        if (labelText) {
          labels.push({
            id: `${id}-label`,
            x: a.x + (b.x - a.x) * 0.5,
            y: a.y + (b.y - a.y) * 0.38,
            text: labelText,
            color,
          });
        }
      }
    };

    addLine({
      id: 'p2b',
      a: aSolarR,
      b: blocksCentroid,
      color: '#10B981',
      active: row.production > 0 && row.directUse > 0,
      flow: flows.p2b,
      labelText: flows.p2b > 0.0001 ? `${flows.p2b.toFixed(1)} kW` : undefined,
      particleCount: 5,
    });

    addLine({
      id: 'p2bat',
      a: aSolarB,
      b: aBatT,
      color: '#10B981',
      active: flows.p2bat > 0,
      flow: flows.p2bat,
      labelText: flows.p2bat > 0.0001 ? `${flows.p2bat.toFixed(1)} kW` : undefined,
      particleCount: 4,
    });

    addLine({
      id: 'bat2b',
      a: aBatR,
      b: blocksCentroid,
      color: '#3B82F6',
      active: row.batteryUse > 0,
      flow: flows.bat2b,
      labelText: flows.bat2b > 0.0001 ? `${flows.bat2b.toFixed(1)} kW` : undefined,
      particleCount: 5,
    });

    addLine({
      id: 'p2export',
      a: aSolarR,
      b: aExportL,
      color: '#F59E0B',
      active: row.gridExport > 0,
      flow: flows.p2g,
      labelText: flows.p2g > 0.0001 ? `${flows.p2g.toFixed(1)} kW` : undefined,
      particleCount: 4,
    });

    addLine({
      id: 'g2b',
      a: aGridR,
      b: blocksCentroid,
      color: '#F59E0B',
      active: row.gridImport > 0,
      flow: flows.g2b,
      labelText: flows.g2b > 0.0001 ? `${flows.g2b.toFixed(1)} kW` : undefined,
      particleCount: 5,
    });

    setLayout({ lines, labels, particles });
  }, [blocks, selectedHour, row, flows, measureTick]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setMeasureTick((t) => t + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const consumption = row?.consumption ?? 0;
  const perBlock = consumption > 0 && blocks.length > 0 ? consumption / blocks.length : 0;

  const sourceIndicatorClass = useMemo(() => {
    if (!row) return 'bg-muted';
    const cons = row.consumption ?? 0;
    if (cons <= 0) return 'bg-muted';
    const directShare = row.directUse / cons;
    const batShare = row.batteryUse / cons;
    const gridShare = row.gridImport / cons;
    const m = Math.max(directShare, batShare, gridShare, 1e-9);
    if (directShare === m) return 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)]';
    if (batShare === m) return 'bg-primary shadow-[0_0_8px_rgba(59,130,246,0.6)]';
    if (gridShare === m) return 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.6)]';
    return 'bg-muted';
  }, [row]);

  if (!row) return null;

  return (
    <motion.div
      ref={containerRef}
      layout
      className="relative min-h-[520px] overflow-hidden rounded-[12px] border border-border bg-gradient-to-br from-card via-surface-alt to-background shadow-[0_0_80px_rgba(59,130,246,0.08)] lg:min-h-[620px]"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 40%, rgba(16,185,129,0.08) 0%, transparent 45%), radial-gradient(circle at 78% 55%, rgba(59,130,246,0.07) 0%, transparent 40%), linear-gradient(rgba(31,41,55,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(31,41,55,0.12) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 100% 100%, 48px 48px, 48px 48px',
        }}
        aria-hidden
      />

      <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full" aria-hidden>
        <defs>
          <filter id="flowGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="particleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <AnimatePresence mode="popLayout">
          {layout.lines.map((ln) => (
            <motion.path
              key={`${ln.id}-${selectedHour}`}
              d={ln.d}
              fill="none"
              stroke={ln.color}
              strokeWidth={ln.width}
              strokeLinecap="round"
              strokeOpacity={ln.opacity}
              strokeDasharray={ln.strokeDash}
              vectorEffect="non-scaling-stroke"
              filter={ln.active ? 'url(#flowGlow)' : undefined}
              initial={{ opacity: 0.15 }}
              animate={{ opacity: ln.opacity }}
              transition={{ duration: 0.35 }}
              className={ln.flowClass}
              style={{ ['--flow-duration']: ln.duration }}
            />
          ))}
        </AnimatePresence>

        {layout.particles.map((p) => (
          <FlowParticles
            key={`${p.id}-${selectedHour}`}
            pathD={p.d}
            color={p.color}
            duration={p.duration}
            count={p.count}
          />
        ))}
      </svg>

      <div className="pointer-events-none absolute inset-0 z-[2]">
        {layout.labels.map((lb) => (
          <motion.div
            key={lb.id}
            className="absolute -translate-x-1/2 rounded-full border border-border bg-background/90 px-2.5 py-1 text-[10px] font-bold tabular-nums shadow-lg backdrop-blur-md sm:text-[11px]"
            style={{ left: lb.x, top: lb.y, color: lb.color }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            {lb.text}
          </motion.div>
        ))}
      </div>

      <div className="relative z-[3] flex min-h-[420px] flex-col justify-between gap-4 p-3 pb-2 sm:min-h-[480px] sm:p-4 md:p-6 lg:min-h-[620px] lg:flex-row lg:gap-0">
        <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[220px]">
          <motion.div
            ref={solarRef}
            layout
            className={`relative rounded-[12px] border border-border bg-card/95 p-4 backdrop-blur-sm transition ${
              solarIdle
                ? 'opacity-45 saturate-[0.35]'
                : 'ring-1 ring-success/30 shadow-[0_0_40px_rgba(16,185,129,0.2)]'
            }`}
          >
            {!solarIdle ? (
              <motion.span
                className="pointer-events-none absolute -right-2 -top-2 h-20 w-20 rounded-full bg-success/25 blur-2xl"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2.8, repeat: Infinity }}
              />
            ) : null}
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  solarIdle ? 'bg-white/5' : 'bg-success/15'
                }`}
              >
                <Sun
                  className={`h-7 w-7 ${solarIdle ? 'text-muted' : 'text-amber-300'}`}
                  strokeWidth={2}
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Güneş Paneli</div>
                <div className="text-[11px] text-muted">Kaynak</div>
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold tabular-nums text-foreground">
              {solarIdle ? (
                <span className="text-sm font-semibold text-muted">Üretim Yok</span>
              ) : (
                `${row.production.toFixed(1)} kW`
              )}
            </div>
          </motion.div>

          <motion.div
            ref={batteryRef}
            layout
            className={`relative rounded-[12px] border bg-card/95 p-4 backdrop-blur-sm ${
              batteryStatus.charging
                ? 'border-success/40 shadow-[0_0_48px_rgba(16,185,129,0.18)]'
                : batteryStatus.discharging
                  ? 'border-primary/40 shadow-[0_0_48px_rgba(59,130,246,0.16)]'
                  : 'border-border'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-foreground">Batarya</div>
                <div
                  className={`mt-0.5 text-xs font-semibold ${
                    batteryStatus.charging
                      ? 'text-success'
                      : batteryStatus.discharging
                        ? 'text-primary'
                        : 'text-muted'
                  }`}
                >
                  {batteryStatus.text}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold tabular-nums text-foreground">
                  %{row.batterySoC.toFixed(0)}
                </div>
                <div className="text-[11px] tabular-nums text-muted">
                  {row.storedKwh.toFixed(0)} kWh
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <BatteryVisual soc={row.batterySoC} status={batteryStatus} />
              <div className="min-w-0 flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-border">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${
                      batteryStatus.charging
                        ? 'from-success to-emerald-400'
                        : batteryStatus.discharging
                          ? 'from-primary to-blue-400'
                          : 'from-gray-600 to-muted'
                    }`}
                    animate={{ width: `${clamp(row.batterySoC, 0, 100)}%` }}
                    transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                  />
                </div>
                <p className="mt-2 text-[10px] leading-snug text-muted">
                  {batteryStatus.charging
                    ? 'Fazla üretim depolanıyor'
                    : batteryStatus.discharging
                      ? 'Pik saatte binalara besleme'
                      : 'Bekleme / dolu'}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            ref={gridRef}
            layout
            className={`rounded-[12px] border border-border bg-card/95 p-4 backdrop-blur-sm ${
              gridActive || exportActive
                ? 'ring-1 ring-warning/35 shadow-[0_0_36px_rgba(245,158,11,0.15)]'
                : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/15">
                <Zap className="h-7 w-7 text-warning" strokeWidth={2} />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Şebeke</div>
                <div className="text-[11px] text-muted">İthalat kaynağı</div>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs font-semibold tabular-nums">
              <div className={gridActive ? 'text-warning' : 'text-muted'}>
                {gridActive ? `Alım: ${row.gridImport.toFixed(1)} kW` : 'Alım: 0.0 kW'}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="hidden flex-1 lg:block" aria-hidden />

        <div className="flex w-full shrink-0 flex-col gap-2 lg:w-[220px]">
          {blocks.map((b, i) => (
            <motion.div
              key={b.id}
              ref={(el) => {
                blockRefs.current[i] = el;
              }}
              layout
              className="rounded-[12px] border border-border bg-card/90 px-3 py-2.5 backdrop-blur-sm"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${sourceIndicatorClass}`} />
                  <Building2 className="h-5 w-5 shrink-0 text-foreground" strokeWidth={2} />
                  <span className="truncate text-sm font-semibold text-foreground">{b.label}</span>
                </div>
                <span className="text-xs font-bold tabular-nums text-foreground">
                  {perBlock.toFixed(1)} kW
                </span>
              </div>
            </motion.div>
          ))}

          <motion.div
            ref={exportRef}
            layout
            className={`mt-1 rounded-[12px] border border-border bg-card/95 p-4 backdrop-blur-sm ${
              exportActive
                ? 'ring-1 ring-warning/40 shadow-[0_0_40px_rgba(245,158,11,0.2)]'
                : 'opacity-70'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/15">
                <Zap className="h-7 w-7 text-warning" strokeWidth={2} />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Şebeke Satış</div>
                <div className="text-[11px] text-muted">İhracat</div>
              </div>
            </div>
            <div className="mt-2 text-lg font-bold tabular-nums text-warning">
              {exportActive ? `${row.gridExport.toFixed(1)} kW` : '—'}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative z-[3] mx-3 mb-3 flex flex-wrap items-center justify-center gap-3 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-[10px] text-muted sm:mx-4 sm:mb-4 sm:gap-4 lg:hidden">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success" /> Panel
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" /> Batarya
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning" /> Şebeke
        </span>
      </div>

      <div className="relative z-[3] mx-4 mb-4 hidden flex-wrap items-center gap-4 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-[10px] text-muted lg:flex">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success" /> Panel
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" /> Batarya
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning" /> Şebeke
        </span>
      </div>
    </motion.div>
  );
}
