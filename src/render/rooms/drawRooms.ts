// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CadSpace, Layer } from '../../core/types';
import { CANVAS, FONT } from '../palette';
import type { Scene } from '../Scene';
import { roomLabel } from './roomLabel';

/**
 * DECLARED ROOMS ON THE CANVAS (ROAD-3581)
 *
 * A room the user declared (Modify ▸ Declare Room) is an IfcSpace in the
 * .ifc; here it is drawn so it can be seen: a dashed
 * outline on its edges, a faint floor tint, and its name with its floor area at its centre.
 * Behind the linework (drawn before the edges), its label on top of it. A
 * room on a hidden layer is not drawn.
 */
export function drawRoomFloors(scene: Scene, spaces: readonly CadSpace[] | undefined, layers?: ReadonlyMap<string, Layer>): void {
  const { ctx, view } = scene;
  const shown = visibleRooms(spaces, layers);
  if (!shown.length) return;
  ctx.save();
  for (const s of shown) {
    const pts = s.points.map((p) => view.toScreen(p.x, p.y));
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = CANVAS.roomFill;
    ctx.fill();
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = CANVAS.room;
    ctx.stroke();
  }
  ctx.restore();
}

/** The name and area of every shown room, at its centre, in screen-fixed type. */
export function drawRoomLabels(scene: Scene, spaces: readonly CadSpace[] | undefined, layers?: ReadonlyMap<string, Layer>): void {
  const { ctx, view } = scene;
  const shown = visibleRooms(spaces, layers);
  if (!shown.length) return;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const s of shown) {
    const { name, area, at } = roomLabel(s);
    const c = view.toScreen(at.x, at.y);
    ctx.font = FONT.room;
    const w = Math.max(ctx.measureText(name).width, (ctx.font = FONT.roomArea, ctx.measureText(area).width));
    ctx.fillStyle = CANVAS.labelBackdrop;
    ctx.fillRect(c.x - w / 2 - 4, c.y - 15, w + 8, 30);
    ctx.font = FONT.room;
    ctx.fillStyle = CANVAS.roomText;
    ctx.fillText(name, c.x, c.y - 6);
    ctx.font = FONT.roomArea;
    ctx.fillText(area, c.x, c.y + 7);
  }
  ctx.restore();
}

function visibleRooms(spaces: readonly CadSpace[] | undefined, layers?: ReadonlyMap<string, Layer>): CadSpace[] {
  return (spaces ?? []).filter((s) => s.points.length >= 3 && layers?.get(s.layerId)?.visible !== false);
}
