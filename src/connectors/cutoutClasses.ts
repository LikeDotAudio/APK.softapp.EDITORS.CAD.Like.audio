// Copyright (c) 2026 oneDiversified.
//
// This software, its source code, and all associated functions, scripts, and
// documentation are the proprietary and confidential property of oneDiversified.
// Unauthorized copying, distribution, modification, or disclosure is prohibited.

// Changelog:
//   2026-06-22 10:34 - created: CutoutClass model + cutoutOf() — the panel drill cutout a connector requires (roadmap §2)
//   2026-08-13 11:42 - cutoutOf() falls back to the class derived from cutoutGeometry when a connector declares none; a declared class still wins

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/cutoutClasses.ts
 *
 * The panel CUTOUT a connector requires — the hole that gets drilled/punched
 * into the panel face for that connector to seat. This is a property of the
 * connector type itself (stored on the ConnectorEntry in ConnectorLookup), and
 * it drives how a position is drawn when the Panel Buddy "cutout" view is on.
 *
 * Most connectors are the standard D-series hole, so `cutout` is optional on a
 * ConnectorEntry and defaults to 'D'. Connectors that need a different hole
 * (square keystone jacks, oversize flanges, keyed orientation) declare it
 * explicitly (or inherit a group-level default).
 *
 * Fit validation (does this connector's cutout fit the panel position it was
 * dropped into?) is a future layer — see roadmap §3.
 *
 * The precise layer BENEATH this one is `cutoutGeometry.ts`, which describes the
 * individual holes and screws in inches. Where a connector has geometry but no
 * declared class, the class is derived from the geometry rather than defaulted —
 * see `cutoutOf` for why the precedence runs that way and not the other.
 */

import { lookupConnector } from './ConnectorLookup';
import { classFromGeometry, geometryOf } from './cutoutGeometry';

export type CutoutClass =
    | 'D'           // standard D-series cutout (the default)
    | 'keyed'       // D hole with a keying feature to enforce orientation
    | 'oversize-D'  // cutout larger than the standard D footprint
    | 'square';     // square / rectangular cutout (keystone, Decora, LC fiber…)

/** Human-readable labels for the cutout classes (UI tooltips, pickers). */
export const CUTOUT_LABELS: Record<CutoutClass, string> = {
    'D': 'D hole (standard)',
    'keyed': 'Keyed D hole',
    'oversize-D': 'Oversize D hole',
    'square': 'Square hole',
};

/**
 * The cutout class a connector requires. Defaults to the standard D hole when
 * the connector declares nothing (and is unknown), so existing connectors are
 * unaffected until explicitly tagged.
 *
 * Precedence, in order:
 *   1. the class DECLARED on the ConnectorEntry (or inherited from its group),
 *   2. the class DERIVED from `cutoutGeometry`, where geometry is registered,
 *   3. 'D'.
 *
 * The declared class outranks the derived one because it can express things the
 * geometry vocabulary cannot — 'keyed' has no notch feature to derive from, and
 * 'oversize-D' would need a sourced D-series reference diameter to tell it from
 * a standard bore. Deriving first would silently downgrade every connector that
 * is deliberately tagged (ROBO's 'oversize-D', LC fiber's 'square') the moment
 * it gained geometry, which is the opposite of what precise geometry is for.
 *
 * `CONNECTOR_GEOMETRY` is empty today, so step 2 never fires and this function
 * returns exactly what it returned before geometry existed — pinned by test.
 */
export function cutoutOf(abbreviation: string): CutoutClass {
    const declared = lookupConnector(abbreviation)?.cutout;
    if (declared) return declared;

    const geometry = geometryOf(abbreviation);
    if (geometry) return classFromGeometry(geometry);

    return 'D';
}
