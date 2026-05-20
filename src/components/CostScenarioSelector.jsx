import { SCENARIO_PRESETS } from '../constants/simulationDefaults.js';
import { useSimulation } from '../context/SimulationContext.jsx';

const PRESET_ORDER = ['demo', 'base', 'subsidized', 'conservative'];

/**
 * CAPEX senaryo seçici — ROI yatırım maliyetini belirler.
 */
export default function CostScenarioSelector({ className = '' }) {
  const { costScenario, setCostScenario } = useSimulation();
  const active = SCENARIO_PRESETS[costScenario] ?? SCENARIO_PRESETS.base;

  const presets = PRESET_ORDER.map((id) => SCENARIO_PRESETS[id]).filter(Boolean);

  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-light">
        CAPEX Senaryosu
      </p>
      <p className="mt-0.5 text-[11px] text-muted">ROI yatırım maliyetini belirler</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {presets.map((preset) => {
          const selected = preset.id === costScenario;
          const isSubsidized = preset.id === 'subsidized';
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setCostScenario(preset.id)}
              className={[
                'min-h-10 rounded-lg px-3 py-2 text-xs font-semibold transition',
                selected
                  ? isSubsidized
                    ? 'border border-success/45 bg-success/15 text-success'
                    : 'border border-primary/40 bg-primary/15 text-primary'
                  : 'border border-border bg-background text-muted-light hover:border-primary/30 hover:text-foreground',
              ].join(' ')}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted">{active.description}</p>
    </div>
  );
}
