// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Units } from '../core/types';
import { useStore } from '../state/useStore';
import { useUi } from '../state/useUi';

const OPTIONS: Units[] = ['in', 'mm'];

/** Switching units rescales the drawing so it keeps its real-world size. */
export function UnitToggle() {
  const store = useStore();
  const { units } = useUi();

  return (
    <div className="flex overflow-hidden rounded-lg border border-rule-2 bg-paper">
      {OPTIONS.map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => store.setUnits(u)}
          className={
            'px-3 py-1.5 font-mono text-xs font-medium tracking-[0.04em] transition-colors ' +
            (units === u ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink')
          }
        >
          {u}
        </button>
      ))}
    </div>
  );
}
