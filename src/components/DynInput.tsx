// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useEffect, useRef } from 'react';
import { useStore } from '../state/useStore';
import { useUi } from '../state/useUi';

const NUMERIC_KEY = /^[0-9.\-+\/*()]$/;

/**
 * Type-to-size. Once a shape has a start point you can type its exact
 * dimensions — either into these fields or just by starting to type anywhere,
 * which routes the first character here. Enter commits, Escape cancels.
 */
export function DynInput() {
  const store = useStore();
  const { dyn } = useUi();
  const firstRef = useRef<HTMLInputElement>(null);
  const latest = useRef(dyn);
  latest.current = dyn;
  const open = dyn !== null;

  useEffect(() => {
    if (open) firstRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Already typing inside the box — the field's own handler deals with it.
      if (target?.closest?.('[data-dyn-box]')) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        store.commitDyn();
        return;
      }
      if (e.key === 'Tab' || !NUMERIC_KEY.test(e.key)) return;
      const field = latest.current?.fields[0];
      if (!field) return;
      e.preventDefault();
      store.setDynValue(field.key, field.value + e.key);
      firstRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, store]);

  if (!dyn) return null;

  return (
    <div
      data-dyn-box
      className="fixed z-[60] flex items-center gap-1.5 rounded-[9px] border-[1.5px] border-ink bg-paper px-[7px] py-[5px] shadow-[3px_3px_0_rgba(21,24,27,.16)]"
      style={{
        left: Math.min(dyn.anchor.x + 18, window.innerWidth - 215),
        top: Math.min(dyn.anchor.y + 18, window.innerHeight - 52),
      }}
    >
      {dyn.modeLabel !== null && (
        <button
          type="button"
          onClick={() => store.cycleDynMode()}
          title="Toggle radius / diameter"
          className="min-w-6 rounded-md border border-rule-2 bg-white px-[7px] py-[5px] font-mono text-xs font-bold leading-none text-ink hover:border-ink"
        >
          {dyn.modeLabel}
        </button>
      )}

      {dyn.fields.map((field, i) => (
        <label
          key={field.key}
          className="flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.05em] text-ink-3"
        >
          {field.label && <span>{field.label}</span>}
          <input
            ref={i === 0 ? firstRef : undefined}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            value={field.value}
            placeholder={field.placeholder}
            onChange={(e) => store.setDynValue(field.key, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                store.commitDyn();
              }
            }}
            className="w-[58px] rounded-md border border-rule-2 bg-white px-1.5 py-[5px] text-center font-mono text-xs text-ink placeholder:text-ink-3/55 focus:border-ink focus:outline-none"
          />
        </label>
      ))}

      <span className="ml-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-ink-3">
        ↵ set
      </span>
    </div>
  );
}
