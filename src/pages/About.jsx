import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Battery,
  Building2,
  Cpu,
  Layers,
  Leaf,
  LogIn,
  Plug,
  Scale,
  Shield,
  Sun,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import ElectricGridBackground from '../components/ElectricGridBackground.jsx';
import AboutNav from '../components/about/AboutNav.jsx';
import TeamCard from '../components/about/TeamCard.jsx';
import {
  CANONICAL_SCENARIO,
  DEMO_ACCOUNTS,
  HOW_IT_WORKS,
  IMPACT_FOOTNOTE,
  IMPACT_KPIS,
  NAV_SECTIONS,
  POSITIONING,
  POSITIONING_SHIFT,
  PROBLEMS,
  SOLUTION_PILLARS,
  TEAM,
} from '../content/aboutContent.js';

const impactIcons = {
  independence: Target,
  roi: TrendingUp,
  daytime: Sun,
  'zero-line': Plug,
};

const pillarIcons = {
  overlay: Layers,
  mahsuplasma: Scale,
  local: Leaf,
  layers: Cpu,
};

function formatTl(n) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n);
}

function Section({ id, children, className = '' }) {
  return (
    <section id={id} className={`scroll-mt-32 py-14 md:py-20 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 md:px-6">{children}</div>
    </section>
  );
}

function SectionHeading({ kicker, title, description }) {
  return (
    <div className="mb-10 max-w-3xl">
      {kicker ? (
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{kicker}</p>
      ) : null}
      <h2 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">{title}</h2>
      {description ? <p className="mt-3 text-base leading-relaxed text-muted-light">{description}</p> : null}
    </div>
  );
}

export default function About() {
  const [sectionRefs, setSectionRefs] = useState({});

  const setRef = useCallback((id) => {
    return (el) => {
      if (!el) return;
      setSectionRefs((prev) => (prev[id] === el ? prev : { ...prev, [id]: el }));
    };
  }, []);

  const pilot = CANONICAL_SCENARIO;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 opacity-40" aria-hidden>
        <ElectricGridBackground />
      </div>

      <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-md md:px-6">
        <Link to="/nedir" className="flex items-center gap-2 text-foreground transition hover:text-primary">
          <Zap className="h-7 w-7 text-primary" strokeWidth={2} aria-hidden />
          <span className="text-lg font-bold tracking-tight">MODÜ-GRID</span>
        </Link>
        <Link
          to="/"
          className="touch-target inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          <LogIn className="h-4 w-4" strokeWidth={2} aria-hidden />
          Giriş
        </Link>
      </header>

      <AboutNav sectionRefs={sectionRefs} />

      <main className="relative pt-16">
        <div ref={setRef('hero')} id="hero" className="scroll-mt-32">
          <Section className="pb-8 pt-12 md:pt-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-4xl"
            >
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {POSITIONING.projectName} · {POSITIONING.location}
                </span>
                <span className="rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
                  Simülasyon platformu
                </span>
              </div>
              <p className="mt-6 text-sm font-medium text-muted-light">{POSITIONING.event}</p>
              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
                {POSITIONING.oneLiner}
              </h1>
              <p className="mt-6 text-xl font-medium italic text-primary md:text-2xl">
                {POSITIONING.tagline}
              </p>
              <p className="mt-4 text-base text-muted-light">{POSITIONING.regulatory}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <a
                  href="#demo"
                  className="touch-target inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  Canlı demo
                  <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
                </a>
                <Link
                  to="/"
                  className="touch-target inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/50"
                >
                  Giriş yap
                </Link>
              </div>
            </motion.div>
          </Section>
        </div>

        <div ref={setRef('fark')} id="fark" className="scroll-mt-32">
          <Section className="border-t border-border bg-card/30">
            <SectionHeading
              kicker="Konumlandırma"
              title={POSITIONING_SHIFT.title}
              description={POSITIONING.overlay}
            />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[12px] border border-border bg-card/60 p-6 opacity-70">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Eski anlatı</p>
                <ul className="mt-4 space-y-3">
                  {POSITIONING_SHIFT.oldItems.map((item) => (
                    <li key={item} className="text-sm text-muted line-through decoration-muted/60">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[12px] border border-success/30 bg-success/5 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-success">Yeni model</p>
                <ul className="mt-4 space-y-3">
                  {POSITIONING_SHIFT.newItems.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={2} aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-8 max-w-3xl text-lg font-semibold text-foreground">
              Yeni altyapı kurmadan mevcut sistemi optimize etmek.
            </p>
          </Section>
        </div>

        <div ref={setRef('problem')} id="problem" className="scroll-mt-32">
          <Section>
            <SectionHeading kicker="Problem" title="Hangi problemi çözüyoruz?" />
            <div className="grid gap-4 md:grid-cols-3">
              {PROBLEMS.map((p, i) => (
                <motion.article
                  key={p.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="rounded-[12px] border border-border bg-card p-5"
                >
                  <span className="text-2xl font-bold text-primary/40">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-3 text-base font-semibold text-foreground">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-light">{p.body}</p>
                </motion.article>
              ))}
            </div>
          </Section>
        </div>

        <div ref={setRef('cozum')} id="cozum" className="scroll-mt-32">
          <Section className="border-t border-border bg-card/20">
            <SectionHeading kicker="Çözüm" title="Site içi enerji optimizasyon katmanı" />
            <div className="grid gap-4 sm:grid-cols-2">
              {SOLUTION_PILLARS.map((pillar, i) => {
                const Icon = pillarIcons[pillar.id] ?? Layers;
                return (
                  <motion.article
                    key={pillar.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="rounded-[12px] border border-border bg-card p-5 transition hover:border-primary/40"
                  >
                    <Icon className="h-6 w-6 text-primary" strokeWidth={2} aria-hidden />
                    <h3 className="mt-4 text-base font-semibold text-foreground">{pillar.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-light">{pillar.body}</p>
                  </motion.article>
                );
              })}
            </div>
          </Section>
        </div>

        <div ref={setRef('nasil')} id="nasil" className="scroll-mt-32">
          <Section>
            <SectionHeading kicker="Nasıl çalışır" title="Simülasyondan karara" />
            <ol className="grid gap-6 md:grid-cols-3">
              {HOW_IT_WORKS.map((step) => (
                <li key={step.step} className="relative rounded-[12px] border border-border bg-card p-5">
                  <span className="font-mono text-sm font-bold text-primary">{step.step}</span>
                  <h3 className="mt-3 text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-light">{step.body}</p>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <div ref={setRef('pilot')} id="pilot" className="scroll-mt-32">
          <Section className="border-t border-border bg-card/30">
            <SectionHeading
              kicker="Pilot"
              title={`${POSITIONING.projectName} — Emlak Konut referans senaryosu`}
              description={`${pilot.apartmentCount} daire, ${pilot.blockCount} blok · ${pilot.panelCapacityKwp} kWp GES · ${pilot.batteryCapacityKwh} kWh ${pilot.batteryType} BESS`}
            />
            <div className="overflow-hidden rounded-[12px] border border-border bg-card">
              <dl className="divide-y divide-border">
                {[
                  ['Konum', pilot.location],
                  ['Batarya kapsamı', pilot.batteryScope],
                  ['Öz-tüketim (simülasyon)', `~%${pilot.selfConsumptionRatePct}`],
                  ['Yıllık net tasarruf (simülasyon)', formatTl(pilot.annualSavingsTl)],
                  ['Pilot ROI (simülasyon)', `~${pilot.roiYears.pilot.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} yıl`],
                  ['Teşvikli ROI (simülasyon)', `~${pilot.roiYears.subsidized.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} yıl`],
                ].map(([label, value]) => (
                  <div key={label} className="grid gap-1 px-5 py-4 sm:grid-cols-2 sm:gap-4">
                    <dt className="text-sm font-medium text-muted">{label}</dt>
                    <dd className="text-sm font-semibold text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-light">
              <span className="inline-flex items-center gap-2">
                <Sun className="h-4 w-4 text-warning" aria-hidden />
                {pilot.panelCapacityKwp} kWp
              </span>
              <span className="inline-flex items-center gap-2">
                <Battery className="h-4 w-4 text-primary" aria-hidden />
                {pilot.batteryCapacityKwh} kWh
              </span>
              <span className="inline-flex items-center gap-2">
                <Building2 className="h-4 w-4 text-success" aria-hidden />
                {pilot.apartmentCount} daire
              </span>
            </div>
          </Section>
        </div>

        <div ref={setRef('etki')} id="etki" className="scroll-mt-32">
          <Section>
            <SectionHeading kicker="Etki" title="Hedefler ve referans metrikler" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {IMPACT_KPIS.map((kpi, i) => {
                const Icon = impactIcons[kpi.id] ?? Target;
                return (
                  <motion.article
                    key={kpi.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.4 }}
                    className="flex flex-col rounded-[12px] border border-primary/20 bg-card p-5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Icon className="h-6 w-6 text-primary" strokeWidth={2} aria-hidden />
                      <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
                        {kpi.badge}
                      </span>
                    </div>
                    <p className="mt-4 text-3xl font-bold tabular-nums text-foreground">{kpi.value}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{kpi.label}</p>
                    <p className="mt-3 text-xs leading-relaxed text-muted">{kpi.subtitle}</p>
                  </motion.article>
                );
              })}
            </div>
            <p className="mt-8 rounded-lg border border-border bg-surface-alt/80 px-4 py-3 text-xs leading-relaxed text-muted-light">
              {IMPACT_FOOTNOTE}
            </p>
          </Section>
        </div>

        <div ref={setRef('ekip')} id="ekip" className="scroll-mt-32">
          <Section className="border-t border-border bg-card/20">
            <SectionHeading kicker="Ekip" title="ELYSIUM · MODÜ-GRID" />
            <div className="grid gap-4 sm:grid-cols-2">
              {TEAM.map((member, i) => (
                <TeamCard key={member.name} {...member} index={i} />
              ))}
            </div>
          </Section>
        </div>

        <div ref={setRef('demo')} id="demo" className="scroll-mt-32">
          <Section>
            <SectionHeading
              kicker="Demo"
              title="Canlı simülasyonu deneyin"
              description="Tüm veriler simülasyon motorundan üretilir; saha donanımı bu sürümde bağlı değildir."
            />
            <div className="grid gap-4 md:grid-cols-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <div
                  key={acc.username}
                  className="rounded-[12px] border border-border bg-card p-5"
                >
                  <p className="text-sm font-semibold text-primary">{acc.role}</p>
                  <p className="mt-2 font-mono text-lg font-bold text-foreground">{acc.username}</p>
                  <p className="mt-2 text-sm text-muted-light">{acc.hint}</p>
                </div>
              ))}
            </div>
            <Link
              to="/"
              className="touch-target mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Demo girişine git
              <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
            </Link>
          </Section>
        </div>

        <footer className="border-t border-border py-10">
          <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted md:px-6">
            <p>MODÜ-GRID · {POSITIONING.event} · {POSITIONING.projectName}</p>
            <p className="mt-2">
              <a href="https://modu-grid.com" className="text-primary hover:underline">
                modu-grid.com
              </a>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
