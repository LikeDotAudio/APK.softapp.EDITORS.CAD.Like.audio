// Copyright (c) 2026 oneDiversified.

// Changelog:
//   2026-10-14 - MXF and MXF-DV (SMPTE ST 383, DV-DIF in MXF) join Codecs-Container, from the owner's SMPTE standards set.
//   2026-10-09 - created. Owner: "I would like to add these video and audio networking connectors"
//     (IP streaming, AV-over-IP and VoIP protocols, with the formats each category uses) and "I would
//     like a new set of connectors called Codes" (audio codecs, video codecs, containers), "be sure to
//     make icons" (every entry has its own badge: IPMedia/StreamingBadges.tsx). Dante, Dante AV,
//     AES67 and ST 2110 were already in the catalogue (ipMediaConnectors.ts) and are not repeated.

/**
 * OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/streamingCodecConnectors.ts
 *
 * STREAMS AND CODECS — WHAT A NETWORK PORT CARRIES, NOT HOLES IN A PANEL.
 *
 * The same argument as `ipMediaConnectors.ts`: an SRT feed, an NDI source or a SIP trunk
 * rides an RJ45 or an SFP already in the catalogue, but it is what a drafter PICKS for a
 * port when the question is "what goes down this link". So are codecs and containers: a
 * port typed `H.265` or `MPEG-TS` says what the stream is encoded as, which is what a
 * receiver has to be able to decode.
 *
 *   IP-Streaming      real-time (RTP …), web (HLS …), broadcast / IPTV contribution (SRT …)
 *   AV-over-IP        NDI, SDVoE and the vendor AV-over-IP systems
 *   VoIP              call signalling (SIP, H.323, MGCP, SCCP); WebRTC is in IP-Streaming
 *   Codecs-Audio      uncompressed, lossless and lossy audio coding
 *   Codecs-Video      legacy, current and professional / broadcast video coding
 *   Codecs-Container  the file and stream wrappers that hold the coded essences
 *
 * Abbreviations are upper-case, dotted where the standard is (`H.264`, `G.711`), and
 * never reuse an existing catalogue key: `MPEG-TS` is the container, `MPEG-TS-UDP` the
 * transport; `EVS-VOICE` is the 3GPP codec, not the EVS server vendor.
 */

import type { ConnectorGroup } from './ConnectorLookup';

export const IP_STREAMING_GROUP: ConnectorGroup = {
    name: 'IP-Streaming',
    groupDescription: 'IP streaming protocols — real-time RTP/RTSP, web streaming (HLS, DASH, CMAF, WebRTC) and broadcast / IPTV transport (multicast, MPEG-TS, SRT, RIST, Zixi).',
    connectors: [
        // ── Real-time streaming ──
        { abbreviation: 'RTP', description: 'Real-time Transport Protocol — timed media packets over UDP (RFC 3550)' },
        { abbreviation: 'RTCP', description: 'RTP Control Protocol — reception reports and sync for an RTP session' },
        { abbreviation: 'RTSP', description: 'Real Time Streaming Protocol — play / pause control of an RTP stream (cameras, encoders)' },
        { abbreviation: 'SRTP', description: 'Secure RTP — encrypted and authenticated RTP media' },
        { abbreviation: 'SAP', description: 'Session Announcement Protocol — multicast announcement of available streams' },
        { abbreviation: 'SDP', description: 'Session Description Protocol — the text that describes a stream (address, port, format)' },
        // ── Web streaming ──
        { abbreviation: 'HLS', description: 'HTTP Live Streaming — segmented adaptive-bitrate delivery over HTTP' },
        { abbreviation: 'MPEG-DASH', description: 'MPEG-DASH — Dynamic Adaptive Streaming over HTTP' },
        { abbreviation: 'CMAF', description: 'Common Media Application Format — one fragmented-MP4 package for HLS and DASH' },
        { abbreviation: 'WEBRTC', description: 'WebRTC — real-time browser audio / video / data (SRTP media, ICE / DTLS)' },
        // ── Broadcast / IPTV ──
        { abbreviation: 'UDP-MC', description: 'UDP multicast — one-to-many stream to an IP multicast group' },
        { abbreviation: 'RTP-MC', description: 'RTP multicast — RTP media sent to an IP multicast group' },
        { abbreviation: 'MPEG-TS-UDP', description: 'MPEG transport stream over UDP (IPTV, contribution and distribution)' },
        { abbreviation: 'SRT', description: 'Secure Reliable Transport — ARQ-protected, encrypted contribution over the open internet' },
        { abbreviation: 'RIST', description: 'Reliable Internet Stream Transport — VSF open-spec ARQ transport for contribution' },
        { abbreviation: 'ZIXI', description: 'Zixi — proprietary error-corrected live video transport over IP' },
    ],
};

