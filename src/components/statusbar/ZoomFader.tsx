// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { MAX_ZOOM, MIN_ZOOM } from '../../core/constants';
import { useStore } from '@state/useStore';
import { useUi } from '@state/useUi';

/** The view's starting zoom (Viewport.zoom), shown as 100 %. */
const HOME_ZOOM = 80;

const LOG_MIN = Math.log10(MIN_ZOOM);
const LOG_MAX = Math.log10(MAX_ZOOM);
const STEPS = 1000;

const toFader = (zoom: number) => Math.round(((Math.log10(zoom) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * STEPS);
const fromFader = (pos: number) => 10 ** (LOG_MIN + (pos / STEPS) * (LOG_MAX - LOG_MIN));

function percent(zoom: number): string {
  const p = (zoom / HOME_ZOOM) * 100;
  if (p >= 100) return `${Math.round(p).toLocaleString()}%`;
  return `${p.toPrecision(2)}%`;
}

/**
 * Horizontal fader for the zoom level. Logarithmic, so every decade of zoom
 * takes the same travel; follows the wheel and the zoom buttons as they move.
 */
export function ZoomFader() {
  const store = useStore();
  const { zoom } = useUi();

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="range"
        min={0}
        max={STEPS}
        step={1}
        value={toFader(zoom)}
        onChange={(e) => store.setZoom(fromFader(Number(e.target.value)))}
        onDoubleClick={() => store.setZoom(HOME_ZOOM)}
        aria-label="Zoom level"
        title="Zoom — drag to zoom about the centre, double-click for 100%"
        className="h-1 w-32 cursor-pointer accent-[#f4902c]"
      />
      <span className="w-14 text-right tabular-nums text-[#aaa]">{percent(zoom)}</span>
    </div>
  );
}
