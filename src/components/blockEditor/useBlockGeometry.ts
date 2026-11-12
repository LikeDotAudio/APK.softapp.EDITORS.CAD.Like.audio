// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** The Block Editor's preview canvas: pan and zoom, world <-> screen, zoom to fit, the redraw, pointer and wheel
 *  handling (pan, zoom to the cursor, picking the base point) and keeping the canvas the size of its box.
 *  Called by useBlockEditor. */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CadBlockDefinition, Point } from '../../core/types';
import type { EditorStore } from '@state/EditorStore';

export function useBlockGeometry(
  store: EditorStore,
  currentBlock: CadBlockDefinition,
  setCurrentBlock: React.Dispatch<React.SetStateAction<CadBlockDefinition>>,
  pickingBasePoint: boolean,
  setPickingBasePoint: React.Dispatch<React.SetStateAction<boolean>>,
) {
  // Canvas Pan & Zoom state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState<number>(30); // pixels per world unit
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 }); // offset in pixels
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [hoverWorld, setHoverWorld] = useState<Point | null>(null);

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

  return {
    canvasRef, zoom, setZoom, pan, setPan, isPanning, setIsPanning, panStart, setPanStart, hoverWorld, setHoverWorld, worldToScreen, screenToWorld, handleZoomToFit, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel,
  };
}
