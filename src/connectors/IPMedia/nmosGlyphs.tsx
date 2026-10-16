// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-03 - created: one distinct pictogram per NMOS spec / role.

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/IPMedia/nmosGlyphs.tsx
 *
 * NMOS glyphs in a 24x24 box: node, discovery magnifier (IS-04), connection
 * switch (IS-05), tally bell (IS-07), channel-map grid (IS-08), compatibility
 * tick (IS-11), padlock (BCP-003) and registry database with radar arcs.
 */

import React from 'react';

type G = React.FC<{ c: string }>;

const NodeG: G = ({ c }) => (
    <g>
        <g stroke={c} strokeWidth="2.4">
            <line x1="12" y1="4" x2="4" y2="19" /><line x1="12" y1="4" x2="20" y2="19" /><line x1="4" y1="19" x2="20" y2="19" />
        </g>
        <circle cx="12" cy="4" r="3.5" fill={c} /><circle cx="4" cy="19" r="3.5" fill={c} /><circle cx="20" cy="19" r="3.5" fill={c} />
    </g>
);

const Magnifier: G = ({ c }) => (
    <g stroke={c} strokeLinecap="round" fill="none">
        <circle cx="10" cy="10" r="7" strokeWidth="2.6" />
        <path d="M6.5,10 A3.5,3.5 0 0 1 10,6.5" strokeWidth="1.8" />
        <line x1="15" y1="15" x2="22" y2="22" strokeWidth="4" />
    </g>
);

const LinkSwitch: G = ({ c }) => (
    <g>
        <rect x="0.5" y="8" width="7" height="8" rx="1.5" fill={c} />
        <rect x="16.5" y="8" width="7" height="8" rx="1.5" fill={c} />
        <g stroke={c} strokeWidth="2.4" strokeLinecap="round">
            <line x1="7.5" y1="12" x2="9.5" y2="12" /><line x1="9.5" y1="12" x2="15" y2="5" /><line x1="15" y1="12" x2="16.5" y2="12" />
        </g>
        <circle cx="9.5" cy="12" r="1.8" fill={c} />
    </g>
);

const Bell: G = ({ c }) => (
    <g fill={c}>
        <path d="M4,18 L20,18 L17.5,15 L17.5,10 A5.5,5.5 0 0 0 6.5,10 L6.5,15 Z" />
        <circle cx="12" cy="20.5" r="2.2" />
        <circle cx="12" cy="3.5" r="1.5" />
    </g>
);

const MapGrid: G = ({ c }) => (
    <g>
        {[0, 1, 2].flatMap(r => [0, 1, 2].map(k => {
            const on = (r === 0 && k === 1) || (r === 1 && k === 0) || (r === 2 && k === 2);
            return (
                <rect key={`${r}${k}`} x={1.5 + k * 7.5} y={1.5 + r * 7.5} width="6" height="6" rx="1"
                    fill={on ? c : 'none'} stroke={c} strokeWidth="1.6" />
            );
        }))}
    </g>
);

const Tick: G = ({ c }) => (
    <g>
        <rect x="1.5" y="1.5" width="21" height="21" rx="4" fill="none" stroke={c} strokeWidth="2.2" />
        <polyline points="6,12.5 10.5,17 18.5,7" fill="none" stroke={c} strokeWidth="3.4"
            strokeLinecap="round" strokeLinejoin="round" />
    </g>
);

const Padlock: G = ({ c }) => (
    <g>
        <path d="M7.5,11 V7.5 A4.5,4.5 0 0 1 16.5,7.5 V11" fill="none" stroke={c} strokeWidth="2.8" />
        <rect x="4" y="11" width="16" height="12" rx="2" fill={c} />
        <circle cx="12" cy="16" r="2" fill="#f8f9fa" />
        <rect x="11.2" y="16" width="1.6" height="4" fill="#f8f9fa" />
    </g>
);

const Registry: G = ({ c }) => (
    <g>
        <path d="M1,5 V19 A6.5,2.5 0 0 0 14,19 V5 Z" fill={c} />
        <ellipse cx="7.5" cy="5" rx="6.5" ry="2.5" fill={c} stroke="#f8f9fa" strokeWidth="1.2" />
        <path d="M1,12 A6.5,2.5 0 0 0 14,12" fill="none" stroke="#f8f9fa" strokeWidth="1.2" />
        <g fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
            <path d="M17,8 A5,5 0 0 1 17,16" /><path d="M20,5 A9,9 0 0 1 20,19" />
        </g>
    </g>
);

/** Caption (upper case) -> glyph. Unknown captions fall back to the node. */
const NMOS_GLYPHS: Record<string, G> = {
    'NODE': NodeG, 'IS-04': Magnifier, 'IS-05': LinkSwitch, 'IS-07': Bell,
    'IS-08': MapGrid, 'IS-11': Tick, 'BCP-003': Padlock, 'REGISTRY': Registry,
};

export const NmosGlyph: React.FC<{ sub?: string; c: string }> = ({ sub, c }) => {
    const Glyph = NMOS_GLYPHS[(sub ?? 'NODE').toUpperCase()] ?? NodeG;
    return <Glyph c={c} />;
};
