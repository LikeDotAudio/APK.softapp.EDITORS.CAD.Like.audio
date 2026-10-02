// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CadViewport } from '../core/types';
import type { Doc } from '../model/Doc';

/**
 * Automatically discovers drawing sheets and camera viewport windows in a CAD drawing.
 *
 * Scans closed border polylines on sheet layers (TA-SHEET-BRDR, SKETCHBOOK-PAGE, FRAME, etc.),
 * clusters nested inner margins, associates sheet drawing numbers/titles from text entities,
 * and produces an ordered list of navigable viewports.
 */
export function discoverViewports(doc: Doc): CadViewport[] {
  if (!doc.edges || doc.edges.size === 0) return [];

  // Group edges by groupId to find closed polylines/rectangles
  const edgesByGroup = new Map<number, number[]>();
  const groupLayer = new Map<number, string>();

  for (const edge of doc.edges.values()) {
    if (!edge.groupId) continue;
    let list = edgesByGroup.get(edge.groupId);
    if (!list) {
      list = [];
      edgesByGroup.set(edge.groupId, list);
      groupLayer.set(edge.groupId, edge.layerId);
    }
    list.push(edge.id);
  }

  interface CandidateRect {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    area: number;
    layer: string;
  }

  const candidates: CandidateRect[] = [];

  for (const [gid, edgeIds] of edgesByGroup.entries()) {
    // Only examine groups with at least 4 edges (closed polyline/rect)
    if (edgeIds.length < 4) continue;
    const layer = (groupLayer.get(gid) || '').toUpperCase();
    const isBorderLayer = /BRDR|PAGE|SHEET|FRAME|BORDER/.test(layer);

    const bounds = doc.boundsOf(edgeIds);
    if (!bounds) continue;

    const w = bounds.x2 - bounds.x1;
    const h = bounds.y2 - bounds.y1;

    // Minimum size for a drawing sheet (at least 8x5 in world units)
    if (w < 8 || h < 5) continue;

    const aspect = w >= h ? w / h : h / w;
    // Standard drawing sheets have aspect ratio roughly between 1.05 and 2.2
    if (aspect >= 1.05 && aspect <= 2.2) {
      if (isBorderLayer || (w >= 12 && h >= 8)) {
        candidates.push({
          x1: bounds.x1,
          y1: bounds.y1,
          x2: bounds.x2,
          y2: bounds.y2,
          area: w * h,
          layer,
        });
      }
    }
  }

  // Deduplicate nested borders (e.g. outer border vs inner margin): sort by area desc, keep outer
  candidates.sort((a, b) => b.area - a.area);
  const outerSheets: CandidateRect[] = [];

  for (const cand of candidates) {
    const margin = Math.min((cand.x2 - cand.x1) * 0.1, 3.0);
    const isInsideExisting = outerSheets.some(
      (s) =>
        cand.x1 >= s.x1 - margin &&
        cand.x2 <= s.x2 + margin &&
        cand.y1 >= s.y1 - margin &&
        cand.y2 <= s.y2 + margin,
    );
    if (!isInsideExisting) {
      outerSheets.push(cand);
    }
  }

  if (outerSheets.length === 0) return [];

  // Sort sheets top-to-bottom (Y descending), then left-to-right (X ascending)
  outerSheets.sort((a, b) => {
    const dy = b.y2 - a.y2;
    if (Math.abs(dy) > 5) return dy;
    return a.x1 - b.x1;
  });

  const texts = Array.from(doc.texts?.values() ?? []);

  // For each sheet, find the drawing number text and sheet title
  const sheets: {
    baseName: string;
    subtitle?: string;
    bounds: { x1: number; y1: number; x2: number; y2: number };
  }[] = [];
  const nameCounts = new Map<string, number>();

  for (let i = 0; i < outerSheets.length; i++) {
    const s = outerSheets[i];
    const marginX = (s.x2 - s.x1) * 0.05;
    const marginY = (s.y2 - s.y1) * 0.05;

    // Filter texts inside or immediately adjacent to this sheet
    const insideTexts = texts.filter(
      (t) =>
        t.x >= s.x1 - marginX &&
        t.x <= s.x2 + marginX &&
        t.y >= s.y1 - marginY &&
        t.y <= s.y2 + marginY,
    );

    // Look for drawing number text:
    // Priority 1: Text on DWG# / SHEET layer with height >= 0.5
    const dwgLayerTexts = insideTexts.filter(
      (t) => /DWG#|SHEET#|NUM|DWG/i.test(t.layerId) && t.height >= 0.5,
    );
    // Priority 2: Text near top-left of sheet with large font
    const topLeftLarge = insideTexts.filter(
      (t) =>
        t.x <= s.x1 + (s.x2 - s.x1) * 0.35 &&
        t.y >= s.y2 - (s.y2 - s.y1) * 0.25 &&
        t.height >= 0.4,
    );
    // Priority 3: Any text on DWG# / SHEET# layer
    const dwgLayerAny = insideTexts.filter((t) => /DWG#|SHEET#/i.test(t.layerId));

    let baseName: string | undefined;
    if (dwgLayerTexts.length > 0) {
      dwgLayerTexts.sort((a, b) => b.height - a.height);
      baseName = dwgLayerTexts[0].text.trim();
    } else if (topLeftLarge.length > 0) {
      topLeftLarge.sort((a, b) => b.height - a.height);
      baseName = topLeftLarge[0].text.trim();
    } else if (dwgLayerAny.length > 0) {
      dwgLayerAny.sort((a, b) => b.height - a.height);
      baseName = dwgLayerAny[0].text.trim();
    }

    if (!baseName) {
      baseName = `Sheet ${i + 1}`;
    }

    // Look for subtitle/title
    const titleCandidates = insideTexts.filter(
      (t) =>
        t.text.trim() !== baseName &&
        (/TITLE|DWG|SCHD|NAME|SHEET/i.test(t.layerId) || t.height >= 0.2) &&
        t.height < 0.8 &&
        t.text.length > 3,
    );
    titleCandidates.sort((a, b) => b.height - a.height);
    const subtitle = titleCandidates[0]?.text.trim();

    nameCounts.set(baseName, (nameCounts.get(baseName) || 0) + 1);
    sheets.push({
      baseName,
      subtitle: subtitle || undefined,
      bounds: { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 },
    });
  }

  // Disambiguate duplicate sheet names with index (e.g. "CS-01 (1)", "CS-01 (2)")
  const tracker = new Map<string, number>();
  return sheets.map((item, idx) => {
    const total = nameCounts.get(item.baseName) || 1;
    let name = item.baseName;
    if (total > 1) {
      const cur = (tracker.get(item.baseName) || 0) + 1;
      tracker.set(item.baseName, cur);
      name = `${item.baseName} (${cur})`;
    }
    return {
      id: `sheet_${idx}_${name.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      name,
      subtitle: item.subtitle,
      bounds: item.bounds,
    };
  });
}
