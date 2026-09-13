// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import type { Units } from '../../core/types';
import { aciToHex } from '../../core/dxfColors/aciToHex';
import { addRecentFile } from '../../io/recentFiles/addRecentFile';
import { loadDxfIntoDoc } from '../../io/importDxf/loadDxfIntoDoc';
import { parseDxf } from '../../io/importDxf/parseDxf';
import { unitFactor } from '../../model/units/unitFactor';

export async function loadDxfText(store: EditorStore, text: string,
    filename = 'drawing.dxf',
    sourceUnit?: Units,
    targetUnit?: Units,): Promise<void> {
  const result = parseDxf(text);
  if (result.entities.length === 0) {
    window.alert('No supported geometry (LINE, CIRCLE, ARC, LWPOLYLINE) found in DXF file.');
    return;
  }

  addRecentFile({ name: filename, type: 'dxf', data: text });

  store.history.push(store.doc.snapshot());

  const fromUnit = sourceUnit || result.units || 'mm';
  const toUnit = targetUnit || store.units;
  const factor = unitFactor(fromUnit, toUnit);

  if (toUnit !== store.units) {
    store.setUnits(toUnit);
  }

  // Scale geometry entities if source unit != base workspace unit
  if (factor !== 1) {
    for (const ent of result.entities) {
      if (
        ent.type === 'line' &&
        ent.x1 !== undefined &&
        ent.y1 !== undefined &&
        ent.x2 !== undefined &&
        ent.y2 !== undefined
      ) {
        ent.x1 *= factor;
        ent.y1 *= factor;
        ent.x2 *= factor;
        ent.y2 *= factor;
      } else if (
        (ent.type === 'circle' || ent.type === 'arc') &&
        ent.cx !== undefined &&
        ent.cy !== undefined &&
        ent.r !== undefined
      ) {
        ent.cx *= factor;
        ent.cy *= factor;
        ent.r *= factor;
      } else if (ent.type === 'polyline' && ent.points) {
        for (const pt of ent.points) {
          pt.x *= factor;
          pt.y *= factor;
        }
      }
    }
  }

  // Populate DXF layers into layer store
  if (result.layers && result.layers.length > 0) {
    for (const dxfLayer of result.layers) {
      const hexColor = aciToHex(dxfLayer.colorIndex);
      store.layers.set(dxfLayer.name, {
        id: dxfLayer.name,
        name: dxfLayer.name,
        color: hexColor,
        dxfColorIndex: dxfLayer.colorIndex || 7,
        visible: !dxfLayer.isFrozen,
      });
    }
  }

  loadDxfIntoDoc(store.doc, result);

  store.selection.clear();
  store.hoverId = null;
  store.toolState = store.tool.createState();
  store.closeDynInput();
  store.view.zoomToFit(store.doc.bounds());
  store.markDocChanged();
  store.requestDraw();
  store.emit();
  store.showHint(`Opened DXF: imported ${result.entities.length} entities across ${store.layers.size} layers.`, 5000);

}
