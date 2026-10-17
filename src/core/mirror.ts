// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

export interface VirtualMirror {
  /** Unique mirror identifier. */
  id: string;
  /** World X coordinate of the vertical reflection axis. */
  x: number;
  /** Whether this mirror's CAD edge is currently selected and glowing. */
  selected: boolean;
  /** Human-readable tag / label. */
  name?: string;
  /** ID of another mirror that reflected this mirror into existence. */
  reflectedFrom?: string;
  /** Custom glowing accent color (defaults to '#00f7ff', or magenta/amber for reflected mirrors). */
  glowColor?: string;
}

export interface VirtualMirrorState {
  /** Whether Symmetrical Mode is active and automatically mirroring. */
  enabled: boolean;
  /** Primary / active mirror X coordinate. */
  x: number;
  /** Whether any mirror is selected (causes its CAD edge to glow). */
  selected: boolean;
  /** All virtual mirrors currently defined on the canvas. */
  mirrors: VirtualMirror[];
}

export function createMirror(
  x: number,
  name?: string,
  reflectedFrom?: string,
  glowColor?: string,
): VirtualMirror {
  return {
    id: `mirror-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    x,
    selected: true,
    name: name || `Mirror (X=${x.toFixed(1)})`,
    reflectedFrom,
    glowColor: glowColor || '#00f7ff',
  };
}

/**
 * Reflects one virtual mirror across another mirror's axis at axisX.
 * "A mirror can mirror another mirror!"
 */
export function reflectMirrorAcross(
  target: VirtualMirror,
  axisX: number,
  axisName = 'Axis',
): VirtualMirror {
  const reflectedX = 2 * axisX - target.x;
  return {
    id: `mirror-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    x: reflectedX,
    selected: true,
    name: `${target.name || 'Mirror'} reflected across ${axisName}`,
    reflectedFrom: target.id,
    glowColor: '#f43f5e', // Radiant rose/magenta glow for mirrors reflected by mirrors
  };
}

export const DEFAULT_VIRTUAL_MIRROR: VirtualMirrorState = {
  enabled: false,
  x: 0,
  selected: false,
  mirrors: [],
};
