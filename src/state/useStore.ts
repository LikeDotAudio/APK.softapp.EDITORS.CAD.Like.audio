// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * The imperative half of the store, for event handlers.
 *
 * Returns the live `EditorStore`, which is mutable and must NOT be read during
 * a render — use `useUi()` for that. This is what a click handler calls to
 * change something; `useUi()` is what a component reads to draw.
 *
 * It throws rather than returning null when there is no provider: a component
 * mounted outside `<EditorContext.Provider>` is a wiring mistake, and a silent
 * null turns it into a crash three frames later somewhere else.
 */
import { useContext } from 'react';
import { EditorContext } from './EditorContext';
import type { EditorStore } from './EditorStore';

/** The editor store, for imperative calls out of event handlers. */
export function useStore(): EditorStore {
  const store = useContext(EditorContext);
  if (!store) throw new Error('useStore must be used inside <EditorContext.Provider>');
  return store;
}
