// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-03 - created: SMPTE ST 2110 / ST 2022-7 essence badges for IP-media connectors.
//   2026-10-03 - every part illustrated: essence glyph (screen / waveform / {} / clock /
//                dual path), -21/-22/-23 captions, and audio TX/RX variants lead with a
//                large channel count plus a fan-out (TX) or ear (RX) glyph.

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/IPMedia/ST2110.tsx
 *
 * SMPTE ST 2110 badge family. The ring colour and glyph encode the essence
 * carried by the part (video / audio / data / timing); ST 2022-7 is the
 * protection (seamless switching) badge. Audio sender/receiver variants make
 * the channel count the dominant text.
 */

import React from 'react';
import { Badge } from './Badge';
import { Brackets, Clock, DirGlyph, DualPath, parseDirSub, Screen, Waveform } from './glyphs';

export type ST2110Essence = 'video' | 'audio' | 'data' | 'timing' | 'protection';

const ESSENCE_COLORS: Record<ST2110Essence, string> = {
    video: '#2a75d3',
    audio: '#2a9d3a',
    data: '#d4872a',
    timing: '#6c757d',
    protection: '#8e44ad',
};

const ESSENCE_GLYPHS: Record<ST2110Essence, React.FC<{ c: string }>> = {
    video: Screen,
    audio: Waveform,
    data: Brackets,
    timing: Clock,
    protection: DualPath,
};

/** Default small caption for parts that need telling apart beyond the number. */
const PART_CAPTIONS: Record<string, string> = {
    '21': 'N/NL/W',
    '22': 'JPEG XS',
    '23': 'multi -20',
};

/** Essence implied by an ST 2110 part ("-20", "20", "2022-7"). */
export function st2110Essence(part: string): ST2110Essence {
    const p = part.trim();
    if (p.includes('2022')) return 'protection';
    const n = p.replace(/^-/, '');
    if (n.startsWith('1')) return 'timing';
    if (n.startsWith('2')) return 'video';
    if (n.startsWith('3')) return 'audio';
    return 'data';
}

const ST2110Base: React.FC<{ part: string; sub?: string }> = ({ part, sub }) => {
    const essence = st2110Essence(part);
    const accent = ESSENCE_COLORS[essence];
    const num = part.replace(/^-/, '');
    const { dir, count } = parseDirSub(sub);

    if (dir && count) {
        return (
            <Badge accent={accent} header={`2110-${num}`} glyph={<DirGlyph dir={dir} c={accent} />}
                big={count} bigSize={40} caption={dir.toUpperCase()} />
        );
    }
    const isProtection = essence === 'protection';
    const Glyph = ESSENCE_GLYPHS[essence];
    return (
        <Badge
            accent={accent}
            header={isProtection ? 'ST 2022' : 'ST 2110'}
            glyph={dir ? <DirGlyph dir={dir} c={accent} /> : <Glyph c={accent} />}
            big={isProtection ? '-7' : `-${num}`}
            bigSize={32}
            caption={sub ?? PART_CAPTIONS[num]}
        />
    );
};

const ST2110_10: React.FC = () => <ST2110Base part="-10" />;
const ST2110_20: React.FC = () => <ST2110Base part="-20" />;
const ST2110_21: React.FC = () => <ST2110Base part="-21" />;
const ST2110_22: React.FC = () => <ST2110Base part="-22" />;
const ST2110_23: React.FC = () => <ST2110Base part="-23" />;
const ST2110_30: React.FC = () => <ST2110Base part="-30" />;
const ST2110_31: React.FC = () => <ST2110Base part="-31" />;
const ST2110_40: React.FC = () => <ST2110Base part="-40" />;
const ST2110_41: React.FC = () => <ST2110Base part="-41" />;
const ST2110_43: React.FC = () => <ST2110Base part="-43" />;
const ST2022_7: React.FC = () => <ST2110Base part="2022-7" />;
const ST2110_30_TX2: React.FC = () => <ST2110Base part="-30" sub="TX 2" />;
const ST2110_30_TX8: React.FC = () => <ST2110Base part="-30" sub="TX 8" />;
const ST2110_30_TX16: React.FC = () => <ST2110Base part="-30" sub="TX 16" />;
const ST2110_30_RX2: React.FC = () => <ST2110Base part="-30" sub="RX 2" />;
const ST2110_30_RX8: React.FC = () => <ST2110Base part="-30" sub="RX 8" />;
const ST2110_30_RX16: React.FC = () => <ST2110Base part="-30" sub="RX 16" />;

export default ST2110_20;
export {
    ST2110Base,
    ST2110_10, ST2110_20, ST2110_21, ST2110_22, ST2110_23,
    ST2110_30, ST2110_31, ST2110_40, ST2110_41, ST2110_43, ST2022_7,
    ST2110_30_TX2, ST2110_30_TX8, ST2110_30_TX16,
    ST2110_30_RX2, ST2110_30_RX8, ST2110_30_RX16,
};
