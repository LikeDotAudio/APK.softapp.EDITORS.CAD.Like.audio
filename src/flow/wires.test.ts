// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import type { BlockDefinition, SchematicModel } from '../core/types';
import { Doc } from '../model/Doc';
import { History } from '../model/history';
import { cloneSchematic, editFlow, restoreWholeSchematic } from '../state/actions/editFlow';
import type { EditorStore } from '../state/EditorStore';
import { dropConnector } from './dropConnector';
import { nudgeOnGrid } from './onGrid';
import { definitionFor } from './Schematic';
import {
  acceptCandidates, addBend, connect, deleteWire, discoverWires, endPoint, followDevice, mergeDuplicates, mergeNets, moveBend, netlistCsv,
  netOf, netOfWire, nets, orthogonalRoute, pinSpots, removeBend, renameNet, setWireEnd, slideSegment, wireEndsOf, wireLength,
  wirelistCsv, wireRecord, wireStatuses,
} from './wires';

const BOX: BlockDefinition = { id: 'box', name: 'BOX', size: { w: 100, h: 60 }, glyph: [],
  ports: [{ id: 'IN', side: 'input', label: 'in', connector: 'XLR3-F' }, { id: 'OUT', side: 'output', label: 'out', connector: 'XLR3-M' }] };

const sheet = (n = 4): SchematicModel => ({
  definitions: [BOX],
  placements: Array.from({ length: n }, (_, i) => ({ id: i + 1, definitionId: 'box', at: { x: i * 300, y: 0 }, layerId: '0', refdes: `U${i + 1}` })),
  connectors: [], groups: [], nextPlacementId: n + 1, nextConnectorId: 1, nextGroupId: 1,
});
const P = (placementId: number, portId: string) => ({ placementId, portId });

describe('wires are records, From → To', () => {
  it('a wire is one record: from/to device · port · pin · connector, bends, net, length in mm', () => {
    const m = sheet();
    const c = connect(m, P(1, 'OUT'), P(2, 'IN'))!;
    const r = wireRecord(m, c);
    expect(r.from).toEqual({ placementId: 1, portId: 'OUT', device: 'U1', port: 'out', pin: '1', connector: 'XLR3-M' });
    expect(r.to).toMatchObject({ device: 'U2', port: 'in', connector: 'XLR3-F' });
    expect(r.net).toBe('N1');
    expect(r.length_mm).toBeGreaterThan(0);
  });
});

describe('nets — derived from the wires', () => {
  it('connect two ports → one net with both pins', () => {
    const m = sheet();
    connect(m, P(1, 'OUT'), P(2, 'IN'));
    const all = nets(m);
    expect(all).toHaveLength(1);
    expect(all[0]!.pins).toEqual([P(1, 'OUT'), P(2, 'IN')]);
    expect(m.connectors[0]!.net).toBe('N1');
  });

  it('connect a third pin → the same net', () => {
    const m = sheet();
    connect(m, P(1, 'OUT'), P(2, 'IN'));
    connect(m, P(1, 'OUT'), P(3, 'IN'));
    expect(nets(m)).toHaveLength(1);
    expect(netOf(m, P(3, 'IN'))!.pins).toHaveLength(3);
    expect(m.connectors.map((c) => c.net)).toEqual(['N1', 'N1']);
  });

  it('joining two nets merges them under the OLDER name', () => {
    const m = sheet();
    connect(m, P(1, 'OUT'), P(2, 'IN'));
    connect(m, P(3, 'OUT'), P(4, 'IN'));
    renameNet(m, 'N1', 'CLOCK');
    renameNet(m, 'N2', 'AUDIO');
    expect(nets(m).map((n) => n.name)).toEqual(['CLOCK', 'AUDIO']);
    connect(m, P(4, 'IN'), P(2, 'IN'));
    expect(nets(m).map((n) => n.name)).toEqual(['CLOCK']);
    expect(new Set(m.connectors.map((c) => c.net))).toEqual(new Set(['CLOCK']));
  });

  it('mergeNets keeps the older name; a name another net has is refused', () => {
    const m = sheet();
    connect(m, P(1, 'OUT'), P(2, 'IN'));
    connect(m, P(3, 'OUT'), P(4, 'IN'));
    expect(renameNet(m, 'N2', 'N1')).toBe(false);
    expect(mergeNets(m, 'N2', 'N1')).toBe('N1');
    expect(nets(m)).toHaveLength(1);
  });

  it('a fly pair is one wire: the same net at both capsules; a portal to another drawing is said', () => {
    const m = sheet();
    const c = connect(m, P(1, 'OUT'), P(2, 'IN'))!;
    c.fly = true;
    expect(netOf(m, P(1, 'OUT'))!.name).toBe(netOf(m, P(2, 'IN'))!.name);
    m.placements[2]!.portals = { IN: { text: 'U2 in', wired: true, to: { placementId: 2, port: 'IN' } }, OUT: { text: 'SW1 : 24', wired: true, to: { drawing: 'Network' } } };
    expect(netOf(m, P(3, 'IN'))!.name).toBe('N1');
    expect(netOf(m, P(3, 'OUT'))!.offSheet).toEqual(['Network']);
  });

  it('deleting the wire that held a net together splits it; the younger part takes a name of its own', () => {
    const m = sheet();
    connect(m, P(1, 'OUT'), P(2, 'IN'));
    const b = connect(m, P(2, 'IN'), P(3, 'IN'))!;
    connect(m, P(3, 'IN'), P(4, 'IN'));
    expect(nets(m)).toHaveLength(1);
    deleteWire(m, b.id);
    expect(nets(m).map((n) => n.name)).toEqual(['N1', 'N3']);
  });
});

