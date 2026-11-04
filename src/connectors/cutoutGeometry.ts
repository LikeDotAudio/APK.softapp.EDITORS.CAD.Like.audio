// Copyright (c) 2026 APK.audio.
//
// This software, its source code, and all associated functions, scripts, and
// documentation are the proprietary and confidential property of APK.audio.
// Unauthorized copying, distribution, modification, or disclosure is prohibited.

// Changelog:
//   2026-08-13 11:42 - created: CutoutFeature / ConnectorGeometry / CONNECTOR_GEOMETRY + geometryOf() and classFromGeometry() — the precise geometry layer beneath the named cutout classes. Registry ships empty on purpose; see "Why this registry is empty" below.
//   2026-11-04 - ROAD-3492: the ruling widened (owner, 2026-11-04: "the footprints … need to be based on data sheets"). Every entry now carries `source` (maker, part number, document, revision, url, retrieved) and `quoted` (the callouts as printed); units are mm; populated from manufacturer drawings fetched 2026-11-04 for DT12, Neutrik D-series (XLR, etherCON, opticalCON, speakON, powerCON, BNC), the RJ45 keystone and the IEC C14 inlet.

/**
 * PODS/POD.THIN/Softapps/EDITORS/EDITORS.CAD.Like.audio/src/connectors/cutoutGeometry.ts
 *
 * The PRECISE cutout geometry a connector requires — every hole, screw, square
 * and rectangular opening, dimensioned relative to the connector body center.
 * This is the exact layer beneath `cutoutClasses.ts`, which stays as the coarse,
 * human-facing index ('D' / 'keyed' / 'oversize-D' / 'square').
 *
 * Conventions, all settled rather than assumed:
 *   - ORIGIN is the connector BODY center, not the panel cutout center.
 *   - UNITS are millimetres (owner rule: every CAD dimension in mm). A source
 *     that prints inches is quoted in inches and converted by `inch()` here,
 *     so the number in the file is still the number on the drawing.
 *   - +dx is to the RIGHT, +dy is UP, seen from the FRONT of the panel. Neutrik
 *     draws its cutouts "(rear side)"; those entries are mirrored in x on the
 *     way in and say so in `source.view`.
 *   - Geometry lives on the connector TYPE and is shared by every placement.
 *
 * ── The ruling ──────────────────────────────────────────────────────────────
 *
 * A hole diameter or a screw offset is a FABRICATION value: get it wrong and a
 * panel is drilled wrong and scrapped. Until 2026-11-04 the only accepted
 * authority was Argo's connector manifest (absent from this machine), so the
 * registry shipped empty. On 2026-11-04 the owner widened it: a MANUFACTURER
 * DATASHEET is a source when the entry cites it. Argo stays an accepted source.
 *
 * So every entry must carry:
 *   - `source`: maker, part number, document title, revision (when the
 *     document shows one), URL, and the date it was retrieved;
 *   - `quoted`: each callout exactly as the drawing prints it, with its unit.
 *
 * and every number in `features` must be traceable to a quoted callout — equal
 * to it, or to half of it (a centre-to-centre spacing becomes ± half from the
 * body centre). `cutoutGeometry.test.ts` enforces both, so an unsourced number
 * cannot be merged. A connector whose datasheet could not be reached is ABSENT,
 * never estimated.
 */

import type { CutoutClass } from './cutoutClasses';

/** The kinds of opening a panel cutout is made of. */
export type CutoutFeatureKind =
    | 'hole'    // round opening — the main connector bore
    | 'screw'   // round opening for a fixing screw / latch post
    | 'square'  // square opening
    | 'rect';   // rectangular opening

/**
 * One opening in the panel face, positioned relative to the connector body
 * center. `d` applies to the round kinds; `w`/`h` to the straight-sided ones.
 */