export const AV_OVER_IP_GROUP: ConnectorGroup = {
    name: 'AV-over-IP',
    groupDescription: 'AV-over-IP systems — NDI, SDVoE and vendor encoder / decoder platforms carrying video and audio on a LAN. Dante, Dante AV, AES67 and ST 2110 are in their own families.',
    connectors: [
        { abbreviation: 'NDI', description: 'NDI — NewTek / Vizrt Network Device Interface, full-bandwidth video, audio and tally on a LAN' },
        { abbreviation: 'NDI-HX', description: 'NDI HX — the compressed (H.264 / H.265) NDI variant for lower-bandwidth links' },
        { abbreviation: 'SDVOE', description: 'SDVoE — Software Defined Video over Ethernet, uncompressed / light-compressed AV on 10 GbE' },
        { abbreviation: 'NVX', description: 'Crestron DM NVX — AV-over-IP encoder / decoder stream' },
        { abbreviation: 'SVSI', description: 'AMX SVSI — AV-over-IP encoder / decoder stream' },
        { abbreviation: 'QSYS-AV', description: 'Q-SYS AV over IP — QSC NV-series video and audio on the Q-SYS network' },
    ],
};

export const VOIP_GROUP: ConnectorGroup = {
    name: 'VoIP',
    groupDescription: 'VoIP / unified communications signalling — the call set-up protocols; the voice itself is RTP (IP-Streaming) coded with G.711, G.722 or Opus (Codecs-Audio). WebRTC is in IP-Streaming.',
    connectors: [
        { abbreviation: 'SIP', description: 'SIP — Session Initiation Protocol, call set-up for VoIP phones, trunks and codecs' },
        { abbreviation: 'H.323', description: 'H.323 — ITU-T multimedia conferencing signalling (legacy room systems, gateways)' },
        { abbreviation: 'MGCP', description: 'MGCP — Media Gateway Control Protocol (call agent to gateway)' },
        { abbreviation: 'SCCP', description: 'SCCP — Cisco Skinny Client Control Protocol (Cisco IP phones)' },
    ],
};

export const AUDIO_CODEC_GROUP: ConnectorGroup = {
    name: 'Codecs-Audio',
    groupDescription: 'Audio codecs — how audio is coded: uncompressed PCM, lossless (FLAC, ALAC) and lossy (MP3, AAC, Opus, the G.7xx voice codecs). VoIP uses G.711 / G.722 / Opus; streaming AAC / MP3 / Opus.',
    connectors: [
        // ── Uncompressed ──
        { abbreviation: 'PCM', description: 'PCM — uncompressed pulse-code modulation audio' },
        { abbreviation: 'LPCM', description: 'LPCM — linear PCM (uncompressed, e.g. 24-bit / 48 kHz)' },
        { abbreviation: 'AES67-L24', description: 'AES67 audio stream payload — L24 / L16 linear PCM over RTP' },
        { abbreviation: 'WAV', description: 'WAV — RIFF wave audio, a container usually holding PCM' },
        // ── Lossless compressed ──
        { abbreviation: 'FLAC', description: 'FLAC — Free Lossless Audio Codec' },
        { abbreviation: 'ALAC', description: 'ALAC — Apple Lossless Audio Codec' },
        { abbreviation: 'WAVPACK', description: 'WavPack — lossless (and hybrid) audio compression' },
        { abbreviation: 'APE', description: "Monkey's Audio (APE) — lossless audio compression" },
        // ── Lossy compressed ──
        { abbreviation: 'MP3', description: 'MP3 — MPEG-1 / -2 Audio Layer III' },
        { abbreviation: 'AAC', description: 'AAC — Advanced Audio Coding (streaming, broadcast, VoD)' },
        { abbreviation: 'AAC-LC', description: 'AAC-LC — AAC Low Complexity profile' },
        { abbreviation: 'HE-AAC', description: 'HE-AAC — High-Efficiency AAC (SBR / PS) for low bitrates' },
        { abbreviation: 'OPUS', description: 'Opus — low-latency speech and music codec (VoIP, WebRTC, streaming)' },
        { abbreviation: 'VORBIS', description: 'Vorbis — Xiph.org lossy audio codec (usually in Ogg / WebM)' },
        { abbreviation: 'WMA', description: 'WMA — Windows Media Audio' },
        { abbreviation: 'G.711', description: 'G.711 — 64 kb/s PCM µ-law / A-law telephony voice (VoIP)' },
        { abbreviation: 'G.722', description: 'G.722 — 7 kHz wideband (HD) voice at 48–64 kb/s' },
        { abbreviation: 'G.723', description: 'G.723.1 — 5.3 / 6.3 kb/s low-bitrate voice' },
        { abbreviation: 'G.726', description: 'G.726 — ADPCM voice at 16–40 kb/s' },
        { abbreviation: 'G.728', description: 'G.728 — 16 kb/s LD-CELP low-delay voice' },
        { abbreviation: 'G.729', description: 'G.729 — 8 kb/s CS-ACELP voice' },
        { abbreviation: 'EVS-VOICE', description: 'EVS — 3GPP Enhanced Voice Services (VoLTE / VoNR voice codec)' },
        { abbreviation: 'AMR-NB', description: 'AMR-NB — Adaptive Multi-Rate narrowband voice' },
        { abbreviation: 'AMR-WB', description: 'AMR-WB — Adaptive Multi-Rate wideband (G.722.2) voice' },
    ],
};