describe('a wire is one line with bends (pure geometry)', () => {
  const path = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 200, y: 100 }];

  it('a wire is one entity with N vertices; its length runs along them', () => {
    const m = sheet();
    const c = connect(m, P(1, 'OUT'), P(2, 'IN'), '0', [{ x: 120, y: 30 }, { x: 120, y: -30 }])!;
    expect(m.connectors).toHaveLength(1);
    expect(wireRecord(m, c).bends).toEqual([[120, 30], [120, -30]]);
    expect(wireLength(path)).toBe(300);
  });

  it('adding and removing a bend', () => {
    const { bends, index } = addBend(path, { x: 50, y: 3 });
    expect(index).toBe(0);
    expect(bends).toEqual([{ x: 50, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }]);
    expect(removeBend(bends, 0)).toEqual([{ x: 100, y: 0 }, { x: 100, y: 100 }]);
  });

  it('a dragged bend keeps its runs square: the neighbouring bend follows', () => {
    expect(moveBend(path, 0, { x: 140, y: 0 })).toEqual([{ x: 140, y: 0 }, { x: 140, y: 100 }]);
  });

  it('a slid run moves only across itself and its bends go with it; at a pin a jog appears', () => {
    expect(slideSegment(path, 1, { x: 30, y: 999 })).toEqual([{ x: 130, y: 0 }, { x: 130, y: 100 }]);
    expect(slideSegment(path, 0, { x: 7, y: 20 })).toEqual([{ x: 0, y: 20 }, { x: 100, y: 20 }, { x: 100, y: 100 }]);
  });

  it('an orthogonal route never goes diagonal', () => {
    const r = orthogonalRoute({ x: 0, y: 0 }, { x: 200, y: 80 }, 'output', 'input');
    const all = [{ x: 0, y: 0 }, ...r, { x: 200, y: 80 }];
    for (let i = 1; i < all.length; i++) expect(all[i]!.x === all[i - 1]!.x || all[i]!.y === all[i - 1]!.y).toBe(true);
  });

  it('moving a device keeps its wire attached: the end follows the pin and the run stays square', () => {
    const m = sheet();
    m.placements[1]!.at = { x: 300, y: 100 };
    const a = endPoint(m, P(1, 'OUT'))!, b = endPoint(m, P(2, 'IN'))!;
    const c = connect(m, P(1, 'OUT'), P(2, 'IN'), '0', orthogonalRoute(a, b))!;
    expect(c.route!.length).toBe(2);
    const before = wireEndsOf(m, 2);
    nudgeOnGrid(m.placements[1]!, 0, 40);
    followDevice(m, 2, before);
    const now = endPoint(m, P(2, 'IN'))!;
    const pts = [a, ...c.route!, now];
    for (let i = 1; i < pts.length; i++) expect(pts[i]!.x === pts[i - 1]!.x || pts[i]!.y === pts[i - 1]!.y).toBe(true);
    expect(c.from).toEqual(P(1, 'OUT'));
    expect(c.to).toEqual(P(2, 'IN'));
  });

  it('From and To re-picked; a pin to itself refused', () => {
    const m = sheet();
    const c = connect(m, P(1, 'OUT'), P(2, 'IN'))!;
    expect(setWireEnd(m, c.id, 'to', P(3, 'IN'))).toBe(true);
    expect(c.to).toEqual(P(3, 'IN'));
    expect(setWireEnd(m, c.id, 'to', P(1, 'OUT'))).toBe(false);
  });
});

