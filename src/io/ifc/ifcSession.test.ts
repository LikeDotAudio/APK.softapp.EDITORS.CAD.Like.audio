// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Layer } from '../../core/types';
import { commitCircle } from '../../model/commits/commitCircle';
import { Doc } from '../../model/Doc';
import { reflectAcrossMirror } from '../../model/doc/reflectAcrossMirror';
import type { SavedSession } from '../browserStorage/SavedSession';
import { entitiesByType, getPsets, parseStep, ports } from '../../vendor/ifc/step';
import { ifcGuid } from '../../vendor/ifc/guid';
import { exportIfc } from './exportIfc';
import { importIfc } from './importIfc';
import { partTypeEntity } from './partTypes';

/*
 * cad-3/4/5/7/10: the drawing goes out as IFC4X3_ADD2 and comes back as the
 * same session. `CAD_IFC_OUT=<dir> npx vitest run src/io/ifc` also writes the
 * exported files there, for IfcOpenShell's validate + ifctester (the dev
 * oracle in DATABASE.server.BIM SRC/tools/ifc).
 */

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8');
const TYPES = { 'keithley/2400': fixture('keithley--2400.ifc'), 'genelec/8050bpm': fixture('genelec--8050bpm.ifc') };

const LAYERS: Layer[] = [
  { id: '0', name: '0', color: '#ffffff', visible: true },
  { id: 'Walls', name: 'Walls', color: '#94a3b8', visible: true, lineweight: 50, ifc: { entity: 'IfcWall', predefinedType: 'STANDARD', height_mm: 2700, thickness_mm: 100 } },
  { id: 'Linework', name: 'Linework', color: '#3b82f6', visible: true, linetype: 'DASHED' },
  { id: 'Text', name: 'Text', color: '#f59e0b', visible: false },
  { id: 'Hatch', name: 'Hatch', color: '#10b981', visible: true, locked: true, finish: 'carpet' },
  { id: 'Devices', name: 'Devices', color: '#ef4444', visible: true, linetypePattern: [5, -2.5] },
];

