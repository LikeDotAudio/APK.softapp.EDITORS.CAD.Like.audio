// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-07-22 15:55 - created: Robo rugged-multipin connector icon (roadmap §5). Heavy
//     circular shell, keyway, and a ring of contacts around a central pin.

/**
 * Robo — rugged circular multipin connector (roadmap §5).
 *
 * A heavy-duty shell with a locking keyway and a ring of contacts around a
 * central pin — the visual family of a robotic-camera / field-power multipin.
 * Larger than a standard D footprint, hence the group's `oversize-D` cutout.
 */

import React from 'react';

const Robo: React.FC = () => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
            <linearGradient id="robo-shell" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e8e8e8" />
                <stop offset="50%" stopColor="#b5b5b5" />
                <stop offset="100%" stopColor="#6f6f6f" />
            </linearGradient>
            <radialGradient id="robo-face" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="#2a2a2a" />
                <stop offset="100%" stopColor="#0d0d0d" />
            </radialGradient>
            <radialGradient id="robo-pin" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#ffe680" />
                <stop offset="100%" stopColor="#b8860b" />
            </radialGradient>
        </defs>

        {/* Outer coupling ring */}
        <circle cx="60" cy="60" r="56" fill="#2a75d3" />
        <circle cx="60" cy="60" r="52" fill="url(#robo-shell)" />

        {/* Knurl notches around the coupling ring */}
        {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const x = 60 + Math.cos(a) * 50;
            const y = 60 + Math.sin(a) * 50;
            return <circle key={i} cx={x} cy={y} r="1.6" fill="#5a5a5a" />;
        })}

        {/* Inset barrel */}
        <circle cx="60" cy="60" r="42" fill="url(#robo-shell)" />
        {/* Contact face */}
        <circle cx="60" cy="60" r="36" fill="url(#robo-face)" />

        {/* Keyway (orientation slot) */}
        <rect x="57" y="20" width="6" height="12" rx="2" fill="#888" />

        {/* Ring of contacts around a central pin */}
        {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
            const x = 60 + Math.cos(a) * 20;
            const y = 60 + Math.sin(a) * 20;
            return <circle key={i} cx={x} cy={y} r="4.2" fill="url(#robo-pin)" stroke="#5a4302" strokeWidth="0.6" />;
        })}
        <circle cx="60" cy="60" r="5" fill="url(#robo-pin)" stroke="#5a4302" strokeWidth="0.6" />
    </svg>
);

export default Robo;
