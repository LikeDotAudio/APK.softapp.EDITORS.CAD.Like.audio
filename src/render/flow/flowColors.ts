// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { PortSide } from '../../core/types';

/**
 * One colour per side, so the convention is readable without labels: signal
 * runs blue across the horizontal, control is amber above and power is red
 * below. A reader who learns the four colours never has to trace a wire to
 * find out what an edge of a block is for.
 */
export const SIDE_COLOR: Record<PortSide, string> = {
  input: '#38bdf8',
  output: '#38bdf8',
  control: '#f59e0b',
  power: '#ef4444',
};

export const FLOW = {
  outline: '#9ca3af',
  outlineFill: 'rgba(148,163,184,0.08)',
  glyph: '#e5e7eb',
  refdes: '#f4902c',
  connector: '#22d3ee',
  connectorPending: '#facc15',
  portLabel: '#9ca3af',
} as const;

/**
 * The containers. One hue for every level, dimmed rather than recoloured,
 * because a group's colour has to say DEPTH and nothing else - a palette that
 * gave each group its own colour would be saying something about what is in it,
 * which the sheet has no way of knowing.
 *
 * `pending` is the drag in progress; it is the one that is allowed to be loud.
 */
export const GROUP = {
  border: '#f4902c',
  fill: 'rgba(244,144,44,0.05)',
  label: '#f4902c',
  collapsedFill: 'rgba(244,144,44,0.14)',
  count: '#9ca3af',
  pending: '#facc15',
  pendingFill: 'rgba(250,204,21,0.08)',
} as const;
