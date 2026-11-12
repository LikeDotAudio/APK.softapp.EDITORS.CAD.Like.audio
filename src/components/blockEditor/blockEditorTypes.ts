// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** The Block Editor's own types: the inspector tabs, the sidebar filter, one row of the element list. */
import type { BlockPlacement, CadBlockInstance, FillEntity, TextEntity } from '../../core/types';

export type InspectorTab = 'quickAdd' | 'attributes' | 'lines' | 'circles' | 'arcs' | 'texts' | 'fills';
export type ItemCategory = 'all' | 'drawing' | 'blocks' | 'instances';

export interface EditorListItem {
  id: string;
  name: string;
  category: 'master' | 'layer' | 'text' | 'fill' | 'instance' | 'flow' | 'block';
  groupLabel: string;
  badge: string;
  badgeStyle: string;
  icon: string;
  detail: string;
  defName?: string;
  instance?: CadBlockInstance;
  textEntity?: TextEntity;
  fillEntity?: FillEntity;
  layerId?: string;
  flowPlacement?: BlockPlacement;
}
