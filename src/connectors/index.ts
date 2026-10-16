// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-14 - Idea / Result / Logic / Arithmetic badges (IPMedia/LogicBadges.tsx), one per port in logicConnectors.ts.
//   2026-10-14 - SMPTE-Audio and MXL badges (IPMedia/SmpteBadges.tsx), one per abbreviation in smpteMediaConnectors.ts.
//   2026-10-09 - DDM Manager badges (IPMedia/DDM.tsx) for the eight DDM connectors (owner: "a new flow type should be called DDM manager").
//   2026-10-09 - a badge for every stream, AV-over-IP, VoIP, codec and container connector (owner: "I would like to add these video and audio networking connectors", "I would like a new set of connectors called Codes", "be sure to make icons").
//   2026-10-09 - Q-LAN badges (IPMedia/QLAN.tsx) for the seven Q-LAN connectors (owner: "i would like to add Q lan to the audio networked").
//   2026-10-03 - IP media (owner, 2026-10-03): ST 2110 / NMOS / Dante / AES67 / RAVENNA / Milan
//                badges from IPMedia/, one per abbreviation in ipMediaConnectors.ts.
//   2026-09-25 - the speed-named RJ45s (RJ45-100M … RJ45-10G) draw the RJ45 glyph.
//   2026-08-14 11:35 - register the Management family (MGMT-HOLDER / -MUSTACHE / -LACING-BAR /
//                -BRUSH / -D-RING). These are cable-handling hardware, NOT connectors: they are
//                deliberately absent from ConnectorLookup.ts (FEATURE-202608132265)
//   2026-08-11 - register TRSS (1/4" stereo TRS socket) → TRS icon, alongside TRSP/TSS
//   2026-07-22 15:55 - register Robo rugged-multipin icon; ROBO / ROBO-S → Robo (roadmap §5)
//   2026-06-06 23:40 - rename EDAC E#PP/E#SS icon keys → single suffix E#P / E#S
//   2026-06-06 15:36 - register Patchbay family: TT (Bantam) and MV (Micro Video) jacks
//   2026-06-06 21:03 - map A59P/A59S (DB25 AES59 audio multipin) to the DSub25 icon
//   2026-06-06 21:45 - rename E3 → E3P (plug) + add E3S (socket); both map to ELCO3 icon
//   2026-06-06 21:30 - add E3 (Elco3/Edac3) single-channel audio connector → ELCO3 icon
//   2026-06-06 21:13 - map E8/E12/E16/E26/E32 (PP/SS) to per-channel EDAC icons; drop generic E##

/**
 * Connector icon registry — maps connector type strings to React components.
 * Icons are organized by category folder under assets/connectors/.
 *
 * Many abbreviations share the same physical connector shape (e.g. all XLR
 * variants X3P..X8S map to the XLR icon). The ICONS record provides the
 * full mapping from every known abbreviation to its visual component.
 */

import type React from 'react';

// ── AC Power ────────────────────────────────────────────
import NEMA from './ACPower/NEMA';
import NEMALocking from './ACPower/NEMALocking';
import IEC_C7 from './ACPower/IEC_C7';
import IEC_C5 from './ACPower/IEC_C5';
import IEC_C13 from './ACPower/IEC_C13';
import IEC_C19 from './ACPower/IEC_C19';
import PowerCon from './ACPower/PowerCon';

// ── Audio ───────────────────────────────────────────────
import AMP50 from './Audio/AMP50';
import { BananaSingle, BananaDual } from './Audio/BananaPlug';
import { EDAC8, EDAC12, EDAC16, EDAC26, EDAC32 } from './Audio/EDAC';
import ELCO3 from './Audio/ELCO3';
import MASS from './Audio/MASS';
import Spade from './Audio/Spade';
import TOSLINK from './Audio/TOSLINK';

// ── Broadcast ───────────────────────────────────────────
import SFPModule from './Broadcast/SFPModule';
import { SFP1G, SFPPlus, SFP28, SFP56 } from './Network/SFP';
import { QSFPPlus, QSFP28, QSFP56, QSFPDD } from './Network/QSFP';
import SMPTE from './Broadcast/SMPTE';
import Triax from './Broadcast/Triax';

