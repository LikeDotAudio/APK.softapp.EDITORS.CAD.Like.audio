// Copyright (c) 2026 oneDiversified.

import React from 'react';

/** TOSLINK optical digital audio socket with red laser glow. */
const TOSLINK: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
            <radialGradient id="tl_redLaser" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ff3333" stopOpacity="1" />
                <stop offset="35%" stopColor="#ff0000" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ff0000" stopOpacity="0" />
            </radialGradient>
        </defs>
        {/* Blue outer ring */}
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        <circle cx="60" cy="60" r="50" fill="#1a1a1a" />
            <g transform="translate(60,60) scale(1.15) translate(-60,-60)">
        {/* Outer Square Body */}
        <rect x="25" y="25" width="70" height="70" rx="4" fill="#222222" stroke="#444" strokeWidth="2" />
        {/* Alignment Notches */}
        <rect x="45" y="20" width="30" height="10" fill="#111" rx="1" />
        <rect x="45" y="90" width="30" height="10" fill="#111" rx="1" />
        <rect x="20" y="45" width="10" height="30" fill="#111" rx="1" />
        <rect x="90" y="45" width="10" height="30" fill="#111" rx="1" />
        {/* Inner D-Shape Cavity */}
        <path d="M 35 45 L 85 45 L 85 70 C 85 85 75 85 60 85 C 45 85 35 85 35 70 Z" fill="#050505" />
        {/* Optical Lens */}
        <circle cx="60" cy="60" r="8" fill="#1a1a1a" stroke="#333" strokeWidth="1" />
        {/* Red Laser Glow */}
        <circle cx="60" cy="60" r="16" fill="url(#tl_redLaser)" />
        <circle cx="60" cy="60" r="2" fill="#ffffff" />
            </g>
    </svg>
);

export default TOSLINK;
