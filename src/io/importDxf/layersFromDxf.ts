// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { aciToHex } from '../../core/dxfColors/aciToHex';
import type { Layer } from '../../core/types';
import { standardLinetype } from '../exportDxf/dxfLinetypes';
import type { DxfParseResult } from './DxfParseResult';

/**
 * The app's layers for a parsed DXF: every LAYER record with its colour,
 * linetype, lineweight, and whether it is off, frozen or locked — plus any
 * layer an entity names that the file's LAYER table left out, so no entity
 * lands on a layer the sidebar cannot show.
 *
 * `factor` is the unit scale the geometry is taking; a linetype this app does
 * not know by name keeps its pattern from the file, scaled the same way, so it
 * is written back out as it came in.
 */
export function layersFromDxf(result: DxfParseResult, factor = 1): Layer[] {
  const patterns = new Map(result.linetypes.map((lt) => [lt.name.toUpperCase(), lt.pattern]));
  const out = new Map<string, Layer>();

  for (const l of result.layers) {
    const layer: Layer = {
      id: l.name,
      name: l.name,
      color: aciToHex(l.colorIndex),
      dxfColorIndex: l.colorIndex || 7,
      visible: !l.isFrozen && !l.isOff,
    };
    if (l.isLocked) layer.locked = true;
    const lt = l.linetype?.trim();
    if (lt && !/^(continuous|bylayer|byblock)$/i.test(lt)) {
      layer.linetype = lt;
      const pattern = patterns.get(lt.toUpperCase());
      if (!standardLinetype(lt, 'in') && pattern && pattern.length > 0) {
        layer.linetypePattern = pattern.map((v) => v * factor);
      }
    }
    if (l.lineweight !== undefined && l.lineweight >= 0) layer.lineweight = l.lineweight;
    out.set(layer.id, layer);
  }

  for (const e of result.entities) {
    const name = e.layer || '0';
    if (out.has(name)) continue;
    out.set(name, { id: name, name, color: '#ffffff', dxfColorIndex: 7, visible: true });
  }

  return [...out.values()];
}
