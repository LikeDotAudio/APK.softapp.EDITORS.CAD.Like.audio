// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * The reactive half of the store, for rendering.
 *
 * Subscribes to `EditorStore`'s derived `UiState` through
 * `useSyncExternalStore`, so React re-renders when — and only when — the
 * store emits. The store's own mutable fields change at pointer rate and are
 * deliberately not reactive; that is `useStore()`'s job.
 *
 * `getSnapshot` is passed for the server snapshot too: this app has no SSR,
 * and passing the same function is how you say so without a second code path.
 */
import { useSyncExternalStore } from 'react';
import type { UiState } from './EditorStore';
import { useStore } from './useStore';

/** Subscribe to the editor's derived UI state. */
export function useUi(): UiState {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
