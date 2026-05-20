import { useEffect, useState } from 'react';

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Slider yanında manuel sayı girişi — Enter veya blur ile min/max aralığına sıkıştırılır.
 */
export default function SliderValueInput({
  value,
  min,
  max,
  unit,
  onChange,
  className = '',
  inputClassName = '',
  'aria-label': ariaLabel,
}) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const commit = () => {
    const parsed = Number.parseInt(draft, 10);
    if (Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = clamp(parsed, min, max);
    onChange(next);
    setDraft(String(next));
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        aria-label={ariaLabel}
        value={focused ? draft : value}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => {
          setFocused(true);
          setDraft(String(value));
        }}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        className={[
          'w-[4.25rem] rounded-lg border border-border bg-background px-2 py-1 text-right text-sm font-semibold tabular-nums text-foreground outline-none transition',
          'focus:border-primary focus:ring-[3px] focus:ring-primary/10',
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          inputClassName,
        ].join(' ')}
      />
      {unit ? (
        <span className="text-xs font-medium text-muted">{unit}</span>
      ) : null}
    </div>
  );
}
