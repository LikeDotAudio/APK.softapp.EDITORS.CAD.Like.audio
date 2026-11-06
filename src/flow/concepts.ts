// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BlockDefinition } from '../core/types';
import snapshot from '../vendor/bim/concepts.json';

/**
 * THE PLACEABLE CONCEPTS ARE THE BIM LIBRARY'S (ROAD-3588).
 *
 * The flow set (source, process, split, sink: top is control, bottom is power, left is
 * input, right is output), the shop parts, the schematic symbols, math & logic and the
 * adapters are BIM entries — DATABASE.server.BIM library concept/<slug>, category
 * Concepts — each carrying in ext.cad the definition this editor draws. The CAD's own
 * catalogue (src/flow/catalog.ts) is gone; it reads the library's concepts from the
 * vendored snapshot src/vendor/bim/concepts.json (scripts/vendorBimConcepts.mjs, held to
 * the library by concepts.test.ts), so it still builds and places them offline. A drawing
 * that names flow.process etc. resolves exactly as before: the ids are the same.
 *
 * Sizes are in drawing units, authored at a readable size.
 */
interface Row {
  part: string;
  class: string;
  description: string;
  cad: { definition: string; name: string; size: BlockDefinition['size']; glyph: BlockDefinition['glyph']; ports: BlockDefinition['ports'] };
}

const ROWS = (snapshot as unknown as { concepts: Row[] }).concepts;

/** A concept's set, from its BIM class "Concept · <set>". */
export type ConceptSet = 'Flow' | 'Shop' | 'Schematic symbol' | 'Math & Logic' | 'Adapter';

const toDefinition = (r: Row): BlockDefinition => ({
  id: r.cad.definition,
  name: r.cad.name,
  description: r.description,
  size: r.cad.size,
  glyph: r.cad.glyph,
  ports: r.cad.ports,
});

/** Everything placeable: the library's concepts, in the snapshot's order. */
export const CONCEPTS: BlockDefinition[] = ROWS.map(toDefinition);

const SET_OF = new Map<string, ConceptSet>(ROWS.map((r) => [r.cad.definition, r.class.replace(/^Concept · /, '') as ConceptSet]));
const PART_OF = new Map<string, string>(ROWS.map((r) => [r.cad.definition, r.part]));

/** The set a concept definition belongs to. */
export const conceptSetOf = (definitionId: string): ConceptSet | undefined => SET_OF.get(definitionId);

/** The BIM part id (concept/<slug>) of a concept definition. */
export const conceptPartOf = (definitionId: string): string | undefined => PART_OF.get(definitionId);

/** The concepts of one set. */
export const conceptsOf = (set: ConceptSet): BlockDefinition[] => CONCEPTS.filter((d) => SET_OF.get(d.id) === set);

/** The symbol the Flow tool places until the sidebar is told otherwise. */
export const DEFAULT_FLOW_DEFINITION = 'flow.process';
