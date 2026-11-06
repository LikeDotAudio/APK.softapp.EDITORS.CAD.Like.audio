// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { SchematicModel } from '../../core/types';
import { depthOf, groupBounds, membersDeep } from '../../flow/groups';
import { FONT, UI_FONT } from '../palette';
import { groupLabel } from './refdesLabel';
import type { Scene } from '../Scene';
import { GROUP } from './flowColors';

/** A collapsed group is drawn this tall, in screen pixels, whatever it holds. */
const COLLAPSED_H = 34;

/**
 * Paint the containers, shallowest first so a child's line lands on top of its
 * parent's fill rather than under it.
 *
 * Every rectangle here is DERIVED - `groupBounds` measures the placements the
 * group holds, every frame. Nothing about a group's geometry is stored, so
 * dragging a block re-shapes its group, its group's group, and so on up, with
 * no invalidation step to forget.
 *
 * DEPTH IS DRAWN AS INK, NOT AS HUE: one colour, faded by how deep the group
 * sits. A palette per level would be saying something about what is in a group,
 * which this drawing has no way to know.
 */
export function drawGroups(scene: Scene, model: SchematicModel | undefined): void {
  if (!model || model.groups.length === 0) return;
  const { ctx, view } = scene;

  const ordered = model.groups
    .map((group) => ({ group, depth: depthOf(model, group.id) }))
    .sort((a, b) => a.depth - b.depth);

  ctx.save();
  for (const { group, depth } of ordered) {
    const box = groupBounds(model, group.id);
    if (!box) continue;

    const a = view.toScreen(box.x1, box.y1);
    const b = view.toScreen(box.x2, box.y2);
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const w = Math.abs(b.x - a.x);
    const h = group.collapsed ? COLLAPSED_H : Math.abs(b.y - a.y);

    /* Fade with depth, floored: a group five deep must still be visible, and a
       nesting deeper than four levels is a drawing problem rather than a
       rendering one. */
    const ink = Math.max(0.4, 1 - depth * 0.18);
    ctx.globalAlpha = ink;

    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fillStyle = group.collapsed ? GROUP.collapsedFill : GROUP.fill;
    ctx.fill();
    ctx.strokeStyle = GROUP.border;
    ctx.lineWidth = 1.2;
    ctx.setLineDash(group.collapsed ? [] : [7, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = GROUP.label;
    if (group.hostKey) {
      /* A host's group (a maker on Library Equipment, ROAD-3569): one label, sized with the
         sheet — GROUP_LABEL_UNITS tall, clipped to the frame, gone when too small to read —
         and no separate count: the host's name already says it. A fixed-size label over a
         hundred small groups printed them over one another. */
      const room = Math.max(w - 8, (group.labelWidth ?? 0) * view.zoom);
      const label = groupLabel(group.name, view.zoom, room, (t, px) => {
        ctx.font = `bold ${px}px ${UI_FONT}`;
        return ctx.measureText(t).width;
      });
      if (label) {
        ctx.font = `bold ${label.px}px ${UI_FONT}`;
        ctx.fillText(label.text, x + 4, y - 3);
      }
      ctx.globalAlpha = 1;
      continue;
    }
    ctx.font = FONT.marker;
    ctx.fillText(group.name, x + 4, y - 3);

    /* The count is the whole reason to fold one shut, so it is said whether or
       not it is folded: a box round nine things should say nine. */
    const held = membersDeep(model, group.id).length;
    const kids = group.children.length;
    const caption = kids > 0 ? `${held} · ${kids} group${kids === 1 ? '' : 's'}` : `${held}`;
    ctx.fillStyle = GROUP.count;
    ctx.textAlign = 'right';
    ctx.fillText(caption, x + w - 4, y - 3);

    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
