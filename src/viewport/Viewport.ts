// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { MAX_ZOOM } from '../core/constants';
import { MIN_ZOOM } from '../core/constants';
import { clamp } from '../core/clamp';
import type { Point } from '../core/types';

/**
 * World ↔ screen mapping. World Y points up (CAD convention), screen Y points
 * down, so the transform flips Y.
 */
export class Viewport {
  /** Screen pixels per world unit. */
  zoom = 80;
  panX = 0;
  panY = 0;
  width = 0;
  height = 0;

  toScreen(wx: number, wy: number): Point {
    return { x: wx * this.zoom + this.panX, y: -wy * this.zoom + this.panY };
  }

  toWorld(sx: number, sy: number): Point {
    return { x: (sx - this.panX) / this.zoom, y: -(sy - this.panY) / this.zoom };
  }

  /** Zoom about a screen point, keeping the world point under it fixed. */
  zoomAt(sx: number, sy: number, factor: number): void {
    const wx = (sx - this.panX) / this.zoom;
    const wy = -(sy - this.panY) / this.zoom;
    this.zoom = clamp(this.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    this.panX = sx - wx * this.zoom;
    this.panY = sy + wy * this.zoom;
  }

  /** Rescale the view when the drawing itself is rescaled (unit switch). */
  scaleBy(f: number): void {
    this.zoom = clamp(this.zoom / f, MIN_ZOOM, MAX_ZOOM);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (!this.panX && !this.panY) {
      this.panX = width / 2;
      this.panY = height / 2;
    }
  }

  /** Convert a screen-pixel distance to world units at the current zoom. */
  pxToWorld(px: number): number {
    return px / this.zoom;
  }

  zoomToFit(bbox: { x1: number; y1: number; x2: number; y2: number } | null): void {
    if (!bbox || !this.width || !this.height) return;
    const bw = bbox.x2 - bbox.x1;
    const bh = bbox.y2 - bbox.y1;
    if (bw <= 0 || bh <= 0) return;

    const margin = 0.8;
    const zx = (this.width * margin) / bw;
    const zy = (this.height * margin) / bh;
    this.zoom = clamp(Math.min(zx, zy), MIN_ZOOM, MAX_ZOOM);

    const cx = (bbox.x1 + bbox.x2) / 2;
    const cy = (bbox.y1 + bbox.y2) / 2;
    this.panX = this.width / 2 - cx * this.zoom;
    this.panY = this.height / 2 + cy * this.zoom;
  }
}
