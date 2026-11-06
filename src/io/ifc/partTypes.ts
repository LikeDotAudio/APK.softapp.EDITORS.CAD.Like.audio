// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { inverseIndex, isRef, isTypeObject, parseStep, type StepEntity, type StepFile, type StepRef, type StepValue } from '../../vendor/ifc/step';
import type { StepBuilder } from './stepBuilder';

/**
 * A BIM PART'S TYPE, CARRIED INTO THE DRAWING (IFC-CORE-DELTAS cad-5)
 *
 * The part is the one source of truth: DATABASE.server.BIM writes it as one
 * IFC4X3 type object (GET /api/bim/parts/<maker>/<model>.ifc, byte-equal to its
 * stored .ifc twin). The CAD never re-describes it — it copies that type, its
 * Psets, its RepresentationMap and its nested ports into its own file as they
 * are, with the same GlobalIds, so the type in a drawing IS the library's type.
 *
 * What is copied: everything the type reaches, the IfcRelNests of its ports,
 * and the IfcRelDefinesByProperties on those ports. What is swapped for the
 * drawing's own: the owner history, the representation contexts, and the
 * units (deduplicated by what they say). The part file's project, library and
 * IfcRelDeclares stay behind; the drawing declares the type in its own library.
 */

export interface MergedType {
  /** The type object in the drawing. */
  type: StepRef;
  /** Its STEP entity name, e.g. IFCAUDIOVISUALAPPLIANCETYPE. */
  entity: string;
  /** Its RepresentationMaps, for the occurrences' IfcMappedItem. */
  maps: StepRef[];
  /** The type's ports in order, with the IfcRelDefinesByProperties that carry each one's sets. */
  ports: { port: StepRef; rels: StepRef[] }[];
}

export interface MergeTargets {
  ownerHistory: StepRef;
  /** The drawing's 3D 'Model' context. */
  model: StepRef;
  /** The drawing's 'Body' subcontext. */
  body: StepRef;
}

const UNIT_TYPES = new Set(['IFCSIUNIT', 'IFCCONTEXTDEPENDENTUNIT', 'IFCDIMENSIONALEXPONENTS', 'IFCCONVERSIONBASEDUNIT', 'IFCMEASUREWITHUNIT', 'IFCDERIVEDUNIT', 'IFCDERIVEDUNITELEMENT']);

function refsOf(v: StepValue, out: number[]): void {
  if (Array.isArray(v)) for (const x of v) refsOf(x, out);
  else if (isRef(v)) out.push(v.id);
  else if (v && typeof v === 'object' && 'kind' in v && v.kind === 'typed') refsOf(v.value, out);
}

/** The first type object in a part file: the part. */
export function partTypeEntity(file: StepFile): StepEntity | undefined {
  return file.entities.find((e) => isTypeObject(e.type));
}

