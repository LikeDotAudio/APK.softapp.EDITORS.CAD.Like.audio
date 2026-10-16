// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-03 - created: AMWA NMOS badges (IS-04/05/07/08/11, BCP-003, node, registry).
//   2026-10-03 - each spec / role now has its own glyph (see nmosGlyphs.tsx); shared Badge layout.

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/IPMedia/NMOS.tsx
 *
 * AMWA NMOS control-plane badge: teal ring, a pictogram distinct per spec
 * (node, discovery, connection, events, channel map, compatibility, security,
 * registry), "NMOS" word, and a caption naming the spec or role.
 */

import React from 'react';
import { Badge } from './Badge';
import { NmosGlyph } from './nmosGlyphs';

const ACCENT = '#138496';

const NMOSBase: React.FC<{ sub?: string }> = ({ sub }) => (
    <Badge accent={ACCENT} glyph={<NmosGlyph sub={sub} c={ACCENT} />} big="NMOS" bigSize={24} caption={sub} />
);

const NMOS: React.FC = () => <NMOSBase sub="NODE" />;
const NMOS_IS04: React.FC = () => <NMOSBase sub="IS-04" />;
const NMOS_IS05: React.FC = () => <NMOSBase sub="IS-05" />;
const NMOS_IS07: React.FC = () => <NMOSBase sub="IS-07" />;
const NMOS_IS08: React.FC = () => <NMOSBase sub="IS-08" />;
const NMOS_IS11: React.FC = () => <NMOSBase sub="IS-11" />;
const NMOS_BCP003: React.FC = () => <NMOSBase sub="BCP-003" />;
const NMOS_REGISTRY: React.FC = () => <NMOSBase sub="REGISTRY" />;

export default NMOS;
export {
    NMOSBase, NMOS, NMOS_IS04, NMOS_IS05, NMOS_IS07, NMOS_IS08, NMOS_IS11,
    NMOS_BCP003, NMOS_REGISTRY,
};
