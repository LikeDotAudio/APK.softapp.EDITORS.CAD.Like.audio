// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BlockDefinition, BlockPlacement, Port, PortPortal, SchematicModel } from '../../core/types';
import { portsOf, type ResolvedPort } from '../../flow/Schematic';
import { placementVector } from '../../flow/placement';
import { portOffset, portsOnSide, sideNormal } from '../../flow/portLocalPoint';
import type { Scene } from '../Scene';
import { UI_FONT } from '../palette';
import { fit } from './drawHat';
import { FLOW, portColor } from './flowColors';
import { recordFlyHit } from './flyHits';
import { flyPortals } from '../../flow/fly';

/**
 * A PORT, END TO END (the owner's sheet, 2026-11-07, and: "I want to see the connector
 * and the connector on the outside of the box connecting… and the text of what
 * connector is there"; "the connector can be the colour of the dots"; "i want words").
 *
 *   inside the box │ on the edge │ outside
 *   Port #  ◀──────│──── ● ──────│── [PLUG TYPE]■── wire ── ( DEVICE : PORT  FLY IN/OFF )
 *   VIRTUAL NAME ] │             │                          or ▶ PORTAL (a patch-bay position)
 *
 * The dot on the edge; the port's own name beside it inside the box; a run of ports
 * sharing a group bracketed inside with the group's VIRTUAL NAME; outside, the plug's
 * tab naming its connector, the lug at its tip (green), a stub of wire, and — when the
 * host names the far end — the fly-in / fly-off capsule (another block) or the portal
 * arrow (a patch-bay position). Everything in the port's colour but the lug and the
 * portal arrow. Geometry in drawing units (mm), words never smaller than WORDS_MIN_PX:
 * the tab grows to hold its word; words step aside only when the ports are too close.
 */
export const PORT_DRAW = { dot: 1.4, tab: 16, tabH: 3.8, stub: 6, gap: 1.2, text: 3.0, farRoom: 44 } as const;
/** The smallest the words are drawn, in screen px. */
export const WORDS_MIN_PX = 10;
/* Stronger words (the owner, 2026-11-07: "stronger more meaningful"): bright and semi-bold. */
const WORD_FONT = (px: number) => `600 ${Math.round(px)}px ${UI_FONT}`;
const LUG = '#22c55e';
const PORTAL_ARROW = '#facc15';

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** The name a port shows beside its dot: its own within its group, else its label. */
export function portWords(port: Pick<Port, 'label' | 'id' | 'member'>): string {
  return port.member || port.label || port.id;
}

/** Screen px between neighbouring ports on a side (Infinity for a lone port). */
function spacingPx(def: BlockDefinition, side: Port['side'], z: number): number {
  const offsets = portsOnSide(def, side).map((p) => portOffset(def, p)).sort((a, b) => a - b);
  const span = side === 'input' || side === 'output' ? def.size.h : def.size.w;
  let spacing = Infinity;
  for (let i = 1; i < offsets.length; i++) spacing = Math.min(spacing, (offsets[i]! - offsets[i - 1]!) * span * z);
  return spacing;
}

/** The px a side's words are drawn at for this zoom, or 0 when the ports are too close for any. */
export function wordsPx(def: BlockDefinition, side: Port['side'], z: number): number {
  if (!portsOnSide(def, side).length) return 0;
  const px = Math.min(Math.max(PORT_DRAW.text * z, WORDS_MIN_PX), spacingPx(def, side, z) * 0.85);
  return px >= 5 ? px : 0;
}

/** A plug tab's length in px for its word. */
const tabPx = (word: string, px: number, z: number) => Math.max(PORT_DRAW.tab * z, Math.min(word.length * px * 0.62, PORT_DRAW.tab * z * 1.5) + 8);

/** How far below the box (screen px) the bottom ports' plugs reach, so the block's own label sits past them. */
export function wordsBelowPx(def: BlockDefinition, z: number): number {
  const bottom = portsOnSide(def, 'power');
  if (!bottom.length) return 0;
  const px = wordsPx(def, 'power', z) || WORDS_MIN_PX;
  let tab = 0;
  for (const p of bottom) tab = Math.max(tab, p.connector ? tabPx(p.connector, px, z) : 0);
  return PORT_DRAW.dot * z + tab + px + PORT_DRAW.stub * z + 4;
}

interface Frame { colour: string; px: number; spacing: number; z: number; flip: boolean }

