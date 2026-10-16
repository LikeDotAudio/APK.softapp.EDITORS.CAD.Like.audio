// Copyright (c) 2026 oneDiversified / APK.audio
// MIT License.

import { lookupConnector } from '../ConnectorLookup';

/**
 * The connector palette's search box: which connector types a query finds.
 * Matched against the type's abbreviation and its catalogue description.
 * Multi-word queries use AND logic — "XLR 3" finds the types whose text holds
 * both "xlr" and "3".
 */
export function searchConnectorTypes(filter: string, allTypes: readonly string[]): string[] {
  const tokens = filter.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  return allTypes.filter((type) => {
    const description = lookupConnector(type)?.description.toLowerCase() ?? '';
    const haystack = type.toLowerCase() + ' ' + description;
    return tokens.every((tok) => haystack.includes(tok));
  });
}
