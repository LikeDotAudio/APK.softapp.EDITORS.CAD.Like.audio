// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-14 - ST 2110-10 / -20 / -21 / -30 and ST 2022-7 descriptions now carry the standards' numbers (read from the
//     2017 / 2013 texts). SMPTE-Audio and MXL (smpteMediaConnectors.ts) count as flows in isIpFlowType, as do the
//     dataflow ports (logicConnectors.ts). Neither joins IPAM's IP_FLOW_FAMILIES: they carry no IP address.
//   2026-10-09 - DDM Manager joins Audio-Networked after Dante (owner: "a new flow type should be called DDM manager", "all dante flows
//     should be moip for DDM as well"): DDM-RX2/8/16, DDM-TX2/8/16, the bare DDM flow and DDM-MC — Dante under a Dante Domain Manager domain.
//   2026-10-09 - streams, AV-over-IP, VoIP, codecs and containers are flows, not plugs: the palette's physical view
//     leaves them out (owner: "I would like to add these video and audio networking connectors", "I would like a new set of connectors called Codes").
//   2026-10-09 - Q-LAN joins Audio-Networked (owner: "i would like to add Q lan to the audio networked"): QLAN-RX2/8/16, QLAN-TX2/8/16 and the bare QLAN stream,
//     after Dante. Q-LAN streams are UNICAST (QSC: UDP 6518-7030, one port per stream), so a TX gets no group.
//   2026-10-05 - `isIpFlowType`: which connectors are network FLOWS rather than physical plugs (owner: "connectors are
//     here.... and these are physical...", "this should be visibible when the IP netwrok flows are there").
//   2026-10-03 - created (owner, 2026-10-03: "what if there was SMPTE ST2110", "THEN THERE
//     SHOULD BE A CONNECTOR CALLED NMOS", "under AUDIO there should be a bunch of DANTE
//     receivers, then an AES67 receiver", "this all should be Audio Networked"). The IP-media vocabulary: the ST 2110 family,
//     the NMOS family, the Audio-Networked family (Dante / AES67 / RAVENNA / Milan),
//     and Dante AV for the Video family.

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/ipMediaConnectors.ts
 *
 * IP MEDIA "CONNECTORS" — ESSENCE FLOWS, NOT HOLES IN A PANEL.
 *
 * An ST 2110 audio stream, a Dante flow or an NMOS control endpoint is not a
 * thing you crimp: it rides a network interface (an RJ45, an SFP) that is
 * already in the catalogue. They are listed as connectors anyway because the
 * connector is what a drafter PICKS for a port, and a port typed "ST2110-30"
 * says what it carries the way "X3P" does — which is the only question the
 * drawing, the crosspoint and IPAM ask of it.
 *
 * Kept out of `ConnectorLookup.ts` (which imports these) so the catalogue file
 * stays a table of physical parts plus three spliced-in lists, and so the flow
 * PRESETS (`FEATURES/FEATURE.IpMedia/ipFlowPresets.ts`) can be checked against
 * one short file rather than seven hundred lines.
 *
 * # Senders and receivers are entries of their own
 *
 * `DANTE-TX8` is "a Dante transmit flow of 8 channels (generated)": picking it
 * creates an OUTPUT bracket of eight channel leaves; `DANTE-RX8` an INPUT
 * bracket. The owner asked for them to read in the picker directly, receivers
 * first ("a bunch of DANTE receivers, then an AES67 receiver"), so the order
 * below is deliberate and the picker keeps it.
 */

import type { ConnectorEntry, ConnectorGroup } from './ConnectorLookup';
import { STREAMING_CODEC_GROUPS } from './streamingCodecConnectors';
import { SMPTE_MEDIA_GROUPS } from './smpteMediaConnectors';
import { LOGIC_GROUPS } from './logicConnectors';
import { MEDIA_FORMAT_GROUPS } from './mediaFormatConnectors';

/**
 * The Audio-Networked family (owner, 2026-10-03, over the Audio-* tabs: "this all
 * should be Audio Networked"). Receivers first, then transmitters — the owner's
 * order ("a bunch of DANTE receivers, then an AES67 receiver") — and the plain
 * Audio family keeps only its physical jacks.
 */
