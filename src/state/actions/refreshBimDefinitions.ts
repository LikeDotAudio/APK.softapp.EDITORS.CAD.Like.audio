// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BlockDefinition } from '../../core/types';
import { partToDefinition, type BimPart } from '../../flow/bimPart';

/**
 * BIM blocks saved before the connectors, the words and the top hat (2026-11-07)
 * carry none of them: a definition is stored WITH the sheet (browser session, Big
 * Picture's IFC), so it keeps the shape it was placed with. After a sheet loads,
 * each BIM block that has no hat is rebuilt from its part on this origin's
 * /api/bim/parts/<id> — same id and ports (partToDefinition is deterministic), now
 * with connectors, power and control out the bottom, and its hat. A host's block
 * (hostKey) is the host's to resend and is left alone; a part BIM cannot answer
 * for keeps the block it had.
 */
export const bimPartIdOf = (def: BlockDefinition): string =>
  def.bimRef?.part || (def.id.startsWith('bim.') ? def.id.slice(4).split('@')[0]! : '');

export function staleBimDefinitions(defs: BlockDefinition[], also: readonly string[] = []): BlockDefinition[] {
  return defs.filter((d) => !d.hostKey && (!d.hat || also.includes(d.id)) && bimPartIdOf(d));
}

/** Rebuild `def` in place from `part`, keeping its id and BIM reference. */
export function refreshDefinition(def: BlockDefinition, part: BimPart): void {
  const fresh = partToDefinition(part, def.bimRef ?? null);
  def.ports = fresh.ports;
  def.size = { w: Math.max(def.size.w, fresh.size.w), h: Math.max(def.size.h, fresh.size.h) };
  def.hat = fresh.hat;
  if (!def.description) def.description = fresh.description;
  if (!def.bimRef && fresh.bimRef) def.bimRef = fresh.bimRef;
}

export async function refreshBimDefinitions(
  store: { schematic: { definitions: BlockDefinition[] }; requestDraw(): void; emit(): void },
  fetcher: (url: string) => Promise<Response> = (url) => fetch(url, { cache: 'no-store' }),
  /** Definitions to rebuild though they have a hat: built from a drawing's own IFC types (ROAD-3709). */
  also: readonly string[] = [],
): Promise<number> {
  const stale = staleBimDefinitions(store.schematic.definitions, also);
  if (!stale.length) return 0;
  let done = 0;
  await Promise.all(stale.map(async (def) => {
    try {
      const id = bimPartIdOf(def);
      const res = await fetcher(`/api/bim/parts/${id.split('/').map(encodeURIComponent).join('/')}`);
      if (!res.ok) return;
      const part = (await res.json()) as BimPart;
      if (!part || part.id !== id) return;
      refreshDefinition(def, part);
      done += 1;
    } catch { /* BIM not reachable here: the block keeps the shape it was saved with */ }
  }));
  if (done) { store.requestDraw(); store.emit(); }
  return done;
}

/**
 * A drawing OPENED (File ▸ Open Model, a restored session) names its BIM blocks only by
 * definition id and BIM reference — a definition is not part of a saved sheet. Found in the
 * flight of ROAD-3689: every BIM block of a reopened drawing had no definition, so it was not
 * drawn, its wires had no path and the Wire Manager discovered nothing. Each missing `bim.*`
 * definition gets a stand-in — the size the sheet saved it at, its reference, no ports — which
 * refreshBimDefinitions (no hat: stale) then rebuilds from its part. The ids that were added.
 *
 * ROAD-3709: a drawing opened from its own .ifc carries its parts' types (io/ifc/partsInIfc.ts);
 * a stand-in whose part is among `parts` is built from it at once — ports, connectors, hat — so
 * it is whole while BIM is offline, and refreshBimDefinitions (passed these ids as `also`)
 * rebuilds it from /api/bim/parts when BIM answers.
 */
export function standInBimDefinitions(
  model: { definitions: BlockDefinition[]; placements: Array<{ definitionId: string; bimRef?: BlockDefinition['bimRef'] }> },
  sizes?: Record<string, { w: number; h: number }>,
  parts?: Record<string, BimPart>,
): string[] {
  const added: string[] = [];
  for (const p of model.placements) {
    if (!p.definitionId.startsWith('bim.') || model.definitions.some((d) => d.id === p.definitionId)) continue;
    const part = p.bimRef?.part || p.definitionId.slice(4).split('@')[0]!;
    const def: BlockDefinition = { id: p.definitionId, name: part, size: { ...(sizes?.[p.definitionId] ?? { w: 120, h: 60 }) }, glyph: [], ports: [],
      ...(p.bimRef ? { bimRef: { ...p.bimRef } } : {}) };
    const carried = parts?.[part];
    if (carried) { refreshDefinition(def, carried); def.name = partToDefinition(carried).name; }
    model.definitions.push(def);
    added.push(p.definitionId);
  }
  return added;
}
