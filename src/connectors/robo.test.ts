// Changelog:
//   2026-07-22 15:58 - new (§5): pin Robo's catalog entry, oversize-D cutout, and icon.

/**
 * frontend/src/assets/connectors/robo.test.ts
 *
 * §5 Robo connectors. The mechanically verifiable half of the plan's
 * validation: Robo is in the catalog, resolves to the oversize-D cutout the
 * user confirmed, and has an icon so it renders in the palette / on a panel.
 */

import { describe, expect, it } from 'vitest';
import { CONNECTOR_GROUPS, lookupConnector } from './ConnectorLookup';
import { cutoutOf } from './cutoutClasses';
import { ICONS } from './index';

describe('§5 Robo connectors', () => {
    it('registers a Robo group defaulting to the oversize-D cutout', () => {
        const robo = CONNECTOR_GROUPS.find(g => g.name === 'Robo');
        expect(robo).toBeDefined();
        expect(robo!.defaultCutout).toBe('oversize-D');
        expect(robo!.connectors.map(c => c.abbreviation)).toEqual(['ROBO', 'ROBO-S']);
    });

    it('resolves ROBO / ROBO-S to the oversize-D cutout (via the group default)', () => {
        expect(cutoutOf('ROBO')).toBe('oversize-D');
        expect(cutoutOf('ROBO-S')).toBe('oversize-D');
        expect(lookupConnector('ROBO')?.cutout).toBe('oversize-D');
    });

    it('has an icon for both variants so they render', () => {
        expect(ICONS['ROBO']).toBeTypeOf('function');
        expect(ICONS['ROBO-S']).toBeTypeOf('function');
    });
});
