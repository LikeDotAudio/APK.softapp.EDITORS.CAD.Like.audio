// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it, vi } from 'vitest';
import { Doc } from '../Doc';
import { mirrorNewlyAddedEntities } from '../doc/mirrorNewlyAddedEntities';
import { addPaletteFill } from './addPaletteFill';
import { closedLoopAt } from './closedLoopAt';
import { metresToUnits } from './metresToUnits';
import { paletteBlockDefinition } from './paletteBlockDefinition';
import { paletteFootprint } from './paletteFootprint';
import { parsePalette } from './parsePalette';
import { EditorStore } from '../../state/EditorStore';
import { placePaletteBlock } from './placePaletteBlock';
import { regionAt, tileCentres } from './regionAt';
import type { PaletteItem } from './PaletteItem';

const qrd: PaletteItem = { id: 'qrd-600', name: 'QRD diffuser', category: 'Diffuser', color: '#aa8833', hatch: 'GRID', size: [0.6, 0.6] };
const gypsum: PaletteItem = { id: 'gypsum', name: 'Gypsum board', category: 'Lining', color: '#dddddd' };

const width = (pts: { x: number }[]) => Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));

describe('metresToUnits', () => {
  it('converts the host metres into every drawing unit', () => {
    expect(metresToUnits(1, 'm')).toBeCloseTo(1);
    expect(metresToUnits(1, 'mm')).toBeCloseTo(1000);
    expect(metresToUnits(1, 'cm')).toBeCloseTo(100);
    expect(metresToUnits(0.0254, 'in')).toBeCloseTo(1);
    expect(metresToUnits(0.3048, 'ft')).toBeCloseTo(1);
  });
});

describe('parsePalette', () => {
  it('keeps good rows, drops bad ones and repeated ids, and defaults the rest', () => {
    const p = parsePalette({
      title: 'Materials',
      items: [
        { id: 'a', name: 'A', category: 'X', color: '#111', hatch: 'solid', size: [1, 2], note: 'n' },
        { id: 'a', name: 'dup' },
        { name: 'no id' },
        { id: 'b', size: [0, 1] },
        null,
      ],
    })!;
    expect(p.title).toBe('Materials');
    expect(p.items).toEqual([
      { id: 'a', name: 'A', category: 'X', color: '#111', hatch: 'SOLID', size: [1, 2], note: 'n' },
      { id: 'b', name: 'b', category: 'Other', color: '#888888' },
    ]);
    expect(parsePalette({ items: 'nope' })).toBeNull();
  });

  it('keeps what the preview draws with — symbol, its name and hatch, α per octave, depth — and drops a bad one', () => {
    const p = parsePalette({
      items: [
        { id: 'w', symbol: ' Batt ', symbolName: 'Batt insulation', acad: 'insul', alpha: [0.45, 0.9, 1, 1, 1, 1], depth: 0.1 },
        { id: 'x', symbol: '', alpha: [0.5, 'a'], depth: -1 },
        { id: 'y', alpha: [2], depth: 9 },
      ],
    })!;
    expect(p.items[0]).toMatchObject({ symbol: 'batt', symbolName: 'Batt insulation', acad: 'INSUL', alpha: [0.45, 0.9, 1, 1, 1, 1], depth: 0.1 });
    for (const it of p.items.slice(1)) {
      expect(it.symbol).toBeUndefined();
      expect(it.alpha).toBeUndefined();
      expect(it.depth).toBeUndefined();
    }
  });
});

describe('paletteBlockDefinition', () => {
  it('is the size rectangle in doc units, centred on its base point, filled in the item colour', () => {
    const def = paletteBlockDefinition(qrd, 'mm')!;
    expect(def.name).toBe('PAL:qrd-600');
    expect(def.basePoint).toEqual({ x: 0, y: 0 });
    expect(def.lines).toHaveLength(4);
    const fill = def.fills![0]!;
    expect(fill.color).toBe('#aa8833');
    expect(fill.hatchPattern).toBe('GRID');
    expect(fill.points.map((p) => [p.x, p.y])).toEqual([[-300, -300], [300, -300], [300, 300], [-300, 300]]);
    expect(def.texts![0]!.text).toBe('QRD diffuser');
  });

  it('is nothing for a finish, which has no size', () => {
    expect(paletteBlockDefinition(gypsum, 'm')).toBeNull();
  });
});

