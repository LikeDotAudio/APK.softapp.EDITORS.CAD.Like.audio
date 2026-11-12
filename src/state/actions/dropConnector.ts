// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';
import { placeConnectorBlock, placeConnectorDetail } from '../../connectors/connectorBlock';
import { describeDrop, dropConnector, type DropOutcome } from '../../flow/dropConnector';
import { DOC_UNITS } from '../../model/units/docUnits';
import type { EditorStore } from '../EditorStore';

/** What the Connectors palette drags (connectors/ui/ConnectorItem.tsx). */
export const CONNECTOR_DRAG_MIME = 'application/app-connector';

/** How near a port a drop counts as ON it, screen px. */
const NEAR_PORT_PX = 14;

/**
 * A connector let go over the sheet: on a device it gives the device that connector — the
 * port under it, else the first fitting unknown one, else a new port (flow/dropConnector.ts);
 * on empty sheet it is placed as its own connector block, as the Flow tool would. One undo step.
 */
export function dropConnectorAt(store: EditorStore, type: string, at: Point): DropOutcome | null {
  let outcome: DropOutcome | null = null;
  store.editFlow(() => {
    outcome = dropConnector(store.schematic, type, at, store.view.pxToWorld(NEAR_PORT_PX));
    return outcome !== null;
  });
  if (outcome) {
    store.showHint(`${type} → ${describeDrop(outcome, store.schematic)} · Ctrl+Z undoes it.`, 3500);
    return outcome;
  }
  let placed: ReturnType<typeof placeConnectorBlock> = null;
  store.editFlow(() => {
    placed = placeConnectorBlock(store.schematic, type, at, DOC_UNITS, store.activeLayerId);
    return placed !== null;
  });
  const p = placed as ReturnType<typeof placeConnectorBlock>;
  if (p) store.edit(() => placeConnectorDetail(store.doc, store.schematic, p, DOC_UNITS, store.activeLayerId) !== null);
  else store.showHint(`Connector ${type} is not in the catalogue.`, 3000);
  return null;
}
