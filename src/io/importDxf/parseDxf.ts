// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { DxfEntity, DxfLayer, DxfParseResult } from './DxfParseResult';
import { parseEntity } from './parseEntity';
import { parseLayer } from './parseLayer';

/**
 * Parses ASCII DXF string content into structured entities and layers.
 */
export function parseDxf(dxfText: string): DxfParseResult {
  const lines = dxfText.split(/\r?\n/);
  let insunits: number | null = null;
  const layers: DxfLayer[] = [];
  const entities: DxfEntity[] = [];

  let inHeader = false;
  let inTables = false;
  let inEntities = false;
  let currentHeaderVar = '';

  let idx = 0;

  function readPair(): { code: number; value: string } | null {
    if (idx >= lines.length - 1) return null;
    const codeStr = lines[idx].trim();
    const valueStr = lines[idx + 1].trim();
    idx += 2;
    if (codeStr === '' && valueStr === '') return null;
    return { code: parseInt(codeStr, 10), value: valueStr };
  }

  while (idx < lines.length) {
    const pair = readPair();
    if (!pair) break;

    const { code, value } = pair;

    if (code === 0) {
      if (value === 'SECTION') {
        const next = readPair();
        if (next && next.code === 2) {
          if (next.value === 'HEADER') {
            inHeader = true;
            inTables = false;
            inEntities = false;
          } else if (next.value === 'TABLES') {
            inHeader = false;
            inTables = true;
            inEntities = false;
          } else if (next.value === 'ENTITIES') {
            inHeader = false;
            inTables = false;
            inEntities = true;
          } else {
            inHeader = false;
            inTables = false;
            inEntities = false;
          }
        }
        continue;
      } else if (value === 'ENDSEC') {
        inHeader = false;
        inTables = false;
        inEntities = false;
        continue;
      }
    }

    if (inHeader) {
      if (code === 9) {
        currentHeaderVar = value;
      } else if (code === 70 && currentHeaderVar === '$INSUNITS') {
        insunits = parseInt(value, 10);
      }
    } else if (inTables) {
      if (code === 0 && value.toUpperCase() === 'LAYER') {
        const { layer, lastPair } = parseLayer(() => readPair());
        if (layer) layers.push(layer);
        if (lastPair && lastPair.code === 0) {
          idx -= 2;
        }
      }
    } else if (inEntities) {
      if (code === 0) {
        const entityType = value.toUpperCase();
        if (['LINE', 'CIRCLE', 'ARC', 'LWPOLYLINE', 'POLYLINE'].includes(entityType)) {
          const { entity, lastPair } = parseEntity(entityType, () => readPair());
          if (entity) {
            entities.push(entity);
          }
          if (lastPair && lastPair.code === 0) {
            // Process the line that stopped the entity parsing
            idx -= 2;
          }
        }
      }
    }
  }

  let units: 'in' | 'mm' | undefined;
  if (insunits === 1 || insunits === 2) units = 'in'; // 1 = Inches, 2 = Feet
  else if (insunits === 4 || insunits === 5 || insunits === 6) units = 'mm'; // 4 = mm, 5 = cm, 6 = m

  return { units, layers, entities };
}
