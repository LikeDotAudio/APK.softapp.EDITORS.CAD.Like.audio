// Copyright (c) 2026 oneDiversified.

import React from 'react';

/** NEMA twist-lock connector (L5-15, L5-20, L5-30, L6-20, L6-30) with curved L-shaped slots. */
const NEMALocking: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="tlock-face" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f5f0e8" />
        <stop offset="100%" stopColor="#ddd5c8" />
      </linearGradient>
      <linearGradient id="tlock-slot" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1a1a1a" />
        <stop offset="100%" stopColor="#333333" />
      </linearGradient>
    </defs>

    {/* Outer blue ring */}
    <circle cx="60" cy="60" r="54" fill="#2a75d3" />
    {/* Inner white face */}
    <circle cx="60" cy="60" r="50" fill="#f8f9fa" />

    {/* Outlet face plate */}
    <circle cx="60" cy="60" r="42" fill="url(#tlock-face)" stroke="#bbb0a0" strokeWidth="1.5" />

    {/* Inner receptacle ring */}
    <circle cx="60" cy="60" r="30" fill="#e8e0d5" stroke="#c0b8a8" strokeWidth="1" />

    {/* Curved L-shaped slot 1 (top-left, hot) - arc curving clockwise */}
    <path
      d="M 48,47 A 18,18 0 0 1 55,42 L 55,42"
      fill="none"
      stroke="url(#tlock-slot)"
      strokeWidth="4.5"
      strokeLinecap="round"
    />

    {/* Curved L-shaped slot 2 (top-right, neutral) - arc curving clockwise */}
    <path
      d="M 72,47 A 18,18 0 0 0 65,42 L 65,42"
      fill="none"
      stroke="url(#tlock-slot)"
      strokeWidth="4.5"
      strokeLinecap="round"
    />

    {/* Curved L-shaped slot 3 (bottom, ground) - arc curving upward */}
    <path
      d="M 53,76 A 18,18 0 0 0 67,76 L 67,76"
      fill="none"
      stroke="url(#tlock-slot)"
      strokeWidth="4.5"
      strokeLinecap="round"
    />

    {/* Center keyway indicator */}
    <circle cx="60" cy="60" r="4" fill="#c0b8a8" stroke="#a09888" strokeWidth="0.8" />

    {/* Twist arrow indicators */}
    <path
      d="M 42,60 A 18,18 0 0 1 46,50"
      fill="none"
      stroke="#a09888"
      strokeWidth="1"
      strokeLinecap="round"
      strokeDasharray="2,2"
    />
    <path
      d="M 78,60 A 18,18 0 0 0 74,50"
      fill="none"
      stroke="#a09888"
      strokeWidth="1"
      strokeLinecap="round"
      strokeDasharray="2,2"
    />
  </svg>
);

export default NEMALocking;
