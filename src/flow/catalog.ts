// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BlockDefinition } from '../core/types';

/**
 * THE FLOW SET.
 *
 * Flow is not one symbol, it is a set of them sharing one convention about
 * where a port may sit: top is control, bottom is power, left is input, right
 * is output. The convention is proved by the SECOND symbol, not the first,
 * which is why there are four here and why none of them special-cases a side.
 *
 * `flow.split` is the one that earns the `offset` rule: two ports on the same
 * edge, spread evenly because neither declares a position.
 *
 * Sizes are in drawing units - inches by default, which is the app's own
 * default unit - and a definition is authored at a readable size rather than
 * normalised, because a symbol that has to be scaled to be legible is a symbol
 * nobody places twice.
 */
export const FLOW_CATALOG: BlockDefinition[] = [
  {
    id: 'flow.source',
    name: 'FLOW_SOURCE',
    description: 'Where signal starts. Output only, on the right.',
    size: { w: 1.6, h: 1.0 },
    glyph: [
      [
        { x: -0.35, y: 0.3 },
        { x: 0.35, y: 0 },
        { x: -0.35, y: -0.3 },
        { x: -0.35, y: 0.3 },
      ],
    ],
    ports: [
      { id: 'OUT', side: 'output', label: 'out' },
      { id: 'CTL', side: 'control', label: 'ctl' },
      { id: 'PWR', side: 'power', label: 'pwr' },
    ],
  },
  {
    id: 'flow.process',
    name: 'FLOW_PROCESS',
    description: 'Something done to the signal on its way through.',
    size: { w: 1.6, h: 1.0 },
    glyph: [
      [
        { x: -0.45, y: 0 },
        { x: -0.15, y: 0 },
      ],
      [
        { x: -0.15, y: -0.28 },
        { x: -0.15, y: 0.28 },
        { x: 0.15, y: 0.28 },
        { x: 0.15, y: -0.28 },
        { x: -0.15, y: -0.28 },
      ],
      [
        { x: 0.15, y: 0 },
        { x: 0.45, y: 0 },
      ],
    ],
    ports: [
      { id: 'IN', side: 'input', label: 'in' },
      { id: 'OUT', side: 'output', label: 'out' },
      { id: 'CTL', side: 'control', label: 'ctl' },
      { id: 'PWR', side: 'power', label: 'pwr' },
    ],
  },
  {
    id: 'flow.split',
    name: 'FLOW_SPLIT',
    description: 'One in, two out. Two ports on one edge, spread by the rule.',
    size: { w: 1.6, h: 1.2 },
    glyph: [
      [
        { x: -0.45, y: 0 },
        { x: 0, y: 0 },
        { x: 0.45, y: 0.28 },
      ],
      [
        { x: 0, y: 0 },
        { x: 0.45, y: -0.28 },
      ],
    ],
    ports: [
      { id: 'IN', side: 'input', label: 'in' },
      { id: 'OUT_A', side: 'output', label: 'A' },
      { id: 'OUT_B', side: 'output', label: 'B' },
      { id: 'CTL', side: 'control', label: 'ctl' },
      { id: 'PWR', side: 'power', label: 'pwr' },
    ],
  },
  {
    id: 'flow.sink',
    name: 'FLOW_SINK',
    description: 'Where signal stops. Input only, on the left.',
    size: { w: 1.6, h: 1.0 },
    glyph: [
      [
        { x: -0.45, y: 0 },
        { x: 0.05, y: 0 },
      ],
      [
        { x: 0.05, y: -0.3 },
        { x: 0.05, y: 0.3 },
      ],
      [
        { x: 0.25, y: -0.18 },
        { x: 0.25, y: 0.18 },
      ],
      [
        { x: 0.42, y: -0.08 },
        { x: 0.42, y: 0.08 },
      ],
    ],
    ports: [
      { id: 'IN', side: 'input', label: 'in' },
      { id: 'CTL', side: 'control', label: 'ctl' },
      { id: 'PWR', side: 'power', label: 'pwr' },
    ],
  },
];

