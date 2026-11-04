// Changelog:
//   2026-11-04 - ROAD-3492: new. Placing a connector creates its channels as ports and takes its footprint from the sourced geometry; a DT12 drops its detail sheet.

import { describe, expect, it } from 'vitest';
import type { CadBlockDefinition } from '../core/types';
import { createSchematic, restoreSchematic, snapshotSchematic, portsOf } from '../flow/Schematic';
import {
    connectorBlockDefinition,
    connectorChannelPorts,
    connectorDefinitionId,
    ensureConnectorDefinition,
    placeConnectorBlock,
    placeConnectorDetail,
} from './connectorBlock';
import { geometryExtent, geometryOf } from './cutoutGeometry';
import { MULTI_CONNECTOR_CHANNELS } from './multipin';
import { DT12_DETAIL_BLOCK_NAME } from './Multipin/dt12DetailBlock';

const fakeDoc = () => {
    const blocks = new Map<string, CadBlockDefinition>();
    const instances: { name: string; x: number; y: number; scale: number }[] = [];
    return {
        blocks,
        instances,
        addBlockDefinition(def: CadBlockDefinition) { blocks.set(def.name, def); },
        addBlockInstance(name: string, x: number, y: number, scale = 1) { instances.push({ name, x, y, scale }); return instances.length; },
    };
};

describe('connector channels', () => {
    it('gives a DT12 twelve typed pairs', () => {
        for (const abbr of ['DT12', 'DT12P', 'DT12S']) {
            const ports = connectorChannelPorts(abbr);
            expect(ports).toHaveLength(12);
            expect(ports[0]).toMatchObject({ id: 'CH01', label: '1: 5+ 6- 1G', domain: 'audio' });
            expect(ports[11]).toMatchObject({ id: 'CH12', label: '12: 35+ 36- 34G' });
        }
        expect(connectorChannelPorts('DT12P')[0].side).toBe('output');   // male = output (AES14)
        expect(connectorChannelPorts('DT12S')[0].side).toBe('input');
    });

    it('creates a port per channel for every multipin in MULTI_CONNECTOR_CHANNELS', () => {
        for (const [abbr, n] of Object.entries(MULTI_CONNECTOR_CHANNELS)) {
            const def = connectorBlockDefinition(abbr)!;
            expect(def.ports, abbr).toHaveLength(n);
            expect(new Set(def.ports.map(p => p.id)).size, abbr).toBe(n);
        }
    });

    it('gives a single connector one port', () => {
        expect(connectorChannelPorts('X3S')).toHaveLength(1);
    });
});

describe('connector footprint', () => {
    it('is the sourced cutout extent, in mm', () => {
        const def = connectorBlockDefinition('DT12S')!;
        expect(def.size).toEqual(geometryExtent(geometryOf('DT12S')!));
        expect(def.size.w).toBeCloseTo(2 * 19.304 + 3.5814, 6);
        expect(def.glyph).toHaveLength(5);             // bore + four screws
        expect(def.description).toContain('Whirlwind');
    });

    it('says so when a connector has no sourced footprint', () => {
        const def = connectorBlockDefinition('ROBO')!;
        expect(def.glyph).toEqual([]);
        expect(def.description).toContain('unsourced');
    });

    it('resolves catalogue spelling case-insensitively', () => {
        expect(connectorBlockDefinition('x3s')!.id).toBe(connectorDefinitionId('X3S'));
        expect(connectorBlockDefinition('')).toBeUndefined();
    });
});

describe('placing a connector', () => {
    it('places a DT12 true size with its twelve ports on the sheet', () => {
        const model = createSchematic([]);
        const p = placeConnectorBlock(model, 'DT12S', { x: 1, y: 2 }, 'in')!;
        expect(p.scale).toBeCloseTo(1 / 25.4, 12);
        expect(p.refdes).toBe('DT12S-1');
        expect(portsOf(model, p.id)).toHaveLength(12);
        const mm = placeConnectorBlock(model, 'DT12S', { x: 0, y: 0 }, 'mm')!;
        expect(mm.scale).toBe(1);
        expect(mm.refdes).toBe('DT12S-2');
    });

    it('drops the DT12 detail sheet beside it, once defined, true size', () => {
        const model = createSchematic([]);
        const doc = fakeDoc();
        const a = placeConnectorBlock(model, 'DT12P', { x: 0, y: 0 }, 'mm')!;
        expect(placeConnectorDetail(doc, model, a, 'mm')).toBe(1);
        const b = placeConnectorBlock(model, 'DT12P', { x: 0, y: 0 }, 'in')!;
        placeConnectorDetail(doc, model, b, 'in');
        expect([...doc.blocks.keys()]).toEqual([DT12_DETAIL_BLOCK_NAME]);
        expect(doc.instances[0].x).toBeGreaterThan(model.definitions[0].size.w / 2);
        expect(doc.instances[1].scale).toBeCloseTo(1 / 25.4, 12);
    });

    it('drops no detail sheet for other connectors', () => {
        const model = createSchematic([]);
        const doc = fakeDoc();
        const p = placeConnectorBlock(model, 'X3S', { x: 0, y: 0 }, 'mm')!;
        expect(placeConnectorDetail(doc, model, p, 'mm')).toBeNull();
        expect(doc.instances).toHaveLength(0);
    });

    it('survives a save and reopen, although definitions are not saved', () => {
        const model = createSchematic([]);
        const p = placeConnectorBlock(model, 'E16S', { x: 0, y: 0 }, 'mm')!;
        const snap = snapshotSchematic(model);
        const fresh = createSchematic([]);
        restoreSchematic(fresh, snap);
        expect(portsOf(fresh, p.id)).toHaveLength(16);
    });

    it('re-registers a definition rather than duplicating it', () => {
        const model = createSchematic([]);
        ensureConnectorDefinition(model, 'DT12S');
        ensureConnectorDefinition(model, 'DT12S');
        expect(model.definitions).toHaveLength(1);
    });
});
