// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-03 - created: flow-direction and essence glyphs for the IPMedia badges.

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/IPMedia/glyphs.tsx
 *
 * Small pictograms drawn in a 24x24 box (see Badge's GlyphSlot). Heavy
 * strokes and fills so each stays distinct at a 40px icon size:
 * fan-out (multicast sender), ear (receiver), flow (unicast), interop,
 * L2 switch, and the ST 2110 essences (screen, waveform, brackets, clock,
 * dual path).
 */

import React from 'react';

type G = React.FC<{ c: string }>;

/** Filled arrowhead at (x2, y2) pointing away from (x1, y1). */
export function arrowHead(x1: number, y1: number, x2: number, y2: number, len = 5, half = 3.5): string {
    const d = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ux = (x2 - x1) / d, uy = (y2 - y1) / d;
    const bx = x2 - ux * len, by = y2 - uy * len;
    return `${x2},${y2} ${bx - uy * half},${by + ux * half} ${bx + uy * half},${by - ux * half}`;
}

const Arrow: React.FC<{ c: string; x1: number; y1: number; x2: number; y2: number }> = ({ c, x1, y1, x2, y2 }) => {
    const d = Math.hypot(x2 - x1, y2 - y1);
    const ex = x2 - ((x2 - x1) / d) * 4, ey = y2 - ((y2 - y1) / d) * 4;
    return (
        <g>
            <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={c} strokeWidth="2.4" strokeLinecap="round" />
            <polygon points={arrowHead(x1, y1, x2, y2)} fill={c} />
        </g>
    );
};

/** Multicast sender: one dot branching to three outward arrows. */
export const FanOut: G = ({ c }) => (
    <g>
        <circle cx="3.5" cy="12" r="3" fill={c} />
        <line x1="3.5" y1="12" x2="10" y2="12" stroke={c} strokeWidth="2.4" />
        <Arrow c={c} x1={10} y1={12} x2={22} y2={3} />
        <Arrow c={c} x1={10} y1={12} x2={23} y2={12} />
        <Arrow c={c} x1={10} y1={12} x2={22} y2={21} />
    </g>
);

/** Receiver: an inward arrow into a dot cupped by an "ear" arc. */
export const EarIn: G = ({ c }) => (
    <g>
        <Arrow c={c} x1={1} y1={12} x2={12} y2={12} />
        <circle cx="16" cy="12" r="3.2" fill={c} />
        <path d="M17,4 A8,8 0 0 1 17,20" fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round" />
    </g>
);

/** Unicast flow: source dot, one arrow, sink dot. */
export const Flow: G = ({ c }) => (
    <g>
        <circle cx="3.5" cy="12" r="3" fill={c} />
        <Arrow c={c} x1={6} y1={12} x2={17} y2={12} />
        <rect x="18" y="8" width="5" height="8" rx="1" fill={c} />
    </g>
);

/** Interop bridge: arrows both ways between two domains. */
export const Interop: G = ({ c }) => (
    <g>
        <Arrow c={c} x1={3} y1={8} x2={21} y2={8} />
        <Arrow c={c} x1={21} y1={16} x2={3} y2={16} />
    </g>
);

/** Layer-2 switch: chassis with ports and three uplinks. */
export const L2Switch: G = ({ c }) => (
    <g>
        <rect x="2" y="9" width="20" height="11" rx="2" fill={c} />
        {[5, 9.5, 14, 18.5].map(x => <rect key={x} x={x - 1.5} y="14" width="3" height="3.5" fill="#f8f9fa" />)}
        {[6, 12, 18].map(x => <line key={x} x1={x} y1="9" x2={x} y2="3" stroke={c} strokeWidth="2.2" />)}
    </g>
);

export const Screen: G = ({ c }) => (
    <g>
        <rect x="2" y="3" width="20" height="14" rx="2" fill="none" stroke={c} strokeWidth="2.4" />
        <polygon points="10,6.5 10,13.5 15.5,10" fill={c} />
        <line x1="12" y1="17" x2="12" y2="21" stroke={c} strokeWidth="2.4" />
        <line x1="7" y1="21.5" x2="17" y2="21.5" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
    </g>
);

export const Waveform: G = ({ c }) => (
    <g stroke={c} strokeWidth="2.8" strokeLinecap="round">
        {[[3, 4], [7.5, 10], [12, 18], [16.5, 12], [21, 5]].map(([x, h]) => (
            <line key={x} x1={x} y1={12 - h / 2} x2={x} y2={12 + h / 2} />
        ))}
    </g>
);

export const Brackets: G = ({ c }) => (
    <g fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round">
        <path d="M9,2 C5,2 7,10 3,12 C7,14 5,22 9,22" />
        <path d="M15,2 C19,2 17,10 21,12 C17,14 19,22 15,22" />
        <circle cx="12" cy="12" r="1.6" fill={c} stroke="none" />
    </g>
);

export const Clock: G = ({ c }) => (
    <g stroke={c} strokeLinecap="round">
        <circle cx="12" cy="12" r="9.5" fill="none" strokeWidth="2.4" />
        <line x1="12" y1="12" x2="12" y2="5.5" strokeWidth="2.4" />
        <line x1="12" y1="12" x2="16.5" y2="14.5" strokeWidth="2.4" />
    </g>
);

/** ST 2022-7: two parallel (red / blue) paths. */
export const DualPath: G = () => (
    <g strokeWidth="3.2" strokeLinecap="round">
        <line x1="2" y1="7" x2="22" y2="7" stroke="#d63031" />
        <line x1="2" y1="17" x2="22" y2="17" stroke="#2a75d3" />
        <circle cx="2.5" cy="7" r="2.5" fill="#d63031" />
        <circle cx="2.5" cy="17" r="2.5" fill="#2a75d3" />
    </g>
);

/** Sender gets the fan-out, receiver the ear. */
export const DirGlyph: React.FC<{ dir: 'tx' | 'rx'; c: string }> = ({ dir, c }) =>
    dir === 'tx' ? <FanOut c={c} /> : <EarIn c={c} />;

/** Parses captions like "TX 8" / "RX16" / "RX". */
export function parseDirSub(sub?: string): { dir?: 'tx' | 'rx'; count?: string } {
    const m = sub?.trim().match(/^(TX|RX)\s*(\d+)?$/i);
    if (!m) return {};
    return { dir: m[1].toLowerCase() as 'tx' | 'rx', count: m[2] };
}