/**
 * THE SHOP'S OWN PARTS — the half of the catalogue that is joined to a table.
 *
 * The four Flow symbols above are GENERIC: `IN`, `OUT`, `CTL`, `PWR` are names
 * this file invented, and that is correct for a symbol that means "a process"
 * rather than a thing on a bench. A part below is the other kind. Its port ids
 * are not named here — they are READ OUT of `Interfaces.json`'s `Terminals`
 * table, which is the shop's own termination list, and `verifyFlow.ts` fails
 * the build if one of them stops resolving to a row there.
 *
 * That is the whole point, and it is `PLAN-36.04` step 3's constraint: the CAD
 * side must reference the Terminals identifiers rather than invent its own.
 * `PLAN-37.02` already had to rework `PortSide` once because an earlier sitting
 * invented a vocabulary instead of reading the table's, and the entity model is
 * new and unpopulated — which is exactly the window in which a second
 * identifier scheme gets invented by accident. A part that cannot be built
 * unless its ports are in the table closes that window while it is still cheap.
 *
 * WHAT IS DELIBERATELY NOT A PORT HERE. `enp12s0` also has Terminals rows for
 * `44.44.44.156/16`, `fe80::6292:4ef9:` and `0000:0c:00.0`. Those are real rows
 * and they are not ports on a SYMBOL: an address and a PCI slot are facts about
 * THIS machine, and `PLAN-36.02`'s constraint is that `Interfaces` describes one
 * host today and the join has to survive a second one arriving. `rx` and `tx`
 * are structural — every NIC has them, on any node — so the definition carries
 * those and the placement's `refdes` carries which interface it is. One
 * definition, one row per machine, and nothing keyed on the only host we have.
 */
export const SHOP_CATALOG: BlockDefinition[] = [
  {
    id: 'shop.nic',
    name: 'SHOP_NIC',
    description:
      'An ethernet interface, as the Terminals table terminates one: rx in, tx out. ' +
      'Place it and name it after the interface — enp12s0, enp5s0f0.',
    size: { w: 1.6, h: 1.0 },
    glyph: [
      /* A socket: the body, and the eight contacts that make it an RJ45 rather
         than a rectangle. Drawn at the size the Flow set is drawn at, because a
         part that has to be scaled to be legible is one nobody places twice. */
      [
        { x: -0.3, y: -0.3 },
        { x: 0.3, y: -0.3 },
        { x: 0.3, y: 0.3 },
        { x: -0.3, y: 0.3 },
        { x: -0.3, y: -0.3 },
      ],
      [
        { x: -0.12, y: 0.3 },
        { x: -0.12, y: 0.42 },
        { x: 0.12, y: 0.42 },
        { x: 0.12, y: 0.3 },
      ],
      [
        { x: -0.21, y: -0.12 },
        { x: 0.21, y: -0.12 },
      ],
    ],
    /* `id` is the Terminals `terminal` column and `domain` is its `domain`
       column. Both are copied, not coined. */
    ports: [
      { id: 'rx', side: 'input', label: 'rx', domain: 'network' },
      { id: 'tx', side: 'output', label: 'tx', domain: 'network' },
    ],
  },
];

/**
 * SCHEMATIC SYMBOLS AND BLOCK DEFINITIONS
 *
 * Full schematic symbol set supporting Audio & DSP processing blocks,
 * passive electrical components, connectors, transducers, and system blocks.
 */
