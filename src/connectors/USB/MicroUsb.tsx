// Copyright (c) 2026 oneDiversified.

import React from 'react';

/** Micro USB Type-B — thin trapezoidal shield, 5 gold pins, white inner block. */
const MicroUsb: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.3) translate(-60,-60)">
        {/* Outer shield (trapezoid) */}
        <path d="M 35 50 L 85 50 L 95 65 L 95 70 L 25 70 L 25 65 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
        {/* Dark cavity */}
        <path d="M 38 53 L 82 53 L 90 64 L 90 67 L 30 67 L 30 64 Z" fill="#0f172a" />
        {/* White inner block */}
        <rect x="34" y="62" width="52" height="5" fill="#f8fafc" />
        {/* 5 Gold pins */}
        <rect x="38" y="62" width="4" height="5" fill="#eab308" />
        <rect x="48" y="62" width="4" height="5" fill="#eab308" />
        <rect x="58" y="62" width="4" height="5" fill="#eab308" />
        <rect x="68" y="62" width="4" height="5" fill="#eab308" />
        <rect x="78" y="62" width="4" height="5" fill="#eab308" />
    
            </g>
        </svg>
);

export default MicroUsb;
