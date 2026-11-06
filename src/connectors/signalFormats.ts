// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * WHAT A PORT CARRIES OR MEANS WHEN IT IS NOT A CONNECTOR (ROAD-3588).
 *
 * The non-physical port types — networked audio, ST 2110 essences, NMOS, SMPTE audio,
 * MXL, streams, AV-over-IP, VoIP, codecs, containers, media formats, and the dataflow
 * Idea / Result / Logic / Arithmetic ports — are the shared IFC vocabulary's, not the
 * CAD's: contracts/ifc/signal-formats.json (hand-kept there), vendored byte for byte at
 * src/vendor/ifc/signal-formats.json (vendored.test.ts holds the copy to the source).
 * The CAD used to keep these in five TypeScript files spliced into its connector table;
 * those are gone, and this module is the only place the CAD reads them.
 *
 * A family is a palette shelf (its `description` is the shelf's line); a format's `id`
 * is the abbreviation a port stores, exactly as before, so saved drawings resolve.
 */
import doc from '../vendor/ifc/signal-formats.json';

export interface SignalFormatEntry {
  abbreviation: string;
  description: string;
}

export interface SignalFormatFamily {
  name: string;
  description: string;
  /** Where the word lives in IFC: Protocols (Pset_DistributionPortTypeCable) or an APK_Signal slot. */
  slot: string;
  formats: SignalFormatEntry[];
}

interface Doc {
  families: Record<string, { slot: string; SystemType: string | null; description?: string }>;
  formats: { id: string; family: string; description: string }[];
}

const DOC = doc as unknown as Doc;

/** Every family, in the vocabulary's order, each holding its formats in file order. */
export const SIGNAL_FORMAT_FAMILIES: readonly SignalFormatFamily[] = Object.entries(DOC.families).map(([name, f]) => ({
  name,
  description: f.description ?? name,
  slot: f.slot,
  formats: DOC.formats.filter((x) => x.family === name).map((x) => ({ abbreviation: x.id, description: x.description })),
}));

const BY_ID = new Map<string, string>(DOC.formats.map((f) => [f.id, f.family]));

/** The families of the dataflow ports (slot Logic): a CAD dataflow node, never an IfcDistributionPort. */
export const DATAFLOW_FAMILIES: ReadonlySet<string> = new Set(
  Object.entries(DOC.families).filter(([, f]) => f.slot === 'Logic').map(([name]) => name),
);

/** The family a format id belongs to (exact id), or undefined for anything that is not one. */
export const signalFamilyOf = (type: string): string | undefined => BY_ID.get(type);

/** True when `type` is a signal format (a flow, a codec, a media format, a dataflow port …), not a plug you can hold. */
export const isSignalFormat = (type: string): boolean => BY_ID.has(type);

/** The formats of the named families, for a badge set: [abbreviation, family] in vocabulary order. */
export const formatsOf = (families: readonly string[]): [string, string][] =>
  SIGNAL_FORMAT_FAMILIES.filter((f) => families.includes(f.name)).flatMap((f) => f.formats.map((x) => [x.abbreviation, f.name] as [string, string]));
