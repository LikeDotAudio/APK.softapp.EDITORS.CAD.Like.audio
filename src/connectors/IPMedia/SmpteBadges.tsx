// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-14 - created: one badge per SMPTE-Audio and MXL connector (smpteMediaConnectors.ts),
//                the StreamingBadges pattern.

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/IPMedia/SmpteBadges.tsx
 *
 * Badges for the SMPTE-Audio and MXL families, in the IP-media badge layout (`Badge`).
 * Every connector gets its OWN component, because `ipMedia.test.ts` asserts that no two share one.
 */

import React from 'react';
import { Badge } from './Badge';
import { Flow, Waveform } from './glyphs';
import { SMPTE_MEDIA_GROUPS } from '../smpteMediaConnectors';

type GlyphFC = React.FC<{ c: string }>;

const FAMILY: Record<string, { accent: string; caption: string; glyph: GlyphFC }> = {
    'SMPTE-Audio': { accent: '#b5651d', caption: 'SMPTE', glyph: Waveform },
    'MXL': { accent: '#0b7a75', caption: 'MXL', glyph: Flow },
};

/** Short words where the abbreviation is too long for the badge. */
const WORD: Record<string, string> = {
    'ST340-AC3': 'AC-3', 'ST340-EAC3': 'E-AC-3', 'ST2041-2': 'AAC-2', 'ST2041-3': 'AAC-4',
    'ST2036-2': '22.2', 'MXL-VIDEO': 'Video', 'MXL-AUDIO': 'Audio', 'MXL-ANC': 'ANC', 'MXL-FABRIC': 'Fabric',
};

const badge = (abbreviation: string, family: string): React.FC => {
    const f = FAMILY[family];
    const Glyph = f.glyph;
    const Icon: React.FC = () => (
        <Badge accent={f.accent} glyph={<Glyph c={f.accent} />} big={WORD[abbreviation] ?? abbreviation} bigSize={22} caption={f.caption} />
    );
    Icon.displayName = `SmpteBadge(${abbreviation})`;
    return Icon;
};

/** Abbreviation → its badge, for every entry in both families. */
export const SMPTE_ICONS: Record<string, React.FC> = Object.fromEntries(
    SMPTE_MEDIA_GROUPS.flatMap(g => g.connectors.map(c => [c.abbreviation, badge(c.abbreviation, g.name)])),
);
