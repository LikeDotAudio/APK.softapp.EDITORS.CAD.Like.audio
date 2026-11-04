// Copyright (c) 2026 APK.audio.
//
// Changelog:
//   2026-11-04 - ROAD-3492: created. The DT12 detail sheet as a CAD block in mm:
//                male and female rear views (twelve colour-coded triangles and
//                the spare), a legend, and the pairs table.

/**
 * src/connectors/Multipin/dt12DetailBlock.ts
 *
 * One `CadBlockDefinition`, authored in MILLIMETRES (owner rule), that a
 * placement of a DT12 drops beside itself. Placing it at a scale of
 * `unitFactor('mm', doc units)` makes it true size on any sheet.
 *
 * What is sourced and what is diagram, said on the sheet itself:
 *   - the insert circle is the Whirlwind DT12 cutout bore, Ø1.625 in (41.275 mm),
 *     read from `CONNECTOR_GEOMETRY.DT12` rather than restated;
 *   - the contact ARRANGEMENT is the Whirlwind DT-12 pinout sheet;
 *   - the contact PITCH is not dimensioned by any source we hold, so the pins
 *     sit on a diagram lattice and the sheet carries "PIN PITCH NTS".
 */

import type { CadBlockDefinition, Point } from '../../core/types';
import { geometryOf } from '../cutoutGeometry';
import {
    DT12_PAIRS,
    DT12_PIN_COUNT,
    DT12_ROLE_COLORS,
    DT12_ROLE_LABELS,
    DT12_SPARE_PIN,
    dt12PinPoint,
    dt12RoleOf,
    type Dt12Gender,
    type Dt12Role,
} from './dt12Pinout';

export const DT12_DETAIL_BLOCK_NAME = 'DT12_PINOUT_DETAIL';

/** Diagram pitch between neighbouring contacts, mm (not a fabrication value). */
export const DT12_DIAGRAM_PITCH_MM = 5;
/** Drawn radius of one contact, mm. */
const PIN_R = 1.4;
/** Text heights, mm. */
const H_TITLE = 3;
const H_TEXT = 2.2;
const H_PIN = 1.1;

/** Centre of the male and the female view, mm, relative to the block base point. */
export const DT12_VIEW_CENTRES: Record<Dt12Gender, Point> = {
    male: { x: 0, y: 0 },
    female: { x: 50, y: 0 },
};

/** Insert diameter drawn around each view: the sourced cutout bore. */
export function dt12InsertDiameterMm(): number {
    const bore = geometryOf('DT12')?.features.find(f => f.kind === 'hole')?.d;
    if (bore == null) throw new Error('DT12 geometry has no sourced bore');
    return bore;
}

const circlePoly = (cx: number, cy: number, r: number, n = 16): Point[] =>
    Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    });