/** Two rooms sharing one wall (7 walls), arcs, a circle, text, a hatch, symbols, BIM blocks, a mirror. */
function drawing(units: SavedSession['units'] = 'mm', k = 1): SavedSession {
  const doc = new Doc();
  const L = (x1: number, y1: number, x2: number, y2: number, layer = 'Walls') => doc.addLine({ x: x1 * k, y: y1 * k }, { x: x2 * k, y: y2 * k }, 0, layer);
  L(0, 0, 4000, 0); L(4000, 0, 7000, 0); L(7000, 0, 7000, 3000); L(7000, 3000, 4000, 3000);
  L(4000, 3000, 0, 3000); L(0, 3000, 0, 0); L(4000, 0, 4000, 3000);
  doc.addArc(9000 * k, 1500 * k, 500 * k, { x: 9500 * k, y: 1500 * k }, { x: 9000 * k, y: 2000 * k }, 0, 'Linework');
  commitCircle(doc, 11000 * k, 1500 * k, 333.3 * k, 'Linework');
  L(8000, 4000, 8000.123456789, 5000.987654321, 'Linework');
  doc.addText('Control room — Ünïcode ’quoted’', 500 * k, 2500 * k, 120 * k, 15, 'Text', '#ffcc00', 'center', 'middle');
  doc.addText('plain', 600 * k, 2000 * k, 80 * k, 0, 'Text');
  const fillId = doc.addFill([{ x: 100 * k, y: 100 * k }, { x: 900 * k, y: 100 * k }, { x: 900 * k, y: 600 * k }], 'hatch', 'Hatch', '#00ff00', 0.5);
  doc.fills.get(fillId)!.hatchPattern = 'ANSI31';
  doc.fills.get(fillId)!.paletteId = 'carpet';
  doc.addBlockDefinition({ name: 'SPK', basePoint: { x: 0, y: 0 }, lines: [{ x1: -1, y1: -1, x2: 1, y2: 1 }], arcs: [], circles: [] });
  const sym = doc.addBlockInstance('SPK', 2000 * k, 1000 * k, 1, 30, 'Devices', 'b6e1f6c2-0000-4000-8000-000000000001', { label: 'L' });
  reflectAcrossMirror(doc, { edges: [], texts: [], blocks: [sym], fills: [] }, 3500 * k);
  const snap = doc.snapshot();
  return {
    version: 1,
    timestamp: Date.UTC(2026, 10, 6, 12, 0, 0),
    docSnapshot: snap,
    currentFileName: 'two-rooms.dxf',
    units,
    gridSize: 10,
    gridMode: 'dots',
    snapToGrid: true,
    shapeMode: false,
    activeLayerId: 'Walls',
    layers: LAYERS.map((l) => ({ ...l })),
    tracing: null,
    docKey: '1a2b3c4d-0000-4000-8000-00000000cafe',
    mirror: {
      enabled: true, x: 3500 * k, selected: false,
      mirrors: [{ id: 'mirror-axis-1', x: 3500 * k, selected: false, name: 'Centre line', glowColor: '#00f7ff' }],
    },
    spaces: [{ key: 'lobby', name: 'Lobby', layerId: '0', points: [{ x: 7000 * k, y: 3000 * k }, { x: 9000 * k, y: 3000 * k }, { x: 9000 * k, y: 4000 * k }, { x: 7000 * k, y: 4000 * k }], roomType: 'LOBBY', height_mm: 3000 }],
    schematic: {
      placements: [
        { id: 1, definitionId: 'bim.keithley/2400', at: { x: 1000 * k, y: 1000 * k }, rotation: 90, layerId: 'Devices', refdes: 'SMU1', serial: '4084512', bimRef: { part: 'keithley/2400', url: '/api/bim/parts/keithley/2400', rev: 'r1' }, z_mm: 1200, mountedOn: { edgeId: 6 }, portLabels: { HI: 'Force' } },
        { id: 2, definitionId: 'flow.source', at: { x: -6 * k, y: 0 }, layerId: '0', refdes: 'SRC1' },
        { id: 3, definitionId: 'bim.genelec/8050bpm', at: { x: 5000 * k, y: 1500 * k }, layerId: 'Devices', refdes: 'SPK-L', mac: 'AA:BB:CC:00:11:22', hostKey: 'acoustic', hostRef: 'L', hostHash: 'h1' },
        { id: 4, definitionId: 'bim.genelec/8050bpm', at: { x: 2000 * k, y: 1500 * k }, layerId: 'Devices', refdes: 'SPK-R', mirrorOf: 3, rotation: -0.5 },
        { id: 5, definitionId: 'bim.acme/not-in-library', at: { x: 8000 * k, y: 2000 * k }, layerId: 'Devices', resource: 'GPIB0::28::INSTR' },
      ],
      connectors: [{ id: 1, from: { placementId: 1, portId: 'INPUT_OUTPUT_HI' }, to: { placementId: 3, portId: 'ANALOG_INPUT' }, layerId: '0', route: [{ x: 1, y: 2 }] }],
      groups: [{ id: 1, name: 'Rack A', children: [], members: [1, 2], layerId: '0', source: { kind: 'rack', id: 'A' } }],
      nextPlacementId: 6,
      nextConnectorId: 2,
      nextGroupId: 2,
    },
  };
}

const out = process.env.CAD_IFC_OUT;
const emit = (name: string, text: string) => {
  if (!out) return;
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, name), text);
};

