// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../state/useStore';
import { useUi } from '../../../state/useUi';
import { PropertyRow } from './PropertyRow';

/** Which layer the selection sits on. Changing it also sets the active layer. */
export function LayerProperty() {
  const store = useStore();
  const { layers, activeLayerId, selectionSize, selectionProtected } = useUi();

  return (
    <PropertyRow label="Layer:">
      <select
        disabled={selectionProtected}
        value={activeLayerId}
        onChange={(e) => {
          const targetLayer = e.target.value;
          store.setActiveLayer(targetLayer);
          if (selectionSize > 0) store.setSelectionLayer(targetLayer);
        }}
        className="min-w-0 flex-1 rounded border border-[#3c3c3c] bg-[#2d2d2d] px-2 py-0.5 text-white focus:border-[#f4902c] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {layers.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
    </PropertyRow>
  );
}
