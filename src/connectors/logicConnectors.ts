// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-14 - created (owner: "make the connector meue includes some new categories.... like "IDEA" or RESULT"
//     or baseic logic and arithmatic"; ruled the same day: dataflow node ports, in a Logic tab of their own).
//     Four families: Idea, Result, Logic, Arithmetic, plus `evaluateLogicPort`, the one place that says what
//     each operator computes.

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/logicConnectors.ts
 *
 * DATAFLOW PORTS — A PORT THAT CARRIES A VALUE, NOT A SIGNAL.
 *
 * An IDEA port puts a value into a graph, a RESULT port is where one comes out, and
 * the Logic and Arithmetic ports compute from whatever is wired into them. None of
 * them is a part you crimp, so like the IP-media flows they count as flows, and the
 * palette's physical view leaves them out.
 *
 * Abbreviations carry a LOGIC- or MATH- prefix, so a bare "AND" or "ADD" can never
 * collide with a vendor connector code.
 *
 * Unknown propagates: an operator with a missing or wrong-typed input gives `null`,
 * never a guess, the same way an unwired port reads as nothing rather than as zero.
 */

import type { ConnectorGroup } from './ConnectorLookup';

/** The value a dataflow port carries. `null` means unknown or not wired. */
export type LogicValue = boolean | number | string | null;

export const IDEA_GROUP: ConnectorGroup = {
    name: 'Idea',
    groupDescription: 'IDEA ports — where a value enters a dataflow graph: a concept, an assumption, a parameter or a constant.',
    connectors: [
        { abbreviation: 'IDEA', description: 'IDEA — a value introduced into the graph (any type)' },
        { abbreviation: 'IDEA-BOOL', description: 'IDEA (yes / no) — a true / false assumption or switch' },
        { abbreviation: 'IDEA-NUM', description: 'IDEA (number) — a quantity, parameter or constant' },
        { abbreviation: 'IDEA-TEXT', description: 'IDEA (text) — a name, note or label value' },
    ],
};

export const RESULT_GROUP: ConnectorGroup = {
    name: 'Result',
    groupDescription: 'RESULT ports — where a value leaves a dataflow graph: the answer the wiring computes.',
    connectors: [
        { abbreviation: 'RESULT', description: 'RESULT — the value computed by what is wired in (any type)' },
        { abbreviation: 'RESULT-BOOL', description: 'RESULT (yes / no) — a computed true / false' },
        { abbreviation: 'RESULT-NUM', description: 'RESULT (number) — a computed quantity' },
        { abbreviation: 'RESULT-TEXT', description: 'RESULT (text) — a computed name or label' },
    ],
};

export const LOGIC_GROUP: ConnectorGroup = {
    name: 'Logic',
    groupDescription: 'Boolean logic ports — compute true / false from the values wired in. NOT takes one input; the others take two or more.',
    connectors: [
        { abbreviation: 'LOGIC-AND', description: 'AND — true when every input is true' },
        { abbreviation: 'LOGIC-OR', description: 'OR — true when any input is true' },
        { abbreviation: 'LOGIC-NOT', description: 'NOT — the opposite of its one input' },
        { abbreviation: 'LOGIC-XOR', description: 'XOR — true when an odd number of inputs are true' },
        { abbreviation: 'LOGIC-NAND', description: 'NAND — false only when every input is true' },
        { abbreviation: 'LOGIC-NOR', description: 'NOR — true only when no input is true' },
        { abbreviation: 'LOGIC-XNOR', description: 'XNOR — true when an even number of inputs are true' },
    ],
};

export const ARITHMETIC_GROUP: ConnectorGroup = {
    name: 'Arithmetic',
    groupDescription: 'Arithmetic ports — compute a number from the numbers wired in, or compare two numbers to a true / false.',
    connectors: [
        { abbreviation: 'MATH-ADD', description: 'ADD — the sum of the inputs' },
        { abbreviation: 'MATH-SUB', description: 'SUBTRACT — the first input minus the rest' },
        { abbreviation: 'MATH-MUL', description: 'MULTIPLY — the product of the inputs' },
        { abbreviation: 'MATH-DIV', description: 'DIVIDE — the first input divided by the rest (unknown on divide-by-zero)' },
        { abbreviation: 'MATH-MOD', description: 'MODULO — the remainder of the first input divided by the second' },
        { abbreviation: 'MATH-NEG', description: 'NEGATE — minus its one input' },
        { abbreviation: 'MATH-ABS', description: 'ABSOLUTE — its one input without the sign' },
        { abbreviation: 'MATH-MIN', description: 'MIN — the smallest input' },
        { abbreviation: 'MATH-MAX', description: 'MAX — the largest input' },
        { abbreviation: 'MATH-EQ', description: 'EQUAL — true when the two inputs are the same number' },
        { abbreviation: 'MATH-NE', description: 'NOT EQUAL — true when the two inputs differ' },
        { abbreviation: 'MATH-LT', description: 'LESS THAN — true when the first input is below the second' },
        { abbreviation: 'MATH-LE', description: 'AT MOST — true when the first input is at or below the second' },
        { abbreviation: 'MATH-GT', description: 'GREATER THAN — true when the first input is above the second' },
        { abbreviation: 'MATH-GE', description: 'AT LEAST — true when the first input is at or above the second' },
    ],
};

