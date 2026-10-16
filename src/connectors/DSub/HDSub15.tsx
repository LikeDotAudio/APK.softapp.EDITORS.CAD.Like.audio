// Copyright (c) 2026 oneDiversified.

/**
 * HD (high-density) D-subminiature connector icon.
 * D-shape trapezoid with 3 rows of 5 pins each, blue-tinted insulator,
 * metallic shell and hex standoff screw holes.
 * Red pin-count label at top. Parameterized by pinCount.
 */

import React from 'react';

const HDSub15: React.FC<{ pinCount?: number }> = ({ pinCount = 15 }) => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
            <linearGradient id="hd15-shell" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e0e0e0" />
                <stop offset="40%" stopColor="#c0c0c0" />
                <stop offset="100%" stopColor="#808080" />
            </linearGradient>
            <linearGradient id="hd15-shellEdge" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d0d0d0" />
                <stop offset="100%" stopColor="#707070" />
            </linearGradient>
            <radialGradient id="hd15-pin" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#ffe680" />
                <stop offset="100%" stopColor="#b8860b" />
            </radialGradient>
            <radialGradient id="hd15-screw" cx="40%" cy="35%" r="60%">
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
            d="M 15 40 L 105 40 L 95 80 L 25 80 Z"
            fill="url(#hd15-shell)"
            stroke="url(#hd15-shellEdge)"
            strokeWidth={1.5}
            strokeLinejoin="round"
        />
        {/* Shell inner bevel */}
        <path
            d="M 20 44 L 100 44 L 91 76 L 29 76 Z"
            fill="none"
            stroke="#aaa"
            strokeWidth={0.5}
        />
        {/* Blue-tinted insulator cavity (classic VGA blue) */}
        <path
            d="M 28 47 L 92 47 L 85 73 L 35 73 Z"
            fill="#1a3a6e"
            stroke="#0d2550"
            strokeWidth={0.5}
        />
        {/* Top row — 5 pins */}
        {[0, 1, 2, 3, 4].map(i => (
            <circle
                key={`t${i}`}
                cx={42 + i * 9}
                cy={53}
                r={2.4}
                fill="url(#hd15-pin)"
            />
        ))}
        {/* Middle row — 5 pins */}
        {[0, 1, 2, 3, 4].map(i => (
            <circle
                key={`m${i}`}
                cx={43 + i * 8.5}
                cy={60.5}
                r={2.4}
                fill="url(#hd15-pin)"
            />
        ))}
        {/* Bottom row — 5 pins */}
        {[0, 1, 2, 3, 4].map(i => (
            <circle
                key={`b${i}`}
                cx={44 + i * 8}
                cy={68}
                r={2.4}
                fill="url(#hd15-pin)"
            />
        ))}
        {/* Left hex standoff screw */}
        <circle cx="20" cy="60" r="6" fill="url(#hd15-screw)" />
        <circle cx="20" cy="60" r="3.5" fill="#888" />
        <line x1="18" y1="60" x2="22" y2="60" stroke="#555" strokeWidth={1} />
        <line x1="20" y1="58" x2="20" y2="62" stroke="#555" strokeWidth={1} />
        {/* Right hex standoff screw */}
        <circle cx="100" cy="60" r="6" fill="url(#hd15-screw)" />
        <circle cx="100" cy="60" r="3.5" fill="#888" />
        <line x1="98" y1="60" x2="102" y2="60" stroke="#555" strokeWidth={1} />
        <line x1="100" y1="58" x2="100" y2="62" stroke="#555" strokeWidth={1} />

            </g>
        </svg>
);

export default HDSub15;

export const HDSub26: React.FC = () => <HDSub15 pinCount={26} />;
export const HDSub44: React.FC = () => <HDSub15 pinCount={44} />;
export const HDSub62: React.FC = () => <HDSub15 pinCount={62} />;
export const HDSub78: React.FC = () => <HDSub15 pinCount={78} />;
export const HDSub100: React.FC = () => <HDSub15 pinCount={100} />;
