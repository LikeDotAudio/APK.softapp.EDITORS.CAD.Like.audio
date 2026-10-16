// Copyright (c) 2026 oneDiversified.

import React from 'react';

const FType: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="ftype-metalBg" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#e8e8e8" />
        <stop offset="50%" stopColor="#c0c0c0" />
        <stop offset="100%" stopColor="#888888" />
      </radialGradient>
      <radialGradient id="ftype-barrel" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#d8d8d8" />
        <stop offset="60%" stopColor="#a8a8a8" />
        <stop offset="100%" stopColor="#707070" />
      </radialGradient>
      <radialGradient id="ftype-pin" cx="40%" cy="35%" r="50%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#d0d0d0" />
        <stop offset="100%" stopColor="#909090" />
      </radialGradient>
      <linearGradient id="ftype-thread" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#999999" />
        <stop offset="50%" stopColor="#cccccc" />
        <stop offset="100%" stopColor="#999999" />
      </linearGradient>
    </defs>

    {/* Blue outer ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* White inner */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            <g transform="translate(60,60) scale(1.15) translate(-60,-60)">

    {/* Hex nut outer ring - hexagonal shape */}
    <polygon
      points="60,16 98.1,38 98.1,82 60,104 21.9,82 21.9,38"
      fill="url(#ftype-metalBg)"
      stroke="#707070"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />

    {/* Hex nut inner bevel */}
    <polygon
      points="60,22 93,41 93,79 60,98 27,79 27,41"
      fill="none"
      stroke="#b0b0b0"
      strokeWidth="0.8"
      strokeLinejoin="round"
      fillOpacity="0"
    />

    {/* Threaded barrel - outer circle */}
    <circle cx="60" cy="60" r="28" fill="url(#ftype-barrel)" stroke="#808080" strokeWidth="1" />

    {/* Thread grooves */}
    <circle cx="60" cy="60" r="26" fill="none" stroke="url(#ftype-thread)" strokeWidth="0.6" />
    <circle cx="60" cy="60" r="24" fill="none" stroke="url(#ftype-thread)" strokeWidth="0.5" />
    <circle cx="60" cy="60" r="22" fill="none" stroke="url(#ftype-thread)" strokeWidth="0.4" />

    {/* Inner opening */}
    <circle cx="60" cy="60" r="18" fill="#2a2a2a" />
    <circle cx="60" cy="60" r="17" fill="#1a1a1a" stroke="#333333" strokeWidth="0.5" />

    {/* Dielectric ring */}
    <circle cx="60" cy="60" r="12" fill="#e0ddd5" stroke="#b0ad9f" strokeWidth="0.8" />

    {/* Center pin - single conductor */}
    <circle cx="60" cy="60" r="3.5" fill="url(#ftype-pin)" stroke="#909090" strokeWidth="0.6" />
    {/* Pin highlight */}
    <circle cx="58.5" cy="58.5" r="1.2" fill="#ffffff" fillOpacity="0.6" />
  
            </g>
        </svg>
);

export default FType;
