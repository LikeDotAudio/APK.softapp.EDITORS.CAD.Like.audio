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
