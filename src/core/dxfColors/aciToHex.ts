// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { ACI_COLOR_MAP } from './aciColorMap';

/** CSS colour for a DXF colour index, approximating anything outside the table. */
export function aciToHex(aci?: number): string {
  if (!aci || aci <= 0) return '#1e293b';
  if (ACI_COLOR_MAP[aci]) return ACI_COLOR_MAP[aci];

  // Rough approximation for full 255 ACI color wheel
  const hue = Math.floor(((aci % 10) * 36) % 360);
  return `hsl(${hue}, 80%, 45%)`;
}