/** All four families, in tab order. */
export const LOGIC_GROUPS: readonly ConnectorGroup[] = [IDEA_GROUP, RESULT_GROUP, LOGIC_GROUP, ARITHMETIC_GROUP];

const toBool = (v: LogicValue): boolean | null =>
    typeof v === 'boolean' ? v : typeof v === 'number' ? v !== 0 : null;

const toNum = (v: LogicValue): number | null => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
    return null;
};

/** Every input converted, or null when any of them cannot be. */
const all = <T>(inputs: readonly LogicValue[], conv: (v: LogicValue) => T | null): T[] | null => {
    const out: T[] = [];
    for (const v of inputs) {
        const c = conv(v);
        if (c === null) return null;
        out.push(c);
    }
    return out;
};

type Op = { min: number; max?: number; run: (inputs: readonly LogicValue[]) => LogicValue };

const bools = (f: (b: boolean[]) => boolean): Op['run'] => inputs => { const b = all(inputs, toBool); return b && f(b); };
const nums = (f: (n: number[]) => number | boolean | null): Op['run'] => inputs => {
    const n = all(inputs, toNum);
    if (!n) return null;
    const r = f(n);
    return typeof r === 'number' && !Number.isFinite(r) ? null : r;
};
const odd = (b: boolean[]) => b.filter(Boolean).length % 2 === 1;

const OPS: Record<string, Op> = {
    'IDEA': { min: 1, max: 1, run: ([v]) => v },
    'IDEA-BOOL': { min: 1, max: 1, run: ([v]) => toBool(v) },
    'IDEA-NUM': { min: 1, max: 1, run: ([v]) => toNum(v) },
    'IDEA-TEXT': { min: 1, max: 1, run: ([v]) => (v === null ? null : String(v)) },
    'RESULT': { min: 1, max: 1, run: ([v]) => v },
    'RESULT-BOOL': { min: 1, max: 1, run: ([v]) => toBool(v) },
    'RESULT-NUM': { min: 1, max: 1, run: ([v]) => toNum(v) },
    'RESULT-TEXT': { min: 1, max: 1, run: ([v]) => (v === null ? null : String(v)) },
    'LOGIC-AND': { min: 2, run: bools(b => b.every(Boolean)) },
    'LOGIC-OR': { min: 2, run: bools(b => b.some(Boolean)) },
    'LOGIC-NOT': { min: 1, max: 1, run: bools(([a]) => !a) },
    'LOGIC-XOR': { min: 2, run: bools(odd) },
    'LOGIC-NAND': { min: 2, run: bools(b => !b.every(Boolean)) },
    'LOGIC-NOR': { min: 2, run: bools(b => !b.some(Boolean)) },
    'LOGIC-XNOR': { min: 2, run: bools(b => !odd(b)) },
    'MATH-ADD': { min: 2, run: nums(n => n.reduce((a, b) => a + b, 0)) },
    'MATH-SUB': { min: 2, run: nums(([a, ...r]) => r.reduce((x, b) => x - b, a)) },
    'MATH-MUL': { min: 2, run: nums(n => n.reduce((a, b) => a * b, 1)) },
    'MATH-DIV': { min: 2, run: nums(([a, ...r]) => (r.includes(0) ? null : r.reduce((x, b) => x / b, a))) },
    'MATH-MOD': { min: 2, max: 2, run: nums(([a, b]) => (b === 0 ? null : a % b)) },
    'MATH-NEG': { min: 1, max: 1, run: nums(([a]) => -a) },
    'MATH-ABS': { min: 1, max: 1, run: nums(([a]) => Math.abs(a)) },
    'MATH-MIN': { min: 2, run: nums(n => Math.min(...n)) },
    'MATH-MAX': { min: 2, run: nums(n => Math.max(...n)) },
    'MATH-EQ': { min: 2, max: 2, run: nums(([a, b]) => a === b) },
    'MATH-NE': { min: 2, max: 2, run: nums(([a, b]) => a !== b) },
    'MATH-LT': { min: 2, max: 2, run: nums(([a, b]) => a < b) },
    'MATH-LE': { min: 2, max: 2, run: nums(([a, b]) => a <= b) },
    'MATH-GT': { min: 2, max: 2, run: nums(([a, b]) => a > b) },
    'MATH-GE': { min: 2, max: 2, run: nums(([a, b]) => a >= b) },
};

/** How many inputs a dataflow port takes; undefined for anything that is not one. */
export const logicArity = (abbreviation: string): { min: number; max?: number } | undefined => {
    const op = OPS[abbreviation.toUpperCase()];
    return op && { min: op.min, max: op.max };
};

/**
 * What a dataflow port computes from the values wired into it. Returns `null` (unknown)
 * for a wrong input count, an input of the wrong type, or a divide by zero; `undefined`
 * when `abbreviation` is not a dataflow port at all.
 */
export const evaluateLogicPort = (abbreviation: string, inputs: readonly LogicValue[]): LogicValue | undefined => {
    const op = OPS[abbreviation.toUpperCase()];
    if (!op) return undefined;
    if (inputs.length < op.min || (op.max !== undefined && inputs.length > op.max)) return null;
    return op.run(inputs);
};
