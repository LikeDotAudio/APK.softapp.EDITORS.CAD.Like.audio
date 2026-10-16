// Copyright (c) 2026 oneDiversified.
//
// This software, its source code, and all associated functions, scripts, and
// documentation are the proprietary and confidential property of oneDiversified.

// Changelog:
//   2026-08-15 - created: lock AES72 Type 4E as a real 4-channel multipin, the
//                same class of thing as an AES59 A59S/A59P. Extended the same
//                day to the whole of Table 1 and to the legacy spelling saved
//                projects still carry.

/**
 * frontend/src/assets/connectors/aes72.test.ts
 *
 * **AES72 behaves like an AES59.** AES72-2019 Table 1 puts four audio links on
 * one 8P8C shell, so every type is a 4-channel multipin — not a lone RJ45 that
 * happens to carry audio. Registering one is spread across four registries (the
 * picker list, the icon map, the capacity map, the icon shape sets), and a
 * connector registered in three of the four still renders as a single plain
 * port, silently. These cases hold all four together, for all nine types.
 *
 * The nine types are NOT interchangeable — different link order, different
 * polarity — so the cases that matter most are the ones that keep them apart.
 */

import { describe, expect, it } from 'vitest';
import { ICONS } from './index';
import { isKnownConnector, lookupConnector, lookupConnectorLoose } from './ConnectorLookup';
import { AES72_ABBREVIATIONS, AES72_CHANNELS, AES72_TYPES, AES72_DEFAULT_TYPE, aes72LinkColours } from './aes72';
import {
    connectorCapacity, connectorInstance, connectorPin, isMultipinType, parseConnectorRef,
    resolveConnectorRef, buildPortGroups,
} from './multipin';

const TYPE = AES72_DEFAULT_TYPE;           // 'AES72 Type 4E' — the house default
const LEGACY = 'AES72-Type 4E';            // the hyphenated spelling saved projects carry

describe('the standard is transcribed, not paraphrased', () => {
    it('carries all nine surveyed types', () => {
        expect(AES72_TYPES.map(t => t.descriptor))
            .toEqual(['1E', '1O', '1M', '2O', '3E', '3M', '4E', '5E', '6E']);
    });

    it('gives every type eight pins, one per conductor of the 8P8C', () => {
        for (const t of AES72_TYPES) expect(t.pins, t.descriptor).toHaveLength(8);
    });

    it('gives every type all four links, each once as + and once as -', () => {
        // A transposed digit in Table 1 is invisible to the eye and fatal to the
        // drawing; a link that appears twice or not at all is the signature.
        for (const t of AES72_TYPES) {
            expect([...t.pins].sort().join(' '), t.descriptor)
                .toBe('1+ 1- 2+ 2- 3+ 3- 4+ 4-');
        }
    });

    it('puts positive on the even pins for an E type and the odd pins for an O', () => {
        const positiveAt = (t: typeof AES72_TYPES[number]) =>
            t.pins.flatMap((p, i) => (p.endsWith('+') ? [i + 1] : []));
        for (const t of AES72_TYPES.filter(x => x.polarity === 'Even = +')) {
            expect(positiveAt(t), t.descriptor).toEqual([2, 4, 6, 8]);
        }
        for (const t of AES72_TYPES.filter(x => x.polarity === 'Odd = +')) {
            expect(positiveAt(t), t.descriptor).toEqual([1, 3, 5, 7]);
        }
    });

    it('is Mixed exactly when the 4&5 pair breaks the odd-positive rule', () => {
        // §4.2's definition of the M letter, which is the only thing separating
        // Type 1M from Type 1O in a dropdown.
        for (const t of AES72_TYPES) {
            const oddPositive = [0, 2, 6].every(i => t.pins[i].endsWith('+'));
            const pairBroken = t.pins[3].endsWith('+');
            expect(t.polarity === 'Mixed', t.descriptor).toBe(oddPositive && pairBroken);
        }
    });

    it('reads each link\'s T568A pair colour off the pin map', () => {
        // Annex A.3: pins 1&2 green, 3&6 orange, 4&5 blue, 7&8 brown. Type 4E's
        // links land green, blue, orange, brown, and every type uses all four pairs once.
        expect(aes72LinkColours(AES72_TYPES.find(t => t.descriptor === '4E')!))
            .toEqual(['green', 'blue', 'orange', 'brown']);
        for (const t of AES72_TYPES) {
            expect([...aes72LinkColours(t)].sort(), t.descriptor).toEqual(['blue', 'brown', 'green', 'orange']);
        }
    });

    it('spells Type 4E the way the standard says to label the equipment', () => {
        expect(TYPE).toBe('AES72 Type 4E');
        expect(AES72_TYPES.find(t => t.descriptor === '4E')!.pins)
            .toEqual(['1-', '1+', '3-', '2+', '2-', '3+', '4-', '4+']);
    });
});

