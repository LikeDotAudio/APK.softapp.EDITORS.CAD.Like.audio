// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { DxfEntity } from './DxfParseResult';

export function parseEntity(
  type: string,
  getNextPair: () => { code: number; value: string } | null,
): { entity: DxfEntity; lastPair: { code: number; value: string } | null } {
  const entity: DxfEntity = { type };
  const lwPoints: { x: number; y: number; bulge?: number }[] = [];
  let currentLwPoint: { x: number; y: number; bulge?: number } | null = null;
  let lastPair: { code: number; value: string } | null = null;

  while (true) {
    const pair = getNextPair();
    if (!pair) break;
    const { code, value } = pair;

    if (code === 0) {
      lastPair = pair;
      break;
    }

    const numVal = parseFloat(value);

    if (code === 8) {
      entity.layer = value;
    }

    if (type === 'LINE') {
      if (code === 10) entity.x1 = numVal;
      else if (code === 20) entity.y1 = numVal;
      else if (code === 11) entity.x2 = numVal;
      else if (code === 21) entity.y2 = numVal;
    } else if (type === 'CIRCLE') {
      if (code === 10) entity.cx = numVal;
      else if (code === 20) entity.cy = numVal;
      else if (code === 40) entity.r = numVal;
    } else if (type === 'ARC') {
      if (code === 10) entity.cx = numVal;
      else if (code === 20) entity.cy = numVal;
      else if (code === 40) entity.r = numVal;
      else if (code === 50) entity.startAngle = numVal;
      else if (code === 51) entity.endAngle = numVal;
    } else if (type === 'LWPOLYLINE' || type === 'HATCH') {
      if (code === 70) {
        const flag = parseInt(value, 10);
        entity.isClosed = (flag & 1) === 1;
      } else if (code === 10) {
        if (currentLwPoint) lwPoints.push(currentLwPoint);
        currentLwPoint = { x: numVal, y: 0 };
      } else if (code === 20 && currentLwPoint) {
        currentLwPoint.y = numVal;
      } else if (code === 42 && currentLwPoint) {
        currentLwPoint.bulge = numVal;
      }
    } else if (type === 'TEXT' || type === 'MTEXT') {
      if (code === 10) entity.x1 = numVal;
      else if (code === 20) entity.y1 = numVal;
      else if (code === 11) entity.x2 = numVal;
      else if (code === 21) entity.y2 = numVal;
      else if (code === 40) entity.textHeight = numVal;
      else if (code === 1) entity.text = value;
      else if (code === 50) entity.rotation = numVal;
      else if (code === 72) entity.hAlign = parseInt(value, 10);
      else if (code === 73) entity.vAlign = parseInt(value, 10);
    } else if (type === 'SOLID') {
      if (code === 10) entity.x1 = numVal;
      else if (code === 20) entity.y1 = numVal;
      else if (code === 11) entity.x2 = numVal;
      else if (code === 21) entity.y2 = numVal;
      else if (code === 12) entity.x3 = numVal;
      else if (code === 22) entity.y3 = numVal;
      else if (code === 13) entity.x4 = numVal;
      else if (code === 23) entity.y4 = numVal;
    } else if (type === 'INSERT') {
      if (code === 2) entity.blockName = value;
      else if (code === 10) entity.x1 = numVal;
      else if (code === 20) entity.y1 = numVal;
      else if (code === 41) entity.scaleX = numVal;
      else if (code === 42) entity.scaleY = numVal;
      else if (code === 50) entity.rotation = numVal;
    }
  }

  if (type === 'LWPOLYLINE' || type === 'HATCH') {
    if (currentLwPoint) lwPoints.push(currentLwPoint);
    entity.points = lwPoints;
  }

  return { entity, lastPair };
}