describe('placePaletteBlock', () => {
  it('registers the definition once and tags the instance with paletteId', () => {
    const doc = new Doc();
    const a = placePaletteBlock(doc, qrd, 'in', { x: 1, y: 2 }, 0, 'Elevation Front')!;
    const b = placePaletteBlock(doc, qrd, 'in', { x: 50, y: 2 }, 0, 'Elevation Front')!;
    expect([...doc.blocks.keys()].filter((k) => k.startsWith('PAL:'))).toEqual(['PAL:qrd-600']);
    const inst = doc.blockInstances.get(a)!;
    expect(inst.attributes).toEqual({ paletteId: 'qrd-600' });
    expect(inst.layerId).toBe('Elevation Front');
    expect(width(paletteFootprint(doc, doc.blockInstances.get(b)!)!)).toBeCloseTo(0.6 / 0.0254);
  });

  it('keeps an old definition after a unit switch and scales new instances to true size', () => {
    const doc = new Doc();
    placePaletteBlock(doc, qrd, 'in', { x: 0, y: 0 }, 0, '0');
    doc.scaleAll(25.4); // in → mm
    const b = placePaletteBlock(doc, qrd, 'mm', { x: 0, y: 0 }, 0, '0')!;
    for (const inst of doc.blockInstances.values()) {
      expect(width(paletteFootprint(doc, inst)!)).toBeCloseTo(600);
    }
    expect(doc.blockInstances.get(b)!.scale).toBeCloseTo(25.4);
  });
});

describe('addPaletteFill', () => {
  it('paints a finish as a hatch fill carrying paletteId, and undo snapshots keep it', () => {
    const doc = new Doc();
    const id = addPaletteFill(doc, gypsum, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }], '0')!;
    const f = doc.fills.get(id)!;
    expect(f).toMatchObject({ type: 'hatch', hatchPattern: 'ANSI31', color: '#dddddd', paletteId: 'gypsum' });

    const snap = doc.snapshot();
    doc.removeFill(id);
    doc.restore(snap);
    expect(doc.fills.get(id)?.paletteId).toBe('gypsum');
  });

  it('paints SOLID flat', () => {
    const doc = new Doc();
    const id = addPaletteFill(doc, { ...gypsum, hatch: 'SOLID' }, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }], '0')!;
    expect(doc.fills.get(id)!.type).toBe('solid');
  });
});

describe('closedLoopAt', () => {
  it('finds the smallest closed outline on the layer around a point', () => {
    const doc = new Doc();
    const box = (x0: number, y0: number, x1: number, y1: number, layer: string) => {
      doc.addLine({ x: x0, y: y0 }, { x: x1, y: y0 }, 0, layer);
      doc.addLine({ x: x1, y: y0 }, { x: x1, y: y1 }, 0, layer);
      doc.addLine({ x: x1, y: y1 }, { x: x0, y: y1 }, 0, layer);
      doc.addLine({ x: x0, y: y1 }, { x: x0, y: y0 }, 0, layer);
    };
    box(0, 0, 10, 5, 'wall');
    box(2, 1, 4, 3, 'wall');
    box(20, 0, 30, 5, 'other');
    expect(width(closedLoopAt(doc, { x: 3, y: 2 }, 'wall')!)).toBeCloseTo(2);
    expect(width(closedLoopAt(doc, { x: 8, y: 4 }, 'wall')!)).toBeCloseTo(10);
    expect(closedLoopAt(doc, { x: 25, y: 2 }, 'wall')).toBeNull();
  });
});

