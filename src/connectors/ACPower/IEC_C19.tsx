// Copyright (c) 2026 oneDiversified.

import React from 'react';

/** IEC C19/C20 high-power connector with 3 horizontal rectangular slots, wider body than C13. */
const IEC_C19: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="iec19-metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#b0b0b0" />
        <stop offset="100%" stopColor="#808080" />
      </linearGradient>
      <linearGradient id="iec19-cavity" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a1a1a" />
        <stop offset="100%" stopColor="#2d2d2d" />
      </linearGradient>
      <linearGradient id="iec19-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#686868" />
        <stop offset="50%" stopColor="#585858" />
        <stop offset="100%" stopColor="#484848" />
      </linearGradient>
    </defs>

    {/* Outer blue ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* Inner white face */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />

    {/* Metallic housing body - wider than C13 */}
    <rect x="18" y="34" width="84" height="52" rx="5" fill="url(#iec19-metal)" stroke="#666" strokeWidth="1" />

    {/* Inner housing recess */}
    <rect x="22" y="38" width="76" height="44" rx="3" fill="url(#iec19-body)" />

    {/* Connector cavity - rectangular with flat bottom (C19 is not tapered like C13) */}
    <rect x="28" y="42" width="64" height="36" rx="2" fill="url(#iec19-cavity)" stroke="#333" strokeWidth="1" />

    {/* Top-left horizontal slot (Line) */}
    <rect x="34" y="48" width="14" height="5" rx="1" fill="#0a0a0a" stroke="#444" strokeWidth="0.5" />

    {/* Top-right horizontal slot (Neutral) */}
    <rect x="72" y="48" width="14" height="5" rx="1" fill="#0a0a0a" stroke="#444" strokeWidth="0.5" />

    {/* Bottom center horizontal slot (Earth) */}
    <rect x="53" y="66" width="14" height="5" rx="1" fill="#0a0a0a" stroke="#444" strokeWidth="0.5" />

    {/* Housing edge highlight */}
    <line x1="20" y1="36" x2="100" y2="36" stroke="#ccc" strokeWidth="0.5" />

    {/* Rating label area */}
    <rect x="44" y="55" width="32" height="7" rx="1" fill="none" stroke="#555" strokeWidth="0.4" strokeDasharray="1,1" />
  </svg>
);

export default IEC_C19;
