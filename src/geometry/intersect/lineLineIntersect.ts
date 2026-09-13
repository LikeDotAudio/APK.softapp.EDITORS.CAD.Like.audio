// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { PARAM_EPS } from '../../core/constants';
import type { Point } from '../../core/types';

/** Intersection strictly interior to both entities (shared endpoints are ignored). */
export interface LineLineHit {
  /** Parameter along the first segment. */
  t: number;
  /** Parameter along the second segment. */
  s: number;
  x: number;
  y: number;
}

/** Where two segments cross, excluding touches at either segment's ends. */
export function lineLineIntersect(a1: Point, a2: Point, b1: Point, b2: Point): LineLineHit[] {
  const dax = a2.x - a1.x;
  const day = a2.y - a1.y;
  const dbx = b2.x - b1.x;
  const dby = b2.y - b1.y;
  const denom = dax * dby - day * dbx;
  if (Math.abs(denom) < 1e-12) return [];
  const t = ((b1.x - a1.x) * dby - (b1.y - a1.y) * dbx) / denom;
  const s = ((b1.x - a1.x) * day - (b1.y - a1.y) * dax) / denom;
  const e = PARAM_EPS;
  if (t <= e || t >= 1 - e || s <= e || s >= 1 - e) return [];
  return [{ t, s, x: a1.x + t * dax, y: a1.y + t * day }];
}
