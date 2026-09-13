// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/useStore';
import { useUi } from '../state/useUi';

/**
 * Prompt for the real distance between the two calibration points. Positioned
 * near their midpoint but kept inside the canvas.
 */
export function ScaleBox() {
  const store = useStore();
  const { calibrationBox, units } = useUi();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (calibrationBox) {
      setValue('');
      inputRef.current?.focus();
    }
  }, [calibrationBox]);

  if (!calibrationBox) return null;

  const apply = () => {
    const distance = parseFloat(value);
    if (!store.applyCalibration(distance)) {
      window.alert('Please enter a valid distance — the two points must be further apart.');
    }
  };

  return (
    <div
      className="absolute z-50 min-w-[240px] rounded-xl border border-rule bg-paper px-5 py-[18px] shadow-[0_12px_32px_-8px_rgba(21,24,27,.18)]"
      style={{
        left: Math.max(8, calibrationBox.x - 110),
        top: Math.max(8, calibrationBox.y + 16),
      }}
    >
      <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
        Enter real distance between the two points:
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="number"
          min="0.001"
          step="0.001"
          placeholder="e.g. 4"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              apply();
            }
          }}
          className="w-24 rounded-lg border border-rule-2 bg-paper px-2.5 py-2 font-mono text-[13px] text-ink focus:border-ink focus:outline-none"
        />
        <span className="font-mono text-xs text-ink-3">{units}</span>
        <button
          type="button"
          onClick={apply}
          className="rounded-lg bg-ink px-3.5 py-2 text-[13px] font-semibold text-paper hover:bg-black"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => store.cancelCalibration()}
          className="rounded-lg border border-rule-2 px-3 py-2 text-[13px] font-medium text-ink hover:border-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
