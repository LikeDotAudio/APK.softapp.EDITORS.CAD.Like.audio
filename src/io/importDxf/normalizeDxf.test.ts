// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { Doc } from '../../model/Doc';
import { loadDxfIntoDoc } from './loadDxfIntoDoc';
import { ellipseToEntities, splineToEntities } from './normalizeDxf';
import { parseDxf } from './parseDxf';
import { skippedSummary } from './skippedSummary';

const file = (blocks: string[], entities: string[]) =>
  [
    '  0', 'SECTION', '  2', 'BLOCKS', ...blocks, '  0', 'ENDSEC',
    '  0', 'SECTION', '  2', 'ENTITIES', ...entities, '  0', 'ENDSEC', '  0', 'EOF',
  ].join('\n');

const close = (a: number, b: number) => Math.abs(a - b) < 1e-6;

describe('DXF import: nested INSERTs, DIMENSION, SPLINE, ELLIPSE', () => {
  it("brings a nested INSERT's geometry into the outer block, placed, scaled and rotated", () => {
    const dxf = file(
      [
        '  0', 'BLOCK', '  2', 'BOLT', ' 10', '0', ' 20', '0',
        '  0', 'LINE', '  8', '0', ' 10', '0', ' 20', '0', ' 11', '1', ' 21', '0',
        '  0', 'CIRCLE', '  8', '0', ' 10', '0', ' 20', '0', ' 40', '1',
        '  0', 'ENDBLK',
        '  0', 'BLOCK', '  2', 'PLATE', ' 10', '5', ' 20', '5',
        '  0', 'LINE', '  8', '0', ' 10', '5', ' 20', '5', ' 11', '15', ' 21', '5',
        '  0', 'INSERT', '  8', '0', '  2', 'BOLT', ' 10', '10', ' 20', '5', ' 41', '2', ' 42', '2', ' 50', '90',
        '  0', 'ENDBLK',
      ],
      ['  0', 'INSERT', '  8', '0', '  2', 'PLATE', ' 10', '0', ' 20', '0'],
    );
    const doc = new Doc();
    loadDxfIntoDoc(doc, parseDxf(dxf));
    const plate = doc.blocks.get('PLATE')!;
    expect(plate.lines).toHaveLength(2);
    const bolt = plate.lines[1]!;
    // BOLT's 0,0→1,0 scaled ×2, turned 90°, at 10,5; minus PLATE's base 5,5
    expect([bolt.x1, bolt.y1, bolt.x2, bolt.y2].map((v) => Math.round(v * 1e9) / 1e9)).toEqual([5, 0, 5, 2]);
    expect(plate.circles).toHaveLength(1);
    expect(plate.circles[0]!.r).toBeCloseTo(2);
    expect(plate.circles[0]!.cx).toBeCloseTo(5);
    expect([...doc.blockInstances.values()].map((i) => i.blockName)).toEqual(['PLATE']);
  });

  it('keeps a mirrored nested arc a true arc, running the other way', () => {
    const dxf = file(
      [
        '  0', 'BLOCK', '  2', 'HOOK', ' 10', '0', ' 20', '0',
        '  0', 'ARC', '  8', '0', ' 10', '0', ' 20', '0', ' 40', '1', ' 50', '0', ' 51', '90',
        '  0', 'ENDBLK',
        '  0', 'BLOCK', '  2', 'RACK', ' 10', '0', ' 20', '0',
        '  0', 'INSERT', '  8', '0', '  2', 'HOOK', ' 10', '0', ' 20', '0', ' 41', '-1', ' 42', '1',
        '  0', 'ENDBLK',
      ],
      [],
    );
    const doc = new Doc();
    loadDxfIntoDoc(doc, parseDxf(dxf));
    const arc = doc.blocks.get('RACK')!.arcs[0]!;
    expect(arc.r).toBeCloseTo(1);
    // quarter from 0° to 90° mirrored in x is the quarter from 90° to 180°
    expect(arc.a1).toBeCloseTo(90);
    expect(arc.a2).toBeCloseTo(180);
  });

  it('stops at a block that inserts itself', () => {
    const dxf = file(
      [
        '  0', 'BLOCK', '  2', 'LOOP', ' 10', '0', ' 20', '0',
        '  0', 'LINE', '  8', '0', ' 10', '0', ' 20', '0', ' 11', '1', ' 21', '0',
        '  0', 'INSERT', '  8', '0', '  2', 'LOOP', ' 10', '1', ' 20', '0',
        '  0', 'ENDBLK',
      ],
      [],
    );
    const doc = new Doc();
    loadDxfIntoDoc(doc, parseDxf(dxf));
    expect(doc.blocks.get('LOOP')!.lines).toHaveLength(1);
  });

  it("draws a DIMENSION as its anonymous block's lines and text", () => {
    const dxf = file(
      [
        '  0', 'BLOCK', '  2', '*D1', ' 70', '1', ' 10', '0', ' 20', '0',
        '  0', 'LINE', '  8', 'DIM', ' 10', '0', ' 20', '-5', ' 11', '100', ' 21', '-5',
        '  0', 'MTEXT', '  8', 'DIM', ' 10', '50', ' 20', '-4', ' 40', '2.5', '  1', '100',
        '  0', 'ENDBLK',
      ],
      ['  0', 'DIMENSION', '  8', 'DIM', '  2', '*D1', ' 10', '100', ' 20', '-5', ' 70', '32'],
    );
    const parsed = parseDxf(dxf);
    expect(parsed.entities.map((e) => e.type)).toEqual(['DIMENSION']);
    const doc = new Doc();
    loadDxfIntoDoc(doc, parsed);
    expect(doc.edges.size).toBe(1);
    expect([...doc.texts.values()].map((t) => t.text)).toEqual(['100']);
  });

  it('reads a round ELLIPSE as a true arc and an oval one as a closed outline', () => {
    const round = ellipseToEntities({ type: 'ELLIPSE', cx: 0, cy: 0, majorX: 0, majorY: 2, ratio: 1, startParam: 0, endParam: Math.PI / 2 });
    expect(round[0]!.type).toBe('ARC');
    expect(round[0]!.r).toBeCloseTo(2);
    expect(round[0]!.startAngle).toBeCloseTo(90);
    expect(round[0]!.endAngle).toBeCloseTo(180);

    const oval = ellipseToEntities({ type: 'ELLIPSE', cx: 10, cy: 0, majorX: 4, majorY: 0, ratio: 0.5, startParam: 0, endParam: 2 * Math.PI });
    expect(oval[0]!.type).toBe('LWPOLYLINE');
    expect(oval[0]!.isClosed).toBe(true);
    const pts = oval[0]!.points!;
    expect(Math.max(...pts.map((p) => p.x))).toBeCloseTo(14);
    expect(Math.max(...pts.map((p) => p.y))).toBeCloseTo(2);
    for (const p of pts) expect(close(((p.x - 10) / 4) ** 2 + (p.y / 2) ** 2, 1)).toBe(true);
  });

  it('reads an ELLIPSE and a SPLINE from a file into edges', () => {
    const dxf = file(
      [],
      [
        '  0', 'ELLIPSE', '  8', '0', ' 10', '0', ' 20', '0', ' 11', '3', ' 21', '0', ' 40', '0.5', ' 41', '0', ' 42', '6.283185307179586',
        '  0', 'SPLINE', '  8', '0', ' 70', '8', ' 71', '2', ' 72', '6', ' 73', '3',
        ' 40', '0', ' 40', '0', ' 40', '0', ' 40', '1', ' 40', '1', ' 40', '1',
        ' 10', '0', ' 20', '0', ' 10', '1', ' 20', '2', ' 10', '2', ' 20', '0',
      ],
    );
    const doc = new Doc();
    loadDxfIntoDoc(doc, parseDxf(dxf));
    expect(doc.edges.size).toBeGreaterThan(64);
  });

  it('evaluates a SPLINE on its curve: ends on the end control points, a quadratic peaks at half', () => {
    const [pl] = splineToEntities({
      type: 'SPLINE', degree: 2, knots: [0, 0, 0, 1, 1, 1],
      controlPoints: [{ x: 0, y: 0 }, { x: 1, y: 2 }, { x: 2, y: 0 }],
    });
    const pts = pl!.points!;
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[pts.length - 1]!.x).toBeCloseTo(2);
    expect(pts[pts.length - 1]!.y).toBeCloseTo(0);
    expect(Math.max(...pts.map((p) => p.y))).toBeCloseTo(1);
  });

  it('draws a SPLINE with only fit points through them', () => {
    const [pl] = splineToEntities({ type: 'SPLINE', fitPoints: [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }] });
    expect(pl!.points).toEqual([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }]);
  });

  it('reads an old-style POLYLINE through its VERTEX run and SEQEND, bulges and closure kept', () => {
    const dxf = file(
      [],
      [
        '  0', 'POLYLINE', '  8', 'WALL', ' 66', '1', ' 10', '0', ' 20', '0', ' 70', '1',
        '  0', 'VERTEX', '  8', 'WALL', ' 10', '0', ' 20', '0',
        '  0', 'VERTEX', '  8', 'WALL', ' 10', '10', ' 20', '0', ' 42', '1',
        '  0', 'VERTEX', '  8', 'WALL', ' 10', '10', ' 20', '10',
        '  0', 'SEQEND', '  8', 'WALL',
        '  0', 'LINE', '  8', '0', ' 10', '0', ' 20', '20', ' 11', '5', ' 21', '20',
        // a polyface mesh is a 3D surface, not an outline
        '  0', 'POLYLINE', '  8', '0', ' 66', '1', ' 70', '64',
        '  0', 'VERTEX', '  8', '0', ' 10', '1', ' 20', '1', ' 70', '192',
        '  0', 'VERTEX', '  8', '0', ' 70', '128', ' 71', '1',
        '  0', 'SEQEND',
      ],
    );
    const parsed = parseDxf(dxf);
    expect(parsed.entities.map((e) => e.type)).toEqual(['LWPOLYLINE', 'LINE']);
    const pl = parsed.entities[0]!;
    expect(pl.layer).toBe('WALL');
    expect(pl.isClosed).toBe(true);
    expect(pl.points).toEqual([{ x: 0, y: 0 }, { x: 10, y: 0, bulge: 1 }, { x: 10, y: 10 }]);
    const doc = new Doc();
    loadDxfIntoDoc(doc, parsed);
    // three closed segments (one an arc) and the line after the SEQEND
    expect(doc.edges.size).toBe(4);
    expect([...doc.edges.values()].filter((e) => e.type === 'arc')).toHaveLength(1);
  });

  it("keeps a model-space INSERT's own y-scale and mirror: a derived block holds the stretch", () => {
    const dxf = file(
      [
        '  0', 'BLOCK', '  2', 'BAR', ' 10', '1', ' 20', '0',
        '  0', 'LINE', '  8', '0', ' 10', '1', ' 20', '0', ' 11', '2', ' 21', '1',
        '  0', 'ENDBLK',
      ],
      [
        '  0', 'INSERT', '  8', '0', '  2', 'BAR', ' 10', '10', ' 20', '10', ' 41', '2', ' 42', '-3', ' 50', '0',
        '  0', 'INSERT', '  8', '0', '  2', 'BAR', ' 10', '0', ' 20', '0', ' 41', '2', ' 42', '2',
        // group 42 omitted: DXF's default is 1, not the x-scale
        '  0', 'INSERT', '  8', '0', '  2', 'BAR', ' 10', '0', ' 20', '0', ' 41', '2',
      ],
    );
    const doc = new Doc();
    loadDxfIntoDoc(doc, parseDxf(dxf));
    const placed = [...doc.blockInstances.values()];
    expect(placed.map((i) => [i.blockName, i.scale])).toEqual([['BAR_X2_Y-3', 1], ['BAR', 2], ['BAR_X2_Y1', 1]]);
    const line = doc.blocks.get('BAR_X2_Y-3')!.lines[0]!;
    // BAR's 1,0→2,1 less its base 1,0 is 0,0→1,1; stretched ×2 in x, ×-3 in y
    expect([line.x1, line.y1, line.x2, line.y2].map((v) => v + 0)).toEqual([0, 0, 2, -3]);
    expect(doc.blocks.get('BAR')!.lines[0]).toMatchObject({ x1: 0, y1: 0, x2: 1, y2: 1 });
  });

  it("stretches a block only the session knows into a derived block, the session's own untouched", () => {
    const doc = new Doc();
    doc.addBlockDefinition({
      name: 'PEG', basePoint: { x: 0, y: 0 },
      lines: [{ x1: 0, y1: 0, x2: 1, y2: 1, layerId: '0' }],
      arcs: [],
      circles: [{ cx: 0, cy: 0, r: 1, layerId: '0' }],
      fills: [{ points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }], color: '#ff0000', layerId: '0' }],
    });
    loadDxfIntoDoc(doc, parseDxf(file([], ['  0', 'INSERT', '  8', '0', '  2', 'PEG', ' 10', '5', ' 20', '5', ' 41', '2', ' 42', '3'])));
    expect([...doc.blockInstances.values()].map((i) => [i.blockName, i.scale, i.x, i.y])).toEqual([['PEG_X2_Y3', 1, 5, 5]]);
    const peg = doc.blocks.get('PEG_X2_Y3')!;
    expect(peg.lines[0]).toMatchObject({ x1: 0, y1: 0, x2: 2, y2: 3 });
    // a circle stretched into an ellipse is no circle any more: an outline of lines
    expect(peg.circles).toHaveLength(0);
    expect(Math.max(...peg.lines.map((l) => l.y1))).toBeCloseTo(3);
    expect(peg.fills![0]).toMatchObject({ color: '#ff0000', points: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 3 }] });
    expect(doc.blocks.get('PEG')!.lines[0]).toMatchObject({ x2: 1, y2: 1 });
  });

  it('names what it reads past: unsupported types and mesh POLYLINEs, not the SEQEND of an INSERT', () => {
    const dxf = file(
      ['  0', 'BLOCK', '  2', 'TAG', ' 10', '0', ' 20', '0', '  0', 'ATTDEF', '  8', '0', '  0', 'ENDBLK'],
      [
        '  0', '3DFACE', '  8', '0', ' 10', '0', ' 20', '0',
        '  0', '3DFACE', '  8', '0', ' 10', '0', ' 20', '0',
        '  0', 'LEADER', '  8', '0',
        '  0', 'INSERT', '  8', '0', '  2', 'TAG', ' 66', '1',
        '  0', 'SEQEND',
        '  0', 'POLYLINE', '  8', '0', ' 66', '1', ' 70', '16',
        '  0', 'VERTEX', '  8', '0', ' 10', '1', ' 20', '1', ' 70', '64',
        '  0', 'SEQEND',
        '  0', 'LINE', '  8', '0', ' 10', '0', ' 20', '0', ' 11', '1', ' 21', '0',
      ],
    );
    const parsed = parseDxf(dxf);
    expect(parsed.skipped).toEqual({ '3DFACE': 2, LEADER: 1, ATTDEF: 1, 'POLYLINE (mesh)': 1 });
    expect(parsed.entities.map((e) => e.type)).toEqual(['INSERT', 'LINE']);
    expect(skippedSummary(parsed.skipped)).toBe('Not imported: 3DFACE ×2, ATTDEF ×1, LEADER ×1, POLYLINE (mesh) ×1.');
    expect(skippedSummary({})).toBe('');
  });
});
