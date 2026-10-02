// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Tool } from './types';

interface TextState {
  currentText: string;
  height: number;
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 3h10M8 3v10M5.5 13h5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const textTool: Tool<TextState> = {
  id: 'text',
  label: 'Text',
  shortcut: 'x',
  title: 'Text (X) — Click to place text note, annotation or label.',
  hint: 'Click to place text · Type text in prompt · Double-click in Select tool to edit',
  icon: Icon,
  cursor: 'crosshair',
  snaps: true,

  createState: () => ({
    currentText: 'TEXT NOTE',
    height: 0.5,
  }),

  onPointerDown(state, input, api) {
    const textPrompt = window.prompt('Enter text note:', state.currentText);
    if (!textPrompt || textPrompt.trim() === '') return;
    state.currentText = textPrompt.trim();

    api.edit(() => {
      api.doc.addText(
        state.currentText,
        input.world.x,
        input.world.y,
        state.height,
        0,
        api.activeLayerId,
      );
      return true;
    });

    api.showHint(`Placed text: "${state.currentText}"`, 2500);
  },

  drawPreview(state, scene) {
    const { ctx, view, pointer } = scene;
    const s = view.toScreen(pointer.world.x, pointer.world.y);
    const pxHeight = Math.max(8, state.height * view.zoom);

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.font = `${Math.round(pxHeight)}px "JetBrains Mono", monospace, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#f4902c';
    ctx.globalAlpha = 0.75;
    ctx.fillText(state.currentText || 'TEXT', 0, 0);

    // Dotted bounding box
    const metrics = ctx.measureText(state.currentText || 'TEXT');
    ctx.strokeStyle = '#f4902c';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(0, -pxHeight, metrics.width, pxHeight);
    ctx.restore();
  },
};
