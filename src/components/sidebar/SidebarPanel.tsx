// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useEntrance } from '../../shell/EntranceContext';
import { FlowCatalogSection } from './flow/FlowCatalogSection';
import { GroupTreeSection } from './groups/GroupTreeSection';
import { LayerListSection } from './layers/LayerListSection';
import { PropertyEditorSection } from './properties/PropertyEditorSection';

/** Right rail: the Flow set, the group tree, then layers, then properties. */
export function SidebarPanel() {
  const { showsFlowPanel } = useEntrance();

  return (
    <div className="flex h-full w-64 flex-shrink-0 select-none flex-col border-r border-[#333] bg-[#252526] font-sans text-[12px] text-[#cccccc]">
      {showsFlowPanel && <FlowCatalogSection />}
      {showsFlowPanel && <GroupTreeSection />}
      <LayerListSection />
      <PropertyEditorSection />
    </div>
  );
}
