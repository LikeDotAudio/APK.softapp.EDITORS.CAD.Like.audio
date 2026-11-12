// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** The Block Editor's element list: every drawing element and block definition as a sidebar row, filtered,
 *  counted and paged, and the builders that turn a row (the whole drawing, a layer, a text, a fill, a Flow part)
 *  into a block definition the editor can show. Called by useBlockEditor. */
import { useCallback, useMemo } from 'react';
import type { BlockPlacement, CadBlockDefinition, FillEntity, TextEntity } from '../../core/types';
import type { EditorListItem, ItemCategory } from './blockEditorTypes';
import type { EditorStore } from '@state/EditorStore';

export function useBlockElements(store: EditorStore, categoryFilter: ItemCategory, search: string, sidebarPage: number) {
  // Helper to build a block from all elements currently on the active drawing canvas
  const buildActiveDrawingBlock = useCallback((): CadBlockDefinition => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; layerId?: string }> = [];
    const arcs: Array<{ cx: number; cy: number; r: number; a1: number; a2: number; layerId?: string }> = [];
    const circles: Array<{ cx: number; cy: number; r: number; layerId?: string }> = [];

    for (const e of store.doc.edges.values()) {
      const v1 = store.doc.vertexOf(e.v1);
      const v2 = store.doc.vertexOf(e.v2);
      if (!v1 || !v2) continue;
      if (e.type === 'arc') {
        let a1 = Math.atan2(v1.y - e.cy, v1.x - e.cx) * (180 / Math.PI);
        let a2 = Math.atan2(v2.y - e.cy, v2.x - e.cx) * (180 / Math.PI);
        if (a1 < 0) a1 += 360;
        if (a2 < 0) a2 += 360;
        arcs.push({
          cx: e.cx,
          cy: e.cy,
          r: e.r,
          a1,
          a2,
          layerId: e.layerId,
        });
      } else {
        lines.push({
          x1: v1.x,
          y1: v1.y,
          x2: v2.x,
          y2: v2.y,
          layerId: e.layerId,
        });
      }
    }

    const texts = Array.from(store.doc.texts.values()).map((t) => ({
      text: t.text,
      x: t.x,
      y: t.y,
      height: t.height,
      rotation: t.rotation ?? 0,
      layerId: t.layerId,
    }));

    const fills = Array.from(store.doc.fills.values()).map((f) => ({
      points: f.points.map((p) => ({ ...p })),
      color: f.color,
      opacity: f.opacity,
      layerId: f.layerId,
    }));

    const b = store.doc.bounds();
    const basePoint = b ? { x: (b.x1 + b.x2) / 2, y: (b.y1 + b.y2) / 2 } : { x: 0, y: 0 };

    return {
      name: 'ACTIVE_DRAWING',
      description: `Complete drawing canvas (${lines.length + arcs.length} edges, ${texts.length} texts)`,
      basePoint,
      lines,
      arcs,
      circles,
      texts,
      fills,
    };
  }, [store.doc]);

  const buildLayerBlock = useCallback((layerId: string): CadBlockDefinition => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; layerId?: string }> = [];
    const arcs: Array<{ cx: number; cy: number; r: number; a1: number; a2: number; layerId?: string }> = [];
    const circles: Array<{ cx: number; cy: number; r: number; layerId?: string }> = [];

    for (const e of store.doc.edges.values()) {
      if ((e.layerId || '0') !== layerId) continue;
      const v1 = store.doc.vertexOf(e.v1);
      const v2 = store.doc.vertexOf(e.v2);
      if (!v1 || !v2) continue;
      if (e.type === 'arc') {
        let a1 = Math.atan2(v1.y - e.cy, v1.x - e.cx) * (180 / Math.PI);
        let a2 = Math.atan2(v2.y - e.cy, v2.x - e.cx) * (180 / Math.PI);
        if (a1 < 0) a1 += 360;
        if (a2 < 0) a2 += 360;
        arcs.push({ cx: e.cx, cy: e.cy, r: e.r, a1, a2, layerId: e.layerId });
      } else {
        lines.push({ x1: v1.x, y1: v1.y, x2: v2.x, y2: v2.y, layerId: e.layerId });
      }
    }

    const texts = Array.from(store.doc.texts.values())
      .filter((t) => (t.layerId || '0') === layerId)
      .map((t) => ({ text: t.text, x: t.x, y: t.y, height: t.height, rotation: t.rotation ?? 0, layerId: t.layerId }));

    const fills = Array.from(store.doc.fills.values())
      .filter((f) => (f.layerId || '0') === layerId)
      .map((f) => ({ points: f.points.map((p) => ({ ...p })), color: f.color, opacity: f.opacity, layerId: f.layerId }));

    return {
      name: `LAYER_${layerId}`,
      description: `All elements on layer "${layerId}"`,
      basePoint: { x: 0, y: 0 },
      lines,
      arcs,
      circles,
      texts,
      fills,
    };
  }, [store.doc]);

  const buildTextBlock = useCallback((t: TextEntity): CadBlockDefinition => {
    return {
      name: `TEXT_${t.id}`,
      description: `Drawing Text: "${t.text}" on layer ${t.layerId}`,
      basePoint: { x: t.x, y: t.y },
      lines: [],
      arcs: [],
      circles: [],
      texts: [{ text: t.text, x: t.x, y: t.y, height: t.height, rotation: t.rotation ?? 0, layerId: t.layerId }],
      fills: [],
    };
  }, []);

  const buildFillBlock = useCallback((f: FillEntity): CadBlockDefinition => {
    return {
      name: `FILL_${f.id}`,
      description: `Drawing Fill (${f.type}) with ${f.points.length} points on layer ${f.layerId}`,
      basePoint: f.points[0] ? { ...f.points[0] } : { x: 0, y: 0 },
      lines: [],
      arcs: [],
      circles: [],
      texts: [],
      fills: [{ points: f.points.map((p) => ({ ...p })), color: f.color, opacity: f.opacity, layerId: f.layerId }],
    };
  }, []);

  const buildFlowBlock = useCallback((p: BlockPlacement): CadBlockDefinition => {
    return {
      name: `FLOW_${p.id}`,
      description: `Flow Schematic Part ${p.definitionId} (ID: #${p.id})`,
      basePoint: { x: p.at.x, y: p.at.y },
      lines: [
        { x1: p.at.x - 2, y1: p.at.y - 1, x2: p.at.x + 2, y2: p.at.y - 1 },
        { x1: p.at.x + 2, y1: p.at.y - 1, x2: p.at.x + 2, y2: p.at.y + 1 },
        { x1: p.at.x + 2, y1: p.at.y + 1, x2: p.at.x - 2, y2: p.at.y + 1 },
        { x1: p.at.x - 2, y1: p.at.y + 1, x2: p.at.x - 2, y2: p.at.y - 1 },
      ],
      arcs: [],
      circles: [],
      texts: [{ text: p.refdes || p.definitionId, x: p.at.x, y: p.at.y, height: 0.4, rotation: 0 }],
      fills: [],
    };
  }, []);

  // Compute all elements in the drawings + block definitions
  const allElementsList = useMemo<EditorListItem[]>(() => {
    const items: EditorListItem[] = [];

    // 1. Master Drawing Canvas (if any geometry/texts/blocks exist)
    const hasDrawing =
      store.doc.edges.size > 0 ||
      store.doc.texts.size > 0 ||
      store.doc.fills.size > 0 ||
      store.doc.blockInstances.size > 0;

    if (hasDrawing) {
      items.push({
        id: 'drawing_master',
        name: 'Active Drawing (All)',
        category: 'master',
        groupLabel: 'Drawing Elements',
        badge: 'DRAWING',
        badgeStyle: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60',
        icon: '🎨',
        detail: `${store.doc.edges.size} edges, ${store.doc.texts.size} texts, ${store.doc.blockInstances.size} blocks`,
      });
    }

    // 2. Placed Block Instances on Canvas
    for (const inst of store.doc.blockInstances.values()) {
      items.push({
        id: `instance_${inst.id}`,
        name: `${inst.blockName} #${inst.id}`,
        category: 'instance',
        groupLabel: 'Drawing Elements',
        badge: 'INSTANCE',
        badgeStyle: 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60',
        icon: '🧱',
        detail: `UUID: ${inst.uuid.slice(0, 8)}… @ (${inst.x.toFixed(1)}, ${inst.y.toFixed(1)})`,
        defName: inst.blockName,
        instance: inst,
      });
    }

    // 3. Drawing Text Entities
    for (const t of store.doc.texts.values()) {
      const preview = t.text.length > 20 ? t.text.slice(0, 20) + '…' : t.text;
      items.push({
        id: `text_${t.id}`,
        name: `"${preview}"`,
        category: 'text',
        groupLabel: 'Drawing Elements',
        badge: 'TEXT',
        badgeStyle: 'bg-amber-950/60 text-amber-300 border-amber-700/60',
        icon: '🔤',
        detail: `Layer ${t.layerId} @ (${t.x.toFixed(1)}, ${t.y.toFixed(1)})`,
        textEntity: t,
      });
    }

    // 4. Drawing Fills
    for (const f of store.doc.fills.values()) {
      items.push({
        id: `fill_${f.id}`,
        name: `Fill (${f.type.toUpperCase()}) #${f.id}`,
        category: 'fill',
        groupLabel: 'Drawing Elements',
        badge: 'FILL',
        badgeStyle: 'bg-purple-950/60 text-purple-300 border-purple-700/60',
        icon: '⬛',
        detail: `${f.points.length} vertices on ${f.layerId}`,
        fillEntity: f,
      });
    }

    // 5. Drawing Geometry by Layer
    const layerCounts = new Map<string, number>();
    for (const e of store.doc.edges.values()) {
      const lid = e.layerId || '0';
      layerCounts.set(lid, (layerCounts.get(lid) ?? 0) + 1);
    }
    for (const [layerId, count] of layerCounts.entries()) {
      items.push({
        id: `layer_${layerId}`,
        name: `Layer: ${layerId}`,
        category: 'layer',
        groupLabel: 'Drawing Elements',
        badge: 'GEOMETRY',
        badgeStyle: 'bg-blue-950/60 text-blue-300 border-blue-700/60',
        icon: '📐',
        detail: `${count} edges on layer ${layerId}`,
        layerId,
      });
    }

    // 6. Flow Placements
    if (store.schematic?.placements?.length) {
      for (const p of store.schematic.placements) {
        items.push({
          id: `flow_${p.id}`,
          name: p.refdes || p.definitionId,
          category: 'flow',
          groupLabel: 'Drawing Elements',
          badge: 'FLOW',
          badgeStyle: 'bg-pink-950/60 text-pink-300 border-pink-700/60',
          icon: '⚡',
          detail: `${p.definitionId} @ (${p.at.x.toFixed(1)}, ${p.at.y.toFixed(1)})`,
          flowPlacement: p,
        });
      }
    }

    // 7. Block Definitions Library
    for (const b of store.doc.blocks.values()) {
      items.push({
        id: `block_${b.name}`,
        name: b.name,
        category: 'block',
        groupLabel: 'Block Library',
        badge: 'BLOCK',
        badgeStyle: 'bg-neutral-800 text-neutral-300 border-neutral-600',
        icon: '📦',
        detail: `${b.lines.length + b.circles.length + b.arcs.length} ent`,
        defName: b.name,
      });
    }

    return items;
  }, [store.doc, store.schematic]);

  const filteredElements = useMemo(() => {
    return allElementsList.filter((item) => {
      if (categoryFilter === 'drawing' && item.groupLabel !== 'Drawing Elements') return false;
      if (categoryFilter === 'blocks' && item.category !== 'block') return false;
      if (categoryFilter === 'instances' && item.category !== 'instance') return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDetail = item.detail.toLowerCase().includes(q);
        const matchBadge = item.badge.toLowerCase().includes(q);
        const matchUuid = item.instance?.uuid?.toLowerCase().includes(q) ?? false;
        const matchDef = item.defName?.toLowerCase().includes(q) ?? false;
        return matchName || matchDetail || matchBadge || matchUuid || matchDef;
      }
      return true;
    });
  }, [allElementsList, categoryFilter, search]);

  const categoryCounts = useMemo(() => {
    let drawing = 0;
    let blocks = 0;
    let instances = 0;
    for (const item of allElementsList) {
      if (item.groupLabel === 'Drawing Elements') drawing++;
      if (item.category === 'block') blocks++;
      if (item.category === 'instance') instances++;
    }
    return { all: allElementsList.length, drawing, blocks, instances };
  }, [allElementsList]);

  const SIDEBAR_PAGE_SIZE = 50;
  const totalSidebarPages = Math.max(1, Math.ceil(filteredElements.length / SIDEBAR_PAGE_SIZE));
  const currentSidebarPage = Math.min(sidebarPage, totalSidebarPages);
  const pagedSidebarElements = useMemo(() => {
    const start = (currentSidebarPage - 1) * SIDEBAR_PAGE_SIZE;
    return filteredElements.slice(start, start + SIDEBAR_PAGE_SIZE);
  }, [filteredElements, currentSidebarPage]);

  return {
    buildActiveDrawingBlock, buildLayerBlock, buildTextBlock, buildFillBlock, buildFlowBlock, allElementsList, filteredElements, categoryCounts, SIDEBAR_PAGE_SIZE, totalSidebarPages, currentSidebarPage, pagedSidebarElements,
  };
}
