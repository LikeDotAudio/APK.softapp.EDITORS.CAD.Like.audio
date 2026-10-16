// Copyright (c) 2026 oneDiversified.

import React from 'react';

/** DisplayPort — asymmetrical keyway (flat left, chamfered right), 20 gold pins in two rows. */
const DisplayPort: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
        {/* Outer shield (flat left, angled bottom-right) — oversized to overhang circle */}
        <path d="M 12 38 L 108 38 L 108 58 L 88 82 L 12 82 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
        {/* Dark cavity */}
        <path d="M 16 42 L 104 42 L 104 56 L 86 78 L 16 78 Z" fill="#0f172a" />
        {/* Pin block */}
        <path d="M 22 54 L 100 54 L 100 58 L 84 74 L 22 74 Z" fill="#1e293b" />
        {/* Top row pins (dash pattern) */}
        <rect x="26" y="48" width="64" height="4" fill="transparent" stroke="#eab308" strokeDasharray="2 3" strokeWidth="4" />
        {/* Bottom row pins (dash pattern) */}
        <rect x="26" y="60" width="56" height="4" fill="transparent" stroke="#eab308" strokeDasharray="2 3" strokeWidth="4" />
    </svg>
);

export default DisplayPort;
