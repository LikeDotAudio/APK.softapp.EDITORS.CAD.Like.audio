// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-03 - created: AES67 audio-over-IP sender/receiver badges; the same badge, re-worded,
//                draws RAVENNA (AES67-compatible) and AVB / Milan for the Audio-Networked family.
//   2026-10-03 - illustrated: TX fan-out / RX ear glyphs, interop glyph by default, and an
//                L2-switch glyph for AVB / Milan; optional `glyph` prop; shared Badge layout.

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/IPMedia/AES67.tsx
 *
 * AES67 interoperability badge: dark-green ring (distinct from the ST 2110
 * audio green), word, caption and a direction glyph for TX/RX. RAVENNA
 * (blue, "RAV") and AVB / Milan (grey, switch glyph) reuse it re-worded.
 */

import React from 'react';
import { Badge } from './Badge';
import { DirGlyph, Interop, L2Switch, parseDirSub } from './glyphs';

const ACCENT = '#1e7e34';
const RAVENNA = '#0b6e99';
const MILAN = '#5d6d7e';

const AES67Base: React.FC<{
    sub?: string; dir?: 'tx' | 'rx'; word?: string; accent?: string; glyph?: React.ReactNode;
}> = ({ sub, dir, word = 'AES67', accent = ACCENT, glyph }) => {
    const d = dir ?? parseDirSub(sub).dir;
    const drawn = glyph ?? (d ? <DirGlyph dir={d} c={accent} /> : <Interop c={accent} />);
    return <Badge accent={accent} glyph={drawn} big={word} bigSize={26} caption={sub} />;
};

const AES67RX: React.FC = () => <AES67Base sub="RX" dir="rx" />;
const AES67TX: React.FC = () => <AES67Base sub="TX" dir="tx" />;

const RavennaRX: React.FC = () => <AES67Base word="RAV" sub="RX" dir="rx" accent={RAVENNA} />;
const RavennaTX: React.FC = () => <AES67Base word="RAV" sub="TX" dir="tx" accent={RAVENNA} />;
const Milan: React.FC = () => (
    <AES67Base word="AVB" sub="MILAN" accent={MILAN} glyph={<L2Switch c={MILAN} />} />
);

export default AES67TX;
export { AES67Base, AES67RX, AES67TX, RavennaRX, RavennaTX, Milan };