/** The portal past the wire stub: a capsule naming another block's port, or a patch-bay arrow. */
function drawFarEnd(ctx: CanvasRenderingContext2D, far: PortPortal, x: number, f: Frame, inward: boolean, hit: { placementId: number; portId: string }): void {
  const px = Math.max(f.px, WORDS_MIN_PX);
  ctx.font = WORD_FONT(px);
  const room = Math.max(PORT_DRAW.farRoom * f.z, 70);
  const name = fit(ctx, far.text, room);
  const text = far.wired ? `${name}  ${inward ? '(FLY IN)' : '(FLY OFF)'}` : name;
  const where = far.to?.drawing ? ` ⧉ ${far.to.drawing}` : '';
  const w = ctx.measureText(text).width + px * 1.6;
  const h = Math.min(px + 6, Math.max(f.spacing * 0.9, px + 2));
  {
    // where it landed on the canvas, for a click (flyClick.ts): the box's corners through the current transform
    const m = ctx.getTransform();
    const pts = [[x, -h / 2], [x + w + h, -h / 2], [x, h / 2], [x + w + h, h / 2]].map(([px2, py2]) => ({
      x: (m.a * px2! + m.c * py2! + m.e), y: (m.b * px2! + m.d * py2! + m.f) }));
    recordFlyHit({ x1: Math.min(...pts.map((p) => p.x)), y1: Math.min(...pts.map((p) => p.y)), x2: Math.max(...pts.map((p) => p.x)),
                   y2: Math.max(...pts.map((p) => p.y)), ...hit, far });
  }
  ctx.beginPath();
  if (far.wired) {
    ctx.roundRect(x, -h / 2, w, h, h / 2);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = f.colour;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = f.colour;
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    // PORTAL IN points at the box, PORTAL OUT away from it
    const tip = h / 2;
    if (inward) { ctx.moveTo(x, 0); ctx.lineTo(x + tip, -h / 2); ctx.lineTo(x + w + tip, -h / 2); ctx.lineTo(x + w + tip, h / 2); ctx.lineTo(x + tip, h / 2); }
    else { ctx.moveTo(x, -h / 2); ctx.lineTo(x + w, -h / 2); ctx.lineTo(x + w + tip, 0); ctx.lineTo(x + w, h / 2); ctx.lineTo(x, h / 2); }
    ctx.closePath();
    ctx.fillStyle = PORTAL_ARROW;
    ctx.fill();
  }
  ctx.save();
  ctx.translate(x + w / 2 + (far.wired ? 0 : inward ? h / 2 : 0), 0);
  if (f.flip) ctx.rotate(Math.PI);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = far.wired ? '#ffffff' : '#111827';
  ctx.fillText(text + where, 0, 0);
  ctx.restore();
}

