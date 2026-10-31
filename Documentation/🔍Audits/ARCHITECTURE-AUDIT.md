# 🔍 Architecture audit — EDITORS.CAD.Like.audio (2026-10-30)

Audited against the APK.audio multi-repo architecture standard: coupling, boundaries, duplication, contracts.
← [Audits](INDEX.md) · Improvements: [🛣Roadmap/IMPROVEMENTS.md](../%F0%9F%9B%A3Roadmap/IMPROVEMENTS.md)

## Bounded context
The 2D CAD sketcher and the system schematic ("Big Picture"): drawing model (vertices + line/true-arc edges, layers, blocks), DXF import/export, the Flow schematic with typed ports, and the `cad.like.audio/host@1` iframe bridge other softapps build on. Vite + React 19 + TypeScript + Tailwind 4, Canvas 2D; ~800 tracked files, ~48.7k lines under `src/`. `dist/` is committed (APK:OS iframes it).

**Sampled:** `package.json`, `vite.config.ts`, `.github/workflows/deploy.yml`, `display.json`, `src/shell/hostBridge/hostBridge.ts`, `src/io/bigPicture/bigPictureApi.ts`, `src/flow/catalog.ts`, `src/io/exportDxf/DxfDocument.ts`, `scripts/verifyFlow.ts`, `scripts/check-*.mjs` and their baselines, the 18 test files (ran `npx vitest run`: 18 files, 159 tests, all pass), relative-import depth across `src/`, the wiki's ARCHITECTURE/SMOKE/KNOWN_ISSUES pages. The 107 files in `src/state/actions/` and the connector catalogue under `src/connectors/` were surveyed by listing, not read line by line.

**Remediated 2026-10-30:** every item delivered — see [🌍Publishing/DELIVERY.md](../%F0%9F%8C%8DPublishing/DELIVERY.md#delivered-from-the-2026-10-30-audit).

## Context map
| Talks to | How (topic / endpoint / file / import) | Relationship |
|---|---|---|
| EDITORS.Acoustic.Like.audio (host softapp) | same-origin `postMessage`, protocol `cad.like.audio/host@1`, published as `contract/host@1/` (schema + samples); the host vendors it and tests against it | Supplier — Published Language |
| WEB.OsApi `server.py` | `GET`/`POST /api/v1/big-picture` (legacy `/api/big-picture` on 404, one release), digest + 409 on stale write; shapes in `contract/big-picture@1/` | Customer–Supplier (CAD is the customer) |
| APK:OS `OS/Interfaces/APK-Shop/Interfaces.json` | vendored as `scripts/fixtures/Interfaces.json` (the only file `verifyFlow.ts` reads); drift checked by `scripts/check-interfaces.mjs` | Conformist (vendored copy with drift gate) |
| monorepo `contracts/tokens/brand.json` | vendored to `src/tokens/brand.json`, drift checked by `scripts/check-brand-tokens.mjs` | Shared Kernel (vendored copy) |
| APK:OS launcher / OsApi walker | `display.json` (`entry: dist/index.html`); `OS/Design Schematics/display.json` frames `#/big-picture` | Conformist |
| cad.like.audio / GitHub Pages | `.github/workflows/deploy.yml` (test → build → Pages + FTPS) | Supplier of a public site |

## Scorecard
| Category | Score (0–3) | Finding |
|---|---|---|
| Coupling & Cohesion | 3 | No runtime imports leave the repo; the build reads only its own vendored copies, each with a drift gate. `components/` reaches `state/` and `io/` through the declared `@state` / `@io` surfaces. |
| Boundary Integrity | 3 | Only React is a runtime dependency. DXF, IndexedDB, the host bridge and the server API each sit behind their own module, and both wire formats are published DTOs (`contract/`). |
| Duplication Control | 3 | Brand tokens, the Interfaces table and the host contract are vendored copies with drift gates; the TS DXF writer is the suite's only emitter. |
| Testing & Contracts | 3 | 175 vitest cases including contract tests for `host@1` (both directions, real emitters) and `big-picture@1`; the Acoustic host and WEB.OsApi run the same samples; the smoke `web` check opens `dist/index.html`. |
| Change management | 3 | Both contracts are versioned with a written `@1` → `@2` rule and `package.json` is bumped with contract changes (1.1.0). No git tags (publishing tags is the owner's call). |
Score key: 3 meets the standard · 2 minor gaps · 1 significant gaps · 0 absent / violated.

## Findings
1. **Good: a versioned, origin-checked host bridge.** `HOST_PROTOCOL = 'cad.like.audio/host@1'` (`src/shell/hostBridge/hostBridge.ts`). Every post goes to `window.location.origin`, and incoming messages are dropped unless both `e.source` and `e.origin` match. The protocol is now published as `contract/host@1/` and held to it by `hostContract.test.ts`.
2. **Good: the vendored brand tokens have a drift gate.** `scripts/check-brand-tokens.mjs` fails a monorepo build when `src/tokens/brand.json` drifts from `contracts/tokens/brand.json`; `scripts/check-interfaces.mjs` now does the same for the Interfaces table.
3. **Good: tests and gates run on every change.** `deploy.yml` runs `npm test`, then `npm run build`, which runs `tsc`, `verify` and `gates` (`package.json` `scripts.build`), before deploying.
