// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { PanelSectionTitle } from '../PanelSectionTitle';
import { ColorProperty } from './ColorProperty';
import { IdentityProperties } from './IdentityProperties';
import { LayerProperty } from './LayerProperty';
import { ProtectedProperty } from './ProtectedProperty';
import { SelectionSummary } from './SelectionSummary';
import { StyleProperties } from './StyleProperties';

/** Bottom half of the sidebar: properties of whatever is selected. */
export function PropertyEditorSection() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#252526]">
      <PanelSectionTitle label="Property Editor" />

      <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-3 text-[11px]">
        <SelectionSummary />

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
