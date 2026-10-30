// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import type { Layer } from '../../core/types';
import { Doc } from '../../model/Doc';
import { layersFromDxf } from '../importDxf/layersFromDxf';
import { loadDxfIntoDoc } from '../importDxf/loadDxfIntoDoc';
import { parseDxf } from '../importDxf/parseDxf';
import { buildDxf } from './buildDxf';
import { dxfLineweight } from './dxfLinetypes';

/** A sheet with something of every kind on four layers. */
function sheet(): { doc: Doc; layers: Layer[] } {
  const layers: Layer[] = [
    { id: '0', name: '0', color: '#ffffff', dxfColorIndex: 7, visible: true },
    { id: 'Walls', name: 'Walls', color: '#ef4444', dxfColorIndex: 1, visible: true, lineweight: 50 },
    { id: 'Hidden', name: 'Hidden', color: '#3b82f6', visible: false, linetype: 'HIDDEN' },
    {
      id: 'Axes',
      name: 'Axes',
      color: '#22c55e',
      dxfColorIndex: 3,
      visible: true,
      locked: true,
      linetype: 'CENTER',
      lineweight: 18,
    },
  ];
  const doc = new Doc();
  doc.addLine({ x: 0, y: 0 }, { x: 100, y: 0 }, doc.newGroupId(), 'Walls');
  doc.addArc(0, 0, 50, { x: 50, y: 0 }, { x: 0, y: 50 }, doc.newGroupId(), 'Axes');
  doc.addLine({ x: 0, y: 10 }, { x: 0, y: 90 }, doc.newGroupId(), 'Hidden');
  doc.addText('A1', 5, 5, 2.5, 0, 'Axes');
  doc.addFill(
    [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ],
    'solid',
    'Walls',
  );
  return { doc, layers };
}

describe('buildDxf layers', () => {
  it('writes every layer with its name, colour, linetype, lineweight and state', () => {
    const { doc, layers } = sheet();
    const parsed = parseDxf(buildDxf(doc, 'mm', layers));
    const byName = new Map(parsed.layers.map((l) => [l.name, l]));

    expect([...byName.keys()]).toEqual(['0', 'Walls', 'Hidden', 'Axes']);
    expect(byName.get('Walls')).toMatchObject({ colorIndex: 1, linetype: 'CONTINUOUS', lineweight: 50 });
    // no index on the layer: the nearest to its colour, and off because hidden
    expect(byName.get('Hidden')).toMatchObject({ colorIndex: 5, linetype: 'HIDDEN', isOff: true });
    expect(byName.get('Axes')).toMatchObject({
      colorIndex: 3,
      linetype: 'CENTER',
      lineweight: 18,
      isLocked: true,
      isOff: false,
    });
    expect(byName.get('0')).toMatchObject({ colorIndex: 7, lineweight: -3 });
  });

  it('declares every linetype a layer names, with its pattern in drawing units', () => {
    const { doc, layers } = sheet();
    const mm = parseDxf(buildDxf(doc, 'mm', layers));
    const inch = parseDxf(buildDxf(doc, 'in', layers));
    const names = mm.linetypes.map((l) => l.name);
    expect(names).toEqual(expect.arrayContaining(['CONTINUOUS', 'HIDDEN', 'CENTER']));
    for (const layer of mm.layers) expect(names).toContain(layer.linetype);
    expect(inch.linetypes.find((l) => l.name === 'HIDDEN')?.pattern).toEqual([0.25, -0.125]);
    expect(mm.linetypes.find((l) => l.name === 'HIDDEN')?.pattern).toEqual([6.35, -3.175]);
  });

  it('puts every entity on its own layer', () => {
    const { doc, layers } = sheet();
    const parsed = parseDxf(buildDxf(doc, 'mm', layers));
    const on = (type: string) => parsed.entities.filter((e) => e.type === type).map((e) => e.layer);
    expect(on('LINE').sort()).toEqual(['Hidden', 'Walls']);
    expect(on('ARC')).toEqual(['Axes']);
    expect(on('TEXT')).toEqual(['Axes']);
    expect(on('HATCH')).toEqual(['Walls']);
  });

  it('declares a layer an entity uses that the sheet never listed', () => {
    const doc = new Doc();
    doc.addLine({ x: 0, y: 0 }, { x: 1, y: 1 }, doc.newGroupId(), 'Stray');
    const parsed = parseDxf(buildDxf(doc, 'mm', []));
    expect(parsed.layers.map((l) => l.name)).toEqual(['0', 'Stray']);
    expect(parsed.entities[0]?.layer).toBe('Stray');
  });

  it('writes a layer name a strict reader accepts, and its entities under it', () => {
    const doc = new Doc();
    doc.addLine({ x: 0, y: 0 }, { x: 1, y: 1 }, doc.newGroupId(), 'Walls/Ext');
    const layers: Layer[] = [{ id: 'Walls/Ext', name: 'Walls/Ext', color: '#ef4444', visible: true }];
    const parsed = parseDxf(buildDxf(doc, 'mm', layers));
    expect(parsed.layers.map((l) => l.name)).toEqual(['0', 'Walls_Ext']);
    expect(parsed.entities[0]?.layer).toBe('Walls_Ext');
  });

  it('keeps the colour and linetype of a user-styled layer 0', () => {
    const layers: Layer[] = [
      { id: '0', name: '0', color: '#ff0000', dxfColorIndex: 1, visible: true, linetype: 'DASHED' },
    ];
    const parsed = parseDxf(buildDxf(new Doc(), 'mm', layers));
    expect(parsed.layers).toHaveLength(1);
    expect(parsed.layers[0]).toMatchObject({ name: '0', colorIndex: 1, linetype: 'DASHED' });
  });

  it('snaps a lineweight to a DXF step', () => {
    expect(dxfLineweight(undefined)).toBe(-3);
    expect(dxfLineweight(24)).toBe(25);
    expect(dxfLineweight(52)).toBe(53);
    expect(dxfLineweight(999)).toBe(211);
  });
});

