// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-14 - Idea / Result / Logic / Arithmetic dataflow families from logicConnectors.ts (owner: "new categories....
//     like "IDEA" or RESULT" or baseic logic and arithmatic"; ruled: dataflow node ports, a Logic tab of their own).
//   2026-10-14 - SMPTE-Audio (ST 299-1, ST 337 / 339 / 340, ST 2041-2 / -3, ST 2035, ST 2036-2) and MXL families spliced in
//     from smpteMediaConnectors.ts (owner: "these smpte connections and standard should be a part of the repetoire",
//     "FOR MOIP I would like to add MXL from the EBU").
//   2026-10-14 - AES pinouts in the descriptions: AES14 on X3/X5 (checked against the AES14-1992 r2014 text: pin 2 positive, male = output), AES3 110 ohm on X3 and AES3-id 75 ohm on BNC,
//     the AES59 DB25 channel/pin table + gender on A59P/A59S (checked against the AES59-2012 text). Reference notes in Audio/AES connector standards.md.
//   2026-10-14 - Video coax details from Video/coax connector types.JPG: BNC / DIN1 / HDBNC descriptions now name
//     each one's lock (bayonet vs push-pull), size and non-intermating; HD-BNC spelled out as High Density BNC.
//   2026-10-10 - NONE joins the Blank group: the one word for a port with no physical connector (roadmap 202609172012,
//     ruled 2026-09-23: "one NONE in place of ''/BLANK/VIRTUAL"). VIRTUAL → NONE joins CONNECTOR_LEGACY_SPELLINGS.
//     BLANK stays its own entry (a real blanking plate) and '' stays "default jack" until the owner rules those two.
//   2026-10-09 - six families from streamingCodecConnectors.ts: IP-Streaming, AV-over-IP, VoIP, Codecs-Audio, Codecs-Video,
//     Codecs-Container (owner: "I would like to add these video and audio networking connectors", "I would like a new set of connectors called Codes", "be sure to make icons").
//   2026-10-05 - one spelling per connector (roadmap 202609172012, ruled 2026-09-23): RJ45 over
//                8P8C, USB-A over USBA, USB-C over USBC, Power-AC over AC-Power, RS-232 over RS232,
//                DB-9 over DB9, C13 over 'IEC C13'. CONNECTOR_LEGACY_SPELLINGS feeds the same _renamed
//                loop as the AES72 aliases, so old files still resolve; the picker lists only winners.
//   2026-10-03 - IP media (owner, 2026-10-03): the ST-2110 and NMOS families and the
//                Audio-Networked family (Dante / AES67 / RAVENNA / Milan flows), plus DANTE-AV
//                at the end of Video. The entries live in ipMediaConnectors.ts.
//   2026-09-25 - RJ45-100M / -1G / -2.5G / -5G / -10G: the RJ45 with its link rate named (owner),
//                so ports and NetBox are pre-programmed. A bare RJ45 now reads as 1000BASE-T.
//   2026-08-11 - add TRSS (SOCKET : 1/4" stereo TRS). The Audio group carried the
//                TRS plug (TRSP) and the TS socket (TSS) but no TRS socket, which is
//                the jack every wall panel and patch field in a post house actually
//                mounts. Projects were spelling it '1/4" TRS' as free text.
//   2026-07-22 15:55 - add Robo rugged-multipin group (ROBO plug / ROBO-S socket), defaultCutout 'oversize-D' (roadmap §5; cutout class confirmed by user)
//   2026-06-22 10:40 - LC-Fiber group defaults to a square cutout (roadmap §6)
//   2026-06-22 10:34 - add cutout (CutoutClass) to ConnectorEntry + defaultCutout to ConnectorGroup; Keystone group defaults to a square cutout (roadmap §2)
//   2026-06-09 - add divBlock + argoPanelName (DIV Argo inventory) to ConnectorEntry; add Centronics, CP23-19, DL96, EDAC20, Switchcraft XS7P/XS7S, Bezel, SMPTE/Triax thru/flange variants, Banana HD/SKT variants, extra Keystone types, DIN5S, PLX-MM, flange/thru Argo blocks
//   2026-06-06 23:40 - rename EDAC E#PP/E#SS → single suffix E#P (plug) / E#S (socket)
//   2026-06-05 20:11 - add Keystone family (KEY-* square snap-in jacks)
//   2026-06-23 00:33 - trimmed older changelog entries to the most recent (full history in git)

/**
 * Structured connector lookup table organized by signal group.
 * Ported from C# WASS.Lookup.ConnectorLookupTable.
 *
 * Each group has a description and a list of connector entries
 * with abbreviation + description.
 */

import type { CutoutClass } from './cutoutClasses';
import { AES72_TYPES, AES72_LEGACY_SPELLINGS, aes72Description } from './aes72';
import { AUDIO_NETWORKED_GROUP, VIDEO_IP_FLOW_ENTRIES, ST2110_GROUP, NMOS_GROUP } from './ipMediaConnectors';
import { STREAMING_CODEC_GROUPS } from './streamingCodecConnectors';
import { SMPTE_AUDIO_GROUP, MXL_GROUP } from './smpteMediaConnectors';
import { LOGIC_GROUPS } from './logicConnectors';
import { MEDIA_FORMAT_GROUPS } from './mediaFormatConnectors';

/**
 * AES59-2012 Annex C (the TASCAM DA-88 analog layout, standardized) — circuit: positive / return / shield.
 * Pin 13 is not used. §4.1: equipment is always the female socket, cables always male — the
 * reverse of AES14's XLR rule. Annex D's digital combined I/O keeps these pins with circuits
 * 1-4 = AES3 receive, 5-8 = AES3 transmit. Yamaha's DB25 is a different wiring and does not mate.
 */
const AES59_PINOUT = 'Ch1 24/12/25, Ch2 10/23/11, Ch3 21/9/22, Ch4 7/20/8, Ch5 18/6/19, Ch6 4/17/5, Ch7 15/3/16, Ch8 1/14/2 (+/return/shield); pin 13 not used. 4/40 UNC jackscrews. Not Yamaha-wired';

export type ArgoWidth = 'Narrow' | 'Normal' | 'Wide' | 'Extra Wide';
export type ArgoHeight = 'Short' | 'Normal' | 'Tall' | 'Extra Tall';

export interface ConnectorEntry {
    abbreviation: string;
    description: string;
    divBlock?: string;       // DIV_CON-xxx Argo block name
    argoPanelName?: string;  // Argo ribbon/inventory panel display name
    argoWidth?: ArgoWidth;   // Argo symbol width
    argoHeight?: ArgoHeight; // Argo symbol height
    cutout?: CutoutClass;    // panel cutout this connector needs (default 'D'; inherits group defaultCutout)
}

export interface ConnectorGroup {
    name: string;
    groupDescription: string;
    connectors: ConnectorEntry[];
    defaultCutout?: CutoutClass; // cutout applied to entries in this group that don't set their own
}

