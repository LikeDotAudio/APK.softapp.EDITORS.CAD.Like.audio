// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { describe, expect, it } from 'vitest';
import { PANEL_CONNECTOR_SHELVES } from './panelConnectors';
import { CONNECTOR_SHELVES, lookupConnector, lookupConnectorLoose } from './ConnectorLookup';
import { SIGNAL_FORMAT_FAMILIES, isSignalFormat } from './signalFormats';
import { resolveIfcConnector } from './ifcConnectors';
import { ICONS } from './index';

/*
 * ROAD-3588: the CAD keeps no vocabulary of its own. Every panel code it draws is a
 * connectors.json connector — except the codes below, which the vocabulary does not
 * have yet (the IFC session's to add: ROAD item filed with ROAD-3588's close). A code
 * that leaves this list by landing in connectors.json fails the second test, so the
 * list only shrinks.
 */
const NOT_IN_VOCABULARY_YET = new Set([
  'KEY-3.5mm', 'KEY-RCA', 'KEY-GEN', 'A59P', 'A59S',
  'AES72 Type 1E', 'AES72 Type 1O', 'AES72 Type 1M', 'AES72 Type 2O', 'AES72 Type 3E', 'AES72 Type 3M',
  'AES72 Type 4E', 'AES72 Type 5E', 'AES72 Type 6E',
  'TB##P', 'BAN2-HD', 'BAN2-SK',
  'FCM1D', 'FCM1S', 'FCM3D', 'FCM3S', 'FCM4D', 'FCM4S', 'LCM1S', 'LCM3S',
  'CIR##P', 'CIR##S', 'DIN#P', 'DIN#S', 'HR##P', 'HR##S', 'MDIN#P', 'MDIN#S', 'TJ##P', 'TJ##S',
  'OCL2', 'OCL4', 'OCL12', 'OCL24',
  'SCM1D', 'SCM1S', 'SCM3D', 'SCM3S', 'SCM4D', 'SCM4S', 'PLX-MM',
  'SMPTEP-TH', 'SMPTES-TH', 'STA-D', 'STA-S', 'STM1-D', 'STM3-D', 'STM4-D', 'TRXP-FL', 'TRXS-FL',
]);

const codes = PANEL_CONNECTOR_SHELVES.flatMap((g) => g.connectors.map((c) => c.abbreviation));

describe('panel connectors are the vocabulary\'s', () => {
  it('every code resolves to a connectors.json entry, or is listed as not there yet', () => {
    const missing = codes.filter((c) => !NOT_IN_VOCABULARY_YET.has(c) && !lookupConnector(c)?.ifc);
    expect(missing).toEqual([]);
  });

  it('no listed code has meanwhile landed in connectors.json', () => {
    expect([...NOT_IN_VOCABULARY_YET].filter((c) => resolveIfcConnector(c))).toEqual([]);
  });

  it('no panel code is also a signal format', () => {
    expect(codes.filter(isSignalFormat)).toEqual([]);
  });

  it('a vocabulary spelling answers with the code that draws it', () => {
    expect(lookupConnectorLoose('3-pin XLR female')?.abbreviation).toBe('X3S');
    expect(lookupConnectorLoose('XLR3-M')?.abbreviation).toBe('X3P');
    expect(lookupConnector('X3P')?.ifc?.ConnectionGender).toBe('MALE');
  });
});

describe('signal formats come from signal-formats.json', () => {
  it('every family is a shelf, every format is known and has a glyph', () => {
    for (const f of SIGNAL_FORMAT_FAMILIES) {
      expect(CONNECTOR_SHELVES.some((s) => s.name === f.name)).toBe(true);
      for (const x of f.formats) {
        expect(lookupConnector(x.abbreviation)?.group).toBe(f.name);
        expect(ICONS[x.abbreviation], x.abbreviation).toBeTypeOf('function');
      }
    }
    expect(SIGNAL_FORMAT_FAMILIES.reduce((n, f) => n + f.formats.length, 0)).toBe(200);
  });
});