describe('the wire manager: discovery and status', () => {
  it('a line ending on two pins → one wire', () => {
    const m = sheet();
    const a = endPoint(m, P(1, 'OUT'))!, b = endPoint(m, P(2, 'IN'))!;
    const [k, ...rest] = discoverWires([{ id: 7, a, b }], pinSpots(m), 5, m);
    expect(rest).toHaveLength(0);
    expect(k).toMatchObject({ segments: [7], from: P(1, 'OUT'), to: P(2, 'IN'), bends: [], confidence: 'high', dangling: false });
    expect(acceptCandidates(m, [k!])).toHaveLength(1);
    expect(nets(m)).toHaveLength(1);
  });

  it('a chain of touching segments → one wire with its bends', () => {
    const m = sheet();
    const a = endPoint(m, P(1, 'OUT'))!, b = endPoint(m, P(2, 'IN'))!;
    const k1 = { x: 140, y: a.y }, k2 = { x: 140, y: -40 }, k3 = { x: b.x, y: -40 };
    const segs = [{ id: 3, a: k2, b: k3 }, { id: 1, a, b: k1 }, { id: 4, a: k3, b }, { id: 2, a: k1, b: k2 }];
    const found = discoverWires(segs, pinSpots(m), 5, m);
    expect(found).toHaveLength(1);
    expect(found[0]!.bends).toEqual([k1, k2, k3]);
    expect(found[0]!.segments.sort()).toEqual([1, 2, 3, 4]);
  });

  it('a dangling end is flagged; a line touching no pin is not a wire', () => {
    const m = sheet();
    const a = endPoint(m, P(1, 'OUT'))!;
    const found = discoverWires([{ id: 1, a, b: { x: 150, y: 400 } }, { id: 2, a: { x: 900, y: 900 }, b: { x: 990, y: 900 } }], pinSpots(m), 5, m);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ dangling: true, from: P(1, 'OUT'), to: null, confidence: 'low' });
    expect(acceptCandidates(m, found)).toHaveLength(0);
  });

  it('duplicates: a run repeating a wire is marked; duplicate wires are flagged and merged', () => {
    const m = sheet();
    connect(m, P(1, 'OUT'), P(2, 'IN'));
    const a = endPoint(m, P(1, 'OUT'))!, b = endPoint(m, P(2, 'IN'))!;
    expect(discoverWires([{ id: 1, a, b }], pinSpots(m), 5, m)[0]!.duplicate).toBe(true);
    m.connectors.push({ id: 9, from: P(2, 'IN'), to: P(1, 'OUT'), layerId: '0' });
    expect(wireStatuses(m).get(9)).toContain('duplicate');
    expect(mergeDuplicates(m)).toBe(1);
    expect(m.connectors).toHaveLength(1);
  });

  it('a wire through another device is flagged', () => {
    const m = sheet();
    connect(m, P(1, 'OUT'), P(3, 'IN'), '0', []);   // straight through U2
    expect(wireStatuses(m).get(1)).toContain('crosses a device');
  });

  it('the wirelist (EDITORS.Wirelist columns + Net) and the netlist', () => {
    const m = sheet();
    connect(m, P(1, 'OUT'), P(2, 'IN'));
    const wl = wirelistCsv(m).split('\n');
    expect(wl[0]).toBe('Wire #,Cable Type / Model,Len (ft),Len (mm),Origin / Source,Origin Connector,Destination,Destination Connector,System,Signal Type,Color,Status,Net');
    expect(wl[1]).toMatch(/^W-001,,[\d.]+,\d+,U1 \/ out,XLR3-M,U2 \/ in,XLR3-F,,,,,N1$/);
    expect(netlistCsv(m).split('\n')[1]).toBe('N1,2,U1:out U2:in,W-001,');
  });
});

describe('undo (the CAD\'s stack, editFlow)', () => {
  /** The store's undo contract with nothing but the parts it uses. */
  const store = () => {
    const s = {
      doc: new Doc(), schematic: sheet(), history: new History(), bigPicture: { filed: false, dirty: false },
      markDocChanged() {}, requestDraw() {}, emit() {},
    };
    return s as unknown as EditorStore & typeof s;
  };
  const undo = (s: ReturnType<typeof store>) => {
    const snap = s.history.pop()!;
    s.doc.restore(snap);
    if (snap.schematic) restoreWholeSchematic(s.schematic, snap.schematic);
  };

  it('a dropped connector (a new port) comes off with undo', () => {
    const s = store();
    dropConnector(s.schematic, 'DANTE-RX2', { x: 0, y: 0 }, 1);   // IN is XLR: a new port
    const ports = definitionFor(s.schematic, s.schematic.placements[0]!)!.ports.length;
    editFlow(s, () => dropConnector(s.schematic, 'DANTE-RX2', { x: 0, y: 0 }, 1) !== null);
    expect(definitionFor(s.schematic, s.schematic.placements[0]!)!.ports.length).toBe(ports + 1);
    undo(s);
    expect(definitionFor(s.schematic, s.schematic.placements[0]!)!.ports.length).toBe(ports);
  });

  it('a wire, a bend, a delete — each one step back', () => {
    const s = store();
    const m = s.schematic;
    editFlow(s, () => connect(m, P(1, 'OUT'), P(2, 'IN')) !== null);
    editFlow(s, () => { m.connectors[0]!.route = [{ x: 120, y: 0 }]; return true; });
    editFlow(s, () => deleteWire(m, 1));
    expect(m.connectors).toHaveLength(0);
    undo(s);
    expect(m.connectors[0]!.route).toEqual([{ x: 120, y: 0 }]);
    expect(netOfWire(m, 1)!.name).toBe('N1');
    undo(s);
    expect(m.connectors[0]!.route).toBeUndefined();
    undo(s);
    expect(m.connectors).toHaveLength(0);
    expect(cloneSchematic(m)).toEqual(sheet());
  });
});