describe('the CAD document as IFC4X3_ADD2 (cad-3)', () => {
  it('writes the spatial spine, in mm, deterministic to the byte', () => {
    const s = drawing();
    const a = exportIfc(s, { types: TYPES });
    expect(exportIfc(s, { types: TYPES })).toBe(a);
    emit('two-rooms.ifc', a);
    const f = parseStep(a);
    expect(f.header.find((h) => h.type === 'FILE_SCHEMA')!.args[0]).toEqual(['IFC4X3_ADD2']);
    for (const t of ['IFCPROJECT', 'IFCSITE', 'IFCBUILDING', 'IFCBUILDINGSTOREY']) expect(entitiesByType(f, t)).toHaveLength(1);
    expect(entitiesByType(f, 'IFCBUILDINGSTOREY')[0]!.args[2]).toBe('Level 0');
    const lengths = entitiesByType(f, 'IFCSIUNIT').filter((u) => (u.args[1] as { value: string }).value === 'LENGTHUNIT');
    expect(lengths).toHaveLength(1);
    expect(lengths[0]!.args.slice(2).map((v) => (v as { value: string }).value)).toEqual(['MILLI', 'METRE']);
    // no negative-scale operator anywhere (cad-10)
    for (const op of entitiesByType(f, 'IFCCARTESIANTRANSFORMATIONOPERATOR3D')) expect(op.args[3]).toBeNull();
  });

  it('comes back as the same session (mm)', () => {
    const s = drawing();
    expect(importIfc(exportIfc(s, { types: TYPES }))).toEqual(s);
  });

  it('comes back as the same session without the part files (stub types)', () => {
    const s = drawing();
    expect(importIfc(exportIfc(s))).toEqual(s);
  });

  it('a session in inches goes out in mm and comes back in inches', () => {
    const s = drawing('in', 1 / 25.4);
    const text = exportIfc(s, { types: TYPES });
    emit('two-rooms-in.ifc', text);
    const back = importIfc(text);
    const near = (a: unknown, b: unknown): void => {
      if (typeof a === 'number' && typeof b === 'number') expect(a).toBeCloseTo(b, 9);
      else if (Array.isArray(a)) a.forEach((x, i) => near(x, (b as unknown[])[i]));
      else if (a && typeof a === 'object') for (const k of Object.keys(a)) near((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]);
      else expect(a).toEqual(b);
    };
    near(back, s);
    near(s, back);
    // the wall that was 4000 mm long still is
    const f = parseStep(text);
    const wall = entitiesByType(f, 'IFCWALL')[0]!;
    expect(getPsets(f, wall).APK_CadEdge!.EdgeId).toBe(1);
    expect(text).toContain('IFCCARTESIANPOINT((4000.,0.))');
  });

  it('a file from another tool opens as walls, linework and rooms', () => {
    const s = importIfc(fixture('genelec--8050bpm.ifc'));
    expect(s.units).toBe('mm');
    expect(s.docSnapshot.edges).toHaveLength(0);
    expect(() => importIfc('not a step file')).toThrow(/not an IFC file/);
  });
});

describe('walls and rooms are classified (cad-4)', () => {
  const f = parseStep(exportIfc(drawing(), { types: TYPES }));

  it('every edge on the IfcWall layer is one IfcWall, contained in the storey, with Axis and Body', () => {
    const walls = entitiesByType(f, 'IFCWALL');
    expect(walls).toHaveLength(7);
    const contains = entitiesByType(f, 'IFCRELCONTAINEDINSPATIALSTRUCTURE').find((r) => (r.args[5] as { id: number }).id === entitiesByType(f, 'IFCBUILDINGSTOREY')[0]!.id)!;
    const held = new Set((contains.args[4] as { id: number }[]).map((r) => r.id));
    for (const w of walls) expect(held.has(w.id)).toBe(true);
    expect(entitiesByType(f, 'IFCEXTRUDEDAREASOLID').length).toBeGreaterThanOrEqual(7);
    expect(entitiesByType(f, 'IFCANNOTATION').filter((a) => a.args[4] === 'LINEWORK')).toHaveLength(4);
  });

  it('two rooms share a wall: 2 derived spaces + 1 declared, and the shared wall bounds both', () => {
    const spaces = entitiesByType(f, 'IFCSPACE');
    expect(spaces).toHaveLength(3);
    const bounds = entitiesByType(f, 'IFCRELSPACEBOUNDARY');
    const byWall = new Map<number, number>();
    for (const b of bounds) byWall.set((b.args[5] as { id: number }).id, (byWall.get((b.args[5] as { id: number }).id) ?? 0) + 1);
    const shared = entitiesByType(f, 'IFCWALL').find((w) => getPsets(f, w).APK_CadEdge!.EdgeId === 7)!;
    expect(byWall.get(shared.id)).toBe(2);
    expect(bounds).toHaveLength(8);
  });

  it('a wall keeps its GlobalId from one session to the next', () => {
    const wall = entitiesByType(f, 'IFCWALL')[0]!;
    expect(wall.args[0]).toBe(ifcGuid('cad', '1a2b3c4d-0000-4000-8000-00000000cafe', 'edge', '1'));
    const again = parseStep(exportIfc(importIfc(exportIfc(drawing(), { types: TYPES })), { types: TYPES }));
    expect(entitiesByType(again, 'IFCWALL').map((w) => w.args[0])).toEqual(entitiesByType(f, 'IFCWALL').map((w) => w.args[0]));
  });
});

