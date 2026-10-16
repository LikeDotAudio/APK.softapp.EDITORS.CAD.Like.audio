// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-14 - created (owner: "these smpte connections and standard should be a part of the repetoire",
//     "FOR MOIP I would like to add MXL from the EBU"). Two families: SMPTE-Audio (how audio rides SDI
//     and AES3: ST 299-1, the ST 337 non-PCM family, ST 2035 track cases, ST 2036-2 22.2) and MXL
//     (the EBU Dynamic Media Facility's Media eXchange Layer). Facts are from the standards' own text;
//     notes in Audio/AES connector standards.md.

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/smpteMediaConnectors.ts
 *
 * SIGNAL FORMATS AND SOFTWARE FLOWS, NOT HOLES IN A PANEL.
 *
 * Neither family is a part you crimp. Embedded audio rides an SDI BNC, a Dolby-style
 * bitstream rides an AES3 XLR or BNC, and an MXL flow lives in shared memory between two
 * containers. They are listed as connectors for the reason ipMediaConnectors.ts gives:
 * the connector is what a drafter picks for a port, and a port typed "ST340-AC3" says
 * what it carries. Like the IP-media families, they are flows, so the palette's
 * physical view leaves them out.
 *
 * Not here: Dolby E and the full data_type registry. Those are in SMPTE ST 338, which
 * was not among the documents supplied. ST 383 (DV-DIF in MXF) is a file mapping, not an
 * audio format, so it is filed with the containers.
 */

import type { ConnectorGroup } from './ConnectorLookup';

/** How audio is carried on SDI and AES3, and how its channels are laid out. */
export const SMPTE_AUDIO_GROUP: ConnectorGroup = {
    name: 'SMPTE-Audio',
    groupDescription: 'SMPTE audio carriage — audio embedded in HD-SDI, non-PCM bitstreams (AC-3, E-AC-3, AAC) inside AES3, and the standard track and channel layouts. Signal formats, not physical connectors.',
    connectors: [
        { abbreviation: 'ST299-1', description: 'SMPTE ST 299-1 — 24-bit AES3 audio embedded in HD-SDI (ST 292-1): 4 groups × 4 ch = 16 ch at 48 kHz (8 at 96 kHz), data in C-stream HANC; group data DIDs 2E7h / 1E6h / 1E5h / 2E4h, control 1E3h / 2E2h / 2E1h / 1E0h' },
        { abbreviation: 'ST337', description: 'SMPTE ST 337 — non-PCM audio / data in AES3: bursts led by Pa/Pb sync (16-bit F872h / 4E1Fh), Pc burst_info, Pd length; channel-status non-audio bit set; frame mode (one burst over both subframes, ≤ 7 streams) or subframe mode (≤ 14)' },
        { abbreviation: 'ST339', description: 'SMPTE ST 339 — ST 337 generic data types: 0 null, 2 time stamp (stream 7, LTC + sample count), 3 pause, 26 utility (V-sync marker), 30 user-defined' },
        { abbreviation: 'ST340-AC3', description: 'SMPTE ST 340 — AC-3 (Dolby Digital, ATSC A/52) in AES3 via ST 337: data_type 1, one 1536-sample sync frame per burst (32 ms at 48 kHz); AES3 rate must equal the audio rate' },
        { abbreviation: 'ST340-EAC3', description: 'SMPTE ST 340 — E-AC-3 (Dolby Digital Plus) in AES3 via ST 337: data_type 16, 1536-frame burst period, frame mode only, 3324-frame (69.25 ms) decode latency' },
        { abbreviation: 'ST2041-2', description: 'SMPTE ST 2041-2 — MPEG-2 AAC LC / HE AAC in ADTS over AES3 via ST 337: data_type 7, burst every 1024 frames (2048 with SBR)' },
        { abbreviation: 'ST2041-3', description: 'SMPTE ST 2041-3 — MPEG-4 AAC (data_type 10, 1024 / 960 frames) and HE AAC v1 / v2 (data_type 11, 2048 / 1920) over AES3 via ST 337, in ADTS or LATM / LOAS' },
        { abbreviation: 'ST2035', description: 'SMPTE ST 2035 — audio track cases for recorders and embedded / AES3 I/O: tracks 1/2 = AES pair 1, 3/4 = pair 2 …; e.g. case 11c = 5.1 on T1-6 + stereo T7/8, 11d = 5.1 + Lt/Rt, 11e = 5.1 + ST 337 bitstream on T7/8' },
        { abbreviation: 'ST2036-2', description: 'SMPTE ST 2036-2 — UHDTV 22.2 audio: 24 channels, 48 kHz video-locked (96 kHz optional), 16 / 20 / 24-bit; FL FR / FC LFE1 on AES 1-2 … BtFL BtFR on AES 12; top, middle and bottom layers' },
    ],
};

/**
 * MXL — the EBU Dynamic Media Facility's Media eXchange Layer: an open-source (Apache-2.0)
 * Linux Foundation project governed with the EBU and NABA. Software media functions read
 * and write flows in shared memory with no packetising, so it is MOIP inside the host,
 * with fabrics extending it between hosts.
 */
export const MXL_GROUP: ConnectorGroup = {
    name: 'MXL',
    groupDescription: 'EBU DMF Media eXchange Layer — zero-copy media exchange between software media functions (containers) through shared-memory flows, or across hosts over a fabric. Flows are described by NMOS IS-04 Flow JSON and identified by UUID.',
    connectors: [
        { abbreviation: 'MXL', description: 'MXL flow — an EBU DMF Media eXchange Layer flow: a ring buffer in a tmpfs-backed MXL domain that one writer fills and any number of readers map read-only (no packetising, no copy)' },
        { abbreviation: 'MXL-VIDEO', description: 'MXL discrete video flow — V210 video, read and written as timestamped grains' },
        { abbreviation: 'MXL-AUDIO', description: 'MXL continuous audio flow — Float32 samples, de-interleaved per channel' },
        { abbreviation: 'MXL-ANC', description: 'MXL discrete ancillary-data flow — ANC grains (captions, timecode, metadata)' },
        { abbreviation: 'MXL-FABRIC', description: 'MXL Fabric — flows shared between hosts over a fast fabric (RDMA, EFA), the Fabric API in MXL 1.1+' },
    ],
};

/** Both families, in catalogue order. */
export const SMPTE_MEDIA_GROUPS: readonly ConnectorGroup[] = [SMPTE_AUDIO_GROUP, MXL_GROUP];
