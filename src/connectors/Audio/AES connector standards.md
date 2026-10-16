# AES connector standards

The Audio Engineering Society standards behind the audio entries in `../ConnectorLookup.ts`.
What each one fixes, and where it shows up in the library.

## AES14-1992 (r2014): XLR polarity and gender

*Application of connectors, part 1, XLR-type polarity and gender.* Based on IEC 60268-12; XLR
mechanical dimensions are in IEC 61076-2-103. It covers 3- and 5-pin XLR, any signal type or level.
Read from the standard's own text (2012-07-29 printing).

**Gender (Table 1):** pin connector (male) = equipment **output**; socket (female) = equipment **input**.
Pin numbers are as seen on the mating face of the pin connector.

**Pins (Table 2):**

| Application | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| 1-ch balanced | Screen | Positive | Return | | |
| 1-ch unbalanced | Screen + return | Positive | see note | | |
| 1-ch balanced, phantom | Screen + − supply | Positive; + supply | Return; + supply | | |
| 1-ch balanced, A-B | Screen | Positive; + supply | Return; − supply | | |
| 2-ch balanced | Screen | L positive | L return | R positive | R return |
| 2-ch unbalanced | Screen + return | L positive | see note | R positive | see note |
| 2-ch balanced, phantom | Screen + − supply | L +; + supply | L return; + supply | R +; + supply | R return; + supply |
| 2-ch balanced, A-B | Screen | L +; + supply | L return; − supply | R +; + supply | R return; − supply |

Note: when an unbalanced input takes a balanced mic, tie contact 3 (or 3 and 5) to contact 1.

Library: `X3P` / `X3S`, `X5P` / `X5S`, and the Audio-XLR group description.

## AES3 (AES/EBU): two-channel digital audio

Developed jointly by AES and the EBU (EBU Tech 3250). Two subframes per frame (A/B, usually L/R),
up to 24-bit samples, typically 48 or 44.1 kHz.

| Form | Connector | Impedance | Notes |
|---|---|---|---|
| Balanced (IEC 60958 Type I) | XLR3 | 110 ohm twisted pair | up to 150 m; male out, female in (AES14) |
| AES3-id | BNC | 75 ohm coax | much longer runs; shares video coax plant |

Passive 110↔75 ohm impedance transformers (e.g. Neutrik NA2MBNC / NA2FBNC in `../../stock/shopStock.ts`) join the two forms.

Library: `X3P` / `X3S` and `BNC` descriptions. AES3 is a signal, not a connector, so there is no separate abbreviation.

## AES59-2012: 8 balanced circuits on DB25

*Audio application of 25-way D-type connectors in balanced circuits.* This is the TASCAM (DA-88)
layout, standardized. It covers balanced analogue or AES3 digital. Read from the standard's own text.

**Gender (§4.1):** connectors on equipment are **female**; connectors on free cables are **male**.
This is the reverse of the XLR rule in AES14. Cables and female-female adaptors are wired pin-for-pin.

**8-way connection (Annex C):**

| Circuit | Positive | Return | Shield |
|---|---|---|---|
| 1 | 24 | 12 | 25 |
| 2 | 10 | 23 | 11 |
| 3 | 21 | 9 | 22 |
| 4 | 7 | 20 | 8 |
| 5 | 18 | 6 | 19 |
| 6 | 4 | 17 | 5 |
| 7 | 15 | 3 | 16 |
| 8 | 1 | 14 | 2 |

Pin 13 is not used. Don't mix analogue and digital, or inputs and outputs, in one shell.

**Digital combined I/O (Annex D):** the same pins, but circuits 1-4 are AES3 receive (RCV1-4) and
5-8 are AES3 transmit (XMT1-4). The equipment must be labelled, and this is the one case where the
cable is *not* wired pin-for-pin.

**Jackscrews (§4.3):** should be 4/40 UNC, and must be stated in the documentation. M3 jackscrews do not mate with 4/40.

