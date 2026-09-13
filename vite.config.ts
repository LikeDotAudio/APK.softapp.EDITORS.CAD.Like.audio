// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Revision stamp: a fingerprint of the sources this bundle was compiled from.
 *
 * It used to be the wall clock, `YYYYMMDD.HH.MM` at compile time, and `dist/`
 * is TRACKED here (.gitignore says why: APK:OS iframes it, so it has to be in
 * the checkout). So the stamp changed the bundle's bytes on every build, which
 * changed its content hash, which changed its FILENAME -- `check.sh kad` left
 * three tracked files dirty on every single run, and no two machines ever
 * produced the same output.
 *
 * The sibling fix in `SAMPLE and PLAY/build.mjs` takes the date of the last
 * COMMIT touching the sources instead. That is a fixed point there because its
 * `dist/` is GITIGNORED. It is not one here: a commit that carries `src/` and
 * the rebuilt `dist/` together moves the commit date AFTER the bundle was
 * written, so a fresh clone of that commit rebuilds to a different stamp and
 * the tree is dirty again -- one commit behind, forever.
 *
 * A hash over the source bytes is the only value that is a fixed point when
 * the output is committed beside the input. The same sources build the same
 * bytes on any machine, in any order, at any time.
 */
function buildStamp(): string {
  const roots = ['src', 'index.html', 'vite.config.ts', 'package.json'];
  const files: string[] = [];
  const walk = (p: string) => {
    if (statSync(p).isDirectory()) {
      for (const e of readdirSync(p).sort()) walk(path.join(p, e));
    } else {
      files.push(p);
    }
  };
  for (const r of roots) walk(r);
  const h = createHash('sha256');
  // Path as well as content: a rename with no edit is still a different build.
  for (const f of files) h.update(f).update(readFileSync(f));
  return h.digest('hex').slice(0, 12);
}
export default defineConfig({
  // Relative asset paths: the bundle is served from wherever it is dropped —
  // /repo/APK:Softapps/DXF/Code/dist/ inside the APK:OS shell, the folder
  // itself off a file:// path, the site root on a static host. An absolute
  // "/assets/..." only ever resolves in the last of those.
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 5173, open: false },
  define: {
    // Baked in by the build, so the running app can show which revision it is.
    __BUILD_STAMP__: JSON.stringify(buildStamp()),
    __REPO_URL__: JSON.stringify('https://github.com/LikeDotAudio/CAD.Like.audio'),
  },
});
