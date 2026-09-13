// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * Evaluates math expressions like "(56-934.435) -5" or "10/2 + 3.5" safely.
 */
export function parseMathExpression(expr: string): number | null {
  if (!expr || typeof expr !== 'string') return null;
  const clean = expr.trim();
  if (!clean) return null;

  // If it's a plain number, parse directly
  const direct = Number(clean);
  if (Number.isFinite(direct)) return direct;

  // Sanitize input: allow digits, decimal points, parentheses, and arithmetic operators (+, -, *, /)
  if (!/^[0-9.\s\+\-\*\/\(\)]+$/.test(clean)) return null;

  try {
    // Safe evaluation using Function context without global scope access
    const result = Function(`"use strict"; return (${clean});`)();
    if (typeof result === 'number' && Number.isFinite(result)) {
      return result;
    }
  } catch {
    return null;
  }

  return null;
}