describe('placed BIM blocks are occurrences of their part type (cad-5)', () => {
  const f = parseStep(exportIfc(drawing(), { types: TYPES }));
  const part = parseStep(TYPES['keithley/2400']);

  it('the type is the library type, same GlobalId, declared in the project library', () => {
    const t = entitiesByType(f, 'IFCFLOWINSTRUMENTTYPE')[0]!;
    expect(t.args[0]).toBe(partTypeEntity(part)!.args[0]);
    expect(t.args[0]).toBe(ifcGuid('part', 'keithley/2400'));
    expect(entitiesByType(f, 'IFCPROJECTLIBRARY')).toHaveLength(1);
    expect(entitiesByType(f, 'IFCBUILDINGELEMENTPROXYTYPE')[0]!.args[7]).toBe('acme/not-in-library');
  });

  it('an occurrence is placed in mm, contained in its room, with its own ports and identity', () => {
    const smu = entitiesByType(f, 'IFCFLOWINSTRUMENT')[0]!;
    expect(smu.args[2]).toBe('SMU1');
    expect(smu.args[0]).toBe(ifcGuid('inst', 'serial:keithley/4084512'));
    const own = ports(f, smu);
    expect(own).toHaveLength(ports(part, partTypeEntity(part)!).length);
    expect(getPsets(f, own[0]!).Pset_DistributionPortTypeCable).toBeTruthy();
    const ps = getPsets(f, smu);
    expect(ps.Pset_ManufacturerOccurrence!.SerialNumber).toBe('4084512');
    expect(ps.Pset_ManufacturerTypeInformation!.Manufacturer).toBe('Keithley');
    const pl = f.byId.get((smu.args[5] as { id: number }).id)!;
    const ax = f.byId.get((pl.args[1] as { id: number }).id)!;
    expect(f.byId.get((ax.args[0] as { id: number }).id)!.args[0]).toEqual([{ kind: 'real', value: 1000, raw: '1000.' }, { kind: 'real', value: 1000, raw: '1000.' }, { kind: 'real', value: 1200, raw: '1200.' }]);
    const room = entitiesByType(f, 'IFCRELCONTAINEDINSPATIALSTRUCTURE').find((r) => (r.args[4] as { id: number }[]).some((x) => x.id === smu.id))!;
    expect(f.byId.get((room.args[5] as { id: number }).id)!.type).toBe('IFCSPACE');
    expect(getPsets(f, smu).APK_Identity!.IdentityKey).toBe('serial:keithley/4084512');
  });

  it('a device on a wall is an IfcRelConnectsElements wall → device', () => {
    const smu = entitiesByType(f, 'IFCFLOWINSTRUMENT')[0]!;
    const rel = entitiesByType(f, 'IFCRELCONNECTSELEMENTS').filter((r) => (r.args[6] as { id: number }).id === smu.id);
    expect(rel).toHaveLength(1);
    const wall = f.byId.get((rel[0]!.args[5] as { id: number }).id)!;
    expect(wall.type).toBe('IFCWALL');
    expect(getPsets(f, wall).APK_CadEdge!.EdgeId).toBe(6);
  });

  it('never writes an IP into identity', () => {
    const s = drawing();
    s.schematic!.placements[4]!.resource = 'TCPIP::44.44.44.222::gpib7,11::INSTR';
    expect(exportIfc(s)).not.toContain('44.44.44.222');
  });
});

