// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../state/useStore';
import { useUi } from '../state/useUi';
import { BTN, BTN_BASE, LABEL_CAPS, NUMBER_INPUT } from './styles';

/** Controls for the tracing image; only mounted while one is loaded. */
export function ImagePanel() {
  const store = useStore();
  const { tracing, units } = useUi();
  if (!tracing) return null;

  return (
    <div className="flex flex-shrink-0 flex-wrap items-center gap-2.5 border-b border-rule bg-paper-2 px-4 py-2 text-[13px] text-ink-2">
      <label className={LABEL_CAPS} htmlFor="img-opacity">
        Opacity
      </label>
      <input
        id="img-opacity"
        type="range"
        min="0.05"
        max="1"
        step="0.05"
        value={tracing.opacity}
        onChange={(e) => store.setImageOpacity(parseFloat(e.target.value))}
        className="w-[90px] cursor-pointer accent-ink"
      />

      <label className={LABEL_CAPS} htmlFor="img-width">
        Image width
      </label>
      <input
        id="img-width"
        type="number"
        min="0.1"
        step="0.1"
        value={parseFloat(tracing.worldWidth.toFixed(units === 'mm' ? 2 : 3))}
        onChange={(e) => store.setImageWorldWidth(parseFloat(e.target.value))}
        className={NUMBER_INPUT}
      />
      <span className="font-mono text-[11px] text-ink-3">{units}</span>

      <button type="button" className={BTN} onClick={() => store.toggleImageVisible()}>
        {tracing.visible ? 'Hide Image' : 'Show Image'}
      </button>
      <button type="button" className={BTN} onClick={() => store.startCalibration()}>
        Set Scale from Image
      </button>
      <button
        type="button"
        className={`${BTN_BASE} border-[#fca5a5] bg-paper text-[#dc2626] hover:border-[#dc2626]`}
        onClick={() => store.removeImage()}
      >
        Remove
      </button>
    </div>
  );
}
