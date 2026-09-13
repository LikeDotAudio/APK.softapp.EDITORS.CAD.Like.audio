// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import type { GroupRowUi, UiState } from '../UiState';
import { membersDeep, rootGroups } from '../../flow/groups';

/**
 * The group tree, flattened depth-first so a parent is always immediately
 * followed by what is inside it. Reading order IS the nesting, which is why the
 * panel can render a flat list and still look like a tree.
 *
 * `seen` is not defensive dressing: this walks a structure that can arrive from
 * a file on disk, and a cycle there would hang the render rather than draw a
 * wrong box.
 */
function groupRows(store: EditorStore): GroupRowUi[] {
  const model = store.schematic;
  const rows: GroupRowUi[] = [];
  const seen = new Set<number>();

  const walk = (id: number, depth: number) => {
    if (seen.has(id)) return;
    seen.add(id);
    const group = model.groups.find((g) => g.id === id);
    if (!group) return;
    rows.push({
      id: group.id,
      name: group.name,
      depth,
      members: group.members.length,
      held: membersDeep(model, group.id).length,
      children: group.children.length,
      collapsed: Boolean(group.collapsed),
      source: group.source ?? null,
    });
    for (const child of group.children) walk(child, depth + 1);
  };

  for (const root of rootGroups(model)) walk(root.id, 0);
  /* A group a cycle kept out of the walk is still in the model, and a panel
     that cannot show it is a panel you cannot delete it from. */
  for (const group of model.groups) if (!seen.has(group.id)) walk(group.id, 0);
  return rows;
}

export function buildUi(store: EditorStore): UiState {
  const validation = store.validation();
  return {
    toolId: store.toolId,
    units: store.units,
    gridSize: store.gridSize,
    gridMode: store.gridMode,
    snapToGrid: store.snapToGrid,
    cursor: store.pointer.world,
    edgeCount: store.doc.edgeCount,
    validation,
    shapeMode: store.shapeMode,
    canExport:
      (!store.doc.isEmpty || store.schematic.placements.length > 0) &&
      (!store.shapeMode || validation.valid),
    hint: { text: store.hintText, visible: store.hintVisible },
    measurement: store.measurement,
    tracing: store.tracing
      ? {
          visible: store.tracing.visible,
          opacity: store.tracing.opacity,
          worldWidth: store.tracing.worldWidth,
        }
      : null,
    calibrationActive: store.calibration.active,
    calibrationBox: store.calibrationBox,
    dyn: store.buildDynUi(),
    layers: Array.from(store.layers.values()),
    activeLayerId: store.activeLayerId,
    selectionSize: store.selection.size,
    selectionProtected:
      store.selection.size > 0
        ? Array.from(store.selection).every((id) => store.doc.edge(id)?.protected)
        : false,
    flow: {
      definitionId: store.flowDefinitionId,
      placements: store.schematic.placements.length,
      connectors: store.schematic.connectors.length,
      groups: store.schematic.groups.length,
    },
    groups: groupRows(store),
    bigPicture: {
      reachable: store.bigPicture.reachable,
      filed: store.bigPicture.filed,
      dirty: store.bigPicture.dirty,
      savedAt: store.bigPicture.savedAt,
      message: store.bigPicture.message,
    },
  };

}
