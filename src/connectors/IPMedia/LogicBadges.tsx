// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-14 - created: one badge per Idea / Result / Logic / Arithmetic port (logicConnectors.ts).

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/IPMedia/LogicBadges.tsx
 *
 * Badges for the dataflow families, in the shared badge layout (`Badge`). Each one shows the
 * operator's symbol, so a graph reads like the sum it computes. Every port gets its OWN
 * component, which is what `logicConnectors.test.ts` asserts.
 */

import React from 'react';
import { Badge } from './Badge';
import { Brackets, Flow, Interop, Clock } from './glyphs';
import { LOGIC_GROUPS } from '../logicConnectors';

type GlyphFC = React.FC<{ c: string }>;

const FAMILY: Record<string, { accent: string; caption: string; glyph: GlyphFC }> = {
    'Idea': { accent: '#f4a261', caption: 'IDEA', glyph: Brackets },
    'Result': { accent: '#2a9d8f', caption: 'RESULT', glyph: Flow },
    'Logic': { accent: '#7b2cbf', caption: 'LOGIC', glyph: Interop },
    'Arithmetic': { accent: '#3a86ff', caption: 'MATH', glyph: Clock },
};

/** The symbol each port shows. */
const WORD: Record<string, string> = {
    'IDEA': 'IDEA', 'IDEA-BOOL': 'T/F', 'IDEA-NUM': '#', 'IDEA-TEXT': 'Aa',
    'RESULT': '=>', 'RESULT-BOOL': '=T/F', 'RESULT-NUM': '=#', 'RESULT-TEXT': '=Aa',
    'LOGIC-AND': 'AND', 'LOGIC-OR': 'OR', 'LOGIC-NOT': 'NOT', 'LOGIC-XOR': 'XOR',
    'LOGIC-NAND': 'NAND', 'LOGIC-NOR': 'NOR', 'LOGIC-XNOR': 'XNOR',
    'MATH-ADD': '+', 'MATH-SUB': '−', 'MATH-MUL': '×', 'MATH-DIV': '÷', 'MATH-MOD': 'mod',
    'MATH-NEG': '−x', 'MATH-ABS': '|x|', 'MATH-MIN': 'min', 'MATH-MAX': 'max',
    'MATH-EQ': '=', 'MATH-NE': '≠', 'MATH-LT': '<', 'MATH-LE': '≤', 'MATH-GT': '>', 'MATH-GE': '≥',
};

const badge = (abbreviation: string, family: string): React.FC => {
    const f = FAMILY[family];
    const Glyph = f.glyph;
    const Icon: React.FC = () => (
        <Badge accent={f.accent} glyph={<Glyph c={f.accent} />} big={WORD[abbreviation] ?? abbreviation} bigSize={26} caption={f.caption} />
    );
    Icon.displayName = `LogicBadge(${abbreviation})`;
    return Icon;
};

/** Abbreviation → its badge, for every port in the four families. */
export const LOGIC_ICONS: Record<string, React.FC> = Object.fromEntries(
    LOGIC_GROUPS.flatMap(g => g.connectors.map(c => [c.abbreviation, badge(c.abbreviation, g.name)])),
);
