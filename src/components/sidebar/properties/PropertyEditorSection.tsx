// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useStore } from '../../../state/useStore';
import { PanelSectionTitle } from '../PanelSectionTitle';
import { BlockProperties } from './BlockProperties';
import { TextProperties } from './TextProperties';
import { ColorProperty } from './ColorProperty';
import { IdentityProperties } from './IdentityProperties';
import { LayerProperty } from './LayerProperty';
import { ProtectedProperty } from './ProtectedProperty';
import { SelectionSummary } from './SelectionSummary';
import { StyleProperties } from './StyleProperties';

/** Bottom half of the sidebar: properties of whatever is selected. */
export function PropertyEditorSection() {
  const store = useStore();

  const selectedTexts = Array.from(store.selection)
    .map((id) => store.doc.texts.get(id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  const selectedBlocks = Array.from(store.selection)
    .map((id) => store.doc.blockInstances.get(id))
    .filter((b): b is NonNullable<typeof b> => b !== undefined);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#252526]">
      <PanelSectionTitle label="Property Editor" />

      <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-3 text-[11px]">
        <SelectionSummary />

        {/* Selected Text Annotations Inspector with X, Y Positioning */}
        {selectedTexts.map((text) => (
          <TextProperties key={text.id} textEntity={text} />
        ))}

        {/* Selected Block Instance Inspector with UUID & Custom Attributes */}
        {selectedBlocks.map((inst) => (
          <BlockProperties key={inst.id} instance={inst} />
        ))}

        <div className="space-y-2 rounded border border-[#333] bg-[#1e1e1e] p-2.5">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#aaa]">
            General Properties
          </div>
          <LayerProperty />
          <ColorProperty />
          <StyleProperties />
          <IdentityProperties />
          <ProtectedProperty />
        </div>
      </div>
    </div>
  );
}