const rectPoly = (x: number, y: number, w: number, h: number): Point[] => [
    { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
];

/** Build the detail sheet. Pure: the same block every call. */
export function buildDt12DetailBlock(): CadBlockDefinition {
    const lines: CadBlockDefinition['lines'] = [];
    const circles: CadBlockDefinition['circles'] = [];
    const texts: NonNullable<CadBlockDefinition['texts']> = [];
    const fills: NonNullable<CadBlockDefinition['fills']> = [];
    const insertR = dt12InsertDiameterMm() / 2;

    const line = (a: Point, b: Point) => lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });

    for (const gender of ['male', 'female'] as const) {
        const c = DT12_VIEW_CENTRES[gender];
        const at = (pin: number): Point => {
            const p = dt12PinPoint(gender, pin, DT12_DIAGRAM_PITCH_MM)!;
            return { x: c.x + p.x, y: c.y + p.y };
        };
        circles.push({ cx: c.x, cy: c.y, r: insertR });
        texts.push({
            text: gender === 'male' ? 'MALE - REAR VIEW' : 'FEMALE - REAR VIEW',
            x: c.x - insertR, y: c.y + insertR + 3, height: H_TITLE,
        });
        // The twelve triangles, hot -> cold -> drain -> hot.
        for (const p of DT12_PAIRS) {
            const tri = [at(p.hot), at(p.cold), at(p.drain)];
            line(tri[0], tri[1]);
            line(tri[1], tri[2]);
            line(tri[2], tri[0]);
        }
        for (let pin = 1; pin <= DT12_PIN_COUNT; pin++) {
            const q = at(pin);
            circles.push({ cx: q.x, cy: q.y, r: PIN_R });
            fills.push({ points: circlePoly(q.x, q.y, PIN_R), color: DT12_ROLE_COLORS[dt12RoleOf(pin).role], opacity: 1 });
            texts.push({ text: String(pin), x: q.x + PIN_R * 0.9, y: q.y + PIN_R * 0.9, height: H_PIN });
        }
    }

    // Legend, under the two views.
    const legendY = -insertR - 8;
    const roles: Dt12Role[] = ['hot', 'cold', 'drain', 'spare'];
    roles.forEach((role, i) => {
        const x = DT12_VIEW_CENTRES.male.x - insertR + i * 22;
        const sq = rectPoly(x, legendY, 3, 3);
        fills.push({ points: sq, color: DT12_ROLE_COLORS[role], opacity: 1 });
        for (let k = 0; k < 4; k++) line(sq[k], sq[(k + 1) % 4]);
        texts.push({ text: DT12_ROLE_LABELS[role], x: x + 4, y: legendY + 0.4, height: H_TEXT });
    });

    // Pairs table, right of the female view.
    const cols = ['PAIR', 'HOT', 'COLD', 'DRAIN'];
    const colW = 11;
    const rowH = 4;
    const rows: string[][] = [
        cols,
        ...DT12_PAIRS.map(p => [String(p.pair), String(p.hot), String(p.cold), String(p.drain)]),
        ['SPARE', String(DT12_SPARE_PIN), '', ''],
    ];
    const tx = DT12_VIEW_CENTRES.female.x + insertR + 8;
    const ty = insertR + 3 + H_TITLE;
    const tw = cols.length * colW;
    const th = rows.length * rowH;
    for (let r = 0; r <= rows.length; r++) line({ x: tx, y: ty - r * rowH }, { x: tx + tw, y: ty - r * rowH });
    for (let k = 0; k <= cols.length; k++) line({ x: tx + k * colW, y: ty }, { x: tx + k * colW, y: ty - th });
    rows.forEach((row, r) => row.forEach((cell, k) => {
        if (!cell) return;
        texts.push({ text: cell, x: tx + k * colW + 1, y: ty - (r + 1) * rowH + 1, height: H_TEXT });
    }));

    // What is and is not to scale.
    const noteY = legendY - 6;
    texts.push({ text: 'DT12 / CANNON FK-37 - 12 PAIRS + SPARE. ALL DIMENSIONS mm.', x: -insertR, y: noteY, height: H_TEXT });
    texts.push({ text: `INSERT CIRCLE = CUTOUT BORE DIA ${(insertR * 2).toFixed(3)} (WHIRLWIND DT12 CUTOUT, DIA 1.625 in).`, x: -insertR, y: noteY - 3.5, height: H_TEXT });
    texts.push({ text: 'PIN ARRANGEMENT: WHIRLWIND DT-12 PINOUT SHEET. PIN PITCH NTS (NOT DIMENSIONED BY SOURCE).', x: -insertR, y: noteY - 7, height: H_TEXT });

    return {
        name: DT12_DETAIL_BLOCK_NAME,
        description: 'DT12 / Cannon FK-37 pinout detail: male and female rear views, legend, pairs table (mm)',
        basePoint: { x: 0, y: 0 },
        lines,
        arcs: [],
        circles,
        texts,
        fills,
    };
}

/**
 * Where the detail sheet's base point goes relative to the DT12 it documents,
 * in mm: to the right of the connector's footprint, clear of it.
 */
export function dt12DetailOffsetMm(footprintWidthMm: number): Point {
    const insertR = dt12InsertDiameterMm() / 2;
    return { x: footprintWidthMm / 2 + 15 + insertR, y: 0 };
}
