// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

export interface VirtualMirrorState {
  /** Whether Symmetrical Mode is active and automatically mirroring. */
  enabled: boolean;
  /** World X coordinate of the virtual mirror line (vertical reflection axis). */
  x: number;
  /** Whether the virtual mirror line itself is currently selected (causes CAD edge to glow). */
  selected: boolean;
}

export const DEFAULT_VIRTUAL_MIRROR: VirtualMirrorState = {
  enabled: false,
  x: 0,
  selected: false,
};