export const SCHEMATIC_SYMBOL_CATALOG: BlockDefinition[] = [
  {
    id: 'symbol.opamp',
    name: 'OP_AMP',
    description: 'Operational Amplifier. Inverting (-), Non-inverting (+), Output, Power rails.',
    size: { w: 1.6, h: 1.2 },
    glyph: [
      [
        { x: -0.4, y: 0.45 },
        { x: 0.4, y: 0 },
        { x: -0.4, y: -0.45 },
        { x: -0.4, y: 0.45 },
      ],
      [
        { x: -0.32, y: 0.22 },
        { x: -0.22, y: 0.22 },
      ],
      [
        { x: -0.32, y: -0.22 },
        { x: -0.22, y: -0.22 },
      ],
      [
        { x: -0.27, y: -0.27 },
        { x: -0.27, y: -0.17 },
      ],
    ],
    ports: [
      { id: 'INV', side: 'input', label: '-' },
      { id: 'NON_INV', side: 'input', label: '+' },
      { id: 'OUT', side: 'output', label: 'out' },
      { id: 'V_POS', side: 'control', label: 'V+' },
      { id: 'V_NEG', side: 'power', label: 'V-' },
    ],
  },
  {
    id: 'symbol.preamp',
    name: 'PREAMP',
    description: 'Mic/Line Preamplifier block. Low-noise gain stage.',
    size: { w: 1.6, h: 1.0 },
    glyph: [
      [
        { x: -0.45, y: -0.3 },
        { x: 0.35, y: 0 },
        { x: -0.45, y: 0.3 },
        { x: -0.45, y: -0.3 },
      ],
      [
        { x: -0.1, y: -0.1 },
        { x: 0.1, y: 0.1 },
      ],
    ],
    ports: [
      { id: 'IN', side: 'input', label: 'in' },
      { id: 'OUT', side: 'output', label: 'out' },
      { id: 'GAIN', side: 'control', label: 'gain' },
      { id: 'PWR', side: 'power', label: 'pwr' },
    ],
  },
  {
    id: 'symbol.eq',
    name: 'EQ_FILTER',
    description: 'Parametric Equalizer / Filter block.',
    size: { w: 1.6, h: 1.0 },
    glyph: [
      [
        { x: -0.4, y: 0.3 },
        { x: 0.4, y: 0.3 },
        { x: 0.4, y: -0.3 },
        { x: -0.4, y: -0.3 },
        { x: -0.4, y: 0.3 },
      ],
      [
        { x: -0.3, y: 0 },
        { x: -0.15, y: 0 },
        { x: 0, y: 0.2 },
        { x: 0.15, y: -0.2 },
        { x: 0.3, y: 0 },
      ],
    ],
    ports: [
      { id: 'IN', side: 'input', label: 'in' },
      { id: 'OUT', side: 'output', label: 'out' },
      { id: 'FREQ', side: 'control', label: 'freq' },
      { id: 'PWR', side: 'power', label: 'pwr' },
    ],
  },
  {
    id: 'symbol.compressor',
    name: 'COMPRESSOR',
    description: 'Dynamics Compressor / Limiter block with sidechain.',
    size: { w: 1.6, h: 1.1 },
    glyph: [
      [
        { x: -0.4, y: 0.35 },
        { x: 0.4, y: 0.35 },
        { x: 0.4, y: -0.35 },
        { x: -0.4, y: -0.35 },
        { x: -0.4, y: 0.35 },
      ],
      [
        { x: -0.3, y: -0.2 },
        { x: 0, y: -0.1 },
        { x: 0.3, y: 0.05 },
      ],
    ],
    ports: [
      { id: 'IN', side: 'input', label: 'in' },
      { id: 'OUT', side: 'output', label: 'out' },
      { id: 'SIDECHAIN', side: 'input', label: 'sc' },
      { id: 'THRESH', side: 'control', label: 'thr' },
      { id: 'PWR', side: 'power', label: 'pwr' },
    ],
  },
  {
    id: 'symbol.resistor',
    name: 'RESISTOR',
    description: 'Passive Resistor symbol. Zig-zag element.',
    size: { w: 1.4, h: 0.6 },
    glyph: [
      [
        { x: -0.5, y: 0 },
        { x: -0.3, y: 0 },
        { x: -0.2, y: 0.15 },
        { x: -0.1, y: -0.15 },
        { x: 0, y: 0.15 },
        { x: 0.1, y: -0.15 },
        { x: 0.2, y: 0.15 },
        { x: 0.3, y: 0 },
        { x: 0.5, y: 0 },
      ],
    ],
    ports: [
      { id: 'PIN_A', side: 'input', label: '1' },
      { id: 'PIN_B', side: 'output', label: '2' },
    ],
  },
  {
    id: 'symbol.capacitor',
    name: 'CAPACITOR',
    description: 'Passive Capacitor symbol. Parallel plates.',
    size: { w: 1.2, h: 0.6 },
    glyph: [
      [
        { x: -0.45, y: 0 },
        { x: -0.08, y: 0 },
      ],
      [
        { x: -0.08, y: -0.25 },
        { x: -0.08, y: 0.25 },
      ],
      [
        { x: 0.08, y: -0.25 },
        { x: 0.08, y: 0.25 },
      ],
      [
        { x: 0.08, y: 0 },
        { x: 0.45, y: 0 },
      ],
    ],
    ports: [
      { id: 'PIN_A', side: 'input', label: '1' },
      { id: 'PIN_B', side: 'output', label: '2' },
    ],
  },
  {
    id: 'symbol.transformer',
    name: 'TRANSFORMER',
    description: 'Audio Isolation Transformer. Dual coupled coils.',
    size: { w: 1.5, h: 1.0 },
    glyph: [
      [
        { x: -0.45, y: 0.3 },
        { x: -0.2, y: 0.3 },
        { x: -0.2, y: -0.3 },
        { x: -0.45, y: -0.3 },
      ],
      [
        { x: -0.05, y: 0.35 },
        { x: -0.05, y: -0.35 },
      ],
      [
        { x: 0.05, y: 0.35 },
        { x: 0.05, y: -0.35 },
      ],
      [
        { x: 0.45, y: 0.3 },
        { x: 0.2, y: 0.3 },
        { x: 0.2, y: -0.3 },
        { x: 0.45, y: -0.3 },
      ],
    ],
    ports: [
      { id: 'PRI_HI', side: 'input', label: 'P+' },
      { id: 'PRI_LO', side: 'input', label: 'P-' },
      { id: 'SEC_HI', side: 'output', label: 'S+' },
      { id: 'SEC_LO', side: 'output', label: 'S-' },
    ],
  },
  {
    id: 'symbol.ground',
    name: 'GROUND',
    description: 'Earth / Signal Ground termination symbol.',
    size: { w: 1.0, h: 0.8 },
    glyph: [
      [
        { x: 0, y: 0.3 },
        { x: 0, y: 0 },
      ],
      [
        { x: -0.3, y: 0 },
        { x: 0.3, y: 0 },
      ],
      [
        { x: -0.2, y: -0.1 },
        { x: 0.2, y: -0.1 },
      ],
      [
        { x: -0.1, y: -0.2 },
        { x: 0.1, y: -0.2 },
      ],
    ],
    ports: [
      { id: 'GND', side: 'input', label: 'gnd' },
    ],
  },
  {
    id: 'symbol.xlr',
    name: 'XLR_3PIN',
    description: '3-Pin Balanced XLR Audio Connector (Pin 1 GND, Pin 2 Hot, Pin 3 Cold).',
    size: { w: 1.4, h: 1.0 },
    glyph: [
      [
        { x: -0.3, y: -0.3 },
        { x: 0.3, y: -0.3 },
        { x: 0.3, y: 0.3 },
        { x: -0.3, y: 0.3 },
        { x: -0.3, y: -0.3 },
      ],
      [
        { x: -0.15, y: 0.1 },
        { x: -0.15, y: 0.12 },
      ],
      [
        { x: 0.15, y: 0.1 },
        { x: 0.15, y: 0.12 },
      ],
      [
        { x: 0, y: -0.15 },
        { x: 0, y: -0.13 },
      ],
    ],
    ports: [
      { id: 'PIN1_GND', side: 'input', label: '1 (GND)' },
      { id: 'PIN2_HOT', side: 'output', label: '2 (HOT)' },
      { id: 'PIN3_COLD', side: 'output', label: '3 (COLD)' },
    ],
  },
];

