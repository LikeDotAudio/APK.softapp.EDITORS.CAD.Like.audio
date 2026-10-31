// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useUi } from '@state/useUi';
import { LinetypeSelect, LineweightSelect } from '../layers/LayerStyleSelects';
import { PropertyRow } from './PropertyRow';

/**
 * Lineweight and linetype. An entity draws ByLayer — it carries neither — so
 * these set the layer the Layer row above shows (the selection's, which is
 * also the active one), exactly as the pickers on its layer row do.
 */
export function StyleProperties() {
  const { layers, activeLayerId, selectionProtected } = useUi();
  const layer = layers.find((l) => l.id === activeLayerId);
  if (!layer) return null;
  const selectClass =
    'min-w-0 flex-1 rounded border border-[#3c3c3c] bg-[#2d2d2d] px-2 py-0.5 text-white focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <>
      <PropertyRow label="Lineweight:">
        <LineweightSelect layer={layer} disabled={selectionProtected} className={selectClass} />
      </PropertyRow>

      <PropertyRow label="Linetype:">
        <LinetypeSelect layer={layer} disabled={selectionProtected} className={selectClass} />
      </PropertyRow>
    </>
  );
}
