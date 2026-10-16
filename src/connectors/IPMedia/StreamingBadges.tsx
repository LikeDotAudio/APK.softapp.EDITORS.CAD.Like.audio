// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-09 - created (owner: "be sure to make icons"): one badge per streaming, AV-over-IP,
//                VoIP, codec and container connector (streamingCodecConnectors.ts).

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/IPMedia/StreamingBadges.tsx
 *
 * Badges for the stream and codec families, in the IP-media badge layout (`Badge`): a
 * ring in the family's colour, the family's glyph, the connector's short name as the
 * big text, and a caption that says which family it is. Plain names, no vendor logos —
 * the Dante badge's rule.
 *
 * Every connector gets its OWN component (`ipMedia.test.ts` asserts no two share one),
 * built by `badge()` from one row of `STREAMING_BADGE_ROWS` below.
 */

import React from 'react';
import { Badge } from './Badge';
import { Brackets, FanOut, Flow, Screen, Waveform } from './glyphs';
import { STREAMING_CODEC_GROUPS } from '../streamingCodecConnectors';

type GlyphFC = React.FC<{ c: string }>;

/** Per family: ring colour, caption and glyph. */
const FAMILY: Record<string, { accent: string; caption: string; glyph: GlyphFC }> = {
    'IP-Streaming': { accent: '#6a4c93', caption: 'STREAM', glyph: Flow },
    'AV-over-IP': { accent: '#d1495b', caption: 'AV / IP', glyph: Screen },
    'VoIP': { accent: '#2a9d8f', caption: 'VOIP', glyph: Waveform },
    'Codecs-Audio': { accent: '#e9a03b', caption: 'AUDIO', glyph: Waveform },
    'Codecs-Video': { accent: '#1d70a2', caption: 'VIDEO', glyph: Screen },
    'Codecs-Container': { accent: '#5c677d', caption: 'FILE', glyph: Brackets },
};

/** The one-to-many entries draw the fan-out, so a multicast feed reads as one at a glance. */
const MULTICAST = new Set(['UDP-MC', 'RTP-MC', 'SAP']);

/** Short words where the abbreviation is too long, or not what a label says. */
const WORD: Record<string, string> = {
    'MPEG-DASH': 'DASH', 'WEBRTC': 'WebRTC', 'UDP-MC': 'UDP MC', 'RTP-MC': 'RTP MC', 'MPEG-TS-UDP': 'TS/UDP',
    'QSYS-AV': 'Q-SYS', 'AES67-L24': 'L24', 'WAVPACK': 'WvPk', 'EVS-VOICE': 'EVS', 'MPEG-4-P2': 'MP4 P2',
    'SORENSON': 'Sorens', 'JPEG2000': 'J2K', 'PRORES': 'ProRes', 'PRORES-RAW': 'PR RAW', 'CINEFORM': 'CineFm',
    'AVC-INTRA': 'AVC-I', 'VORBIS': 'Vorbis', 'NDI-HX': 'NDI HX',
};

const badge = (abbreviation: string, family: string): React.FC => {
    const f = FAMILY[family];
    const Glyph: GlyphFC = MULTICAST.has(abbreviation) ? FanOut : f.glyph;
    const Icon: React.FC = () => (
        <Badge accent={f.accent} glyph={<Glyph c={f.accent} />} big={WORD[abbreviation] ?? abbreviation} bigSize={24} caption={f.caption} />
    );
    Icon.displayName = `StreamingBadge(${abbreviation})`;
    return Icon;
};

/** Abbreviation → its badge, for every entry in the six families. */
export const STREAMING_ICONS: Record<string, React.FC> = Object.fromEntries(
    STREAMING_CODEC_GROUPS.flatMap(g => g.connectors.map(c => [c.abbreviation, badge(c.abbreviation, g.name)])),
);