/**
 * MATH, LOGIC & DATAFLOW BLOCKS
 *
 * Arithmetic operators, Boolean logic gates, and Idea/Value blocks.
 */
export const MATH_LOGIC_CATALOG: BlockDefinition[] = [
  {
    id: 'math.add',
    name: 'MATH_ADD',
    description: 'Arithmetic Addition (A + B). Sums wired inputs.',
    size: { w: 1.4, h: 1.0 },
    glyph: [
      [
        { x: -0.35, y: -0.35 },
        { x: 0.35, y: -0.35 },
        { x: 0.35, y: 0.35 },
        { x: -0.35, y: 0.35 },
        { x: -0.35, y: -0.35 },
      ],
      [
        { x: 0, y: -0.2 },
        { x: 0, y: 0.2 },
      ],
      [
        { x: -0.2, y: 0 },
        { x: 0.2, y: 0 },
      ],
    ],
    ports: [
      { id: 'A', side: 'input', label: 'A', domain: 'numeric' },
      { id: 'B', side: 'input', label: 'B', domain: 'numeric' },
      { id: 'OUT', side: 'output', label: '+', domain: 'numeric' },
    ],
  },
  {
    id: 'math.sub',
    name: 'MATH_SUB',
    description: 'Arithmetic Subtraction (A - B).',
    size: { w: 1.4, h: 1.0 },
    glyph: [
      [
        { x: -0.35, y: -0.35 },
        { x: 0.35, y: -0.35 },
        { x: 0.35, y: 0.35 },
        { x: -0.35, y: 0.35 },
        { x: -0.35, y: -0.35 },
      ],
      [
        { x: -0.2, y: 0 },
        { x: 0.2, y: 0 },
      ],
    ],
    ports: [
      { id: 'A', side: 'input', label: 'A', domain: 'numeric' },
      { id: 'B', side: 'input', label: 'B', domain: 'numeric' },
      { id: 'OUT', side: 'output', label: '−', domain: 'numeric' },
    ],
  },
  {
    id: 'math.mul',
    name: 'MATH_MUL',
    description: 'Arithmetic Multiplication (A × B). Scale factor or product.',
    size: { w: 1.4, h: 1.0 },
    glyph: [
      [
        { x: -0.35, y: -0.35 },
        { x: 0.35, y: -0.35 },
        { x: 0.35, y: 0.35 },
        { x: -0.35, y: 0.35 },
        { x: -0.35, y: -0.35 },
      ],
      [
        { x: -0.15, y: -0.15 },
        { x: 0.15, y: 0.15 },
      ],
      [
        { x: -0.15, y: 0.15 },
        { x: 0.15, y: -0.15 },
      ],
    ],
    ports: [
      { id: 'A', side: 'input', label: 'A', domain: 'numeric' },
      { id: 'B', side: 'input', label: 'B', domain: 'numeric' },
      { id: 'OUT', side: 'output', label: '×', domain: 'numeric' },
    ],
  },
  {
    id: 'math.compare',
    name: 'MATH_CMP',
    description: 'Arithmetic Comparator (A vs B). Outputs EQ, GT, LT booleans.',
    size: { w: 1.6, h: 1.2 },
    glyph: [
      [
        { x: -0.4, y: -0.4 },
        { x: 0.4, y: -0.4 },
        { x: 0.4, y: 0.4 },
        { x: -0.4, y: 0.4 },
        { x: -0.4, y: -0.4 },
      ],
      [
        { x: -0.2, y: -0.15 },
        { x: 0.2, y: -0.15 },
      ],
      [
        { x: -0.2, y: -0.05 },
        { x: 0.2, y: -0.05 },
      ],
      [
        { x: 0.1, y: 0.1 },
        { x: -0.1, y: 0.2 },
        { x: 0.1, y: 0.3 },
      ],
    ],
    ports: [
      { id: 'A', side: 'input', label: 'A', domain: 'numeric' },
      { id: 'B', side: 'input', label: 'B', domain: 'numeric' },
      { id: 'EQ', side: 'output', label: '=', domain: 'logic_bool' },
      { id: 'GT', side: 'output', label: '>', domain: 'logic_bool' },
      { id: 'LT', side: 'output', label: '<', domain: 'logic_bool' },
    ],
  },
  {
    id: 'logic.and',
    name: 'LOGIC_AND',
    description: 'ANSI / IEEE AND Gate. True when all inputs are true.',
    size: { w: 1.6, h: 1.1 },
    glyph: [
      [
        { x: -0.4, y: -0.4 },
        { x: 0, y: -0.4 },
        { x: 0.25, y: -0.2 },
        { x: 0.35, y: 0 },
        { x: 0.25, y: 0.2 },
        { x: 0, y: 0.4 },
        { x: -0.4, y: 0.4 },
        { x: -0.4, y: -0.4 },
      ],
    ],
    ports: [
      { id: 'A', side: 'input', label: 'A', domain: 'logic_bool' },
      { id: 'B', side: 'input', label: 'B', domain: 'logic_bool' },
      { id: 'OUT', side: 'output', label: 'out', domain: 'logic_bool' },
    ],
  },
  {
    id: 'logic.or',
    name: 'LOGIC_OR',
    description: 'ANSI / IEEE OR Gate. True when any input is true.',
    size: { w: 1.6, h: 1.1 },
    glyph: [
      [
        { x: -0.4, y: -0.4 },
        { x: -0.2, y: 0 },
        { x: -0.4, y: 0.4 },
        { x: 0, y: 0.35 },
        { x: 0.4, y: 0 },
        { x: 0, y: -0.35 },
        { x: -0.4, y: -0.4 },
      ],
    ],
    ports: [
      { id: 'A', side: 'input', label: 'A', domain: 'logic_bool' },
      { id: 'B', side: 'input', label: 'B', domain: 'logic_bool' },
      { id: 'OUT', side: 'output', label: 'out', domain: 'logic_bool' },
    ],
  },
  {
    id: 'logic.not',
    name: 'LOGIC_NOT',
    description: 'ANSI / IEEE NOT Inverter Gate. Inverts true / false.',
    size: { w: 1.4, h: 0.8 },
    glyph: [
      [
        { x: -0.35, y: -0.3 },
        { x: 0.15, y: 0 },
        { x: -0.35, y: 0.3 },
        { x: -0.35, y: -0.3 },
      ],
      [
        { x: 0.15, y: -0.06 },
        { x: 0.27, y: -0.06 },
        { x: 0.27, y: 0.06 },
        { x: 0.15, y: 0.06 },
        { x: 0.15, y: -0.06 },
      ],
    ],
    ports: [
      { id: 'IN', side: 'input', label: 'in', domain: 'logic_bool' },
      { id: 'OUT', side: 'output', label: 'out', domain: 'logic_bool' },
    ],
  },
  {
    id: 'idea.value',
    name: 'IDEA_VALUE',
    description: 'Idea / Parameter Value source. Inlines an idea, constant, or switch into the schematic.',
    size: { w: 1.5, h: 1.0 },
    glyph: [
      [
        { x: -0.35, y: 0 },
        { x: -0.18, y: 0.3 },
        { x: 0.18, y: 0.3 },
        { x: 0.35, y: 0 },
        { x: 0.18, y: -0.3 },
        { x: -0.18, y: -0.3 },
        { x: -0.35, y: 0 },
      ],
      [
        { x: -0.1, y: 0 },
        { x: 0.1, y: 0 },
      ],
    ],
    ports: [
      { id: 'VAL_IN', side: 'input', label: 'in', domain: 'universal' },
      { id: 'VAL_OUT', side: 'output', label: 'idea', domain: 'universal' },
      { id: 'PARAM', side: 'control', label: 'param', domain: 'universal' },
    ],
  },
];

