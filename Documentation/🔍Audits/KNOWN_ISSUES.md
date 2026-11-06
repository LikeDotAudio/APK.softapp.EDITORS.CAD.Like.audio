# Known Issues — CAD.Like.audio

Each line was checked against the tree on 2026-10-30; say how it was checked when you add one.

## Open

| Issue | How it shows | Checked by |
|---|---|---|
| One 889 kB bundle | `vite build` warns "Some chunks are larger than 500 kB"; `dist/assets/index-*.js` is the whole app in one chunk, 232 kB gzipped. No code-splitting yet. | `npm run build` output |
| Two components are never mounted | `src/components/GridControls.tsx` and `src/components/UnitToggle.tsx` are not reachable from `src/main.tsx`; the `check-mount-reach` ceiling holds them at 2. Render or delete them, then lower the baseline. | `scripts/check-mount-reach.baseline.json` |
| Big Picture still reads big-picture@1 for one release | Since big-picture@2 (2026-11-06) the sheet is filed as IFC on `/api/v2/big-picture`; the client reads `/api/v1/big-picture` only when no IFC is filed, so a sheet filed as JSON opens and is filed again as IFC. On 2027-01-01 remove `V1_ENDPOINT` and `legacySheet` here, `contract/big-picture@1/`, and the server's v1 routes (WEB.OsApi `BIG_PICTURE_V1_REMOVAL`). | `src/io/bigPicture/bigPictureApi.ts`; OsApi `osapi/big_picture.py`, `http_routes_test.py` |
