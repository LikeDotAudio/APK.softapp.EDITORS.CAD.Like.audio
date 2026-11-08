// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Doc } from '../../model/Doc';
import type { SavedSession } from '../browserStorage/SavedSession';
import { deref, entitiesByType, getPsets, parseStep, type StepEntity, type StepValue } from '../../vendor/ifc/step';
import { exportIfc } from './exportIfc';
import { importIfc } from './importIfc';
import { readSchematic } from './schematicIfc';

/*
 * cad-6: the Flow schematic's wiring and groups are IFC entities —
 * IfcRelConnectsPorts between occurrence ports, IfcElementAssembly (rack, kit)
 * and IfcGroup — not JSON in APK_CadSession.Native, and the session still comes
 * back whole. A wire that is a cable is an IfcCableSegment realizing its
 * connection, every block's symbol an IfcAnnotation assigned to its occurrence,
 * and a host's resend keeps its GlobalIds. `CAD_IFC_OUT=<dir>` writes the files for IfcOpenShell.
 */

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8');
const TYPES = { 'keithley/2400': fixture('keithley--2400.ifc'), 'genelec/8050bpm': fixture('genelec--8050bpm.ifc'), 'hosa/cmr-206': fixture('hosa--cmr-206.ifc') };

function sheet(units: SavedSession['units'] = 'mm', k = 1): SavedSession {
  const doc = new Doc();
  doc.addLine({ x: 0, y: 0 }, { x: 100 * k, y: 0 }, 0, '0');
  return {
    version: 1,
    timestamp: Date.UTC(2026, 10, 6, 12, 0, 0),
    docSnapshot: doc.snapshot(),
    currentFileName: 'rig.json',
    units,
    gridSize: 10,
    snapToGrid: true,
    shapeMode: false,
    activeLayerId: '0',
    layers: [{ id: '0', name: '0', color: '#ffffff', visible: true }, { id: 'Flow', name: 'Flow', color: '#3b82f6', visible: true }],
    tracing: null,
    docKey: '1a2b3c4d-0000-4000-8000-00000000f10e',
    schematic: {
      placements: [
        { id: 1, definitionId: 'bim.keithley/2400', at: { x: 1000 * k, y: 1000 * k }, layerId: 'Flow', refdes: 'SMU1', serial: '4084512' },
        { id: 2, definitionId: 'bim.genelec/8050bpm', at: { x: 3000 * k, y: 1000 * k }, layerId: 'Flow', refdes: 'SPK-L', hostKey: 'sim', hostRef: 'L', hostHash: 'h1' },
        { id: 3, definitionId: 'bim.genelec/8050bpm', at: { x: 3000 * k, y: 2000 * k }, rotation: 180, layerId: 'Flow', refdes: 'SPK-R' },
        { id: 4, definitionId: 'flow.process', at: { x: 2000 * k, y: 500 * k }, layerId: 'Flow', refdes: 'DSP1', scale: 2, portLabels: { IN: 'Main' }, portals: { OUT: { text: 'SPK-L', wired: true } } },
        { id: 5, definitionId: 'conn.xlr3f', at: { x: 2000 * k, y: 1500 * k }, layerId: 'Flow', mac: 'AA:BB:CC:00:11:22', resource: 'GPIB0::9::INSTR', z_mm: 900, mirrorOf: 4 },
        { id: 6, definitionId: 'flow.source', at: { x: -6 * k, y: 0 }, layerId: '0' },
      ],
      connectors: [
        // a terminal of each part (the keithley's SOURCE to the genelec's SINK)
        { id: 1, from: { placementId: 1, portId: 'INPUT_OUTPUT_HI' }, to: { placementId: 2, portId: 'ANALOG_INPUT' }, layerId: 'Flow', route: [{ x: 1500 * k, y: 1000 * k }, { x: 2500 * k, y: 1000 * k }], label: 'drive L',
          cable: { part: 'hosa/cmr-206', tag: 'W-001', length_mm: 1800, colour: 'black', status: 'made' } },
        // drawn sink → source: RelatingPort is still the SOURCE side
        { id: 2, from: { placementId: 3, portId: 'ANALOG_INPUT' }, to: { placementId: 1, portId: 'INPUT_OUTPUT_LO' }, layerId: 'Flow', route: [], fly: true },
        // a fan-out from the same terminal: IFC lets a port be RelatingPort once, so a second port carries it
        { id: 3, from: { placementId: 1, portId: 'INPUT_OUTPUT_HI' }, to: { placementId: 4, portId: 'IN' }, layerId: 'Flow', route: [{ x: 1800 * k, y: 700 * k }] },
        // catalogue to catalogue, ports made for them
        // a cable whose part the drawing does not have: an untyped CABLESEGMENT
        { id: 4, from: { placementId: 4, portId: 'OUT' }, to: { placementId: 5, portId: 'PIN_1' }, layerId: 'Flow', hostKey: 'sim', cable: { tag: 'W-002' } },
        { id: 5, from: { placementId: 6, portId: 'OUT' }, to: { placementId: 4, portId: 'IN' }, layerId: '0' },
        // a port to itself, and an end whose placement is gone
        { id: 6, from: { placementId: 4, portId: 'LOOP' }, to: { placementId: 4, portId: 'LOOP' }, layerId: 'Flow' },
        { id: 7, from: { placementId: 4, portId: 'OUT' }, to: { placementId: 99, portId: 'IN' }, layerId: 'Flow', label: 'dangling', cable: { part: 'hosa/cmr-206' } },
      ],
      groups: [
        { id: 1, name: 'Rack A', children: [3], members: [1, 4], layerId: 'Flow', source: { kind: 'rack', id: 'A' }, pad: 0.6 },
        { id: 2, name: 'Control room', children: [1], members: [5], layerId: 'Flow', source: { kind: 'room', id: 'cr' }, collapsed: true, labelWidth: 120 },
        { id: 3, name: 'Monitors', children: [], members: [2, 3], layerId: 'Flow', hostKey: 'sim' },
        { id: 4, name: 'Empty', children: [], members: [], layerId: 'Flow' },
      ],
      nextPlacementId: 7,
      nextConnectorId: 8,
      nextGroupId: 5,
    },
  };
}

