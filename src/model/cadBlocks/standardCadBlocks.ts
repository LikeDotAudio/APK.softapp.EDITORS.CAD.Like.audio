// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CadBlockDefinition } from '../../core/types';

export const STANDARD_CAD_BLOCKS: CadBlockDefinition[] = [
  {
    name: 'RESISTOR',
    description: 'Schematic 2-terminal resistor symbol',
    basePoint: { x: 0, y: 0 },
    lines: [
      { x1: -1.0, y1: 0, x2: -0.6, y2: 0 },
      { x1: -0.6, y1: 0, x2: -0.4, y2: 0.25 },
      { x1: -0.4, y1: 0.25, x2: -0.2, y2: -0.25 },
      { x1: -0.2, y1: -0.25, x2: 0, y2: 0.25 },
      { x1: 0, y1: 0.25, x2: 0.2, y2: -0.25 },
      { x1: 0.2, y1: -0.25, x2: 0.4, y2: 0.25 },
      { x1: 0.4, y1: 0.25, x2: 0.6, y2: 0 },
      { x1: 0.6, y1: 0, x2: 1.0, y2: 0 },
    ],
    arcs: [],
    circles: [],
    texts: [{ text: 'R', x: -0.1, y: 0.35, height: 0.25 }],
  },
  {
    name: 'CAPACITOR',
    description: 'Schematic capacitor symbol',
    basePoint: { x: 0, y: 0 },
    lines: [
      { x1: -0.8, y1: 0, x2: -0.15, y2: 0 },
      { x1: -0.15, y1: -0.4, x2: -0.15, y2: 0.4 },
      { x1: 0.15, y1: -0.4, x2: 0.15, y2: 0.4 },
      { x1: 0.15, y1: 0, x2: 0.8, y2: 0 },
    ],
    arcs: [],
    circles: [],
    texts: [{ text: 'C', x: -0.1, y: 0.48, height: 0.25 }],
  },
  {
    name: 'GROUND',
    description: 'Earth / signal ground symbol',
    basePoint: { x: 0, y: 0 },
    lines: [
      { x1: 0, y1: 0.4, x2: 0, y2: 0 },
      { x1: -0.4, y1: 0, x2: 0.4, y2: 0 },
      { x1: -0.25, y1: -0.15, x2: 0.25, y2: -0.15 },
      { x1: -0.1, y1: -0.3, x2: 0.1, y2: -0.3 },
    ],
    arcs: [],
    circles: [],
  },
  {
    name: 'DIODE',
    description: 'Semiconductor diode symbol',
    basePoint: { x: 0, y: 0 },
    lines: [
      { x1: -0.8, y1: 0, x2: -0.3, y2: 0 },
      { x1: -0.3, y1: -0.35, x2: -0.3, y2: 0.35 },
      { x1: -0.3, y1: 0.35, x2: 0.3, y2: 0 },
      { x1: 0.3, y1: 0, x2: -0.3, y2: -0.35 },
      { x1: 0.3, y1: -0.35, x2: 0.3, y2: 0.35 },
      { x1: 0.3, y1: 0, x2: 0.8, y2: 0 },
    ],
    arcs: [],
    circles: [],
  },
  {
    name: 'OPAMP',
    description: 'Operational amplifier symbol',
    basePoint: { x: 0, y: 0 },
    lines: [
      // Triangle
      { x1: -0.8, y1: -0.8, x2: -0.8, y2: 0.8 },
      { x1: -0.8, y1: 0.8, x2: 0.8, y2: 0 },
      { x1: 0.8, y1: 0, x2: -0.8, y2: -0.8 },
      // Input leads
      { x1: -1.3, y1: 0.4, x2: -0.8, y2: 0.4 },
      { x1: -1.3, y1: -0.4, x2: -0.8, y2: -0.4 },
      // Output lead
      { x1: 0.8, y1: 0, x2: 1.3, y2: 0 },
    ],
    arcs: [],
    circles: [],
    texts: [
      { text: '+', x: -0.7, y: 0.3, height: 0.2 },
      { text: '−', x: -0.7, y: -0.45, height: 0.2 },
    ],
  },
  {
    name: 'TITLE_BLOCK',
    description: 'CAD title and revision block',
    basePoint: { x: 0, y: 0 },
    lines: [
      { x1: 0, y1: 0, x2: 4, y2: 0 },
      { x1: 4, y1: 0, x2: 4, y2: 1.5 },
      { x1: 4, y1: 1.5, x2: 0, y2: 1.5 },
      { x1: 0, y1: 1.5, x2: 0, y2: 0 },
      { x1: 0, y1: 0.8, x2: 4, y2: 0.8 },
      { x1: 2.2, y1: 0, x2: 2.2, y2: 0.8 },
    ],
    arcs: [],
    circles: [],
    texts: [
      { text: 'TITLE: CAD.LIKE.AUDIO', x: 0.15, y: 1.05, height: 0.22 },
      { text: 'REV: 1.0', x: 0.15, y: 0.3, height: 0.18 },
      { text: 'SCALE: 1:1', x: 2.35, y: 0.3, height: 0.18 },
    ],
  },
];
