// Copyright (c) 2026 oneDiversified.

import React from 'react';

/** USB Type-B — chamfered top corners, dark cavity, inner block with 4 gold pins. */
const UsbB: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.2) translate(-60,-60)">
        {/* Outer shield (chamfered top) */}
        <path d="M 45 35 L 75 35 L 85 45 L 85 85 L 35 85 L 35 45 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
        {/* Dark cavity */}
        <path d="M 47 38 L 73 38 L 81 46 L 81 81 L 39 81 L 39 46 Z" fill="#0f172a" />
        {/* Inner block */}
        <rect x="45" y="45" width="30" height="30" fill="#1e293b" />
        {/* 4 Gold pins (2x2) */}
        <rect x="50" y="50" width="5" height="5" fill="#eab308" />
        <rect x="65" y="50" width="5" height="5" fill="#eab308" />
        <rect x="50" y="65" width="5" height="5" fill="#eab308" />
        <rect x="65" y="65" width="5" height="5" fill="#eab308" />
    
            </g>
        </svg>
);

export default UsbB;
