// Copyright (c) 2026 oneDiversified.

import React from 'react';

/** IEC C5/C6 "Mickey Mouse" cloverleaf three-pin connector with trefoil pin arrangement. */
const IEC_C5: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="c5-metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#b0b0b0" />
        <stop offset="100%" stopColor="#808080" />
      </linearGradient>
      <linearGradient id="c5-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#686868" />
        <stop offset="50%" stopColor="#585858" />
        <stop offset="100%" stopColor="#484848" />
      </linearGradient>
      <linearGradient id="c5-cavity" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a1a1a" />
        <stop offset="100%" stopColor="#2d2d2d" />
      </linearGradient>
    </defs>

    {/* Outer blue ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* Inner white face */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />

    {/* Small rectangular housing body */}
    <rect x="28" y="34" width="64" height="52" rx="5" fill="url(#c5-metal)" stroke="#666" strokeWidth="1" />

    {/* Inner recess */}
    <rect x="32" y="38" width="56" height="44" rx="3" fill="url(#c5-body)" />

    {/* Cavity background */}
    <rect x="36" y="42" width="48" height="36" rx="2" fill="url(#c5-cavity)" stroke="#333" strokeWidth="0.8" />

    {/* Cloverleaf / Mickey Mouse shape - three overlapping circles */}
    {/* Top-left ear (Line) */}
    <circle cx="49" cy="52" r="9" fill="#0a0a0a" stroke="#444" strokeWidth="0.5" />
    {/* Top-right ear (Neutral) */}
    <circle cx="71" cy="52" r="9" fill="#0a0a0a" stroke="#444" strokeWidth="0.5" />
    {/* Bottom center (Earth) */}
    <circle cx="60" cy="70" r="9" fill="#0a0a0a" stroke="#444" strokeWidth="0.5" />

    {/* Center fill to merge the trefoil shape */}
    <path
      d="M 49,52 L 71,52 L 60,70 Z"
      fill="#0a0a0a"
    />

    {/* Pin holes */}
    <circle cx="49" cy="52" r="2.5" fill="#0a0a0a" stroke="#555" strokeWidth="0.5" />
    <circle cx="71" cy="52" r="2.5" fill="#0a0a0a" stroke="#555" strokeWidth="0.5" />
    <circle cx="60" cy="70" r="2.5" fill="#0a0a0a" stroke="#555" strokeWidth="0.5" />

    {/* Housing edge highlight */}
    <line x1="30" y1="36" x2="90" y2="36" stroke="#ccc" strokeWidth="0.5" />
  </svg>
);

export default IEC_C5;
