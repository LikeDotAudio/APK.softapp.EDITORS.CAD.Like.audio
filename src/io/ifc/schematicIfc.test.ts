// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Doc } from '../../model/Doc';
import type { SavedSession } from '../browserStorage/SavedSession';
import { deref, entitiesByType, getPsets, parseStep, type StepEntity } from '../../vendor/ifc/step';
import { exportIfc } from './exportIfc';
import { importIfc } from './importIfc';
import { readSchematic } from './schematicIfc';

/*
 * cad-6: the Flow schematic's wiring and groups are IFC entities —
 * IfcRelConnectsPorts between occurrence ports, IfcElementAssembly (rack, kit)
 * and IfcGroup — not JSON in APK_CadSession.Native, and the session still comes
 * back whole. `CAD_IFC_OUT=<dir>` writes the files for IfcOpenShell.
 */

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8');
const TYPES = { 'keithley/2400': fixture('keithley--2400.ifc'), 'genelec/8050bpm': fixture('genelec--8050bpm.ifc') };

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
        { id: 1, from: { placementId: 1, portId: 'INPUT_OUTPUT_HI' }, to: { placementId: 2, portId: 'ANALOG_INPUT' }, layerId: 'Flow', route: [{ x: 1500 * k, y: 1000 * k }, { x: 2500 * k, y: 1000 * k }], label: 'drive L' },
        // drawn sink → source: RelatingPort is still the SOURCE side
        { id: 2, from: { placementId: 3, portId: 'ANALOG_INPUT' }, to: { placementId: 1, portId: 'INPUT_OUTPUT_LO' }, layerId: 'Flow', route: [] },
        // a fan-out from the same terminal: IFC lets a port be RelatingPort once, so a second port carries it
        { id: 3, from: { placementId: 1, portId: 'INPUT_OUTPUT_HI' }, to: { placementId: 4, portId: 'IN' }, layerId: 'Flow', route: [{ x: 1800 * k, y: 700 * k }] },
        // catalogue to catalogue, ports made for them
        { id: 4, from: { placementId: 4, portId: 'OUT' }, to: { placementId: 5, portId: 'PIN_1' }, layerId: 'Flow', hostKey: 'sim' },
        { id: 5, from: { placementId: 6, portId: 'OUT' }, to: { placementId: 4, portId: 'IN' }, layerId: '0' },
        // a port to itself, and an end whose placement is gone
        { id: 6, from: { placementId: 4, portId: 'LOOP' }, to: { placementId: 4, portId: 'LOOP' }, layerId: 'Flow' },
        { id: 7, from: { placementId: 4, portId: 'OUT' }, to: { placementId: 99, portId: 'IN' }, layerId: 'Flow', label: 'dangling' },
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

  it('is deterministic to the byte', () => {
    expect(exportIfc(sheet(), { types: TYPES })).toBe(text);
  });
});
