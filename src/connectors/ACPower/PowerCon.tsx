// Copyright (c) 2026 oneDiversified.

import React from 'react';

/** Neutrik PowerCon 20A Blue — circular locking power connector with 3 blade contacts. */
const PowerCon: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        {/* Blue outer ring */}
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
        {/* Blue Barrel */}
        <circle cx="60" cy="60" r="42" fill="#0055a4" />
        <circle cx="60" cy="60" r="32" fill="#003d7a" />
        <circle cx="60" cy="60" r="28" fill="#1e293b" />
        {/* Latch top */}
        <rect x="52" y="16" width="16" height="8" fill="#cbd5e1" rx="2" />
        {/* Keyways */}
        <rect x="56" y="32" width="8" height="6" fill="#0f172a" />
        <rect x="42" y="70" width="6" height="6" fill="#0f172a" />
        {/* 3 Blade Contacts */}
        <path d="M 56 46 L 64 46 L 62 54 L 58 54 Z" fill="#cbd5e1" />
        <path d="M 44 64 L 50 68 L 46 74 L 40 70 Z" fill="#cbd5e1" />
        <path d="M 76 64 L 70 68 L 74 74 L 80 70 Z" fill="#cbd5e1" />
    </svg>
);

export default PowerCon;
