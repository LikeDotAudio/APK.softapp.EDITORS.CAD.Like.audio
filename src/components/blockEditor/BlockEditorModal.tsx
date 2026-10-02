// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BlockPlacement, CadBlockDefinition, CadBlockInstance, FillEntity, Point, TextEntity } from '../../core/types';
import { generateUuid } from '../../core/generateUuid';
import { useStore } from '../../state/useStore';
import { useUi } from '../../state/useUi';

interface BlockEditorModalProps {
  initialBlockName?: string;
  onClose: () => void;
}

type InspectorTab = 'quickAdd' | 'attributes' | 'lines' | 'circles' | 'arcs' | 'texts' | 'fills';
type ItemCategory = 'all' | 'drawing' | 'blocks' | 'instances';

interface EditorListItem {
  id: string;
  name: string;
  category: 'master' | 'layer' | 'text' | 'fill' | 'instance' | 'flow' | 'block';
  groupLabel: string;
  badge: string;
  badgeStyle: string;
  icon: string;
  detail: string;
  defName?: string;
  instance?: CadBlockInstance;
  textEntity?: TextEntity;
  fillEntity?: FillEntity;
  layerId?: string;
  flowPlacement?: BlockPlacement;
}

export function BlockEditorModal({ initialBlockName, onClose }: BlockEditorModalProps) {
  const store = useStore();
  const { activeLayerId } = useUi();

  const blocksList = Array.from(store.doc.blocks.values());
  const initialName =
    initialBlockName && store.doc.blocks.has(initialBlockName)
      ? initialBlockName
      : blocksList[0]?.name ?? 'RESISTOR';

  const [selectedBlockName, setSelectedBlockName] = useState<string>(initialName);
  const [originalName, setOriginalName] = useState<string>(initialName);
  const [selectedItemId, setSelectedItemId] = useState<string>(`block_${initialName}`);
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory>('all');
  const [selectedInstance, setSelectedInstance] = useState<CadBlockInstance | null>(null);
  const [copiedUuid, setCopiedUuid] = useState(false);
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrVal, setNewAttrVal] = useState('');

  // Pagination states
  const [sidebarPage, setSidebarPage] = useState(1);
  const [linesPage, setLinesPage] = useState(1);
  const [circlesPage, setCirclesPage] = useState(1);
  const [arcsPage, setArcsPage] = useState(1);
  const [textsPage, setTextsPage] = useState(1);

  // Editable local copy of the block definition
  const [currentBlock, setCurrentBlock] = useState<CadBlockDefinition>(() => {
    const found = store.doc.blocks.get(initialName);
    if (found) return JSON.parse(JSON.stringify(found)) as CadBlockDefinition;
    return {
      name: 'NEW_BLOCK',
      basePoint: { x: 0, y: 0 },
      lines: [],
      arcs: [],
      circles: [],
      texts: [],
      fills: [],
    };
  });

  const [activeTab, setActiveTab] = useState<InspectorTab>('quickAdd');
  const [pickingBasePoint, setPickingBasePoint] = useState(false);
  const [search, setSearch] = useState('');

  // Canvas Pan & Zoom state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState<number>(30); // pixels per world unit
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 }); // offset in pixels
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [hoverWorld, setHoverWorld] = useState<Point | null>(null);

  // Quick Add tool form states
  const [lineX1, setLineX1] = useState('0');
  const [lineY1, setLineY1] = useState('0');
  const [lineX2, setLineX2] = useState('2');
  const [lineY2, setLineY2] = useState('0');

  const [boxX, setBoxX] = useState('-1');
  const [boxY, setBoxY] = useState('-0.5');
  const [boxW, setBoxW] = useState('2');
  const [boxH, setBoxH] = useState('1');

  const [circleCx, setCircleCx] = useState('0');
  const [circleCy, setCircleCy] = useState('0');
  const [circleR, setCircleR] = useState('0.75');

  const [arcCx, setArcCx] = useState('0');
  const [arcCy, setArcCy] = useState('0');
  const [arcR, setArcR] = useState('1');
  const [arcA1, setArcA1] = useState('0');
  const [arcA2, setArcA2] = useState('180');

  const [textStr, setTextStr] = useState('LABEL');
  const [textX, setTextX] = useState('0');
  const [textY, setTextY] = useState('0');
  const [textH, setTextH] = useState('0.4');
  const [textRot, setTextRot] = useState('0');

  const [pinX, setPinX] = useState('0');
  const [pinY, setPinY] = useState('0');
  const [pinLen, setPinLen] = useState('1');
  const [pinDir, setPinDir] = useState<'left' | 'right' | 'up' | 'down'>('left');
  const [pinLabel, setPinLabel] = useState('IN');

  const [fillW, setFillW] = useState('2');
  const [fillH, setFillH] = useState('1');
  const [fillColor, setFillColor] = useState('#38bdf8');
  const [fillOpacity, setFillOpacity] = useState('0.25');

  // Load a block into the editor
  const loadBlock = useCallback((name: string) => {
    const found = store.doc.blocks.get(name);
    if (!found) return;
    const cloned = JSON.parse(JSON.stringify(found)) as CadBlockDefinition;
    setSelectedBlockName(name);
    setOriginalName(name);
    setCurrentBlock(cloned);
  }, [store]);

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

  const handleSelectItem = useCallback((item: EditorListItem) => {
    setSelectedItemId(item.id);
    setSelectedInstance(item.instance ?? null);

    if (item.category === 'block' && item.defName) {
      loadBlock(item.defName);
    } else if (item.category === 'instance' && item.instance) {
      if (store.doc.blocks.has(item.instance.blockName)) {
        loadBlock(item.instance.blockName);
      }
      setActiveTab('attributes');
    } else if (item.category === 'master') {
      const b = buildActiveDrawingBlock();
      setSelectedBlockName('ACTIVE_DRAWING');
      setOriginalName('ACTIVE_DRAWING');
      setCurrentBlock(b);
      setPickingBasePoint(false);
    } else if (item.category === 'layer' && item.layerId) {
      const b = buildLayerBlock(item.layerId);
      setSelectedBlockName(`LAYER_${item.layerId}`);
      setOriginalName(`LAYER_${item.layerId}`);
      setCurrentBlock(b);
      setPickingBasePoint(false);
    } else if (item.category === 'text' && item.textEntity) {
      const b = buildTextBlock(item.textEntity);
      setSelectedBlockName(`TEXT_${item.textEntity.id}`);
      setOriginalName(`TEXT_${item.textEntity.id}`);
      setCurrentBlock(b);
      setPickingBasePoint(false);
    } else if (item.category === 'fill' && item.fillEntity) {
      const b = buildFillBlock(item.fillEntity);
      setSelectedBlockName(`FILL_${item.fillEntity.id}`);
      setOriginalName(`FILL_${item.fillEntity.id}`);
      setCurrentBlock(b);
      setPickingBasePoint(false);
    } else if (item.category === 'flow' && item.flowPlacement) {
      const b = buildFlowBlock(item.flowPlacement);
      setSelectedBlockName(`FLOW_${item.flowPlacement.id}`);
      setOriginalName(`FLOW_${item.flowPlacement.id}`);
      setCurrentBlock(b);
      setPickingBasePoint(false);
    }
  }, [buildActiveDrawingBlock, buildFillBlock, buildFlowBlock, buildLayerBlock, buildTextBlock, loadBlock, store.doc.blocks]);

  // When initialBlockName changes externally
  useEffect(() => {
    if (initialBlockName && store.doc.blocks.has(initialBlockName)) {
      loadBlock(initialBlockName);
    }
  }, [initialBlockName, loadBlock, store]);

  // World to screen / screen to world transforms
  const worldToScreen = useCallback((wx: number, wy: number, width: number, height: number): Point => {
    return {
      x: width / 2 + pan.x + wx * zoom,
      y: height / 2 + pan.y - wy * zoom,
    };
  }, [pan.x, pan.y, zoom]);

  const screenToWorld = useCallback((sx: number, sy: number, width: number, height: number): Point => {
    return {
      x: (sx - (width / 2 + pan.x)) / zoom,
      y: ((height / 2 + pan.y) - sy) / zoom,
    };
  }, [pan.x, pan.y, zoom]);

  // Zoom to fit all geometry inside current block
  const handleZoomToFit = useCallback(() => {
    const pts: Point[] = [{ x: currentBlock.basePoint.x, y: currentBlock.basePoint.y }, { x: 0, y: 0 }];
    for (const l of currentBlock.lines) {
      pts.push({ x: l.x1, y: l.y1 });
      pts.push({ x: l.x2, y: l.y2 });
    }
    for (const c of currentBlock.circles) {
      pts.push({ x: c.cx - c.r, y: c.cy - c.r });
      pts.push({ x: c.cx + c.r, y: c.cy + c.r });
    }
    for (const a of currentBlock.arcs) {
      pts.push({ x: a.cx - a.r, y: a.cy - a.r });
      pts.push({ x: a.cx + a.r, y: a.cy + a.r });
    }
    for (const t of currentBlock.texts ?? []) {
      pts.push({ x: t.x, y: t.y });
    }
    for (const f of currentBlock.fills ?? []) {
      pts.push(...f.points);
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const w = maxX - minX;
    const h = maxY - minY;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const margin = 80;
    const spanX = Math.max(0.5, w);
    const spanY = Math.max(0.5, h);

    const fitZoom = Math.min((cw - margin * 2) / spanX, (ch - margin * 2) / spanY);
    const clampedZoom = Math.max(5, Math.min(120, fitZoom));

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    setZoom(clampedZoom);
    setPan({
      x: -midX * clampedZoom,
      y: midY * clampedZoom,
    });
  }, [currentBlock]);

  // Redraw preview canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Dark CAD background
    ctx.fillStyle = '#141416';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    const minW = screenToWorld(0, height, width, height);
    const maxW = screenToWorld(width, 0, width, height);

    // Choose grid step based on zoom
    let step = 1;
    if (zoom < 10) step = 10;
    else if (zoom < 25) step = 2;
    else if (zoom > 80) step = 0.5;

    ctx.strokeStyle = '#222226';
    ctx.lineWidth = 1;

    const startX = Math.floor(minW.x / step) * step;
    const endX = Math.ceil(maxW.x / step) * step;
    for (let x = startX; x <= endX; x += step) {
      const sp = worldToScreen(x, 0, width, height);
      ctx.beginPath();
      ctx.moveTo(sp.x, 0);
      ctx.lineTo(sp.x, height);
      ctx.stroke();
    }

    const startY = Math.floor(minW.y / step) * step;
    const endY = Math.ceil(maxW.y / step) * step;
    for (let y = startY; y <= endY; y += step) {
      const sp = worldToScreen(0, y, width, height);
      ctx.beginPath();
      ctx.moveTo(0, sp.y);
      ctx.lineTo(width, sp.y);
      ctx.stroke();
    }

    // Axes
    const origin = worldToScreen(0, 0, width, height);

    // X Axis (Dim Red)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, origin.y);
    ctx.lineTo(width, origin.y);
    ctx.stroke();

    // Y Axis (Dim Green)
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.45)';
    ctx.beginPath();
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, height);
    ctx.stroke();

    // Origin indicator (0,0)
    ctx.fillStyle = '#666';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('(0,0)', origin.x + 4, origin.y - 4);

    // 1. Draw Fills
    if (currentBlock.fills) {
      for (const f of currentBlock.fills) {
        if (f.points.length < 3) continue;
        const pts = f.points.map((p) => worldToScreen(p.x, p.y, width, height));
        ctx.save();
        ctx.fillStyle = f.color || '#38bdf8';
        ctx.globalAlpha = f.opacity ?? 0.25;
        ctx.beginPath();
        pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = f.color || '#38bdf8';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 2. Draw Lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.8;
    for (const l of currentBlock.lines) {
      const p1 = worldToScreen(l.x1, l.y1, width, height);
      const p2 = worldToScreen(l.x2, l.y2, width, height);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Vertex dots
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 2.5, 0, Math.PI * 2);
      ctx.arc(p2.x, p2.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Draw Circles
    ctx.strokeStyle = '#38bdf8';
    for (const c of currentBlock.circles) {
      const cp = worldToScreen(c.cx, c.cy, width, height);
      const rPx = c.r * zoom;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, rPx, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 4. Draw Arcs
    ctx.strokeStyle = '#a855f7';
    for (const a of currentBlock.arcs) {
      const cp = worldToScreen(a.cx, a.cy, width, height);
      const rPx = a.r * zoom;
      const startRad = -((a.a1 * Math.PI) / 180);
      const endRad = -((a.a2 * Math.PI) / 180);
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, rPx, startRad, endRad, true);
      ctx.stroke();
    }

    // 5. Draw Texts
    if (currentBlock.texts) {
      ctx.fillStyle = '#f8fafc';
      for (const t of currentBlock.texts) {
        const tp = worldToScreen(t.x, t.y, width, height);
        const pxH = Math.max(9, t.height * zoom);
        ctx.save();
        ctx.translate(tp.x, tp.y);
        ctx.rotate(-(((t.rotation ?? 0) * Math.PI) / 180));
        ctx.font = `${Math.round(pxH)}px "JetBrains Mono", monospace, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(t.text, 0, 0);
        ctx.restore();
      }
    }

    // 6. Draw Insertion Base Point Reticle
    const bp = worldToScreen(currentBlock.basePoint.x, currentBlock.basePoint.y, width, height);
    ctx.save();
    ctx.strokeStyle = '#eab308';
    ctx.fillStyle = '#eab308';
    ctx.lineWidth = 2;

    // Crosshair reticle
    ctx.beginPath();
    ctx.arc(bp.x, bp.y, 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bp.x - 12, bp.y);
    ctx.lineTo(bp.x + 12, bp.y);
    ctx.moveTo(bp.x, bp.y - 12);
    ctx.lineTo(bp.x, bp.y + 12);
    ctx.stroke();

    ctx.font = 'bold 10px monospace';
    ctx.fillText(
      `BASE (${currentBlock.basePoint.x.toFixed(2)}, ${currentBlock.basePoint.y.toFixed(2)})`,
      bp.x + 10,
      bp.y + 14,
    );
    ctx.restore();
  }, [currentBlock, pan, zoom, screenToWorld, worldToScreen]);

  // Pointer events on preview canvas
  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (pickingBasePoint) {
      const world = screenToWorld(sx, sy, canvas.width, canvas.height);
      const snapX = Math.round(world.x * 4) / 4;
      const snapY = Math.round(world.y * 4) / 4;
      setCurrentBlock((prev) => ({
        ...prev,
        basePoint: { x: snapX, y: snapY },
      }));
      setPickingBasePoint(false);
      store.showHint(`Base point set to (${snapX}, ${snapY}).`, 2000);
      return;
    }

    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const world = screenToWorld(sx, sy, canvas.width, canvas.height);
    setHoverWorld(world);

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handlePointerUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.max(5, Math.min(250, zoom * zoomFactor));

    // Zoom towards cursor
    const preWorld = screenToWorld(sx, sy, canvas.width, canvas.height);
    setZoom(newZoom);
    setPan({
      x: sx - canvas.width / 2 - preWorld.x * newZoom,
      y: -(sy - canvas.height / 2 - preWorld.y * newZoom),
    });
  };

  // Resize canvas to fill element
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 600;
      canvas.height = canvas.parentElement?.clientHeight || 450;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Save current block definition to store
  const handleSaveBlock = () => {
    const name = currentBlock.name.trim();
    if (!name) {
      alert('Block name cannot be empty.');
      return;
    }

    store.history.push(store.doc.snapshot());

    if (originalName !== name) {
      store.doc.renameBlockDefinition(originalName, name);
    }

    store.doc.addBlockDefinition(currentBlock);
    setOriginalName(name);
    setSelectedBlockName(name);

    store.markDocChanged();
    store.requestDraw();
    store.emit();
    store.showHint(`Block "${name}" definition saved. Placed instances updated.`, 3000);
  };

  // Create brand new blank block
  const handleNewBlock = () => {
    const name = window.prompt('Enter new block definition name:', 'BLOCK_1');
    if (!name || !name.trim()) return;
    const cleanName = name.trim().toUpperCase().replace(/\s+/g, '_');

    if (store.doc.blocks.has(cleanName)) {
      alert(`A block named "${cleanName}" already exists.`);
      return;
    }

    const blankDef: CadBlockDefinition = {
      name: cleanName,
      description: 'Custom CAD symbol',
      basePoint: { x: 0, y: 0 },
      lines: [],
      circles: [],
      arcs: [],
      texts: [],
      fills: [],
    };

    store.doc.addBlockDefinition(blankDef);
    setSelectedBlockName(cleanName);
    setOriginalName(cleanName);
    setCurrentBlock(blankDef);
    store.markDocChanged();
    store.emit();
    store.showHint(`Created blank block "${cleanName}".`, 2000);
  };

  // Duplicate current block
  const handleDuplicateBlock = () => {
    const copyName = window.prompt('Enter name for duplicate block:', `${currentBlock.name}_COPY`);
    if (!copyName || !copyName.trim()) return;
    const cleanName = copyName.trim().toUpperCase().replace(/\s+/g, '_');

    const copyDef: CadBlockDefinition = {
      ...JSON.parse(JSON.stringify(currentBlock)),
      name: cleanName,
    };

    store.doc.addBlockDefinition(copyDef);
    setSelectedBlockName(cleanName);
    setOriginalName(cleanName);
    setCurrentBlock(copyDef);
    store.markDocChanged();
    store.emit();
    store.showHint(`Duplicated block as "${cleanName}".`, 2000);
  };

  // Delete current block
  const handleDeleteBlock = () => {
    if (!window.confirm(`Are you sure you want to delete block definition "${currentBlock.name}"?`)) {
      return;
    }
    store.doc.removeBlockDefinition(currentBlock.name);
    store.markDocChanged();
    store.requestDraw();
    store.emit();

    const remaining = Array.from(store.doc.blocks.values());
    if (remaining.length > 0) {
      loadBlock(remaining[0].name);
    }
    store.showHint(`Deleted block "${currentBlock.name}".`, 2000);
  };

  // Insert on canvas
  const handleInsertOnSheet = () => {
    store.edit(() => {
      store.doc.addBlockInstance(currentBlock.name, 0, 0, 1, 0, activeLayerId);
      return true;
    });
    store.showHint(`Inserted instance of "${currentBlock.name}" at (0, 0).`, 2500);
  };

  const handleCopyUuid = async (uuidText: string) => {
    try {
      await navigator.clipboard.writeText(uuidText);
      setCopiedUuid(true);
      setTimeout(() => setCopiedUuid(false), 2000);
      store.showHint('Copied Block UUID to clipboard.', 2000);
    } catch {
      // fallback
    }
  };

  const handleRegenerateInstanceUuid = () => {
    if (!selectedInstance) return;
    const newUuid = generateUuid();
    store.history.push(store.doc.snapshot());
    store.edit(() => {
      const inst = store.doc.blockInstances.get(selectedInstance.id);
      if (inst) {
        inst.uuid = newUuid;
      }
      return true;
    });
    setSelectedInstance((prev) => (prev ? { ...prev, uuid: newUuid } : null));
    store.showHint('Regenerated Block UUID.', 2000);
  };

  const handleUpdateInstanceField = (field: keyof CadBlockInstance, value: any) => {
    if (!selectedInstance) return;
    store.history.push(store.doc.snapshot());
    store.edit(() => {
      const inst = store.doc.blockInstances.get(selectedInstance.id);
      if (inst) {
        (inst as any)[field] = value;
      }
      return true;
    });
    setSelectedInstance((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleAddInstanceAttribute = () => {
    if (!selectedInstance || !newAttrKey.trim()) return;
    const k = newAttrKey.trim();
    const v = newAttrVal.trim();
    store.history.push(store.doc.snapshot());
    store.edit(() => {
      const inst = store.doc.blockInstances.get(selectedInstance.id);
      if (inst) {
        inst.attributes = { ...(inst.attributes ?? {}), [k]: v };
      }
      return true;
    });
    setSelectedInstance((prev) =>
      prev ? { ...prev, attributes: { ...(prev.attributes ?? {}), [k]: v } } : null,
    );
    setNewAttrKey('');
    setNewAttrVal('');
    store.showHint(`Added attribute "${k}" = "${v}".`, 2000);
  };

  const handleDeleteInstanceAttribute = (key: string) => {
    if (!selectedInstance) return;
    store.history.push(store.doc.snapshot());
    store.edit(() => {
      const inst = store.doc.blockInstances.get(selectedInstance.id);
      if (inst && inst.attributes) {
        delete inst.attributes[key];
      }
      return true;
    });
    setSelectedInstance((prev) => {
      if (!prev || !prev.attributes) return prev;
      const nextAttrs = { ...prev.attributes };
      delete nextAttrs[key];
      return { ...prev, attributes: nextAttrs };
    });
    store.showHint(`Deleted attribute "${key}".`, 2000);
  };

  const handleApplyToDrawing = () => {
    store.history.push(store.doc.snapshot());
    store.edit(() => {
      store.doc.clear();
      const gId = store.doc.newGroupId();
      for (const l of currentBlock.lines) {
        const v1 = store.doc.addVertex(l.x1, l.y1);
        const v2 = store.doc.addVertex(l.x2, l.y2);
        store.doc.addLineEdge(v1, v2, gId, l.layerId || activeLayerId);
      }
      for (const a of currentBlock.arcs) {
        const rad1 = (a.a1 * Math.PI) / 180;
        const rad2 = (a.a2 * Math.PI) / 180;
        const x1 = a.cx + a.r * Math.cos(rad1);
        const y1 = a.cy + a.r * Math.sin(rad1);
        const x2 = a.cx + a.r * Math.cos(rad2);
        const y2 = a.cy + a.r * Math.sin(rad2);
        const v1 = store.doc.addVertex(x1, y1);
        const v2 = store.doc.addVertex(x2, y2);
        store.doc.addArcEdge(v1, v2, a.cx, a.cy, a.r, gId, a.layerId || activeLayerId);
      }
      for (const c of currentBlock.circles) {
        const v1 = store.doc.addVertex(c.cx + c.r, c.cy);
        const v2 = store.doc.addVertex(c.cx - c.r, c.cy);
        store.doc.addArcEdge(v1, v2, c.cx, c.cy, c.r, gId, c.layerId || activeLayerId);
        store.doc.addArcEdge(v2, v1, c.cx, c.cy, c.r, gId, c.layerId || activeLayerId);
      }
      for (const t of currentBlock.texts ?? []) {
        store.doc.addText(t.text, t.x, t.y, t.height, t.rotation, t.layerId || activeLayerId);
      }
      for (const f of currentBlock.fills ?? []) {
        store.doc.addFill(f.points, 'solid', f.layerId || activeLayerId, f.color, f.opacity);
      }
      return true;
    });
    store.view.zoomToFit(store.doc.bounds());
    store.requestDraw();
    store.emit();
    store.showHint('Applied block changes to drawing canvas.', 3000);
  };

  const handleSaveAsNewBlock = () => {
    const name = window.prompt('Enter name for new block definition:', `${currentBlock.name}_BLOCK`);
    if (!name || !name.trim()) return;
    const cleanName = name.trim().toUpperCase().replace(/\s+/g, '_');
    const newDef: CadBlockDefinition = {
      ...JSON.parse(JSON.stringify(currentBlock)),
      name: cleanName,
    };
    store.doc.addBlockDefinition(newDef);
    setSelectedBlockName(cleanName);
    setOriginalName(cleanName);
    setCurrentBlock(newDef);
    store.markDocChanged();
    store.emit();
    store.showHint(`Saved definition "${cleanName}".`, 2500);
  };

  // Primitives addition helpers
  const handleAddLine = () => {
    const x1 = parseFloat(lineX1) || 0;
    const y1 = parseFloat(lineY1) || 0;
    const x2 = parseFloat(lineX2) || 0;
    const y2 = parseFloat(lineY2) || 0;
    setCurrentBlock((prev) => ({
      ...prev,
      lines: [...prev.lines, { x1, y1, x2, y2 }],
    }));
  };

  const handleAddBox = () => {
    const x = parseFloat(boxX) || 0;
    const y = parseFloat(boxY) || 0;
    const w = parseFloat(boxW) || 1;
    const h = parseFloat(boxH) || 1;
    const newLines = [
      { x1: x, y1: y, x2: x + w, y2: y },
      { x1: x + w, y1: y, x2: x + w, y2: y + h },
      { x1: x + w, y1: y + h, x2: x, y2: y + h },
      { x1: x, y1: y + h, x2: x, y2: y },
    ];
    setCurrentBlock((prev) => ({
      ...prev,
      lines: [...prev.lines, ...newLines],
    }));
  };

  const handleAddCircle = () => {
    const cx = parseFloat(circleCx) || 0;
    const cy = parseFloat(circleCy) || 0;
    const r = parseFloat(circleR) || 0.5;
    setCurrentBlock((prev) => ({
      ...prev,
      circles: [...prev.circles, { cx, cy, r }],
    }));
  };

  const handleAddArc = () => {
    const cx = parseFloat(arcCx) || 0;
    const cy = parseFloat(arcCy) || 0;
    const r = parseFloat(arcR) || 0.5;
    const a1 = parseFloat(arcA1) || 0;
    const a2 = parseFloat(arcA2) || 180;
    setCurrentBlock((prev) => ({
      ...prev,
      arcs: [...prev.arcs, { cx, cy, r, a1, a2 }],
    }));
  };

  const handleAddText = () => {
    const x = parseFloat(textX) || 0;
    const y = parseFloat(textY) || 0;
    const height = parseFloat(textH) || 0.4;
    const rotation = parseFloat(textRot) || 0;
    setCurrentBlock((prev) => ({
      ...prev,
      texts: [...(prev.texts ?? []), { text: textStr, x, y, height, rotation }],
    }));
  };

  const handleAddTerminalPin = () => {
    const px = parseFloat(pinX) || 0;
    const py = parseFloat(pinY) || 0;
    const len = parseFloat(pinLen) || 1;

    let endX = px;
    let endY = py;
    let textOffsetX = 0;
    let textOffsetY = 0;

    if (pinDir === 'left') {
      endX = px - len;
      textOffsetX = -0.2;
    } else if (pinDir === 'right') {
      endX = px + len;
      textOffsetX = 0.2;
    } else if (pinDir === 'up') {
      endY = py + len;
      textOffsetY = 0.2;
    } else if (pinDir === 'down') {
      endY = py - len;
      textOffsetY = -0.2;
    }

    const leadLine = { x1: px, y1: py, x2: endX, y2: endY };
    const terminalDot = { cx: endX, cy: endY, r: 0.1 };
    const labelText = pinLabel
      ? { text: pinLabel, x: endX + textOffsetX, y: endY + textOffsetY, height: 0.3 }
      : null;

    setCurrentBlock((prev) => ({
      ...prev,
      lines: [...prev.lines, leadLine],
      circles: [...prev.circles, terminalDot],
      texts: labelText ? [...(prev.texts ?? []), labelText] : prev.texts,
    }));
  };

  const handleAddFillBox = () => {
    const w = parseFloat(fillW) || 1;
    const h = parseFloat(fillH) || 1;
    const op = parseFloat(fillOpacity) || 0.25;
    const x = -w / 2;
    const y = -h / 2;
    const pts: Point[] = [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ];
    setCurrentBlock((prev) => ({
      ...prev,
      fills: [...(prev.fills ?? []), { points: pts, color: fillColor, opacity: op }],
    }));
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs select-none p-3 animate-in fade-in duration-200">
      <div className="flex h-[94vh] w-[96vw] max-w-[1450px] flex-col overflow-hidden rounded-xl border border-[#3c3c3c] bg-[#1e1e1e] text-[#cccccc] shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#333] bg-[#252526] px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-xl">🧱</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">CAD Block Editor</h2>
                <span className="rounded bg-[#2ea043]/30 px-2 py-0.5 text-[11px] font-mono font-semibold text-[#3fb950] border border-[#2ea043]/40">
                  BEDIT
                </span>
                <span className="text-xs text-[#888]">Editing definition:</span>
                <span className="font-mono text-sm font-bold text-[#f4902c]">{currentBlock.name}</span>
              </div>
              <p className="text-[11px] text-[#888]">
                Design symbols, port terminals, insertion base points, and reusable CAD block definitions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedBlockName === 'ACTIVE_DRAWING' && (
              <>
                <button
                  onClick={handleApplyToDrawing}
                  className="rounded bg-[#1f6feb] px-3 py-1 text-xs font-semibold text-white hover:bg-[#388bfd] transition-colors shadow-sm"
                  title="Apply changes made in block editor back to active drawing canvas"
                >
                  Apply to Drawing
                </button>
                <button
                  onClick={handleSaveAsNewBlock}
                  className="rounded bg-[#238636] px-3 py-1 text-xs font-semibold text-white hover:bg-[#2ea043] transition-colors shadow-sm"
                  title="Package current drawing into a reusable block definition"
                >
                  Save as Block...
                </button>
              </>
            )}
            {selectedInstance && (
              <button
                onClick={handleInsertOnSheet}
                className="rounded bg-[#0e639c] px-3 py-1 text-xs font-semibold text-white hover:bg-[#1177bb] transition-colors shadow-sm"
                title="Insert another copy of this block on canvas"
              >
                + Insert Instance
              </button>
            )}
            <button
              onClick={handleNewBlock}
              className="rounded bg-[#238636] px-3 py-1 text-xs font-semibold text-white hover:bg-[#2ea043] transition-colors"
            >
              + New Block
            </button>
            <button
              onClick={handleDuplicateBlock}
              className="rounded border border-[#444] bg-[#2d2d2d] px-3 py-1 text-xs text-white hover:bg-[#383838] transition-colors"
            >
              Duplicate
            </button>
            <button
              onClick={handleDeleteBlock}
              className="rounded bg-red-950/40 border border-red-800/50 px-2.5 py-1 text-xs text-red-300 hover:bg-red-900/60 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="ml-3 rounded p-1 text-[#888] hover:bg-[#333] hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Main Work Area: Left Sidebar (All Drawing Elements & Blocks) + Center (Interactive Preview) + Right (Inspector & Tools) */}
        <div className="flex flex-1 overflow-hidden">
          {/* 1. Left Catalog Sidebar (All Elements in Drawings + Block Definitions) */}
          <div className="w-72 border-r border-[#333] bg-[#181818] flex flex-col overflow-hidden">
            {/* Search Box */}
            <div className="p-2 border-b border-[#333]">
              <input
                type="text"
                placeholder="Search elements & blocks..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSidebarPage(1);
                }}
                className="w-full rounded border border-[#3c3c3c] bg-[#141414] px-2 py-1 text-xs text-white placeholder-[#777]"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex border-b border-[#2d2d2d] bg-[#1f1f1f] p-1 gap-1 text-[11px]">
              {(['all', 'drawing', 'blocks', 'instances'] as const).map((cat) => {
                const count = categoryCounts[cat];

                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setSidebarPage(1);
                    }}
                    className={`flex-1 rounded py-1 text-center font-medium capitalize transition-colors ${
                      categoryFilter === cat
                        ? 'bg-[#0e639c] text-white shadow-xs'
                        : 'text-[#888] hover:bg-[#2a2a2a] hover:text-[#ccc]'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* List of Drawing Elements and Blocks */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
              {filteredElements.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#777]">
                  No matching elements found.
                </div>
              ) : (
                pagedSidebarElements.map((item) => {
                  const active = item.id === selectedItemId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className={`w-full text-left rounded-md px-2.5 py-1.5 text-xs transition-all flex items-start gap-2 border ${
                        active
                          ? 'bg-[#0e639c] text-white border-[#1177bb] shadow-sm'
                          : 'border-transparent text-[#bbb] hover:bg-[#252526] hover:text-white'
                      }`}
                    >
                      <span className="text-sm mt-0.5 select-none">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono font-semibold truncate text-[11px] leading-tight">
                            {item.name}
                          </span>
                          <span
                            className={`shrink-0 px-1 py-0.2 rounded text-[9px] font-mono border ${item.badgeStyle}`}
                          >
                            {item.badge}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#888] truncate mt-0.5">
                          {item.detail}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Sidebar Pagination Bar if multi-page */}
            {totalSidebarPages > 1 && (
              <div className="border-t border-[#2d2d2d] bg-[#1a1a1a] px-2 py-1 flex items-center justify-between text-[11px] text-[#aaa]">
                <button
                  onClick={() => setSidebarPage((p) => Math.max(1, p - 1))}
                  disabled={currentSidebarPage <= 1}
                  className="rounded px-2 py-0.5 bg-[#252526] hover:bg-[#333] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ‹ Prev
                </button>
                <span className="font-mono text-[10px] text-[#f4902c]">
                  Page {currentSidebarPage} / {totalSidebarPages}
                </span>
                <button
                  onClick={() => setSidebarPage((p) => Math.min(totalSidebarPages, p + 1))}
                  disabled={currentSidebarPage >= totalSidebarPages}
                  className="rounded px-2 py-0.5 bg-[#252526] hover:bg-[#333] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next ›
                </button>
              </div>
            )}

            {/* Sidebar Summary Footer */}
            <div className="border-t border-[#2d2d2d] bg-[#141414] px-2.5 py-1.5 text-[10px] text-[#777] flex items-center justify-between">
              <span>{allElementsList.length} elements in drawings</span>
              <span className="font-mono text-[#aaa]">
                {store.doc.blockInstances.size} placed inst
              </span>
            </div>
          </div>

          {/* 2. Center CAD Interactive Preview Canvas */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#141416] relative">
            {/* Canvas Toolbar Overlays */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-md border border-[#333] bg-[#1e1e1e]/90 p-1 backdrop-blur-xs">
              <button
                onClick={handleZoomToFit}
                className="rounded bg-[#2a2a2a] px-2 py-0.5 text-xs text-[#ccc] hover:bg-[#383838] hover:text-white"
                title="Zoom to Fit block geometry"
              >
                ⛶ Fit
              </button>
              <button
                onClick={() => {
                  setZoom(30);
                  setPan({ x: 0, y: 0 });
                }}
                className="rounded bg-[#2a2a2a] px-2 py-0.5 text-xs text-[#ccc] hover:bg-[#383838] hover:text-white"
                title="Reset View to 1:1 Origin"
              >
                ⌂ 1:1
              </button>
              <div className="h-4 w-px bg-[#444] mx-1" />
              <button
                onClick={() => setPickingBasePoint(!pickingBasePoint)}
                className={`rounded px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                  pickingBasePoint
                    ? 'bg-[#eab308] text-black animate-pulse'
                    : 'bg-[#333] text-[#ccc] hover:bg-[#444] hover:text-white'
                }`}
                title="Click on the canvas to set the block insertion base point"
              >
                ⊕ {pickingBasePoint ? 'Click to Set Base Point...' : 'Pick Base Point'}
              </button>
            </div>

            {/* Instruction Banner when picking base point */}
            {pickingBasePoint && (
              <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 rounded bg-[#eab308] px-4 py-1 text-xs font-bold text-black shadow-lg">
                Click anywhere on the preview canvas to set the insertion base point (snaps to 0.25)
              </div>
            )}

            {/* Canvas element */}
            <div className="flex-1 w-full h-full relative cursor-crosshair">
              <canvas
                ref={canvasRef}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onWheel={handleWheel}
                className="w-full h-full block"
              />
            </div>

            {/* Bottom status readout */}
            <div className="flex items-center justify-between border-t border-[#2d2d2d] bg-[#1a1a1a] px-3 py-1 text-[11px] text-[#888]">
              <div className="flex items-center gap-4">
                <span>
                  Cursor: {hoverWorld ? `X: ${hoverWorld.x.toFixed(2)}, Y: ${hoverWorld.y.toFixed(2)}` : '—'}
                </span>
                <span>Zoom: {Math.round(zoom)} px/unit</span>
                <span>Base Point: ({currentBlock.basePoint.x.toFixed(2)}, {currentBlock.basePoint.y.toFixed(2)})</span>
              </div>
              <div className="text-[10px] text-[#666]">
                Wheel = Zoom • Drag = Pan • Red = X Axis • Green = Y Axis • Yellow = Base Point
              </div>
            </div>
          </div>

          {/* 3. Right Inspector & Tools Column */}
          <div className="w-96 border-l border-[#333] bg-[#1e1e1e] flex flex-col overflow-hidden">
            {/* Block Metadata */}
            <div className="border-b border-[#333] p-3 space-y-2 bg-[#252526]">
              <div>
                <label className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">
                  Block Name
                </label>
                <input
                  type="text"
                  value={currentBlock.name}
                  onChange={(e) => setCurrentBlock({ ...currentBlock, name: e.target.value.toUpperCase() })}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-2 py-1 font-mono text-sm text-[#f4902c] font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">
                  Description
                </label>
                <input
                  type="text"
                  value={currentBlock.description || ''}
                  onChange={(e) => setCurrentBlock({ ...currentBlock, description: e.target.value })}
                  placeholder="e.g. 10k Resistor symbol"
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-2 py-0.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">
                    Base Point X
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={currentBlock.basePoint.x}
                    onChange={(e) =>
                      setCurrentBlock({
                        ...currentBlock,
                        basePoint: { ...currentBlock.basePoint, x: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-2 py-0.5 text-xs text-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">
                    Base Point Y
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={currentBlock.basePoint.y}
                    onChange={(e) =>
                      setCurrentBlock({
                        ...currentBlock,
                        basePoint: { ...currentBlock.basePoint, y: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-2 py-0.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Inspector Tabs */}
            <div className="flex border-b border-[#333] bg-[#1a1a1a] text-xs">
              <button
                onClick={() => setActiveTab('quickAdd')}
                className={`flex-1 py-1.5 font-medium border-b-2 transition-colors ${
                  activeTab === 'quickAdd'
                    ? 'border-[#f4902c] text-white bg-[#252526]'
                    : 'border-transparent text-[#888] hover:text-[#ccc]'
                }`}
              >
                + Tools
              </button>
              <button
                onClick={() => setActiveTab('lines')}
                className={`flex-1 py-1.5 font-medium border-b-2 transition-colors ${
                  activeTab === 'lines'
                    ? 'border-[#f4902c] text-white bg-[#252526]'
                    : 'border-transparent text-[#888] hover:text-[#ccc]'
                }`}
              >
                Lines ({currentBlock.lines.length})
              </button>
              <button
                onClick={() => setActiveTab('circles')}
                className={`flex-1 py-1.5 font-medium border-b-2 transition-colors ${
                  activeTab === 'circles'
                    ? 'border-[#f4902c] text-white bg-[#252526]'
                    : 'border-transparent text-[#888] hover:text-[#ccc]'
                }`}
              >
                Circles ({currentBlock.circles.length})
              </button>
              <button
                onClick={() => setActiveTab('arcs')}
                className={`flex-1 py-1.5 font-medium border-b-2 transition-colors ${
                  activeTab === 'arcs'
                    ? 'border-[#f4902c] text-white bg-[#252526]'
                    : 'border-transparent text-[#888] hover:text-[#ccc]'
                }`}
              >
                Arcs ({currentBlock.arcs.length})
              </button>
              <button
                onClick={() => setActiveTab('texts')}
                className={`flex-1 py-1.5 font-medium border-b-2 transition-colors ${
                  activeTab === 'texts'
                    ? 'border-[#f4902c] text-white bg-[#252526]'
                    : 'border-transparent text-[#888] hover:text-[#ccc]'
                }`}
              >
                Text ({(currentBlock.texts ?? []).length})
              </button>
              <button
                onClick={() => setActiveTab('attributes')}
                className={`flex-1 py-1.5 font-medium border-b-2 transition-colors ${
                  activeTab === 'attributes'
                    ? 'border-[#f4902c] text-white bg-[#252526]'
                    : 'border-transparent text-[#888] hover:text-[#ccc]'
                }`}
                title="UUID and Key-Value Attributes"
              >
                Attrs {selectedInstance ? `(${Object.keys(selectedInstance.attributes ?? {}).length})` : ''}
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* TAB: Quick Add Tools */}
              {activeTab === 'quickAdd' && (
                <div className="space-y-4">
                  {/* Pin / Port Tool (Essential for CAD Schematics) */}
                  <div className="rounded border border-[#333] bg-[#252526] p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>🔌</span> Pin / Terminal Lead
                      </span>
                      <button
                        onClick={handleAddTerminalPin}
                        className="rounded bg-[#0e639c] px-2 py-0.5 text-xs text-white hover:bg-[#1177bb]"
                      >
                        + Add Pin
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-[#888]">Start X, Y</label>
                        <div className="flex gap-1 mt-0.5">
                          <input
                            type="number"
                            step="0.5"
                            value={pinX}
                            onChange={(e) => setPinX(e.target.value)}
                            className="w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5"
                          />
                          <input
                            type="number"
                            step="0.5"
                            value={pinY}
                            onChange={(e) => setPinY(e.target.value)}
                            className="w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">Length & Dir</label>
                        <div className="flex gap-1 mt-0.5">
                          <input
                            type="number"
                            step="0.5"
                            value={pinLen}
                            onChange={(e) => setPinLen(e.target.value)}
                            className="w-14 rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5"
                          />
                          <select
                            value={pinDir}
                            onChange={(e) => setPinDir(e.target.value as any)}
                            className="flex-1 rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5 text-xs"
                          >
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                            <option value="up">Up</option>
                            <option value="down">Down</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#888]">Port Label</label>
                      <input
                        type="text"
                        value={pinLabel}
                        onChange={(e) => setPinLabel(e.target.value)}
                        placeholder="e.g. IN, OUT, VCC, GND"
                        className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-2 py-0.5 text-xs"
                      />
                    </div>
                  </div>

                  {/* Rectangle / Box Tool */}
                  <div className="rounded border border-[#333] bg-[#252526] p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>▭</span> Box / Body Outline
                      </span>
                      <button
                        onClick={handleAddBox}
                        className="rounded bg-[#0e639c] px-2 py-0.5 text-xs text-white hover:bg-[#1177bb]"
                      >
                        + Add Box
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-xs">
                      <div>
                        <label className="text-[10px] text-[#888]">X</label>
                        <input
                          type="number"
                          step="0.5"
                          value={boxX}
                          onChange={(e) => setBoxX(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">Y</label>
                        <input
                          type="number"
                          step="0.5"
                          value={boxY}
                          onChange={(e) => setBoxY(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">Width</label>
                        <input
                          type="number"
                          step="0.5"
                          value={boxW}
                          onChange={(e) => setBoxW(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">Height</label>
                        <input
                          type="number"
                          step="0.5"
                          value={boxH}
                          onChange={(e) => setBoxH(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Line Tool */}
                  <div className="rounded border border-[#333] bg-[#252526] p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>📏</span> Single Line
                      </span>
                      <button
                        onClick={handleAddLine}
                        className="rounded bg-[#0e639c] px-2 py-0.5 text-xs text-white hover:bg-[#1177bb]"
                      >
                        + Add Line
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-xs">
                      <div>
                        <label className="text-[10px] text-[#888]">X1</label>
                        <input
                          type="number"
                          step="0.5"
                          value={lineX1}
                          onChange={(e) => setLineX1(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">Y1</label>
                        <input
                          type="number"
                          step="0.5"
                          value={lineY1}
                          onChange={(e) => setLineY1(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">X2</label>
                        <input
                          type="number"
                          step="0.5"
                          value={lineX2}
                          onChange={(e) => setLineX2(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">Y2</label>
                        <input
                          type="number"
                          step="0.5"
                          value={lineY2}
                          onChange={(e) => setLineY2(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Circle Tool */}
                  <div className="rounded border border-[#333] bg-[#252526] p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>⭕</span> Circle
                      </span>
                      <button
                        onClick={handleAddCircle}
                        className="rounded bg-[#0e639c] px-2 py-0.5 text-xs text-white hover:bg-[#1177bb]"
                      >
                        + Add Circle
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      <div>
                        <label className="text-[10px] text-[#888]">Center X</label>
                        <input
                          type="number"
                          step="0.5"
                          value={circleCx}
                          onChange={(e) => setCircleCx(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">Center Y</label>
                        <input
                          type="number"
                          step="0.5"
                          value={circleCy}
                          onChange={(e) => setCircleCy(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">Radius</label>
                        <input
                          type="number"
                          step="0.25"
                          value={circleR}
                          onChange={(e) => setCircleR(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Arc Tool */}
                  <div className="rounded border border-[#333] bg-[#252526] p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>⌒</span> Arc
                      </span>
                      <button
                        onClick={handleAddArc}
                        className="rounded bg-[#0e639c] px-2 py-0.5 text-xs text-white hover:bg-[#1177bb]"
                      >
                        + Add Arc
                      </button>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 text-xs">
                      <div>
                        <label className="text-[10px] text-[#888]">Center X</label>
                        <input
                          type="number"
                          step="0.5"
                          value={arcCx}
                          onChange={(e) => setArcCx(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">Center Y</label>
                        <input
                          type="number"
                          step="0.5"
                          value={arcCy}
                          onChange={(e) => setArcCy(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">Radius</label>
                        <input
                          type="number"
                          step="0.25"
                          value={arcR}
                          onChange={(e) => setArcR(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">Start °</label>
                        <input
                          type="number"
                          step="15"
                          value={arcA1}
                          onChange={(e) => setArcA1(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">End °</label>
                        <input
                          type="number"
                          step="15"
                          value={arcA2}
                          onChange={(e) => setArcA2(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Text Tool */}
                  <div className="rounded border border-[#333] bg-[#252526] p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>🔤</span> Text Label
                      </span>
                      <button
                        onClick={handleAddText}
                        className="rounded bg-[#0e639c] px-2 py-0.5 text-xs text-white hover:bg-[#1177bb]"
                      >
                        + Add Text
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-xs">
                      <div className="col-span-4">
                        <label className="text-[10px] text-[#888]">Label Text</label>
                        <input
                          type="text"
                          value={textStr}
                          onChange={(e) => setTextStr(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-2 py-0.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">X</label>
                        <input
                          type="number"
                          step="0.5"
                          value={textX}
                          onChange={(e) => setTextX(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">Y</label>
                        <input
                          type="number"
                          step="0.5"
                          value={textY}
                          onChange={(e) => setTextY(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">Height</label>
                        <input
                          type="number"
                          step="0.1"
                          value={textH}
                          onChange={(e) => setTextH(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">Rot (°)</label>
                        <input
                          type="number"
                          step="15"
                          value={textRot}
                          onChange={(e) => setTextRot(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Fill Box Tool */}
                  <div className="rounded border border-[#333] bg-[#252526] p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>🎨</span> Fill / Hatch Box
                      </span>
                      <button
                        onClick={handleAddFillBox}
                        className="rounded bg-[#0e639c] px-2 py-0.5 text-xs text-white hover:bg-[#1177bb]"
                      >
                        + Add Fill
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-xs">
                      <div>
                        <label className="text-[10px] text-[#888]">W</label>
                        <input
                          type="number"
                          step="0.5"
                          value={fillW}
                          onChange={(e) => setFillW(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">H</label>
                        <input
                          type="number"
                          step="0.5"
                          value={fillH}
                          onChange={(e) => setFillH(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">Opacity</label>
                        <input
                          type="number"
                          step="0.05"
                          value={fillOpacity}
                          onChange={(e) => setFillOpacity(e.target.value)}
                          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888]">Color</label>
                        <input
                          type="color"
                          value={fillColor}
                          onChange={(e) => setFillColor(e.target.value)}
                          className="mt-0.5 h-6 w-full rounded border border-[#3c3c3c] bg-[#141414] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: Lines List */}
              {activeTab === 'lines' && (() => {
                const LINES_PAGE_SIZE = 50;
                const totalLinesPages = Math.max(1, Math.ceil(currentBlock.lines.length / LINES_PAGE_SIZE));
                const currentLinesPage = Math.min(linesPage, totalLinesPages);
                const pagedLines = currentBlock.lines.slice(
                  (currentLinesPage - 1) * LINES_PAGE_SIZE,
                  currentLinesPage * LINES_PAGE_SIZE,
                );

                return (
                  <div className="space-y-2">
                    {totalLinesPages > 1 && (
                      <div className="flex items-center justify-between text-xs text-[#aaa] bg-[#252526] px-2.5 py-1 rounded border border-[#333]">
                        <button
                          onClick={() => setLinesPage((p) => Math.max(1, p - 1))}
                          disabled={currentLinesPage <= 1}
                          className="px-2 py-0.5 rounded bg-[#333] hover:bg-[#444] disabled:opacity-30 text-[11px]"
                        >
                          ‹ Prev
                        </button>
                        <span className="font-mono text-[10px] text-[#f4902c]">
                          Lines {(currentLinesPage - 1) * LINES_PAGE_SIZE + 1}–{Math.min(currentLinesPage * LINES_PAGE_SIZE, currentBlock.lines.length)} of {currentBlock.lines.length}
                        </span>
                        <button
                          onClick={() => setLinesPage((p) => Math.min(totalLinesPages, p + 1))}
                          disabled={currentLinesPage >= totalLinesPages}
                          className="px-2 py-0.5 rounded bg-[#333] hover:bg-[#444] disabled:opacity-30 text-[11px]"
                        >
                          Next ›
                        </button>
                      </div>
                    )}
                    {currentBlock.lines.length === 0 ? (
                      <p className="text-center text-xs text-[#666] py-6">No lines in this block.</p>
                    ) : (
                      pagedLines.map((line, pIdx) => {
                        const idx = (currentLinesPage - 1) * LINES_PAGE_SIZE + pIdx;
                        return (
                          <div
                            key={idx}
                            className="rounded border border-[#333] bg-[#252526] p-2 flex items-center justify-between text-xs"
                          >
                            <div className="grid grid-cols-4 gap-1 text-[11px] font-mono">
                              <span>
                                X1: <input
                                  type="number"
                                  step="0.25"
                                  value={line.x1}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const updated = [...currentBlock.lines];
                                    updated[idx] = { ...line, x1: val };
                                    setCurrentBlock({ ...currentBlock, lines: updated });
                                  }}
                                  className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                                />
                              </span>
                              <span>
                                Y1: <input
                                  type="number"
                                  step="0.25"
                                  value={line.y1}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const updated = [...currentBlock.lines];
                                    updated[idx] = { ...line, y1: val };
                                    setCurrentBlock({ ...currentBlock, lines: updated });
                                  }}
                                  className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                                />
                              </span>
                              <span>
                                X2: <input
                                  type="number"
                                  step="0.25"
                                  value={line.x2}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const updated = [...currentBlock.lines];
                                    updated[idx] = { ...line, x2: val };
                                    setCurrentBlock({ ...currentBlock, lines: updated });
                                  }}
                                  className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                                />
                              </span>
                              <span>
                                Y2: <input
                                  type="number"
                                  step="0.25"
                                  value={line.y2}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const updated = [...currentBlock.lines];
                                    updated[idx] = { ...line, y2: val };
                                    setCurrentBlock({ ...currentBlock, lines: updated });
                                  }}
                                  className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                                />
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const updated = currentBlock.lines.filter((_, i) => i !== idx);
                                setCurrentBlock({ ...currentBlock, lines: updated });
                              }}
                              className="ml-2 text-red-400 hover:text-red-200"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })()}

              {/* TAB: Circles List */}
              {activeTab === 'circles' && (() => {
                const CIRCLES_PAGE_SIZE = 50;
                const totalCirclesPages = Math.max(1, Math.ceil(currentBlock.circles.length / CIRCLES_PAGE_SIZE));
                const currentCirclesPage = Math.min(circlesPage, totalCirclesPages);
                const pagedCircles = currentBlock.circles.slice(
                  (currentCirclesPage - 1) * CIRCLES_PAGE_SIZE,
                  currentCirclesPage * CIRCLES_PAGE_SIZE,
                );

                return (
                  <div className="space-y-2">
                    {totalCirclesPages > 1 && (
                      <div className="flex items-center justify-between text-xs text-[#aaa] bg-[#252526] px-2.5 py-1 rounded border border-[#333]">
                        <button
                          onClick={() => setCirclesPage((p) => Math.max(1, p - 1))}
                          disabled={currentCirclesPage <= 1}
                          className="px-2 py-0.5 rounded bg-[#333] hover:bg-[#444] disabled:opacity-30 text-[11px]"
                        >
                          ‹ Prev
                        </button>
                        <span className="font-mono text-[10px] text-[#f4902c]">
                          Circles {(currentCirclesPage - 1) * CIRCLES_PAGE_SIZE + 1}–{Math.min(currentCirclesPage * CIRCLES_PAGE_SIZE, currentBlock.circles.length)} of {currentBlock.circles.length}
                        </span>
                        <button
                          onClick={() => setCirclesPage((p) => Math.min(totalCirclesPages, p + 1))}
                          disabled={currentCirclesPage >= totalCirclesPages}
                          className="px-2 py-0.5 rounded bg-[#333] hover:bg-[#444] disabled:opacity-30 text-[11px]"
                        >
                          Next ›
                        </button>
                      </div>
                    )}
                    {currentBlock.circles.length === 0 ? (
                      <p className="text-center text-xs text-[#666] py-6">No circles in this block.</p>
                    ) : (
                      pagedCircles.map((c, pIdx) => {
                        const idx = (currentCirclesPage - 1) * CIRCLES_PAGE_SIZE + pIdx;
                        return (
                          <div
                            key={idx}
                            className="rounded border border-[#333] bg-[#252526] p-2 flex items-center justify-between text-xs"
                          >
                            <div className="flex gap-2 text-[11px] font-mono">
                              <span>
                                CX: <input
                                  type="number"
                                  step="0.25"
                                  value={c.cx}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const updated = [...currentBlock.circles];
                                    updated[idx] = { ...c, cx: val };
                                    setCurrentBlock({ ...currentBlock, circles: updated });
                                  }}
                                  className="w-14 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                                />
                              </span>
                              <span>
                                CY: <input
                                  type="number"
                                  step="0.25"
                                  value={c.cy}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const updated = [...currentBlock.circles];
                                    updated[idx] = { ...c, cy: val };
                                    setCurrentBlock({ ...currentBlock, circles: updated });
                                  }}
                                  className="w-14 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                                />
                              </span>
                              <span>
                                R: <input
                                  type="number"
                                  step="0.1"
                                  value={c.r}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0.1;
                                    const updated = [...currentBlock.circles];
                                    updated[idx] = { ...c, r: val };
                                    setCurrentBlock({ ...currentBlock, circles: updated });
                                  }}
                                  className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                                />
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const updated = currentBlock.circles.filter((_, i) => i !== idx);
                                setCurrentBlock({ ...currentBlock, circles: updated });
                              }}
                              className="ml-2 text-red-400 hover:text-red-200"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })()}

              {/* TAB: Arcs List */}
              {activeTab === 'arcs' && (() => {
                const ARCS_PAGE_SIZE = 50;
                const totalArcsPages = Math.max(1, Math.ceil(currentBlock.arcs.length / ARCS_PAGE_SIZE));
                const currentArcsPage = Math.min(arcsPage, totalArcsPages);
                const pagedArcs = currentBlock.arcs.slice(
                  (currentArcsPage - 1) * ARCS_PAGE_SIZE,
                  currentArcsPage * ARCS_PAGE_SIZE,
                );

                return (
                  <div className="space-y-2">
                    {totalArcsPages > 1 && (
                      <div className="flex items-center justify-between text-xs text-[#aaa] bg-[#252526] px-2.5 py-1 rounded border border-[#333]">
                        <button
                          onClick={() => setArcsPage((p) => Math.max(1, p - 1))}
                          disabled={currentArcsPage <= 1}
                          className="px-2 py-0.5 rounded bg-[#333] hover:bg-[#444] disabled:opacity-30 text-[11px]"
                        >
                          ‹ Prev
                        </button>
                        <span className="font-mono text-[10px] text-[#f4902c]">
                          Arcs {(currentArcsPage - 1) * ARCS_PAGE_SIZE + 1}–{Math.min(currentArcsPage * ARCS_PAGE_SIZE, currentBlock.arcs.length)} of {currentBlock.arcs.length}
                        </span>
                        <button
                          onClick={() => setArcsPage((p) => Math.min(totalArcsPages, p + 1))}
                          disabled={currentArcsPage >= totalArcsPages}
                          className="px-2 py-0.5 rounded bg-[#333] hover:bg-[#444] disabled:opacity-30 text-[11px]"
                        >
                          Next ›
                        </button>
                      </div>
                    )}
                    {currentBlock.arcs.length === 0 ? (
                      <p className="text-center text-xs text-[#666] py-6">No arcs in this block.</p>
                    ) : (
                      pagedArcs.map((a, pIdx) => {
                        const idx = (currentArcsPage - 1) * ARCS_PAGE_SIZE + pIdx;
                        return (
                          <div
                            key={idx}
                            className="rounded border border-[#333] bg-[#252526] p-2 flex items-center justify-between text-xs"
                          >
                            <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                              <span>
                                CX: <input
                                  type="number"
                                  step="0.25"
                                  value={a.cx}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const updated = [...currentBlock.arcs];
                                    updated[idx] = { ...a, cx: val };
                                    setCurrentBlock({ ...currentBlock, arcs: updated });
                                  }}
                                  className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                                />
                              </span>
                              <span>
                                CY: <input
                                  type="number"
                                  step="0.25"
                                  value={a.cy}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const updated = [...currentBlock.arcs];
                                    updated[idx] = { ...a, cy: val };
                                    setCurrentBlock({ ...currentBlock, arcs: updated });
                                  }}
                                  className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                                />
                              </span>
                              <span>
                                R: <input
                                  type="number"
                                  step="0.1"
                                  value={a.r}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0.1;
                                    const updated = [...currentBlock.arcs];
                                    updated[idx] = { ...a, r: val };
                                    setCurrentBlock({ ...currentBlock, arcs: updated });
                                  }}
                                  className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                                />
                              </span>
                              <span>
                                A1: <input
                                  type="number"
                                  step="15"
                                  value={a.a1}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const updated = [...currentBlock.arcs];
                                    updated[idx] = { ...a, a1: val };
                                    setCurrentBlock({ ...currentBlock, arcs: updated });
                                  }}
                                  className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                                />
                              </span>
                              <span>
                                A2: <input
                                  type="number"
                                  step="15"
                                  value={a.a2}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const updated = [...currentBlock.arcs];
                                    updated[idx] = { ...a, a2: val };
                                    setCurrentBlock({ ...currentBlock, arcs: updated });
                                  }}
                                  className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1"
                                />
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const updated = currentBlock.arcs.filter((_, i) => i !== idx);
                                setCurrentBlock({ ...currentBlock, arcs: updated });
                              }}
                              className="ml-2 text-red-400 hover:text-red-200"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })()}

              {/* TAB: Texts List */}
              {activeTab === 'texts' && (() => {
                const allTexts = currentBlock.texts ?? [];
                const TEXTS_PAGE_SIZE = 50;
                const totalTextsPages = Math.max(1, Math.ceil(allTexts.length / TEXTS_PAGE_SIZE));
                const currentTextsPage = Math.min(textsPage, totalTextsPages);
                const pagedTexts = allTexts.slice(
                  (currentTextsPage - 1) * TEXTS_PAGE_SIZE,
                  currentTextsPage * TEXTS_PAGE_SIZE,
                );

                return (
                  <div className="space-y-2">
                    {totalTextsPages > 1 && (
                      <div className="flex items-center justify-between text-xs text-[#aaa] bg-[#252526] px-2.5 py-1 rounded border border-[#333]">
                        <button
                          onClick={() => setTextsPage((p) => Math.max(1, p - 1))}
                          disabled={currentTextsPage <= 1}
                          className="px-2 py-0.5 rounded bg-[#333] hover:bg-[#444] disabled:opacity-30 text-[11px]"
                        >
                          ‹ Prev
                        </button>
                        <span className="font-mono text-[10px] text-[#f4902c]">
                          Texts {(currentTextsPage - 1) * TEXTS_PAGE_SIZE + 1}–{Math.min(currentTextsPage * TEXTS_PAGE_SIZE, allTexts.length)} of {allTexts.length}
                        </span>
                        <button
                          onClick={() => setTextsPage((p) => Math.min(totalTextsPages, p + 1))}
                          disabled={currentTextsPage >= totalTextsPages}
                          className="px-2 py-0.5 rounded bg-[#333] hover:bg-[#444] disabled:opacity-30 text-[11px]"
                        >
                          Next ›
                        </button>
                      </div>
                    )}
                    {allTexts.length === 0 ? (
                      <p className="text-center text-xs text-[#666] py-6">No text entities in this block.</p>
                    ) : (
                      pagedTexts.map((t, pIdx) => {
                        const idx = (currentTextsPage - 1) * TEXTS_PAGE_SIZE + pIdx;
                        return (
                          <div
                            key={idx}
                            className="rounded border border-[#333] bg-[#252526] p-2 flex items-center justify-between text-xs"
                          >
                            <div className="flex-1 space-y-1">
                              <input
                                type="text"
                                value={t.text}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = [...(currentBlock.texts ?? [])];
                                  updated[idx] = { ...t, text: val };
                                  setCurrentBlock({ ...currentBlock, texts: updated });
                                }}
                                className="w-full bg-[#141414] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white"
                              />
                              <div className="flex gap-2 text-[10px] text-[#888] font-mono">
                                <span>
                                  X: <input
                                    type="number"
                                    step="0.25"
                                    value={t.x}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      const updated = [...(currentBlock.texts ?? [])];
                                      updated[idx] = { ...t, x: val };
                                      setCurrentBlock({ ...currentBlock, texts: updated });
                                    }}
                                    className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1 text-white"
                                  />
                                </span>
                                <span>
                                  Y: <input
                                    type="number"
                                    step="0.25"
                                    value={t.y}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      const updated = [...(currentBlock.texts ?? [])];
                                      updated[idx] = { ...t, y: val };
                                      setCurrentBlock({ ...currentBlock, texts: updated });
                                    }}
                                    className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1 text-white"
                                  />
                                </span>
                                <span>
                                  H: <input
                                    type="number"
                                    step="0.1"
                                    value={t.height}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0.1;
                                      const updated = [...(currentBlock.texts ?? [])];
                                      updated[idx] = { ...t, height: val };
                                      setCurrentBlock({ ...currentBlock, texts: updated });
                                    }}
                                    className="w-12 bg-[#141414] border border-[#3c3c3c] rounded px-1 text-white"
                                  />
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const updated = (currentBlock.texts ?? []).filter((_, i) => i !== idx);
                                setCurrentBlock({ ...currentBlock, texts: updated });
                              }}
                              className="ml-2 text-red-400 hover:text-red-200"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })()}

              {/* TAB: Attributes & UUID */}
              {activeTab === 'attributes' && (
                <div className="space-y-4">
                  {selectedInstance ? (
                    <div className="space-y-4">
                      {/* Instance Header Info */}
                      <div className="rounded border border-[#333] bg-[#252526] p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>🏷️</span> Placed Instance
                          </span>
                          <span className="rounded bg-[#0e639c]/30 px-2 py-0.5 text-[10px] font-mono text-[#4fc1ff] border border-[#0e639c]/40">
                            ID: #{selectedInstance.id}
                          </span>
                        </div>
                        <div className="text-xs text-[#aaa]">
                          Block: <span className="font-mono font-bold text-[#f4902c]">{selectedInstance.blockName}</span>
                        </div>
                        <div className="text-xs text-[#aaa]">
                          Layer: <span className="font-mono text-white">{selectedInstance.layerId}</span>
                        </div>
                      </div>

                      {/* UUID Section */}
                      <div className="rounded border border-[#333] bg-[#252526] p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">
                            Instance UUID
                          </label>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleCopyUuid(selectedInstance.uuid || '')}
                              className="rounded bg-[#2d2d2d] hover:bg-[#383838] px-2 py-0.5 text-[10px] text-[#ccc] border border-[#444] transition-colors"
                              title="Copy UUID to clipboard"
                            >
                              {copiedUuid ? '✓ Copied' : '📋 Copy'}
                            </button>
                            <button
                              onClick={handleRegenerateInstanceUuid}
                              className="rounded bg-[#2d2d2d] hover:bg-[#383838] px-2 py-0.5 text-[10px] text-[#ccc] border border-[#444] transition-colors"
                              title="Regenerate a new UUID for this instance"
                            >
                              🔄 Regenerate
                            </button>
                          </div>
                        </div>
                        <div className="p-2 rounded bg-[#141414] border border-[#3c3c3c] font-mono text-xs text-[#388bfd] break-all select-all">
                          {selectedInstance.uuid || 'No UUID assigned'}
                        </div>
                      </div>

                      {/* Placement Transforms */}
                      <div className="rounded border border-[#333] bg-[#252526] p-3 space-y-2">
                        <span className="text-[10px] font-semibold text-[#888] uppercase tracking-wider block">
                          Placement Transforms
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] text-[#888]">Pos X</label>
                            <input
                              type="number"
                              step="0.5"
                              value={selectedInstance.x}
                              onChange={(e) =>
                                handleUpdateInstanceField('x', parseFloat(e.target.value) || 0)
                              }
                              className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 font-mono text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#888]">Pos Y</label>
                            <input
                              type="number"
                              step="0.5"
                              value={selectedInstance.y}
                              onChange={(e) =>
                                handleUpdateInstanceField('y', parseFloat(e.target.value) || 0)
                              }
                              className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 font-mono text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#888]">Scale</label>
                            <input
                              type="number"
                              step="0.1"
                              value={selectedInstance.scale ?? 1}
                              onChange={(e) =>
                                handleUpdateInstanceField('scale', parseFloat(e.target.value) || 1)
                              }
                              className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 font-mono text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#888]">Rotation (°)</label>
                            <input
                              type="number"
                              step="15"
                              value={selectedInstance.rotation ?? 0}
                              onChange={(e) =>
                                handleUpdateInstanceField('rotation', parseFloat(e.target.value) || 0)
                              }
                              className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 font-mono text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Custom Attributes Table */}
                      <div className="rounded border border-[#333] bg-[#252526] p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>✨</span> Key-Value Attributes
                          </span>
                          <span className="text-[10px] text-[#888]">
                            {Object.keys(selectedInstance.attributes ?? {}).length} custom
                          </span>
                        </div>

                        {/* List of attributes */}
                        {Object.entries(selectedInstance.attributes ?? {}).length === 0 ? (
                          <p className="text-center text-xs text-[#666] py-3">
                            No attributes defined on this instance yet.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {Object.entries(selectedInstance.attributes ?? {}).map(([key, val]) => (
                              <div
                                key={key}
                                className="flex items-center gap-2 rounded bg-[#141414] border border-[#333] px-2 py-1 text-xs"
                              >
                                <span className="font-mono text-[#f4902c] font-semibold truncate w-1/3" title={key}>
                                  {key}:
                                </span>
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => {
                                    const nextVal = e.target.value;
                                    store.history.push(store.doc.snapshot());
                                    store.edit(() => {
                                      const inst = store.doc.blockInstances.get(selectedInstance.id);
                                      if (inst) {
                                        inst.attributes = { ...(inst.attributes ?? {}), [key]: nextVal };
                                      }
                                      return true;
                                    });
                                    setSelectedInstance((prev) =>
                                      prev
                                        ? { ...prev, attributes: { ...(prev.attributes ?? {}), [key]: nextVal } }
                                        : null,
                                    );
                                  }}
                                  className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white font-mono text-[11px]"
                                />
                                <button
                                  onClick={() => handleDeleteInstanceAttribute(key)}
                                  className="text-red-400 hover:text-red-200 px-1"
                                  title="Delete attribute"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Attribute Row */}
                        <div className="border-t border-[#333] pt-2 space-y-1.5">
                          <label className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">
                            Add New Attribute
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="Key (e.g. PART_NO)"
                              value={newAttrKey}
                              onChange={(e) => setNewAttrKey(e.target.value)}
                              className="w-1/2 rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-1 text-xs text-white"
                            />
                            <input
                              type="text"
                              placeholder="Value"
                              value={newAttrVal}
                              onChange={(e) => setNewAttrVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddInstanceAttribute();
                              }}
                              className="flex-1 rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-1 text-xs text-white"
                            />
                            <button
                              onClick={handleAddInstanceAttribute}
                              className="rounded bg-[#0e639c] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#1177bb] transition-colors"
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded border border-[#333] bg-[#252526] p-4 text-center space-y-2">
                      <span className="text-2xl">📦</span>
                      <h4 className="text-xs font-bold text-white">Block Definition Mode</h4>
                      <p className="text-[11px] text-[#888] leading-relaxed">
                        Select a placed instance from the left sidebar ("Instances" tab) to inspect and edit its unique UUID and custom key-value attributes.
                      </p>
                      <p className="text-[11px] text-[#888] leading-relaxed">
                        Currently viewing definition <span className="font-mono text-[#f4902c] font-bold">{currentBlock.name}</span>.
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={handleInsertOnSheet}
                          className="rounded bg-[#0e639c] px-3 py-1.5 text-xs text-white hover:bg-[#1177bb] transition-colors"
                        >
                          + Place Instance on Canvas
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="border-t border-[#333] bg-[#252526] p-3 flex items-center justify-between">
              <button
                onClick={handleInsertOnSheet}
                className="rounded border border-[#444] bg-[#2d2d2d] px-3 py-1.5 text-xs text-white hover:bg-[#383838] transition-colors"
                title="Place an instance of this block onto the main canvas"
              >
                + Insert on Sheet
              </button>
              <button
                onClick={handleSaveBlock}
                className="rounded bg-[#2ea043] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#3fb950] transition-colors shadow-sm"
              >
                💾 Save Block Definition
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
