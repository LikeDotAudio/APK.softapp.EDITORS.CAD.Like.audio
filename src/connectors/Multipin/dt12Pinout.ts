// Copyright (c) 2026 APK.audio.
//
// Changelog:
//   2026-11-04 - ROAD-3492: created. The DT12 / Cannon FK-37 pin map — twelve
//                hot/cold/drain triangles and spare pin 37 — and the row
//                arrangement of the 37 contacts, male and female, from the
//                owner's reference image and the Whirlwind DT-12 pinout sheet.

/**
 * src/connectors/Multipin/dt12Pinout.ts
 *
 * THE MAPPING (owner's reference image, 2026-11-04), pairs 1-12:
 *     hot   5, 3, 8, 16, 12, 19, 15, 24, 30, 27, 28, 35
 *     cold  6, 7, 9, 17, 18, 20, 21, 29, 31, 32, 33, 36
 *     drain 1, 2, 4, 10, 11, 13, 14, 23, 25, 26, 22, 34
 *     pin 37 spare
 *
 * THE ARRANGEMENT — which contact sits where — is read from Whirlwind's
 * "DT-12" pinout sheet (https://cdn.prod.website-files.com/613104abac7808ea202ed3bb/693a1ef17ddfacc9b0e2043f_dt-12.pdf,
 * retrieved 2026-11-04), whose pair labels agree with the mapping above pin for
 * pin (a test pins that). The 37 contacts sit in seven staggered rows of
 * 4-5-6-7-6-5-4. On the MALE view pin 1 is bottom right and each row counts
 * right to left; the FEMALE view is its mirror image. The owner's reference
 * names both as rear views.
 *
 * The sheet gives the arrangement, not the pitch, so `dt12PinPoint` places
 * pins on a hexagonal lattice of a DIAGRAM pitch the caller chooses: the
 * detail sheet says so on its face. No contact spacing here is a fabrication
 * value.
 */

export type Dt12Role = 'hot' | 'cold' | 'drain' | 'spare';
export type Dt12Gender = 'male' | 'female';

export interface Dt12Pair {
    pair: number;
    hot: number;
    cold: number;
    drain: number;
}

export const DT12_PAIRS: readonly Dt12Pair[] = [
    { pair: 1, hot: 5, cold: 6, drain: 1 },
    { pair: 2, hot: 3, cold: 7, drain: 2 },
    { pair: 3, hot: 8, cold: 9, drain: 4 },
    { pair: 4, hot: 16, cold: 17, drain: 10 },
    { pair: 5, hot: 12, cold: 18, drain: 11 },
    { pair: 6, hot: 19, cold: 20, drain: 13 },
    { pair: 7, hot: 15, cold: 21, drain: 14 },
    { pair: 8, hot: 24, cold: 29, drain: 23 },
    { pair: 9, hot: 30, cold: 31, drain: 25 },
    { pair: 10, hot: 27, cold: 32, drain: 26 },
    { pair: 11, hot: 28, cold: 33, drain: 22 },
    { pair: 12, hot: 35, cold: 36, drain: 34 },
];

export const DT12_SPARE_PIN = 37;
export const DT12_PIN_COUNT = 37;

/**
 * Male view, rows top to bottom, each row left to right — as the Whirlwind
 * sheet draws it.
 */
const MALE_ROWS: readonly (readonly number[])[] = [
    [37, 36, 35, 34],
    [33, 32, 31, 30, 29],
    [28, 27, 26, 25, 24, 23],
    [22, 21, 20, 19, 18, 17, 16],
    [15, 14, 13, 12, 11, 10],
    [9, 8, 7, 6, 5],
    [4, 3, 2, 1],
];

/** Rows top to bottom, left to right, for one gender's view. */
export function dt12Rows(gender: Dt12Gender): number[][] {
    return MALE_ROWS.map(r => (gender === 'male' ? r.slice() : r.slice().reverse()));
}

/** What a contact carries, and for which pair. */
export function dt12RoleOf(pin: number): { role: Dt12Role; pair: number | null } {
    for (const p of DT12_PAIRS) {
        if (p.hot === pin) return { role: 'hot', pair: p.pair };
        if (p.cold === pin) return { role: 'cold', pair: p.pair };
        if (p.drain === pin) return { role: 'drain', pair: p.pair };
    }
    return { role: 'spare', pair: null };
}

/**
 * A contact's position on a hexagonal lattice of the given diagram pitch,
 * centred on the insert, +x right and +y UP (drawing convention).
 */
export function dt12PinPoint(gender: Dt12Gender, pin: number, pitch: number): { x: number; y: number } | null {
    const rows = dt12Rows(gender);
    const rowStep = pitch * Math.sqrt(3) / 2;
    for (let r = 0; r < rows.length; r++) {
        const i = rows[r].indexOf(pin);
        if (i < 0) continue;
        const n = rows[r].length;
        return { x: (i - (n - 1) / 2) * pitch, y: ((rows.length - 1) / 2 - r) * rowStep };
    }
    return null;
}

/** Display colours for the three roles and the spare, shared by icon and detail sheet. */
export const DT12_ROLE_COLORS: Record<Dt12Role, string> = {
    hot: '#d93025',
    cold: '#1a73e8',
    drain: '#188038',
    spare: '#9aa0a6',
};

export const DT12_ROLE_LABELS: Record<Dt12Role, string> = {
    hot: 'HOT (+)',
    cold: 'COLD (-)',
    drain: 'DRAIN (G)',
    spare: 'SPARE (37)',
};
