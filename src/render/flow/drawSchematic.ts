// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { SchematicModel } from '../../core/types';
import { outlineCorners } from '../../flow/placement';
import { definitionFor, portsOf, portWorldPoint } from '../../flow/Schematic';
import { FONT } from '../palette';
import type { Scene } from '../Scene';
import { FLOW, SIDE_COLOR } from './flowColors';

const PORT_PX = 4;

/**
 * Paint the schematic layer: block outlines, their glyphs, their ports coloured
 * by side, and the connectors between them.
 *
 * Connectors are drawn from the ports' DERIVED positions, so a block that moves
 * or turns takes its wires with it and no stored endpoint can go stale.
 */
export function drawSchematic(scene: Scene, model: SchematicModel | undefined): void {
  if (!model || (model.placements.length === 0 && model.connectors.length === 0)) return;
  const { ctx, view } = scene;

  ctx.save();

  // Connectors first, so a wire passes behind the blocks it lands on.
  ctx.strokeStyle = FLOW.connector;
  ctx.lineWidth = 1.6;
  for (const connector of model.connectors) {
    const a = portWorldPoint(model, connector.from);
    const b = portWorldPoint(model, connector.to);
    if (!a || !b) continue;
    const points = [a, ...(connector.route ?? []), b].map((p) => view.toScreen(p.x, p.y));
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  }

  for (const placement of model.placements) {
    const def = definitionFor(model, placement);
    if (!def) continue;

    const corners = outlineCorners(def, placement).map((p) => view.toScreen(p.x, p.y));
    ctx.beginPath();
    corners.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = FLOW.outlineFill;
    ctx.fill();
    ctx.strokeStyle = FLOW.outline;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.strokeStyle = FLOW.glyph;
    ctx.lineWidth = 1.2;
    for (const stroke of def.glyph) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      stroke
        .map((local) => {
          const rad = ((placement.rotation ?? 0) * Math.PI) / 180;
          const s = placement.scale ?? 1;
          return view.toScreen(
            placement.at.x + s * (local.x * Math.cos(rad) - local.y * Math.sin(rad)),
            placement.at.y + s * (local.x * Math.sin(rad) + local.y * Math.cos(rad)),
          );
        })
        .forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    }

    for (const resolved of portsOf(model, placement.id)) {
      const s = view.toScreen(resolved.world.x, resolved.world.y);
      ctx.fillStyle = SIDE_COLOR[resolved.port.side];
      ctx.fillRect(s.x - PORT_PX / 2, s.y - PORT_PX / 2, PORT_PX, PORT_PX);
    }

    const centre = view.toScreen(placement.at.x, placement.at.y);
    if (placement.refdes) {
      ctx.font = FONT.marker;
      ctx.fillStyle = FLOW.refdes;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const half = (def.size.h / 2) * view.zoom * (placement.scale ?? 1);
      ctx.fillText(placement.refdes, centre.x, centre.y + half + 4);
    }
  }

  ctx.restore();
}
