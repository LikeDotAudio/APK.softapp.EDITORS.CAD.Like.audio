// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Layer } from '../../../core/types';
import { useStore } from '@state/useStore';
import { DXF_LINEWEIGHTS, STANDARD_LINETYPES, standardLinetype } from '@io/exportDxf/dxfLinetypes';

export interface LayerStyleSelectProps {
  layer: Layer;
  disabled?: boolean;
  className: string;
}

/** A DXF lineweight (hundredths of a millimetre) as the picker shows it. */
export function lineweightLabel(weight: number): string {
  return `${(weight / 100).toFixed(2)} mm`;
}

/**
 * The linetypes this app declares by name, plus a name the layer brought in
 * from a file with its own pattern, so opening the picker never drops it.
 */
function linetypeChoices(layer: Layer): string[] {
  const own = layer.linetype?.trim();
  return own && !STANDARD_LINETYPES.includes(own.toUpperCase()) ? [...STANDARD_LINETYPES, own] : STANDARD_LINETYPES;
}

/** The layer's linetype, picked from the declared DXF linetypes. */
export function LinetypeSelect({ layer, disabled, className }: LayerStyleSelectProps) {
  const store = useStore();
  const current = layer.linetype?.trim();
  const value = !current ? 'CONTINUOUS' : STANDARD_LINETYPES.includes(current.toUpperCase()) ? current.toUpperCase() : current;
  return (
    <select
      disabled={disabled}
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => store.setLayerStyle(layer.id, { linetype: e.target.value })}
      title={`Linetype of everything on ${layer.name}: ${standardLinetype(value, 'in')?.description ?? value}`}
      className={className}
    >
      {linetypeChoices(layer).map((name) => (
        <option key={name} value={name} title={standardLinetype(name, 'in')?.description}>
          {name}
        </option>
      ))}
    </select>
  );
}

/** The layer's lineweight, picked from the DXF steps; "Default" leaves it to the reader. */
export function LineweightSelect({ layer, disabled, className }: LayerStyleSelectProps) {
  const store = useStore();
  const value = layer.lineweight === undefined ? '' : String(layer.lineweight);
  return (
    <select
      disabled={disabled}
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) =>
        store.setLayerStyle(layer.id, { lineweight: e.target.value === '' ? null : Number(e.target.value) })
      }
      title={`Lineweight of everything on ${layer.name}: ${layer.lineweight === undefined ? 'Default' : lineweightLabel(layer.lineweight)}`}
      className={className}
    >
      <option value="">Default</option>
      {(layer.lineweight === undefined || DXF_LINEWEIGHTS.includes(layer.lineweight)
        ? DXF_LINEWEIGHTS
        : [...DXF_LINEWEIGHTS, layer.lineweight].sort((a, b) => a - b)
      ).map((w) => (
        <option key={w} value={String(w)}>
          {lineweightLabel(w)}
        </option>
      ))}
    </select>
  );
}
