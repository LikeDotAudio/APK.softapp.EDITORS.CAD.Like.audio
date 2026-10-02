// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CadBlockDefinition, Point } from '../../core/types';
import { useStore } from '../../state/useStore';
import { useUi } from '../../state/useUi';

interface BlockEditorModalProps {
  initialBlockName?: string;
  onClose: () => void;
}

type InspectorTab = 'lines' | 'circles' | 'arcs' | 'texts' | 'fills' | 'quickAdd';

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
    setPickingBasePoint(false);
  }, [store]);

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

  const filteredBlocks = blocksList.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(search.toLowerCase())),
  );

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

        {/* Main Work Area: Left Sidebar (Blocks Catalog) + Center (Interactive Preview) + Right (Inspector & Tools) */}
        <div className="flex flex-1 overflow-hidden">
          {/* 1. Left Catalog Sidebar */}
          <div className="w-56 border-r border-[#333] bg-[#1a1a1a] flex flex-col overflow-hidden">
            <div className="p-2 border-b border-[#333]">
              <input
                type="text"
                placeholder="Search blocks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded border border-[#3c3c3c] bg-[#141414] px-2 py-1 text-xs text-white"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
              {filteredBlocks.map((b) => {
                const active = b.name === selectedBlockName;
                return (
                  <button
                    key={b.name}
                    onClick={() => loadBlock(b.name)}
                    className={`w-full text-left rounded px-2.5 py-1.5 text-xs transition-colors flex items-center justify-between ${
                      active
                        ? 'bg-[#0e639c] text-white font-semibold'
                        : 'text-[#aaa] hover:bg-[#252526] hover:text-white'
                    }`}
                  >
                    <span className="font-mono truncate">{b.name}</span>
                    <span className="text-[10px] opacity-60">
                      {b.lines.length + b.circles.length + b.arcs.length} ent
                    </span>
                  </button>
                );
              })}
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
              {activeTab === 'lines' && (
                <div className="space-y-2">
                  {currentBlock.lines.length === 0 ? (
                    <p className="text-center text-xs text-[#666] py-6">No lines in this block.</p>
                  ) : (
                    currentBlock.lines.map((line, idx) => (
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
                    ))
                  )}
                </div>
              )}

              {/* TAB: Circles List */}
              {activeTab === 'circles' && (
                <div className="space-y-2">
                  {currentBlock.circles.length === 0 ? (
                    <p className="text-center text-xs text-[#666] py-6">No circles in this block.</p>
                  ) : (
                    currentBlock.circles.map((c, idx) => (
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
                    ))
                  )}
                </div>
              )}

              {/* TAB: Arcs List */}
              {activeTab === 'arcs' && (
                <div className="space-y-2">
                  {currentBlock.arcs.length === 0 ? (
                    <p className="text-center text-xs text-[#666] py-6">No arcs in this block.</p>
                  ) : (
                    currentBlock.arcs.map((a, idx) => (
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
                    ))
                  )}
                </div>
              )}

              {/* TAB: Texts List */}
              {activeTab === 'texts' && (
                <div className="space-y-2">
                  {(currentBlock.texts ?? []).length === 0 ? (
                    <p className="text-center text-xs text-[#666] py-6">No text entities in this block.</p>
                  ) : (
                    (currentBlock.texts ?? []).map((t, idx) => (
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
                    ))
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
