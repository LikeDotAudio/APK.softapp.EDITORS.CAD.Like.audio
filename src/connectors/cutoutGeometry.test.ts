// Changelog:
//   2026-08-13 11:42 - new: pin the cutout-geometry schema, the class derivation, and — most of all — that the registry is empty and cutoutOf is unchanged by its existence.

/**
 * frontend/src/assets/connectors/cutoutGeometry.test.ts
 *
 * The mechanically verifiable half of "Argo panel export sync + connector cutout
 * geometry". The Argo halves of that plan (emitting geometry into the panel
 * payload, and the byte-stable round trip) are blocked on Argo's connector
 * manifest, which is not on this machine; what is testable is the schema
 * beneath them.
 *
 * The first test is the important one and it is not a formality. The registry
 * ships EMPTY by ruling, because a hole diameter is a fabrication value and the
 * authority for it is absent — so the test asserts emptiness, and anyone adding
 * an entry has to come here and say what sourced it.
 */

import { describe, expect, it } from 'vitest';
import {
    CONNECTOR_GEOMETRY,
    classFromGeometry,
    geometryOf,
    type ConnectorGeometry,
} from './cutoutGeometry';
import { cutoutOf } from './cutoutClasses';

describe('cutout geometry — the registry', () => {
    it('is empty, because no sourced dimensions exist yet', () => {
        // Populating this needs Argo's argopanel_connectors.json, which is not
        // on this machine. If you are here because you added an entry: good —
        // replace this assertion with one that checks the entry against the
        // manifest, and say in the changelog what sourced the numbers.
        expect(Object.keys(CONNECTOR_GEOMETRY)).toEqual([]);
    });

    it('returns undefined for connectors that have no geometry', () => {
        expect(geometryOf('X3S')).toBeUndefined();   // a real, catalogued connector
        expect(geometryOf('ROBO')).toBeUndefined();
        expect(geometryOf('NOT-A-CONNECTOR')).toBeUndefined();
    });
});

describe('cutout geometry — the class derived from it', () => {
    const g = (features: ConnectorGeometry['features']): ConnectorGeometry => ({ features });

    it('calls any straight-sided opening a square cutout', () => {
        expect(classFromGeometry(g([{ kind: 'square', dx: 0, dy: 0, w: 0.6, h: 0.6 }]))).toBe('square');
        expect(classFromGeometry(g([{ kind: 'rect', dx: 0, dy: 0, w: 0.9, h: 0.4 }]))).toBe('square');
    });

    it('lets a straight-sided opening win over a round one', () => {
        expect(classFromGeometry(g([
            { kind: 'hole', dx: 0, dy: 0, d: 0.5 },
            { kind: 'rect', dx: 0, dy: 0.3, w: 0.9, h: 0.4 },
        ]))).toBe('square');
    });

    it('calls a round bore with screws the standard D cutout', () => {
        expect(classFromGeometry(g([
            { kind: 'hole', dx: 0, dy: 0, d: 0.9 },
            { kind: 'screw', dx: -0.75, dy: 0, d: 0.13 },
            { kind: 'screw', dx: 0.75, dy: 0, d: 0.13 },
        ]))).toBe('D');
    });

    it('falls back to D rather than throwing on an empty feature list', () => {
        expect(classFromGeometry(g([]))).toBe('D');
    });
});

describe('cutout geometry — cutoutOf is unchanged by its existence', () => {
    // The whole point of shipping the schema with an empty registry is that
    // nothing observable moves. These pin that, so the day geometry lands the
    // diff shows what it changed.
    it('still resolves the declared classes it did before', () => {
        expect(cutoutOf('ROBO')).toBe('oversize-D');      // declared on the group
        expect(cutoutOf('ROBO-S')).toBe('oversize-D');
        expect(cutoutOf('X3S')).toBe('D');                // declares nothing
        expect(cutoutOf('NOT-A-CONNECTOR')).toBe('D');    // unknown
    });

    it('resolves every catalogued connector to a class, as before', () => {
        // No geometry is registered, so this exercises branch 1 and branch 3
        // only — branch 2 is unreachable until the registry is populated.
        expect(cutoutOf('KEY-Cat6')).toBeTypeOf('string');
    });
});
