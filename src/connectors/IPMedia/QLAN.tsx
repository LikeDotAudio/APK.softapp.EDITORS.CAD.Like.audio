// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-09 - created (owner: "i would like to add Q lan to the audio networked"): Q-LAN stream
//                badges in the Dante family's layout — plain "Q-LAN" text, no vendor logo.

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/IPMedia/QLAN.tsx
 *
 * Q-LAN stream badge (QSC Q-SYS): teal ring, the word "Q-LAN", a glyph and a caption.
 * Sender/receiver variants lead with the channel count, as Dante's do. The bare stream
 * shows the plain point-to-point FLOW glyph, never a fan-out: Q-LAN streams are unicast.
 */

import React from 'react';
import { Badge } from './Badge';
import { DirGlyph, Flow, parseDirSub } from './glyphs';

const QLAN_TEAL = '#00838f';

const QLanBase: React.FC<{ sub?: string; dir?: 'tx' | 'rx' }> = ({ sub, dir }) => {
    const parsed = parseDirSub(sub);
    const d = dir ?? parsed.dir;
    if (d && parsed.count) {
        return (
            <Badge accent={QLAN_TEAL} header="Q-LAN" glyph={<DirGlyph dir={d} c={QLAN_TEAL} />}
                big={parsed.count} bigSize={40} caption={d.toUpperCase()} />
        );
    }
    return <Badge accent={QLAN_TEAL} glyph={<Flow c={QLAN_TEAL} />} big="Q-LAN" bigSize={24} caption={sub} />;
};

const QLan: React.FC = () => <QLanBase sub="UNICAST" />;
const QLanTX2: React.FC = () => <QLanBase sub="TX 2" dir="tx" />;
const QLanTX8: React.FC = () => <QLanBase sub="TX 8" dir="tx" />;
const QLanTX16: React.FC = () => <QLanBase sub="TX 16" dir="tx" />;
const QLanRX2: React.FC = () => <QLanBase sub="RX 2" dir="rx" />;
const QLanRX8: React.FC = () => <QLanBase sub="RX 8" dir="rx" />;
const QLanRX16: React.FC = () => <QLanBase sub="RX 16" dir="rx" />;

export default QLan;
export { QLan, QLanTX2, QLanTX8, QLanTX16, QLanRX2, QLanRX8, QLanRX16 };
