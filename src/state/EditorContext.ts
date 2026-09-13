// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { createContext } from 'react';
import type { EditorStore } from './EditorStore';

/** Provides the single EditorStore instance to the component tree. */
export const EditorContext = createContext<EditorStore | null>(null);
