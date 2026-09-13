// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * WHICH DOOR THIS IS (PLAN-60.07)
 *
 * `APK:OS/CAD/display.json` (06a · Big Picture) and `APK:OS/Drawing/display.json`
 * (07b · Drawing) both name this application. They were the SAME PAGE: two
 * tiles on the desktop, two windows, one identical document — 229 nodes, 546
 * characters, `CAD.LIKE.AUDIO — Draw Your Shape` in both — and neither tile
 * said the other opened the same thing.
 *
 * They are one application and they are two jobs, so this is the Scanalyzer
 * answer rather than deleting a tile: one bundle, a screen per entrance, named
 * in the fragment.
 *
 *     …/dist/index.html#/big-picture   the model — Flow blocks, ports, wires
 *     …/dist/index.html#/drawing       the sketch — lines, arcs, dimensions
 *
 * The fragment survives the trip because `server.py`'s `app_url()` and
 * `OS.webAppEntry` both split the spec at the first `?` or `#` and encode only
 * the path in front of it. Encoding the whole string is what once turned one
 * application into eight windows that all opened on tab one.
 *
 * An unknown fragment, or none, is the drawing board — the behaviour this app
 * had before there were two doors, so a bookmark from before still lands.
 */
export type Entrance = 'big-picture' | 'drawing';

export interface EntranceProfile {
  entrance: Entrance;
  /** The wordmark's second half, so a window says which door it came in by. */
  title: string;
  subtitle: string;
  /** Which tool the app opens holding. */
  initialTool: 'flow' | 'line';
  /** Whether the Flow catalogue is offered in the right rail. */
  showsFlowPanel: boolean;
  hint: string;
}

const PROFILES: Record<Entrance, EntranceProfile> = {
  'big-picture': {
    entrance: 'big-picture',
    title: 'BIG PICTURE',
    subtitle: '.LIKE.AUDIO',
    initialTool: 'flow',
    showsFlowPanel: true,
    hint: 'Big Picture: place a Flow block, then wire port to port · top is control, bottom is power, left in, right out',
  },
  drawing: {
    entrance: 'drawing',
    title: 'CAD',
    subtitle: '.LIKE.AUDIO',
    initialTool: 'line',
    showsFlowPanel: false,
    hint: 'True arcs: circles stay curved when cut · B = Break tool · Shift = ortho · Snap to endpoints/midpoints',
  },
};

/** Read the entrance out of a fragment such as `#/big-picture`. */
export function entranceFromHash(hash: string): Entrance {
  const name = hash.replace(/^#\/?/, '').split(/[?&]/)[0]?.toLowerCase() ?? '';
  return name === 'big-picture' || name === 'bigpicture' ? 'big-picture' : 'drawing';
}

export function entranceProfile(entrance: Entrance): EntranceProfile {
  return PROFILES[entrance];
}

/** The profile for the door this window was opened by. */
export function currentEntrance(): EntranceProfile {
  const hash = typeof window === 'undefined' ? '' : window.location.hash;
  return entranceProfile(entranceFromHash(hash));
}
