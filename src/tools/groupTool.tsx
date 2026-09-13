// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BBox, Point } from '../core/types';
import {
  boundsContain,
  groupBounds,
  hitGroupAt,
  makeGroup,
  toggleCollapsed,
  ungroup,
} from '../flow/groups';
import { GROUP } from '../render/flow/flowColors';
import type { Tool } from './types';

/**
 * THE GROUP TOOL - drag a box, and what the box encloses becomes a group.
 *
 * WHY IT IS A TOOL RATHER THAN AN `EDIT > GROUP` ITEM. The obvious design is
 * "group the selection", and it cannot be built: `store.selection` is a set of
 * DOC EDGE IDS - the vertex graph - and a Flow placement is not in the vertex
 * graph and never has been. There is no selection of blocks to group. So the
 * boundary is DRAWN, which is also the truer verb: on a sheet, a group is a
 * line somebody put round some things.
 *
 * WHAT A DRAG TAKES, AND WHY EACH RULE
 *
 *   a placement   when its CENTRE is inside. Not its outline - a box the drag
 *                 clipped by four thou would otherwise be left outside a group
 *                 it is visibly in, and "did the rectangle fully contain this"
 *                 is a question about the cursor rather than about the bench.
 *   a group       when its whole drawn box is inside. Wholly, because a group
 *                 half-enclosed is genuinely ambiguous and the safe reading of
 *                 an ambiguous gesture is to take the blocks and leave the
 *                 group alone.
 *
 * That second rule is what makes GROUPS OF GROUPS a gesture rather than a menu:
 * draw a box around two racks and you get a room holding two racks, with the
 * racks intact. Draw one around the blocks inside a rack and you get a group
 * inside that rack.
 *
 * Ctrl-click a group to dissolve it; double-click one to fold it shut.
 */
interface GroupState {
  /** World point the drag began at, or null when nothing is being drawn. */
  from: Point | null;
  to: Point | null;
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1.5" y="2.5" width="13" height="11" strokeDasharray="2.5 2" />
    <rect x="4" y="5" width="3.5" height="3" />
    <rect x="8.5" y="8" width="3.5" height="3" />
  </svg>
);

/** The box a drag describes, normalised so either drag direction works. */
function dragBox(state: GroupState): BBox | null {
  if (!state.from || !state.to) return null;
  return {
    x1: Math.min(state.from.x, state.to.x),
    y1: Math.min(state.from.y, state.to.y),
    x2: Math.max(state.from.x, state.to.x),
    y2: Math.max(state.from.y, state.to.y),
  };
}

/** A drag that never moved is a click, and a click is not a group. */
function isTiny(box: BBox): boolean {
  return box.x2 - box.x1 < 0.05 && box.y2 - box.y1 < 0.05;
}

export const groupTool: Tool<GroupState> = {
  id: 'group',
  label: 'Group',
  shortcut: 'g',
  title:
    'Group (G) — drag a box round blocks to group them. A group whose whole box is inside is nested, ' +
    'which is how a group of groups is drawn. Ctrl-click a group to ungroup · double-click to fold it.',
  hint: 'Drag a box round what belongs together · enclose a whole group to nest it · Ctrl-click a group to ungroup · double-click to fold',
  icon: Icon,
  cursor: 'crosshair',
  snaps: false,

  createState: () => ({ from: null, to: null }),

  isDrawing: (state) => state.from !== null,

  onPointerDown(state, input, api) {
    if (input.ctrlKey || input.metaKey) {
      const hit = hitGroupAt(api.schematic, input.rawWorld);
      if (hit) {
        const name = hit.name;
        api.editFlow(() => ungroup(api.schematic, hit.id));
        api.showHint(`Ungrouped ${name}. Its contents stayed where they were.`, 2500);
      }
      return;
    }
    state.from = { ...input.rawWorld };
    state.to = { ...input.rawWorld };
  },

  onPointerMove(state, input, api) {
    if (!state.from) return;
    state.to = { ...input.rawWorld };
    api.redraw();
  },

  onPointerUp(state, _input, api) {
    const box = dragBox(state);
    state.from = null;
    state.to = null;
    if (!box || isTiny(box)) {
      api.redraw();
      return;
    }

    const model = api.schematic;
    const placements = model.placements
      .filter((p) => p.at.x >= box.x1 && p.at.x <= box.x2 && p.at.y >= box.y1 && p.at.y <= box.y2)
      .map((p) => p.id);

    const groups = model.groups
      .filter((g) => {
        const bounds = groupBounds(model, g.id);
        return bounds !== null && boundsContain(box, bounds);
      })
      .map((g) => g.id);

    if (placements.length === 0 && groups.length === 0) {
      api.showHint('That box held nothing. Draw it round some blocks.', 2500);
      api.redraw();
      return;
    }

    const suggested = `GROUP${model.groups.length + 1}`;
    const name = window.prompt('Name this group:', suggested);
    if (name === null) {
      api.redraw();
      return;
    }

    let made = false;
    api.editFlow(() => {
      made = makeGroup(model, placements, groups, name || suggested, api.activeLayerId) !== null;
      return made;
    });
    if (made) {
      const nested = groups.length;
      api.showHint(
        nested > 0
          ? `${name || suggested} — ${placements.length} block${placements.length === 1 ? '' : 's'} and ${nested} group${nested === 1 ? '' : 's'} inside it.`
          : `${name || suggested} — ${placements.length} block${placements.length === 1 ? '' : 's'}.`,
        3500,
      );
    }
  },

  onDoubleClick(_state, input, api) {
    const hit = hitGroupAt(api.schematic, input.rawWorld);
    if (!hit) return;
    api.editFlow(() => toggleCollapsed(api.schematic, hit.id));
  },

  onEscape(state, api) {
    state.from = null;
    state.to = null;
    api.redraw();
  },

  drawPreview(state, scene) {
    const box = dragBox(state);
    if (!box) return;
    const { ctx, view } = scene;
    const a = view.toScreen(box.x1, box.y1);
    const b = view.toScreen(box.x2, box.y2);
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = GROUP.pending;
    ctx.fillStyle = GROUP.pendingFill;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.rect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  },
};
