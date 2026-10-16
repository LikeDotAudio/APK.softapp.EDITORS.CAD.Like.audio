// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-09 - created (owner: "a new flow type should be called DDM manager"): DDM Manager flow badges in
//                the Dante family's layout — plain "DDM" text, no vendor logo, a magenta ring apart from Dante's red.

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/IPMedia/DDM.tsx
 *
 * DDM Manager flow badge: a Dante flow whose devices are enrolled in a Dante Domain
 * Manager domain. Sender/receiver variants lead with the channel count, as Dante's do;
 * the bare flow shows the point-to-point FLOW glyph, the multicast one the fan-out.
 */

import React from 'react';
import { Badge } from './Badge';
import { DirGlyph, FanOut, Flow, parseDirSub } from './glyphs';

const DDM_MAGENTA = '#b5179e';

const DdmBase: React.FC<{ sub?: string; dir?: 'tx' | 'rx' }> = ({ sub, dir }) => {
    const parsed = parseDirSub(sub);
    const d = dir ?? parsed.dir;
    if (d && parsed.count) {
        return (
            <Badge accent={DDM_MAGENTA} header="DDM" glyph={<DirGlyph dir={d} c={DDM_MAGENTA} />}
                big={parsed.count} bigSize={40} caption={d.toUpperCase()} />
        );
    }
    const Glyph = (sub ?? '').toUpperCase() === 'MCAST' ? FanOut : Flow;
    return <Badge accent={DDM_MAGENTA} glyph={<Glyph c={DDM_MAGENTA} />} big="DDM" bigSize={26} caption={sub} />;
};

const Ddm: React.FC = () => <DdmBase sub="MANAGED" />;
const DdmMC: React.FC = () => <DdmBase sub="MCAST" />;
const DdmTX2: React.FC = () => <DdmBase sub="TX 2" dir="tx" />;
const DdmTX8: React.FC = () => <DdmBase sub="TX 8" dir="tx" />;
const DdmTX16: React.FC = () => <DdmBase sub="TX 16" dir="tx" />;
const DdmRX2: React.FC = () => <DdmBase sub="RX 2" dir="rx" />;
const DdmRX8: React.FC = () => <DdmBase sub="RX 8" dir="rx" />;
const DdmRX16: React.FC = () => <DdmBase sub="RX 16" dir="rx" />;

export default Ddm;
export { Ddm, DdmMC, DdmTX2, DdmTX8, DdmTX16, DdmRX2, DdmRX8, DdmRX16 };
