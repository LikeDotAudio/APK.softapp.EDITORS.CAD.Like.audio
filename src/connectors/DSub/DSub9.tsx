// Copyright (c) 2026 oneDiversified.

/**
 * DB9 (DE-9) D-subminiature connector icon.
 * Trapezoidal metallic shell with 2 rows of pins (5 top, 4 bottom)
 * and hex standoff screw holes on each side.
 * Red pin-count label at top.
 */

import React from 'react';

const DSub9: React.FC<{ pinCount?: number }> = ({ pinCount = 9 }) => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
            <linearGradient id="db9-shell" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e0e0e0" />
                <stop offset="40%" stopColor="#c0c0c0" />
                <stop offset="100%" stopColor="#808080" />
            </linearGradient>
            <linearGradient id="db9-shellEdge" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d0d0d0" />
                <stop offset="100%" stopColor="#707070" />
            </linearGradient>
            <radialGradient id="db9-pin" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#ffe680" />
                <stop offset="100%" stopColor="#b8860b" />
            </radialGradient>
            <radialGradient id="db9-screw" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#cccccc" />
                <stop offset="100%" stopColor="#666666" />
            </radialGradient>
        </defs>
        {/* Blue outer ring */}
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        {/* Light inner circle */}
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
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
            <g transform="translate(60,60) scale(1.1) translate(-60,-60)">
        {/* Metallic shell — D-shape trapezoid */}
        <path
            d="M 15 42 L 105 42 L 95 78 L 25 78 Z"
            fill="url(#db9-shell)"
            stroke="url(#db9-shellEdge)"
            strokeWidth={1.5}
            strokeLinejoin="round"
        />
        {/* Shell inner bevel */}
        <path
            d="M 20 46 L 100 46 L 91 74 L 29 74 Z"
            fill="none"
            stroke="#aaa"
            strokeWidth={0.5}
        />
        {/* Dark insulator cavity */}
        <path
            d="M 30 48 L 90 48 L 83 72 L 37 72 Z"
            fill="#1a1a2e"
            stroke="#333"
            strokeWidth={0.5}
        />
        {/* Top row — 5 pins */}
        {[0, 1, 2, 3, 4].map(i => (
            <circle
                key={`t${i}`}
                cx={42 + i * 9}
                cy={55}
                r={2.8}
                fill="url(#db9-pin)"
            />
        ))}
        {/* Bottom row — 4 pins */}
        {[0, 1, 2, 3].map(i => (
            <circle
                key={`b${i}`}
                cx={46.5 + i * 9}
                cy={66}
                r={2.8}
                fill="url(#db9-pin)"
            />
        ))}
        {/* Left hex standoff screw */}
        <circle cx="20" cy="60" r="6" fill="url(#db9-screw)" />
        <circle cx="20" cy="60" r="3.5" fill="#888" />
        <line x1="18" y1="60" x2="22" y2="60" stroke="#555" strokeWidth={1} />
        <line x1="20" y1="58" x2="20" y2="62" stroke="#555" strokeWidth={1} />
        {/* Right hex standoff screw */}
        <circle cx="100" cy="60" r="6" fill="url(#db9-screw)" />
        <circle cx="100" cy="60" r="3.5" fill="#888" />
        <line x1="98" y1="60" x2="102" y2="60" stroke="#555" strokeWidth={1} />
        <line x1="100" y1="58" x2="100" y2="62" stroke="#555" strokeWidth={1} />

            </g>
        </svg>
);

export default DSub9;
