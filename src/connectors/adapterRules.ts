// Copyright (c) 2026 APK.audio & oneDiversified
// MIT License.

export type EssenceCategory =
  | 'video'
  | 'audio'
  | 'ancillary'
  | 'container'
  | 'image'
  | 'logic_bool'
  | 'numeric'
  | 'text'
  | 'universal'
  | 'control'
  | 'transport_ip'
  | 'physical_audio'
  | 'physical_video'
  | 'physical_network'
  | 'physical_power'
  | 'unknown';

export interface CompatibilityReport {
  compatible: boolean;
  status: 'valid' | 'adapter_needed' | 'incompatible' | 'hint';
  sourceCategory: EssenceCategory;
  targetCategory: EssenceCategory;
  summary: string;
  suggestedAdapter?: string;
  recommendedBlockId?: string;
  standardsNote?: string;
}

const ESSENCE_MAP: Record<string, EssenceCategory> = {
  // Logic & Math
  'IDEA': 'universal',
  'RESULT': 'universal',
  'IDEA-BOOL': 'logic_bool',
  'RESULT-BOOL': 'logic_bool',
  'IDEA-NUM': 'numeric',
  'RESULT-NUM': 'numeric',
  'IDEA-TEXT': 'text',
  'RESULT-TEXT': 'text',
  'LOGIC-AND': 'logic_bool',
  'LOGIC-OR': 'logic_bool',
  'LOGIC-NOT': 'logic_bool',
  'LOGIC-XOR': 'logic_bool',
  'LOGIC-NAND': 'logic_bool',
  'LOGIC-NOR': 'logic_bool',
  'LOGIC-XNOR': 'logic_bool',
  'MATH-ADD': 'numeric',
  'MATH-SUB': 'numeric',
  'MATH-MUL': 'numeric',
  'MATH-DIV': 'numeric',
  'MATH-MOD': 'numeric',
  'MATH-NEG': 'numeric',
  'MATH-ABS': 'numeric',
  'MATH-MIN': 'numeric',
  'MATH-MAX': 'numeric',
  'MATH-EQ': 'logic_bool',
  'MATH-NE': 'logic_bool',
  'MATH-LT': 'logic_bool',
  'MATH-LE': 'logic_bool',
  'MATH-GT': 'logic_bool',
  'MATH-GE': 'logic_bool',

  // ST 2110 & SMPTE
  'ST2110-10': 'control', // Timing & PTP
  'ST2110-20': 'video',
  'ST2110-21': 'video',
  'ST2110-22': 'video', // Constant bitrate compressed (JPEG XS)
  'ST2110-23': 'video',
  'ST2110-30': 'audio', // AES67 PCM audio
  'ST2110-30-RX2': 'audio',
  'ST2110-30-RX8': 'audio',
  'ST2110-30-RX16': 'audio',
  'ST2110-30-TX2': 'audio',
  'ST2110-30-TX8': 'audio',
  'ST2110-30-TX16': 'audio',
  'ST2110-31': 'audio', // AES3 transparent
  'ST2110-40': 'ancillary', // ST 291-1 ANC
  'ST2110-41': 'ancillary',
  'ST2110-43': 'ancillary',
  'ST2022-7': 'transport_ip',
  'ST299-1': 'audio',
  'ST337': 'audio',
  'ST340-AC3': 'audio',
  'ST340-EAC3': 'audio',

  // Audio Networked
  'DANTE': 'audio',
  'DANTE-RX2': 'audio',
  'DANTE-RX8': 'audio',
  'DANTE-RX16': 'audio',
  'DANTE-TX2': 'audio',
  'DANTE-TX8': 'audio',
  'DANTE-TX16': 'audio',
  'DANTE-MC': 'audio',
  'DANTE-AES67': 'audio',
  'DANTE-AV': 'video',
  'AES67-RX': 'audio',
  'AES67-TX': 'audio',
  'RAVENNA-RX': 'audio',
  'RAVENNA-TX': 'audio',
  'MILAN': 'audio',
  'QLAN': 'audio',

  // Audio Codecs
  'PCM': 'audio',
  'LPCM': 'audio',
  'AES67-L24': 'audio',
  'WAV': 'audio',
  'FLAC': 'audio',
  'ALAC': 'audio',
  'MP3': 'audio',
  'AAC': 'audio',
  'AAC-LC': 'audio',
  'HE-AAC': 'audio',
  'OPUS': 'audio',
  'VORBIS': 'audio',
  'G.711': 'audio',
  'G.722': 'audio',

  // Video Codecs
  'H.264': 'video',
  'H.265': 'video',
  'H.266': 'video',
  'VP8': 'video',
  'VP9': 'video',
  'AV1': 'video',
  'JPEG2000': 'video',
  'PRORES': 'video',
  'PRORES-RAW': 'video',
  'DNXHD': 'video',
  'DNXHR': 'video',
  'MPEG-2': 'video',

  // Containers
  'MP4': 'container',
  'MOV': 'container',
  'MKV': 'container',
  'AVI': 'container',
  'MXF': 'container',
  'MXF-DV': 'container',
  'MPEG-TS': 'container',
  'MPEG-PS': 'container',
  'WEBM': 'container',
  'FLV': 'container',
  'OGG': 'container',

  // Images
  'PNG': 'image',
  'JPEG': 'image',
  'TIFF': 'image',
  'SVG': 'image',
  'WEBP': 'image',
  'EXR': 'image',
  'HDR': 'image',
  'GIF': 'image',
  'BMP': 'image',
  'PSD': 'image',
  'DNG': 'image',
  'RAW-IMAGE': 'image',

  // NMOS & VoIP
  'NMOS': 'control',
  'NMOS-IS04': 'control',
  'NMOS-IS05': 'control',
  'SIP': 'control',
  'H.323': 'control',

  // Physical Connectors
  'XLR': 'physical_audio',
  'X3P': 'physical_audio',
  'X3S': 'physical_audio',
  'TRS': 'physical_audio',
  'RCA': 'physical_audio',
  'BNC': 'physical_video',
  'HDMI': 'physical_video',
  'DP': 'physical_video',
  'RJ45': 'physical_network',
  'LC': 'physical_network',
  'SC': 'physical_network',
  'MTP': 'physical_network',
  'IEC_C13': 'physical_power',
  'NEMA': 'physical_power',
};

