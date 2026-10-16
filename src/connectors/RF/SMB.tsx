// Copyright (c) 2026 oneDiversified.

import React from 'react';

const SMB: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="smb-goldOuter" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#f5d87a" />
        <stop offset="40%" stopColor="#d4a832" />
        <stop offset="100%" stopColor="#9a7520" />
      </radialGradient>
      <radialGradient id="smb-goldBarrel" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#ecd060" />
        <stop offset="50%" stopColor="#c89e28" />
        <stop offset="100%" stopColor="#8a6818" />
      </radialGradient>
      <radialGradient id="smb-goldPin" cx="40%" cy="35%" r="50%">
        <stop offset="0%" stopColor="#fff0b0" />
        <stop offset="50%" stopColor="#d4a832" />
        <stop offset="100%" stopColor="#9a7520" />
      </radialGradient>
      <linearGradient id="smb-sheen" x1="0" y1="0" x2="0.7" y2="0.7">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>

    {/* Blue outer ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* White inner */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.15) translate(-60,-60)">

    {/* Smooth outer barrel - no hex nut, snap-on design */}
    <circle cx="60" cy="60" r="36" fill="url(#smb-goldOuter)" stroke="#8a6818" strokeWidth="1.2" />

    {/* Barrel sheen highlight */}
    <circle cx="60" cy="60" r="35" fill="url(#smb-sheen)" />

    {/* Subtle barrel ring detail */}
    <circle cx="60" cy="60" r="33" fill="none" stroke="#c49628" strokeWidth="0.6" />
    <circle cx="60" cy="60" r="30" fill="none" stroke="#b08820" strokeWidth="0.4" />

    {/* Inner barrel step */}
    <circle cx="60" cy="60" r="26" fill="url(#smb-goldBarrel)" stroke="#8a6818" strokeWidth="0.8" />

    {/* Snap-on groove ring */}
    <circle cx="60" cy="60" r="23" fill="none" stroke="#9a7520" strokeWidth="1.2" />

    {/* Inner cavity */}
    <circle cx="60" cy="60" r="18" fill="#222222" />
    <circle cx="60" cy="60" r="17" fill="#1a1a1a" stroke="#333333" strokeWidth="0.5" />

    {/* Small dielectric */}
    <circle cx="60" cy="60" r="10" fill="#e8e4d8" stroke="#b5b0a0" strokeWidth="0.7" />

    {/* Center pin */}
    <circle cx="60" cy="60" r="3" fill="url(#smb-goldPin)" stroke="#9a7520" strokeWidth="0.5" />
    {/* Pin highlight */}
    <circle cx="58.8" cy="58.8" r="1" fill="#ffffff" fillOpacity="0.5" />
  
            </g>
        </svg>
);

export default SMB;
