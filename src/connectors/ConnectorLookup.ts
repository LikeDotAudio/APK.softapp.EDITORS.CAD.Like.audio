// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

// Changelog:
//   2026-11-06 - ROAD-3588: no table of its own. The shelves are the CAD's panel connectors (panelConnectors.ts,
//     each resolved to its contracts/ifc/connectors.json entry) and the signal-format families of
//     contracts/ifc/signal-formats.json (signalFormats.ts). The CAD's own connector table and its five TypeScript files of
//     non-physical port types are gone; a vocabulary spelling ("3-pin XLR female") resolves to the code that draws it.
//   Older entries: git log -- src/connectors/ConnectorLookup.ts

/**
 * THE CONNECTOR LOOKUP — every port type the CAD can draw, as palette shelves and one flat lookup.
 *
 *   physical   panelConnectors.ts (glyph code, shelf, Argo, cutout, label), each code joined to its
 *              connectors.json entry (`ifc`: id, IFC words, pins) where the vocabulary has it;
 *   carried    signal-formats.json families (networked audio, ST 2110, NMOS, MXL, streams, codecs,
 *              containers, media formats, dataflow ports), each format id an abbreviation as before.
 */

import type { CutoutClass } from './cutoutClasses';
import { AES72_LEGACY_SPELLINGS } from './aes72';
import { PANEL_CONNECTOR_SHELVES, type ArgoHeight, type ArgoWidth, type ConnectorGroup } from './panelConnectors';
import { SIGNAL_FORMAT_FAMILIES } from './signalFormats';
import { ifcConnectorByCad, resolveIfcConnector, type IfcConnector } from './ifcConnectors';

export type { ArgoHeight, ArgoWidth, ConnectorEntry, ConnectorGroup } from './panelConnectors';

/** Every shelf the palette shows: the panel connectors, then the signal-format families. */
export const CONNECTOR_SHELVES: readonly ConnectorGroup[] = [
    ...PANEL_CONNECTOR_SHELVES,
    ...SIGNAL_FORMAT_FAMILIES.map((f) => ({ name: f.name, groupDescription: f.description, connectors: f.formats })),
];

/**
 * Flat lookup: abbreviation → { group, description, divBlock?, argoPanelName?, argoWidth?, argoHeight? }
 */
export interface ConnectorLookupEntry {
    group: string;
    description: string;
    divBlock?: string;
    argoPanelName?: string;
    argoWidth?: ArgoWidth;
    argoHeight?: ArgoHeight;
    cutout?: CutoutClass;
    /** The connectors.json entry this code draws (physical connectors the vocabulary has). */
    ifc?: IfcConnector;
}

const _lookup = new Map<string, ConnectorLookupEntry>();
for (const g of CONNECTOR_SHELVES) {
    for (const c of g.connectors) {
        if (!_lookup.has(c.abbreviation)) {
            _lookup.set(c.abbreviation, {
                group: g.name,
                description: c.description,
                divBlock: c.divBlock,
                argoPanelName: c.argoPanelName,
                argoWidth: c.argoWidth,
                argoHeight: c.argoHeight,
                // Only what is DECLARED (on the entry or its group). Defaulting
                // to 'D' here hid cutoutOf's geometry step from every catalogued
                // connector; cutoutOf supplies the 'D' fallback (ROAD-3492).
                cutout: c.cutout ?? g.defaultCutout,
                ifc: PANEL_CONNECTOR_SHELVES.includes(g) ? ifcConnectorByCad(c.abbreviation) ?? resolveIfcConnector(c.abbreviation) : undefined,
            });
        }
    }
}

/**
 * The losing spelling of a connector the corpus wrote two ways, mapped to the
 * winner (ruled 2026-09-23, roadmap 202609172012). Loser → winner, as spelled.
 *
 * Only an alias whose winner is a catalogue entry joins `lookupConnector`
 * (8P8C, USBA, USBC, IEC C13, VIRTUAL); `AC-Power`, `RS232` and `DB9` name no catalogue
 * entry on either side, so for them this map is the vocabulary record the
 * corpus rewrite (`Sample Project Data/rewrite_connector_spellings.mjs`)
 * applies. SFP and SFP+ are two standards and are NOT a pair. Case-only pairs
 * (Speakon / SPEAKON) already meet in `lookupConnectorLoose`.
 */