export function getEssenceCategory(connectorOrPort: string): EssenceCategory {
  const norm = (connectorOrPort || '').trim().toUpperCase();
  if (ESSENCE_MAP[norm]) return ESSENCE_MAP[norm];

  if (norm.startsWith('MATH-')) return 'numeric';
  if (norm.startsWith('LOGIC-')) return 'logic_bool';
  if (norm.startsWith('IDEA')) return norm.includes('NUM') ? 'numeric' : norm.includes('BOOL') ? 'logic_bool' : norm.includes('TEXT') ? 'text' : 'universal';
  if (norm.startsWith('RESULT')) return norm.includes('NUM') ? 'numeric' : norm.includes('BOOL') ? 'logic_bool' : norm.includes('TEXT') ? 'text' : 'universal';
  if (norm.startsWith('ST2110-2')) return 'video';
  if (norm.startsWith('ST2110-3')) return 'audio';
  if (norm.startsWith('ST2110-4')) return 'ancillary';
  if (norm.startsWith('DANTE')) return norm === 'DANTE-AV' ? 'video' : 'audio';
  if (norm.startsWith('QLAN')) return 'audio';
  if (norm.startsWith('DDM')) return 'audio';
  if (norm.startsWith('AES67')) return 'audio';
  if (norm.startsWith('NMOS')) return 'control';
  if (norm.startsWith('RJ45') || norm.startsWith('SFP') || norm.startsWith('QSFP')) return 'physical_network';

  return 'unknown';
}

