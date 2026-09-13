# `can-cut.ca` — two saved pages, kept as provenance

These are **not** part of this application. They are two pages of somebody else's
website, saved to disk, kept because they are the reference this sketcher's first
screens were read against.

| File | What it is |
|---|---|
| `cad.htm` | `https://can-cut.ca/` — the marketing front page. A Next.js render, ~51 KB, including the site's own `google-site-verification` token and its Open Graph card. |
| `drawing board.html` | `https://can-cut.ca/` → *Draw Your Shape* — the editor page, ~83 KB, hand-written HTML with its palette inline in a `:root` block. |

**Captured** on or before 2026-08-24 (file mtimes); first appear in this repository
in `f5e69919`, 2026-08-26, the monorepo reorg checkpoint.

## Why they moved here

They sat at `Code/`, the **Vite root**, next to `index.html`. Three consequences, and
all three were live:

1. **Every count read them as first-party.** `Code/` measured 14 `aria-*` attributes
   and 13 of them were in `cad.htm` — so the accessibility number for a canvas
   application was, to within one attribute, a measurement of somebody else's
   marketing page. `.apk.scripts/check_aria_ratchet.py` works around it by scoping
   `kad` to `Code/src`; that workaround stays correct and is no longer load-bearing.
2. **A build configuration change could have shipped them.** Vite builds
   `index.html` alone today. Add a second entry — a `rollupOptions.input`, a
   multi-page config, a `publicDir` — and this app's domain starts serving another
   site's verification token.
3. **`grep` over `Code/` and `grep` over `Code/src/` gave different answers**, which
   is how the two numbers in the audit disagreed.

Under `reference/` they are outside the Vite root, outside `tsconfig.json`'s
`include`, and named in the repository root `.ignore` beside the other capture
trees — so ripgrep and fd de-rank them, exactly as CLAUDE.md §4 asks. Nothing here
is untracked; `.ignore` changes search, not git.

## What they are still good for

`src/styles/colorsStyle.ts` and `src/index.css` carry a palette that mirrors the
`:root` block in `drawing board.html`. When those two are reconciled — PLAN-111.02
step 3 — this is the third document in the argument, and deleting it would make the
question unanswerable. Read it; do not copy from it.

Third-party content, kept for reference. No claim of ownership is made and no part
of it is redistributed by this application's build.
