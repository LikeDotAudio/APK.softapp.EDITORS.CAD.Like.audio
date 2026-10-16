// Copyright (c) 2026 oneDiversified.

import React from 'react';

/** USB Type-A — rectangular shield, white insulator top, 4 gold contacts bottom, dark cavity. */
const UsbA: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.35) translate(-60,-60)">
        {/* Outer shield */}
        <rect x="25" y="45" width="70" height="30" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" rx="2" />
        {/* White insulator top half */}
        <rect x="27" y="47" width="66" height="14" fill="#f8fafc" />
        {/* Dark cavity bottom */}
        <rect x="27" y="61" width="66" height="12" fill="#0f172a" />
        {/* 4 Gold contacts */}
        <rect x="34" y="61" width="6" height="8" fill="#eab308" />
        <rect x="48" y="61" width="6" height="8" fill="#eab308" />
        <rect x="66" y="61" width="6" height="8" fill="#eab308" />
        <rect x="80" y="61" width="6" height="8" fill="#eab308" />
    
            </g>
        </svg>
);

export default UsbA;
