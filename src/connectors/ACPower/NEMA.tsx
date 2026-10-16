// Copyright (c) 2026 oneDiversified.

import React from 'react';

/** NEMA 5-15/5-20 standard AC outlet — two vertical slots and D-shaped ground. */
const NEMA: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        {/* Blue outer ring */}
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
        {/* Face plate */}
        <circle cx="60" cy="60" r="42" fill="#e0e4e8" stroke="#cbd5e1" strokeWidth="2" />
        <circle cx="60" cy="60" r="32" fill="#f1f5f9" />
        {/* Neutral Slot (Left, wider) */}
        <rect x="44" y="44" width="6" height="18" fill="#1e293b" rx="2" />
        {/* Hot Slot (Right, standard) */}
        <rect x="70" y="44" width="6" height="14" fill="#1e293b" rx="2" />
        {/* Ground Pin (Bottom D-Shape) */}
        <path d="M 54 74 L 66 74 A 6 6 0 0 1 66 86 L 54 86 A 6 6 0 0 1 54 74 Z" fill="#1e293b" />
    </svg>
);

export default NEMA;