describe('DXF round trip', () => {
  it('comes back through the import with the same layers and the entities on them', () => {
    const { doc, layers } = sheet();
    const parsed = parseDxf(buildDxf(doc, 'mm', layers));
    const back = layersFromDxf(parsed);
    expect(back.map((l) => l.name)).toEqual(layers.map((l) => l.name));
    for (const original of layers) {
      const l = back.find((b) => b.name === original.name)!;
      expect(l.visible).toBe(original.visible);
      expect(!!l.locked).toBe(!!original.locked);
      expect(l.linetype).toBe(original.linetype);
      expect(l.lineweight).toBe(original.lineweight);
      expect(l.dxfColorIndex).toBeGreaterThan(0);
    }
    expect(back.find((l) => l.name === 'Walls')?.dxfColorIndex).toBe(1);

    const doc2 = new Doc();
    loadDxfIntoDoc(doc2, parsed);
    const layerOf = (pick: (d: Doc) => Iterable<{ layerId: string }>) =>
      [...pick(doc2)].map((e) => e.layerId).sort();
    expect(layerOf((d) => d.edges.values())).toEqual([...layerOf(() => doc.edges.values())]);
    expect(layerOf((d) => d.texts.values())).toEqual(['Axes']);
    expect(layerOf((d) => d.fills.values())).toEqual(['Walls']);
  });

  it('brings a fill back with its outline only, not the hatch elevation point', () => {
    const { doc, layers } = sheet();
    const doc2 = new Doc();
    loadDxfIntoDoc(doc2, parseDxf(buildDxf(doc, 'mm', layers)));
    const fill = [...doc2.fills.values()][0]!;
    expect(fill.type).toBe('solid');
    expect(fill.points).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ]);
  });

  it('keeps a pattern hatch a pattern hatch', () => {
    const doc = new Doc();
    doc.addFill(
      [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 5, y: 5 },
      ],
      'hatch',
    );
    const doc2 = new Doc();
    loadDxfIntoDoc(doc2, parseDxf(buildDxf(doc, 'mm', [])));
    expect([...doc2.fills.values()][0]?.type).toBe('hatch');
  });

  it('carries a linetype it does not know by name back out with its pattern', () => {
    const custom = [
      '  0', 'SECTION', '  2', 'TABLES',
      '  0', 'TABLE', '  2', 'LTYPE', ' 70', '1',
      '  0', 'LTYPE', '  2', 'FENCE', ' 70', '0', '  3', 'Fence', ' 72', '65', ' 73', '2', ' 40', '3.0',
      ' 49', '2.0', ' 74', '0', ' 49', '-1.0', ' 74', '0',
      '  0', 'ENDTAB',
      '  0', 'TABLE', '  2', 'LAYER', ' 70', '1',
      '  0', 'LAYER', '  2', 'Site', ' 70', '0', ' 62', '4', '  6', 'FENCE', '370', '35',
      '  0', 'ENDTAB', '  0', 'ENDSEC',
      '  0', 'SECTION', '  2', 'ENTITIES',
      '  0', 'LINE', '  8', 'Site', ' 10', '0', ' 20', '0', ' 11', '1', ' 21', '1',
      '  0', 'ENDSEC', '  0', 'EOF',
    ].join('\n');
    const layers = layersFromDxf(parseDxf(custom), 2);
    const site = layers.find((l) => l.name === 'Site')!;
    expect(site).toMatchObject({ linetype: 'FENCE', linetypePattern: [4, -2], lineweight: 35 });

    const doc = new Doc();
    doc.addLine({ x: 0, y: 0 }, { x: 1, y: 1 }, doc.newGroupId(), 'Site');
    const again = parseDxf(buildDxf(doc, 'mm', layers));
    expect(again.linetypes.find((l) => l.name === 'FENCE')?.pattern).toEqual([4, -2]);
    expect(again.layers.find((l) => l.name === 'Site')).toMatchObject({ linetype: 'FENCE', colorIndex: 4 });
  });

  it('gives an entity on a layer the file never declared a layer of its own', () => {
    const bare = ['  0', 'SECTION', '  2', 'ENTITIES',
      '  0', 'LINE', '  8', 'Loose', ' 10', '0', ' 20', '0', ' 11', '1', ' 21', '1',
      '  0', 'ENDSEC', '  0', 'EOF'].join('\n');
    expect(layersFromDxf(parseDxf(bare)).map((l) => l.name)).toEqual(['Loose']);
  });
});