// ── Circular Locking ────────────────────────────────────
import BNC from './CircularLocking/BNC';
import Robo from './Robo/Robo';
import {
    XLR3, XLR4, XLR5, XLR6, XLR7, XLR8,
    XLR3P, XLR4P, XLR5P, XLR6P, XLR7P, XLR8P,
    XLR3S, XLR4S, XLR5S, XLR6S, XLR7S, XLR8S,
} from './CircularLocking/XLR';
const XLR = XLR3P;
import Speakon from './CircularLocking/Speakon';
import { Speakon2, Speakon4, Speakon8, Speakon2P, Speakon2S, Speakon4P, Speakon4S, Speakon8P, Speakon8S } from './CircularLocking/Speakon';

// ── D-Sub ───────────────────────────────────────────────
import DSub9 from './DSub/DSub9';
import DSub25, { DSub15, DSub19, DSub37, DSub50 } from './DSub/DSub25';
import HDSub15, { HDSub26, HDSub44, HDSub62, HDSub78, HDSub100 } from './DSub/HDSub15';

// ── Fiber Optic ─────────────────────────────────────────
import FC from './FiberOptic/FC';
import LC from './FiberOptic/LC';
import SC from './FiberOptic/SC';
import ST from './FiberOptic/ST';
import { MTP8, MTP12, MTP24 } from './FiberOptic/MTP';

// ── Legacy ──────────────────────────────────────────────
import RCA from './Legacy/RCA';
import TRS from './Legacy/TRS';

// ── Multipin ────────────────────────────────────────────
import CircularPower from './Multipin/CircularPower';
import DIN from './Multipin/DIN';
import DT12 from './Multipin/DT12';
import Hirose from './Multipin/Hirose';
import MiniDIN from './Multipin/MiniDIN';

// ── Network ─────────────────────────────────────────────
import RJ11, { RJ4P, RJ6P2C, RJ6P4C } from './Network/RJ11';
import RJ45, { SRJ45 } from './Network/RJ45';

// ── Patchbay ────────────────────────────────────────────
import TT from './Patchbay/TT';
import MicroVideo from './Patchbay/MicroVideo';

// ── Rectangular Precision ───────────────────────────────
import HDMI from './RectangularPrecision/HDMI';
import DisplayPort from './RectangularPrecision/DisplayPort';

// ── RF ──────────────────────────────────────────────────
import FType from './RF/FType';
import MCX from './RF/MCX';
import NType from './RF/NType';
import SMA from './RF/SMA';
import SMB from './RF/SMB';
import TNC from './RF/TNC';

// ── Ruggedized ──────────────────────────────────────────
import EtherCON from './Ruggedized/EtherCON';
import OpticalCON from './Ruggedized/OpticalCON';

// ── Termination ─────────────────────────────────────────
import Punchdown from './Termination/Punchdown';
import TerminalBlock from './Termination/TerminalBlock';
import { TB2, TB3, TB4, TB5, TB6, TB7, TB8, TB9 } from './Termination/TerminalBlock';

// ── USB ─────────────────────────────────────────────────
import UsbA from './USB/UsbA';
import UsbB from './USB/UsbB';
import UsbC from './USB/UsbC';
import MiniUsb from './USB/MiniUsb';
import MicroUsb from './USB/MicroUsb';

// ── Video ───────────────────────────────────────────────
import DVI from './Video/DVI';
import HDBNC from './Video/HDBNC';

// ── Special ─────────────────────────────────────────────
import Circle from './Special/Circle';
import Portal from './Special/Portal';
import Generic from './Special/Generic';

