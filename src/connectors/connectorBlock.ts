// Copyright (c) 2026 APK.audio.
//
// Changelog:
//   2026-11-04 - ROAD-3492: created. A connector picked in the Connectors dock
//                becomes a Flow block: its channels are ports (twelve typed
//                pairs for a DT12), its outline is the datasheet cutout in mm,
//                and placing a DT12 drops its pinout detail sheet beside it.

/**
 * src/connectors/connectorBlock.ts
 *
 * Until this file, choosing a connector in the dock only switched to the Flow
 * tool and said so; nothing on the sheet knew it was a connector, and a DT12
 * arrived with no channels although `MULTI_CONNECTOR_CHANNELS.DT12 = 12`.
 *
 * Three things a connector block is, and where each comes from:
 *
 *   PORTS     one per channel, `connectorCapacity()` of them (the multipin
 *             table in multipin.ts). A DT12's twelve are typed pairs: each
 *             names its hot / cold / drain contacts from dt12Pinout.ts. A
 *             connector that is not a multipin has one port. The side follows
 *             the catalogue's AES14 convention (male = equipment output, so a
 *             `…P` is an output and a `…S` an input); a name with no gender
 *             letter is an input.
 *   OUTLINE   the connector's sourced cutout (cutoutGeometry.ts), in mm: its
 *             extent is the block size and its bore and screw holes are the
 *             glyph. A connector with no sourced geometry gets a schematic box
 *             sized by its port count and says so in its description — never a
 *             guessed footprint.
 *   UNITS     definitions are authored in mm; a placement carries
 *             `scale = unitFactor('mm', sheet units)` so it is true size on an
 *             inch sheet too.
 */

import { snapAt } from '../flow/onGrid';
import type { BlockDefinition, BlockPlacement, Point, Port, PortSide, SchematicModel, Units } from '../core/types';
import { unitFactor } from '../model/units/unitFactor';
import { lookupConnectorLoose } from './ConnectorLookup';
import { geometryExtent, geometryOf, type ConnectorGeometry, type CutoutFeature } from './cutoutGeometry';
import { connectorCapacity } from './multipin';
import { DT12_PAIRS } from './Multipin/dt12Pinout';
import { DT12_DETAIL_BLOCK_NAME, buildDt12DetailBlock, dt12DetailOffsetMm } from './Multipin/dt12DetailBlock';

export const CONNECTOR_DEFINITION_PREFIX = 'connector:';

/** Schematic box for a connector with no sourced footprint, mm. */
const UNSOURCED_W = 20;
const UNSOURCED_PORT_PITCH = 5;

export function connectorDefinitionId(abbreviation: string): string {
    return `${CONNECTOR_DEFINITION_PREFIX}${abbreviation}`;
}

/** The abbreviation a connector definition id stands for, or null. */
export function connectorOfDefinitionId(id: string): string | null {
    return id.startsWith(CONNECTOR_DEFINITION_PREFIX) ? id.slice(CONNECTOR_DEFINITION_PREFIX.length) : null;
}

/** The catalogue's spelling of a connector, or the input when it is uncatalogued. */
function canonical(abbreviation: string): string {
    return lookupConnectorLoose(abbreviation)?.abbreviation ?? abbreviation.trim();
}

export function isDt12(abbreviation: string): boolean {
    return /^DT12[PS]?$/i.test(abbreviation.trim());
}

/** AES14 as the catalogue states it: male (P) = equipment output, female (S) = input. */
export function connectorPortSide(abbreviation: string): PortSide {
    return /P$/i.test(abbreviation.trim()) ? 'output' : 'input';
}

/** The ports a placement of this connector carries: one per channel. */
export function connectorChannelPorts(abbreviation: string): Port[] {
    const side = connectorPortSide(abbreviation);
    if (isDt12(abbreviation)) {
        return DT12_PAIRS.map(p => ({
            id: `CH${String(p.pair).padStart(2, '0')}`,
            side,
            label: `${p.pair}: ${p.hot}+ ${p.cold}- ${p.drain}G`,
            domain: 'audio',
        }));
    }
    const n = Math.max(1, connectorCapacity(abbreviation) ?? 1);
    if (n === 1) return [{ id: 'CH01', side, label: canonical(abbreviation) }];
    return Array.from({ length: n }, (_, i) => ({
        id: `CH${String(i + 1).padStart(2, '0')}`,
        side,
        label: `ch ${i + 1}`,
    }));
}

const circle = (cx: number, cy: number, r: number, n = 32): Point[] => {
    const pts = Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    });
    pts.push({ ...pts[0] });
    return pts;
};

function featureOutline(f: CutoutFeature): Point[] {
    if (f.d != null) return circle(f.dx, f.dy, f.d / 2);
    const hw = (f.w ?? 0) / 2;
    const hh = (f.h ?? 0) / 2;
    return [
        { x: f.dx - hw, y: f.dy - hh }, { x: f.dx + hw, y: f.dy - hh },
        { x: f.dx + hw, y: f.dy + hh }, { x: f.dx - hw, y: f.dy + hh },
        { x: f.dx - hw, y: f.dy - hh },
    ];
}

