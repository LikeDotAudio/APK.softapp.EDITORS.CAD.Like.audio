// Copyright (c) 2026 oneDiversified.
//
// This software, its source code, and all associated functions, scripts, and
// documentation are the proprietary and confidential property of oneDiversified.
// Unauthorized copying, distribution, modification, or disclosure is prohibited.

// Changelog:
//   2026-08-13 11:42 - created: CutoutFeature / ConnectorGeometry / CONNECTOR_GEOMETRY + geometryOf() and classFromGeometry() — the precise geometry layer beneath the named cutout classes. Registry ships empty on purpose; see "Why this registry is empty" below.

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/cutoutGeometry.ts
 *
 * The PRECISE cutout geometry a connector requires — every hole, screw, square
 * and rectangular opening, dimensioned relative to the connector body center.
 * This is the exact layer beneath `cutoutClasses.ts`, which stays as the coarse,
 * human-facing index ('D' / 'keyed' / 'oversize-D' / 'square').
 *
 * The point of it is that the on-screen cutout, the printed panel label and the
 * fabrication drill file can all be driven from one description instead of three
 * independent ones that drift.
 *
 * Conventions, all settled rather than assumed:
 *   - ORIGIN is the connector BODY center, not the panel cutout center.
 *   - UNITS are inches, matching `panelPreviewConstants.ts` (`PITCH_IN_BY_PPR`).
 *   - +dx is to the RIGHT, +dy is UP, as a drawing reads. (`renderCutout` flips
 *     dy on its way into SVG, where +y is down.)
 *   - Geometry lives on the connector TYPE and is therefore shared by every
 *     placement of it. A per-placement override is a later layer, not this one.
 *
 * ── Why this registry is empty ──────────────────────────────────────────────
 *
 * `CONNECTOR_GEOMETRY` is deliberately empty, and that is the finished state of
 * this file for now rather than an unfinished one.
 *
 * A hole diameter or a screw offset is a FABRICATION value: get it wrong and a
 * panel is drilled wrong and scrapped. The authority for these numbers is Argo's
 * connector manifest (`ARGO-source-.../argo_templates/argopanel_connectors.json`),
 * and that manifest is not on this machine — the retired `Backlog.htm` recorded
 * the same absence on 2026-08-09 and declined, for the same reason, to correct
 * three connector defects it had already diagnosed (that page was retired
 * 2026-09-10; its last content is in git at `f2b41b1c1`, and the quote below is
 * reproduced here so the reasoning does not depend on it):
 *
 *     "writing a plausible value sourced from a description of the authority
 *      rather than from the authority … The audit is very likely right.
 *      *Likely* is not a source."
 *
 * So the schema, the lookup and the render path ship now; the numbers arrive
 * when their source does, and populating this record is then the whole of the
 * remaining work. Everything below is written so that adding one entry lights up
 * the class derivation and the on-screen cutout together, with no other change.
 *
 * Until then every lookup returns `undefined` and every consumer falls back to
 * the behaviour it had before this file existed — which the tests pin.
 */

import type { CutoutClass } from './cutoutClasses';

/**
 * The kinds of opening a panel cutout is made of. This vocabulary is the card's,
 * and it is deliberately small — it describes what gets cut, not what it is for.
 */
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
    /** Offset from connector center, inches, +right. */
    dx: number;
    /** Offset from connector center, inches, +up. */
    dy: number;
    /** Diameter in inches — 'hole' and 'screw'. */
    d?: number;
    /** Width in inches — 'square' and 'rect'. */
    w?: number;
    /** Height in inches — 'square' and 'rect'. */
    h?: number;
}

/** Every opening one connector type needs cut into the panel face. */
export interface ConnectorGeometry {
    features: CutoutFeature[];
}

/**
 * Cutout geometry by connector abbreviation — the same key `ConnectorLookup`
 * and `cutoutClasses` use.
 *
 * EMPTY BY RULING, not by omission. See "Why this registry is empty" above. Do
 * not populate an entry from a datasheet quoted in prose, from this repository's
 * own documentation, or from memory of a connector standard. Populate it from
 * the Argo manifest, and add the reconciliation test at the same time so it
 * stays populated correctly.
 */
export const CONNECTOR_GEOMETRY: Record<string, ConnectorGeometry> = {};

/**
 * The precise geometry for a connector, or `undefined` when none is registered.
 * `undefined` is the normal answer today and callers must handle it — it means
 * "fall back to the coarse cutout class", never "this connector needs no hole".
 */
export function geometryOf(abbreviation: string): ConnectorGeometry | undefined {
    return CONNECTOR_GEOMETRY[abbreviation];
}

/**
 * The coarse cutout class implied by a geometry, derived from the dominant
 * feature kind: any straight-sided opening makes it a 'square' cutout, otherwise
 * a round bore makes it the standard 'D'.
 *
 * NOTE WHAT THIS CANNOT DO, because it governs how `cutoutOf` uses it:
 *   - 'keyed' is not derivable — the feature vocabulary models no notch.
 *   - 'oversize-D' is not derivable — telling an oversize bore from a standard
 *     one needs a D-series reference diameter, and this repository has no
 *     sourced value for it (see "Why this registry is empty").
 *
 * Both therefore stay declared on the `ConnectorEntry`, and a declared class
 * outranks this derivation rather than the other way round.
 */
export function classFromGeometry(geometry: ConnectorGeometry): CutoutClass {
    const kinds = new Set(geometry.features.map(f => f.kind));
    if (kinds.has('square') || kinds.has('rect')) return 'square';
    return 'D';
}
