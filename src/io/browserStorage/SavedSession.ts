// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Layer, Units, GridMode } from '../../core/types';
import type { SchematicSnapshot } from '../../flow/Schematic';
import type { DocSnapshot } from '../../model/doc/DocSnapshot';

/** Everything restored when the app reopens. */
export interface SavedSession {
  version: number;
  timestamp: number;
  docSnapshot: DocSnapshot;
  /** Optional: sessions saved before Flow blocks existed do not have one. */
  schematic?: SchematicSnapshot;
  units: Units;
  gridSize: number;
  gridMode?: GridMode;
  snapToGrid: boolean;
  shapeMode: boolean;
  activeLayerId: string;
  layers: Layer[];
  tracing?: {
    dataUrl: string;
    x: number;
    y: number;
    worldWidth: number;
    opacity: number;
    visible: boolean;
  } | null;
}

export const DB_NAME = 'CadLikeAudioBrowserDB';
export const DB_VERSION = 1;
export const SESSION_KEY = 'current_active_session';
export const LOCALSTORAGE_SESSION_KEY = 'cad_like_audio_active_session';
