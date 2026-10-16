// Copyright (c) 2026 oneDiversified.

import React from 'react';

/** USB Type-C — pill-shaped reversible 24-pin connector with central pin board. */
const UsbC: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.3) translate(-60,-60)">
        {/* Outer pill */}
        <rect x="25" y="48" width="70" height="24" rx="12" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
        {/* Dark cavity */}
        <rect x="28" y="51" width="64" height="18" rx="9" fill="#0f172a" />
        {/* Central pin board */}
        <rect x="33" y="58" width="54" height="4" rx="1" fill="#1e293b" />
        {/* 24 Pins (top row, dash pattern) */}
        <rect x="35" y="57" width="50" height="1.5" fill="transparent" stroke="#eab308" strokeDasharray="2 2.1" strokeWidth="1.5" />
        {/* 24 Pins (bottom row, dash pattern) */}
        <rect x="35" y="61.5" width="50" height="1.5" fill="transparent" stroke="#eab308" strokeDasharray="2 2.1" strokeWidth="1.5" />
    
            </g>
        </svg>
);

export default UsbC;