export interface CutoutFeature {
    kind: CutoutFeatureKind;
    /** Offset from connector center, mm, +right (front view). */
    dx: number;
    /** Offset from connector center, mm, +up. */
    dy: number;
    /** Diameter in mm — 'hole' and 'screw'. */
    d?: number;
    /** Width in mm — 'square' and 'rect'. */
    w?: number;
    /** Height in mm — 'square' and 'rect'. */
    h?: number;
}

/** The document a geometry entry was read from. */
export interface GeometrySource {
    maker: string;
    partNumber: string;
    /** Document title as the maker names it (drawing number where shown). */
    document: string;
    /** Revision / change index, only when the document shows one. */
    revision?: string;
    url: string;
    /** ISO date the document was fetched. */
    retrieved: string;
    /** Which side of the panel the source drew the cutout from. */
    view: 'front' | 'rear' | 'unstated';
}

/** One callout exactly as printed on the source drawing. */
export interface QuotedDimension {
    /** The callout text, e.g. 'Ø23.60' or '>=Ø3.2' or '19.00'. */
    label: string;
    value: number;
    unit: 'mm' | 'in';
}

/** Every opening one connector type needs cut into the panel face. */
export interface ConnectorGeometry {
    features: CutoutFeature[];
    source: GeometrySource;
    quoted: QuotedDimension[];
    /** Anything a reader must know about how the drawing was read. */
    note?: string;
}

const RETRIEVED = '2026-11-04';
const MM_PER_INCH = 25.4;
/** A callout printed in inches, in mm. */
const inch = (v: number): number => v * MM_PER_INCH;

/** A quoted value in mm, whatever unit it was printed in. */
export function quotedMm(q: QuotedDimension): number {
    return q.unit === 'in' ? inch(q.value) : q.value;
}

/**
 * The Neutrik D-series pattern: a round bore and two fixing holes on a
 * 19 × 24 mm diagonal. Neutrik draws it from the rear, with the holes top-right
 * and bottom-left; seen from the front they are top-left and bottom-right
 * (which is how the front-view NBB75DFI drawing shows them, a cross-check).
 */
function neutrikD(bore: number, screw: number, pitchX: number, pitchY: number): CutoutFeature[] {
    return [
        { kind: 'hole', dx: 0, dy: 0, d: bore },
        { kind: 'screw', dx: -pitchX / 2, dy: pitchY / 2, d: screw },
        { kind: 'screw', dx: pitchX / 2, dy: -pitchY / 2, d: screw },
    ];
}

const neutrik = (partNumber: string, document: string, url: string, revision: string | undefined, view: 'front' | 'rear'): GeometrySource => ({
    maker: 'Neutrik AG',
    partNumber,
    document,
    ...(revision ? { revision } : {}),
    url,
    retrieved: RETRIEVED,
    view,
});

/* ── DT12 / Cannon FK-37 chassis receptacle ──────────────────────────────── */

const DT12_GEOMETRY: ConnectorGeometry = {
    features: [
        { kind: 'hole', dx: 0, dy: 0, d: inch(1.625) },
        { kind: 'screw', dx: -inch(1.520) / 2, dy: inch(1.520) / 2, d: inch(0.141) },
        { kind: 'screw', dx: inch(1.520) / 2, dy: inch(1.520) / 2, d: inch(0.141) },
        { kind: 'screw', dx: -inch(1.520) / 2, dy: -inch(1.520) / 2, d: inch(0.141) },
        { kind: 'screw', dx: inch(1.520) / 2, dy: -inch(1.520) / 2, d: inch(0.141) },
    ],
    source: {
        maker: 'Whirlwind',
        partNumber: 'WDT12CF / WDT12CM',
        document: 'DT12 Cutout (dt12dim.pdf), linked from "AC Power DT-12 / DT12 Series Broadcast Multipin Connectors"',
        url: 'https://cdn.prod.website-files.com/613104abac7808ea202ed3bb/693a1f0758c29e79e23ba668_dt12dim.pdf',
        retrieved: RETRIEVED,
        view: 'unstated',
    },
    quoted: [
        { label: 'Ø1.625', value: 1.625, unit: 'in' },
        { label: 'Ø0.141', value: 0.141, unit: 'in' },
        { label: '1.520', value: 1.520, unit: 'in' },
    ],
    note: 'The drawing dimensions the 1.520 in spacing across the top pair only; the four holes are drawn as a square pattern (measured on the drawing the vertical pitch agrees with 1.520 to within 1 %), so the same pitch is used vertically.',
};