describe('regionAt', () => {
  // the front wall of the callouts sheet: 4200 × 3000, division lines at 600, 1500, 2700, 3600 and 900, 2100 high
  const wall = () => {
    const doc = new Doc();
    const line = (x0: number, y0: number, x1: number, y1: number) => doc.addLine({ x: x0, y: y0 }, { x: x1, y: y1 }, 0, 'Elevation Front');
    line(0, 0, 4200, 0);
    line(4200, 0, 4200, 3000);
    line(4200, 3000, 0, 3000);
    line(0, 3000, 0, 0);
    line(600, -50, 600, 3050); // overshooting both ends
    line(3600, 0, 3600, 3000);
    line(600, 900, 3600, 900); // stopping on the verticals: a T at each end
    line(600, 2100, 3600, 2100);
    line(1500, 900, 1500, 2100);
    line(2700, 900, 2700, 2100);
    line(1000, 300, 1100, 400); // a stray stub, ignored
    return doc;
  };
  const box = (pts: { x: number; y: number }[]) => [Math.min(...pts.map((p) => p.x)), Math.min(...pts.map((p) => p.y)), Math.max(...pts.map((p) => p.x)), Math.max(...pts.map((p) => p.y))].map((v) => Math.round(v * 1000) / 1000);

  it('finds the bay a click lands in, between division lines that cross, T and overshoot', () => {
    const doc = wall();
    expect(box(regionAt(doc, { x: 1000, y: 1500 }, 'Elevation Front')!)).toEqual([600, 900, 1500, 2100]);
    expect(box(regionAt(doc, { x: 2100, y: 1500 }, 'Elevation Front')!)).toEqual([1500, 900, 2700, 2100]);
    expect(box(regionAt(doc, { x: 300, y: 2900 }, 'Elevation Front')!)).toEqual([0, 0, 600, 3000]);
    expect(box(regionAt(doc, { x: 2000, y: 300 }, 'Elevation Front')!)).toEqual([600, 0, 3600, 900]);
  });

  it('is nothing outside the wall or on another layer', () => {
    const doc = wall();
    expect(regionAt(doc, { x: 5000, y: 1500 }, 'Elevation Front')).toBeNull();
    expect(regionAt(doc, { x: 1000, y: 1500 }, 'Elevation Back')).toBeNull();
  });

  it('tiles a region with whole tiles only, from its bottom-left', () => {
    const bay = [{ x: 1500, y: 900 }, { x: 2700, y: 900 }, { x: 2700, y: 2100 }, { x: 1500, y: 2100 }];
    const c = tileCentres(bay, 1200, 600);
    expect(c).toHaveLength(2);
    expect(c[0]!.x).toBeCloseTo(2100);
    expect(c[0]!.y).toBeCloseTo(1200);
    expect(c[1]!.y).toBeCloseTo(1800);
    expect(tileCentres(bay, 1300, 600)).toHaveLength(0);
  });
});

describe('mirroring palette patches', () => {
  it('mirrors a new fill with its palette tag, and never an old edge that shares its id', () => {
    const doc = new Doc();
    doc.addLine({ x: 1, y: 0 }, { x: 2, y: 0 }); // edge 1, already there
    const before = doc.snapshot();
    addPaletteFill(doc, gypsum, [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }], '0'); // fill 1
    mirrorNewlyAddedEntities(doc, before, 0);
    expect(doc.edges.size).toBe(1);
    const fills = [...doc.fills.values()];
    expect(fills).toHaveLength(2);
    expect(fills[1]!.paletteId).toBe('gypsum');
    expect(fills[1]!.points[0]!.x).toBeCloseTo(-1);
  });
});

describe('a repeated palette', () => {
  it('is idempotent: the same palette twice leaves one catalogue, the item armed, one PAL: block', () => {
    // The store paints through requestAnimationFrame; under node a frame never needs to happen.
    vi.stubGlobal('requestAnimationFrame', () => 1);
    const store = new EditorStore();
    store.autoSaveSession = async () => {};
    const msg = { title: 'Materials', items: [qrd, gypsum] };
    store.setPalette(parsePalette(msg));
    store.armPaletteItem('qrd-600');
    store.edit(() => placePaletteBlock(store.doc, store.paletteItem()!, store.units, { x: 0, y: 0 }, 0, '0') !== null);
    store.setPalette(parsePalette(msg));
    store.edit(() => placePaletteBlock(store.doc, store.paletteItem()!, store.units, { x: 9, y: 0 }, 0, '0') !== null);
    expect(store.palette!.items).toHaveLength(2);
    expect(store.paletteItemId).toBe('qrd-600');
    expect([...store.doc.blocks.keys()].filter((k) => k.startsWith('PAL:'))).toEqual(['PAL:qrd-600']);
    expect(store.doc.blockInstances.size).toBe(2);
    vi.unstubAllGlobals();
  });
});
