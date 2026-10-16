// Copyright (c) 2026 oneDiversified.

import React from 'react';

const DIN: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <defs>
      <radialGradient id="din_bodyGrad" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#c0c0c0" />
        <stop offset="60%" stopColor="#999" />
        <stop offset="100%" stopColor="#777" />
      </radialGradient>
      <linearGradient id="din_pinGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#d4af37" />
        <stop offset="100%" stopColor="#b8960c" />
      </linearGradient>
    </defs>
    {/* Blue outer ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* White inner */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.1) translate(-60,-60)">
    {/* Metallic outer ring */}
    <circle cx="60" cy="60" r="44" fill="url(#din_bodyGrad)" stroke="#888" strokeWidth="1.2" />
    {/* Dark insulator */}
    <circle cx="60" cy="60" r="34" fill="#2a2a2a" />
    {/* Alignment key notch at top */}
    <rect x="54" y="22" width="12" height="10" rx="2" fill="#555" stroke="#666" strokeWidth="0.8" />
    {/* DIN-5 pins in 180-degree arc at bottom */}
    {/* Pin 1 - far left */}
    <circle cx="36" cy="68" r="4" fill="url(#din_pinGrad)" stroke="#a08000" strokeWidth="0.6" />
    {/* Pin 2 - left */}
    <circle cx="44" cy="82" r="4" fill="url(#din_pinGrad)" stroke="#a08000" strokeWidth="0.6" />
    {/* Pin 3 - center bottom */}
    <circle cx="60" cy="88" r="4" fill="url(#din_pinGrad)" stroke="#a08000" strokeWidth="0.6" />
    {/* Pin 4 - right */}
    <circle cx="76" cy="82" r="4" fill="url(#din_pinGrad)" stroke="#a08000" strokeWidth="0.6" />
    {/* Pin 5 - far right */}
    <circle cx="84" cy="68" r="4" fill="url(#din_pinGrad)" stroke="#a08000" strokeWidth="0.6" />
    {/* Pin highlights */}
    <circle cx="35" cy="67" r="1.5" fill="#e8c84a" fillOpacity="0.5" />
    <circle cx="43" cy="81" r="1.5" fill="#e8c84a" fillOpacity="0.5" />
    <circle cx="59" cy="87" r="1.5" fill="#e8c84a" fillOpacity="0.5" />
    <circle cx="75" cy="81" r="1.5" fill="#e8c84a" fillOpacity="0.5" />
    <circle cx="83" cy="67" r="1.5" fill="#e8c84a" fillOpacity="0.5" />
  
            </g>
        </svg>
);

export default DIN;
