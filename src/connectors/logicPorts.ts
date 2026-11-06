// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * WHAT A DATAFLOW PORT COMPUTES — the one place that says it.
 *
 * The ports themselves (Idea, Result, Logic, Arithmetic: IDEA-NUM, LOGIC-AND, MATH-ADD …) are
 * words of contracts/ifc/signal-formats.json (slot Logic), read by signalFormats.ts. This is only
 * their behaviour, keyed by the same ids (ROAD-3588 moved the words out of logicConnectors.ts).
 *
 * Unknown propagates: an operator with a missing or wrong-typed input gives `null`, never a
 * guess, the same way an unwired port reads as nothing rather than as zero.
 */

/** The value a dataflow port carries. `null` means unknown or not wired. */
export type LogicValue = boolean | number | string | null;

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