describe('every type is a connector the tool knows', () => {
    it.each(AES72_ABBREVIATIONS)('%s is offered in the picker, with its pinout', (abbrev: string) => {
        expect(isKnownConnector(abbrev)).toBe(true);
        // The pin map IS the type — a description that omits it leaves two
        // entries in the list indistinguishable.
        expect(lookupConnector(abbrev)?.description).toMatch(/Pins 1-8: /);
    });

    it.each(AES72_ABBREVIATIONS)('%s draws as its RJ45 shell, in either casing', (abbrev: string) => {
        // The canvas asks with the parsed (upper-cased) type, the panel asks with
        // the raw one, and ICONS is an exact-key map — so both must resolve.
        expect(ICONS[abbrev]).toBeDefined();
        expect(ICONS[parseConnectorRef(abbrev).type]).toBe(ICONS[abbrev]);
    });

    it.each(AES72_ABBREVIATIONS)('%s carries four channels and counts as multipin', (abbrev: string) => {
        expect(connectorCapacity(abbrev)).toBe(AES72_CHANNELS);
        expect(isMultipinType(abbrev)).toBe(true);
    });

    it('keeps the trailing type letter instead of reading it as a channel', () => {
        // parseConnectorRef splits a trailing number off the type. "Type 4E" ends
        // in a letter, so the type survives whole; "Type 4" would not.
        expect(parseConnectorRef(TYPE)).toMatchObject({ type: 'AES72 TYPE 4E', channel: null });
        expect(parseConnectorRef(`${TYPE}.3`)).toMatchObject({ type: 'AES72 TYPE 4E', channel: 3 });
    });
});

describe('the spelling that shipped first still opens', () => {
    it('resolves the hyphenated name to the same entry', () => {
        // Live projects carry hundreds of these. A rename that turns a registered
        // connector back into an unrecognised string is not a rename, it is a loss.
        expect(isKnownConnector(LEGACY)).toBe(true);
        expect(lookupConnector(LEGACY)).toBe(lookupConnector(TYPE));
        expect(connectorCapacity(LEGACY)).toBe(AES72_CHANNELS);
        expect(ICONS[LEGACY]).toBe(ICONS[TYPE]);
    });

    it('is not offered in the picker, so nothing new is written with it', () => {
        expect(AES72_ABBREVIATIONS).not.toContain(LEGACY);
    });

    it('reports the current spelling when asked what it is', () => {
        expect(lookupConnectorLoose(LEGACY)?.abbreviation).toBe(TYPE);
        expect(resolveConnectorRef(`${LEGACY}.5`).canonical).toBe(`${TYPE}.5`);
    });
});

describe('two Type 4E jacks are one AES59 DB25', () => {
    it('rolls channels 5-8 into the SECOND shell', () => {
        // An AES59 DB25 breaks out into two Type 4E jacks. Under global continuous
        // numbering that is exactly what channels 1-8 mean at capacity 4.
        expect([1, 4, 5, 8].map(n => connectorInstance(TYPE, n))).toEqual([1, 1, 2, 2]);
        expect([1, 4, 5, 8].map(n => connectorPin(TYPE, n))).toEqual([1, 4, 1, 4]);
    });
});

describe('on a device, its ports collapse into one shell', () => {
    const portsWith = (connectors: string[]) =>
        buildPortGroups(connectors.map(c => ({ connector: c })), p => p.connector);

    it('gathers four consecutive channels into a single 4-way group', () => {
        const groups = portsWith([1, 2, 3, 4].map(n => `${TYPE}.${n}`));
        expect(groups).toHaveLength(1);
        expect(groups[0]).toMatchObject({ type: 'AES72 TYPE 4E', isMulti: true });
        expect(groups[0].members).toEqual([0, 1, 2, 3]);
    });

    it('makes eight channels TWO shells, not one eight-way jack', () => {
        // The capacity is the whole point: an RJ45 has nowhere to put a fifth pair.
        const groups = portsWith([1, 2, 3, 4, 5, 6, 7, 8].map(n => `${TYPE}.${n}`));
        expect(groups.map(g => g.members.length)).toEqual([4, 4]);
        expect(groups[0].color).not.toBe(groups[1].color);
    });

    it('is broken by a foreign connector between channels, like any multipin', () => {
        const groups = portsWith([`${TYPE}.1`, 'XLR', `${TYPE}.2`]);
        expect(groups.map(g => g.members.length)).toEqual([1, 1, 1]);
    });

    it('does NOT merge two different AES72 types into one jack', () => {
        // Type 3E and Type 4E are different wirings of the same shell. Drawing
        // them as one connector would claim a patch that does not work.
        const groups = portsWith(['AES72 Type 4E.1', 'AES72 Type 3E.2']);
        expect(groups.map(g => g.type)).toEqual(['AES72 TYPE 4E', 'AES72 TYPE 3E']);
    });
});
