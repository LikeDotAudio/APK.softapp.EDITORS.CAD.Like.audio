// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { DxfBlock, DxfEntity, DxfLayer, DxfLinetypeDef, DxfParseResult } from './DxfParseResult';
import { parseEntity } from './parseEntity';
import { parseLayer } from './parseLayer';
import { parseLinetype } from './parseLinetype';

/** The entity types the importer understands, in ENTITIES and inside a BLOCK alike. */
const SUPPORTED = [
  // An old-style POLYLINE is read with its VERTEX / SEQEND run into an LWPOLYLINE.
  'LINE', 'CIRCLE', 'ARC', 'LWPOLYLINE', 'POLYLINE', 'TEXT', 'MTEXT', 'SOLID', 'HATCH', 'INSERT',
  // Read, then turned into the kinds above by normalizeDxf before loading.
  'ELLIPSE', 'SPLINE', 'DIMENSION',
];

/**
 * Parses ASCII DXF string content into structured entities, layers and the
 * block definitions of the BLOCKS section — so an INSERT of a block the file
 * defines resolves to the file's own geometry, not only to blocks the session
 * already knows.
 */
export function parseDxf(dxfText: string): DxfParseResult {
  const lines = dxfText.split(/\r?\n/);
  let insunits: number | null = null;
  const layers: DxfLayer[] = [];
  const linetypes: DxfLinetypeDef[] = [];
  const entities: DxfEntity[] = [];
  const blocks: DxfBlock[] = [];
  const skipped: Record<string, number> = {};
  const skip = (what: string) => {
    skipped[what] = (skipped[what] ?? 0) + 1;
  };

  let inHeader = false;
  let inTables = false;
  let inEntities = false;
  let inBlocks = false;
  /** The BLOCK being read; null between blocks and inside *Model_Space / *Paper_Space. */
  let block: DxfBlock | null = null;
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
        const section = next && next.code === 2 ? next.value : '';
        inHeader = section === 'HEADER';
        inTables = section === 'TABLES';
        inEntities = section === 'ENTITIES';
        inBlocks = section === 'BLOCKS';
        block = null;
        continue;
      } else if (value === 'ENDSEC') {
        inHeader = false;
        inTables = false;
        inEntities = false;
        inBlocks = false;
        block = null;
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
      } else if (code === 0 && value.toUpperCase() === 'LTYPE') {
        const { linetype, lastPair } = parseLinetype(() => readPair());
        if (linetype) linetypes.push(linetype);
        if (lastPair && lastPair.code === 0) {
          idx -= 2;
        }
      }
    } else if (inBlocks) {
      if (code === 0 && value.toUpperCase() === 'BLOCK') {
        // The BLOCK record: name (2) and base point (10/20), up to the next 0.
        let name = '';
        let baseX = 0;
        let baseY = 0;
        for (let p = readPair(); p; p = readPair()) {
          if (p.code === 0) {
            idx -= 2;
            break;
          }
          if (p.code === 2) name = p.value;
          else if (p.code === 10) baseX = parseFloat(p.value) || 0;
          else if (p.code === 20) baseY = parseFloat(p.value) || 0;
        }
        // Model and paper space are layouts, not symbols anything INSERTs.
        block = name && !/^\*(model|paper)_space/i.test(name) ? { name, baseX, baseY, entities: [] } : null;
        if (block) blocks.push(block);
      } else if (code === 0 && value.toUpperCase() === 'ENDBLK') {
        block = null;
      } else if (code === 0 && block) {
        readEntity(value.toUpperCase(), block.entities);
      }
    } else if (inEntities) {
      if (code === 0) readEntity(value.toUpperCase(), entities);
    }
  }

  function readEntity(entityType: string, into: DxfEntity[]): void {
    if (!SUPPORTED.includes(entityType)) {
      // SEQEND only closes an INSERT's ATTRIB run; it draws nothing of its own
      if (entityType !== 'SEQEND') skip(entityType);
      return;
    }
    const { entity, lastPair } = parseEntity(entityType, () => readPair());
    if (entityType === 'POLYLINE') {
      const line = readPolyline(entity, lastPair);
      if (line) into.push(line);
      return;
    }
    if (entity) into.push(entity);
    // Process the line that stopped the entity parsing
    if (lastPair && lastPair.code === 0) idx -= 2;
  }

  /**
   * An old-style POLYLINE: its header, then VERTEX entities up to SEQEND, read
   * as the LWPOLYLINE it draws. A polygon or polyface mesh (flag 16 / 64) is a
   * 3D surface, not an outline: its vertices are read past and it is dropped,
   * as is a spline-fit polyline's frame (vertex flag 16) — the fitted vertices
   * the file also carries are the curve.
   */
  function readPolyline(header: DxfEntity, stop: { code: number; value: string } | null): DxfEntity | null {
    const points: { x: number; y: number; bulge?: number }[] = [];
    let next = stop;
    while (next && next.code === 0 && next.value.toUpperCase() === 'VERTEX') {
      const { entity: v, lastPair } = parseEntity('VERTEX', () => readPair());
      if (((v.vertexFlags ?? 0) & (16 | 128)) === 0) {
        points.push({ x: v.x1 ?? 0, y: v.y1 ?? 0, ...(v.bulge ? { bulge: v.bulge } : {}) });
      }
      next = lastPair;
    }
    if (next && next.code === 0 && next.value.toUpperCase() === 'SEQEND') {
      // SEQEND carries only its handle and layer; the 0 after it starts the next entity
      next = parseEntity('SEQEND', () => readPair()).lastPair;
    }
    if (next && next.code === 0) idx -= 2;
    if (((header.polylineFlags ?? 0) & (16 | 64)) !== 0) {
      skip('POLYLINE (mesh)');
      return null;
    }
    const { polylineFlags: _flags, ...rest } = header;
    return { ...rest, type: 'LWPOLYLINE', points };
  }

  let units: 'in' | 'mm' | undefined;
  if (insunits === 1 || insunits === 2) units = 'in'; // 1 = Inches, 2 = Feet
  else if (insunits === 4 || insunits === 5 || insunits === 6) units = 'mm'; // 4 = mm, 5 = cm, 6 = m

  return { units, layers, linetypes, blocks, entities, skipped };
}
