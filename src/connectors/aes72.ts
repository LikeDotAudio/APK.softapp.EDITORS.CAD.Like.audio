// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-14 - Table 1 re-checked row by row against the AES72-2019 text: all nine match. Descriptions
//                gain each link's T568A pair colour (derived from the pin map); Type 4E gains the §4.3
//                phantom-shield, §4.4 labelling, §4.5 compatibility and Annex C crossover notes.
//   2026-08-15 - created: the whole of AES72-2019 Table 1 in one table, and the
//                legacy alias for the hyphenated spelling that shipped first.
//                Type 4E had been registered by hand in four separate files —
//                the picker list, the icon map, the channel-capacity map and the
//                icon shape set — and a connector registered in three of the four
//                renders as a plain single port with no warning. Nine types times
//                four registries is not a thing to keep by hand.

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/aes72.ts
 *
 * **AES72-2019** — analog audio on RJ45 (8P8C) and quad twisted pair. One shell
 * carries **four audio links**, so an AES72 connector is a 4-channel multipin,
 * the same class of object as an 8-channel AES59 DB25 — not a lone RJ45 that
 * happens to have audio in it. Two Type 4E jacks break out one AES59 DB25, which
 * is why channels 5-8 of a Type 4E run land in the second physical shell.
 *
 * # Why nine types and not one
 *
 * §4.2: manufacturers never agreed on which pair carries which link, or which
 * polarity sits on which pin. The standard does not pick a winner — it surveys
 * what shipped and gives each wiring a descriptor. **The types are not
 * interchangeable**: connect a Type 2O device to a Type 4E device and the links
 * come out in the wrong order (Annex C), with the wrong polarity if the letters
 * differ too. So the drawing has to be able to say which one is on the panel,
 * and every type earns its own entry.
 *
 * The number is the link-to-pair assignment; the letter is polarity — `E` puts
 * positive on the even pins, `O` on the odd, `M` is odd-positive except for the
 * 4&5 pair. §4.4 requires the descriptor to be printed on the equipment, so it
 * belongs in the abbreviation rather than buried in a note.
 *
 * **Type 4E is the house default** (see the shop stock's QTP-DB25M note).
 *
 * Nothing here imports from the app: this is a leaf that `ConnectorLookup`,
 * the icon map, the channel-capacity map and `ConnectorVisual` all read from,
 * so a type registered here is registered everywhere or nowhere.
 */

/** Audio links on one AES72 shell. Four pairs on eight pins — §4.2, Table 1. */
export const AES72_CHANNELS = 4;

export interface Aes72Type {
    /** Descriptor as the standard prints it: the pair assignment + polarity letter. */
    descriptor: string;
    /** Connector abbreviation, spelled the way §4.4 says to label the equipment. */
    abbreviation: string;
    /** Pins 1-8 → link number and polarity, straight out of Table 1. */
    pins: readonly string[];
    /** Polarity convention in the standard's own words. */
    polarity: 'Even = +' | 'Odd = +' | 'Mixed';
}

/**
 * AES72-2019 Table 1, verbatim. Order follows the standard's own listing rather
 * than being sorted, so a reader can check this against the page.
 */
export const AES72_TYPES: readonly Aes72Type[] = [
    { descriptor: '1E', abbreviation: 'AES72 Type 1E', polarity: 'Even = +', pins: ['1-', '1+', '2-', '3+', '3-', '2+', '4-', '4+'] },
    { descriptor: '1O', abbreviation: 'AES72 Type 1O', polarity: 'Odd = +',  pins: ['1+', '1-', '2+', '3-', '3+', '2-', '4+', '4-'] },
    { descriptor: '1M', abbreviation: 'AES72 Type 1M', polarity: 'Mixed',    pins: ['1+', '1-', '2+', '3+', '3-', '2-', '4+', '4-'] },
    { descriptor: '2O', abbreviation: 'AES72 Type 2O', polarity: 'Odd = +',  pins: ['2+', '2-', '3+', '1-', '1+', '3-', '4+', '4-'] },
    { descriptor: '3E', abbreviation: 'AES72 Type 3E', polarity: 'Even = +', pins: ['3-', '3+', '2-', '1+', '1-', '2+', '4-', '4+'] },
    { descriptor: '3M', abbreviation: 'AES72 Type 3M', polarity: 'Mixed',    pins: ['3+', '3-', '2+', '1+', '1-', '2-', '4+', '4-'] },
    { descriptor: '4E', abbreviation: 'AES72 Type 4E', polarity: 'Even = +', pins: ['1-', '1+', '3-', '2+', '2-', '3+', '4-', '4+'] },
    { descriptor: '5E', abbreviation: 'AES72 Type 5E', polarity: 'Even = +', pins: ['3-', '3+', '4-', '1+', '1-', '4+', '2-', '2+'] },
    { descriptor: '6E', abbreviation: 'AES72 Type 6E', polarity: 'Even = +', pins: ['4-', '4+', '3-', '2+', '2-', '3+', '1-', '1+'] },
] as const;

/** The type this shop specifies unless a drawing says otherwise. */
export const AES72_DEFAULT_TYPE = 'AES72 Type 4E';

/**
 * T568A pair colour per pin (Annex A.3, Table A1). The split pair 3&6 is the
 * orange one. T568A is the preferred termination, and solid colours always sit on
 * even pins, so on an E type the solid conductor is the positive one.
 */
const T568A_PAIR_COLOUR: readonly string[] = ['green', 'green', 'orange', 'blue', 'blue', 'orange', 'brown', 'brown'];

/**
 * Link 1-4 → its T568A pair colour, read from the type's own pin map, so the
 * colours can never drift from Table 1. Example: Type 4E gives green, blue, orange, brown.
 */
export function aes72LinkColours(t: Aes72Type): string[] {
    return [1, 2, 3, 4].map(link => T568A_PAIR_COLOUR[t.pins.indexOf(`${link}+`)]);
}

/**
 * What the standard gives the installer of the house type, beyond the pin map:
 * §4.3 phantom needs shielded jacks and cable, because the shield is the only return path.
 * §4.4 the equipment carries the descriptor label, with ", not grounded" when the jack has no ground.
 * Annex C: a crossover cable lines a Type 2 device up with a Type 4 one, with every link inverted.
 */
const AES72_DEFAULT_NOTES = '; two of these break out one 8-channel AES59 DB25. '
    + 'Phantom power needs shielded jacks + cable (§4.3); label "AES72 Type 4E" ("…, not grounded" if no ground, §4.4). '
    + 'Mates link-for-link only with other Type 4 kit; AES3 links ignore the letter (§4.5); '
    + 'a crossover cable aligns it with Type 2, all links inverted (Annex C)';

/**
 * Picker description for one type. The pin map IS the type — two entries that
 * differ only in a letter are otherwise indistinguishable in a dropdown — so it
 * is spelled out rather than left to the reader to look up.
 */
export function aes72Description(t: Aes72Type): string {
    const notes = t.abbreviation === AES72_DEFAULT_TYPE ? AES72_DEFAULT_NOTES : '';
    const colours = aes72LinkColours(t).map((c, i) => `L${i + 1} ${c}`).join(', ');
    return `RJ45 (8P8C) ${t.abbreviation} — ${AES72_CHANNELS}-channel analog audio on quad twisted pair. `
        + `Pins 1-8: ${t.pins.join(' ')} (${t.polarity}). T568A pairs: ${colours}${notes}`;
}

/** Every AES72 abbreviation, in Table 1 order. */
export const AES72_ABBREVIATIONS: readonly string[] = AES72_TYPES.map(t => t.abbreviation);

/**
 * Spellings that shipped before the standard's own was adopted, mapped to the
 * current one. §4.4 labels the equipment "AES72 Type 4E"; the first release of
 * this tool wrote it hyphenated, and saved projects still carry that. A read
 * alias keeps those files opening — a rename that silently turns a registered
 * connector back into an unrecognised string is worse than an ugly spelling.
 *
 * These resolve everywhere (lookup, icon, channel capacity) but are NOT offered
 * in the picker, so nothing new is written with them.
 */
export const AES72_LEGACY_SPELLINGS: Readonly<Record<string, string>> = Object.fromEntries(
    AES72_TYPES.map(t => [`AES72-Type ${t.descriptor}`, t.abbreviation]),
);

/**
 * Every string that names an AES72 connector — current and legacy, as written
 * and upper-cased — for the registries keyed by exact string match (the icon
 * map, the channel-capacity map, the icon shape sets).
 *
 * Both casings, because a connector name reaches those maps two ways: the raw
 * value the user picked, and the UPPER-CASED type `parseConnectorRef` returns.
 * A miss in an exact-key map is silent — the connector just renders as a plain
 * single port — so the cheap fix is to register both and never think about it.
 */
export const AES72_ALL_SPELLINGS: readonly string[] = Array.from(new Set(
    [...AES72_ABBREVIATIONS, ...Object.keys(AES72_LEGACY_SPELLINGS)]
        .flatMap(s => [s, s.toUpperCase()]),
));
