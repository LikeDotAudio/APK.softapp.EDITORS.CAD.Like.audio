// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Layer, Point } from '../../core/types';
import type { Scene } from '../Scene';

export function drawBlockInstances(
  scene: Scene,
  options?: {
    layers?: ReadonlyMap<string, Layer>;
    selectedIds?: ReadonlySet<number>;
  },
): void {
  const { ctx, view, doc } = scene;
  if (!doc.blockInstances || doc.blockInstances.size === 0) return;

  ctx.save();

  for (const inst of doc.blockInstances.values()) {
    const layer = options?.layers?.get(inst.layerId);
    if (layer && !layer.visible) continue;

    const def = doc.blocks.get(inst.blockName);
    if (!def) continue;

    const s = inst.scale ?? 1;
    const rad = ((inst.rotation ?? 0) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const transform = (p: Point): Point => {
      const wx = inst.x + s * (p.x * cos - p.y * sin);
      const wy = inst.y + s * (p.x * sin + p.y * cos);
      return view.toScreen(wx, wy);
    };

    const isSelected = options?.selectedIds?.has(inst.id);
    const color = isSelected ? '#38bdf8' : (layer?.color || '#ffffff');

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = isSelected ? 2 : 1.4;

    // Draw lines
    for (const l of def.lines) {
      const p1 = transform({ x: l.x1, y: l.y1 });
      const p2 = transform({ x: l.x2, y: l.y2 });
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Draw circles
    for (const c of def.circles) {
      const cp = transform({ x: c.cx, y: c.cy });
      const scrRadius = c.r * s * view.zoom;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, scrRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw arcs
    for (const a of def.arcs) {
      const cp = transform({ x: a.cx, y: a.cy });
      const scrRadius = a.r * s * view.zoom;
      // In CAD: CCW angle from a1 to a2 in degrees. Screen y is flipped.
      const rot = (inst.rotation ?? 0);
      const startAngleRad = -(((a.a1 + rot) * Math.PI) / 180);
      const endAngleRad = -(((a.a2 + rot) * Math.PI) / 180);
      ctx.beginPath();
      // Canvas arc with counterclockwise = true
      ctx.arc(cp.x, cp.y, scrRadius, startAngleRad, endAngleRad, true);
      ctx.stroke();
    }

    // Draw texts in block
    if (def.texts) {
      for (const t of def.texts) {
        const tp = transform({ x: t.x, y: t.y });
        let pxH: number;
        if (scene.fixedTextSize ?? true) {
          pxH = 11;
        } else {
          pxH = t.height * s * view.zoom;
          if (pxH < 2.5) continue;
        }
        ctx.save();
        ctx.translate(tp.x, tp.y);
        ctx.rotate(-(((t.rotation ?? 0) + (inst.rotation ?? 0)) * Math.PI) / 180);
        ctx.font = `${Math.round(pxH)}px "JetBrains Mono", monospace, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(t.text, 0, 0);
        ctx.restore();
      }
    }

    // Draw fills in block
    if (def.fills) {
      for (const f of def.fills) {
        if (f.points.length < 3) continue;
        const screenPts = f.points.map(transform);
        ctx.save();
        ctx.beginPath();
        screenPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.closePath();
        ctx.globalAlpha = f.opacity ?? 0.35;
        ctx.fill();
        ctx.restore();
      }
    }

    // Selection box around block insertion point
    if (isSelected) {
      const origin = view.toScreen(inst.x, inst.y);
      ctx.strokeStyle = '#f4902c';
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(origin.x - 6, origin.y - 6, 12, 12);
    }

    ctx.restore();
  }

  ctx.restore();
}
