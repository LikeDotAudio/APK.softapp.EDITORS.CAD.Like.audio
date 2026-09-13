// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * Values baked in at build time by `define` in vite.config.ts.
 *
 * The revision stamp is set when the bundle is compiled, not when the app runs,
 * so what you read in the status bar identifies the deployed build.
 */
declare const __BUILD_STAMP__: string;
declare const __REPO_URL__: string;

/** Revision stamp of this build: 12 hex of a SHA-256 over `src/` and the
 *  build's own inputs. Keyed to the sources rather than the clock, because
 *  `dist/` is tracked -- see the reasoning in vite.config.ts. */
export const BUILD_STAMP: string = __BUILD_STAMP__;

/** Where the source for this build lives. */
export const REPO_URL: string = __REPO_URL__;
