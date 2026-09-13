// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { outlineCorners } from '../flow/placement';
import { definitionOf, hitPlacementAt, placeBlock, removePlacement } from '../flow/Schematic';
import { FLOW } from '../render/flow/flowColors';
import type { Tool } from './types';

/**
 * Place a Flow block. Which symbol is placed is the sidebar's Flow panel's
 * business, not this tool's - the toolbar would need a button per symbol
 * otherwise, and the catalogue is meant to grow.
 */
interface FlowState {
  placed: number;
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="5" width="8" height="6" />
    <line x1="1" y1="8" x2="4" y2="8" />
    <line x1="12" y1="8" x2="15" y2="8" />
    <line x1="8" y1="2" x2="8" y2="5" />
    <line x1="8" y1="11" x2="8" y2="14" />
  </svg>
);

export const flowTool: Tool<FlowState> = {
  id: 'flow',
  label: 'Flow',
  shortcut: 'f',
  title: 'Flow block (F)',
  hint: 'Click to place the Flow symbol · pick another in the Flow panel · Ctrl-click a block to remove it',
  icon: Icon,
  cursor: 'copy',
  snaps: true,

  createState: () => ({ placed: 0 }),

  onPointerDown(state, input, api) {
    if (input.ctrlKey || input.metaKey) {
      const hit = hitPlacementAt(api.schematic, input.rawWorld);
      if (hit) {
        api.editFlow(() => removePlacement(api.schematic, hit.id));
        api.showHint(`Removed ${hit.refdes ?? `#${hit.id}`}.`, 2000);
      }
      return;
    }
    const placement = api.editFlow(() =>
      placeBlock(api.schematic, api.flowDefinitionId, input.world, api.activeLayerId) !== null,
    );
    if (placement) state.placed += 1;
  },

  drawPreview(_state, scene) {
    const { ctx, view, pointer, schematic } = scene;
    if (!schematic) return;
    const def = definitionOf(schematic, scene.flowDefinitionId ?? '');
    if (!def) return;
    const ghost = outlineCorners(def, {
      id: -1,
      definitionId: def.id,
      at: pointer.world,
      layerId: '0',
    }).map((p) => view.toScreen(p.x, p.y));
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = FLOW.outline;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ghost.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  },
};
