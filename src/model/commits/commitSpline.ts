// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';
import { sampleSpline } from '../../geometry/spline/sampleSpline';
import type { Doc } from '../Doc';
import { commitPolyline } from './commitPolyline';

/** Smooth curve, flattened to a polyline before it enters the document. */
export function commitSpline(doc: Doc, pts: Point[], closed: boolean, samples = 24, layerId = '0'): boolean {
  if (pts.length < 2) return false;
  return commitPolyline(doc, sampleSpline(pts, closed, samples), closed, layerId);
}
