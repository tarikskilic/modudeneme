import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Battery, Pause, Play, Sun, Zap } from 'lucide-react';
import EnergyFlowDiagram from '../components/EnergyFlowDiagram.jsx';
import HardwareStatusBanner from '../components/HardwareStatusBanner.jsx';
import KPICard from '../components/KPICard.jsx';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useSimulation } from '../context/SimulationContext.jsx';

export function hourContextLabel(h) {
  const time = `${String(h).padStart(2, '0')}:00`;
  if (h >= 6 && h <= 9) return `${time} — Sabah: Panel şarj başlıyor`;
  if (h >= 10 && h <= 14) return `${time} — Öğle: Maksimum üretim, batarya doluyor`;
  if (h >= 15 && h <= 17) return `${time} — Öğleden sonra: Üretim azalıyor`;
  if (h >= 18 && h <= 20) return `${time} — Akşam: Pik tüketim, batarya devrede`;
  if (h >= 21 && h <= 23) return `${time} — Gece: Şebekeden minimum alım`;
  return `${time} — Gece yarısı: Sistem bekleme modunda`;
}

export default function EnergyFlow() {
  const { hourlyData, batteryCapacity, blockCount } = useSimulation();
  const [selectedHour, setSelectedHour] = useState(8);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(() => {
      setSelectedHour((h) => (h + 1) % 24);
    }, 1000);
    return () => window.clearInterval(id);
  }, [playing]);

  const row = hourlyData[selectedHour];

  const batteryLabel = useMemo(() => {
    if (!row || batteryCapacity <= 0) return 'Pasif';
    const charging = row.batteryChargeKwh > 0.0001;
    const discharging = row.batteryUse > 0.0001;
    if (row.batterySoC >= 99) return 'Dolu';
    if (row.batterySoC <= 11) return 'Boş';
    if (charging) return 'Şarj Oluyor';
    if (discharging) return 'Deşarj';
    return 'Beklemede';
  }, [row, batteryCapacity]);

  const gridStat = useMemo(() => {
    if (!row) {
      return { subtitle: 'Şebeke dengede', tone: 'muted', headline: 'Bekleme', detail: '' };
    }
    if (row.gridExport > 0.0001) {
      return {
        subtitle: 'Satış Yapılıyor',
        tone: 'export',
        headline: `${row.gridExport.toFixed(1)} kW`,
        detail: 'Fazla üretim şebekeye',
      };
    }
    if (row.gridImport > 0.0001) {
      return {
        subtitle: 'Alım Yapılıyor',
        tone: 'import',
        headline: `${row.gridImport.toFixed(1)} kW`,
        detail: 'Şebekeden besleme',
      };
    }
    return { subtitle: 'Şebeke dengede', tone: 'muted', headline: 'Bekleme', detail: 'Aktif akış yok' };
  }, [row]);

  if (!row) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Navbar />
        <HardwareStatusBanner />
        <Sidebar />
        <main className="shell-admin lg:pl-[240px]">
          <div className="page-inner text-muted">Veri yükleniyor…</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <HardwareStatusBanner />
      <Sidebar />
      <main className="shell-admin lg:pl-[240px]">
        <div className="page-inner space-y-6">
          <motion.header
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="page-title">Enerji Akış Diyagramı</h1>
            <p className="mt-1 text-sm text-muted">
              Kaynaklardan tüketicilere anlık enerji yönlendirmesi — canlı kontrol odası
            </p>
          </motion.header>

          <section className="space-y-0 overflow-hidden rounded-[12px] border border-border bg-card shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <EnergyFlowDiagram
              hourlyData={hourlyData}
              selectedHour={selectedHour}
              blockCount={blockCount}
              batteryCapacity={batteryCapacity}
            />

            <div className="border-t border-border bg-background/60 px-4 py-5 md:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{hourContextLabel(selectedHour)}</p>
                  <p className="mt-1 text-xs text-muted">
                    Zaman çizelgesini sürükleyin veya oynat ile gün boyunca akışı izleyin
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <motion.button
                    type="button"
                    onClick={() => setPlaying((p) => !p)}
                    className="touch-target inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:border-primary/50 sm:w-auto"
                    whileTap={{ scale: 0.97 }}
                  >
                    {playing ? (
                      <>
                        <Pause className="h-4 w-4 text-primary" />
                        Duraklat
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 text-primary" />
                        Oynat
                      </>
                    )}
                  </motion.button>
                  <div className="rounded-xl border border-primary/30 bg-primary/[0.08] px-3 py-2 text-center">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-muted">
                      Şu an
                    </div>
                    <div className="font-mono text-lg font-bold tabular-nums text-primary">
                      {String(selectedHour).padStart(2, '0')}:00
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative mt-5">
                <input
                  type="range"
                  min={0}
                  max={23}
                  step={1}
                  value={selectedHour}
                  onChange={(e) => {
                    setPlaying(false);
                    setSelectedHour(Number(e.target.value));
                  }}
                  className="modu-range energy-timeline"
                  style={{ '--fill-pct': `${(selectedHour / 23) * 100}%` }}
                  aria-valuemin={0}
                  aria-valuemax={23}
                  aria-valuenow={selectedHour}
                  aria-label="24 saatlik zaman çizelgesi"
                />
                <div className="mt-2 flex justify-between text-[10px] font-medium tabular-nums text-muted">
                  {[0, 6, 12, 18, 23].map((h) => (
                    <span key={h}>{String(h).padStart(2, '0')}:00</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            <KPICard
              staggerIndex={0}
              title="Anlık Panel Üretimi"
              numericValue={row.production}
              decimals={1}
              unit="kW"
              subtitle="Seçili saat üretim gücü"
              icon={Sun}
              color="success"
            />
            <KPICard
              staggerIndex={1}
              title="Anlık Batarya Durumu"
              value={`${row.batterySoC.toFixed(0)}% | ${row.storedKwh.toFixed(0)} kWh`}
              subtitle={batteryLabel}
              icon={Battery}
              color="primary"
            />

            <motion.article
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col rounded-[12px] border border-border bg-card p-5 transition-colors hover:border-primary"
            >
              <Zap
                className="h-6 w-6 shrink-0"
                strokeWidth={2}
                style={{
                  color:
                    gridStat.tone === 'import'
                      ? '#EF4444'
                      : gridStat.tone === 'export'
                        ? '#F59E0B'
                        : '#F59E0B',
                }}
                aria-hidden
              />
              <p className="mt-4 text-sm font-semibold text-foreground">Anlık Şebeke Durumu</p>
              <motion.p
                key={gridStat.headline}
                className={`mt-2 text-2xl font-bold tabular-nums ${
                  gridStat.tone === 'import'
                    ? 'text-red-400'
                    : gridStat.tone === 'export'
                      ? 'text-warning'
                      : 'text-muted'
                }`}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
              >
                {gridStat.headline}
              </motion.p>
              <p
                className={`mt-2 text-sm font-semibold ${
                  gridStat.tone === 'import'
                    ? 'text-red-400'
                    : gridStat.tone === 'export'
                      ? 'text-success'
                      : 'text-muted'
                }`}
              >
                {gridStat.subtitle}
              </p>
              <p className="mt-2 text-[11px] text-muted">{gridStat.detail}</p>
            </motion.article>
          </div>
        </div>
      </main>
    </div>
  );
}
