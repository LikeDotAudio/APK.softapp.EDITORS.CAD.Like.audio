// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-03 - created: Dante audio-over-IP flow badges (text only, no vendor logo).
//   2026-10-03 - illustrated: unicast flow / multicast fan-out / AES67 interop / AV screen
//                glyphs; TX/RX variants lead with a large channel count and fan-out or ear.

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/IPMedia/Dante.tsx
 *
 * Dante flow badge: orange-red ring, plain "Dante" text (deliberately not the
 * vendor logo), a glyph per flow kind, and a caption. Sender/receiver
 * variants make the channel count the dominant text.
 */

import React from 'react';
import { Badge } from './Badge';
import { DirGlyph, FanOut, Flow, Interop, parseDirSub, Screen } from './glyphs';

const DANTE_RED = '#e4502b';
const DANTE_AV = '#c0392b';

/** Caption (upper case) -> glyph for the non-directional variants. */
const KIND_GLYPHS: Record<string, React.FC<{ c: string }>> = {
    FLOW: Flow,
    MCAST: FanOut,
    AES67: Interop,
    AV: Screen,
};

const DanteBase: React.FC<{ sub?: string; dir?: 'tx' | 'rx'; accent?: string }> = ({
    sub, dir, accent = DANTE_RED,
}) => {
    const parsed = parseDirSub(sub);
    const d = dir ?? parsed.dir;
    if (d && parsed.count) {
        return (
            <Badge accent={accent} header="Dante" glyph={<DirGlyph dir={d} c={accent} />}
                big={parsed.count} bigSize={40} caption={d.toUpperCase()} />
        );
    }
    const Glyph = KIND_GLYPHS[(sub ?? '').toUpperCase()] ?? Flow;
    return (
        <Badge accent={accent} glyph={d ? <DirGlyph dir={d} c={accent} /> : <Glyph c={accent} />}
            big="Dante" bigSize={26} caption={sub} />
    );
};

const Dante: React.FC = () => <DanteBase sub="FLOW" />;
const DanteMC: React.FC = () => <DanteBase sub="MCAST" />;
const DanteAES67: React.FC = () => <DanteBase sub="AES67" />;
const DanteAV: React.FC = () => <DanteBase sub="AV" accent={DANTE_AV} />;
const DanteTX2: React.FC = () => <DanteBase sub="TX 2" dir="tx" />;
const DanteTX8: React.FC = () => <DanteBase sub="TX 8" dir="tx" />;
const DanteTX16: React.FC = () => <DanteBase sub="TX 16" dir="tx" />;
const DanteRX2: React.FC = () => <DanteBase sub="RX 2" dir="rx" />;
const DanteRX8: React.FC = () => <DanteBase sub="RX 8" dir="rx" />;
const DanteRX16: React.FC = () => <DanteBase sub="RX 16" dir="rx" />;

export default Dante;
export {
    DanteBase, Dante, DanteMC, DanteAES67, DanteAV,
    DanteTX2, DanteTX8, DanteTX16, DanteRX2, DanteRX8, DanteRX16,
};
