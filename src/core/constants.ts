// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
export const TAU = Math.PI * 2;

/** Vertex-merge / zero-length tolerance, in world units. */
export const EPS = 1e-5;

/** Parametric tolerance used when rejecting intersections at segment ends. */
export const PARAM_EPS = 1e-4;

/** Hit-test radius in screen pixels. */
export const HIT_PX = 7;

/** Snap search radius in screen pixels. */
export const SNAP_PX = 10;

export const MIN_ZOOM = 0.0001;
export const MAX_ZOOM = 500000;

/** Screen-pixel radius for "clicked the first polyline point again". */
export const CLOSE_LOOP_PX = 14;

export const MAX_HISTORY = 60;
