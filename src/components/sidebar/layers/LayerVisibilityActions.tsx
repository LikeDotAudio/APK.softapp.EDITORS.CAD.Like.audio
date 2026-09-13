// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../state/useStore';

/** Show-all / hide-all shortcuts above the layer list. */
export function LayerVisibilityActions() {
  const store = useStore();

  return (
    <div className="flex items-center gap-1 border-b border-[#333] bg-[#2a2a2a] px-2 py-1">
      <button
        type="button"
        onClick={() => store.showAllLayers()}
        className="rounded p-1 text-[11px] hover:bg-[#383838]"
        title="Show All Layers"
      >
        👁️ Show All
      </button>
      <button
        type="button"
        onClick={() => store.hideAllLayers()}
        className="rounded p-1 text-[11px] hover:bg-[#383838]"
        title="Hide All Layers"
      >
        🕶️ Hide All
      </button>
    </div>
  );
}
