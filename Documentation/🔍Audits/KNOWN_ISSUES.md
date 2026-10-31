# Known Issues — CAD.Like.audio

Each line was checked against the tree on 2026-10-30; say how it was checked when you add one.

## Open

| Issue | How it shows | Checked by |
|---|---|---|
| One 889 kB bundle | `vite build` warns "Some chunks are larger than 500 kB"; `dist/assets/index-*.js` is the whole app in one chunk, 232 kB gzipped. No code-splitting yet. | `npm run build` output |
| Two components are never mounted | `src/components/GridControls.tsx` and `src/components/UnitToggle.tsx` are not reachable from `src/main.tsx`; the `check-mount-reach` ceiling holds them at 2. Render or delete them, then lower the baseline. | `scripts/check-mount-reach.baseline.json` |
| Big Picture still falls back to the unversioned route | The client asks `/api/v1/big-picture` first and, on a 404, the legacy `/api/big-picture`. WEB.OsApi `server.py` serves only the legacy path today, so every open and save costs one 404 until it serves `/api/v1/` (handoff filed). Drop the fallback one release after it does. | `src/io/bigPicture/bigPictureApi.ts` `BIG_PICTURE_ENDPOINTS`; `server.py` route table |
| The smoke `web` check opens the source page | `.apk.scripts/smoke.py` takes the first of `index.html, dist/index.html` that exists, so it fetches the repo-root `index.html`, which loads `./src/main.tsx` and cannot run unbuilt. The launcher opens `dist/index.html` (`display.json` `entry`). Fixed in the root script, not here (handoff filed). | `.apk.scripts/smoke.ini` `entries`; `Documentation/🧩Manual and Artifacts/SMOKE.md` |
