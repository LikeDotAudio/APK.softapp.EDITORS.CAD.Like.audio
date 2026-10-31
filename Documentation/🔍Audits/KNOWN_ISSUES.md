# Known Issues — CAD.Like.audio

Each line was checked against the tree on 2026-10-30; say how it was checked when you add one.

## Open

| Issue | How it shows | Checked by |
|---|---|---|
| One 889 kB bundle | `vite build` warns "Some chunks are larger than 500 kB"; `dist/assets/index-*.js` is the whole app in one chunk, 232 kB gzipped. No code-splitting yet. | `npm run build` output |
| Two components are never mounted | `src/components/GridControls.tsx` and `src/components/UnitToggle.tsx` are not reachable from `src/main.tsx`; the `check-mount-reach` ceiling holds them at 2. Render or delete them, then lower the baseline. | `scripts/check-mount-reach.baseline.json` |
| Big Picture keeps a legacy fallback for one release | The client asks `/api/v1/big-picture` (served by WEB.OsApi since 2026-10-30, `osapi/routes_documents.py`) and falls back to `/api/big-picture` only on a 404. Remove `'/api/big-picture'` from `BIG_PICTURE_ENDPOINTS` in the next release. | `src/io/bigPicture/bigPictureApi.ts`; OsApi `http_routes_test.py` runs `contract/big-picture@1/samples.json` |
