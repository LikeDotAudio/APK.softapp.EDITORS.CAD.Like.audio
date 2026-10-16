// Copyright (c) 2026 oneDiversified / APK.audio
// MIT License.

export interface ConnectorGroupSpec {
  label: string;
  icon?: string;
  families: string[];
}

export const CONNECTOR_SUPER_CATEGORIES: readonly ConnectorGroupSpec[] = [
  {
    label: 'Audio',
    icon: '🎤',
    families: ['Audio-Networked', 'Audio', 'Audio-XLR', 'Audio-Multipin', 'Audio-Bloc', 'Audio-Speaker'],
  },
  {
    label: 'Fiber',
    icon: '🧶',
    families: ['FC-Fiber', 'LC-Fiber', 'MP-Fiber', 'OC-Fiber', 'SC-Fiber', 'ST-Fiber'],
  },
  {
    label: 'Data',
    icon: '💾',
    families: ['D-Sub', 'USB', 'SFP', 'RJ-Modular', 'Multipin'],
  },
  {
    label: 'Power',
    icon: '⚡',
    families: ['Power-AC', 'Power-DC'],
  },
  {
    label: 'Video/RF',
    icon: '📺',
    families: ['Video', 'RF', 'SMPTE'],
  },
  {
    label: 'Other',
    icon: '🔧',
    families: ['Punchdown', 'WireTerminal', 'TRIAX'],
  },
  {
    label: 'Panel',
    icon: '🧩',
    families: ['Blank', 'Keystone', 'Patchbay', 'Robo'],
  },
  {
    label: 'IP Media',
    icon: '🌐',
    families: ['ST-2110', 'SMPTE-Audio', 'NMOS', 'MXL', 'AV-over-IP', 'IP-Streaming', 'VoIP'],
  },
  {
    label: 'Codecs',
    icon: '🎬',
    families: ['Codecs-Audio', 'Codecs-Video', 'Codecs-Container'],
  },
  {
    label: 'Logic',
    icon: '🧮',
    families: ['Idea', 'Result', 'Logic', 'Arithmetic'],
  },
  {
    label: 'Media',
    icon: '🖼️',
    families: ['Media-Images', 'Media-3D-Doc'],
  },
];