/* ── Neutrik D-series ────────────────────────────────────────────────────── */

const XLR_FEMALE: ConnectorGeometry = {
    features: neutrikD(23.60, 3.10, 19.00, 24.00),
    source: neutrik('NC3FD-L-1', 'Drawing NC3FDL-1 (3102 St 10 10), "Panel cut out (rear side)"',
        'https://www.neutrik.com/media/8392/download/nc3fd-l-1-3.pdf?v=1', 'B', 'rear'),
    quoted: [
        { label: 'Ø23.60', value: 23.60, unit: 'mm' },
        { label: 'Ø3.10', value: 3.10, unit: 'mm' },
        { label: '19.00', value: 19.00, unit: 'mm' },
        { label: '24.00', value: 24.00, unit: 'mm' },
    ],
};

const XLR_MALE: ConnectorGeometry = {
    features: neutrikD(23.60, 3.10, 19.00, 24.00),
    source: neutrik('NC3MD-L-1', 'Drawing NC3MDL-1, "Panel cut out (rear side)"',
        'https://www.neutrik.com/media/8395/download/nc3md-l-1-3.pdf?v=1', 'C', 'rear'),
    quoted: [
        { label: 'Ø23.60', value: 23.60, unit: 'mm' },
        { label: 'Ø3.10', value: 3.10, unit: 'mm' },
        { label: '19.00', value: 19.00, unit: 'mm' },
        { label: '24.00', value: 24.00, unit: 'mm' },
    ],
};

const ETHERCON: ConnectorGeometry = {
    features: neutrikD(24, 3.2, 19, 24),
    source: neutrik('NE8FDP', 'Drawing ST-NE8FDP, "Panel cut out (rear side)"',
        'https://www.neutrik.com/media/8668/download/ne8fdp-3.pdf?v=1', 'B', 'rear'),
    quoted: [
        { label: '>=Ø24', value: 24, unit: 'mm' },
        { label: '>=Ø3.2', value: 3.2, unit: 'mm' },
        { label: '19 +0.1/-0.1', value: 19, unit: 'mm' },
        { label: '24±0.1', value: 24, unit: 'mm' },
    ],
    note: 'Bore and fixing holes are minimums (">=") on the drawing.',
};

const OPTICALCON_DUO: ConnectorGeometry = {
    features: neutrikD(23.8, 3.2, 19, 24),
    source: neutrik('NO2-4FDW-A', 'Drawing ID 20000188 (Model ST-NO2-4FDW-A), "Panel cutout (rear side)", approved 11.10.2022',
        'https://www.neutrik.com/media/8190/download/Strichzeichnung%20NO2-4FDW-A.pdf?v=2', undefined, 'rear'),
    quoted: [
        { label: '>=Ø23.8', value: 23.8, unit: 'mm' },
        { label: '>=Ø3.2', value: 3.2, unit: 'mm' },
        { label: '19±0.1', value: 19, unit: 'mm' },
        { label: '24±0.1', value: 24, unit: 'mm' },
    ],
    note: 'Keyed to OC4 because ConnectorLookup names this part (divBlock DIV_CON-NO2-4FDW-A) for it. Revision field on the drawing is "-".',
};

