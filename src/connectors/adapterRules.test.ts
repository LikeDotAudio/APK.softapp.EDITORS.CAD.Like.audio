// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import { describe, expect, it } from 'vitest';
import { evaluatePortCompatibility, getEssenceCategory } from './adapterRules';
import { evaluateLogicPort, logicArity } from './logicConnectors';

describe('Essence Categorization', () => {
  it('correctly maps ST 2110 essences to video, audio, and ancillary', () => {
    expect(getEssenceCategory('ST2110-20')).toBe('video');
    expect(getEssenceCategory('ST2110-30')).toBe('audio');
    expect(getEssenceCategory('ST2110-40')).toBe('ancillary');
    expect(getEssenceCategory('ST2110-10')).toBe('control');
  });

  it('correctly maps codecs and containers', () => {
    expect(getEssenceCategory('H.264')).toBe('video');
    expect(getEssenceCategory('PRORES')).toBe('video');
    expect(getEssenceCategory('PCM')).toBe('audio');
    expect(getEssenceCategory('AAC')).toBe('audio');
    expect(getEssenceCategory('MP4')).toBe('container');
    expect(getEssenceCategory('MKV')).toBe('container');
    expect(getEssenceCategory('MXF')).toBe('container');
  });

  it('correctly maps media and image formats', () => {
    expect(getEssenceCategory('PNG')).toBe('image');
    expect(getEssenceCategory('JPEG')).toBe('image');
    expect(getEssenceCategory('SVG')).toBe('image');
    expect(getEssenceCategory('EXR')).toBe('image');
    expect(getEssenceCategory('RAW-IMAGE')).toBe('image');
  });

  it('correctly maps dataflow logic and math', () => {
    expect(getEssenceCategory('IDEA')).toBe('universal');
    expect(getEssenceCategory('IDEA-NUM')).toBe('numeric');
    expect(getEssenceCategory('IDEA-BOOL')).toBe('logic_bool');
    expect(getEssenceCategory('MATH-ADD')).toBe('numeric');
    expect(getEssenceCategory('LOGIC-AND')).toBe('logic_bool');
  });
});

describe('Compatibility & Adapter Suggestion Engine', () => {
  it('approves direct connection for identical ports', () => {
    const report = evaluatePortCompatibility('ST2110-30', 'ST2110-30');
    expect(report.compatible).toBe(true);
    expect(report.status).toBe('valid');
  });

  it('permits universal IDEA / RESULT to adapt to any port with hint', () => {
    const report = evaluatePortCompatibility('IDEA', 'MATH-ADD');
    expect(report.compatible).toBe(true);
    expect(report.status).toBe('hint');
  });

  it('flags ST 2110 essence mismatch (Video to Audio) and gives standards note', () => {
    const report = evaluatePortCompatibility('ST2110-20', 'ST2110-30');
    expect(report.compatible).toBe(false);
    expect(report.status).toBe('incompatible');
    expect(report.summary).toContain('Essence Mismatch');
  });

  it('suggests container demuxer when container is wired to an elementary codec', () => {
    const report = evaluatePortCompatibility('MP4', 'H.264');
    expect(report.compatible).toBe(false);
    expect(report.status).toBe('adapter_needed');
    expect(report.suggestedAdapter).toContain('Container Demuxer');
    expect(report.recommendedBlockId).toBe('adapter.demux');
  });

  it('suggests comparison adapter when number is wired to a logic gate', () => {
    const report = evaluatePortCompatibility('IDEA-NUM', 'LOGIC-AND');
    expect(report.compatible).toBe(false);
    expect(report.status).toBe('adapter_needed');
    expect(report.suggestedAdapter).toContain('Comparator');
    expect(report.recommendedBlockId).toBe('math.compare');
  });

  it('suggests gateway adapter when baseband video is wired to IP stream', () => {
    const report = evaluatePortCompatibility('HDMI', 'ST2110-20');
    expect(report.compatible).toBe(false);
    expect(report.status).toBe('adapter_needed');
    expect(report.suggestedAdapter).toContain('Gateway');
    expect(report.recommendedBlockId).toBe('adapter.st2110_gateway');
  });
});

describe('Dataflow Logic & Arithmetic Evaluation', () => {
  it('evaluates arithmetic addition and subtraction', () => {
    expect(evaluateLogicPort('MATH-ADD', [10, 25, 5])).toBe(40);
    expect(evaluateLogicPort('MATH-SUB', [100, 20, 10])).toBe(70);
  });

  it('evaluates logic gates (AND, OR, NOT, XOR)', () => {
    expect(evaluateLogicPort('LOGIC-AND', [true, true, true])).toBe(true);
    expect(evaluateLogicPort('LOGIC-AND', [true, false])).toBe(false);
    expect(evaluateLogicPort('LOGIC-OR', [false, true])).toBe(true);
    expect(evaluateLogicPort('LOGIC-NOT', [false])).toBe(true);
    expect(evaluateLogicPort('LOGIC-XOR', [true, false])).toBe(true);
    expect(evaluateLogicPort('LOGIC-XOR', [true, true])).toBe(false);
  });

  it('knows port arity', () => {
    expect(logicArity('MATH-ADD')).toEqual({ min: 2, max: undefined });
    expect(logicArity('LOGIC-NOT')).toEqual({ min: 1, max: 1 });
    expect(logicArity('IDEA-NUM')).toEqual({ min: 1, max: 1 });
  });
});