export const CONNECTOR_GROUPS: ConnectorGroup[] = [
    // ── Blank ────────────────────────────────────────────
    {
        name: 'Blank',
        groupDescription: 'Blanking plates — cover an unused panel position so it stays a sealed face.',
        connectors: [
            { abbreviation: 'BLANK', description: 'Blank / blanking plate — covers an unused position', divBlock: 'DIV_CON-X-GEN', argoPanelName: 'XLR GENERIC/BLANK', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'NONE', description: 'No connector — a virtual or logical port with nothing to plug (was VIRTUAL)' },
        ],
    },

    // ── Keystone ─────────────────────────────────────────
    {
        name: 'Keystone',
        groupDescription: 'Keystone snap-in jacks — square modules that fit a square keystone panel cutout. Carry HDMI, network, fiber, coax, audio, and more.',
        defaultCutout: 'square',
        connectors: [
            { abbreviation: 'KEY-HDMI', description: 'Keystone HDMI pass-through jack', divBlock: 'DIV_CON-KEY-HDMI', argoPanelName: 'KEYSTONE HDMI', argoWidth: 'Narrow', argoHeight: 'Normal' },
            { abbreviation: 'KEY-Cat6', description: 'Keystone Cat6 RJ45 jack', divBlock: 'DIV_CON-KEY-RJ45', argoPanelName: 'KEYSTONE RJ45/8P8C', argoWidth: 'Narrow', argoHeight: 'Normal' },
            { abbreviation: 'KEY-Cat6A', description: 'Keystone Cat6A RJ45 jack', divBlock: 'DIV_CON-KEY-RJ45', argoPanelName: 'KEYSTONE RJ45/8P8C', argoWidth: 'Narrow', argoHeight: 'Normal' },
            { abbreviation: 'KEY-LC fiber', description: 'Keystone LC fiber adapter', divBlock: 'DIV_CON-KEY-LC-DUP', argoPanelName: 'KEYSTONE LC DUPLEX', argoWidth: 'Narrow', argoHeight: 'Normal' },
            { abbreviation: 'KEY-SC fiber', description: 'Keystone SC fiber adapter', divBlock: 'DIV_CON-KEY-SC-DUP', argoPanelName: 'KEYSTONE SC DUPLEX', argoWidth: 'Narrow', argoHeight: 'Normal' },
            { abbreviation: 'KEY-SC simplex', description: 'Keystone SC simplex fiber adapter', divBlock: 'DIV_CON-KEY-SC-SIN', argoPanelName: 'KEYSTONE SC SIMPLEX', argoWidth: 'Narrow', argoHeight: 'Normal' },
            { abbreviation: 'KEY-ST', description: 'Keystone ST simplex fiber adapter', divBlock: 'DIV_CON-KEY-ST', argoPanelName: 'KEYSTONE ST SIMPLEX', argoWidth: 'Narrow', argoHeight: 'Normal' },
            { abbreviation: 'KEY-BNC', description: 'Keystone BNC coax jack', divBlock: 'DIV_CON-KEY-BNC', argoPanelName: 'KEYSTONE BNC', argoWidth: 'Narrow', argoHeight: 'Normal' },
            { abbreviation: 'KEY-3.5mm', description: 'Keystone 3.5mm TRS jack', divBlock: 'DIV_CON-KEY-35MM', argoPanelName: 'KEYSTONE 35MM', argoWidth: 'Narrow', argoHeight: 'Normal' },
            { abbreviation: 'KEY-Coaxial', description: 'Keystone F-type coaxial jack', divBlock: 'DIV_CON-KEY-FCON', argoPanelName: 'KEYSTONE F', argoWidth: 'Narrow', argoHeight: 'Normal' },
            { abbreviation: 'KEY-Banana', description: 'Keystone banana binding-post jack' },
            { abbreviation: 'KEY-RCA', description: 'Keystone RCA jack', divBlock: 'DIV_CON-KEY-RCA', argoPanelName: 'KEYSTONE RCA', argoWidth: 'Narrow', argoHeight: 'Normal' },
            { abbreviation: 'KEY-RJ11', description: 'Keystone RJ11/6P4C jack', divBlock: 'DIV_CON-KEY-RJ11', argoPanelName: 'KEYSTONE RJ11/6P4C', argoWidth: 'Narrow', argoHeight: 'Normal' },
            { abbreviation: 'KEY-MDIN4', description: 'Keystone Mini DIN 4-pin jack', divBlock: 'DIV_CON-KEY-MDIN4', argoPanelName: 'KEYSTONE MINI DIN 4', argoWidth: 'Narrow', argoHeight: 'Normal' },
            { abbreviation: 'KEY-MDIN6', description: 'Keystone Mini DIN 6-pin jack', divBlock: 'DIV_CON-KEY-MDIN6', argoPanelName: 'KEYSTONE MINI DIN 6', argoWidth: 'Narrow', argoHeight: 'Normal' },
            { abbreviation: 'KEY-USB-A', description: 'Keystone USB-A jack', divBlock: 'DIV_CON-KEY-USB-A', argoPanelName: 'KEYSTONE USB A', argoWidth: 'Narrow', argoHeight: 'Normal' },
            { abbreviation: 'KEY-GEN', description: 'Keystone generic / configurable', divBlock: 'DIV_CON-KEY-GEN', argoPanelName: 'KEYSTONE GENERIC', argoWidth: 'Narrow', argoHeight: 'Normal' },
        ],
    },

    // ── Power AC ─────────────────────────────────────────
    {
        name: 'Power-AC',
        groupDescription: 'AC mains power connectors — NEMA, IEC, Neutrik PowerCon — used for equipment power distribution in racks and field positions.',
        connectors: [
            { abbreviation: '5-20', description: 'NEMA 5-20 Non-locking 20A - 125V' },
            { abbreviation: '5-15P', description: 'PLUG : NEMA 5-15 Non-locking 15A - 125V' },
            { abbreviation: '5-15S', description: 'SOCKET : NEMA 5-15 Non-locking 15A - 125V' },
            { abbreviation: '5-20S', description: 'SOCKET : NEMA 5-20 Non-locking 20A - 125V' },
            { abbreviation: 'C1', description: 'IEC C1 Power PLUG 2 pin non polarised (Electric Shaver)' },
            { abbreviation: 'C2', description: 'IEC C2 Power SOCKET 2 pin non polarised (Electric Shaver)' },
            { abbreviation: 'C5', description: 'IEC C5 Power PLUG 3 pin (Mickey Mouse)' },
            { abbreviation: 'C6', description: 'IEC C6 Power SOCKET 3 pin (Mickey Mouse)' },
            { abbreviation: 'C7', description: 'IEC C7 Power PLUG 2 pin (Figure of 8)' },
            { abbreviation: 'C8', description: 'IEC C8 Power SOCKET 2 pin (Figure of 8)' },
            { abbreviation: 'C13', description: 'IEC C13 Power PLUG 3 pin. Standard equipment' },
            { abbreviation: 'C14', description: 'IEC C14 Power SOCKET 3 pin. Standard equipment' },
            { abbreviation: 'C15', description: 'IEC C15 Power PLUG 3 pin. Some Cisco switches' },
            { abbreviation: 'C16', description: 'IEC C16 Power SOCKET 3 pin. Some Cisco switches' },
            { abbreviation: 'C19', description: 'IEC C19 Power PLUG 3 pin. Server rack PDUs' },
            { abbreviation: 'C20', description: 'IEC C20 Power SOCKET 3 pin. Server rack PDUs' },
            { abbreviation: 'L5-15P', description: 'PLUG : NEMA L5-15 Twist-lock 15A - 125V' },
            { abbreviation: 'L5-15R', description: 'RECEPTACLE : NEMA L5-15 Twist-lock 15A - 125V' },
            { abbreviation: 'L5-20P', description: 'PLUG : NEMA L5-20 Twist-lock 20A - 125V' },
            { abbreviation: 'L5-20R', description: 'RECEPTACLE : NEMA L5-20 Twist-lock 20A - 125V' },
            { abbreviation: 'L5-30P', description: 'PLUG : NEMA L5-30 Twist-lock 30A - 125V' },
            { abbreviation: 'L5-30R', description: 'RECEPTACLE : NEMA L5-30 Twist-lock 30A - 125V' },
            { abbreviation: 'L6-20P', description: 'PLUG : NEMA L6-20 Twist-lock 20A - 250V' },
            { abbreviation: 'L6-20R', description: 'RECEPTACLE : NEMA L6-20 Twist-lock 20A - 250V' },
            { abbreviation: 'L6-30P', description: 'PLUG : NEMA L6-30 Twist-lock 30A - 250V' },
            { abbreviation: 'L6-30R', description: 'RECEPTACLE : NEMA L6-30 Twist-lock 30A - 250V' },
            { abbreviation: 'PC1P', description: 'PLUG : Neutrik PowerCon TRUE1 IP65 rated' },
            { abbreviation: 'PC1S', description: 'SOCKET : Neutrik PowerCon TRUE1 IP65 rated' },
            { abbreviation: 'PC20BP', description: 'PLUG : Neutrik PowerCon 20A Blue' },
            { abbreviation: 'PC20BS', description: 'SOCKET : Neutrik PowerCon 20A Blue' },
            { abbreviation: 'PC20GP', description: 'PLUG : Neutrik PowerCon 20A Grey' },
            { abbreviation: 'PC20GS', description: 'SOCKET : Neutrik PowerCon 20A Grey' },
            { abbreviation: 'PC32P', description: 'PLUG : Neutrik PowerCon 32A' },
            { abbreviation: 'PC32S', description: 'SOCKET : Neutrik PowerCon 32A' },
        ],
    },

    // ── Audio XLR ──────────────────────────────────────────
    {
        name: 'Audio-XLR',
        groupDescription: 'XLR circular connectors — 3 to 8 pin variants, Neutrik and Switchcraft — for balanced mic, line, intercom, and DMX. 3- and 5-pin polarity and gender per AES14-1992 (r2014): pin 2 positive, male on outputs.',
        connectors: [
            { abbreviation: 'X3P', description: 'PLUG : 3-pin XLR — AES14: male = equipment output; pin 1 screen, 2 positive, 3 return (phantom: + supply on 2 & 3, − on 1). Also AES3 (AES/EBU) 110 ohm digital audio', divBlock: 'DIV_CON-X3P-01', argoPanelName: 'XLR 3P', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'X3S', description: 'SOCKET : 3-pin XLR — AES14: female = equipment input; pin 1 screen, 2 positive, 3 return (phantom: + supply on 2 & 3, − on 1). Also AES3 (AES/EBU) 110 ohm digital audio', divBlock: 'DIV_CON-X3S-01', argoPanelName: 'XLR 3S', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'X4P', description: 'PLUG : 4-pin XLR', divBlock: 'DIV_CON-X4P-01', argoPanelName: 'XLR 4P', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'X4S', description: 'SOCKET : 4-pin XLR', divBlock: 'DIV_CON-X4S-01', argoPanelName: 'XLR 4S', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'X5P', description: 'PLUG : 5-pin XLR — AES14: male = equipment output; two-channel pin 1 screen, 2 L+, 3 L return, 4 R+, 5 R return', divBlock: 'DIV_CON-X5P-01', argoPanelName: 'XLR 5P', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'X5S', description: 'SOCKET : 5-pin XLR — AES14: female = equipment input; two-channel pin 1 screen, 2 L+, 3 L return, 4 R+, 5 R return', divBlock: 'DIV_CON-X5S-01', argoPanelName: 'XLR 5S', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'X6P', description: 'PLUG : 6-pin XLR', divBlock: 'DIV_CON-X6P-01', argoPanelName: 'XLR 6P', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'X6S', description: 'SOCKET : 6-pin XLR', divBlock: 'DIV_CON-X6S-01', argoPanelName: 'XLR 6S', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'X7P', description: 'PLUG : 7-pin XLR', divBlock: 'DIV_CON-X7P-01', argoPanelName: 'XLR 7P (Neutrik)', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'X7S', description: 'SOCKET : 7-pin XLR', divBlock: 'DIV_CON-X7S-01', argoPanelName: 'XLR 7S (Neutrik)', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'X8P', description: 'PLUG : 8-pin XLR' },
            { abbreviation: 'X8S', description: 'SOCKET : 8-pin XLR' },
            { abbreviation: 'XS3P', description: 'PLUG : 3-pin XLR Switchcraft' },
            { abbreviation: 'XS3S', description: 'SOCKET : 3-pin XLR Switchcraft' },
            { abbreviation: 'XS4P', description: 'PLUG : 4-pin XLR Switchcraft' },
            { abbreviation: 'XS4S', description: 'SOCKET : 4-pin XLR Switchcraft' },
            { abbreviation: 'XS5P', description: 'PLUG : 5-pin XLR Switchcraft' },
            { abbreviation: 'XS5S', description: 'SOCKET : 5-pin XLR Switchcraft' },
            { abbreviation: 'XS7P', description: 'PLUG : 7-pin XLR Switchcraft', divBlock: 'DIV_CON-X7P-02', argoPanelName: 'XLR 7P (Switchcraft)', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'XS7S', description: 'SOCKET : 7-pin XLR Switchcraft', divBlock: 'DIV_CON-X7S-02', argoPanelName: 'XLR 7S (Switchcraft)', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'XBEZ', description: 'XLR bezel / color ring', divBlock: 'DIV_CON-BEZ-01', argoPanelName: 'XLR BEZEL', argoWidth: 'Normal', argoHeight: 'Normal' },
        ],
    },

    // ── Audio Multipin ───────────────────────────────────
    {
        name: 'Audio-Multipin',
        groupDescription: 'Multi-conductor audio connectors — Amphenol, EDAC/Elco, MASS, DT12, Centronics, terminal blocks, SpeakON — for large channel-count and speaker distribution.',
        connectors: [
            { abbreviation: 'A59P', description: `PLUG : DB25 AES59 (TASCAM) 8-channel balanced audio multipin — AES59: cables are always male. ${AES59_PINOUT}` },
            { abbreviation: 'A59S', description: `SOCKET : DB25 AES59 (TASCAM) 8-channel balanced audio multipin — AES59: equipment is always female. ${AES59_PINOUT}` },
            // AES72-2019 Table 1 — nine surveyed RJ45 wirings, each a 4-channel
            // multipin. Generated from `aes72.ts` rather than listed here, so
            // the picker cannot offer a type the capacity map has never heard of.
            ...AES72_TYPES.map(t => ({ abbreviation: t.abbreviation, description: aes72Description(t) })),
            { abbreviation: 'AMP50P', description: '50-conductor plug (Telco/Centronics/Champ/Amphenol/RJ21)' },
            { abbreviation: 'AMP50S', description: '50-conductor socket (Telco/Centronics/Champ/Amphenol/RJ21)' },
            { abbreviation: 'CENT24', description: 'Centronics 24-pin (Micro Ribbon)', divBlock: 'DIV_CON-CENT24-01', argoPanelName: 'CENTRONICS 24', argoWidth: 'Normal', argoHeight: 'Short' },
            { abbreviation: 'CENT36', description: 'Centronics 36-pin (Micro Ribbon)', divBlock: 'DIV_CON-CENT36-01', argoPanelName: 'CENTRONICS 36', argoWidth: 'Wide', argoHeight: 'Short' },
            { abbreviation: 'CENT50', description: 'Centronics 50-pin (Micro Ribbon)', divBlock: 'DIV_CON-CENT57-01', argoPanelName: 'CENTRONICS 50', argoWidth: 'Wide', argoHeight: 'Short' },
            { abbreviation: 'CP23-19', description: 'CP23-19 circular multipin connector', divBlock: 'DIV_CON-CP23-19', argoPanelName: 'MULTIPIN CP23-19', argoWidth: 'Wide', argoHeight: 'Tall' },
            { abbreviation: 'DL96', description: 'DL-96 multi-channel connector', divBlock: 'DIV_CON-DL96-01', argoPanelName: 'MULTIPIN DL-96', argoWidth: 'Extra Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'DT12P', description: 'Cannon FK-37, DT12 wiring standard', divBlock: 'DIV_CON-DT12P', argoPanelName: 'DT-12 P', argoWidth: 'Extra Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'DT12S', description: 'Cannon FK-37, DT12 wiring standard', divBlock: 'DIV_CON-DT12S', argoPanelName: 'DT-12 S', argoWidth: 'Extra Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'E8P', description: 'PLUG : EDAC/ELCO SAC38-8 — 8-channel audio multipin (38-pin shell)', divBlock: 'DIV_CON-EDAC-038-01', argoPanelName: 'EDAC 38', argoWidth: 'Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'E8S', description: 'SOCKET : EDAC/ELCO SAC38-8 — 8-channel audio multipin (38-pin shell)', divBlock: 'DIV_CON-EDAC-038-01', argoPanelName: 'EDAC 38', argoWidth: 'Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'E12P', description: 'PLUG : EDAC/ELCO SAC38-12 — 12-channel audio multipin (38-pin shell)', divBlock: 'DIV_CON-EDAC-038-01', argoPanelName: 'EDAC 38', argoWidth: 'Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'E12S', description: 'SOCKET : EDAC/ELCO SAC38-12 — 12-channel audio multipin (38-pin shell)', divBlock: 'DIV_CON-EDAC-038-01', argoPanelName: 'EDAC 38', argoWidth: 'Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'E16P', description: 'PLUG : EDAC/ELCO SAC56 — 16-channel audio multipin (56-pin shell)', divBlock: 'DIV_CON-EDAC-056-01', argoPanelName: 'EDAC 56', argoWidth: 'Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'E16S', description: 'SOCKET : EDAC/ELCO SAC56 — 16-channel audio multipin (56-pin shell)', divBlock: 'DIV_CON-EDAC-056-01', argoPanelName: 'EDAC 56', argoWidth: 'Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'E20P', description: 'PLUG : EDAC rectangular 20-position connector', divBlock: 'DIV_CON-EDAC-020-01', argoPanelName: 'EDAC 20', argoWidth: 'Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'E20S', description: 'SOCKET : EDAC rectangular 20-position connector', divBlock: 'DIV_CON-EDAC-020-01', argoPanelName: 'EDAC 20', argoWidth: 'Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'E26P', description: 'PLUG : EDAC/ELCO SAC90 — 26-channel audio multipin (90-pin shell)', divBlock: 'DIV_CON-EDAC-090-01', argoPanelName: 'EDAC 90', argoWidth: 'Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'E26S', description: 'SOCKET : EDAC/ELCO SAC90 — 26-channel audio multipin (90-pin shell)', divBlock: 'DIV_CON-EDAC-090-01', argoPanelName: 'EDAC 90', argoWidth: 'Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'E32P', description: 'PLUG : EDAC/ELCO SAC120 — 32-channel audio multipin (120-pin shell)', divBlock: 'DIV_CON-EDAC-120-01', argoPanelName: 'EDAC 120', argoWidth: 'Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'E32S', description: 'SOCKET : EDAC/ELCO SAC120 — 32-channel audio multipin (120-pin shell)', divBlock: 'DIV_CON-EDAC-120-01', argoPanelName: 'EDAC 120', argoWidth: 'Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'MS###', description: 'PLUG : MASS hermaphroditic. ## = number of pins' },
            { abbreviation: 'TB##P', description: 'PLUG : Terminal Block. ## = number of connections' },
        ],
    },

    // ── Audio Bloc ───────────────────────────────────────
    {
        name: 'Audio-Bloc',
        groupDescription: 'Euroblock / Phoenix style pluggable terminal blocks for audio — compact screw-terminal connectors common on DSPs, amplifiers, and AV processors.',
        connectors: [
            { abbreviation: 'E3P', description: 'PLUG : Elco3 / Edac3 — single-channel (T/R/S) audio connector' },
            { abbreviation: 'E3S', description: 'SOCKET : Elco3 / Edac3 — single-channel (T/R/S) audio connector' },
            { abbreviation: 'MPB2', description: 'MultiPinBlock 2 Terminal (Euroblock / Phoenix)' },
            { abbreviation: 'MPB3', description: 'MultiPinBlock 3 Terminal (Euroblock / Phoenix)' },
            { abbreviation: 'MPB4', description: 'MultiPinBlock 4 Terminal (Euroblock / Phoenix)' },
            { abbreviation: 'MPB5', description: 'MultiPinBlock 5 Terminal (Euroblock / Phoenix)' },
            { abbreviation: 'MPB6', description: 'MultiPinBlock 6 Terminal (Euroblock / Phoenix)' },
            { abbreviation: 'MPB7', description: 'MultiPinBlock 7 Terminal (Euroblock / Phoenix)' },
            { abbreviation: 'MPB8', description: 'MultiPinBlock 8 Terminal (Euroblock / Phoenix)' },
            { abbreviation: 'MPB9', description: 'MultiPinBlock 9 Terminal (Euroblock / Phoenix)' },
        ],
    },

    // ── Audio Speaker ────────────────────────────────────
    {
        name: 'Audio-Speaker',
        groupDescription: 'Speaker-level connectors — SpeakON twist-lock for amplifier-to-loudspeaker links.',
        connectors: [
            { abbreviation: 'SPK2P', description: 'PLUG : 2 pole SpeakON' },
            { abbreviation: 'SPK2S', description: 'SOCKET : 2 pole SpeakON' },
            { abbreviation: 'SPK4P', description: 'PLUG : 4 pole SpeakON' },
            { abbreviation: 'SPK4S', description: 'SOCKET : 4 pole SpeakON', divBlock: 'DIV_CON-NL4MPR', argoPanelName: 'FLANGE SPEAKON', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'SPK8P', description: '8 pole SpeakON' },
            { abbreviation: 'SPK8S', description: 'SOCKET : 8 pole SpeakON' },
        ],
    },

    // ── Audio ─────────────────────────────────────────────
    {
        name: 'Audio',
        groupDescription: 'Analog and digital audio connectors — TRS, RCA, banana, TOSLINK — for line-level, headphone, and consumer audio signals.',
        connectors: [
            { abbreviation: 'BAN1', description: 'Banana (Single)', divBlock: 'DIV_CON-BAN-BP1', argoPanelName: 'BINDING 1X BP', argoWidth: 'Narrow', argoHeight: 'Short' },
            { abbreviation: 'BAN1-HD', description: 'Banana single 5-way heavy duty', divBlock: 'DIV_CON-BAN-HD1', argoPanelName: 'BINDING 1X HVY DTY', argoWidth: 'Narrow', argoHeight: 'Short' },
            { abbreviation: 'BAN1-SK', description: 'Banana single socket', divBlock: 'DIV_CON-BAN-SK1', argoPanelName: 'BINDING 1X SKT', argoWidth: 'Narrow', argoHeight: 'Short' },
            { abbreviation: 'BAN2', description: 'Banana (Pair)', divBlock: 'DIV_CON-BAN-BP2', argoPanelName: 'BINDING 2X BP', argoWidth: 'Normal', argoHeight: 'Short' },
            { abbreviation: 'BAN2-HD', description: 'Banana dual 5-way heavy duty', divBlock: 'DIV_CON-BAN-HD2', argoPanelName: 'BINDING 2X HVY DTY', argoWidth: 'Normal', argoHeight: 'Short' },
            { abbreviation: 'BAN2-SK', description: 'Banana dual socket', divBlock: 'DIV_CON-BAN-SK2', argoPanelName: 'BINDING 2X SKT', argoWidth: 'Normal', argoHeight: 'Short' },
            { abbreviation: 'M-TRRS', description: 'Mini Tip Ring Ring Shield (3.5mm Stereo w/ Mic)' },
            { abbreviation: 'M-TRS', description: 'Mini Tip Ring Shield (3.5mm Stereo)', divBlock: 'DIV_CON-MTRS-THRU-01', argoPanelName: 'THRU MTRS', argoWidth: 'Narrow', argoHeight: 'Short' },
            { abbreviation: 'M-TS', description: 'Mini Tip Shield (3.5mm Mono)', divBlock: 'DIV_CON-MTS-THRU-01', argoPanelName: 'THRU MTS', argoWidth: 'Narrow', argoHeight: 'Short' },
            { abbreviation: 'RCA', description: 'RCA Phono', divBlock: 'DIV_CON-RCA-THRU-01', argoPanelName: 'THRU RCA S', argoWidth: 'Narrow', argoHeight: 'Short' },
            { abbreviation: 'SPADE', description: 'Spade lug' },
            { abbreviation: 'SPDIF', description: 'Digital RCA Plug' },
            { abbreviation: 'TOSS', description: 'SOCKET : TOSLINK optical' },
            { abbreviation: 'TRRS', description: 'Tip Ring Ring Shield (1/4" 4-Conductor Balanced/Mic)' },
            { abbreviation: 'TRSP', description: 'PLUG : Tip Ring Shield (1/4" Stereo)', divBlock: 'DIV_CON-TRS-THRU-01', argoPanelName: 'THRU TRS S', argoWidth: 'Narrow', argoHeight: 'Short' },
            { abbreviation: 'TRSS', description: 'SOCKET : Tip Ring Shield (1/4" Stereo)', divBlock: 'DIV_CON-TRS-THRU-01', argoPanelName: 'THRU TRS S', argoWidth: 'Narrow', argoHeight: 'Short' },
            { abbreviation: 'TSS', description: 'SOCKET : Tip Shield (1/4" Mono)', divBlock: 'DIV_CON-TS-THRU-01', argoPanelName: 'THRU TS S', argoWidth: 'Narrow', argoHeight: 'Short' },
        ],
    },

    // ── Patchbay ──────────────────────────────────────────
    {
        name: 'Patchbay',
        groupDescription: 'Patchbay jacks — high-density patch points for studio and broadcast routing. TT (Tiny Telephone / Bantam) for balanced audio; MV (Micro Video) for 75-ohm video.',
        connectors: [
            { abbreviation: 'TT', description: 'Tiny Telephone (Bantam) — 4.4mm balanced TRS audio patch jack' },
            { abbreviation: 'MV', description: 'Micro Video — high-density 75 ohm video patch jack (e.g. Bittree DS800-MV)' },
        ],
    },

    // ── Power DC ─────────────────────────────────────────
    {
        name: 'Power-DC',
        groupDescription: 'DC power connectors — circular barrel and multi-pole — for low-voltage device power.',
        connectors: [
            { abbreviation: 'CIR1P', description: 'PLUG : 1 pole Circular Power' },
            { abbreviation: 'CIR1S', description: 'SOCKET : 1 pole Circular Power' },
            { abbreviation: 'CIR2P', description: 'PLUG : 2 pole Circular Power' },
            { abbreviation: 'CIR2S', description: 'SOCKET : 2 pole Circular Power' },
        ],
    },

    // ── D-Sub ─────────────────────────────────────────────
    {
        name: 'D-Sub',
        groupDescription: 'D-Subminiature connectors — standard density and high density — for data, control, and legacy video.',
        connectors: [
            { abbreviation: 'D9P', description: 'PLUG : D-Sub 9pin', divBlock: 'DIV_CON-D09P-01', argoPanelName: 'DSUB 9P', argoWidth: 'Normal', argoHeight: 'Short' },
            { abbreviation: 'D9S', description: 'SOCKET : D-Sub 9pin', divBlock: 'DIV_CON-D09S-01', argoPanelName: 'DSUB 9S', argoWidth: 'Normal', argoHeight: 'Short' },
            { abbreviation: 'D15P', description: 'PLUG : D-Sub 15pin', divBlock: 'DIV_CON-D15P-01', argoPanelName: 'DSUB 15P', argoWidth: 'Normal', argoHeight: 'Short' },
            { abbreviation: 'D15S', description: 'SOCKET : D-Sub 15pin', divBlock: 'DIV_CON-D15S-01', argoPanelName: 'DSUB 15S', argoWidth: 'Normal', argoHeight: 'Short' },
            { abbreviation: 'D19P', description: 'PLUG : D-Sub 19pin' },
            { abbreviation: 'D19S', description: 'SOCKET : D-Sub 19pin' },
            { abbreviation: 'D25P', description: 'PLUG : D-Sub 25pin', divBlock: 'DIV_CON-D25P-01', argoPanelName: 'DSUB 25P', argoWidth: 'Wide', argoHeight: 'Short' },
            { abbreviation: 'D25S', description: 'SOCKET : D-Sub 25pin', divBlock: 'DIV_CON-D25S-01', argoPanelName: 'DSUB 25S', argoWidth: 'Wide', argoHeight: 'Short' },
            { abbreviation: 'D37P', description: 'PLUG : D-Sub 37pin', divBlock: 'DIV_CON-D37P-01', argoPanelName: 'DSUB 37P', argoWidth: 'Extra Wide', argoHeight: 'Short' },
            { abbreviation: 'D37S', description: 'SOCKET : D-Sub 37pin', divBlock: 'DIV_CON-D37S-01', argoPanelName: 'DSUB 37S', argoWidth: 'Extra Wide', argoHeight: 'Short' },
            { abbreviation: 'D50P', description: 'PLUG : D-Sub 50pin', divBlock: 'DIV_CON-D50P-01', argoPanelName: 'DSUB 50P', argoWidth: 'Wide', argoHeight: 'Short' },
            { abbreviation: 'D50S', description: 'SOCKET : D-Sub 50pin', divBlock: 'DIV_CON-D50S-01', argoPanelName: 'DSUB 50S', argoWidth: 'Wide', argoHeight: 'Short' },
            { abbreviation: 'DXPP', description: 'PLUG : D-Sub non-standard pins' },
            { abbreviation: 'DXSS', description: 'SOCKET : D-Sub non-standard pins' },
            { abbreviation: 'HD15P', description: 'PLUG : HD-Sub 15pin (VGA)', divBlock: 'DIV_CON-HD15P-01', argoPanelName: 'DSUB HD15P', argoWidth: 'Normal', argoHeight: 'Short' },
            { abbreviation: 'HD15S', description: 'SOCKET : HD-Sub 15pin (VGA)', divBlock: 'DIV_CON-HD15S-01', argoPanelName: 'DSUB HD15S', argoWidth: 'Normal', argoHeight: 'Short' },
            { abbreviation: 'HD26P', description: 'PLUG : HD-Sub 26pin' },
            { abbreviation: 'HD26S', description: 'SOCKET : HD-Sub 26pin' },
            { abbreviation: 'HD44P', description: 'PLUG : HD-Sub 44pin' },
            { abbreviation: 'HD44S', description: 'SOCKET : HD-Sub 44pin' },
            { abbreviation: 'HD62P', description: 'PLUG : HD-Sub 62pin' },
            { abbreviation: 'HD62S', description: 'SOCKET : HD-Sub 62pin' },
            { abbreviation: 'HD78P', description: 'PLUG : HD-Sub 78pin' },
            { abbreviation: 'HD78S', description: 'SOCKET : HD-Sub 78pin' },
            { abbreviation: 'HD100P', description: 'PLUG : HD-Sub 100pin' },
            { abbreviation: 'HD100S', description: 'SOCKET : HD-Sub 100pin' },
        ],
    },

    // ── FC Fiber ──────────────────────────────────────────
    {
        name: 'FC-Fiber',
        groupDescription: 'FC (Ferrule Connector) fiber optic — threaded coupling, high precision.',
        connectors: [
            { abbreviation: 'FCM1D', description: 'OM1 FC multimode DUPLEX' },
            { abbreviation: 'FCM1S', description: 'OM1 FC multimode SIMPLEX' },
            { abbreviation: 'FCM3D', description: 'OM3 FC multimode DUPLEX' },
            { abbreviation: 'FCM3S', description: 'OM3 FC multimode SIMPLEX' },
            { abbreviation: 'FCM4D', description: 'OM4 FC multimode DUPLEX' },
            { abbreviation: 'FCM4S', description: 'OM4 FC multimode SIMPLEX' },
            { abbreviation: 'FCS-D', description: 'FC Singlemode DUPLEX' },
            { abbreviation: 'FCS-S', description: 'FC Singlemode SIMPLEX' },
        ],
    },

    // ── LC Fiber ──────────────────────────────────────────
    {
        name: 'LC-Fiber',
        groupDescription: 'LC (Lucent Connector) fiber optic — small form factor, push-pull — most common fiber connector in AV and IT.',
        defaultCutout: 'square',
        connectors: [
            { abbreviation: 'LCA-D', description: 'LC APC Singlemode DUPLEX (Angle-polish)' },
            { abbreviation: 'LCA-S', description: 'LC APC Singlemode SIMPLEX (Angle-polish)' },
            { abbreviation: 'LCM1D', description: 'OM1 LC multimode DUPLEX', divBlock: 'DIV_CON-LC-MM-01', argoPanelName: 'FIBER LC MULT MODE', argoWidth: 'Narrow', argoHeight: 'Tall' },
            { abbreviation: 'LCM1S', description: 'OM1 LC multimode SIMPLEX', divBlock: 'DIV_CON-LC-MM-01', argoPanelName: 'FIBER LC MULT MODE', argoWidth: 'Narrow', argoHeight: 'Tall' },
            { abbreviation: 'LCM3D', description: 'OM3 LC multimode DUPLEX', divBlock: 'DIV_CON-LC-MM-01', argoPanelName: 'FIBER LC MULT MODE', argoWidth: 'Narrow', argoHeight: 'Tall' },
            { abbreviation: 'LCM3S', description: 'OM3 LC multimode SIMPLEX', divBlock: 'DIV_CON-LC-MM-01', argoPanelName: 'FIBER LC MULT MODE', argoWidth: 'Narrow', argoHeight: 'Tall' },
            { abbreviation: 'LCM4D', description: 'OM4 LC multimode DUPLEX', divBlock: 'DIV_CON-LC-MM-01', argoPanelName: 'FIBER LC MULT MODE', argoWidth: 'Narrow', argoHeight: 'Tall' },
            { abbreviation: 'LCM4S', description: 'OM4 LC multimode SIMPLEX', divBlock: 'DIV_CON-LC-MM-01', argoPanelName: 'FIBER LC MULT MODE', argoWidth: 'Narrow', argoHeight: 'Tall' },
            { abbreviation: 'LCS-D', description: 'LC Singlemode DUPLEX' },
            { abbreviation: 'LCS-S', description: 'LC Singlemode SIMPLEX' },
        ],
    },

    // ── MP Fiber (MPO/MTP) ────────────────────────────────
    {
        name: 'MP-Fiber',
        groupDescription: 'MPO/MTP multi-fiber push-on — high-density trunk cabling.',
        connectors: [
            { abbreviation: 'MP8', description: 'Multi-fiber Push On - 8 strand' },
            { abbreviation: 'MP8P', description: 'PLUG : 8 Strand MTP' },
            { abbreviation: 'MP8S', description: 'SOCKET : 8 Strand MTP' },
            { abbreviation: 'MP12', description: 'Multi-fiber Push On - 12 strand' },
            { abbreviation: 'MP12P', description: 'PLUG : 12 Strand MTP' },
            { abbreviation: 'MP12S', description: 'SOCKET : 12 Strand MTP' },
            { abbreviation: 'MP24', description: 'Multi-fiber Push On - 24 strand' },
            { abbreviation: 'MP24P', description: 'PLUG : 24 Strand MTP' },
            { abbreviation: 'MP24S', description: 'SOCKET : 24 Strand MTP' },
        ],
    },

    // ── Multipin ──────────────────────────────────────────
    {
        name: 'Multipin',
        groupDescription: 'Multi-pin circular and DIN connectors — for control, data, and specialty signals.',
        connectors: [
            { abbreviation: 'CIR##P', description: 'PLUG : Circular generic. ## = number of pins' },
            { abbreviation: 'CIR##S', description: 'SOCKET : Circular generic. ## = number of pins' },
            { abbreviation: 'DIN#P', description: 'PLUG : DIN-Style. # = number of pins' },
            { abbreviation: 'DIN#S', description: 'SOCKET : DIN-Style. # = number of pins' },
            { abbreviation: 'HR##P', description: 'PLUG : Hirose-Style. ## = number of pins' },
            { abbreviation: 'HR##S', description: 'SOCKET : Hirose-Style. ## = number of pins' },
            { abbreviation: 'MDIN#P', description: 'PLUG : Mini-DIN-Style. # = number of pins' },
            { abbreviation: 'MDIN#S', description: 'SOCKET : Mini-DIN-Style. # = number of pins' },
            { abbreviation: 'DIN5S', description: 'SOCKET : Mini DIN 5-pin panel mount', divBlock: 'DIV_CON-DIN5-PNL', argoPanelName: 'MISC DIN-5 S', argoWidth: 'Normal', argoHeight: 'Short' },
            { abbreviation: 'MPB##', description: 'MultiPinBlock. ## = number of connections' },
            { abbreviation: 'TJ##P', description: 'PLUG : Tajimi-Style. ## = number of pins' },
            { abbreviation: 'TJ##S', description: 'SOCKET : Tajimi-Style. ## = number of pins' },
        ],
    },

    // ── OC Fiber (OpticalCon) ─────────────────────────────
    {
        name: 'OC-Fiber',
        groupDescription: 'Neutrik OpticalCon rugged fiber connectors — XLR-shell mounted for touring and broadcast.',
        connectors: [
            { abbreviation: 'OC2', description: 'OpticalCon Fiber - 2 strand' },
            { abbreviation: 'OC4', description: 'OpticalCon Fiber - 4 strand', divBlock: 'DIV_CON-NO2-4FDW-A', argoPanelName: 'OPTICON MTP QUAD', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'OC12', description: 'OpticalCon MTP Fiber - 12 strand', divBlock: 'DIV_CON-NO12-FDW', argoPanelName: 'OPTICON MTP12', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'OC24', description: 'OpticalCon MTP Fiber - 24 strand', divBlock: 'DIV_CON-NO24-FDW', argoPanelName: 'OPTICON MTP24', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'OCL2', description: 'OpticalCon Lite Fiber - 2 strand' },
            { abbreviation: 'OCL4', description: 'OpticalCon Lite Fiber - 4 strand' },
            { abbreviation: 'OCL12', description: 'OpticalCon Lite MTP Fiber - 12 strand' },
            { abbreviation: 'OCL24', description: 'OpticalCon Lite MTP Fiber - 24 strand' },
        ],
    },

    // ── Punchdown ─────────────────────────────────────────
    {
        name: 'Punchdown',
        groupDescription: 'Punchdown termination — 66-block, 110-block, Krone, QCP — for telco and structured cabling.',
        connectors: [
            { abbreviation: 'KRN', description: 'Krone Punchdown' },
            { abbreviation: 'PN', description: 'Other Punch connection' },
            { abbreviation: 'PN66', description: 'Punch Block 66 type' },
            { abbreviation: 'PN110', description: 'Punch Block 110 type' },
            { abbreviation: 'QCP', description: 'ADC Quick Connect Punchdown' },
        ],
    },

    // ── RF ────────────────────────────────────────────────
    {
        name: 'RF',
        groupDescription: 'Radio frequency coaxial connectors — BNC, F, N, SMA, SMB, TNC, MCX.',
        connectors: [
            { abbreviation: 'BNC50', description: '50 ohm BNC', divBlock: 'DIV_CON-BNC-THRU-01', argoPanelName: 'THRU BNC', argoWidth: 'Narrow', argoHeight: 'Short' },
            { abbreviation: 'F', description: 'F-Type Coaxial Connector', divBlock: 'DIV_CON-F-01', argoPanelName: 'THRU F', argoWidth: 'Narrow', argoHeight: 'Short' },
            { abbreviation: 'MCX', description: 'Micro Coax (similar to SMB, 30% smaller)' },
            { abbreviation: 'N', description: '50 ohm N connector' },
            { abbreviation: 'SMA', description: 'PLUG : Sub Miniature A coax (threaded)' },
            { abbreviation: 'SMB', description: 'PLUG : Sub Miniature B coax (snap on)' },
            { abbreviation: 'TNC', description: 'PLUG : TNC connector' },
        ],
    },

    // ── RJ Modular ────────────────────────────────────────
    {
        name: 'RJ-Modular',
        groupDescription: 'RJ-style modular data connectors — for Ethernet, telephony, and control networks.',
        connectors: [
            { abbreviation: '4P4C', description: '4-position, 4-contact (RJ9/RJ10)' },
            { abbreviation: '6P2C', description: '6-position, 2-contact (RJ11)' },
            { abbreviation: '6P4C', description: '6-position, 4-contact (RJ14)' },
            { abbreviation: '6P6C', description: '6-position, 6-contact (RJ25)' },
            { abbreviation: '10P10C', description: '10-position, 10-contact (RJ50)' },
            { abbreviation: 'RJ45', description: '8P8C common name — 1000BASE-T (1GbE) unless a port says otherwise', divBlock: 'DIV_CON-RJ45-FLNG-01', argoPanelName: 'FLANGE RJ45 S', argoWidth: 'Normal', argoHeight: 'Normal' },
            // Speed-named RJ45s (owner, 2026-09-25): the same jack, with the link rate it
            // runs at stated — so the port and NetBox are pre-programmed with the right
            // interface type and speed. Physically identical to RJ45: same block, same cutout.
            { abbreviation: 'RJ45-100M', description: 'RJ45 at 100BASE-TX (Fast Ethernet)', divBlock: 'DIV_CON-RJ45-FLNG-01', argoPanelName: 'FLANGE RJ45 S', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'RJ45-1G', description: 'RJ45 at 1000BASE-T (1GbE)', divBlock: 'DIV_CON-RJ45-FLNG-01', argoPanelName: 'FLANGE RJ45 S', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'RJ45-2.5G', description: 'RJ45 at 2.5GBASE-T', divBlock: 'DIV_CON-RJ45-FLNG-01', argoPanelName: 'FLANGE RJ45 S', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'RJ45-5G', description: 'RJ45 at 5GBASE-T', divBlock: 'DIV_CON-RJ45-FLNG-01', argoPanelName: 'FLANGE RJ45 S', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'RJ45-10G', description: 'RJ45 at 10GBASE-T (10GbE)', divBlock: 'DIV_CON-RJ45-FLNG-01', argoPanelName: 'FLANGE RJ45 S', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'S8P8C', description: 'Shielded 8P8C' },
            { abbreviation: 'SRJ45', description: 'Shielded RJ45' },
            { abbreviation: 'ECON', description: 'Ethercon RJ45 in XLR shell' },
            { abbreviation: 'SECON', description: 'Shielded Ethercon' },
        ],
    },

    // ── SC Fiber ──────────────────────────────────────────
    {
        name: 'SC-Fiber',
        groupDescription: 'SC (Subscriber Connector) fiber optic — push-pull square body.',
        connectors: [
            { abbreviation: 'SCA-D', description: 'SC APC Singlemode DUPLEX' },
            { abbreviation: 'SCA-S', description: 'SC APC Singlemode SIMPLEX' },
            { abbreviation: 'SCM1D', description: 'OM1 SC multimode DUPLEX' },
            { abbreviation: 'SCM1S', description: 'OM1 SC multimode SIMPLEX' },
            { abbreviation: 'SCM3D', description: 'OM3 SC multimode DUPLEX' },
            { abbreviation: 'SCM3S', description: 'OM3 SC multimode SIMPLEX' },
            { abbreviation: 'SCM4D', description: 'OM4 SC multimode DUPLEX' },
            { abbreviation: 'SCM4S', description: 'OM4 SC multimode SIMPLEX' },
            { abbreviation: 'SCS-D', description: 'SC Singlemode DUPLEX' },
            { abbreviation: 'SCS-S', description: 'SC Singlemode SIMPLEX' },
            { abbreviation: 'PLX-MM', description: 'Fiber PLX duplex SC multimode', divBlock: 'DIV_CON-PLX-MM', argoPanelName: 'FIBER PLX', argoWidth: 'Narrow', argoHeight: 'Tall' },
        ],
    },

    // ── SFP ───────────────────────────────────────────────
    {
        name: 'SFP',
        groupDescription: 'Small Form-factor Pluggable transceivers — data center networking modules.',
        connectors: [
            { abbreviation: 'SFP', description: 'SFP 1Gbps — legacy connections, management ports' },
            { abbreviation: 'SFP+', description: 'SFP+ 10Gbps — enterprise aggregation, server uplinks' },
            { abbreviation: 'SFP28', description: 'SFP28 25Gbps — modern data centers, high-performance computing' },
            { abbreviation: 'SFP56', description: 'SFP56 50Gbps — high-density data center switching' },
            { abbreviation: 'QSFP+', description: 'QSFP+ 40Gbps (4x10G) — core networking, high-speed backbones' },
            { abbreviation: 'QSFP28', description: 'QSFP28 100Gbps (4x25G) — data center leaf-spine architectures' },
            { abbreviation: 'QSFP56', description: 'QSFP56 200Gbps (4x50G) — high-speed data center/enterprise core' },
            { abbreviation: 'QSFP-DD', description: 'QSFP-DD 400-800Gbps — AI clusters, hyperscale data centers' },
            { abbreviation: 'AOC', description: 'Active Optical SFP with fiber attached' },
            { abbreviation: 'DAC', description: 'Direct Attached Copper SFP' },
        ],
    },

    // ── SMPTE ─────────────────────────────────────────────
    {
        name: 'SMPTE',
        groupDescription: 'SMPTE broadcast camera connectors — hybrid electrical/fiber optic.',
        connectors: [
            { abbreviation: 'HFOP', description: 'PLUG : SMPTE 311M hybrid fiber optic', divBlock: 'DIV_CON-NO2-4FDW-1A', argoPanelName: 'OPTICON NO2-4FDW-1-A', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'HFOS', description: 'SOCKET : SMPTE 311M hybrid fiber optic', divBlock: 'DIV_CON-NO2-4FDW', argoPanelName: 'OPTICON NO2-4FDW-A', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'SMPTEP', description: 'PLUG : SMPTE 304M copper breakout', divBlock: 'DIV_CON-304P-FL01', argoPanelName: 'SMPTE 304 PLUG FLANGE', argoWidth: 'Extra Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'SMPTES', description: 'SOCKET : SMPTE 304M copper breakout', divBlock: 'DIV_CON-304S-FL01', argoPanelName: 'SMPTE 304 SOCKET FLANGE', argoWidth: 'Extra Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'SMPTEP-TH', description: 'PLUG : SMPTE 304M thru-hole', divBlock: 'DIV_CON-304P-TH01', argoPanelName: 'SMPTE 304 PLUG THRU', argoWidth: 'Extra Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'SMPTES-TH', description: 'SOCKET : SMPTE 304M thru-hole', divBlock: 'DIV_CON-304S-TH01', argoPanelName: 'SMPTE 304 SOCKET THRU', argoWidth: 'Extra Wide', argoHeight: 'Extra Tall' },
        ],
    },

    // ── ST Fiber ──────────────────────────────────────────
    {
        name: 'ST-Fiber',
        groupDescription: 'ST (Straight Tip) fiber optic — bayonet twist-lock — legacy infrastructure.',
        connectors: [
            { abbreviation: 'STA-D', description: 'ST APC Singlemode DUPLEX' },
            { abbreviation: 'STA-S', description: 'ST APC Singlemode SIMPLEX' },
            { abbreviation: 'STM1-D', description: 'OM1 ST multimode DUPLEX' },
            { abbreviation: 'STM3-D', description: 'OM3 ST multimode DUPLEX' },
            { abbreviation: 'STM4-D', description: 'OM4 ST multimode DUPLEX' },
            { abbreviation: 'STS-D', description: 'ST Singlemode DUPLEX' },
            { abbreviation: 'STS-S', description: 'ST Singlemode SIMPLEX' },
        ],
    },

    // ── TRIAX ─────────────────────────────────────────────
    {
        name: 'TRIAX',
        groupDescription: 'Triaxial broadcast connectors — three-conductor coax — for broadcast camera control.',
        connectors: [
            { abbreviation: 'TRXP', description: 'PLUG : Triax thru-hole', divBlock: 'DIV_CON-TRIP-TH01', argoPanelName: 'TRIAX PLUG THRU', argoWidth: 'Extra Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'TRXS', description: 'SOCKET : Triax thru-hole', divBlock: 'DIV_CON-TRIS-TH01', argoPanelName: 'TRIX SOCKET THRU', argoWidth: 'Extra Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'TRXP-FL', description: 'PLUG : Triax flange', divBlock: 'DIV_CON-TRIS-FL01', argoPanelName: 'TRIAX PLUG FLANGE', argoWidth: 'Extra Wide', argoHeight: 'Extra Tall' },
            { abbreviation: 'TRXS-FL', description: 'SOCKET : Triax flange', divBlock: 'DIV_CON-TRIP-FL01', argoPanelName: 'TRIAX SOCKET FLANGE', argoWidth: 'Extra Wide', argoHeight: 'Extra Tall' },
        ],
    },

    // ── USB ───────────────────────────────────────────────
    {
        name: 'USB',
        groupDescription: 'Universal Serial Bus connectors — Type-A, Type-B, Type-C, Mini, Micro.',
        connectors: [
            { abbreviation: 'USB-A', description: 'PLUG : USB-A (USB 1 to 2)' },
            { abbreviation: 'USBB', description: 'PLUG : USB-B (USB 1 to 2)' },
            { abbreviation: 'USB-C', description: 'PLUG : USB-C (USB 2 to 3.0+)' },
            { abbreviation: 'U3A', description: 'PLUG : USB-A (USB 3)' },
            { abbreviation: 'U3B', description: 'PLUG : USB-B (USB 3)' },
            { abbreviation: 'M-UA', description: 'PLUG : Mini USB Type A' },
            { abbreviation: 'M-UB', description: 'PLUG : Mini USB Type B' },
            { abbreviation: 'MI-UA', description: 'PLUG : Micro USB Type A' },
            { abbreviation: 'MI-UB', description: 'PLUG : Micro USB Type B' },
            { abbreviation: 'MI-U3B', description: 'PLUG : USB Micro-B (USB 3.0+)' },
        ],
    },

    // ── Video ─────────────────────────────────────────────
    {
        name: 'Video',
        groupDescription: 'Video signal connectors — BNC, HD-BNC, DIN 1.0/2.3, HDMI, DisplayPort, DVI — for SDI and HDMI distribution.',
        connectors: [
            /* Networked video leads (owner, 2026-10-03: "and in video top of
               list") — the flow entries before the physical plugs. */
            ...VIDEO_IP_FLOW_ENTRIES,
            /* The three 75 ohm video coax families (ASSETS/connectors/Video/coax connector types.JPG):
               standard BNC is the full-size bayonet; DIN 1.0/2.3 and HD-BNC are the
               high-density push-pull heads. None of the three mates with another. */
            { abbreviation: 'BNC', description: '75 ohm standard BNC for coax — full-size, bayonet quarter-turn lock; also carries AES3-id 75 ohm digital audio', divBlock: 'DIV_CON-BNC-FLNG-01', argoPanelName: 'FLANGE BNC', argoWidth: 'Normal', argoHeight: 'Normal' },
            { abbreviation: 'BNC12', description: '12G 75 ohm standard BNC for coax — full-size, bayonet quarter-turn lock' },
            { abbreviation: 'DIN1', description: '75 ohm DIN 1.0/2.3 for coax — miniature push-pull latch, knurled sleeve; 1.0 mm pin / 2.3 mm outer contact; high-density panels' },
            { abbreviation: 'DP', description: 'DisplayPort' },
            { abbreviation: 'DVI-D', description: 'DVI Digital', divBlock: 'DIV_CON-DVI-01', argoPanelName: 'DIG VIDEO DVI', argoWidth: 'Normal', argoHeight: 'Short' },
            { abbreviation: 'DVI-I', description: 'DVI Digital & Analog', divBlock: 'DIV_CON-DVI-01', argoPanelName: 'DIG VIDEO DVI', argoWidth: 'Normal', argoHeight: 'Short' },
            { abbreviation: 'HDB12', description: '12G 75 ohm High Density BNC (HD-BNC) for coax — push-pull, no bayonet lugs; does not mate with standard BNC' },
            { abbreviation: 'HDBNC', description: '75 ohm High Density BNC (HD-BNC) for coax — push-pull, no bayonet lugs; does not mate with standard BNC' },
            { abbreviation: 'HDMI', description: 'High Definition Multimedia Interface', divBlock: 'DIV_CON-HDMI-01', argoPanelName: 'DIG VIDEO HDMI', argoWidth: 'Normal', argoHeight: 'Short' },
            { abbreviation: 'RCA', description: 'Composite/Component video', divBlock: 'DIV_CON-RCA-FLNG-01', argoPanelName: 'FLANGE RCA S', argoWidth: 'Normal', argoHeight: 'Normal' },
        ],
    },

    // ── Robo ──────────────────────────────────────────────
    {
        name: 'Robo',
        groupDescription: 'Robo rugged multipin connectors — heavy-duty circular multipin for robotic-camera, motor, and field-power tails. Require an oversize-D panel cutout (§5).',
        // Confirmed by user (roadmap §5): larger than the standard D footprint.
        defaultCutout: 'oversize-D',
        // Argo divBlock / argoPanelName intentionally omitted until the real Argo
        // inventory block name is known — an invented block would export a
        // reference nothing resolves. Cutout + palette placement work regardless.
        connectors: [
            { abbreviation: 'ROBO', description: 'Robo rugged multipin connector (plug)' },
            { abbreviation: 'ROBO-S', description: 'Robo rugged multipin connector (socket)' },
        ],
    },

    // ── Wire Terminal ─────────────────────────────────────
    {
        name: 'WireTerminal',
        groupDescription: 'Wire termination points — terminal blocks with screw or push terminals.',
        connectors: [
            { abbreviation: 'TB##', description: 'Terminal Block. ## = number of connections' },
        ],
    },

    // ── IP media (ipMediaConnectors.ts) — flows on a network interface ──
    AUDIO_NETWORKED_GROUP,
    ST2110_GROUP,
    SMPTE_AUDIO_GROUP,   // smpteMediaConnectors.ts — audio on SDI / AES3, track layouts
    NMOS_GROUP,
    MXL_GROUP,           // smpteMediaConnectors.ts — EBU DMF Media eXchange Layer

    // ── Streams, AV-over-IP, VoIP, codecs and containers (streamingCodecConnectors.ts) ──
    ...STREAMING_CODEC_GROUPS,

    // ── Dataflow ports: Idea, Result, Logic, Arithmetic (logicConnectors.ts) ──
    ...LOGIC_GROUPS,

    // ── Media and Image Formats (mediaFormatConnectors.ts) ──
    ...MEDIA_FORMAT_GROUPS,
];

/**
 * Flat lookup: abbreviation → { group, description, divBlock?, argoPanelName?, argoWidth?, argoHeight? }
 */
export interface ConnectorLookupEntry {
    group: string;
    description: string;
    divBlock?: string;
    argoPanelName?: string;
    argoWidth?: ArgoWidth;
    argoHeight?: ArgoHeight;
    cutout?: CutoutClass;
}

const _lookup = new Map<string, ConnectorLookupEntry>();
for (const g of CONNECTOR_GROUPS) {
    for (const c of g.connectors) {
        if (!_lookup.has(c.abbreviation)) {
            _lookup.set(c.abbreviation, {
                group: g.name,
                description: c.description,
                divBlock: c.divBlock,
                argoPanelName: c.argoPanelName,
                argoWidth: c.argoWidth,
                argoHeight: c.argoHeight,
                cutout: c.cutout ?? g.defaultCutout ?? 'D',
            });
        }
    }
}

/**
 * The losing spelling of a connector the corpus wrote two ways, mapped to the
 * winner (ruled 2026-09-23, roadmap 202609172012). Loser → winner, as spelled.
 *
 * Only an alias whose winner is a catalogue entry joins `lookupConnector`
 * (8P8C, USBA, USBC, IEC C13, VIRTUAL); `AC-Power`, `RS232` and `DB9` name no catalogue
 * entry on either side, so for them this map is the vocabulary record the
 * corpus rewrite (`Sample Project Data/rewrite_connector_spellings.mjs`)
 * applies. SFP and SFP+ are two standards and are NOT a pair. Case-only pairs
 * (Speakon / SPEAKON) already meet in `lookupConnectorLoose`.
 */
export const CONNECTOR_LEGACY_SPELLINGS: Readonly<Record<string, string>> = {
    '8P8C': 'RJ45',
    'USBA': 'USB-A',
    'USBC': 'USB-C',
    'AC-Power': 'Power-AC',
    'RS232': 'RS-232',
    'DB9': 'DB-9',
    'IEC C13': 'C13',
    'VIRTUAL': 'NONE',
};

// Spellings that shipped before the standard's own was adopted resolve to the
// entry they were renamed to. Added AFTER the derive loop, so an alias answers
// `lookupConnector` and `isKnownConnector` — a saved project full of them still
// opens — without ever appearing in `CONNECTOR_GROUPS`, which is what the picker
// lists from. See the note in `aes72.ts`.
const _renamed = new Map<string, string>();   // UPPER-CASED old spelling → current abbreviation
for (const [legacy, current] of [
    ...Object.entries(AES72_LEGACY_SPELLINGS), ...Object.entries(CONNECTOR_LEGACY_SPELLINGS),
]) {
    const entry = _lookup.get(current);
    if (!entry) continue;
    if (!_lookup.has(legacy)) _lookup.set(legacy, entry);
    _renamed.set(legacy.toUpperCase(), current);
}

/** UPPER-CASED abbreviation → the abbreviation as spelled. */
const _foldedLookup = new Map<string, string>();
for (const g of CONNECTOR_GROUPS) {
    for (const c of g.connectors) {
        const key = c.abbreviation.toUpperCase();
        if (!_foldedLookup.has(key)) _foldedLookup.set(key, c.abbreviation);
    }
}

export function lookupConnector(abbreviation: string): ConnectorLookupEntry | undefined {
    return _lookup.get(abbreviation);
}

/**
 * Case-insensitive `lookupConnector`, plus the abbreviation as the catalogue
 * spells it. Callers hold a connector name in two forms — the raw one the user
 * picked, and the UPPER-CASED type `parseConnectorRef` hands back — and an
 * exact-key map answers only the first, so the same connector reads as known in
 * one panel and unknown in the next.
 *
 * The abbreviation it reports is always the CURRENT one, so a caller that
 * writes the answer back is quietly upgrading a renamed spelling rather than
 * preserving it. Takes a bare type, NOT a channel-suffixed ref: stripping the
 * channel is the caller's job (`resolveConnectorRef` in patch-shared/patchTypes
 * does both).
 */
export function lookupConnectorLoose(
    type: string,
): { abbreviation: string; entry: ConnectorLookupEntry } | undefined {
    const s = (type || '').trim();
    if (!s) return undefined;
    const renamed = _renamed.get(s.toUpperCase());
    if (renamed) return { abbreviation: renamed, entry: _lookup.get(renamed)! };
    const folded = _foldedLookup.get(s.toUpperCase());
    if (folded) return { abbreviation: folded, entry: _lookup.get(folded)! };
    const exact = _lookup.get(s);
    return exact ? { abbreviation: s, entry: exact } : undefined;
}

/**
 * Resolve a OneThing abbreviation to its Argo panel name.
 * Returns the argoPanelName if one exists, otherwise falls back to the abbreviation.
 */
export function getArgoPanelName(abbreviation: string): string {
    return _lookup.get(abbreviation)?.argoPanelName || abbreviation;
}

export function isKnownConnector(abbreviation: string): boolean {
    return _lookup.has(abbreviation);
}

/**
 * All connector abbreviations as a flat array.
 */
export const ALL_CONNECTOR_ABBREVIATIONS = Array.from(_lookup.keys());

/**
 * Connector families for the palette UI — derived from groups,
 * using representative connectors (not every variant).
 */
export const CONNECTOR_FAMILIES_FULL: Record<string, string[]> = {};
for (const g of CONNECTOR_GROUPS) {
    CONNECTOR_FAMILIES_FULL[g.name] = g.connectors.map(c => c.abbreviation);
}
