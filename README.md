# EDITORS.CAD.Like.audio

> ✏️ **Editors Cad Like Audio** — Design, CAD & Schematic Editors module for the  ecosystem.

---

## Hosting

Published by `.github/workflows/deploy.yml` on every push to `main`: to GitHub Pages, and over FTPS to the Varial host that serves https://cad.like.audio/ today.

**Live now:** https://likedotaudio.github.io/APK.softapp.EDITORS.CAD.Like.audio/

> **Note:** the custom domain `cad.like.audio` is switched off until its DNS is in place. GitHub redirects the github.io address to the custom domain as soon as one is set, so setting it before DNS resolves breaks the link above. To switch it on:
>
> 1. At the `like.audio` DNS host (Varial Hosting), add a CNAME `cad.like.audio` → `likedotaudio.github.io` (and remove the old A record pointing at the FTPS host).
> 2. Wait until `dig +short cad.like.audio` answers with GitHub's addresses.
> 3. Set the domain: `gh api -X PUT repos/LikeDotAudio/APK.softapp.EDITORS.CAD.Like.audio/pages -f cname=cad.like.audio`, then tick *Enforce HTTPS* in Settings → Pages once the certificate is issued.

---

## 🧩 Architectural Role
* **Family**: 
* **Category**: 
* **Pipeline Stage**: 

---

## ⚙️ Repository Overview
This repository is a modular, standalone component of the  Softapps suite. It operates as an independent Git repository integrated as a submodule under .

---

## 📤 DXF export & import

**File → Download DXF** writes an AutoCAD R2000 (`AC1015`) file that strict readers accept:

* **Every layer** in the LAYER table with its **name**, **colour** (ACI — a colour picked in the app goes out as the nearest index), **linetype**, **lineweight**, and whether it is **off** (hidden) or **locked**.
* **Every entity on its own layer** — lines, true arcs, circles, text, fills (HATCH), CAD block placements (INSERT) and the schematic's flow blocks and connectors.
* **Every linetype** a layer names is declared with its dash pattern — `DASHED`, `HIDDEN`, `CENTER`, `DASHDOT`, `PHANTOM`, `DOT`, `DIVIDE`, `BORDER` at acad.lin sizes (×25.4 on a mm sheet), and any other linetype that came in on an opened DXF with the pattern it came with.

**Open** reads the same things back: layers with colour, linetype, lineweight and off/frozen/locked state, and the entities on them. A file written by Export opens to the same layers — `npm test` checks that round trip.

Linetypes and lineweights arrive on a layer from an opened DXF; the app does not yet draw them on the canvas or offer a picker for them. See [Documentation/Notes/ARCHITECTURE_NOTES.md](Documentation/Notes/ARCHITECTURE_NOTES.md#dxf-in-and-out-srcioexportdxf-srcioimportdxf).

---

## 🚀 Usage & Integration
* **Web Portal Entry**:  / 
* **Remote Repository**: 
