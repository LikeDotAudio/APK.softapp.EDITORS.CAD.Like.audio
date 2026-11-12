# Smoke test — EDITORS.CAD.Like.audio

Is `EDITORS.CAD.Like.audio` deployed? Written by `.apk.scripts/smoke.py` from the module's own shape; what each check means is in that script's header.

← [Wiki home](../README.md)

**❌ FAIL** — 5/6 checks, since 2026-11-12 00:16 EST

| Check | Target | Result | Detail |
|---|---|---|---|
| pushed | [APK.softapp.EDITORS.CAD.Like.audio](https://github.com/LikeDotAudio/APK.softapp.EDITORS.CAD.Like.audio.git) | ❌ | 1 commit(s) not pushed |
| web | [dist/index.html](https://apk.audio/APK%3ASoftapps/EDITORS/EDITORS.CAD.Like.audio/dist/index.html) | ✅ | HTTP 200 |
| app | `OS/CAD` → `PODS/POD.THIN/Softapps/EDITORS/EDITORS.CAD.Like.audio/dist/index.html` | ✅ | present |
| app | `OS/Design CAD` → `PODS/POD.THIN/Softapps/EDITORS/EDITORS.CAD.Like.audio/dist/index.html` | ✅ | present |
| app | `OS/Design Schematics` → `PODS/POD.THIN/Softapps/EDITORS/EDITORS.CAD.Like.audio/dist/index.html` | ✅ | present |
| app | `OS/Drawing` → `PODS/POD.THIN/Softapps/EDITORS/EDITORS.CAD.Like.audio/dist/index.html` | ✅ | present |

Re-run: `python3 .apk.scripts/smoke.py PODS/POD.THIN/Softapps/EDITORS/EDITORS.CAD.Like.audio`

<!-- smoke:sig 16e258812e74 since 2026-11-12 00:16 EST -->