const SPEAKON_2: ConnectorGeometry = {
    features: neutrikD(24, 3.2, 19, 24),
    source: neutrik('NL2MP', 'Drawing ST-NL2MP, "Panel Cutout (rear side)"',
        'https://www.neutrik.com/media/8487/download/nl2mp-3.pdf?v=1', 'C', 'rear'),
    quoted: [
        { label: '>=Ø24', value: 24, unit: 'mm' },
        { label: '>=Ø3.2', value: 3.2, unit: 'mm' },
        { label: '19±0.1', value: 19, unit: 'mm' },
        { label: '24±0.1', value: 24, unit: 'mm' },
    ],
};

const POWERCON_BLUE: ConnectorGeometry = {
    features: neutrikD(23.8, 3.2, 19, 24),
    source: neutrik('NAC3MPA-1', 'Drawing ST-NAC3MPA-1, "Panel cut out (rear side)"',
        'https://www.neutrik.com/media/8959/download/nac3mpa-1-2.pdf?v=1', undefined, 'rear'),
    quoted: [
        { label: '>=Ø23.8', value: 23.8, unit: 'mm' },
        { label: '>=Ø3.2', value: 3.2, unit: 'mm' },
        { label: '19', value: 19, unit: 'mm' },
        { label: '24', value: 24, unit: 'mm' },
    ],
};

const POWERCON_GREY: ConnectorGeometry = {
    features: neutrikD(23.8, 3.2, 19, 24),
    source: neutrik('NAC3MPB-1', 'Drawing 20001218, "Panel cut out (rear side)"',
        'https://www.neutrik.com/media/8964/download/20001218.pdf?v=2', undefined, 'rear'),
    quoted: [
        { label: '>=Ø23.8', value: 23.8, unit: 'mm' },
        { label: '>=Ø3.2', value: 3.2, unit: 'mm' },
        { label: '19', value: 19, unit: 'mm' },
        { label: '24', value: 24, unit: 'mm' },
    ],
};

const BNC_D: ConnectorGeometry = {
    features: neutrikD(23.6, 3.4, 19, 24),
    source: neutrik('NBB75DFI', 'Drawing ST-NBB75DFI "Bulkhead feed through isolated D-house", "Panel cut out"',
        'https://www.neutrik.com/media/8620/download/nbb75dfi-3.pdf?v=1', 'A', 'front'),
    quoted: [
        { label: '>=Ø23.6', value: 23.6, unit: 'mm' },
        { label: '>=Ø3.4', value: 3.4, unit: 'mm' },
        { label: '19', value: 19, unit: 'mm' },
        { label: '24', value: 24, unit: 'mm' },
    ],
};

/* ── RJ45 keystone ───────────────────────────────────────────────────────── */

const KEYSTONE_RJ45: ConnectorGeometry = {
    features: [{ kind: 'rect', dx: 0, dy: 0, w: 14.79, h: 19.31 }],
    source: {
        maker: 'CommScope',
        partNumber: '2291216-2 (KJ610 JACK-BLK)',
        document: 'Product specifications "KJ Series Keystone Modular Jack, 8-position, category 6, unshielded" — "Panel Cutout, recommended"',
        revision: 'Revised: January 16, 2020',
        url: 'https://yursat.com.tr/Documents/Datenblatt%202291216-2-1.pdf',
        retrieved: RETRIEVED,
        view: 'unstated',
    },
    quoted: [
        { label: '14.79', value: 14.79, unit: 'mm' },
        { label: '19.31', value: 19.31, unit: 'mm' },
    ],
    note: 'CommScope sheet hosted by a distributor (yursat.com.tr); commscope.com returned 404 for the same document. The sheet prints "14.79 x 19.31 mm" without naming the axes; the first figure is taken as the width.',
};

/* ── IEC 60320 C14 inlet ─────────────────────────────────────────────────── */