/**
 * ADAPTER & PROTOCOL CONVERTER BLOCKS
 *
 * Blocks designed to reconcile incompatible signals, demux containers,
 * bridge ST 2110 essences, and provide seamless media routing.
 */
export const ADAPTER_CATALOG: BlockDefinition[] = [
  {
    id: 'adapter.value',
    name: 'ADAPTER_VALUE',
    description: 'In-line Value & Idea Adapter: bridges mismatched data types, units, and signal domains.',
    size: { w: 1.6, h: 1.0 },
    glyph: [
      [
        { x: -0.4, y: 0 },
        { x: -0.2, y: 0.35 },
        { x: 0.2, y: 0.35 },
        { x: 0.4, y: 0 },
        { x: 0.2, y: -0.35 },
        { x: -0.2, y: -0.35 },
        { x: -0.4, y: 0 },
      ],
      [
        { x: -0.15, y: 0 },
        { x: 0.15, y: 0 },
      ],
      [
        { x: 0.05, y: -0.1 },
        { x: 0.15, y: 0 },
        { x: 0.05, y: 0.1 },
      ],
    ],
    ports: [
      { id: 'IN', side: 'input', label: 'in', domain: 'universal' },
      { id: 'OUT', side: 'output', label: 'out', domain: 'universal' },
      { id: 'RULE', side: 'control', label: 'rule' },
    ],
  },
  {
    id: 'adapter.demux',
    name: 'CONTAINER_DEMUX',
    description: 'Media Container Demultiplexer: demuxes MP4, MOV, MKV, MXF into Video, Audio, and ANC tracks.',
    size: { w: 1.8, h: 1.4 },
    glyph: [
      [
        { x: -0.4, y: -0.2 },
        { x: 0.4, y: -0.45 },
        { x: 0.4, y: 0.45 },
        { x: -0.4, y: 0.2 },
        { x: -0.4, y: -0.2 },
      ],
      [
        { x: -0.2, y: 0 },
        { x: 0.15, y: -0.25 },
      ],
      [
        { x: -0.2, y: 0 },
        { x: 0.15, y: 0 },
      ],
      [
        { x: -0.2, y: 0 },
        { x: 0.15, y: 0.25 },
      ],
    ],
    ports: [
      { id: 'FILE_IN', side: 'input', label: 'file', domain: 'container' },
      { id: 'VIDEO_OUT', side: 'output', label: 'video', domain: 'video' },
      { id: 'AUDIO_OUT', side: 'output', label: 'audio', domain: 'audio' },
      { id: 'ANC_OUT', side: 'output', label: 'anc', domain: 'ancillary' },
    ],
  },
  {
    id: 'adapter.mux',
    name: 'CONTAINER_MUX',
    description: 'Media Container Multiplexer: multiplexes Video, Audio, and ANC into an MP4/MKV/MXF container.',
    size: { w: 1.8, h: 1.4 },
    glyph: [
      [
        { x: -0.4, y: -0.45 },
        { x: 0.4, y: -0.2 },
        { x: 0.4, y: 0.2 },
        { x: -0.4, y: 0.45 },
        { x: -0.4, y: -0.45 },
      ],
      [
        { x: -0.2, y: -0.25 },
        { x: 0.15, y: 0 },
      ],
      [
        { x: -0.2, y: 0 },
        { x: 0.15, y: 0 },
      ],
      [
        { x: -0.2, y: 0.25 },
        { x: 0.15, y: 0 },
      ],
    ],
    ports: [
      { id: 'VIDEO_IN', side: 'input', label: 'video', domain: 'video' },
      { id: 'AUDIO_IN', side: 'input', label: 'audio', domain: 'audio' },
      { id: 'ANC_IN', side: 'input', label: 'anc', domain: 'ancillary' },
      { id: 'FILE_OUT', side: 'output', label: 'file', domain: 'container' },
    ],
  },
  {
    id: 'adapter.transcode',
    name: 'CODEC_TRANSCODE',
    description: 'Media Transcoder & Converter: converts video/audio codecs and formats (e.g. H.264 to ProRes, PCM to AAC).',
    size: { w: 1.6, h: 1.0 },
    glyph: [
      [
        { x: -0.45, y: -0.3 },
        { x: 0.45, y: -0.3 },
        { x: 0.45, y: 0.3 },
        { x: -0.45, y: 0.3 },
        { x: -0.45, y: -0.3 },
      ],
      [
        { x: -0.2, y: -0.1 },
        { x: 0.2, y: 0.1 },
      ],
      [
        { x: 0.2, y: -0.1 },
        { x: -0.2, y: 0.1 },
      ],
    ],
    ports: [
      { id: 'IN', side: 'input', label: 'in' },
      { id: 'OUT', side: 'output', label: 'out' },
      { id: 'PROFILE', side: 'control', label: 'prof' },
    ],
  },
  {
    id: 'adapter.st2110_gateway',
    name: 'ST2110_GATEWAY',
    description: 'SMPTE ST 2110 IP Media Gateway. Separates or combines -20 video, -30 audio, -40 ANC over 10G/25G IP.',
    size: { w: 2.0, h: 1.5 },
    glyph: [
      [
        { x: -0.5, y: -0.4 },
        { x: 0.5, y: -0.4 },
        { x: 0.5, y: 0.4 },
        { x: -0.5, y: 0.4 },
        { x: -0.5, y: -0.4 },
      ],
      [
        { x: -0.3, y: -0.15 },
        { x: -0.3, y: 0.15 },
      ],
      [
        { x: -0.4, y: 0 },
        { x: -0.2, y: 0 },
      ],
      [
        { x: 0.1, y: -0.2 },
        { x: 0.4, y: -0.2 },
      ],
      [
        { x: 0.1, y: 0 },
        { x: 0.4, y: 0 },
      ],
      [
        { x: 0.1, y: 0.2 },
        { x: 0.4, y: 0.2 },
      ],
    ],
    ports: [
      { id: 'ETH_PRIMARY', side: 'input', label: 'eth1', domain: 'network' },
      { id: 'ETH_SECONDARY', side: 'input', label: 'eth2', domain: 'network' },
      { id: 'ST2110_20', side: 'output', label: 'video (-20)', domain: 'video' },
      { id: 'ST2110_30', side: 'output', label: 'audio (-30)', domain: 'audio' },
      { id: 'ST2110_40', side: 'output', label: 'anc (-40)', domain: 'ancillary' },
      { id: 'PTP_10', side: 'control', label: 'ptp (-10)', domain: 'clock' },
    ],
  },
  {
    id: 'adapter.st2022_7',
    name: 'ST2022_7_REDUNDANCY',
    description: 'SMPTE ST 2022-7 Seamless Hitless Protection Switching. Merges redundant Red & Blue network paths.',
    size: { w: 1.6, h: 1.1 },
    glyph: [
      [
        { x: -0.4, y: -0.3 },
        { x: 0.4, y: -0.3 },
        { x: 0.4, y: 0.3 },
        { x: -0.4, y: 0.3 },
        { x: -0.4, y: -0.3 },
      ],
      [
        { x: -0.25, y: -0.15 },
        { x: 0.25, y: -0.15 },
      ],
      [
        { x: -0.25, y: 0.15 },
        { x: 0.25, y: 0.15 },
      ],
    ],
    ports: [
      { id: 'RED_PATH', side: 'input', label: 'red (A)', domain: 'network' },
      { id: 'BLUE_PATH', side: 'input', label: 'blue (B)', domain: 'network' },
      { id: 'OUT', side: 'output', label: 'stream', domain: 'network' },
      { id: 'STATUS', side: 'control', label: 'stat' },
    ],
  },
  {
    id: 'adapter.deembedder',
    name: 'SDI_DEEMBEDDER',
    description: 'SMPTE ST 299-1 SDI Audio De-embedder. Demuxes 16 channels of embedded AES3 audio from HD/3G-SDI.',
    size: { w: 1.8, h: 1.2 },
    glyph: [
      [
        { x: -0.45, y: -0.35 },
        { x: 0.45, y: -0.35 },
        { x: 0.45, y: 0.35 },
        { x: -0.45, y: 0.35 },
        { x: -0.45, y: -0.35 },
      ],
      [
        { x: -0.25, y: 0 },
        { x: 0.25, y: 0 },
      ],
      [
        { x: 0, y: 0 },
        { x: 0.25, y: -0.2 },
      ],
    ],
    ports: [
      { id: 'SDI_IN', side: 'input', label: 'sdi in', domain: 'video' },
      { id: 'SDI_THRU', side: 'output', label: 'sdi thru', domain: 'video' },
      { id: 'AUDIO_1_8', side: 'output', label: 'ch 1-8', domain: 'audio' },
      { id: 'AUDIO_9_16', side: 'output', label: 'ch 9-16', domain: 'audio' },
    ],
  },
];

/**
 * Everything placeable: the generic set, shop parts, schematic symbols, math & logic, and adapters.
 */
export const CATALOG: BlockDefinition[] = [
  ...FLOW_CATALOG,
  ...SHOP_CATALOG,
  ...SCHEMATIC_SYMBOL_CATALOG,
  ...MATH_LOGIC_CATALOG,
  ...ADAPTER_CATALOG,
];

/** The symbol the Flow tool places until the sidebar is told otherwise. */
export const DEFAULT_FLOW_DEFINITION = 'flow.process';

