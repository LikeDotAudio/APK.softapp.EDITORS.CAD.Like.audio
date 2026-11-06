// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CadSpace, Layer, Units, GridMode } from '../../core/types';
import type { VirtualMirrorState } from '../../core/mirror';
import type { UserAuth } from '../../core/userAuth';
import type { SchematicSnapshot } from '../../flow/Schematic';
import type { DocSnapshot } from '../../model/doc/DocSnapshot';

/** Everything restored when the app reopens. */
export interface SavedSession {
  /**
   * 2: every number below is in mm and `units` is only how lengths are shown
   * (cad-1). 1: the geometry is in `units` — opened through sessionInMm.
   */
  version: number;
  timestamp: number;
  userAuth?: UserAuth;
  docSnapshot: DocSnapshot;
  currentFileName?: string | null;
  /** Optional: sessions saved before Flow blocks existed do not have one. */
  schematic?: SchematicSnapshot;
  /** How lengths are shown and typed (version 2); version 1: also what the numbers are in. */
  units: Units;
  /** Grid spacing, mm (version 2). */
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
  /**
   * The drawing's own persistent key: every IfcGlobalId of the .ifc twin is
   * derived from it (cad/<docKey>/…), so walls, rooms and placements keep their
   * ids across sessions and machines. Absent on sessions saved before cad-3.
   */
  docKey?: string;
  /** The Virtual Mirror (cad-10): saved, so the symmetry and its ids survive a reload. */
  mirror?: VirtualMirrorState;
  /** Rooms the user declared (cad-4), each one IfcSpace. */
  spaces?: CadSpace[];
}

/** The key the session's .ifc twin is kept under, beside SESSION_KEY, written in the same transaction. */
export const SESSION_IFC_KEY = 'current_active_session_ifc';

export const DB_NAME = 'CadLikeAudioBrowserDB';
export const DB_VERSION = 1;
export const SESSION_KEY = 'current_active_session';
export const LOCALSTORAGE_SESSION_KEY = 'cad_like_audio_active_session';
