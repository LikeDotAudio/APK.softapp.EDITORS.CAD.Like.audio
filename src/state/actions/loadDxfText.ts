// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import type { Units } from '../../core/types';
import { addRecentFile } from '../../io/recentFiles/addRecentFile';
import { clearSchematic } from '../../flow/Schematic';
import { layersFromDxf } from '../../io/importDxf/layersFromDxf';
import { loadDxfIntoDoc } from '../../io/importDxf/loadDxfIntoDoc';
import { parseDxf } from '../../io/importDxf/parseDxf';
import { skippedSummary } from '../../io/importDxf/skippedSummary';
import type { DxfEntity } from '../../io/importDxf/DxfParseResult';
import { unitFactor } from '../../model/units/unitFactor';

export async function loadDxfText(store: EditorStore, text: string,
    filename = 'drawing.dxf',
    sourceUnit?: Units,
    targetUnit?: Units,): Promise<void> {
  await store.showLoading('Opening drawings', `Parsing entities in ${filename}...`);
  try {
    const result = parseDxf(text);
    // what the file holds that the importer reads past (3DFACE, LEADER, a mesh POLYLINE, …)
    const notImported = skippedSummary(result.skipped);
    if (result.entities.length === 0) {
      window.alert(
        'No supported geometry (LINE, CIRCLE, ARC, POLYLINE, ELLIPSE, SPLINE, TEXT, HATCH, INSERT, DIMENSION) found in DXF file.' +
          (notImported ? `\n\n${notImported}` : ''),
      );
      return;
    }

    await store.showLoading('Opening drawings', 'Caching file to recent drawings...');
    await addRecentFile({ name: filename, type: 'dxf', data: text });

    store.history.push(store.doc.snapshot());

  // Clear canvas completely so the opened file cleanly replaces existing content
  store.doc.clear();
  clearSchematic(store.schematic);
  store.tracing = null;
  store.imageDrag = null;
  store.currentFileName = filename;

  // Reset layers to default layer '0' before populating the file's layers
  store.layers.clear();
  store.layers.set('0', {
    id: '0',
    name: '0',
    color: '#ffffff',
    dxfColorIndex: 7,
    visible: true,
  });
  store.activeLayerId = '0';

  const fromUnit = sourceUnit || result.units || 'mm';
  const toUnit = targetUnit || store.units;
  const factor = unitFactor(fromUnit, toUnit);

  if (toUnit !== store.units) {
    store.setUnits(toUnit);
  }

  // Scale geometry entities if source unit != base workspace unit — the
  // sheet's and every block definition's alike, base points included.
  if (factor !== 1) {
    // A block the file defines is scaled once, in its definition; an INSERT
    // of it keeps its own scale. A block only the session knows is in session
    // units already, so its INSERT carries the factor instead.
    const fileBlocks = new Set(result.blocks.map((b) => b.name));
    for (const ent of result.entities) scaleDxfEntity(ent, factor, fileBlocks);
    for (const block of result.blocks) {
      block.baseX *= factor;
      block.baseY *= factor;
      for (const ent of block.entities) scaleDxfEntity(ent, factor, fileBlocks);
    }
  }

  // Populate DXF layers into layer store — colour, linetype, lineweight, off/frozen/locked
  for (const layer of layersFromDxf(result, factor)) {
    store.layers.set(layer.id, layer);
  }

  await store.showLoading('Opening drawings', `Importing ${result.entities.length.toLocaleString()} entities...`);
  await loadDxfIntoDoc(store.doc, result, async (loaded, total) => {
    store.showLoading('Opening drawings', `Importing entities (${loaded.toLocaleString()} / ${total.toLocaleString()})...`);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  await store.showLoading('Opening drawings', 'Discovering drawing sheets & caching session...');
  store.discoverViewports();
  store.activeViewportId = 'ALL';

  store.selection.clear();
  store.hoverId = null;
  store.toolState = store.tool.createState();
  store.closeDynInput();
  store.view.zoomToFit(store.doc.bounds());

  await store.autoSaveSession(false);

  store.markDocChanged();
  store.requestDraw();
  store.emit();
  const sheetMsg = store.viewports.length > 0 ? ` (${store.viewports.length} sheets discovered)` : '';
  store.showHint(
    `Opened DXF: imported ${result.entities.length} entities across ${store.layers.size} layers${sheetMsg}.` +
      (notImported ? ` ${notImported}` : ''),
    notImported ? 12000 : 5000,
  );
  if (notImported) console.warn(`DXF ${filename}: ${notImported}`);
  } finally {
    store.hideLoading();
  }
}

/** Scale one parsed entity's coordinates and sizes in place. */
function scaleDxfEntity(ent: DxfEntity, factor: number, fileBlocks: Set<string>): void {
  const type = ent.type.toUpperCase();
  if (
    type === 'LINE' &&
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
    (type === 'CIRCLE' || type === 'ARC') &&
    ent.cx !== undefined &&
    ent.cy !== undefined &&
    ent.r !== undefined
  ) {
    ent.cx *= factor;
    ent.cy *= factor;
    ent.r *= factor;
  } else if (ent.points) {
    for (const pt of ent.points) {
      pt.x *= factor;
      pt.y *= factor;
    }
  } else if (type === 'TEXT' || type === 'MTEXT') {
    if (ent.x1 !== undefined) ent.x1 *= factor;
    if (ent.y1 !== undefined) ent.y1 *= factor;
    if (ent.x2 !== undefined) ent.x2 *= factor;
    if (ent.y2 !== undefined) ent.y2 *= factor;
    if (ent.textHeight !== undefined) ent.textHeight *= factor;
  } else if (type === 'SOLID') {
    if (ent.x1 !== undefined) ent.x1 *= factor;
    if (ent.y1 !== undefined) ent.y1 *= factor;
    if (ent.x2 !== undefined) ent.x2 *= factor;
    if (ent.y2 !== undefined) ent.y2 *= factor;
    if (ent.x3 !== undefined) ent.x3 *= factor;
    if (ent.y3 !== undefined) ent.y3 *= factor;
    if (ent.x4 !== undefined) ent.x4 *= factor;
    if (ent.y4 !== undefined) ent.y4 *= factor;
  } else if (type === 'INSERT') {
    if (ent.x1 !== undefined) ent.x1 *= factor;
    if (ent.y1 !== undefined) ent.y1 *= factor;
    if (ent.blockName && fileBlocks.has(ent.blockName)) return;
    // DXF defaults each scale to 1: an INSERT that wrote none still needs the factor
    ent.scaleX = (ent.scaleX ?? 1) * factor;
    ent.scaleY = (ent.scaleY ?? 1) * factor;
  } else if (type === 'ELLIPSE') {
    // the major-axis end is relative to the centre, so it scales like a length
    if (ent.cx !== undefined) ent.cx *= factor;
    if (ent.cy !== undefined) ent.cy *= factor;
    if (ent.majorX !== undefined) ent.majorX *= factor;
    if (ent.majorY !== undefined) ent.majorY *= factor;
  } else if (type === 'SPLINE') {
    for (const pt of [...(ent.controlPoints ?? []), ...(ent.fitPoints ?? [])]) {
      pt.x *= factor;
      pt.y *= factor;
    }
  }
}