// ── IP media (flows on a network interface) ─────────────
import {
    ST2110_10, ST2110_20, ST2110_21, ST2110_22, ST2110_23, ST2110_30, ST2110_31,
    ST2110_40, ST2110_41, ST2110_43, ST2022_7,
    ST2110_30_TX2, ST2110_30_TX8, ST2110_30_TX16, ST2110_30_RX2, ST2110_30_RX8, ST2110_30_RX16,
} from './IPMedia/ST2110';
import { NMOS, NMOS_IS04, NMOS_IS05, NMOS_IS07, NMOS_IS08, NMOS_IS11, NMOS_BCP003, NMOS_REGISTRY } from './IPMedia/NMOS';
import {
    Dante, DanteMC, DanteAES67, DanteAV, DanteTX2, DanteTX8, DanteTX16, DanteRX2, DanteRX8, DanteRX16,
} from './IPMedia/Dante';
import { AES67RX, AES67TX, RavennaRX, RavennaTX, Milan } from './IPMedia/AES67';
import { STREAMING_ICONS } from './IPMedia/StreamingBadges';
import { SMPTE_ICONS } from './IPMedia/SmpteBadges';
import { LOGIC_ICONS } from './IPMedia/LogicBadges';
import { IMAGE_ICONS } from './IPMedia/ImageBadges';
import { QLan, QLanTX2, QLanTX8, QLanTX16, QLanRX2, QLanRX8, QLanRX16 } from './IPMedia/QLAN';
import { Ddm, DdmMC, DdmTX2, DdmTX8, DdmTX16, DdmRX2, DdmRX8, DdmRX16 } from './IPMedia/DDM';

// ── Management (cable-handling hardware, not connectors) ─
import CableHolder from './Management/CableHolder';
import MustachePassThrough from './Management/MustachePassThrough';
import LacingBar from './Management/LacingBar';
import BrushStrip from './Management/BrushStrip';
import DRing from './Management/DRing';

import { AES72_ALL_SPELLINGS } from './aes72';

