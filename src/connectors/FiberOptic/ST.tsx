// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-06-05 20:11 - colour-coded fiber core (per variant) with a glowing halo

import React from 'react';

const ST: React.FC<{ coreColor?: string; bare?: boolean }> = ({ coreColor = '#111', bare = false }) => (
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <defs>
      <radialGradient id="st_bodyGrad" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#c8c8c8" />
        <stop offset="60%" stopColor="#a0a0a0" />
        <stop offset="100%" stopColor="#787878" />
      </radialGradient>
      <radialGradient id="st_ferruleGrad" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e8e8e8" />
      </radialGradient>
    </defs>
    {/* Blue outer ring (omitted in keystone/bare mode) */}
    {!bare && <circle cx="60" cy="60" r="54" fill="#2a75d3" />}
    {!bare && <circle cx="60" cy="60" r="50" fill="#f8f9fa" />}
            <g transform="translate(60,60) scale(1.1) translate(-60,-60)">
    {/* Metal housing */}
    <circle cx="60" cy="60" r="44" fill="url(#st_bodyGrad)" stroke="#888" strokeWidth="1" />
    {/* Bayonet slot 1 - top right */}
    <path d="M 85 35 A 38 38 0 0 0 78 28 L 72 34 A 30 30 0 0 1 78 40 Z" fill="#666" stroke="#555" strokeWidth="0.5" />
    {/* Bayonet slot 2 - bottom left */}
    <path d="M 35 85 A 38 38 0 0 0 42 92 L 48 86 A 30 30 0 0 1 42 80 Z" fill="#666" stroke="#555" strokeWidth="0.5" />
    {/* Bayonet pin indicator - top */}
    <circle cx="60" cy="20" r="3" fill="#999" stroke="#777" strokeWidth="0.5" />
    {/* Inner ring */}
    <circle cx="60" cy="60" r="30" fill="#555" stroke="#666" strokeWidth="1" />
    {/* Spring housing ring */}
    <circle cx="60" cy="60" r="24" fill="#777" stroke="#888" strokeWidth="0.8" />
    <circle cx="60" cy="60" r="22" fill="#666" />
    {/* Ceramic ferrule */}
    <circle cx="60" cy="60" r="14" fill="url(#st_ferruleGrad)" stroke="#ccc" strokeWidth="0.8" />
    {/* Ferrule detail ring */}
    <circle cx="60" cy="60" r="10" fill="none" stroke="#ddd" strokeWidth="0.5" />
    {/* Fiber core — colour-coded with a glowing halo */}
    <circle cx="60" cy="60" r="9" fill={coreColor} opacity="0.30" />
    <circle cx="60" cy="60" r="6" fill={coreColor} opacity="0.55" />
    <circle cx="60" cy="60" r="3.4" fill={coreColor} stroke="#3a3a3a" strokeWidth="0.5" />
  
            </g>
        </svg>
);

export default ST;
