// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Tool } from './types';
import type { Scene } from '../render/Scene';

interface SymmetryState {
  isDragging: boolean;
  previewX: number | null;
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    {/* Center mirror line */}
    <line x1="8" y1="1" x2="8" y2="15" strokeDasharray="2 2" stroke="#38bdf8" />
    {/* Left object ◄ */}
    <polygon points="6,4 2,8 6,12" fill="#00f7ff" fillOpacity="0.4" stroke="#00f7ff" />
    {/* Right mirrored object ► */}
    <polygon points="10,4 14,8 10,12" fill="#00f7ff" fillOpacity="0.4" stroke="#00f7ff" />
  </svg>
);

export const symmetryTool: Tool<SymmetryState> = {
  id: 'symmetry',
  label: 'Mirror',
  shortcut: 'y',
  title:
    'Virtual Mirror & Symmetrical Mode (Y) — Click on canvas to place vertical mirror axis. All placed/drawn geometry reflects horizontally across the mirror.',
  hint: 'Click to place virtual mirror axis (X) · Symmetrical Mode active · CAD edge of mirror glows when selected',
  icon: Icon,
  cursor: 'col-resize',
  snaps: true,

  createState: () => ({
    isDragging: false,
    previewX: null,
  }),

  onPointerDown(state, input, api) {
    state.isDragging = true;
    state.previewX = input.world.x;
    api.setVirtualMirror(input.world.x, true, true);
  },

  onPointerMove(state, input, api) {
    state.previewX = input.world.x;
    api.setMeasurement(`Mirror Axis X = ${input.world.x.toFixed(3)} ${api.units}`);

    if (state.isDragging) {
      api.setVirtualMirror(input.world.x, true, true);
    }
  },

  onPointerUp(state, _input, api) {
    state.isDragging = false;
    api.setMeasurement(null);
  },

  drawPreview(state, scene: Scene) {
    if (state.previewX === null) return;
    const { ctx, view } = scene;
    const screenX = view.toScreen(state.previewX, 0).x;
    const height = ctx.canvas.height;

    ctx.save();
    ctx.shadowColor = '#00f7ff';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = '#00f7ff';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, height);
    ctx.stroke();

    const tag = `🪞 PLACE MIRROR: X = ${state.previewX.toFixed(2)}`;
    ctx.font = 'bold 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    const tw = ctx.measureText(tag).width;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#00f7ff';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.roundRect(screenX - (tw + 16) / 2, 24, tw + 16, 22, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00f7ff';
    ctx.fillText(tag, screenX - tw / 2, 38);
    ctx.restore();
  },
};
