// Changelog:
//   2026-08-13 11:42 - new: pin the cutout-geometry schema, the class derivation, and — most of all — that the registry is empty and cutoutOf is unchanged by its existence.
//   2026-11-04 - ROAD-3492: the registry is populated from manufacturer datasheets; the emptiness pin becomes a sourcing pin — every entry cites its document and every number traces to a quoted callout.

/**
 * src/connectors/cutoutGeometry.test.ts
 *
 * A hole diameter is a fabrication value. The ruling (owner, 2026-11-04) is that
 * a manufacturer datasheet is a source WHEN THE ENTRY CITES IT — so the first
 * block here is the important one: it fails on any entry without a complete
 * citation, and on any number that cannot be traced to a callout the entry
 * quotes from its document.
 */

import { describe, expect, it } from 'vitest';
import {
    CONNECTOR_GEOMETRY,
    classFromGeometry,
    geometryExtent,
    geometryOf,
    quotedMm,
    type ConnectorGeometry,
    type CutoutFeature,
} from './cutoutGeometry';
import { cutoutOf } from './cutoutClasses';

const entries = Object.entries(CONNECTOR_GEOMETRY);
const EPS = 1e-9;

describe('cutout geometry — every entry is sourced', () => {
    it('has entries (the ruling now admits datasheets)', () => {
        expect(entries.length).toBeGreaterThan(0);
    });

    it.each(entries)('%s cites maker, part, document, url and retrieval date', (_key, g) => {
        expect(g.source, 'source').toBeDefined();
        expect(g.source.maker.trim()).not.toBe('');
        expect(g.source.partNumber.trim()).not.toBe('');
        expect(g.source.document.trim()).not.toBe('');
        expect(g.source.url).toMatch(/^https:\/\/[^\s]+$/);
        expect(g.source.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(['front', 'rear', 'unstated']).toContain(g.source.view);
        if (g.source.revision !== undefined) expect(g.source.revision.trim()).not.toBe('');
        expect(g.quoted.length).toBeGreaterThan(0);
        for (const q of g.quoted) {
            expect(q.label.trim()).not.toBe('');
            expect(q.value).toBeGreaterThan(0);
        }
    });

    it.each(entries)('%s has no number that is not traceable to a quoted callout', (_key, g) => {
        // A feature value is traceable when it is 0 (on a centre line), a quoted
        // value, or half of one (a centre-to-centre spacing measured from the
        // body centre). Anything else came from somewhere the entry does not cite.
        const allowed = g.quoted.flatMap(q => [quotedMm(q), quotedMm(q) / 2]);
        const traceable = (v: number) => Math.abs(v) < EPS || allowed.some(a => Math.abs(Math.abs(v) - a) < EPS);
        const fields: (keyof CutoutFeature)[] = ['dx', 'dy', 'd', 'w', 'h'];
        for (const f of g.features) {
            for (const k of fields) {
                const v = f[k];
                if (typeof v !== 'number') continue;
                expect(traceable(v), `${k}=${v} on a ${f.kind}`).toBe(true);
            }
        }
    });

    it.each(entries)('%s quotes nothing it does not use', (_key, g) => {
        const used = g.features.flatMap(f => [f.dx, f.dy, f.d, f.w, f.h]).filter((v): v is number => typeof v === 'number').map(Math.abs);
        for (const q of g.quoted) {
            const mm = quotedMm(q);
            expect(used.some(u => Math.abs(u - mm) < EPS || Math.abs(u - mm / 2) < EPS), q.label).toBe(true);
        }
    });

    it('every round feature has a diameter and every straight one a width and height', () => {
        for (const [key, g] of entries) {
            for (const f of g.features) {
                if (f.kind === 'hole' || f.kind === 'screw') expect(f.d, key).toBeGreaterThan(0);
                else { expect(f.w, key).toBeGreaterThan(0); expect(f.h, key).toBeGreaterThan(0); }
            }
        }
    });
});

describe('cutout geometry — the numbers that were read', () => {
    it('DT12 is the Whirlwind cutout, converted from inches', () => {
        const g = geometryOf('DT12S')!;
        expect(g.source.maker).toBe('Whirlwind');
        const bore = g.features.find(f => f.kind === 'hole')!;
        expect(bore.d).toBeCloseTo(41.275, 6);          // Ø1.625 in
        const screws = g.features.filter(f => f.kind === 'screw');
        expect(screws).toHaveLength(4);
        for (const s of screws) {
            expect(s.d).toBeCloseTo(3.5814, 6);         // Ø0.141 in
            expect(Math.abs(s.dx)).toBeCloseTo(19.304, 6); // 1.520 in / 2
        }
        expect(geometryOf('DT12P')).toBe(g);
    });

    it('the Neutrik D pattern is mirrored to the front view', () => {
        const g = geometryOf('X3S')!;
        expect(g.source.view).toBe('rear');
        const screws = g.features.filter(f => f.kind === 'screw');
        // Front view: top-left and bottom-right.
        expect(screws.map(s => [Math.sign(s.dx), Math.sign(s.dy)])).toEqual([[-1, 1], [1, -1]]);
        // And the front-view BNC drawing agrees without mirroring.
        const bnc = geometryOf('BNC')!.features.filter(f => f.kind === 'screw');
        expect(bnc.map(s => [Math.sign(s.dx), Math.sign(s.dy)])).toEqual([[-1, 1], [1, -1]]);
    });

    it('the extent of a footprint covers every opening', () => {
        expect(geometryExtent(geometryOf('C14')!)).toEqual({ w: 43.5, h: 20 });
        const x = geometryExtent(geometryOf('X3S')!);
        expect(x.w).toBeCloseTo(23.6, 9);
        expect(x.h).toBeCloseTo(27.1, 9);
    });

    it('returns undefined where no datasheet was reachable', () => {
        expect(geometryOf('ROBO')).toBeUndefined();
        expect(geometryOf('SPK4S')).toBeUndefined();   // NL4MPR drawing has no panel cutout
        expect(geometryOf('NOT-A-CONNECTOR')).toBeUndefined();
        expect(geometryOf('toString')).toBeUndefined();
    });
});

describe('cutout geometry — the class derived from it', () => {
    const g = (features: ConnectorGeometry['features']) => ({ features });

    it('calls any straight-sided opening a square cutout', () => {
        expect(classFromGeometry(g([{ kind: 'square', dx: 0, dy: 0, w: 15, h: 15 }]))).toBe('square');
        expect(classFromGeometry(g([{ kind: 'rect', dx: 0, dy: 0, w: 23, h: 10 }]))).toBe('square');
    });

    it('lets a straight-sided opening win over a round one', () => {
        expect(classFromGeometry(g([
            { kind: 'hole', dx: 0, dy: 0, d: 12 },
            { kind: 'rect', dx: 0, dy: 8, w: 23, h: 10 },
        ]))).toBe('square');
    });

    it('calls a round bore with screws the standard D cutout', () => {
        expect(classFromGeometry(geometryOf('X3S')!)).toBe('D');
    });

    it('falls back to D rather than throwing on an empty feature list', () => {
        expect(classFromGeometry(g([]))).toBe('D');
    });
});

describe('cutout geometry — cutoutOf', () => {
    it('still lets a declared class win', () => {
        expect(cutoutOf('ROBO')).toBe('oversize-D');      // declared on the group
        expect(cutoutOf('ROBO-S')).toBe('oversize-D');
        expect(cutoutOf('KEY-Cat6')).toBe('square');      // group default, and the geometry agrees
        expect(cutoutOf('NOT-A-CONNECTOR')).toBe('D');    // unknown
    });

    it('derives the class from geometry where nothing is declared', () => {
        expect(cutoutOf('X3S')).toBe('D');
        expect(cutoutOf('C14')).toBe('square');           // Schurter 6100-3: a 28 × 20 rectangle
    });
});
