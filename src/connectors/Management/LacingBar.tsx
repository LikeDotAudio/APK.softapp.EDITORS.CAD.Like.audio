// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-08-14 11:30 - created: lacing bar management feature (FEATURE-202608132265)

/**
 * Lacing bar — a bar on two standoffs, set off the panel face so a bundle can be
 * laced to it with waxed twine or ties. Not a connector: no signal, no port.
 */

import React from 'react';

const LacingBar: React.FC = () => (
    <svg viewBox="0 0 48 32" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* Panel face */}
        <rect x="1" y="1" width="46" height="30" rx="3" fill="#2b2b2b" stroke="#555" strokeWidth="1" />
        {/* Standoffs holding the bar off the face */}
        <rect x="9" y="12" width="4" height="12" rx="1" fill="#6b7075" />
        <rect x="35" y="12" width="4" height="12" rx="1" fill="#6b7075" />
        {/* The bar itself */}
        <rect x="6" y="13" width="36" height="4.5" rx="2.2" fill="#9aa0a6" />
        {/* A lace looped over the bar */}
        <path d="M20 13 Q18 20 24 22 Q30 20 28 13" fill="none" stroke="#c8a45a" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
);

export default LacingBar;
