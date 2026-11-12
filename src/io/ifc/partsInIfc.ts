// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { deref, getPsets, inverseIndex, isTypeObject, ports, type StepEntity, type StepFile } from '../../vendor/ifc/step';
import doc from '../../vendor/ifc/connectors.json';
import { resolveIfcConnector, type IfcConnector } from '../../connectors/ifcConnectors';
import type { BimPart, BimPort } from '../../flow/bimPart';
import { partIdOf } from './partTypes';

/**
 * THE PARTS A DRAWING ALREADY CARRIES (ROAD-3709)
 *
 * exportIfc copies each placed part's IFC type into the drawing as the library wrote it
 * (partTypes.ts mergePartType): its APK_Part, its maker's words and one IfcDistributionPort
 * per terminal, the terminals of one port row sharing ONE APK_Terminal set. So a drawing
 * reopened from its own .ifc can rebuild its BIM blocks' definitions with their ports
 * before — or without — /api/bim/parts answering. This reads those types back into the
 * library's part shape (`apk.bim.part/1`, just what partToDefinition uses), folding the
 * terminals back into rows as DATABASE.server.BIM ifc_read.py `_fold_row` does.
 *
 * A stub type (the part could not be fetched when the drawing was written: Stage 'stub',
 * no ports) gives nothing: its block stays a stand-in until BIM answers.
 */

const CONNECTORS = (doc as unknown as { connectors: IfcConnector[] }).connectors;
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined);
const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : typeof v === 'string' ? [v] : []);

/** The port's connector id from Pset_DistributionPortTypeCable (as ifc_read.py connector_from_words), else as declared. */
export function connectorOf(cable: Record<string, unknown>, declared?: string): string | undefined {
  const sub = str(cable.ConnectionSubtype);
  const ects = list(cable.ElectricalConnectionType);
  const gens = list(cable.ConnectionGender);
  if (sub && ects.length) {
    // ifc.py joins a combo's subtypes with ' / '; a subtype may hold ' / ' itself, so re-join greedily
    const known = new Set(CONNECTORS.map((e) => e.subtype));
    const bits = sub.split(' / ').map((b) => b.trim());
    const subs: string[] = [];
    for (let i = 0; i < bits.length;) {
      let j = bits.length;
      for (; j > i && !known.has(bits.slice(i, j).join(' / ')); j--);
      if (j === i) { subs.length = 0; break; }
      subs.push(bits.slice(i, j).join(' / '));
      i = j;
    }
    const ids: string[] = [];
    for (const st of subs) {
      for (const g of gens.length ? gens : ['NOTKNOWN']) {
        for (const e of CONNECTORS) {
          if (e.subtype === st && e.ConnectionGender === g && ects.includes(e.ElectricalConnectionType) && !ids.includes(e.id)) ids.push(e.id);
        }
      }
    }
    if (ids.length) return ids.join(' / ');
  }
  return resolveIfcConnector(declared)?.id ?? resolveIfcConnector(sub)?.id ?? sub ?? str(declared);
}

/** One port row from the terminals it was written as. */
function foldRow(file: StepFile, members: StepEntity[], i: number): BimPort {
  const sets = getPsets(file, members[0]!);
  const term = sets.APK_Terminal ?? {};
  const cable = sets.Pset_DistributionPortTypeCable ?? {};
  const names = members.map((p) => (typeof p.args[2] === 'string' ? p.args[2] : ''));
  const group = str(term.Group);
  const row: BimPort = {};
  if (group) row.group = group;
  const side = str(term.Side);
  if (side) row.side = side;
  const domain = str(term.Domain);
  if (domain) row.domain = domain;
  const connector = connectorOf(cable, str(term.ConnectorAsDeclared));
  if (connector) row.connector = connector;
  const block = str(term.Block);
  if (block) row.block = block;
  row.count = members.length;
  if (members.length === 1) {
    if (names[0] && names[0] !== group) row.terminal = names[0];
  } else {
    // a row of n is its labels, minus the trailing '<group> <n>' the writer filled in
    const base = group ?? `PORT ${i + 1}`;
    const labels = [...names];
    while (labels.length && labels[labels.length - 1] === `${base} ${labels.length}`) labels.pop();
    if (labels.length) row.labels = labels;
  }
  return row;
}

/** A part type in the drawing as the part it was copied from; null for a stub or a type with no part id. */
export function partOfType(file: StepFile, type: StepEntity, inv = inverseIndex(file)): BimPart | null {
  const id = partIdOf(file, type);
  if (!id) return null;
  const sets = getPsets(file, type);
  const apk = sets.APK_Part ?? {};
  if (apk.Stage === 'stub') return null;
  const terminals = ports(file, type);
  if (!terminals.length) return null;
  // the terminals of one row share one APK_Terminal set (ifc.py write_ports): a new set, a new row
  const setOf = (port: StepEntity): number => {
    for (const rel of inv.get(port.id) ?? []) {
      if (rel.type !== 'IFCRELDEFINESBYPROPERTIES') continue;
      const set = deref(file, rel.args[5]);
      if (set?.args[2] === 'APK_Terminal') return set.id;
    }
    return -port.id;
  };
  const rows: StepEntity[][] = [];
  let key: number | null = null;
  for (const p of terminals) {
    const k = setOf(p);
    if (k !== key || !rows.length) rows.push([]);
    rows[rows.length - 1]!.push(p);
    key = k;
  }
  const maker = sets.Pset_ManufacturerTypeInformation ?? {};
  const name = str(maker.ModelLabel) ?? str(type.args[2]);
  const description = str(type.args[3]);
  const ru = sets.APK_AVDevice?.RackUnits;
  const part: BimPart = { id, ports: rows.map((r, i) => foldRow(file, r, i)) };
  if (str(maker.Manufacturer)) part.manufacturer = String(maker.Manufacturer);
  if (str(maker.ModelReference)) part.model = String(maker.ModelReference);
  if (name) part.name = name;
  if (description) part.description = description;
  if (str(apk.Category)) part.category = String(apk.Category);
  if (str(apk.Class)) part.class = String(apk.Class);
  if (str(apk.Stage)) part.stage = String(apk.Stage);
  if (typeof ru === 'number') part.ru = ru;
  return part;
}

/** Every part type the drawing carries with its terminals, by part id. */
export function partsInIfc(file: StepFile): Record<string, BimPart> {
  const inv = inverseIndex(file);
  const out: Record<string, BimPart> = {};
  for (const e of file.entities) {
    if (!isTypeObject(e.type)) continue;
    const part = partOfType(file, e, inv);
    if (part && !out[part.id]) out[part.id] = part;
  }
  return out;
}
