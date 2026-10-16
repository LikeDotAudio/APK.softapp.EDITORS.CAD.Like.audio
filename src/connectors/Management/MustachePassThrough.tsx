// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-08-14 11:30 - created: mustache pass-through management feature (FEATURE-202608132265)

/**
 * Mustache pass-through — two opposing curved fingers over a face cutout. Cables
 * pass front-to-back through the gap and the fingers stop them falling out.
 * Not a connector: it carries no signal and produces no port.
 */

import React from 'react';

const MustachePassThrough: React.FC = () => (
    <svg viewBox="0 0 48 32" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* Panel face */}
        <rect x="1" y="1" width="46" height="30" rx="3" fill="#2b2b2b" stroke="#555" strokeWidth="1" />
        {/* The cutout the cables pass through */}
        <rect x="8" y="11" width="32" height="10" rx="5" fill="#111" stroke="#3d3d3d" strokeWidth="1" />
        {/* The two curled fingers that give the feature its name */}
        <path d="M23 16 Q14 16 12 10 Q10 5 16 6 Q21 7 23 16" fill="none" stroke="#9aa0a6" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M25 16 Q34 16 36 10 Q38 5 32 6 Q27 7 25 16" fill="none" stroke="#9aa0a6" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
);

export default MustachePassThrough;
