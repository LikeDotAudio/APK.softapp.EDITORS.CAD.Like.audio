// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * THE CLOSED CONNECTOR VOCABULARY, AS THE CAD READS IT (ROAD-3588).
 *
 * contracts/ifc/connectors.json, vendored byte for byte at src/vendor/ifc/connectors.json
 * (vendored.test.ts holds the copy to the source). One entry per physical connector: an id,
 * its IFC words (ElectricalConnectionType, ConnectionGender), pins, pinout, aliases, and —
 * where the CAD draws it — `cad`, the glyph code a port stores.
 *
 * Resolution follows the file's own rule: normalise (NFKC, lower case, curly quotes and
 * dashes folded), try the whole text, then the text with trailing parentheticals removed.
 * Domain aliases and two-connector combos are the BIM's business (a port's declared text);
 * the CAD resolves one word to one connector.
 */
import doc from '../vendor/ifc/connectors.json';

export interface IfcConnector {
  id: string;
  subtype: string;
  family: string;
  ElectricalConnectionType: string;
  ConnectionGender: string;
  pins: number;
  pinout: string[];
  aliases: string[];
  cad?: string;
  standard?: string;
  note?: string;
  placeholder?: boolean;
}

const ENTRIES = (doc as unknown as { connectors: IfcConnector[] }).connectors;

/** The vocabulary's normal form of a spelling. */
export function normaliseConnectorText(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[“”″]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

const BY_WORD = new Map<string, IfcConnector>();
const BY_CAD = new Map<string, IfcConnector>();
for (const e of ENTRIES) {
  if (e.cad) BY_CAD.set(e.cad, e);
  for (const w of [e.id, ...(e.aliases ?? []), ...(e.cad ? [e.cad] : [])]) {
    const k = normaliseConnectorText(w);
    if (!BY_WORD.has(k)) BY_WORD.set(k, e);
  }
}

/** The vocabulary entry a word names (its id, an alias or its CAD code), or undefined. */
export function resolveIfcConnector(text: unknown): IfcConnector | undefined {
  if (typeof text !== 'string' || !text.trim()) return undefined;
  const whole = normaliseConnectorText(text);
  return BY_WORD.get(whole) ?? BY_WORD.get(whole.replace(/(\s*\([^)]*\))+$/, '').trim());
}

/** The vocabulary entry whose `cad` glyph code is exactly `code`. */
export const ifcConnectorByCad = (code: string): IfcConnector | undefined => BY_CAD.get(code);

/** Every vocabulary entry the CAD draws (it has a `cad` code), in file order. */
export const IFC_CONNECTORS_DRAWN: readonly IfcConnector[] = ENTRIES.filter((e) => e.cad);