export const CONNECTOR_LEGACY_SPELLINGS: Readonly<Record<string, string>> = {
    '8P8C': 'RJ45',
    'USBA': 'USB-A',
    'USBC': 'USB-C',
    'AC-Power': 'Power-AC',
    'RS232': 'RS-232',
    'DB9': 'DB-9',
    'IEC C13': 'C13',
    'VIRTUAL': 'NONE',
};

// Spellings that shipped before the standard's own was adopted resolve to the
// entry they were renamed to. Added AFTER the derive loop, so an alias answers
// `lookupConnector` and `isKnownConnector` — a saved project full of them still
// opens — without ever appearing in `CONNECTOR_SHELVES`, which is what the picker
// lists from. See the note in `aes72.ts`.
const _renamed = new Map<string, string>();   // UPPER-CASED old spelling → current abbreviation
for (const [legacy, current] of [
    ...Object.entries(AES72_LEGACY_SPELLINGS), ...Object.entries(CONNECTOR_LEGACY_SPELLINGS),
]) {
    const entry = _lookup.get(current);
    if (!entry) continue;
    if (!_lookup.has(legacy)) _lookup.set(legacy, entry);
    _renamed.set(legacy.toUpperCase(), current);
}

/** UPPER-CASED abbreviation → the abbreviation as spelled. */
const _foldedLookup = new Map<string, string>();
for (const g of CONNECTOR_SHELVES) {
    for (const c of g.connectors) {
        const key = c.abbreviation.toUpperCase();
        if (!_foldedLookup.has(key)) _foldedLookup.set(key, c.abbreviation);
    }
}

export function lookupConnector(abbreviation: string): ConnectorLookupEntry | undefined {
    return _lookup.get(abbreviation);
}

/**
 * Case-insensitive `lookupConnector`, plus the abbreviation as the catalogue
 * spells it. Callers hold a connector name in two forms — the raw one the user
 * picked, and the UPPER-CASED type `parseConnectorRef` hands back — and an
 * exact-key map answers only the first, so the same connector reads as known in
 * one panel and unknown in the next.
 *
 * The abbreviation it reports is always the CURRENT one, so a caller that
 * writes the answer back is quietly upgrading a renamed spelling rather than
 * preserving it. Takes a bare type, NOT a channel-suffixed ref: stripping the
 * channel is the caller's job (`resolveConnectorRef` in patch-shared/patchTypes
 * does both).
 */
export function lookupConnectorLoose(
    type: string,
): { abbreviation: string; entry: ConnectorLookupEntry } | undefined {
    const s = (type || '').trim();
    if (!s) return undefined;
    const renamed = _renamed.get(s.toUpperCase());
    if (renamed) return { abbreviation: renamed, entry: _lookup.get(renamed)! };
    const folded = _foldedLookup.get(s.toUpperCase());
    if (folded) return { abbreviation: folded, entry: _lookup.get(folded)! };
    const exact = _lookup.get(s);
    if (exact) return { abbreviation: s, entry: exact };
    // A vocabulary spelling (connectors.json id or alias) answers with the code that draws it.
    const code = resolveIfcConnector(s)?.cad;
    const drawn = code ? _lookup.get(code) : undefined;
    return drawn ? { abbreviation: code!, entry: drawn } : undefined;
}

/**
 * Resolve a OneThing abbreviation to its Argo panel name.
 * Returns the argoPanelName if one exists, otherwise falls back to the abbreviation.
 */
export function getArgoPanelName(abbreviation: string): string {
    return _lookup.get(abbreviation)?.argoPanelName || abbreviation;
}

export function isKnownConnector(abbreviation: string): boolean {
    return _lookup.has(abbreviation);
}

/**
 * All connector abbreviations as a flat array.
 */
export const ALL_CONNECTOR_ABBREVIATIONS = Array.from(_lookup.keys());

/**
 * Connector families for the palette UI — derived from groups,
 * using representative connectors (not every variant).
 */
export const CONNECTOR_FAMILIES_FULL: Record<string, string[]> = {};
for (const g of CONNECTOR_SHELVES) {
    CONNECTOR_FAMILIES_FULL[g.name] = g.connectors.map(c => c.abbreviation);
}
