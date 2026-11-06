// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { SchematicModel } from '../../core/types';
import { routeWaterfallWire } from '../../flow/autoWire';
import { outlineCorners } from '../../flow/placement';
import { definitionFor, portOf, portsOf, portWorldPoint } from '../../flow/Schematic';
import { FONT, UI_FONT } from '../palette';
import { refdesLabel } from './refdesLabel';
import type { Scene } from '../Scene';
import { drawPortals } from './drawPortals';
import { FLOW, SIDE_COLOR } from './flowColors';

const PORT_PX = 4;

/**
 * Paint the schematic layer: group containment cards, auto-routed chamfered
 * Manhattan waterfall wires, block outlines, glyphs, ports, and refdes badges.
 */
export function drawSchematic(scene: Scene, model: SchematicModel | undefined): void {
  if (!model || (model.placements.length === 0 && model.connectors.length === 0 && model.groups.length === 0)) return;
  const { ctx, view } = scene;

  ctx.save();

  // 1. The groups are drawGroups.ts's, called just before this: drawing them here too
  //    printed every group's name twice, one over the other (Library Equipment, 2026-11-06).

  // 2. Connectors: Auto-routed chamfered waterfall paths
  ctx.strokeStyle = FLOW.connector;
  ctx.lineWidth = 1.6;

  model.connectors.forEach((connector, connIdx) => {
    const a = portWorldPoint(model, connector.from);
    const b = portWorldPoint(model, connector.to);
    if (!a || !b) return;

    const fromPort = portOf(model, connector.from);
    const toPort = portOf(model, connector.to);

    // If no manual route is specified, use auto-routed chamfered waterfall
    const worldRoute =
      connector.route && connector.route.length > 0
        ? [a, ...connector.route, b]
        : routeWaterfallWire(a, b, {
            sourceSide: fromPort?.side ?? 'output',
            targetSide: toPort?.side ?? 'input',
            laneIndex: connIdx % 4,
          });

    const points = worldRoute.map((p) => view.toScreen(p.x, p.y));

    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();

    // Wire label (if specified)
    if (connector.label && points.length >= 2) {
      const midIdx = Math.floor(points.length / 2);
      const mid = points[midIdx];
      ctx.font = '9px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(connector.label, mid.x, mid.y - 2);
    }
  });

  // 3. Block Placements
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
    drawPortals(scene, model, placement);

    const centre = view.toScreen(placement.at.x, placement.at.y);
    if (placement.refdes && placement.hostKey) {
      // a host's block: its name sized by the block, clipped, hidden when too small (refdesLabel.ts)
      const scale = view.zoom * (placement.scale ?? 1);
      const label = refdesLabel(placement.refdes, def.size.w * scale, (t, px) => {
        ctx.font = `bold ${px}px ${UI_FONT}`;
        return ctx.measureText(t).width;
      });
      if (label) {
        ctx.font = `bold ${label.px}px ${UI_FONT}`;
        ctx.fillStyle = FLOW.refdes;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label.text, centre.x, centre.y + (def.size.h / 2) * scale + label.px * 0.4);
      }
    } else if (placement.refdes) {
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
