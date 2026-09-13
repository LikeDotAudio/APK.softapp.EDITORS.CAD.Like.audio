// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { STANDARD_DXF_COLORS } from '../../../core/dxfColors/standardDxfColors';
import { useStore } from '../../../state/useStore';

export interface LayerColorSwatchProps {
  layerId: string;
  color: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  onPicked: () => void;
}

/** Colour button plus its popup palette of standard DXF colours. */
export function LayerColorSwatch({ layerId, color, title, open, onToggle, onPicked }: LayerColorSwatchProps) {
  const store = useStore();

  return (
    <div className="relative ml-2 flex flex-shrink-0 items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="h-3.5 w-3.5 flex-shrink-0 rounded-sm border border-[#555] transition-transform hover:scale-110"
        style={{ backgroundColor: color }}
        title={title}
      />

      {open && (
        <div
          className="absolute right-0 top-5 z-50 grid w-36 grid-cols-5 gap-1.5 rounded border border-[#454545] bg-[#252526] p-2 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {STANDARD_DXF_COLORS.map((c) => (
            <button
              key={c.aci}
              type="button"
              onClick={() => {
                store.setLayerColor(layerId, c.hex);
                onPicked();
              }}
              className="h-5 w-5 rounded border border-[#444] transition-transform hover:scale-110"
              style={{ backgroundColor: c.hex }}
              title={`${c.name} (ACI ${c.aci})`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
