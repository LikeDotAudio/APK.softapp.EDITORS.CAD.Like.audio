// Copyright (c) 2026 oneDiversified.

import React from 'react';

/** HDMI Type-A — trapezoidal port with 19 gold pins in two dash-pattern rows. */
const HDMI: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.1) translate(-60,-60)">
        {/* Outer shell (trapezoid with rounded top, angled bottom) */}
        <path d="M 20 44 L 100 44 C 102.2 44 104 45.8 104 48 L 104 56 L 90 74 L 30 74 L 16 56 L 16 48 C 16 45.8 17.8 44 20 44 Z" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />
        {/* Dark cavity */}
        <path d="M 23 47 L 97 47 L 99 55 L 87 71 L 33 71 L 21 55 Z" fill="#0f172a" />
        {/* Pin block area */}
        <path d="M 25 54 L 95 54 L 95 56 L 85 68 L 35 68 L 25 56 Z" fill="#334155" />
        {/* Top row pins (dash pattern) */}
        <rect x="33" y="50" width="34" height="4" fill="transparent" stroke="#eab308" strokeDasharray="2 2" strokeWidth="4" />
        {/* Bottom row pins (dash pattern) */}
        <rect x="53" y="50" width="34" height="4" fill="transparent" stroke="#eab308" strokeDasharray="2 2" strokeWidth="4" />
    
            </g>
        </svg>
);

export default HDMI;
