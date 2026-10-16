// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-08-14 11:30 - created: D-ring management feature (FEATURE-202608132265)

/**
 * D-ring — a closed D-shaped ring on a mounting plate. A bundle is routed through
 * the ring rather than laid in it, so it cannot lift out. No signal, no port.
 */

import React from 'react';

const DRing: React.FC = () => (
    <svg viewBox="0 0 48 32" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* Panel face */}
        <rect x="1" y="1" width="46" height="30" rx="3" fill="#2b2b2b" stroke="#555" strokeWidth="1" />
        {/* Mounting plate */}
        <rect x="6" y="10" width="6" height="12" rx="1.5" fill="#6b7075" stroke="#8a9095" strokeWidth="0.6" />
        <circle cx="9" cy="13.5" r="1.1" fill="#2b2b2b" />
        <circle cx="9" cy="18.5" r="1.1" fill="#2b2b2b" />
        {/* The D — flat against the plate, bowed away from it */}
        <path
            d="M12 8 L12 24 Q34 24 34 16 Q34 8 12 8 Z"
            fill="none" stroke="#9aa0a6" strokeWidth="3" strokeLinejoin="round"
        />
    </svg>
);

export default DRing;
