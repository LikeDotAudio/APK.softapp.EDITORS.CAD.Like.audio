// Copyright (c) 2026 oneDiversified.

/**
 * Speakon connector family — parameterized by pole count (2, 4, 8).
 * Each variant shows the correct number of contacts.
 */

import React from 'react';

/** Contact positions: [cx, cy, width, height, isVertical] */
type Contact = { cx: number; cy: number; vertical: boolean };

const CONTACT_LAYOUTS: Record<number, Contact[]> = {
    2: [
        { cx: 60, cy: 26, vertical: false },  // top
        { cx: 60, cy: 93, vertical: false },  // bottom
    ],
    4: [
        { cx: 60, cy: 26, vertical: false },  // top
        { cx: 60, cy: 93, vertical: false },  // bottom
        { cx: 26, cy: 60, vertical: true },   // left
        { cx: 93, cy: 60, vertical: true },   // right
    ],
    8: [
        { cx: 60, cy: 26, vertical: false },  // top
        { cx: 60, cy: 93, vertical: false },  // bottom
        { cx: 26, cy: 60, vertical: true },   // left
        { cx: 93, cy: 60, vertical: true },   // right
        { cx: 36, cy: 36, vertical: false },  // top-left
        { cx: 84, cy: 36, vertical: false },  // top-right
        { cx: 36, cy: 84, vertical: false },  // bottom-left
        { cx: 84, cy: 84, vertical: false },  // bottom-right
    ],
};

const SpeakonBase: React.FC<{ poles: number; showTab?: boolean }> = ({ poles, showTab = true }) => {
    const contacts = CONTACT_LAYOUTS[poles] ?? CONTACT_LAYOUTS[4];
    const pfx = `spk${poles}`;

    return (
        <svg viewBox="0 0 120 120" width="100%" height="100%">
            <defs>
                <linearGradient id={`${pfx}-plasticOuter`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#444" />
                    <stop offset="50%" stopColor="#2a2a2a" />
                    <stop offset="100%" stopColor="#111" />
                </linearGradient>
                <linearGradient id={`${pfx}-metalLatch`} x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fff" />
                    <stop offset="50%" stopColor="#ccc" />
                    <stop offset="100%" stopColor="#888" />
                </linearGradient>
            </defs>
            {/* Outer ring */}
            <circle cx="60" cy="60" r="54" fill="#2a75d3" />
            {/* Plastic shell */}
            <circle cx="60" cy="60" r="50" fill={`url(#${pfx}-plasticOuter)`} />
            <g transform="translate(60,60) scale(1.05) translate(-60,-60)">
            <circle cx="60" cy="60" r="46" fill="#1a1a1a" />
            {/* Latch tab — only on plug (P) variants */}
            {showTab && <>
            <rect x="46" y="6" width="28" height="14" rx="3" fill={`url(#${pfx}-metalLatch)`} />
            <line x1="50" y1="10" x2="70" y2="10" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="50" y1="14" x2="70" y2="14" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
            </>}
            {/* Recessed cavity */}
            <circle cx="60" cy="60" r="36" fill="#050505" />
            {/* Contact slots and metal contacts */}
            {contacts.map((c, i) => {
                const w = c.vertical ? 5 : 10;
                const h = c.vertical ? 10 : 5;
                return (
                    <g key={i}>
                        <rect x={c.cx - w / 2 - 1} y={c.cy - h / 2 - 1} width={w + 2} height={h + 2} fill="#050505" />
                        <rect x={c.cx - w / 2} y={c.cy - h / 2} width={w} height={h} rx="1" fill="#eee" />
                    </g>
                );
            })}
            {/* Inner hub */}
            <circle cx="60" cy="60" r={poles <= 4 ? 22 : 18} fill={`url(#${pfx}-plasticOuter)`} />
            <circle cx="60" cy="60" r={poles <= 4 ? 18 : 14} fill="#111" />
            <circle cx="60" cy="60" r="6" fill="#000" />
            {/* Pole count watermark */}
            <text
                x="60" y="60"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#2a75d3"
                fontWeight="bold"
                fontSize="28"
                fontFamily="monospace"
            >
                {poles}
            </text>
            </g>
        </svg>
    );
};

const Speakon2P: React.FC = () => <SpeakonBase poles={2} showTab />;
const Speakon2S: React.FC = () => <SpeakonBase poles={2} showTab={false} />;
const Speakon4P: React.FC = () => <SpeakonBase poles={4} showTab />;
const Speakon4S: React.FC = () => <SpeakonBase poles={4} showTab={false} />;
const Speakon8P: React.FC = () => <SpeakonBase poles={8} showTab />;
const Speakon8S: React.FC = () => <SpeakonBase poles={8} showTab={false} />;

// Legacy aliases
const Speakon2 = Speakon2P;
const Speakon4 = Speakon4P;
const Speakon8 = Speakon8P;

export default Speakon4;
export { Speakon2, Speakon4, Speakon8, Speakon2P, Speakon2S, Speakon4P, Speakon4S, Speakon8P, Speakon8S };
