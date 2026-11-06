// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BlockPlacement, PortPortal, SchematicModel } from '../../core/types';
import { portsOf } from '../../flow/Schematic';
import { placementVector } from '../../flow/placement';
import { sideNormal } from '../../flow/portLocalPoint';
import type { Scene } from '../Scene';
import { FLOW } from './flowColors';

/**
 * PORTALS — the far end of a port, said where the port is (ROAD-3528).
 *
 * The neutral capsule of connectors/Special/Portal.tsx, drawn just beyond the
 * port along its side's outward normal, with the far end's name past it. Accent
 * when the far end is another block (`wired`), grey when it is where the port
 * is permanently cabled in — a patch-bay position. Drawing units (mm on a sheet
 * in mm); the glyph itself is directionless, the side gives the direction.
 */
export const PORTAL = { w: 6.4, h: 3.2, gap: 1.0, text: 2.2 } as const;

/** Where a portal's capsule centre and its text anchor land, in world units. */
export function portalPoints(world: { x: number; y: number }, normal: { x: number; y: number }) {
  const c = PORTAL.gap + PORTAL.w / 2;
  const t = PORTAL.gap + PORTAL.w + PORTAL.gap;
  return {
    centre: { x: world.x + normal.x * c, y: world.y + normal.y * c },
    text: { x: world.x + normal.x * t, y: world.y + normal.y * t },
  };
}

export function drawPortals(scene: Scene, model: SchematicModel, placement: BlockPlacement): void {
  const portals = placement.portals;
  if (!portals) return;
  const { ctx, view } = scene;
  const z = view.zoom * (placement.scale ?? 1);
  for (const resolved of portsOf(model, placement.id)) {
    const far: PortPortal | undefined = portals[resolved.port.id];
    if (!far) continue;
    const n = placementVector(placement, sideNormal(resolved.port.side));
    const { centre, text } = portalPoints(resolved.world, n);
    const colour = far.wired ? FLOW.portalWired : FLOW.portalBay;
    const c = view.toScreen(centre.x, centre.y);
    // screen y runs down: the normal's angle on screen is mirrored
    const angle = Math.atan2(-n.y, n.x);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(angle);
    const w = PORTAL.w * z;
    const h = PORTAL.h * z;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
    if (PORTAL.text * z < 5) continue;   // too small to read: the capsule alone says "it goes somewhere"
    const s = view.toScreen(text.x, text.y);
    ctx.font = `${Math.round(PORTAL.text * z)}px monospace`;
    ctx.fillStyle = colour;
    ctx.textAlign = Math.abs(n.x) < 0.5 ? 'center' : n.x > 0 ? 'left' : 'right';
    ctx.textBaseline = Math.abs(n.y) < 0.5 ? 'middle' : n.y > 0 ? 'bottom' : 'top';
    ctx.fillText(far.text, s.x, s.y);
  }
}
