// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-06-05 20:11 - colour-coded fiber core (per variant) with a glowing halo

import React from 'react';

// Center fiber-core colour per FC variant (with a glowing halo).
const FC: React.FC<{ coreColor?: string; bare?: boolean }> = ({ coreColor = '#111', bare = false }) => (
  <svg viewBox="0 0 120 120" width="100%" height="100%">
    <defs>
      <linearGradient id="fc_nutGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#d0d0d0" />
        <stop offset="40%" stopColor="#a8a8a8" />
        <stop offset="70%" stopColor="#c8c8c8" />
        <stop offset="100%" stopColor="#909090" />
      </linearGradient>
      <radialGradient id="fc_ferruleGrad" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e0e0e0" />
      </radialGradient>
    </defs>
    {/* Blue outer ring (omitted in keystone/bare mode) */}
    {!bare && <circle cx="60" cy="60" r="54" fill="#2a75d3" />}
    {!bare && <circle cx="60" cy="60" r="50" fill="#f8f9fa" />}
            <g transform="translate(60,60) scale(1.1) translate(-60,-60)">
    {/* Hex coupling nut - 6-sided polygon */}
    <polygon
      points="60,16 98,38 98,82 60,104 22,82 22,38"
      fill="url(#fc_nutGrad)"
      stroke="#777"
      strokeWidth="1.5"
    />
    {/* Hex nut inner bevel */}
    <polygon
      points="60,22 93,41 93,79 60,98 27,79 27,41"
      fill="none"
      stroke="#b8b8b8"
      strokeWidth="0.8"
    />
    {/* Thread lines on nut */}
    <circle cx="60" cy="60" r="38" fill="none" stroke="#999" strokeWidth="0.5" />
    <circle cx="60" cy="60" r="36" fill="none" stroke="#aaa" strokeWidth="0.4" />
    <circle cx="60" cy="60" r="34" fill="none" stroke="#999" strokeWidth="0.5" />
    {/* Inner bore */}
    <circle cx="60" cy="60" r="22" fill="#444" />
    {/* Ceramic ferrule */}
    <circle cx="60" cy="60" r="14" fill="url(#fc_ferruleGrad)" stroke="#ccc" strokeWidth="0.8" />
    {/* Ferrule ring detail */}
    <circle cx="60" cy="60" r="10" fill="none" stroke="#ddd" strokeWidth="0.5" />
    {/* Fiber core — colour-coded with a glowing halo */}
    <circle cx="60" cy="60" r="9" fill={coreColor} opacity="0.30" />
    <circle cx="60" cy="60" r="6" fill={coreColor} opacity="0.55" />
    <circle cx="60" cy="60" r="3.4" fill={coreColor} stroke="#3a3a3a" strokeWidth="0.5" />

            </g>
        </svg>
);

export default FC;