const out = process.env.CAD_IFC_OUT;
const emit = (name: string, text: string) => {
  if (!out) return;
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, name), text);
};
const enumOf = (v: unknown) => (v && typeof v === 'object' && 'value' in v ? (v as { value: string }).value : v);

describe('the Flow schematic as IFC entities (cad-6)', () => {
  const text = exportIfc(sheet(), { types: TYPES });
  const f = parseStep(text);
  emit('schematic.ifc', text);

  it('comes back as the same session, with and without the part files, in mm and in inches', () => {
    const s = sheet();
    expect(importIfc(text)).toEqual(s);
    expect(importIfc(exportIfc(s))).toEqual(s);
    const inches = sheet('in', 1 / 25.4);
    const back = importIfc(exportIfc(inches, { types: TYPES }));
    const near = (a: unknown, b: unknown): void => {
      if (typeof a === 'number' && typeof b === 'number') expect(a).toBeCloseTo(b, 9);
      else if (Array.isArray(a)) { expect(a.length).toBe((b as unknown[]).length); a.forEach((x, i) => near(x, (b as unknown[])[i])); }
      else if (a && typeof a === 'object') for (const k of new Set([...Object.keys(a), ...Object.keys(b as object)])) near((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]);
      else expect(a).toEqual(b);
    };
    near(back, inches);
    emit('schematic-in.ifc', exportIfc(inches, { types: TYPES }));
  });

  it('keeps no wiring or groups in APK_CadSession.Native', () => {
    const project = entitiesByType(f, 'IFCPROJECT')[0]!;
    const native = JSON.parse(String(getPsets(f, project).APK_CadSession!.Native));
    expect(native.schematic.connectors).toBeUndefined();
    expect(native.schematic.groups).toBeUndefined();
    expect(native.schematic.placements).toEqual([1, 2, 3, 4, 5, 6].map((ifc) => ({ ifc })));
  });

  it('each joined connector is one IfcRelConnectsPorts, SOURCE side relating', () => {
    const rels = entitiesByType(f, 'IFCRELCONNECTSPORTS');
    expect(rels).toHaveLength(6); // all but the dangling one
    for (const r of rels) {
      const a = deref(f, r.args[4])!, z = deref(f, r.args[5])!;
      expect(a.id).not.toBe(z.id);
      expect(['SOURCE', 'SOURCEANDSINK']).toContain(enumOf(a.args[7]));
      expect(['SINK', 'SOURCEANDSINK']).toContain(enumOf(z.args[7]));
    }
    // connector 1 joins the parts' own terminals, not ports made for the sheet
    const drive = rels.find((r) => r.args[2] === 'drive L')!;
    expect(deref(f, drive.args[4])!.args[2]).toBe('INPUT/OUTPUT HI');
    expect(deref(f, drive.args[5])!.args[2]).toBe('ANALOG INPUT');
    // every port of any connection is RelatingPort at most once and RelatedPort at most once
    const count = (i: number) => new Set(rels.map((r) => (r.args[i] as { id: number }).id)).size;
    expect(count(4)).toBe(rels.length);
    expect(count(5)).toBe(rels.length);
  });

  it('a catalogue block is an IfcDistributionElement whose ObjectType is its definition', () => {
    const els = entitiesByType(f, 'IFCDISTRIBUTIONELEMENT');
    expect(els.map((e) => e.args[4])).toEqual(['flow.process', 'conn.xlr3f', 'flow.source']);
    const storey = entitiesByType(f, 'IFCBUILDINGSTOREY')[0]!;
    const held = entitiesByType(f, 'IFCRELCONTAINEDINSPATIALSTRUCTURE').filter((r) => (r.args[5] as { id: number }).id === storey.id)
      .flatMap((r) => (r.args[4] as { id: number }[]).map((x) => x.id));
    for (const e of els) expect(held).toContain(e.id);
  });

  it('a rack is an IfcElementAssembly aggregating what it holds; other groups are IfcGroups', () => {
    const [rack] = entitiesByType(f, 'IFCELEMENTASSEMBLY') as StepEntity[];
    expect(rack!.args[2]).toBe('Rack A');
    expect(rack!.args[4]).toBe('RACK');
    expect(enumOf(rack!.args[8])).toBe('SITE');
    expect(enumOf(rack!.args[9])).toBe('USERDEFINED');
    const agg = entitiesByType(f, 'IFCRELAGGREGATES').find((r) => (r.args[4] as { id: number }).id === rack!.id)!;
    expect((agg.args[5] as unknown[]).length).toBe(3); // SMU1, DSP1, the Monitors group
    expect(entitiesByType(f, 'IFCGROUP').map((g) => g.args[2])).toEqual(['Control room', 'Monitors', 'Empty']);
    // the parts' port systems group what they join
    expect(entitiesByType(f, 'IFCDISTRIBUTIONSYSTEM').map((s) => enumOf(s.args[6]))).toEqual(['AUDIOVISUAL', 'SIGNAL']);
  });

  it('a file written before cad-6 (wiring and groups in Native) still reads', () => {
    const s = sheet();
    const legacy = { placements: s.schematic!.placements, connectors: s.schematic!.connectors, groups: s.schematic!.groups, nextPlacementId: 7, nextConnectorId: 8, nextGroupId: 5 };
    expect(readSchematic(f, (v) => v, legacy, new Map())).toEqual(s.schematic);
  });

  it('a wire that is a cable is an IfcCableSegment realizing its connection, typed by its cable part', () => {
    const cables = entitiesByType(f, 'IFCCABLESEGMENT');
    expect(cables.map((c) => c.args[7])).toEqual(['W-001', 'W-002']);
    const realized = entitiesByType(f, 'IFCRELCONNECTSPORTS').filter((r) => r.args[6]).map((r) => deref(f, r.args[6])!.args[7]);
    expect(realized).toEqual(['W-001', 'W-002']);
    const typeOf = (e: StepEntity) => entitiesByType(f, 'IFCRELDEFINESBYTYPE').find((r) => (r.args[4] as { id: number }[]).some((x) => x.id === e.id));
    const [typed, untyped] = cables as [StepEntity, StepEntity];
    expect(deref(f, typeOf(typed)!.args[5])!.type).toBe('IFCCABLESEGMENTTYPE');
    expect(typed.args[8]).toBeNull();
    expect(typeOf(untyped)).toBeUndefined();
    expect(enumOf(untyped.args[8])).toBe('CABLESEGMENT');
    const sets = getPsets(f, typed);
    expect(sets.APK_Connection).toMatchObject({ Medium: 'wired', CablePart: 'hosa/cmr-206', CableStatus: 'made', CableColour: 'black' });
    expect(sets.Qto_CableSegmentBaseQuantities!.Length).toBe(1800);
    // the cable type is declared in the project library with the other parts, once
    expect(entitiesByType(f, 'IFCCABLESEGMENTTYPE')).toHaveLength(1);
  });

  it('each placement has a SYMBOL annotation on the GRAPH_VIEW sheet, assigned to its occurrence', () => {
    const symbols = entitiesByType(f, 'IFCANNOTATION').filter((a) => enumOf(a.args[7]) === 'SYMBOL');
    expect(symbols.map((a) => a.args[2])).toEqual(['SMU1', 'SPK-L', 'SPK-R', 'DSP1', 'conn.xlr3f', 'flow.source']);
    const assigned = entitiesByType(f, 'IFCRELASSIGNSTOPRODUCT');
    expect(assigned).toHaveLength(6);
    symbols.forEach((sym, i) => {
      const rel = assigned.find((r) => (r.args[4] as { id: number }[]).some((x) => x.id === sym.id))!;
      expect(getPsets(f, deref(f, rel.args[6])!).APK_Placement!.PlacementId).toBe(i + 1);
      const shape = deref(f, sym.args[6])!;
      const rep = deref(f, (shape.args[2] as StepValue[])[0])!;
      expect(enumOf(deref(f, rep.args[0])!.args[8])).toBe('GRAPH_VIEW');
      expect(getPsets(f, sym).APK_SheetSeat!.Sheet).toBe('Schematic');
    });
  });

  it('each symbol is drawn as its block outline: the definition size × scale, mm, a closed Curve2D polyline', () => {
    const s = sheet();
    s.schematic!.sizes = { 'bim.genelec/8050bpm': { w: 80, h: 40 }, 'flow.process': { w: 60, h: 30 }, 'conn.xlr3f': { w: 20, h: 20 } };
    const txt = exportIfc(s, { types: TYPES });
    emit('schematic-outlines.ifc', txt);
    const g = parseStep(txt);
    const symbols = entitiesByType(g, 'IFCANNOTATION').filter((a) => enumOf(a.args[7]) === 'SYMBOL');
    const outline = (sym: StepEntity) => {
      const rep = deref(g, (deref(g, sym.args[6])!.args[2] as StepValue[])[0])!;
      const items = (rep.args[3] as StepValue[]).map((x) => deref(g, x)!);
      return { id: rep.args[1], type: rep.args[2], items, pts: items[0]!.type === 'IFCPOLYLINE'
        ? (items[0]!.args[0] as StepValue[]).map((p) => (deref(g, p)!.args[0] as StepValue[]).map((v) => enumOf(v))) : [] };
    };
    const byName = new Map(symbols.map((x) => [x.args[2], outline(x)]));
    const spk = byName.get('SPK-L')!;
    expect([spk.id, spk.type]).toEqual(['Annotation', 'Curve2D']);
    expect(spk.pts).toEqual([[-40, -20], [40, -20], [40, 20], [-40, 20], [-40, -20]]);
    expect(byName.get('DSP1')!.pts[1]).toEqual([60, -30]); // scale 2
    // no size kept (an older session): the point it stands at
    expect([byName.get('SMU1')!.type, byName.get('flow.source')!.type]).toEqual(['Point', 'Point']);
    // the sizes come back with the session; in inches the outline is still mm
    expect(importIfc(txt)).toEqual(s);
    const inches = sheet('in', 1 / 25.4);
    inches.schematic!.sizes = { 'bim.genelec/8050bpm': { w: 80 / 25.4, h: 40 / 25.4 } };
    const h = parseStep(exportIfc(inches, { types: TYPES }));
    const sym = entitiesByType(h, 'IFCANNOTATION').find((a) => enumOf(a.args[7]) === 'SYMBOL' && a.args[2] === 'SPK-L')!;
    const rep = deref(h, (deref(h, sym.args[6])!.args[2] as StepValue[])[0])!;
    const first = deref(h, (deref(h, (rep.args[3] as StepValue[])[0])!.args[0] as StepValue[])[0])!.args[0] as StepValue[];
    expect(enumOf(first[0]) as number).toBeCloseTo(-40, 9);
  });

  it("a host's resend keeps the GlobalIds of what it placed, wired and grouped", () => {
    const hosted = (shift: number): SavedSession => {
      const s = sheet();
      const sch = s.schematic!;
      // the host's things come back with new CAD ids (hostSchematic.ts replaces them by key)
      const ren = (id: number) => (id === 2 ? 2 + shift : id === 5 ? 5 + shift : id);
      sch.placements = sch.placements.map((p) => ({ ...p, id: ren(p.id) }));
      sch.placements[4] = { ...sch.placements[4]!, hostKey: 'sim', hostRef: 'X1', hostHash: 'h1' };
      sch.connectors = sch.connectors.map((c) => ({ ...c, id: c.hostKey ? c.id + shift : c.id, from: { ...c.from, placementId: ren(c.from.placementId) }, to: { ...c.to, placementId: ren(c.to.placementId) } }));
      sch.connectors[3] = { ...sch.connectors[3]!, from: { placementId: ren(5), portId: 'PIN_1' }, to: { placementId: ren(2), portId: 'ANALOG_INPUT' }, hostKey: 'sim' };
      sch.groups = sch.groups!.map((g) => (g.hostKey ? { ...g, id: g.id + shift, source: { kind: 'host', id: 'monitors' } } : g));
      sch.groups[0] = { ...sch.groups[0]!, children: [3 + shift] };
      sch.groups[1] = { ...sch.groups[1]!, members: [ren(5)] };
      sch.groups[2] = { ...sch.groups[2]!, members: [ren(2), 3] };
      sch.nextPlacementId = 7 + shift; sch.nextConnectorId = 8 + shift; sch.nextGroupId = 5 + shift;
      return s;
    };
    const gids = (s: SavedSession, type: string) => entitiesByType(parseStep(exportIfc(s, { types: TYPES })), type).map((e) => e.args[0]).sort();
    const a = hosted(0), b = hosted(40);
    for (const type of ['IFCAUDIOVISUALAPPLIANCE', 'IFCDISTRIBUTIONELEMENT', 'IFCDISTRIBUTIONPORT', 'IFCRELCONNECTSPORTS', 'IFCCABLESEGMENT', 'IFCANNOTATION', 'IFCGROUP', 'IFCELEMENTASSEMBLY']) {
      expect(gids(b, type)).toEqual(gids(a, type));
    }
    // and each still reads back as itself
    expect(importIfc(exportIfc(b, { types: TYPES }))).toEqual(b);
  });

  it('is deterministic to the byte', () => {
    expect(exportIfc(sheet(), { types: TYPES })).toBe(text);
  });
});