export const AUDIO_NETWORKED_GROUP: ConnectorGroup = {
    name: 'Audio-Networked',
    groupDescription: 'Networked audio — Dante, DDM Manager, Q-LAN, AES67 and other audio-over-IP flows; transmitters generate flows (multicast, or unicast for Q-LAN), receivers subscribe.',
    connectors: [
        { abbreviation: 'DANTE-RX2', description: 'Dante receive flow, 2 channels (consumed)' },
        { abbreviation: 'DANTE-RX8', description: 'Dante receive flow, 8 channels (consumed)' },
        { abbreviation: 'DANTE-RX16', description: 'Dante receive flow, 16 channels (consumed)' },
        { abbreviation: 'DANTE-TX2', description: 'Dante transmit flow, 2 channels (generated)' },
        { abbreviation: 'DANTE-TX8', description: 'Dante transmit flow, 8 channels (generated)' },
        { abbreviation: 'DANTE-TX16', description: 'Dante transmit flow, 16 channels (generated)' },
        { abbreviation: 'DANTE', description: 'Dante flow / channel — Audinate audio-over-IP, unicast or multicast flow' },
        { abbreviation: 'DANTE-MC', description: 'Dante multicast flow (generated, one-to-many)' },
        { abbreviation: 'DANTE-AES67', description: 'Dante flow in AES67 mode (interoperable RTP / PTPv2)' },
        { abbreviation: 'DDM-RX2', description: 'DDM Manager receive flow, 2 channels (consumed) — Dante under a Dante Domain Manager domain' },
        { abbreviation: 'DDM-RX8', description: 'DDM Manager receive flow, 8 channels (consumed) — Dante under a Dante Domain Manager domain' },
        { abbreviation: 'DDM-RX16', description: 'DDM Manager receive flow, 16 channels (consumed) — Dante under a Dante Domain Manager domain' },
        { abbreviation: 'DDM-TX2', description: 'DDM Manager transmit flow, 2 channels (generated, multicast) — Dante under a Dante Domain Manager domain' },
        { abbreviation: 'DDM-TX8', description: 'DDM Manager transmit flow, 8 channels (generated, multicast) — Dante under a Dante Domain Manager domain' },
        { abbreviation: 'DDM-TX16', description: 'DDM Manager transmit flow, 16 channels (generated, multicast) — Dante under a Dante Domain Manager domain' },
        { abbreviation: 'DDM', description: 'DDM Manager flow — a Dante flow whose devices are enrolled in a Dante Domain Manager domain (managed, secured Dante); a Dante receiver in the domain hears it' },
        { abbreviation: 'DDM-MC', description: 'DDM Manager multicast flow (generated, one-to-many) — Dante\'s 239.255.x.y : 4321 plan' },
        { abbreviation: 'QLAN-RX2', description: 'Q-LAN receive stream, 2 channels (consumed)' },
        { abbreviation: 'QLAN-RX8', description: 'Q-LAN receive stream, 8 channels (consumed)' },
        { abbreviation: 'QLAN-RX16', description: 'Q-LAN receive stream, 16 channels (consumed)' },
        { abbreviation: 'QLAN-TX2', description: 'Q-LAN transmit stream, 2 channels (generated, unicast)' },
        { abbreviation: 'QLAN-TX8', description: 'Q-LAN transmit stream, 8 channels (generated, unicast)' },
        { abbreviation: 'QLAN-TX16', description: 'Q-LAN transmit stream, 16 channels (generated, unicast)' },
        { abbreviation: 'QLAN', description: 'Q-LAN stream — QSC Q-SYS audio-over-IP: unicast RTP, 32-bit float, up to 16 channels per stream, PTPv2-clocked' },
        { abbreviation: 'AES67-RX', description: 'AES67 receive flow (consumed)' },
        { abbreviation: 'AES67-TX', description: 'AES67 transmit flow (generated, multicast) — the same wire format as ST 2110-30 (see the ST-2110 tab)' },
        { abbreviation: 'RAVENNA-RX', description: 'RAVENNA receive stream (consumed; AES67-compatible)' },
        { abbreviation: 'RAVENNA-TX', description: 'RAVENNA transmit stream (generated, multicast; AES67-compatible)' },
        { abbreviation: 'MILAN', description: 'AVB / Milan stream — IEEE 1722 AVTP over TSN (Layer 2: no IP multicast group)' },
    ],
};

/** Dante AV is video; it is filed in the Video family, beside HDMI and SDI. */
export const VIDEO_IP_FLOW_ENTRIES: ConnectorEntry[] = [
    { abbreviation: 'DANTE-AV', description: 'Dante AV — video (and embedded audio) over Dante' },
];

