// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Layer, SchematicModel } from '../../core/types';
import { hostPicked } from '../../flow/hostSelection';
import { hostLineWidth } from '../edges/layerStroke';
import { wirePath } from '../../flow/cables';
import { outlineCorners } from '../../flow/placement';
import { definitionFor, portsOf } from '../../flow/Schematic';
import { FONT, UI_FONT } from '../palette';
import { refdesLabel } from './refdesLabel';
import type { Scene } from '../Scene';
import { drawConnectors, wordsBelowPx, PORT_DRAW } from './drawConnectors';
import { drawHat } from './drawHat';
import { clearFlyHits } from './flyHits';
import { FLOW, portColor } from './flowColors';

const PORT_PX = 4;

/**
 * Paint the schematic layer: group containment cards, auto-routed chamfered
 * Manhattan waterfall wires, block outlines, glyphs, ports, and refdes badges.
 */
export function drawSchematic(scene: Scene, model: SchematicModel | undefined, layers?: ReadonlyMap<string, Layer>): void {
  if (!model || (model.placements.length === 0 && model.connectors.length === 0 && model.groups.length === 0)) return;
  const { ctx, view } = scene;

  ctx.save();

  // 1. The groups are drawGroups.ts's, called just before this: drawing them here too
  //    printed every group's name twice, one over the other (Library Equipment, 2026-11-06).

  // 2. Connectors: Auto-routed chamfered waterfall paths
  ctx.strokeStyle = FLOW.connector;
  ctx.lineWidth = 1.6;

  clearFlyHits();
  model.connectors.forEach((connector, connIdx) => {
    if (connector.fly) return;   // a fly pair: its two capsules say it (drawConnectors, flow/fly.ts)
    // its own route, else the auto-routed chamfered waterfall (flow/cables.ts wirePath, the hit test's too)
    const worldRoute = wirePath(model, connector, connIdx);
    if (!worldRoute) return;

    const points = worldRoute.map((p) => view.toScreen(p.x, p.y));

    // a wire that is a real cable (Connector.cable) is drawn heavier, its label beside it
    ctx.lineWidth = connector.cable ? 3 : 1.6;
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();

    // Wire label (if specified), and the cable's own label under it
    const text = [connector.label, connector.cable?.tag].filter(Boolean).join(' · ');
    if (text && points.length >= 2) {
      const midIdx = Math.floor(points.length / 2);
      const mid = points[midIdx];
      ctx.font = '9px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(text, mid.x, mid.y - 2);
    }
  });
  ctx.lineWidth = 1.6;

  // 3. Block Placements — a host's picked ones (hostSelection.ts) drawn picked
  const picked = new Set(hostPicked(model));
  for (const placement of model.placements) {
    const def = definitionFor(model, placement);
    if (!def) continue;

    const corners = outlineCorners(def, placement).map((p) => view.toScreen(p.x, p.y));
    ctx.beginPath();
    corners.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    const isPicked = picked.has(placement.id);
    // a BIM block (it has a header) is solid, not see-through, and outlined heavier (the owner, 2026-11-07:
    // "should be a solid colour", "not translucent", "thicker borders")
    const solid = Boolean(def.hat);
    ctx.fillStyle = solid ? (isPicked ? FLOW.bodyPicked : FLOW.body) : isPicked ? FLOW.pickedFill : FLOW.outlineFill;
    ctx.fill();
    ctx.strokeStyle = isPicked ? FLOW.picked : FLOW.outline;
    // the layer's lineweight (a host's WEIGHT knob, host@1 `layer` { lineweight })
    const weight = hostLineWidth(layers?.get(placement.layerId), 1.4);
    ctx.lineWidth = solid ? (isPicked ? Math.max(4, weight + 2.5) : Math.max(3, weight + 1.5))
      : isPicked ? Math.max(2.5, weight + 1) : weight;
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

    // the header inside the box, then each port end to end — dot, name, plug, lug, wire, far end (drawConnectors)
    drawHat(scene, def, corners, view.zoom * (placement.scale ?? 1), isPicked);
    if (PORT_DRAW.dot * view.zoom * (placement.scale ?? 1) >= 0.6) drawConnectors(scene, model, placement, def);
    else {
      for (const resolved of portsOf(model, placement.id)) {
        const s = view.toScreen(resolved.world.x, resolved.world.y);
        ctx.fillStyle = portColor(resolved.port);
        ctx.fillRect(s.x - PORT_PX / 2, s.y - PORT_PX / 2, PORT_PX, PORT_PX);
      }
    }

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
        ctx.fillText(label.text, centre.x, centre.y + (def.size.h / 2) * scale + wordsBelowPx(def, scale) + label.px * 0.4);
      }
    } else if (placement.refdes) {
      ctx.font = FONT.marker;
      ctx.fillStyle = FLOW.refdes;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const z = view.zoom * (placement.scale ?? 1);
      const half = (def.size.h / 2) * z + wordsBelowPx(def, z);
      ctx.fillText(placement.refdes, centre.x, centre.y + half + 4);
    }
  }

  ctx.restore();
}
