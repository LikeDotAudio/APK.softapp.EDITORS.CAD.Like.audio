// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BlockPlacement, Connector, PortPortal, SchematicModel } from '../core/types';
import { definitionFor } from './Schematic';

/**
 * FLY-OFFS AND FLY-ONS (the owner, 2026-11-07: "the cad should support fly on and
 * fly offs to other drawings and parts of the drawing"). A connection drawn as two
 * named capsules instead of a line — the same connection, said twice where its ends
 * are, never drawn twice. Two kinds:
 *
 *  - a wire made a fly pair (`Connector.fly`): its line is not drawn; each end shows a
 *    capsule naming the other end, FLY OFF where the signal leaves, FLY ON where it lands;
 *  - a portal a host or a saved sheet names (`BlockPlacement.portals`): `to` says where
 *    the far end is — a placement here, or another drawing (`to.drawing`), else the far
 *    end is read from its text (`U106 fabric 91`: a refdes, then a port).
 *
 * A click on a capsule goes to its far end (flyClick.ts). Pure: no DOM, no store.
 */

/** Where a fly capsule leads. */
export interface FlyTarget { placementId: number; portId?: string; drawing?: string }

const fold = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** A refdes's first word: `U106 · Chromecast…` → `u106`. */
const refWord = (p: BlockPlacement) => fold(p.refdes ?? '').split(' ')[0] ?? '';

/** The far end a portal names: by its `to`, else read from its text — a refdes word, then a port caption. */
export function resolvePortal(model: SchematicModel, far: PortPortal): FlyTarget | null {
  if (far.to?.drawing) return { placementId: -1, drawing: far.to.drawing, ...(far.to.port ? { portId: far.to.port } : {}) };
  if (typeof far.to?.placementId === 'number' && model.placements.some((p) => p.id === far.to!.placementId)) {
    return { placementId: far.to.placementId, ...(far.to.port ? { portId: far.to.port } : {}) };
  }
  const words = fold(far.to?.refdes ? `${far.to.refdes} ${far.to.port ?? ''}` : far.text).replace(/\b(fly (in|on|off))\b/g, '').trim();
  const [head, ...rest] = words.split(' ');
  if (!head) return null;
  const placement = model.placements.find((p) => refWord(p) === head);
  if (!placement) return null;
  const want = rest.join(' ');
  const def = definitionFor(model, placement);
  const port = want && def ? def.ports.find((p) => fold(p.label ?? p.id) === want) ?? def.ports.find((p) => fold(p.id) === want) : undefined;
  return { placementId: placement.id, ...(port ? { portId: port.id } : {}) };
}

/** How an end of a wire is named on the far capsule: `U106 : fabric 91`. */
export function endName(model: SchematicModel, end: Connector['from']): string {
  const placement = model.placements.find((p) => p.id === end.placementId);
  const def = placement ? definitionFor(model, placement) : undefined;
  const port = def?.ports.find((p) => p.id === end.portId);
  const ref = (placement?.refdes ?? `#${end.placementId}`).split(' · ')[0];
  return `${ref} : ${port?.label ?? end.portId}`;
}

/**
 * The capsules this placement's ports show for wires drawn as fly pairs: port id →
 * the far end as a portal (`wired`, with `to`), and whether this end is where the
 * signal leaves (FLY OFF) or lands (FLY ON).
 */
export function flyPortals(model: SchematicModel, placementId: number): Map<string, { far: PortPortal; off: boolean }> {
  const out = new Map<string, { far: PortPortal; off: boolean }>();
  for (const c of model.connectors) {
    if (!c.fly) continue;
    for (const [here, there, off] of [[c.from, c.to, true], [c.to, c.from, false]] as const) {
      if (here.placementId !== placementId || out.has(here.portId)) continue;
      out.set(here.portId, { far: { text: endName(model, there), wired: true, to: { placementId: there.placementId, port: there.portId } }, off });
    }
  }
  return out;
}

/** Make the wires touching these placements fly pairs, or lines again when they all already fly. Returns how many changed. */
export function toggleFly(model: SchematicModel, placementIds: readonly number[]): number {
  const ids = new Set(placementIds);
  const wires = model.connectors.filter((c) => ids.has(c.from.placementId) || ids.has(c.to.placementId));
  if (!wires.length) return 0;
  const fly = !wires.every((c) => c.fly);
  for (const c of wires) { if (fly) c.fly = true; else delete c.fly; }
  return wires.length;
}
