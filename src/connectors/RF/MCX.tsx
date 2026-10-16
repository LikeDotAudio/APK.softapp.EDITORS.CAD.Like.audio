// Copyright (c) 2026 oneDiversified.

import React from 'react';

const MCX: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="mcx-goldOuter" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#f5d87a" />
        <stop offset="40%" stopColor="#d4a832" />
        <stop offset="100%" stopColor="#9a7520" />
      </radialGradient>
      <radialGradient id="mcx-goldBarrel" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#ecd060" />
        <stop offset="50%" stopColor="#c89e28" />
        <stop offset="100%" stopColor="#8a6818" />
      </radialGradient>
      <radialGradient id="mcx-goldPin" cx="40%" cy="35%" r="50%">
        <stop offset="0%" stopColor="#fff0b0" />
        <stop offset="50%" stopColor="#d4a832" />
        <stop offset="100%" stopColor="#9a7520" />
      </radialGradient>
      <linearGradient id="mcx-sheen" x1="0" y1="0" x2="0.7" y2="0.7">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>

    {/* Blue outer ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* White inner */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.15) translate(-60,-60)">

    {/* Smooth outer barrel - very small diameter, snap-on */}
    <circle cx="60" cy="60" r="28" fill="url(#mcx-goldOuter)" stroke="#8a6818" strokeWidth="1" />

    {/* Barrel sheen */}
    <circle cx="60" cy="60" r="27" fill="url(#mcx-sheen)" />

    {/* Subtle ring detail */}
    <circle cx="60" cy="60" r="25.5" fill="none" stroke="#c49628" strokeWidth="0.4" />

    {/* Inner barrel step */}
    <circle cx="60" cy="60" r="21" fill="url(#mcx-goldBarrel)" stroke="#8a6818" strokeWidth="0.7" />

    {/* Snap-on retention groove */}
    <circle cx="60" cy="60" r="18.5" fill="none" stroke="#9a7520" strokeWidth="1" />

    {/* Inner cavity */}
    <circle cx="60" cy="60" r="14" fill="#222222" />
    <circle cx="60" cy="60" r="13.2" fill="#1a1a1a" stroke="#333333" strokeWidth="0.4" />

    {/* Small dielectric */}
    <circle cx="60" cy="60" r="7" fill="#e8e4d8" stroke="#b5b0a0" strokeWidth="0.6" />

    {/* Tiny center pin - smallest of the RF family */}
    <circle cx="60" cy="60" r="2" fill="url(#mcx-goldPin)" stroke="#9a7520" strokeWidth="0.4" />
    {/* Pin highlight */}
    <circle cx="59.2" cy="59.2" r="0.7" fill="#ffffff" fillOpacity="0.5" />
  
            </g>
        </svg>
);

export default MCX;