describe('the Virtual Mirror (cad-10)', () => {
  const f = parseStep(exportIfc(drawing(), { types: TYPES }));

  it('a mirrored pair is two occurrences of one type, symmetric, each pointing at the other', () => {
    const speakers = entitiesByType(f, 'IFCELECTRICAPPLIANCE');
    expect(speakers).toHaveLength(2);
    const [l, r] = speakers.map((s) => getPsets(f, s).APK_Symmetry!);
    expect(l!.PartnerGlobalId).toBe(speakers[1]!.args[0]);
    expect(r!.PartnerGlobalId).toBe(speakers[0]!.args[0]);
    expect(r!.ReflectedFrom).toBe(speakers[0]!.args[0]);
    expect(l!.AxisX).toBe(3500);
    const typeRels = entitiesByType(f, 'IFCRELDEFINESBYTYPE').filter((t) => (t.args[4] as { id: number }[]).some((x) => x.id === speakers[0]!.id));
    expect((typeRels[0]!.args[4] as unknown[]).length).toBe(2);
  });

  it('a reflected CAD symbol records its partner and the axis is an annotation', () => {
    const blocks = entitiesByType(f, 'IFCANNOTATION').filter((a) => a.args[4] === 'CAD_BLOCK');
    expect(blocks).toHaveLength(2);
    expect(getPsets(f, blocks[1]!).APK_Symmetry!.AxisX).toBe(3500);
    expect(entitiesByType(f, 'IFCANNOTATION').filter((a) => a.args[4] === 'MIRROR_AXIS')).toHaveLength(1);
  });
});

describe('host@1 carries the IFC document (cad-7)', async () => {
  const schema = (await import('../../../contract/host@1/host.schema.json')).default;
  // @ts-expect-error — plain JS shipped with the contract
  const { validateMessage } = await import('../../../contract/validate.mjs');
  const { parseLayerIfc } = await import('../../shell/hostBridge/hostLayer');
  const wrap = (type: string, body: object) => ({ protocol: 'cad.like.audio/host@1', type, ...body });
  const s = drawing();
  const ifc = exportIfc(s, { types: TYPES });

  it('session { format: ifc } → session { session, ifc }; open { ifc } alone is a message', () => {
    expect(validateMessage(schema, 'toCad', wrap('session', { format: 'ifc' }))).toEqual([]);
    expect(validateMessage(schema, 'toHost', wrap('session', { session: { ...s, userAuth: undefined }, ifc }))).toEqual([]);
    expect(validateMessage(schema, 'toCad', wrap('open', { ifc }))).toEqual([]);
    expect(validateMessage(schema, 'toCad', wrap('open', {}))).not.toEqual([]);
    expect(validateMessage(schema, 'toCad', wrap('layer', { name: 'Walls', ifc: { entity: 'IfcWall', height_mm: 2700, thickness_mm: 100 } }))).toEqual([]);
    expect(validateMessage(schema, 'toCad', wrap('layer', { name: 'Walls', ifc: null }))).toEqual([]);
  });

  it('a host that saves the ifc and sends it back opens the same session', () => {
    expect(importIfc(ifc)).toEqual(s);
  });

  it('a layer classification from a host is read strictly', () => {
    expect(parseLayerIfc({ entity: 'IfcWall', predefinedType: 'PARTITIONING', height_mm: 2400, thickness_mm: -1 })).toEqual({ entity: 'IfcWall', predefinedType: 'PARTITIONING', height_mm: 2400 });
    expect(parseLayerIfc(null)).toBeNull();
    expect(parseLayerIfc({ entity: 'IfcSlab' })).toBeUndefined();
  });
});
