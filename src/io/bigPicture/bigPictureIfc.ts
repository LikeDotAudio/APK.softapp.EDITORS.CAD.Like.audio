// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { SchematicSnapshot } from '../../flow/Schematic';
import { Doc } from '../../model/Doc';
import { DOC_UNITS, SESSION_MM_VERSION } from '../../model/units/docUnits';
import type { SavedSession } from '../browserStorage/SavedSession';
import { exportIfc } from '../ifc/exportIfc';
import { importIfc } from '../ifc/importIfc';
import { sessionIfc } from '../ifc/sessionIfc';

/**
 * THE BIG PICTURE AS IFC (big-picture@2, IFC-CORE-DELTAS cad-6)
 *
 * The filed sheet is the CAD's own schematic IFC: a session with an empty
 * drawing and this schematic, written by exportIfc / schematicIfc — every
 * placement an occurrence, every connector an IfcRelConnectsPorts, every
 * rack or kit an IfcElementAssembly, every other group an IfcGroup. The
 * server (WEB.OsApi big_picture.py) checks the group tree on exactly that.
 *
 * The session around it is fixed, so the same sheet is the same bytes: docKey
 * 'big-picture' (every GlobalId derives from it — a placement keeps its id
 * across saves), mm (cad-1), no layers of its own, and the file's timestamp
 * whatever the caller passes (0 for the contract samples).
 */

export const BIG_PICTURE_DOC_KEY = 'big-picture';
export const BIG_PICTURE_FILE_NAME = 'big-picture.ifc';

/** The session the sheet is filed as: an empty drawing holding only the schematic, in mm. */
export function bigPictureSession(sheet: SchematicSnapshot, timestamp = 0): SavedSession {
  return {
    version: SESSION_MM_VERSION,
    timestamp,
    docSnapshot: new Doc().snapshot(),
    currentFileName: BIG_PICTURE_FILE_NAME,
    schematic: sheet,
    units: DOC_UNITS,
    gridSize: 10,
    snapToGrid: true,
    shapeMode: false,
    activeLayerId: '0',
    layers: [],
    docKey: BIG_PICTURE_DOC_KEY,
  };
}

/** The sheet as STEP, every placed part typed by its own BIM type (fetched once per page; offline, a stub naming it). */
export function bigPictureIfc(sheet: SchematicSnapshot, opts: { timestamp?: number; fetcher?: typeof fetch } = {}): Promise<string> {
  return sessionIfc(bigPictureSession(sheet, opts.timestamp ?? 0), opts.fetcher);
}

/** The same, with no part types fetched — what a test or a sample is written with. */
export function bigPictureIfcOffline(sheet: SchematicSnapshot, timestamp = 0): string {
  return exportIfc(bigPictureSession(sheet, timestamp));
}

/** The schematic back out of a filed sheet. Throws IfcImportError on a file that is not STEP. */
export function sheetFromIfc(text: string): SchematicSnapshot {
  const session = importIfc(text);
  return session.schematic ?? { placements: [], connectors: [], groups: [], nextPlacementId: 1, nextConnectorId: 1, nextGroupId: 1 };
}
