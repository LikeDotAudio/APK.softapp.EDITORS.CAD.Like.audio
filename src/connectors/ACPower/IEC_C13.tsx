// Copyright (c) 2026 oneDiversified.

import React from 'react';

/** IEC C13/C14 connector — pentagon-shaped body with 3 rectangular pins. */
const IEC_C13: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        {/* Blue outer ring */}
        <circle cx="60" cy="60" r="54" fill="#2a75d3" />
        <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
        {/* Outer C13 Body (Pentagon shape) */}
        <path d="M 30 50 L 90 50 L 90 65 L 75 80 L 45 80 L 30 65 Z" fill="#1e293b" />
        <path d="M 34 54 L 86 54 L 86 63 L 73 76 L 47 76 L 34 63 Z" fill="#334155" />
        {/* Ground pin (top center) */}
        <rect x="56" y="45" width="8" height="14" fill="#cbd5e1" rx="1" />
        {/* Line pin (bottom left) */}
        <rect x="42" y="60" width="8" height="14" fill="#cbd5e1" rx="1" />
        {/* Neutral pin (bottom right) */}
        <rect x="70" y="60" width="8" height="14" fill="#cbd5e1" rx="1" />
    </svg>
);

export default IEC_C13;