/**
 * Evaluates compatibility between two connectors/ports and suggests adapters when mismatched.
 */
export function evaluatePortCompatibility(sourceType: string, targetType: string): CompatibilityReport {
  const src = (sourceType || '').trim().toUpperCase();
  const tgt = (targetType || '').trim().toUpperCase();

  const srcCat = getEssenceCategory(src);
  const tgtCat = getEssenceCategory(tgt);

  // Exact type match
  if (src === tgt) {
    return {
      compatible: true,
      status: 'valid',
      sourceCategory: srcCat,
      targetCategory: tgtCat,
      summary: `Compatible: Identical signal types (${src}).`,
      standardsNote: 'Direct wiring complies with standard specifications.',
    };
  }

  // Universal IDEA/RESULT can adapt to anything
  if (srcCat === 'universal' || tgtCat === 'universal') {
    return {
      compatible: true,
      status: 'hint',
      sourceCategory: srcCat,
      targetCategory: tgtCat,
      summary: `Universal Dataflow Adaptable: IDEA / RESULT freely binds to ${tgtCat === 'universal' ? src : tgt}.`,
      suggestedAdapter: 'Direct bind or Value Adapter block',
      recommendedBlockId: 'adapter.value',
      standardsNote: 'Dataflow semantics allow value-adaptation to resolve incompatible ports.',
    };
  }

  // Same category compatibility
  if (srcCat === tgtCat && srcCat !== 'unknown') {
    if (srcCat === 'video') {
      if ((src.startsWith('ST2110-20') && tgt.startsWith('H.264')) || (src.startsWith('H.264') && tgt.startsWith('ST2110-20'))) {
        return {
          compatible: false,
          status: 'adapter_needed',
          sourceCategory: srcCat,
          targetCategory: tgtCat,
          summary: 'Video Essence Match, but Codec / Compression mismatch (Uncompressed ST 2110-20 vs compressed H.264).',
          suggestedAdapter: 'H.264 Video Encoder / Decoder Adapter',
          recommendedBlockId: 'adapter.transcode',
          standardsNote: 'ST 2110-20 RFC 4175 raw video requires encoding to encapsulate into compressed stream.',
        };
      }
      return {
        compatible: true,
        status: 'valid',
        sourceCategory: srcCat,
        targetCategory: tgtCat,
        summary: `Compatible Video Essence (${src} ➔ ${tgt}).`,
      };
    }

    if (srcCat === 'audio') {
      if (src.startsWith('DANTE') && tgt.startsWith('AES67')) {
        return {
          compatible: true,
          status: 'hint',
          sourceCategory: srcCat,
          targetCategory: tgtCat,
          summary: 'Interoperable: Dante supports AES67 interoperability mode (PTPv2 / RTP).',
          standardsNote: 'Audinate Dante devices can be configured in AES67 mode to interoperate directly.',
        };
      }
      return {
        compatible: true,
        status: 'valid',
        sourceCategory: srcCat,
        targetCategory: tgtCat,
        summary: `Compatible Audio Essence (${src} ➔ ${tgt}).`,
      };
    }

    if (srcCat === 'numeric' || srcCat === 'logic_bool') {
      return {
        compatible: true,
        status: 'valid',
        sourceCategory: srcCat,
        targetCategory: tgtCat,
        summary: `Compatible Dataflow Math/Logic (${src} ➔ ${tgt}).`,
      };
    }
  }

  // Numeric into Logic Gate
  if (srcCat === 'numeric' && tgtCat === 'logic_bool') {
    return {
      compatible: false,
      status: 'adapter_needed',
      sourceCategory: srcCat,
      targetCategory: tgtCat,
      summary: `Type Mismatch: Numeric quantity (${src}) connected to Boolean input (${tgt}).`,
      suggestedAdapter: 'Math Comparator Adapter (MATH-EQ, MATH-GT, MATH-NE)',
      recommendedBlockId: 'math.compare',
      standardsNote: 'Insert a comparison adapter to transform analog / numeric values into true / false logic.',
    };
  }

  // Logic into Numeric
  if (srcCat === 'logic_bool' && tgtCat === 'numeric') {
    return {
      compatible: true,
      status: 'hint',
      sourceCategory: srcCat,
      targetCategory: tgtCat,
      summary: `Boolean to Number Adapter: True/False implicitly coerces to 1 / 0.`,
      suggestedAdapter: 'Math Scale / Negate Adapter (MATH-ADD, MATH-MUL)',
      recommendedBlockId: 'math.add',
    };
  }

  // Container into Essence (MP4 into Video/Audio)
  if (srcCat === 'container' && (tgtCat === 'video' || tgtCat === 'audio' || tgtCat === 'image')) {
    return {
      compatible: false,
      status: 'adapter_needed',
      sourceCategory: srcCat,
      targetCategory: tgtCat,
      summary: `Container Multiplex Mismatch: ${src} is a file container containing multiple essences.`,
      suggestedAdapter: 'Container Demuxer Adapter (demuxes container into Video, Audio, ANC)',
      recommendedBlockId: 'adapter.demux',
      standardsNote: 'A demuxer is required to parse container atoms / headers and expose elementary streams.',
    };
  }

  // Video into Container (Muxer)
  if ((srcCat === 'video' || srcCat === 'audio') && tgtCat === 'container') {
    return {
      compatible: false,
      status: 'adapter_needed',
      sourceCategory: srcCat,
      targetCategory: tgtCat,
      summary: `Multiplexing Required: Elementary essence (${src}) cannot plug directly into container (${tgt}) without muxing.`,
      suggestedAdapter: 'Container Multiplexer Adapter (Mux)',
      recommendedBlockId: 'adapter.mux',
    };
  }

  // ST 2110 Essence Mismatch (Video to Audio)
  if ((src.startsWith('ST2110-20') && tgt.startsWith('ST2110-30')) || (src.startsWith('ST2110-30') && tgt.startsWith('ST2110-20'))) {
    return {
      compatible: false,
      status: 'incompatible',
      sourceCategory: srcCat,
      targetCategory: tgtCat,
      summary: `Essence Mismatch: Cannot connect ST 2110-20 Video directly to ST 2110-30 Audio.`,
      suggestedAdapter: 'Separate Audio and Video Pipelines; use SDI Embedder/De-embedder if multiplexing required.',
      recommendedBlockId: 'adapter.deembedder',
      standardsNote: 'SMPTE ST 2110 splits essence into independent RTP flows (-20 video, -30 audio, -40 anc).',
    };
  }

  // Baseband Video (HDMI/SDI/BNC) into IP Flow
  if (srcCat === 'physical_video' && tgtCat === 'video') {
    return {
      compatible: false,
      status: 'adapter_needed',
      sourceCategory: srcCat,
      targetCategory: tgtCat,
      summary: `Physical Baseband to IP Flow: ${src} baseband requires an IP Gateway / Encapsulator to produce ${tgt}.`,
      suggestedAdapter: 'ST 2110 / NDI Gateway Adapter',
      recommendedBlockId: 'adapter.st2110_gateway',
      standardsNote: 'SMPTE ST 2110 gateway digitizes raster and formats RFC 4175 RTP packets locked to PTP.',
    };
  }

  // Default Incompatible
  return {
    compatible: false,
    status: 'adapter_needed',
    sourceCategory: srcCat,
    targetCategory: tgtCat,
    summary: `Signal Type Mismatch: ${src} (${srcCat}) ➔ ${tgt} (${tgtCat}).`,
    suggestedAdapter: 'Universal In-Line Adapter / Converter Block',
    recommendedBlockId: 'adapter.value',
  };
}
