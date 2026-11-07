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
 * connectors.json connector — its `cad` code, or an alias of the connector it mounts
 * (KEY-3.5mm, TRXP-FL, SMPTEP-TH). ROAD-3599 added the last 55, so there is no
 * not-yet list: a new panel code lands in contracts/ifc/connectors.json first.
 */

const codes = PANEL_CONNECTOR_SHELVES.flatMap((g) => g.connectors.map((c) => c.abbreviation));

describe('panel connectors are the vocabulary\'s', () => {
  it('every code resolves to a connectors.json entry', () => {
    const missing = codes.filter((c) => !lookupConnector(c)?.ifc);
    expect(missing).toEqual([]);
  });

  it('the 55 codes ROAD-3599 added resolve with their IFC words', () => {
    expect(resolveIfcConnector('A59S')?.ConnectionGender).toBe('FEMALE');
    expect(lookupConnector('AES72 Type 4E')?.ifc?.id).toBe('AES72-4E');
    expect(lookupConnector('CIR##P')?.ifc?.ConnectionGender).toBe('MALE');
    expect(lookupConnector('KEY-3.5mm')?.ifc?.id).toBe('TRS-3.5-F');
    expect(lookupConnectorLoose('FC multimode OM1 duplex')?.abbreviation).toBe('FCM1D');
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
    expect(SIGNAL_FORMAT_FAMILIES.reduce((n, f) => n + f.formats.length, 0)).toBe(204);
  });
});