// ─────────────────────────────────────────────────────────
// ICONS: every known abbreviation → React component
// ─────────────────────────────────────────────────────────
export const ICONS: Record<string, React.FC> = {
    // ── Streams, AV-over-IP, VoIP, codecs, containers (IPMedia/StreamingBadges.tsx) ──
    ...STREAMING_ICONS,
    // ── SMPTE-Audio and MXL (IPMedia/SmpteBadges.tsx) ──
    ...SMPTE_ICONS,
    // ── Dataflow ports (IPMedia/LogicBadges.tsx) ──
    ...LOGIC_ICONS,
    // ── Image and Media Formats (IPMedia/ImageBadges.tsx) ──
    ...IMAGE_ICONS,

    // ── AC Power ──────────────────────────────────────────
    '5-20':   NEMA,
    '5-15P':  NEMA,
    '5-15S':  NEMA,
    '5-20S':  NEMA,
    'C1':     IEC_C7,
    'C2':     IEC_C7,
    'C5':     IEC_C5,
    'C6':     IEC_C5,
    'C7':     IEC_C7,
    'C8':     IEC_C7,
    'C13':    IEC_C13,
    'C14':    IEC_C13,
    'C15':    IEC_C13,
    'C16':    IEC_C13,
    'C19':    IEC_C19,
    'C20':    IEC_C19,
    'L5-15P': NEMALocking,
    'L5-15R': NEMALocking,
    'L5-20P': NEMALocking,
    'L5-20R': NEMALocking,
    'L5-30P': NEMALocking,
    'L5-30R': NEMALocking,
    'L6-20P': NEMALocking,
    'L6-20R': NEMALocking,
    'L6-30P': NEMALocking,
    'L6-30R': NEMALocking,
    'PC1P':   PowerCon,
    'PC1S':   PowerCon,
    'PC20BP': PowerCon,
    'PC20BS': PowerCon,
    'PC20GP': PowerCon,
    'PC20GS': PowerCon,
    'PC32P':  PowerCon,
    'PC32S':  PowerCon,

    // ── Audio ─────────────────────────────────────────────
    'A59P':   DSub25,
    'A59S':   DSub25,
    // Every AES72 type rides the same RJ45 shell — the nine types differ in how
    // the links are wired to the pairs inside it, not in the jack. Spread from
    // the standard's own table (see aes72.ts) in both casings, because ICONS is
    // an exact-key lookup (ConnectorVisual.iconFor) reached two ways: the raw
    // port string, and the upper-cased type parseConnectorRef hands the shell.
    ...Object.fromEntries(AES72_ALL_SPELLINGS.map(s => [s, RJ45])),
    'AMP50P': AMP50,
    'AMP50S': AMP50,
    'CENT24': AMP50,
    'CENT36': AMP50,
    'CENT50': AMP50,
    'CP23-19': CircularPower,
    'DL96':   EDAC32,
    'BAN1':      BananaSingle,
    'BAN1-HD':   BananaSingle,
    'BAN1-SK':   BananaSingle,
    'BAN2':      BananaDual,
    'BAN2-HD':   BananaDual,
    'BAN2-SK':   BananaDual,
    'DT12':   DT12,
    'DT12P':  DT12,
    'DT12S':  DT12,
    'E3P':    ELCO3,
    'E3S':    ELCO3,
    'E3PP':   ELCO3,
    'E3SS':   ELCO3,
    'ELCO3':  ELCO3,
    'EDAC3':  ELCO3,
    'E8P':   EDAC8,
    'E8S':   EDAC8,
    'E12P':  EDAC12,
    'E12S':  EDAC12,
    'E16P':  EDAC16,
    'E16S':  EDAC16,
    'E26P':  EDAC26,
    'E26S':  EDAC26,
    'E20P':  EDAC8,
    'E20S':  EDAC8,
    'E32P':  EDAC32,
    'E32S':  EDAC32,
    'MPB2':   TB2,
    'MPB3':   TB3,
    'MPB4':   TB4,
    'MPB5':   TB5,
    'MPB6':   TB6,
    'MPB7':   TB7,
    'MPB8':   TB8,
    'MPB9':   TB9,
    'MS###':  MASS,
    'M-TRRS': TRS,
    'M-TRS':  TRS,
    'M-TS':   TRS,
    'RCA':    RCA,
    'SPADE':  Spade,
    'SPDIF':  RCA,
    'SPK2P':  Speakon2P,
    'SPK2S':  Speakon2S,
    'SPK4P':  Speakon4P,
    'SPK4S':  Speakon4S,
    'SPK8P':  Speakon8P,
    'SPK8S':  Speakon8S,
    'TB##P':  TerminalBlock,
    'TOSS':   TOSLINK,
    'TRRS':   TRS,
    'TRSP':   TRS,
    'TRSS':   TRS,
    'TSS':    TRS,
    'X3P':    XLR3P,
    'X3S':    XLR3S,
    'X4P':    XLR4P,
    'X4S':    XLR4S,
    'X5P':    XLR5P,
    'X5S':    XLR5S,
    'X6P':    XLR6P,
    'X6S':    XLR6S,
    'X7P':    XLR7P,
    'X7S':    XLR7S,
    'X8P':    XLR8P,
    'X8S':    XLR8S,
    'XS3P':   XLR3P,
    'XS3S':   XLR3S,
    'XS4P':   XLR4P,
    'XS4S':   XLR4S,
    'XS5P':   XLR5P,
    'XS5S':   XLR5S,
    'XS7P':   XLR7P,
    'XS7S':   XLR7S,
    'XBEZ':   XLR3,

    // ── DC Power ──────────────────────────────────────────
    'CIR1P':  CircularPower,
    'CIR1S':  CircularPower,
    'CIR2P':  CircularPower,
    'CIR2S':  CircularPower,

    // ── D-Sub ─────────────────────────────────────────────
    'D9P':    DSub9,
    'D9S':    DSub9,
    'D15P':   DSub15,
    'D15S':   DSub15,
    'D19P':   DSub19,
    'D19S':   DSub19,
    'D25P':   DSub25,
    'D25S':   DSub25,
    'D37P':   DSub37,
    'D37S':   DSub37,
    'D50P':   DSub50,
    'D50S':   DSub50,
    'DXPP':   DSub25,
    'DXSS':   DSub25,
    'HD15P':  HDSub15,
    'HD15S':  HDSub15,
    'HD26P':  HDSub26,
    'HD26S':  HDSub26,
    'HD44P':  HDSub44,
    'HD44S':  HDSub44,
    'HD62P':  HDSub62,
    'HD62S':  HDSub62,
    'HD78P':  HDSub78,
    'HD78S':  HDSub78,
    'HD100P': HDSub100,
    'HD100S': HDSub100,

    // ── FC Fiber ──────────────────────────────────────────
    'FCM1D':  FC,
    'FCM1S':  FC,
    'FCM3D':  FC,
    'FCM3S':  FC,
    'FCM4D':  FC,
    'FCM4S':  FC,
    'FCS-D':  FC,
    'FCS-S':  FC,

    // ── LC Fiber ──────────────────────────────────────────
    'LCA-D':  LC,
    'LCA-S':  LC,
    'LCM1D':  LC,
    'LCM1S':  LC,
    'LCM3D':  LC,
    'LCM3S':  LC,
    'LCM4D':  LC,
    'LCM4S':  LC,
    'LCS-D':  LC,
    'LCS-S':  LC,

    // ── MP Fiber (MPO/MTP) ────────────────────────────────
    'MP8':    MTP8,
    'MP8P':   MTP8,
    'MP8S':   MTP8,
    'MP12':   MTP12,
    'MP12P':  MTP12,
    'MP12S':  MTP12,
    'MP24':   MTP24,
    'MP24P':  MTP24,
    'MP24S':  MTP24,

    // ── Multipin ──────────────────────────────────────────
    'CIR##P': CircularPower,
    'CIR##S': CircularPower,
    'DIN#P':  DIN,
    'DIN#S':  DIN,
    'HR##P':  Hirose,
    'HR##S':  Hirose,
    'MDIN#P': MiniDIN,
    'MDIN#S': MiniDIN,
    'DIN5S':  MiniDIN,
    'MPB##':  TerminalBlock,
    'TJ##P':  Hirose,
    'TJ##S':  Hirose,

    // ── OC Fiber (OpticalCon) ─────────────────────────────
    'OC2':    OpticalCON,
    'OC4':    OpticalCON,
    'OC12':   OpticalCON,
    'OC24':   OpticalCON,
    'OCL2':   OpticalCON,
    'OCL4':   OpticalCON,
    'OCL12':  OpticalCON,
    'OCL24':  OpticalCON,

    // ── Patchbay ──────────────────────────────────────────
    'TT':     TT,
    'TTP':    TT,
    'TTS':    TT,
    'MV':     MicroVideo,
    'MVP':    MicroVideo,
    'MVS':    MicroVideo,

    // ── Punchdown ─────────────────────────────────────────
    'KRN':    Punchdown,
    'PN':     Punchdown,
    'PN66':   Punchdown,
    'PN110':  Punchdown,
    'QCP':    Punchdown,

    // ── RF ────────────────────────────────────────────────
    'BNC50':  BNC,
    'F':      FType,
    'MCX':    MCX,
    'N':      NType,
    'SMA':    SMA,
    'SMB':    SMB,
    'TNC':    TNC,

    // ── RJ Modular ────────────────────────────────────────
    '4P4C':   RJ4P,
    '6P2C':   RJ6P2C,
    '6P4C':   RJ6P4C,
    '6P6C':   RJ11,
    '8P8C':   RJ45,
    '10P10C': RJ45,
    'RJ45':   RJ45,
    'RJ45-100M': RJ45,
    'RJ45-1G':   RJ45,
    'RJ45-2.5G': RJ45,
    'RJ45-5G':   RJ45,
    'RJ45-10G':  RJ45,
    'S8P8C':  SRJ45,
    'SRJ45':  SRJ45,
    'ECON':   EtherCON,
    'SECON':  EtherCON,

    // ── SC Fiber ──────────────────────────────────────────
    'SCA-D':  SC,
    'SCA-S':  SC,
    'SCM1D':  SC,
    'SCM1S':  SC,
    'SCM3D':  SC,
    'SCM3S':  SC,
    'SCM4D':  SC,
    'SCM4S':  SC,
    'SCS-D':  SC,
    'SCS-S':  SC,
    'PLX-MM': SC,

    // ── SFP ───────────────────────────────────────────────
    'SFP':    SFP1G,
    'SFP+':   SFPPlus,
    'SFP28':  SFP28,
    'SFP56':  SFP56,
    'QSFP+':  QSFPPlus,
    'QSFP28': QSFP28,
    'QSFP56': QSFP56,
    'QSFP-DD': QSFPDD,
    'AOC':    SFPModule,
    'DAC':    SFPModule,

    // ── SMPTE ─────────────────────────────────────────────
    'HFOP':   SMPTE,
    'HFOS':   SMPTE,
    'SMPTEP':    SMPTE,
    'SMPTES':    SMPTE,
    'SMPTEP-TH': SMPTE,
    'SMPTES-TH': SMPTE,

    // ── ST Fiber ──────────────────────────────────────────
    'STA-D':  ST,
    'STA-S':  ST,
    'STM1-D': ST,
    'STM3-D': ST,
    'STM4-D': ST,
    'STS-D':  ST,
    'STS-S':  ST,

    // ── TRIAX ─────────────────────────────────────────────
    'TRXP':      Triax,
    'TRXS':      Triax,
    'TRXP-FL':   Triax,
    'TRXS-FL':   Triax,

    // ── USB ───────────────────────────────────────────────
    'USBA':   UsbA,
    'USBB':   UsbB,
    'USBC':   UsbC,
    'U3A':    UsbA,
    'U3B':    UsbB,
    'M-UA':   MiniUsb,
    'M-UB':   MiniUsb,
    'MI-UA':  MicroUsb,
    'MI-UB':  MicroUsb,
    'MI-U3B': MicroUsb,

    // ── Video ─────────────────────────────────────────────
    'BNC':    BNC,
    'BNC12':  BNC,
    'ROBO':   Robo,
    'ROBO-S': Robo,
    'DIN1':   SMB,
    'DP':     DisplayPort,
    'DVI-D':  DVI,
    'DVI-I':  DVI,
    'HDB12':  HDBNC,
    'HDBNC':  HDBNC,
    'HDMI':   HDMI,

    // ── Wire Terminal ─────────────────────────────────────
    'TB##':   TerminalBlock,

    // ── Audio-Networked (ipMediaConnectors.ts) ────────────
    'DANTE-RX2': DanteRX2, 'DANTE-RX8': DanteRX8, 'DANTE-RX16': DanteRX16,
    'DANTE-TX2': DanteTX2, 'DANTE-TX8': DanteTX8, 'DANTE-TX16': DanteTX16,
    'DANTE': Dante, 'DANTE-MC': DanteMC, 'DANTE-AES67': DanteAES67, 'DANTE-AV': DanteAV,
    'DDM-RX2': DdmRX2, 'DDM-RX8': DdmRX8, 'DDM-RX16': DdmRX16,
    'DDM-TX2': DdmTX2, 'DDM-TX8': DdmTX8, 'DDM-TX16': DdmTX16, 'DDM': Ddm, 'DDM-MC': DdmMC,
    'QLAN-RX2': QLanRX2, 'QLAN-RX8': QLanRX8, 'QLAN-RX16': QLanRX16,
    'QLAN-TX2': QLanTX2, 'QLAN-TX8': QLanTX8, 'QLAN-TX16': QLanTX16, 'QLAN': QLan,
    'AES67-RX': AES67RX, 'AES67-TX': AES67TX,
    'RAVENNA-RX': RavennaRX, 'RAVENNA-TX': RavennaTX, 'MILAN': Milan,

    // ── ST-2110 ───────────────────────────────────────────
    'ST2110-10': ST2110_10, 'ST2110-20': ST2110_20, 'ST2110-21': ST2110_21,
    'ST2110-22': ST2110_22, 'ST2110-23': ST2110_23, 'ST2110-30': ST2110_30,
    'ST2110-30-RX2': ST2110_30_RX2, 'ST2110-30-RX8': ST2110_30_RX8, 'ST2110-30-RX16': ST2110_30_RX16,
    'ST2110-30-TX2': ST2110_30_TX2, 'ST2110-30-TX8': ST2110_30_TX8, 'ST2110-30-TX16': ST2110_30_TX16,
    'ST2110-31': ST2110_31, 'ST2110-40': ST2110_40, 'ST2110-41': ST2110_41,
    'ST2110-43': ST2110_43, 'ST2022-7': ST2022_7,

    // ── NMOS ──────────────────────────────────────────────
    'NMOS': NMOS, 'NMOS-IS04': NMOS_IS04, 'NMOS-IS05': NMOS_IS05, 'NMOS-IS07': NMOS_IS07,
    'NMOS-IS08': NMOS_IS08, 'NMOS-IS11': NMOS_IS11, 'NMOS-BCP-003': NMOS_BCP003, 'NMOS-REG': NMOS_REGISTRY,

    // ── Friendly aliases (used by existing code) ──────────
    'USB-C':      UsbC,
    'USB-A':      UsbA,
    'USB-B':      UsbB,
    'Mini-USB':   MiniUsb,
    'Micro-USB':  MicroUsb,
    'Speakon':    Speakon4,
    'XLR':        XLR3,
    'DisplayPort': DisplayPort,
    'LC':         LC,
    'SC':         SC,
    'MTP':        MTP12,
    'etherCON':   EtherCON,
    'opticalCON': OpticalCON,
    'TRS':        TRS,
    'Circle':     Circle,
    // Directionless (portals.md D1): both legacy keys — and the future
    // neutral type — share the one capsule glyph.
    'PORTAL_OUT': Portal,
    'PORTAL_IN':  Portal,
    'PORTAL':     Portal,
    // Keystone (KEY-*) jacks are handled directly in ConnectorVisual — they wrap
    // their plain connector glyph in a white square module.
    // ── Management (FEATURE-202608132265) ─────────────────
    // Cable-handling hardware, not connectors. A kind:'management' channel stores
    // one of these keys in `connector` so the existing cell renderer draws it with
    // no faceplate change; the MGMT- prefix is what keeps fitCheck from treating
    // one as an electrical connector. Deliberately NOT in ConnectorLookup.ts —
    // they must never appear in a connector picker or an Argo panel export.
    'MGMT-HOLDER':     CableHolder,
    'MGMT-MUSTACHE':   MustachePassThrough,
    'MGMT-LACING-BAR': LacingBar,
    'MGMT-BRUSH':      BrushStrip,
    'MGMT-D-RING':     DRing,
};