/** The cutout as polylines in mm, centred on the body — the footprint glyph. */
export function footprintGlyph(geometry: ConnectorGeometry): Point[][] {
    return geometry.features.map(featureOutline);
}

/** A DXF-safe block name for a connector. */
function blockName(abbreviation: string): string {
    return `CONN_${abbreviation.replace(/[^A-Za-z0-9_-]/g, '_')}`.toUpperCase();
}

/**
 * The Flow block for a connector, authored in mm. Undefined only for an empty
 * name; an uncatalogued name still gets a block, flagged as unsourced.
 */
export function connectorBlockDefinition(abbreviation: string): BlockDefinition | undefined {
    const raw = (abbreviation || '').trim();
    if (!raw) return undefined;
    const abbr = canonical(raw);
    const ports = connectorChannelPorts(abbr);
    const geometry = geometryOf(abbr);
    const desc = lookupConnectorLoose(abbr)?.entry.description ?? abbr;
    if (geometry) {
        const size = geometryExtent(geometry);
        return {
            id: connectorDefinitionId(abbr),
            name: blockName(abbr),
            description: `${desc} — footprint: ${geometry.source.maker} ${geometry.source.partNumber} (${geometry.source.document}), mm`,
            size,
            glyph: footprintGlyph(geometry),
            ports,
        };
    }
    return {
        id: connectorDefinitionId(abbr),
        name: blockName(abbr),
        description: `${desc} — footprint unsourced (no datasheet on file); schematic box only`,
        size: { w: UNSOURCED_W, h: Math.max(UNSOURCED_W, ports.length * UNSOURCED_PORT_PITCH) },
        glyph: [],
        ports,
    };
}

/**
 * Make sure the schematic knows the connector's definition; returns its id.
 * Definitions are not saved with a sheet (the catalogue is code), so a reopened
 * sheet calls this again for every connector placement it holds.
 */
export function ensureConnectorDefinition(model: SchematicModel, abbreviation: string): string | null {
    const def = connectorBlockDefinition(abbreviation);
    if (!def) return null;
    const i = model.definitions.findIndex(d => d.id === def.id);
    if (i < 0) model.definitions.push(def);
    else model.definitions[i] = def;
    return def.id;
}

/** Re-register the definitions of every connector placement on a sheet. */
export function ensureConnectorDefinitionsFor(model: SchematicModel): void {
    const seen = new Set<string>();
    for (const p of model.placements) {
        const abbr = connectorOfDefinitionId(p.definitionId);
        if (abbr == null || seen.has(abbr)) continue;
        seen.add(abbr);
        ensureConnectorDefinition(model, abbr);
    }
}

/** Mm-authored block → sheet units. */
export function connectorPlacementScale(units: Units): number {
    return unitFactor('mm', units);
}

/** The slice of a document the detail sheet needs. */
export interface DetailSheetDoc {
    blocks: { has(name: string): boolean };
    addBlockDefinition(def: ReturnType<typeof buildDt12DetailBlock>): void;
    addBlockInstance(blockName: string, x: number, y: number, scale?: number, rotation?: number, layerId?: string): number;
}

/**
 * The schematic half of placing a connector: the placement, true size.
 * Pure over the model so it can be tested without a store.
 */
export function placeConnectorBlock(
    model: SchematicModel,
    abbreviation: string,
    at: Point,
    units: Units,
    layerId = '0',
): BlockPlacement | null {
    const id = ensureConnectorDefinition(model, abbreviation);
    if (!id) return null;
    const existing = model.placements.filter(p => p.definitionId === id).length;
    const placement: BlockPlacement = {
        id: model.nextPlacementId++,
        definitionId: id,
        at: snapAt(at),   // nothing off the grid (flow/onGrid.ts)
        layerId,
        refdes: `${canonical(abbreviation)}-${existing + 1}`,
        scale: connectorPlacementScale(units),
    };
    model.placements.push(placement);
    return placement;
}

/**
 * The drawing half: a DT12 drops its pinout detail sheet beside itself. Returns
 * the block instance id, or null for a connector that has no detail sheet.
 */
export function placeConnectorDetail(
    doc: DetailSheetDoc,
    model: SchematicModel,
    placement: BlockPlacement,
    units: Units,
    layerId = '0',
): number | null {
    const abbr = connectorOfDefinitionId(placement.definitionId);
    if (abbr == null || !isDt12(abbr)) return null;
    if (!doc.blocks.has(DT12_DETAIL_BLOCK_NAME)) doc.addBlockDefinition(buildDt12DetailBlock());
    const def = model.definitions.find(d => d.id === placement.definitionId);
    const s = connectorPlacementScale(units);
    const off = dt12DetailOffsetMm(def?.size.w ?? 0);
    return doc.addBlockInstance(DT12_DETAIL_BLOCK_NAME, placement.at.x + off.x * s, placement.at.y + off.y * s, s, 0, layerId);
}
