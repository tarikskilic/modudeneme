import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Battery,
  Building2,
  CheckCircle2,
  Home,
  Sun,
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext.jsx';
import { SLIDER_RANGES } from '../constants/simulationDefaults.js';

const PANEL = SLIDER_RANGES.panelCapacity;
const BATTERY = SLIDER_RANGES.batteryCapacity;
const BLOCK = SLIDER_RANGES.blockCount;
const APT = SLIDER_RANGES.apartmentCount;

const MONTHS_TR = [
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

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function snap(n, step, min, max) {
  const s = Math.round((n - min) / step) * step + min;
  return clamp(s, min, max);
}

export default function SliderPanel() {
  const {
    panelCapacity,
    setPanelCapacity,
    batteryCapacity,
    setBatteryCapacity,
    blockCount,
    setBlockCount,
    apartmentCount,
    setApartmentCount,
    selectedMonth,
    setSelectedMonth,
  } = useSimulation();

  const panelFill = ((panelCapacity - PANEL.min) / (PANEL.max - PANEL.min)) * 100;
  const batteryFill = batteryCapacity <= 0 ? 0 : (batteryCapacity / BATTERY.max) * 100;
  const blockFill = ((blockCount - BLOCK.min) / (BLOCK.max - BLOCK.min)) * 100;
  const aptFill = ((apartmentCount - APT.min) / (APT.max - APT.min)) * 100;

  const panelZone = useMemo(() => {
    if (panelCapacity < 150) return { tone: 'warn', label: 'Yetersiz kapasite' };
    if (panelCapacity > 350)
      return { tone: 'warn', label: 'Aşırı kapasite — şebeke satışı artar' };
    return { tone: 'ok', label: 'Optimal aralık' };
  }, [panelCapacity]);

  const batteryScenario = useMemo(() => {
    const pts = [
      { v: 0, label: 'Bataryasız' },
      { v: 250, label: 'Minimum Optimum' },
      { v: 500, label: 'MODÜ-GRID Hedefi' },
    ];
    const closest = pts.reduce((a, b) =>
      Math.abs(b.v - batteryCapacity) < Math.abs(a.v - batteryCapacity) ? b : a
    );
    return { pts, closest };
  }, [batteryCapacity]);

  return (
    <motion.section
      layout
      className="rounded-[12px] border border-border bg-card p-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-base font-semibold text-foreground">Sistem Parametreleri</h2>
      <p className="mt-1 text-xs text-muted">Slider değişince simülasyon anında güncellenir.</p>

      <div className="mt-6 space-y-8">
        {/* Panel */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sun className="h-4 w-4 text-success" />
              Panel Gücü
            </div>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {panelCapacity} kWp
            </span>
          </div>
          <input
            type="range"
            className="modu-range"
            min={PANEL.min}
            max={PANEL.max}
            step={PANEL.step}
            value={panelCapacity}
            style={{
              '--fill-pct': `${panelFill}%`,
              '--range-fill': panelZone.tone === 'ok' ? '#10B981' : '#F59E0B',
            }}
            onChange={(e) =>
              setPanelCapacity(snap(Number(e.target.value), PANEL.step, PANEL.min, PANEL.max))
            }
          />
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted">
            <span>{PANEL.min}</span>
            <span>{PANEL.max}</span>
          </div>
          <div
            className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium ${
              panelZone.tone === 'ok'
                ? 'bg-success/10 text-success'
                : 'bg-warning/10 text-amber-200'
            }`}
          >
            {panelZone.tone === 'ok' ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />
            )}
            <span>{panelZone.label}</span>
          </div>
        </div>

        {/* Battery */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Battery className="h-4 w-4 text-primary" />
              Batarya Kapasitesi
            </div>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {batteryCapacity} kWh
            </span>
          </div>
          <input
            type="range"
            className="modu-range"
            min={BATTERY.min}
            max={BATTERY.max}
            step={BATTERY.step}
            value={batteryCapacity}
            style={{ '--fill-pct': `${batteryFill}%` }}
            onChange={(e) =>
              setBatteryCapacity(snap(Number(e.target.value), BATTERY.step, BATTERY.min, BATTERY.max))
            }
          />
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted">
            <span>{BATTERY.min}</span>
            <span>{BATTERY.max}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {batteryScenario.pts.map((p) => {
              const active = p.v === batteryScenario.closest.v;
              return (
                <button
                  key={p.v}
                  type="button"
                  onClick={() => setBatteryCapacity(p.v)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                    active
                      ? p.v === 500
                        ? 'border-success/60 bg-success/15 text-success shadow-[0_0_20px_rgba(16,185,129,0.22)]'
                        : 'border-primary/60 bg-primary/10 text-primary'
                      : 'border-border bg-background/40 text-muted hover:border-border hover:text-foreground'
                  }`}
                >
                  {p.label}
                  {p.v === 500 && active ? (
                    <CheckCircle2 className="ml-1 inline h-3 w-3 align-text-bottom" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Blocks */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Building2 className="h-4 w-4 text-foreground" />
              Blok Sayısı
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="touch-target inline-flex items-center justify-center rounded-lg border border-border bg-background text-foreground hover:border-primary/40"
                onClick={() => setBlockCount((v) => clamp(v - BLOCK.step, BLOCK.min, BLOCK.max))}
                aria-label="Azalt"
              >
                −
              </button>
              <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
                {blockCount}
              </span>
              <button
                type="button"
                className="touch-target inline-flex items-center justify-center rounded-lg border border-border bg-background text-foreground hover:border-primary/40"
                onClick={() => setBlockCount((v) => clamp(v + BLOCK.step, BLOCK.min, BLOCK.max))}
                aria-label="Arttır"
              >
                +
              </button>
            </div>
          </div>
          <input
            type="range"
            className="modu-range"
            min={BLOCK.min}
            max={BLOCK.max}
            step={BLOCK.step}
            value={blockCount}
            style={{ '--fill-pct': `${blockFill}%` }}
            onChange={(e) => setBlockCount(Number(e.target.value))}
          />
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted">
            <span>{BLOCK.min}</span>
            <span>{BLOCK.max}</span>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-muted">
            Yalnızca görselleştirme — Enerji Akışı diyagramı ve Bloğum kartı.
            Tasarruf/üretim hesaplamasına etki etmez.
          </p>
        </div>

        {/* Apartments */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Home className="h-4 w-4 text-primary" />
              Daire Sayısı
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="touch-target inline-flex items-center justify-center rounded-lg border border-border bg-background text-foreground hover:border-primary/40"
                onClick={() => setApartmentCount((v) => clamp(v - APT.step, APT.min, APT.max))}
                aria-label="Azalt"
              >
                −
              </button>
              <span className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums">
                {apartmentCount}
              </span>
              <button
                type="button"
                className="touch-target inline-flex items-center justify-center rounded-lg border border-border bg-background text-foreground hover:border-primary/40"
                onClick={() => setApartmentCount((v) => clamp(v + APT.step, APT.min, APT.max))}
                aria-label="Arttır"
              >
                +
              </button>
            </div>
          </div>
          <input
            type="range"
            className="modu-range"
            min={APT.min}
            max={APT.max}
            step={APT.step}
            value={apartmentCount}
            style={{ '--fill-pct': `${aptFill}%` }}
            onChange={(e) =>
              setApartmentCount(snap(Number(e.target.value), APT.step, APT.min, APT.max))
            }
          />
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted">
            <span>{APT.min}</span>
            <span>{APT.max}</span>
          </div>
        </div>

        <div>
          <label
            htmlFor="month-select"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Ay Seçimi
          </label>
          <select
            id="month-select"
            className="min-h-[44px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-[3px] focus:ring-primary/10"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {MONTHS_TR.map((label, i) => (
              <option key={label} value={i + 1}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.section>
  );
}