export const VIDEO_CODEC_GROUP: ConnectorGroup = {
    name: 'Codecs-Video',
    groupDescription: 'Video codecs — legacy (MPEG-1/-2, MPEG-4 Part 2), current (H.264, H.265, AV1 …) and professional / broadcast (JPEG 2000, ProRes, DNx, XAVC …). JPEG XS is ST 2110-22.',
    connectors: [
        // ── Legacy ──
        { abbreviation: 'MPEG-1', description: 'MPEG-1 Video' },
        { abbreviation: 'MPEG-2', description: 'MPEG-2 Video / H.262 (broadcast and DVD)' },
        { abbreviation: 'MPEG-4-P2', description: 'MPEG-4 Part 2 Visual (ASP)' },
        { abbreviation: 'DIVX', description: 'DivX — MPEG-4 Part 2 implementation' },
        { abbreviation: 'XVID', description: 'Xvid — open MPEG-4 Part 2 implementation' },
        { abbreviation: 'SORENSON', description: 'Sorenson Video / Spark (legacy QuickTime and Flash)' },
        // ── Current common ──
        { abbreviation: 'H.264', description: 'H.264 / AVC — Advanced Video Coding' },
        { abbreviation: 'H.265', description: 'H.265 / HEVC — High Efficiency Video Coding' },
        { abbreviation: 'H.266', description: 'H.266 / VVC — Versatile Video Coding' },
        { abbreviation: 'VP8', description: 'VP8 — Google / WebM video codec' },
        { abbreviation: 'VP9', description: 'VP9 — Google / WebM video codec' },
        { abbreviation: 'AV1', description: 'AV1 — AOMedia Video 1, royalty-free' },
        // ── Professional / broadcast ──
        { abbreviation: 'JPEG2000', description: 'JPEG 2000 — wavelet intra-frame coding (contribution, cinema, J2K over IP)' },
        { abbreviation: 'PRORES', description: 'Apple ProRes — intra-frame post-production codec' },
        { abbreviation: 'PRORES-RAW', description: 'Apple ProRes RAW — camera-sensor RAW in ProRes' },
        { abbreviation: 'DNXHD', description: 'Avid DNxHD — HD intra-frame post codec' },
        { abbreviation: 'DNXHR', description: 'Avid DNxHR — resolution-independent DNx (UHD and beyond)' },
        { abbreviation: 'CINEFORM', description: 'GoPro CineForm — wavelet intermediate codec' },
        { abbreviation: 'XAVC', description: 'Sony XAVC — H.264-based acquisition format' },
        { abbreviation: 'AVC-INTRA', description: 'Panasonic AVC-Intra — intra-only H.264 acquisition' },
    ],
};

export const CONTAINER_GROUP: ConnectorGroup = {
    name: 'Codecs-Container',
    groupDescription: 'Audio / video containers — the wrappers that hold coded audio, video, subtitles and metadata. MPEG-TS is the container; MPEG-TS-UDP (IP-Streaming) is the transport.',
    connectors: [
        { abbreviation: 'MP4', description: 'MP4 (.mp4) — MPEG-4 Part 14 container' },
        { abbreviation: 'MOV', description: 'MOV (.mov) — QuickTime container' },
        { abbreviation: 'MKV', description: 'MKV (.mkv) — Matroska container' },
        { abbreviation: 'AVI', description: 'AVI (.avi) — Audio Video Interleave container' },
        { abbreviation: 'MXF', description: 'MXF (.mxf) — SMPTE Material Exchange Format, the broadcast file wrapper (operational patterns OP1a, OP-Atom)' },
        { abbreviation: 'MXF-DV', description: 'MXF DV-DIF (SMPTE ST 383) — DV / DVCPRO 25 / 50 / 100 Mb/s DIF streams in the MXF generic container, audio interleaved in the DIF, frame- or clip-wrapped' },
        { abbreviation: 'MPEG-TS', description: 'MPEG-TS (.ts) — MPEG-2 transport stream container' },
        { abbreviation: 'MPEG-PS', description: 'MPEG-PS (.mpg) — MPEG program stream container' },
        { abbreviation: 'WEBM', description: 'WebM (.webm) — Matroska-based web container (VP8 / VP9 / AV1, Opus / Vorbis)' },
        { abbreviation: 'FLV', description: 'FLV (.flv) — Flash Video container' },
        { abbreviation: 'ASF', description: 'ASF (.asf) — Advanced Systems Format (Windows Media)' },
        { abbreviation: 'OGG', description: 'OGG (.ogg) — Xiph.org Ogg container' },
        { abbreviation: '3GP', description: '3GP (.3gp) — 3GPP mobile container' },
        { abbreviation: 'M4V', description: 'M4V (.m4v) — Apple MPEG-4 video container' },
    ],
};

/** Every family in this file, in catalogue order. */
export const STREAMING_CODEC_GROUPS: readonly ConnectorGroup[] = [
    IP_STREAMING_GROUP, AV_OVER_IP_GROUP, VOIP_GROUP, AUDIO_CODEC_GROUP, VIDEO_CODEC_GROUP, CONTAINER_GROUP,
];