/** One port, in its own frame: origin on the dot, +x out of the box. */
function drawPort(ctx: CanvasRenderingContext2D, port: Port, far: PortPortal | undefined, f: Frame, insideRoom: number, placementId: number, flyOff?: boolean): void {
  const z = f.z;
  const r = clamp(PORT_DRAW.dot * z, 2.2, Math.max(2.2, f.spacing * 0.42));
  const th = clamp(PORT_DRAW.tabH * z, Math.max(3, f.px + 3), Math.max(3, f.spacing * 0.85));
  let x = r;
  ctx.font = WORD_FONT(Math.max(f.px, 1));
  if (port.connector) {
    // the plug's tab, naming its connector — its first letters, all of it once there is room
    const plug = f.px ? fit(ctx, port.connector, Math.max(PORT_DRAW.tab * z * 1.5, 40) - 8) : '';
    const len = f.px ? Math.max(PORT_DRAW.tab * z, ctx.measureText(plug).width + 8) : PORT_DRAW.tab * z;
    ctx.beginPath();
    ctx.rect(x, -th / 2, len, th);
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = f.colour;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = f.colour;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    if (f.px) {
      ctx.save();
      ctx.translate(x + len / 2, 0);
      if (f.flip) ctx.rotate(Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(plug, 0, 0);
      ctx.restore();
    }
    x += len;
    // the lug at its tip
    const lug = Math.max(3, th * 0.6);
    ctx.fillStyle = LUG;
    ctx.fillRect(x, -lug / 2, lug, lug);
    x += lug;
  }
  // a stub of wire
  const stub = Math.max(PORT_DRAW.stub * z, 8);
  ctx.beginPath();
  ctx.moveTo(port.connector ? x : r, 0);
  ctx.lineTo(x + stub, 0);
  ctx.strokeStyle = f.colour;
  ctx.lineWidth = Math.max(1.2, Math.min(3, 0.6 * z));
  ctx.stroke();
  x += stub;
  if (far) drawFarEnd(ctx, far, x + 2, f, flyOff === undefined ? port.side === 'input' : !flyOff, { placementId, portId: port.id });
  // the dot, on the edge
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = f.colour;
  ctx.fill();
  // its name, inside the box
  if (f.px) {
    ctx.save();
    ctx.font = WORD_FONT(f.px);
    ctx.fillStyle = FLOW.portWord;
    ctx.textBaseline = 'middle';
    const at = r + PORT_DRAW.gap * z + 2;
    const word = fit(ctx, portWords(port), insideRoom);
    if (f.flip) { ctx.rotate(Math.PI); ctx.textAlign = 'left'; ctx.fillText(word, at, 0); }
    else { ctx.textAlign = 'right'; ctx.fillText(word, -at, 0); }
    ctx.restore();
  }
}

/** Runs of neighbouring ports sharing a group, in side order. */
function groupRuns(on: ResolvedPort[], def: BlockDefinition): ResolvedPort[][] {
  const sorted = [...on].sort((a, b) => portOffset(def, a.port) - portOffset(def, b.port));
  const runs: ResolvedPort[][] = [];
  for (const r of sorted) {
    const last = runs.at(-1);
    if (r.port.group && last && last[0]!.port.group === r.port.group) last.push(r);
    else runs.push([r]);
  }
  return runs.filter((run) => run.length > 1 && run[0]!.port.group);
}

export function drawConnectors(scene: Scene, model: SchematicModel, placement: BlockPlacement, def: BlockDefinition): void {
  const { ctx, view } = scene;
  const z = view.zoom * (placement.scale ?? 1);
  if (PORT_DRAW.dot * z < 0.6) return;   // too small to tell one port from the next
  const resolved = portsOf(model, placement.id);
  const fly = flyPortals(model, placement.id);   // wires drawn as fly pairs (flow/fly.ts)
  const insideRoom = (side: Port['side']) => (side === 'input' || side === 'output' ? def.size.w * z * 0.42 : def.size.h * z * 0.3);
  for (const side of ['input', 'output', 'control', 'power'] as const) {
    const on = resolved.filter((r) => r.port.side === side);
    if (!on.length) continue;
    const px = wordsPx(def, side, z);
    const spacing = spacingPx(def, side, z);
    const n = placementVector(placement, sideNormal(side));
    // screen y runs down: the normal's angle on screen is mirrored
    const angle = Math.atan2(-n.y, n.x);
    const flip = Math.cos(angle) < -0.5;
    let widest = 0;
    for (const r of on) {
      const colour = portColor(r.port);
      const at = view.toScreen(r.world.x, r.world.y);
      ctx.save();
      ctx.translate(at.x, at.y);
      ctx.rotate(angle);
      const flown = fly.get(r.port.id);
      drawPort(ctx, r.port, placement.portals?.[r.port.id] ?? flown?.far, { colour, px, spacing: Number.isFinite(spacing) ? spacing : 40, z, flip },
               insideRoom(side), placement.id, placement.portals?.[r.port.id] ? undefined : flown?.off);
      ctx.restore();
      if (px) { ctx.font = WORD_FONT(px); widest = Math.max(widest, Math.min(ctx.measureText(portWords(r.port)).width, insideRoom(side))); }
    }
    // a run sharing a group: bracketed inside, beyond the names, with its VIRTUAL NAME
    if (side !== 'input' && side !== 'output') continue;
    const sn = { x: n.x, y: -n.y };   // the outward normal on screen
    const d = PORT_DRAW.dot * z + PORT_DRAW.gap * z + 2 + widest + 6;
    for (const run of groupRuns(on, def)) {
      const a = view.toScreen(run[0]!.world.x, run[0]!.world.y);
      const b = view.toScreen(run.at(-1)!.world.x, run.at(-1)!.world.y);
      const tick = 5;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(a.x - sn.x * d + sn.x * tick, a.y - sn.y * d + sn.y * tick);
      ctx.lineTo(a.x - sn.x * d, a.y - sn.y * d);
      ctx.lineTo(b.x - sn.x * d, b.y - sn.y * d);
      ctx.lineTo(b.x - sn.x * d + sn.x * tick, b.y - sn.y * d + sn.y * tick);
      ctx.strokeStyle = FLOW.bracket;
      ctx.lineWidth = 2;
      ctx.stroke();
      if (px) {
        const mx = (a.x + b.x) / 2 - sn.x * (d + 5);
        const my = (a.y + b.y) / 2 - sn.y * (d + 5);
        ctx.font = `bold ${Math.round(px)}px ${UI_FONT}`;
        ctx.fillStyle = FLOW.bracketText;
        ctx.textBaseline = 'middle';
        ctx.textAlign = sn.x > 0 ? 'right' : 'left';
        ctx.fillText(fit(ctx, run[0]!.port.group!.toUpperCase(), def.size.w * z * 0.3), mx, my);
      }
      ctx.restore();
    }
  }
}
