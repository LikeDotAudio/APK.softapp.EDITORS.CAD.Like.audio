// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { ComponentType } from 'react';
import { FlowCatalogSection } from '../sidebar/flow/FlowCatalogSection';
import { GroupTreeSection } from '../sidebar/groups/GroupTreeSection';
import { LayerListSection } from '../sidebar/layers/LayerListSection';
import { PaletteSection } from '../sidebar/palette/PaletteSection';
import { PropertyEditorSection } from '../sidebar/properties/PropertyEditorSection';
import type { PanelId } from './dockLayout';

/** What each panel is: its body, and its short name for tabs and window titles. */
export const DOCK_PANELS: Record<PanelId, { label: string; Body: ComponentType }> = {
  flow: { label: 'Flow Blocks', Body: FlowCatalogSection },
  groups: { label: 'Groups', Body: GroupTreeSection },
  palette: { label: 'Palette', Body: PaletteSection },
  layers: { label: 'Layers', Body: LayerListSection },
  properties: { label: 'Properties', Body: PropertyEditorSection },
};
