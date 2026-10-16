// Copyright (c) 2026 oneDiversified / APK.audio

import { AES72_ALL_SPELLINGS, AES72_CHANNELS } from './aes72';
import { lookupConnectorLoose, type ConnectorLookupEntry } from './ConnectorLookup';

export const MULTI_BLOCK_COLORS = [
  '#8ab4f8', '#f28b82', '#fdd663', '#81c995', '#c58af9', '#78d9ec', '#ff8bcb', '#aecbfa'
];

export const MULTI_CONNECTOR_CHANNELS: Record<string, number> = {
  E3P: 1,
  E3S: 1,
  DT12: 12,
  A59S: 8,
  A59P: 8,
  ...Object.fromEntries(AES72_ALL_SPELLINGS.map(s => [s.toUpperCase(), AES72_CHANNELS])),
  EDAC20: 20,
  EDAC38: 38,
  EDAC56: 56,
  EDAC90: 90,
  E8P: 8,
  E8S: 8,
  E12P: 12,
  E12S: 12,
  E16P: 16,
  E16S: 16,
  E26P: 26,
  E26S: 26,
  E32P: 32,
  E32S: 32,
};

export interface ParsedConnectorRef {
  type: string;
  channel: number | null;
  raw: string;
}

export const parseConnectorRef = (raw: string): ParsedConnectorRef => {
  const s = (raw || '').trim();
  const m = s.match(/^(.*?)[.\s](\d+)$/);
  if (m) return { type: m[1].trim().toUpperCase(), channel: parseInt(m[2], 10), raw: s };
  return { type: s.toUpperCase(), channel: null, raw: s };
};

export interface ResolvedConnectorRef extends ParsedConnectorRef {
  abbreviation: string | null;
  entry: ConnectorLookupEntry | null;
  canonical: string;
}

export const withConnectorChannel = (type: string, channel: number | null): string =>
  channel == null ? type : `${type}.${channel}`;

export const resolveConnectorRef = (raw: string): ResolvedConnectorRef => {
  const parsed = parseConnectorRef(raw);
  const hit = lookupConnectorLoose(parsed.type);
  const abbreviation = hit?.abbreviation ?? null;
  return {
    ...parsed,
    abbreviation,
    entry: hit?.entry ?? null,
    canonical: abbreviation
      ? withConnectorChannel(abbreviation, parsed.channel)
      : parsed.raw,
  };
};

export const connectorCapacity = (type: string): number | null => {
  const key = (type || '').trim().toUpperCase();
  if (MULTI_CONNECTOR_CHANNELS[key] != null) return MULTI_CONNECTOR_CHANNELS[key];
  const parsed = parseConnectorRef(type);
  if (parsed.channel != null) return Math.max(parsed.channel, 1);
  return null;
};

export const isMultipinType = (type: string): boolean => {
  const parsed = parseConnectorRef(type);
  if (parsed.channel != null) return true;
  const c = connectorCapacity(type);
  return c != null && c > 1;
};

export const connectorInstance = (type: string, channel: number | null): number | null => {
  const cap = connectorCapacity(type);
  if (cap == null || channel == null || channel < 1) return null;
  return Math.ceil(channel / cap);
};

export const connectorPin = (type: string, channel: number | null): number | null => {
  const cap = connectorCapacity(type);
  if (cap == null || channel == null || channel < 1) return null;
  return ((channel - 1) % cap) + 1;
};

export interface PortGroup {
  type: string;
  isMulti: boolean;
  color: string | null;
  members: number[];
}

export function buildPortGroups<P extends { is_spacer?: boolean; connector?: string }>(
  ports: readonly (P | null | undefined)[],
  connectorOf: (p: P, i: number) => string,
): PortGroup[] {
  const groups: PortGroup[] = [];
  let colorIdx = -1;
  ports.forEach((p, i) => {
    if (!p || p.is_spacer) {
      groups.push({ type: '', isMulti: false, color: null, members: [i] });
      return;
    }
    const type = parseConnectorRef(connectorOf(p, i) || '').type;
    const multi = isMultipinType(type);
    const cap = connectorCapacity(type) ?? Infinity;
    const last = groups[groups.length - 1];
    if (multi && last && last.isMulti && last.type === type && last.members.length < cap) {
      last.members.push(i);
    } else {
      let color: string | null = null;
      if (multi) {
        colorIdx++;
        color = MULTI_BLOCK_COLORS[colorIdx % MULTI_BLOCK_COLORS.length];
      }
      groups.push({ type, isMulti: multi, color, members: [i] });
    }
  });
  return groups;
}
