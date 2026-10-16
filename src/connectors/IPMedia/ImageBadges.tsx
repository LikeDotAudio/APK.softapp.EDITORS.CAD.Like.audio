// Copyright (c) 2026 APK.audio & oneDiversified
// MIT License.

import React from 'react';
import { Badge } from './Badge';
import { Screen, Brackets, Flow } from './glyphs';
import { MEDIA_FORMAT_GROUPS } from '../mediaFormatConnectors';

type GlyphFC = React.FC<{ c: string }>;

/** Frame / Still image glyph: picture frame with a mountain/sun */
const PictureFrame: GlyphFC = ({ c }) => (
  <g fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8" cy="9" r="1.8" fill={c} stroke="none" />
    <polyline points="4,17 9,12 13,16 16,13 20,17" />
  </g>
);

/** Cube / 3D glyph */
const Cube3D: GlyphFC = ({ c }) => (
  <g fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" />
    <line x1="12" y1="3" x2="12" y2="12" />
    <line x1="4" y1="7.5" x2="12" y2="12" />
    <line x1="20" y1="7.5" x2="12" y2="12" />
    <line x1="12" y1="12" x2="12" y2="21" />
  </g>
);

const FAMILY: Record<string, { accent: string; caption: string; glyph: GlyphFC }> = {
  'Media-Images': { accent: '#00a896', caption: 'IMAGE', glyph: PictureFrame },
  'Media-3D-Doc': { accent: '#4361ee', caption: '3D/DOC', glyph: Cube3D },
};

const WORD: Record<string, string> = {
  'RAW-IMAGE': 'RAW',
  'JSON-DATA': 'JSON',
  'XML-DATA': 'XML',
};

const badge = (abbreviation: string, family: string): React.FC => {
  const f = FAMILY[family] || { accent: '#5c677d', caption: 'MEDIA', glyph: Screen };
  const Glyph: GlyphFC = abbreviation === 'SVG' ? Brackets : (abbreviation === 'GLTF' || abbreviation === 'USDZ') ? Cube3D : (abbreviation === 'JSON-DATA' || abbreviation === 'XML-DATA') ? Flow : f.glyph;
  const Icon: React.FC = () => (
    <Badge
      accent={f.accent}
      glyph={<Glyph c={f.accent} />}
      big={WORD[abbreviation] ?? abbreviation}
      bigSize={24}
      caption={f.caption}
    />
  );
  Icon.displayName = `ImageBadge(${abbreviation})`;
  return Icon;
};

export const IMAGE_ICONS: Record<string, React.FC> = Object.fromEntries(
  MEDIA_FORMAT_GROUPS.flatMap((g) => g.connectors.map((c) => [c.abbreviation, badge(c.abbreviation, g.name)])),
);
