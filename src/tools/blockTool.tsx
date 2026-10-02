// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../core/types';
import type { Tool } from './types';

interface BlockState {
  currentBlockName: string;
  scale: number;
  rotation: number;
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="12" height="12" rx="1.5" />
    <path d="M5 8h6M8 5v6" />
  </svg>
);

export const blockTool: Tool<BlockState> = {
  id: 'block',
  label: 'Block',
  shortcut: 'k',
  title: 'Block Insert (K) — Click to insert a CAD block instance. Press R to rotate 90° before placing.',
  hint: 'Click to place block · Press R to rotate 90° · Select other blocks in the CAD Elements Editor',
  icon: Icon,
  cursor: 'copy',
  snaps: true,

  createState: () => ({
    currentBlockName: 'RESISTOR',
    scale: 1,
    rotation: 0,
  }),

  onPointerDown(state, input, api) {
    // If block doesn't exist, pick the first available block
    if (!api.doc.blocks.has(state.currentBlockName)) {
      const first = api.doc.blocks.keys().next().value;
      if (first) state.currentBlockName = first;
      else return;
    }

    api.edit(() => {
      api.doc.addBlockInstance(
        state.currentBlockName,
        input.world.x,
        input.world.y,
        state.scale,
        state.rotation,
        api.activeLayerId,
      );
      return true;
    });

    api.showHint(`Placed ${state.currentBlockName} block.`, 2000);
  },

  drawPreview(state, scene) {
    const { ctx, view, pointer, doc } = scene;
    let blockName = state.currentBlockName;
    let def = doc.blocks.get(blockName);
    if (!def) {
      const first = doc.blocks.keys().next().value;
      if (first) {
        blockName = first;
        def = doc.blocks.get(first);
      }
    }
    if (!def) return;

    const s = state.scale;
    const rad = ((state.rotation ?? 0) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const transform = (p: Point): Point => {
      const wx = pointer.world.x + s * (p.x * cos - p.y * sin);
      const wy = pointer.world.y + s * (p.x * sin + p.y * cos);
      return view.toScreen(wx, wy);
    };

    ctx.save();
    ctx.strokeStyle = '#f4902c';
    ctx.fillStyle = '#f4902c';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.8;

    for (const l of def.lines) {
      const p1 = transform({ x: l.x1, y: l.y1 });
      const p2 = transform({ x: l.x2, y: l.y2 });
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    for (const c of def.circles) {
      const cp = transform({ x: c.cx, y: c.cy });
      const scrRadius = c.r * s * view.zoom;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, scrRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const a of def.arcs) {
      const cp = transform({ x: a.cx, y: a.cy });
      const scrRadius = a.r * s * view.zoom;
      const rot = state.rotation;
      const startAngleRad = -(((a.a1 + rot) * Math.PI) / 180);
      const endAngleRad = -(((a.a2 + rot) * Math.PI) / 180);
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, scrRadius, startAngleRad, endAngleRad, true);
      ctx.stroke();
    }

    if (def.texts) {
      for (const t of def.texts) {
        const tp = transform({ x: t.x, y: t.y });
        const pxH = Math.max(8, t.height * s * view.zoom);
        ctx.save();
        ctx.translate(tp.x, tp.y);
        ctx.rotate(-(((t.rotation ?? 0) + state.rotation) * Math.PI) / 180);
        ctx.font = `${Math.round(pxH)}px "JetBrains Mono", monospace, sans-serif`;
        ctx.fillText(t.text, 0, 0);
        ctx.restore();
      }
    }

    // Origin indicator
    const origin = view.toScreen(pointer.world.x, pointer.world.y);
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  },
};