const IEC_C14: ConnectorGeometry = {
    features: [
        { kind: 'rect', dx: 0, dy: 0, w: 28, h: 20 },
        { kind: 'screw', dx: -40 / 2, dy: 0, d: 3.5 },
        { kind: 'screw', dx: 40 / 2, dy: 0, d: 3.5 },
    ],
    source: {
        maker: 'SCHURTER AG',
        partNumber: '6100-3',
        document: 'Data sheet 6100-3 "IEC Appliance Inlet C14, Screw-on Mounting, Front or Rear Side", Dimensions [mm], 1) mounting from front-side',
        url: 'https://www.schurter.com/var/schurter/storage/ilcatalogue/files/document/datasheet/en/pdf/typ_6100-3.pdf',
        retrieved: RETRIEVED,
        view: 'front',
    },
    quoted: [
        { label: '28 +0.2/0', value: 28, unit: 'mm' },
        { label: '20 +0.2/0', value: 20, unit: 'mm' },
        { label: '40 ±0.2', value: 40, unit: 'mm' },
        { label: 'Ø3.5 / M3', value: 3.5, unit: 'mm' },
    ],
    note: 'Front-side mounting cutout. Corners are "max. R3" (not modelled as a feature). Rear-side mounting uses 28.5 × 21 instead.',
};

/**
 * Cutout geometry by connector abbreviation — the same key `ConnectorLookup`
 * and `cutoutClasses` use. Absent means no reachable datasheet: the caller
 * falls back to the coarse cutout class, never to an estimate.
 *
 * Known gap: SPK4S is absent. ConnectorLookup names the round-flange NL4MPR
 * for it, and that drawing gives the flange and screws but no panel cutout.
 */
export const CONNECTOR_GEOMETRY: Record<string, ConnectorGeometry> = {
    DT12: DT12_GEOMETRY,
    DT12P: DT12_GEOMETRY,
    DT12S: DT12_GEOMETRY,
    X3S: XLR_FEMALE,
    X3P: XLR_MALE,
    ECON: ETHERCON,
    OC4: OPTICALCON_DUO,
    SPK2S: SPEAKON_2,
    PC20BS: POWERCON_BLUE,
    PC20GS: POWERCON_GREY,
    BNC: BNC_D,
    'KEY-Cat6': KEYSTONE_RJ45,
    C14: IEC_C14,
};

/**
 * The precise geometry for a connector, or `undefined` when none is registered.
 * `undefined` means "fall back to the coarse cutout class", never "this
 * connector needs no hole".
 */
export function geometryOf(abbreviation: string): ConnectorGeometry | undefined {
    return Object.prototype.hasOwnProperty.call(CONNECTOR_GEOMETRY, abbreviation)
        ? CONNECTOR_GEOMETRY[abbreviation]
        : undefined;
}

/** The extent of every opening, mm: the footprint a placement of it covers. */
export function geometryExtent(geometry: ConnectorGeometry): { w: number; h: number } {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const f of geometry.features) {
        const hw = f.d != null ? f.d / 2 : (f.w ?? 0) / 2;
        const hh = f.d != null ? f.d / 2 : (f.h ?? 0) / 2;
        minX = Math.min(minX, f.dx - hw);
        maxX = Math.max(maxX, f.dx + hw);
        minY = Math.min(minY, f.dy - hh);
        maxY = Math.max(maxY, f.dy + hh);
    }
    if (!Number.isFinite(minX)) return { w: 0, h: 0 };
    return { w: maxX - minX, h: maxY - minY };
}

/**
 * The coarse cutout class implied by a geometry, derived from the dominant
 * feature kind: any straight-sided opening makes it a 'square' cutout, otherwise
 * a round bore makes it the standard 'D'.
 *
 * 'keyed' and 'oversize-D' are not derivable (no notch feature; no sourced
 * D-series reference diameter), so a class DECLARED on the ConnectorEntry
 * outranks this derivation — see `cutoutOf`.
 */
export function classFromGeometry(geometry: Pick<ConnectorGeometry, 'features'>): CutoutClass {
    const kinds = new Set(geometry.features.map(f => f.kind));
    if (kinds.has('square') || kinds.has('rect')) return 'square';
    return 'D';
}
