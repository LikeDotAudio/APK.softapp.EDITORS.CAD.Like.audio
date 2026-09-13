// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { createContext, useContext } from 'react';
import { currentEntrance, type EntranceProfile } from './entrance';

/**
 * Which door this window came in by, for the components that draw differently
 * because of it. Defaulted rather than nullable: a component rendered outside
 * the provider is on the drawing board, which is where this app has always
 * opened.
 */
export const EntranceContext = createContext<EntranceProfile>(currentEntrance());

export function useEntrance(): EntranceProfile {
  return useContext(EntranceContext);
}
