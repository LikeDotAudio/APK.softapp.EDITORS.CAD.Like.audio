// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-06-06 23:10 - add `square` face frame (used by the A59 audio multipin; data D-subs stay round)

/**
 * D-subminiature connector icon (standard density).
 * Wider trapezoidal metallic shell with 2 rows of pins (13 top, 12 bottom)
 * and hex standoff screw holes on each side.
 * Red pin-count label at top. Parameterized by pinCount.
 */

import React from 'react';

const DSub25: React.FC<{ pinCount?: number; square?: boolean }> = ({ pinCount = 25, square }) => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
            <linearGradient id="db25-shell" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e0e0e0" />
                <stop offset="40%" stopColor="#c0c0c0" />
                <stop offset="100%" stopColor="#808080" />
            </linearGradient>
            <linearGradient id="db25-shellEdge" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d0d0d0" />
                <stop offset="100%" stopColor="#707070" />
            </linearGradient>
            <radialGradient id="db25-pin" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#ffe680" />
                <stop offset="100%" stopColor="#b8860b" />
            </radialGradient>
            <radialGradient id="db25-screw" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#cccccc" />
                <stop offset="100%" stopColor="#666666" />
            </radialGradient>
        </defs>
        {/* Face frame — square for audio multipins (A59), round for data D-subs */}
        {square ? (
            <>
                <rect x="6" y="6" width="108" height="108" rx="12" fill="#2a75d3" />
                <rect x="10" y="10" width="100" height="100" rx="9" fill="#f8f9fa" />
            </>
        ) : (
            <>
                <circle cx="60" cy="60" r="54" fill="#2a75d3" />
                <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            </>
        )}
        {/* Pin count label */}
        <text
            x="60" y="20"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#2a75d3"
            fontWeight="bold"
            fontSize="18"
            fontFamily="monospace"
        >
            {pinCount}
        </text>
            <g transform="translate(60,60) scale(1.05) translate(-60,-60)">
        {/* Metallic shell — wider D-shape trapezoid */}
        <path
            d="M 10 40 L 110 40 L 100 80 L 20 80 Z"
            fill="url(#db25-shell)"
            stroke="url(#db25-shellEdge)"
            strokeWidth={1.5}
            strokeLinejoin="round"
        />
        {/* Shell inner bevel */}
        <path
            d="M 15 44 L 105 44 L 96 76 L 24 76 Z"
            fill="none"
            stroke="#aaa"
            strokeWidth={0.5}
        />
        {/* Dark insulator cavity */}
        <path
            d="M 20 46 L 100 46 L 93 74 L 27 74 Z"
            fill="#1a1a2e"
            stroke="#333"
            strokeWidth={0.5}
        />
        {/* Top row — 13 pins */}
        {Array.from({ length: 13 }, (_, i) => (
            <circle
                key={`t${i}`}
                cx={25 + i * 5.4}
                cy={54}
                r={1.8}
                fill="url(#db25-pin)"
            />
        ))}
        {/* Bottom row — 12 pins */}
        {Array.from({ length: 12 }, (_, i) => (
            <circle
                key={`b${i}`}
                cx={27.7 + i * 5.4}
                cy={64}
                r={1.8}
                fill="url(#db25-pin)"
            />
        ))}
        {/* Left hex standoff screw */}
        <circle cx="15" cy="60" r="5.5" fill="url(#db25-screw)" />
        <circle cx="15" cy="60" r="3" fill="#888" />
        <line x1="13" y1="60" x2="17" y2="60" stroke="#555" strokeWidth={1} />
        <line x1="15" y1="58" x2="15" y2="62" stroke="#555" strokeWidth={1} />
        {/* Right hex standoff screw */}
        <circle cx="105" cy="60" r="5.5" fill="url(#db25-screw)" />
        <circle cx="105" cy="60" r="3" fill="#888" />
        <line x1="103" y1="60" x2="107" y2="60" stroke="#555" strokeWidth={1} />
        <line x1="105" y1="58" x2="105" y2="62" stroke="#555" strokeWidth={1} />

            </g>
        </svg>
);

export default DSub25;

export const DSub15: React.FC = () => <DSub25 pinCount={15} />;
export const DSub19: React.FC = () => <DSub25 pinCount={19} />;
export const DSub37: React.FC = () => <DSub25 pinCount={37} />;
export const DSub50: React.FC = () => <DSub25 pinCount={50} />;
