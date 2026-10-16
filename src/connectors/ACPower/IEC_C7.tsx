// Copyright (c) 2026 oneDiversified.

import React from 'react';

/** IEC C7/C8 "figure of 8" two-pin polarized connector with infinity-shaped opening. */
const IEC_C7: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="c7-metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#b0b0b0" />
        <stop offset="100%" stopColor="#808080" />
      </linearGradient>
      <linearGradient id="c7-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#686868" />
        <stop offset="50%" stopColor="#585858" />
        <stop offset="100%" stopColor="#484848" />
      </linearGradient>
      <linearGradient id="c7-cavity" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a1a1a" />
        <stop offset="100%" stopColor="#2d2d2d" />
      </linearGradient>
    </defs>

    {/* Outer blue ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* Inner white face */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />

    {/* Small rectangular housing body */}
    <rect x="28" y="38" width="64" height="44" rx="5" fill="url(#c7-metal)" stroke="#666" strokeWidth="1" />

    {/* Inner recess */}
    <rect x="32" y="42" width="56" height="36" rx="3" fill="url(#c7-body)" />

    {/* Cavity background */}
    <rect x="36" y="46" width="48" height="28" rx="2" fill="url(#c7-cavity)" stroke="#333" strokeWidth="0.8" />

    {/* Figure-8 / infinity shape opening */}
    {/* Left circle of the 8 */}
    <circle cx="48" cy="60" r="9" fill="#0a0a0a" stroke="#444" strokeWidth="0.5" />
    {/* Right circle of the 8 */}
    <circle cx="72" cy="60" r="9" fill="#0a0a0a" stroke="#444" strokeWidth="0.5" />

    {/* Center bridge connecting the two circles (cavity fill to shape the 8) */}
    <rect x="53" y="51" width="14" height="18" fill="url(#c7-cavity)" />

    {/* Pin holes inside the figure-8 */}
    <circle cx="48" cy="60" r="2.5" fill="#0a0a0a" stroke="#555" strokeWidth="0.5" />
    <circle cx="72" cy="60" r="2.5" fill="#0a0a0a" stroke="#555" strokeWidth="0.5" />

    {/* Housing edge highlight */}
    <line x1="30" y1="40" x2="90" y2="40" stroke="#ccc" strokeWidth="0.5" />
  </svg>
);

export default IEC_C7;