**Yamaha's DB25 wiring is different and does not mate.** The standard doesn't say this; the source is
[Wikipedia](https://en.wikipedia.org/wiki/D-subminiature_(professional_audio)).

Library: `A59P` / `A59S` (`AES59_PINOUT`).

## AES72-2019: four links on RJ45 / quad twisted pair

*Application of RJ45-type connectors and quad twisted pair cable for audio interconnections.*
Read from the standard's own text. Each link is one balanced analog channel, or one AES3 stream
carrying two channels (§3.4). Table 1 surveys nine commercial wirings: Types 1E 1O 1M 2O 3E 3M 4E 5E 6E.
The number is the link-to-pair order; the letter is polarity (E = positive on even pins, O = odd,
M = odd except the 4&5 pair). The full table is in `../aes72.ts` and matches the standard row for row.

### Type 4E (the house default)

| Pin | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Signal | 1− | 1+ | 3− | 2+ | 2− | 3+ | 4− | 4+ |

| Link | Pins (+/−) | T568A pair | T568B pair |
|---|---|---|---|
| 1 | 2 / 1 | green | orange |
| 2 | 4 / 5 | blue | blue |
| 3 | 6 / 3 | orange | green |
| 4 | 8 / 7 | brown | brown |

Solid colours sit on even pins in both T568 schemes (Annex A.3), so on a 4E jack the **solid conductor is positive** and the white-striped one is the return.
T568A is preferred. A and B patch cords can be swapped freely because the pair groups are the same, but a crossover cord (A at one end, B at the other) swaps pins 1&2 with 3&6 and so reorders the links.

- **Labelling (§4.4):** "AES72 Type 4E" shown prominently on the equipment near the jack, and in the data sheet and manual. Use "AES72 Type 4E, not grounded" if the jack has no ground.
- **Compatibility (§4.5):** the same type number keeps link order; the same letter keeps polarity. AES3 links only care about the number.
- **Mixing types (Annex C):** a Type 4 sender into a Type 1 receiver arrives as links 1 3 2 4. A crossover cable lines Type 2 up with Type 4, with every link inverted (no interchannel phase change).
- **Shielding (§4.3):** unshielded QTP is generally fine for balanced audio. Shielded cable needs IEC 60603-7-1 connectors, with the shield bonded to chassis. **Phantom power requires shielded jacks and cable,** because the shield is the only return path.
- **Breakout:** two Type 4E jacks break out one AES59 DB25 (links 1-4 → circuits 1-4, then 5-8).
- **Install (Annex B):** use plugs matched to the cable, solid or stranded. Mount jacks tab-down. Splice only with compression splices; don't solder CAT conductors to XLRs or clamp them in Phoenix blocks.
- **DMX warning (Table 1 note):** DMX polarity on XLR is inverted relative to pro audio (pin 2 Data−, pin 3 Data+).

## SMPTE audio carriage (SMPTE-Audio family, `../smpteMediaConnectors.ts`)

Read from the standards' own text.

- **ST 299-1:2009, audio in HD-SDI (ST 292-1):**
  - 24-bit AES3 in groups of 4: up to 16 channels at 32 / 44.1 / 48 kHz, 8 at 96 kHz. 48 kHz locked to video is preferred.
  - Data packets go in the C-stream HANC; control packets go in the Y-stream HANC, once per frame or field.
  - Group DIDs, data / control: G1 2E7h / 1E3h, G2 1E6h / 2E2h, G3 1E5h / 2E1h, G4 2E4h / 1E0h.
  - Suggested port labels: "SMPTE 299 / 32,44,48" or "SMPTE 299 / 48,96". An ST 337 payload needs 48 kHz synchronous with no SRC.
- **ST 337:2008, non-PCM in AES3:**
  - Bursts open with Pa/Pb sync words (16-bit F872h / 4E1Fh; 20- and 24-bit forms too), then Pc burst_info (data_type, data_mode, stream 0-6, with 7 = time stamp) and Pd length in bits.
  - Channel-status byte 0 bit 1 = non-audio, but receivers should confirm by detecting Pa/Pb.
  - Frame mode: one burst over both subframes, up to 7 streams. Subframe mode: each channel independent, up to 14 streams.
- **ST 339:2008, generic data types:** 0 null, 2 time stamp, 3 pause, 26 utility, 30 user-defined.
  The full data_type registry, including Dolby E, is in **ST 338**, which is not in this set.
- **ST 340:2008:** AC-3 is data_type 1, 1536-frame bursts. E-AC-3 is data_type 16, frame mode only, 3324-frame decode latency.
- **ST 2041-2 / -3:2010:**
  - MPEG-2 AAC in ADTS is data_type 7 (1024 frames, or 2048 with SBR).
  - MPEG-4 AAC is data_type 10, and HE AAC v1/v2 is data_type 11, in ADTS or LATM/LOAS.
- **ST 2035:2009, track cases:**
  - Tracks 1/2 = AES pair 1 (embedded pair 1), 3/4 = pair 2, and so on.
  - Common 8-track cases: 11c = 5.1 + stereo; 11d = 5.1 + Lt/Rt; 11e = 5.1 + an ST 337 bitstream on T7/8.
  - Label deliveries by case ID.
- **ST 2036-2:2008, UHDTV 22.2:**
  - 24 channels, 48 kHz video-locked (96 kHz optional), 16 / 20 / 24-bit.
  - Channels 1-24 run FL FR FC LFE1 BL BR FLc FRc BC LFE2 SiL SiR TpFL TpFR TpFC TpC TpBL TpBR TpSiL TpSiR TpBC BtFC BtFL BtFR, on AES pairs 1-12.
  - In ST 2110-30 this is channel-order symbol `222`.
- **ST 383:2008:** this is DV-DIF in MXF, a file mapping rather than an audio format, so it is filed as `MXF-DV` under Codecs-Container.

## ST 2110 and ST 2022-7 (ST-2110 family, `../ipMediaConnectors.ts`)

- **-10 (system and timing):**
  - PTP with the ST 2059-2 profile; RTP over UDP; IPv4 multicast (IGMPv3) and unicast are required.
  - UDP payload ≤ 1460 octets, or 8960 extended (signalled `MAXUDP`).
  - One SDP per stream, with `a=mediaclk` and `a=ts-refclk`; a 2022-7 pair is signalled `a=group:DUP`.
- **-20 (video):** 90 kHz clock, `video/raw`, GPM or BPM packing. The required fmtp parameters are sampling, depth, width, height, exactframerate, colorimetry, PM and SSN.
- **-21 (traffic shaping):** sender types are TP = 2110TPN, 2110TPNL or 2110TPW; receiver types are N, W and A.
- **-30 (PCM audio):**
  - It is AES67, with 48 kHz mandatory.
  - Receiver levels: A = 1-8 ch at 1 ms; B adds 125 µs; C = up to 64 ch at 125 µs; the X variants add 96 kHz.
  - `channel-order=SMPTE2110.(…)` uses the symbols M, DM, ST, LtRt, 51, 71, 222, SGRP and U01-U64.
- **2022-7 (seamless protection):** identical RTP on two paths, rebuilt packet by packet. Receiver skew classes are A ≤ 10 ms, B ≤ 50 ms and C ≤ 150 ms (HBR) / 450 ms (SBR).

## MXL: EBU Media eXchange Layer (MXL family)

The data plane of the EBU Dynamic Media Facility. It is an open-source (Apache-2.0) SDK under the Linux Foundation, run with the EBU and NABA.

- Software media functions exchange **flows** through memory-mapped ring buffers in a tmpfs-backed *domain*. A writer fills a flow; readers map it read-only. There is no packetising and no copy.
- **Discrete** flows hold grains (V210 video, ANC). **Continuous** flows hold samples (Float32 audio, de-interleaved per channel).
- Each flow is identified by a UUID and described by an NMOS IS-04 Flow JSON.
- The Flow API (shared memory, MXL 1.0+) works within one host. The Fabric API (MXL 1.1+) shares flows across hosts over RDMA / EFA.

Sources: the [dmf-mxl/mxl repository](https://github.com/dmf-mxl/mxl) and its `docs/Architecture.md`.

## Sources

- AES14-1992 (r2014), AES59-2012 and AES72-2019, and SMPTE ST 299-1, 337, 339, 340, 383, 2022-7, 2035, 2036-2, 2041-2/-3 and 2110-10/-20/-21/-30: the standards' own text (licensed copies, not stored in the repo).
- [AES3, Wikipedia](https://en.wikipedia.org/wiki/AES3)
- [D-subminiature (professional audio), Wikipedia](https://en.wikipedia.org/wiki/D-subminiature_(professional_audio))
- [AES Standards Store](https://aes2.org/standards-store/?id=95)
