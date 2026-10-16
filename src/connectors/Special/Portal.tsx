// Copyright (c) 2026 oneDiversified.

// The one neutral portal glyph (portals.md D1/D2): a directionless capsule —
// hollow outline with a centred lug dot. Replaces the PortalIn/PortalOut
// arrow pair; a portal has no authored direction, so neither does its icon.

import React from 'react';

const Portal: React.FC = () => (
    <svg viewBox="0 0 20 20" style={{ width: '100%', height: '100%' }}>
        <rect x="1" y="4" width="18" height="12" rx="6" ry="6"
            fill="#1a1a1a" stroke="#f4902c" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="2.5" fill="#f4902c" opacity="0.8" />
    </svg>
);

export default Portal;
