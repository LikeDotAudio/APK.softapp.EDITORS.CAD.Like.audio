// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** Minor / major / super grid spacing, in both world units and screen pixels. */
export interface GridLevels {
  minorWorld: number;
  majorWorld: number;
  superWorld: number;
  minorScreen: number;
  majorScreen: number;
  superScreen: number;
}

/**
 * Pick grid spacing for the current zoom. The minor step is `gridSize * 10^k`,
 * with k raised until one step covers at least `minPx` on screen — that keeps
 * the grid readable instead of collapsing into a solid fill when zoomed out.
 */
export function getGridLevels(gridSize: number, zoom: number, minPx = 8): GridLevels {
  const baseStep = gridSize > 0 ? gridSize : 1;
  const screenStepBase = baseStep * zoom;

  let k = 0;
  if (screenStepBase < minPx) {
    k = Math.ceil(Math.log10(minPx / screenStepBase));
  }

  const minorWorld = baseStep * Math.pow(10, k);
  const majorWorld = minorWorld * 10;
  const superWorld = majorWorld * 10;

  return {
    minorWorld,
    majorWorld,
    superWorld,
    minorScreen: minorWorld * zoom,
    majorScreen: majorWorld * zoom,
    superScreen: superWorld * zoom,
  };
}