export const GenericIcon = Generic;

export {
    // AC Power
    NEMA, NEMALocking, IEC_C5, IEC_C7, IEC_C13, IEC_C19, PowerCon,
    // Audio
    AMP50, BananaSingle, BananaDual, EDAC8, EDAC12, EDAC16, EDAC26, EDAC32, ELCO3, MASS, Spade, TOSLINK,
    // Broadcast
    SFPModule, SFP1G, SFPPlus, SFP28, SFP56, QSFPPlus, QSFP28, QSFP56, QSFPDD, SMPTE, Triax,
    // Circular Locking
    BNC, XLR, XLR3, XLR4, XLR5, XLR6, XLR7, XLR8,
    XLR3P, XLR4P, XLR5P, XLR6P, XLR7P, XLR8P,
    XLR3S, XLR4S, XLR5S, XLR6S, XLR7S, XLR8S,
    Speakon, Speakon2, Speakon4, Speakon8, Speakon2P, Speakon2S, Speakon4P, Speakon4S, Speakon8P, Speakon8S,
    // D-Sub
    DSub9, DSub15, DSub19, DSub25, DSub37, DSub50,
    HDSub15, HDSub26, HDSub44, HDSub62, HDSub78, HDSub100,
    // Fiber Optic
    FC, LC, SC, ST, MTP8, MTP12, MTP24,
    // Legacy
    RCA, TRS,
    // Multipin
    CircularPower, DIN, DT12, Hirose, MiniDIN,
    // Robo (§5)
    Robo,
    // Network
    RJ11, RJ4P, RJ6P2C, RJ6P4C, RJ45, SRJ45,
    // Patchbay
    TT, MicroVideo,
    // Rectangular Precision
    HDMI, DisplayPort,
    // RF
    FType, MCX, NType, SMA, SMB, TNC,
    // Ruggedized
    EtherCON, OpticalCON,
    // Termination
    Punchdown, TerminalBlock, TB2, TB3, TB4, TB5, TB6, TB7, TB8, TB9,
    // USB
    UsbA, UsbB, UsbC, MiniUsb, MicroUsb,
    // Video
    DVI, HDBNC,
    // Special
    Circle, Portal, Generic,
    // Management (FEATURE-202608132265)
    CableHolder, MustachePassThrough, LacingBar, BrushStrip, DRing,
};
