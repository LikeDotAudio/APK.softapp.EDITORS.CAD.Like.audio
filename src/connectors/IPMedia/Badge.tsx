// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-03 - created: shared round badge layout for the IPMedia connector icons.

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/IPMedia/Badge.tsx
 *
 * One layout for every IP-media badge so they read as a family: coloured
 * ring, light inner, optional small header, a glyph slot, the dominant big
 * text, and an optional small caption. The glyph is drawn in a 24x24 box and
 * scaled into the slot, so glyph authors never think about badge geometry.
 */

import React from 'react';

export interface BadgeProps {
    accent: string;
    big: string;
    header?: string;
    glyph?: React.ReactNode;
    bigSize?: number;
    caption?: string;
}

/** Places a 24x24-box glyph centred at (cx, cy) at the given scale. */
export const GlyphSlot: React.FC<{ cx: number; cy: number; scale: number; children: React.ReactNode }> = ({
    cx, cy, scale, children,
}) => (
    <g transform={`translate(${cx - 12 * scale},${cy - 12 * scale}) scale(${scale})`}>{children}</g>
);

export const Badge: React.FC<BadgeProps> = ({ accent, big, header, glyph, bigSize = 28, caption }) => {
    // Without a header the glyph gets the header's room and grows.
    const glyphY = header ? 46 : 40;
    const glyphScale = header ? 1.25 : 1.5;
    const fitBig = Math.min(bigSize, Math.floor(150 / Math.max(big.length, 1)));
    return (
        <svg viewBox="0 0 120 120" width="100%" height="100%">
            <circle cx="60" cy="60" r="54" fill={accent} />
            <circle cx="60" cy="60" r="50" fill="#f8f9fa" />
            {header && (
                <text x="60" y="23" textAnchor="middle" dominantBaseline="central" fill={accent}
                    fontWeight="bold" fontSize="10.5" fontFamily="monospace">
                    {header}
                </text>
            )}
            {glyph && <GlyphSlot cx={60} cy={glyphY} scale={glyphScale}>{glyph}</GlyphSlot>}
            <text x="60" y="76" textAnchor="middle" dominantBaseline="central" fill="#222"
                fontWeight="bold" fontSize={fitBig} fontFamily="monospace">
                {big}
            </text>
            {caption && (
                <text x="60" y="97" textAnchor="middle" dominantBaseline="central" fill={accent}
                    fontWeight="bold" fontSize={caption.length > 7 ? 9 : 10.5} fontFamily="sans-serif">
                    {caption}
                </text>
            )}
        </svg>
    );
};
