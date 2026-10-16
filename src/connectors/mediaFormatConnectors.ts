// Copyright (c) 2026 APK.audio & oneDiversified
// MIT License.

import type { ConnectorGroup } from './ConnectorLookup';

export const IMAGE_FORMAT_GROUP: ConnectorGroup = {
  name: 'Media-Images',
  groupDescription: 'Image & Still Graphic Formats — raster, vector, HDR, and RAW photographic media essences.',
  connectors: [
    { abbreviation: 'PNG', description: 'PNG (.png) — Portable Network Graphics, lossless compressed raster with alpha channel' },
    { abbreviation: 'JPEG', description: 'JPEG / JPG (.jpg) — Joint Photographic Experts Group lossy photo image' },
    { abbreviation: 'TIFF', description: 'TIFF (.tif) — Tagged Image File Format, uncompressed / LZW deep-color master image' },
    { abbreviation: 'SVG', description: 'SVG (.svg) — Scalable Vector Graphics, XML-based 2D vector asset' },
    { abbreviation: 'WEBP', description: 'WebP (.webp) — Modern web image format supporting lossy, lossless, and animated imagery' },
    { abbreviation: 'EXR', description: 'OpenEXR (.exr) — Industrial Light & Magic 16-bit / 32-bit floating point high dynamic range raster' },
    { abbreviation: 'HDR', description: 'Radiance HDR (.hdr) — RGBE high dynamic range environment and scene map' },
    { abbreviation: 'GIF', description: 'GIF (.gif) — Graphics Interchange Format, 8-bit indexed palette animated graphic' },
    { abbreviation: 'BMP', description: 'BMP (.bmp) — Windows bitmap uncompressed raster image' },
    { abbreviation: 'PSD', description: 'PSD (.psd) — Adobe Photoshop layered raster/vector document format' },
    { abbreviation: 'DNG', description: 'Adobe DNG (.dng) — Digital Negative open RAW photography specification' },
    { abbreviation: 'RAW-IMAGE', description: 'RAW Image — Unprocessed camera sensor Bayer / CFA essence' },
  ],
};

export const DOCUMENT_3D_GROUP: ConnectorGroup = {
  name: 'Media-3D-Doc',
  groupDescription: '3D scene models, documents, and data exchange structures.',
  connectors: [
    { abbreviation: 'PDF', description: 'PDF (.pdf) — Adobe Portable Document Format' },
    { abbreviation: 'GLTF', description: 'glTF (.gltf / .glb) — Khronos Group GL Transmission Format 3D scene / model' },
    { abbreviation: 'USDZ', description: 'USDZ (.usdz) — Pixar / Apple Universal Scene Description packaged 3D asset' },
    { abbreviation: 'JSON-DATA', description: 'JSON (.json) — JavaScript Object Notation structured data stream' },
    { abbreviation: 'XML-DATA', description: 'XML (.xml) — Extensible Markup Language essence or schema' },
  ],
};

export const MEDIA_FORMAT_GROUPS: readonly ConnectorGroup[] = [
  IMAGE_FORMAT_GROUP,
  DOCUMENT_3D_GROUP,
];
