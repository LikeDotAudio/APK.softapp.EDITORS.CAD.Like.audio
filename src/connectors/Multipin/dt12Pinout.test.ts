// Changelog:
//   2026-11-04 - ROAD-3492: new. Pins the DT12 mapping to the owner's reference and the Whirlwind sheet, the row arrangement, and the detail sheet's sourced insert.

import { describe, expect, it } from 'vitest';
import {
    DT12_PAIRS,
    DT12_PIN_COUNT,
    DT12_SPARE_PIN,
    dt12PinPoint,
    dt12RoleOf,
    dt12Rows,
} from './dt12Pinout';
import { DT12_DETAIL_BLOCK_NAME, buildDt12DetailBlock, dt12InsertDiameterMm } from './dt12DetailBlock';

describe('DT12 pin map', () => {
    it('is the owner reference, pair by pair', () => {
        // Owner's reference image, 2026-11-04.
        expect(DT12_PAIRS.map(p => p.hot)).toEqual([5, 3, 8, 16, 12, 19, 15, 24, 30, 27, 28, 35]);
        expect(DT12_PAIRS.map(p => p.cold)).toEqual([6, 7, 9, 17, 18, 20, 21, 29, 31, 32, 33, 36]);
        expect(DT12_PAIRS.map(p => p.drain)).toEqual([1, 2, 4, 10, 11, 13, 14, 23, 25, 26, 22, 34]);
        expect(DT12_PAIRS.map(p => p.pair)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it('uses every one of 37 contacts exactly once, with 37 spare', () => {
        const used = DT12_PAIRS.flatMap(p => [p.hot, p.cold, p.drain]);
        expect(new Set(used).size).toBe(36);
        expect(used.includes(DT12_SPARE_PIN)).toBe(false);
        expect([...used, DT12_SPARE_PIN].sort((a, b) => a - b)).toEqual(Array.from({ length: DT12_PIN_COUNT }, (_, i) => i + 1));
        expect(dt12RoleOf(37)).toEqual({ role: 'spare', pair: null });
        expect(dt12RoleOf(5)).toEqual({ role: 'hot', pair: 1 });
        expect(dt12RoleOf(36)).toEqual({ role: 'cold', pair: 12 });
        expect(dt12RoleOf(22)).toEqual({ role: 'drain', pair: 11 });
    });

    it('agrees with the Whirlwind DT-12 sheet labels (n+ / n- / nG)', () => {
        // Transcribed from the sheet's male view, row by row.
        const whirlwind: Record<number, string> = {
            37: 'X', 36: '12-', 35: '12+', 34: '12G',
            33: '11-', 32: '10-', 31: '9-', 30: '9+', 29: '8-',
            28: '11+', 27: '10+', 26: '10G', 25: '9G', 24: '8+', 23: '8G',
            22: '11G', 21: '7-', 20: '6-', 19: '6+', 18: '5-', 17: '4-', 16: '4+',
            15: '7+', 14: '7G', 13: '6G', 12: '5+', 11: '5G', 10: '4G',
            9: '3-', 8: '3+', 7: '2-', 6: '1-', 5: '1+',
            4: '3G', 3: '2+', 2: '2G', 1: '1G',
        };
        const sym = { hot: '+', cold: '-', drain: 'G' } as const;
        for (let pin = 1; pin <= 37; pin++) {
            const r = dt12RoleOf(pin);
            const label = r.role === 'spare' ? 'X' : `${r.pair}${sym[r.role]}`;
            expect(label, `pin ${pin}`).toBe(whirlwind[pin]);
        }
    });
});

describe('DT12 arrangement', () => {
    it('has seven staggered rows of 4-5-6-7-6-5-4', () => {
        expect(dt12Rows('male').map(r => r.length)).toEqual([4, 5, 6, 7, 6, 5, 4]);
    });

    it('puts pin 1 bottom right on the male view and bottom left on the female', () => {
        const m = dt12Rows('male');
        const f = dt12Rows('female');
        expect(m[6][m[6].length - 1]).toBe(1);
        expect(f[6][0]).toBe(1);
        expect(m[0]).toEqual([37, 36, 35, 34]);
        expect(f[0]).toEqual([34, 35, 36, 37]);
    });

    it('mirrors male to female about the vertical axis', () => {
        for (let pin = 1; pin <= 37; pin++) {
            const a = dt12PinPoint('male', pin, 5)!;
            const b = dt12PinPoint('female', pin, 5)!;
            expect(b.x).toBeCloseTo(-a.x, 9);
            expect(b.y).toBeCloseTo(a.y, 9);
        }
    });

    it('draws every pair as a triangle of neighbouring contacts', () => {
        // The three contacts of a pair are never more than two lattice steps apart.
        for (const p of DT12_PAIRS) {
            const pts = [p.hot, p.cold, p.drain].map(n => dt12PinPoint('male', n, 1)!);
            for (const a of pts) for (const b of pts) {
                expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThanOrEqual(2 + 1e-9);
            }
        }
    });
});

describe('DT12 detail sheet', () => {
    const block = buildDt12DetailBlock();

    it('is a named CAD block whose insert is the sourced bore, in mm', () => {
        expect(block.name).toBe(DT12_DETAIL_BLOCK_NAME);
        expect(dt12InsertDiameterMm()).toBeCloseTo(41.275, 6);
        const inserts = block.circles.filter(c => Math.abs(c.r - 41.275 / 2) < 1e-9);
        expect(inserts).toHaveLength(2);      // male + female
    });

    it('draws 37 coloured contacts and 12 triangles per view', () => {
        expect(block.fills!.filter(f => f.points.length === 16)).toHaveLength(74);
        // 12 triangles x 3 edges x 2 views, plus legend swatches and the table grid.
        expect(block.lines.length).toBeGreaterThanOrEqual(72);
    });

    it('carries the legend, both view titles, the pairs table and the NTS note', () => {
        const t = block.texts!.map(x => x.text);
        for (const s of ['MALE - REAR VIEW', 'FEMALE - REAR VIEW', 'HOT (+)', 'COLD (-)', 'DRAIN (G)', 'SPARE (37)', 'PAIR', 'HOT', 'COLD', 'DRAIN']) {
            expect(t).toContain(s);
        }
        expect(t.some(s => s.includes('PIN PITCH NTS'))).toBe(true);
        expect(t.some(s => s.includes('mm'))).toBe(true);
    });

    it('keeps every contact inside its insert circle', () => {
        const r = dt12InsertDiameterMm() / 2;
        for (let pin = 1; pin <= 37; pin++) {
            const p = dt12PinPoint('male', pin, 5)!;
            expect(Math.hypot(p.x, p.y) + 1.4).toBeLessThan(r);
        }
    });
});
