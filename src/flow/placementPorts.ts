// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BlockDefinition, BlockPlacement, Port, PortSide } from '../core/types';
import { BLOCK } from './bimPart';

/**
 * A DEVICE'S OWN PORTS (the owner, 2026-11-11: "when I am dragging a connector to the
 * device, it should add the connector to the device as needed").
 *
 * The device is the placement; its type is the definition. A connector dropped on a
 * device is this device's fact, so it is kept on the placement in the definition's own
 * port model — `placement.ports` (more `Port`s, same shape) and `placement.portConnectors`
 * (the connector a port of the type left unknown or guessed: `RJ45?`). Nothing else holds
 * a port: `effectiveDefinition` lays the type and the device's additions out as ONE
 * definition, and `definitionFor` (Schematic.ts) answers with it, so the renderer, the hit
 * tests, the wires, IFC and KiCad all read the device as it now is. Pure: no DOM, no store.
 *
 * Layout, derived and never stored: an added port goes under the last port of its side on
 * the block's pitch (BIM blocks, bimPart BLOCK) and the box grows in whole grid steps when
 * it runs out of room; a symbol whose ports are spread evenly (no offsets) just spreads one
 * more. Bottom (power/control) ports go to the right of the last one, 20 apart.
 */

const up = (v: number) => Math.ceil(v / BLOCK.step - 1e-9) * BLOCK.step;
const cache = new WeakMap<BlockPlacement, { base: BlockDefinition; key: string; def: BlockDefinition }>();

/** True when the placement adds to or overrides its definition's ports. */
export function hasOwnPorts(placement: BlockPlacement): boolean {
  return !!(placement.ports?.length || (placement.portConnectors && Object.keys(placement.portConnectors).length));
}

/** The definition as this device has it: the type's ports, the connectors it was given, and the ports it gained. */
export function effectiveDefinition(base: BlockDefinition, placement: BlockPlacement): BlockDefinition {
  if (!hasOwnPorts(placement)) return base;
  const key = JSON.stringify([placement.ports ?? [], placement.portConnectors ?? {}]);
  const hit = cache.get(placement);
  if (hit && hit.base === base && hit.key === key) return hit.def;
  const def = layout(base, placement);
  cache.set(placement, { base, key, def });
  return def;
}

function layout(base: BlockDefinition, placement: BlockPlacement): BlockDefinition {
  const given = placement.portConnectors ?? {};
  const own = (placement.ports ?? []).map((p) => ({ ...p }));
  const ports: Port[] = base.ports.map((p) => (given[p.id] ? { ...p, connector: given[p.id], connectorGuess: undefined } : { ...p }));
  for (const p of own) if (given[p.id]) { p.connector = given[p.id]; delete p.connectorGuess; }
  let { w, h } = base.size;

  /* the vertical sides: rows on the pitch under the last row of that side */
  const rowsY = new Map<Port, number>();
  for (const side of ['input', 'output'] as const) {
    const added = own.filter((p) => p.side === side && typeof p.offset !== 'number');
    if (!added.length) continue;
    const there = ports.filter((p) => p.side === side);
    const laidOut = !!base.hat || there.some((p) => typeof p.offset === 'number');
    if (!laidOut) continue;   // spread evenly: one more on the side is the whole layout
    let y = there.length
      ? Math.max(...there.map((p) => (typeof p.offset === 'number' ? p.offset * base.size.h : 0)))
      : (base.hat?.height ?? BLOCK.header) + BLOCK.pad - BLOCK.pitch;
    for (const p of added) { y += BLOCK.pitch; rowsY.set(p, y); }
  }
  if (rowsY.size) {
    const deepest = Math.max(...rowsY.values());
    const need = up(deepest + BLOCK.pad + (base.hat?.footer ?? (base.hat ? BLOCK.footer : 0)));
    if (need > h) {
      // taller: every row keeps its distance from the top, so its offset is measured again
      for (const p of ports) if ((p.side === 'input' || p.side === 'output') && typeof p.offset === 'number') p.offset = (p.offset * h) / need;
      h = need;
    }
    for (const [p, y] of rowsY) p.offset = y / h;
  }

  /* the bottom (and top): one more to the right, 20 apart */
  for (const side of ['power', 'control'] as const) {
    const added = own.filter((p) => p.side === side && typeof p.offset !== 'number');
    const there = ports.filter((p) => p.side === side);
    if (!added.length || !there.some((p) => typeof p.offset === 'number')) continue;
    let x = Math.max(...there.map((p) => (typeof p.offset === 'number' ? p.offset * w : 0)));
    const xs = added.map(() => (x += BLOCK.perBottomPort));
    const need = up(x + BLOCK.perBottomPort);
    if (need > w) {
      for (const p of ports) if ((p.side === 'power' || p.side === 'control') && typeof p.offset === 'number') p.offset = (p.offset * w) / need;
      w = need;
    }
    added.forEach((p, i) => { p.offset = xs[i]! / w; });
  }

  const all = [...ports, ...own];
  // the hat's "N ports" line counts the device's ports, not only its type's
  const hat = base.hat && own.length
    ? { ...base.hat, lines: base.hat.lines.map((l) => l.replace(/^\d+ ports?\b/, `${all.length} port${all.length === 1 ? '' : 's'}`)) }
    : base.hat;
  return { ...base, size: { w, h }, ports: all, ...(hat ? { hat } : {}) };
}

/** The sides a port can be added on. */
export type AddSide = Extract<PortSide, 'input' | 'output' | 'power'>;