/** Copy the part's type out of `text` (a part .ifc) into `b`. Null when the file holds no type. */
export function mergePartType(b: StepBuilder, text: string, to: MergeTargets): MergedType | null {
  const file = parseStep(text);
  const type = partTypeEntity(file);
  if (!type) return null;
  const inv = inverseIndex(file);

  // what the type reaches, plus its ports' nesting and property relationships
  const take = new Set<number>();
  const walk = (id: number) => {
    if (take.has(id)) return;
    const e = file.byId.get(id);
    if (!e) return;
    take.add(id);
    const out: number[] = [];
    for (const a of e.args) refsOf(a, out);
    for (const r of out) walk(r);
  };
  walk(type.id);
  const nests = (inv.get(type.id) ?? []).filter((e) => e.type === 'IFCRELNESTS' && isRef(e.args[4]) && e.args[4].id === type.id);
  const portIds: number[] = [];
  for (const n of nests) {
    walk(n.id);
    const related = n.args[5];
    if (Array.isArray(related)) for (const r of related) if (isRef(r)) portIds.push(r.id);
  }
  const portRels = new Map<number, number[]>();
  for (const pid of portIds) {
    walk(pid);
    for (const rel of inv.get(pid) ?? []) {
      if (rel.type !== 'IFCRELDEFINESBYPROPERTIES') continue;
      walk(rel.id);
      (portRels.get(pid) ?? portRels.set(pid, []).get(pid)!).push(rel.id);
    }
  }

  // swapped for the drawing's own
  const map = new Map<number, StepRef>();
  for (const id of take) {
    const e = file.byId.get(id)!;
    if (e.type === 'IFCOWNERHISTORY') map.set(id, to.ownerHistory);
    else if (e.type === 'IFCGEOMETRICREPRESENTATIONSUBCONTEXT') map.set(id, e.args[0] === 'Body' ? to.body : to.model);
    else if (e.type === 'IFCGEOMETRICREPRESENTATIONCONTEXT') map.set(id, to.model);
  }
  const skipped = (id: number) => {
    const t = file.byId.get(id)?.type ?? '';
    return t === 'IFCOWNERHISTORY' || t === 'IFCGEOMETRICREPRESENTATIONSUBCONTEXT' || t === 'IFCGEOMETRICREPRESENTATIONCONTEXT'
      || t === 'IFCPERSON' || t === 'IFCORGANIZATION' || t === 'IFCPERSONANDORGANIZATION' || t === 'IFCAPPLICATION';
  };
  // only what is still reachable once the swapped entities are cut off
  const keep = new Set<number>();
  const reach = (id: number) => {
    if (keep.has(id) || skipped(id) || !take.has(id)) return;
    keep.add(id);
    const out: number[] = [];
    for (const a of file.byId.get(id)!.args) refsOf(a, out);
    for (const r of out) reach(r);
  };
  reach(type.id);
  for (const n of nests) reach(n.id);
  for (const rels of portRels.values()) for (const r of rels) reach(r);

  const remap = (v: StepValue): StepValue => {
    if (Array.isArray(v)) return v.map(remap);
    if (isRef(v)) return map.get(v.id) ?? v;
    if (v && typeof v === 'object' && 'kind' in v && v.kind === 'typed') return { ...v, value: remap(v.value) };
    return v;
  };
  // children first, so a unit's text is known before it is deduplicated (ids are only renumbered)
  const order = [...keep].sort((x, y) => x - y);
  const pending = new Set(order);
  const place = (id: number) => {
    if (!pending.has(id)) return;
    pending.delete(id);
    const e = file.byId.get(id)!;
    const out: number[] = [];
    for (const a of e.args) refsOf(a, out);
    for (const r of out) place(r);
    const args = e.args.map(remap);
    map.set(id, UNIT_TYPES.has(e.type) ? b.once(e.type, args) : b.add(e.type, args));
  };
  for (const id of order) place(id);

  const maps = type.args[6];
  return {
    type: map.get(type.id)!,
    entity: type.type,
    maps: Array.isArray(maps) ? maps.filter(isRef).map((r) => map.get(r.id)!).filter(Boolean) : [],
    ports: portIds.filter((p) => map.has(p)).map((p) => ({ port: map.get(p)!, rels: (portRels.get(p) ?? []).map((r) => map.get(r)!) })),
  };
}

/** A part type's STEP entity name for its occurrence: drop the TYPE (IfcFlowInstrumentType → IfcFlowInstrument). */
export function occurrenceEntity(typeEntity: string): string {
  return typeEntity.replace(/TYPE$/, '');
}

/**
 * Attributes an occurrence carries after the eight IfcElement ones begin with
 * Tag; these are how many follow Tag (all optional, written $): PredefinedType,
 * and for these two classes their own extras before it. Checked against the
 * IFC4X3_ADD2 schema for every entity contracts/ifc/mapping.json names.
 */
const OCCURRENCE_TAIL: Record<string, number> = { IFCELEMENTASSEMBLY: 2, IFCMECHANICALFASTENER: 3 };
export const occurrenceTail = (entity: string): number => OCCURRENCE_TAIL[entity] ?? 1;

/** The part's id a type carries in APK_Part.PartId, read from a parsed part file. */
export function partIdOf(file: StepFile, type: StepEntity): string | undefined {
  const psets = type.args[5];
  if (!Array.isArray(psets)) return undefined;
  for (const p of psets) {
    const set = isRef(p) ? file.byId.get(p.id) : undefined;
    if (!set || set.args[2] !== 'APK_Part' || !Array.isArray(set.args[4])) continue;
    for (const q of set.args[4]) {
      const prop = isRef(q) ? file.byId.get(q.id) : undefined;
      const v = prop?.args[2];
      if (prop?.args[0] === 'PartId' && v && typeof v === 'object' && 'kind' in v && v.kind === 'typed' && typeof v.value === 'string') return v.value;
    }
  }
  return undefined;
}

/** Where the BIM library serves a part's type file (DATABASE.server.BIM server.py). */
export const partIfcUrl = (partId: string, base = '/api/bim/parts/'): string =>
  `${base}${partId.split('/').map(encodeURIComponent).join('/')}.ifc`;

const cache = new Map<string, Promise<string | null>>();

/**
 * Each part's type file, fetched once per page. A part the library cannot give
 * (offline, a static host, a removed part) is null: the drawing then writes a
 * stub type for it that still carries APK_Part.PartId and the same GlobalId.
 */
export async function fetchPartTypes(partIds: Iterable<string>, fetcher: typeof fetch = fetch): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const id of new Set(partIds)) {
    let hit = cache.get(id);
    if (!hit) {
      hit = fetcher(partIfcUrl(id))
        .then((r) => (r.ok ? r.text() : null))
        .then((t) => (t && t.startsWith('ISO-10303-21;') ? t : null))
        .catch(() => null);
      cache.set(id, hit);
      void hit.then((t) => { if (t === null) cache.delete(id); });
    }
    const t = await hit;
    if (t) out[id] = t;
  }
  return out;
}
