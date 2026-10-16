// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-08-14 11:30 - created: cable holder (open D-bracket) management feature (FEATURE-202608132265)

/**
 * Cable holder — an open bracket screwed to the panel face that a bundle drops
 * into from above. Not a connector: it carries no signal and produces no port.
 */

import React from 'react';

const CableHolder: React.FC = () => (
    <svg viewBox="0 0 48 32" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* Panel face behind the bracket */}
        <rect x="1" y="1" width="46" height="30" rx="3" fill="#2b2b2b" stroke="#555" strokeWidth="1" />
        {/* The open bracket — two uprights and a floor, open at the top */}
        <path
            d="M13 7 L13 23 Q13 26 16 26 L32 26 Q35 26 35 23 L35 7"
            fill="none" stroke="#9aa0a6" strokeWidth="3.2" strokeLinecap="round"
        />
        {/* Mounting feet */}
        <circle cx="9" cy="8" r="1.8" fill="#6b7075" />
        <circle cx="39" cy="8" r="1.8" fill="#6b7075" />
    </svg>
);

export default CableHolder;
