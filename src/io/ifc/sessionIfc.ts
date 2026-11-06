// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CadViewport } from '../../core/types';
import type { SavedSession } from '../browserStorage/SavedSession';
import { bimPartOf, exportIfc } from './exportIfc';
import { fetchPartTypes } from './partTypes';
import { withViews } from './viewsIfc';
import { sessionDocUnits } from '../browserStorage/sessionInMm';

/**
 * The session's .ifc twin, with every placed part's own type fetched from the
 * BIM library (once per page). Offline, a part the library cannot give is a
 * stub type that still names its part — the file is written either way.
 * `viewports` (the store's sheets and host spaces) become its view
 * subcontexts (viewsIfc.ts, cad-9).
 */
export async function sessionIfc(session: SavedSession, fetcher?: typeof fetch, viewports: readonly CadViewport[] = []): Promise<string> {
  const ids = (session.schematic?.placements ?? []).map(bimPartOf).filter((id): id is string => !!id);
  const types = ids.length ? await fetchPartTypes(ids, fetcher ?? globalThis.fetch?.bind(globalThis)) : {};
  return withViews(exportIfc(session, { types }), viewports, sessionDocUnits(session));
}

/** The .ifc file name for a drawing: its own name, else 'drawing'. */
export function ifcFileName(currentFileName: string | null | undefined): string {
  return `${(currentFileName || 'drawing').replace(/\.(dxf|ifc|json|cad)$/i, '')}.ifc`;
}