export const ST2110_GROUP: ConnectorGroup = {
    name: 'ST-2110',
    groupDescription: 'SMPTE ST 2110 professional media over managed IP — essence flows carried on a network interface (not physical connectors)',
    connectors: [
        { abbreviation: 'ST2110-10', description: 'System timing & definitions — PTP (IEEE 1588, ST 2059-2 profile), RTP/UDP over IPv4 multicast (IGMPv3) or unicast; UDP ≤ 1460 octets (8960 extended, signalled MAXUDP); one SDP per stream with mediaclk + ts-refclk' },
        { abbreviation: 'ST2110-20', description: 'Uncompressed active video — RFC 4175-based, 90 kHz clock, video/raw; YCbCr / RGB / ICtCp 4:4:4 / 4:2:2 / 4:2:0 at 8-16 bit; BT.709 / BT.2020 / BT.2100; GPM or BPM packing' },
        { abbreviation: 'ST2110-21', description: 'Traffic shaping & delivery timing for video senders — TP=2110TPN (narrow, gapped), 2110TPNL (narrow linear) or 2110TPW (wide, software); receivers N / W / A' },
        { abbreviation: 'ST2110-22', description: 'Constant bit-rate compressed video (e.g. JPEG XS)' },
        { abbreviation: 'ST2110-23', description: 'Single video essence over multiple -20 streams' },
        { abbreviation: 'ST2110-30', description: 'PCM digital audio over AES67 (L16 / L24) — 48 kHz mandatory; receiver levels A (1-8 ch @ 1 ms), B (+ 125 µs), C (up to 64 ch @ 125 µs), AX / BX / CX add 96 kHz; channel-order=SMPTE2110.(ST, 51, 71, 222, SGRP …)' },
        { abbreviation: 'ST2110-30-RX2', description: 'ST 2110-30 audio receiver, 2 channels (consumed)' },
        { abbreviation: 'ST2110-30-RX8', description: 'ST 2110-30 audio receiver, 8 channels (consumed)' },
        { abbreviation: 'ST2110-30-RX16', description: 'ST 2110-30 audio receiver, 16 channels (consumed)' },
        { abbreviation: 'ST2110-30-TX2', description: 'ST 2110-30 audio sender, 2 channels (generated)' },
        { abbreviation: 'ST2110-30-TX8', description: 'ST 2110-30 audio sender, 8 channels (generated)' },
        { abbreviation: 'ST2110-30-TX16', description: 'ST 2110-30 audio sender, 16 channels (generated)' },
        { abbreviation: 'ST2110-31', description: 'AES3 transparent transport' },
        { abbreviation: 'ST2110-40', description: 'SMPTE ST 291-1 ancillary data' },
        { abbreviation: 'ST2110-41', description: 'Fast metadata framework' },
        { abbreviation: 'ST2110-43', description: 'Timed text markup (TTML)' },
        { abbreviation: 'ST2022-7', description: 'Seamless protection switching — identical RTP streams on two paths (red / blue), rebuilt packet by packet; receiver skew class A ≤ 10 ms, B ≤ 50 ms, C ≤ 150 / 450 ms; signalled a=group:DUP in 2110' },
    ],
};

export const NMOS_GROUP: ConnectorGroup = {
    name: 'NMOS',
    groupDescription: 'AMWA NMOS — discovery, registration and connection management for ST 2110 / IP media nodes',
    connectors: [
        { abbreviation: 'NMOS', description: 'NMOS Node — IS-04 discovery & registration / IS-05 connection management API endpoint' },
        { abbreviation: 'NMOS-IS04', description: 'AMWA IS-04 discovery & registration' },
        { abbreviation: 'NMOS-IS05', description: 'AMWA IS-05 device connection management' },
        { abbreviation: 'NMOS-IS07', description: 'AMWA IS-07 event & tally' },
        { abbreviation: 'NMOS-IS08', description: 'AMWA IS-08 audio channel mapping' },
        { abbreviation: 'NMOS-IS11', description: 'AMWA IS-11 stream compatibility management' },
        { abbreviation: 'NMOS-BCP-003', description: 'AMWA BCP-003 security (TLS, authorization)' },
        { abbreviation: 'NMOS-REG', description: 'NMOS Registry / Controller — server application (IS-04 registry, IS-05 controller)' },
    ],
};

/** Every flow connector: the three IP-media families, SMPTE-Audio and MXL, Dante AV, the stream / codec families and the
 *  dataflow ports (Idea / Result / Logic / Arithmetic). Everything else is a physical plug. */
const IP_FLOW_TYPES: ReadonlySet<string> = new Set(
    [AUDIO_NETWORKED_GROUP, ST2110_GROUP, NMOS_GROUP, ...SMPTE_MEDIA_GROUPS, ...STREAMING_CODEC_GROUPS, ...LOGIC_GROUPS, ...MEDIA_FORMAT_GROUPS].flatMap(g => g.connectors).concat(VIDEO_IP_FLOW_ENTRIES).map(c => c.abbreviation),
);
/** True when `type` is a flow (Dante, AES67, ST 2110, NMOS, MXL, a dataflow port …), not a plug you can hold.
 *  IPAM's narrower question, which flows carry an IP address, is IP_FLOW_FAMILIES in ipFlowPresets.ts. */
export const isIpFlowType = (type: string): boolean => IP_FLOW_TYPES.has(type);
