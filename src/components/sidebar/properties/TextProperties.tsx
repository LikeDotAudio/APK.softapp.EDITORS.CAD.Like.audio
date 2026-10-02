// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { TextEntity, TextHAlign, TextVAlign } from '../../../core/types';
import { useStore } from '../../../state/useStore';
import { useUi } from '../../../state/useUi';

interface TextPropertiesProps {
  textEntity: TextEntity;
}

/**
 * Dedicated sidebar inspector for selected Text annotations.
 * Provides full controls to position (X, Y), format, rotate, and align text:
 * - Centering (Horizontal & Vertical)
 * - Bottom alignment / Baseline alignment
 * - Exact position controls with nudge buttons
 * - 9-point visual anchor matrix
 */
export function TextProperties({ textEntity }: TextPropertiesProps) {
  const store = useStore();
  const { layers } = useUi();

  const handleUpdate = (mutator: (t: TextEntity) => void) => {
    store.history.push(store.doc.snapshot());
    store.edit(() => {
      const live = store.doc.texts.get(textEntity.id);
      if (live) {
        mutator(live);
      }
      return true;
    });
  };

  const handleDelete = () => {
    store.history.push(store.doc.snapshot());
    store.edit(() => {
      store.doc.removeText(textEntity.id);
      return true;
    });
    store.selection.delete(textEntity.id);
    store.showHint(`Deleted text "${textEntity.text}".`, 2000);
  };

  const handleDuplicate = () => {
    let newId: number | null = null;
    store.history.push(store.doc.snapshot());
    store.edit(() => {
      newId = store.doc.addText(
        textEntity.text,
        textEntity.x + 0.5,
        textEntity.y + 0.5,
        textEntity.height,
        textEntity.rotation ?? 0,
        textEntity.layerId,
        textEntity.color,
        textEntity.align,
        textEntity.vAlign,
      );
      return true;
    });
    if (newId !== null) {
      store.selection.clear();
      store.selection.add(newId);
      store.showHint('Duplicated text note.', 2000);
    }
  };

  const currentHAlign: TextHAlign = textEntity.align ?? 'left';
  const currentVAlign: TextVAlign = textEntity.vAlign ?? 'bottom';

  const setAlignBoth = (h: TextHAlign, v: TextVAlign) => {
    handleUpdate((t) => {
      t.align = h;
      t.vAlign = v;
    });
  };

  return (
    <div className="space-y-2.5 rounded border border-[#0e639c]/50 bg-[#1e1e1e] p-2.5 shadow-sm">
      {/* Title & Actions */}
      <div className="flex items-center justify-between border-b border-[#333] pb-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-white">
          <span>📝</span>
          <span>Text Annotation</span>
          <span className="text-[10px] text-[#888]">#{textEntity.id}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDuplicate}
            className="rounded bg-[#2a2a2a] px-1.5 py-0.5 text-[10px] text-[#aaa] hover:bg-[#333] hover:text-white transition-colors"
            title="Duplicate text annotation"
          >
            📋 Copy
          </button>
          <button
            onClick={handleDelete}
            className="rounded bg-[#ff5555]/20 px-1.5 py-0.5 text-[10px] text-[#ff8888] hover:bg-[#ff5555]/40 hover:text-white transition-colors"
            title="Delete text annotation"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Text Content */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-[#aaa]">
          Text Content:
        </label>
        <textarea
          rows={2}
          value={textEntity.text}
          onChange={(e) => {
            const val = e.target.value;
            handleUpdate((t) => {
              t.text = val;
            });
          }}
          className="w-full rounded border border-[#3c3c3c] bg-[#141414] p-1.5 text-xs text-white focus:border-[#0e639c] focus:outline-none resize-y"
          placeholder="Enter text..."
        />
      </div>

      {/* Position Coordinates (X, Y) with Nudge Controls */}
      <div className="rounded border border-[#2d2d2d] bg-[#181818] p-2 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#38bdf8]">
          <span>Position (World Coordinates)</span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handleUpdate((t) => { t.x -= 0.1; })}
              className="rounded bg-[#252526] px-1 py-0.5 text-[10px] text-[#aaa] hover:text-white"
              title="Nudge Left -0.1"
            >
              ←
            </button>
            <button
              onClick={() => handleUpdate((t) => { t.x += 0.1; })}
              className="rounded bg-[#252526] px-1 py-0.5 text-[10px] text-[#aaa] hover:text-white"
              title="Nudge Right +0.1"
            >
              →
            </button>
            <button
              onClick={() => handleUpdate((t) => { t.y += 0.1; })}
              className="rounded bg-[#252526] px-1 py-0.5 text-[10px] text-[#aaa] hover:text-white"
              title="Nudge Up +0.1"
            >
              ↑
            </button>
            <button
              onClick={() => handleUpdate((t) => { t.y -= 0.1; })}
              className="rounded bg-[#252526] px-1 py-0.5 text-[10px] text-[#aaa] hover:text-white"
              title="Nudge Down -0.1"
            >
              ↓
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-[#888]">X Position:</label>
            <input
              type="number"
              step="0.05"
              value={Number(textEntity.x.toFixed(3))}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) handleUpdate((t) => { t.x = val; });
              }}
              className="w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 text-xs text-white font-mono focus:border-[#0e639c] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#888]">Y Position:</label>
            <input
              type="number"
              step="0.05"
              value={Number(textEntity.y.toFixed(3))}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) handleUpdate((t) => { t.y = val; });
              }}
              className="w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 text-xs text-white font-mono focus:border-[#0e639c] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Alignment Section (Horizontal & Vertical / Centering / Bottom Alignment) */}
      <div className="rounded border border-[#2d2d2d] bg-[#181818] p-2 space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#f4902c]">
          Text Alignment & Centering
        </div>

        {/* 9-Point Visual Anchor Preset Grid */}
        <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-2">
          <span className="text-[10px] text-[#888]">Anchor Point:</span>
          <div className="grid grid-cols-3 gap-1 bg-[#141414] p-1 rounded border border-[#333]">
            {([
              ['left', 'top', 'TL'],
              ['center', 'top', 'TC'],
              ['right', 'top', 'TR'],
              ['left', 'middle', 'ML'],
              ['center', 'middle', 'MC'],
              ['right', 'middle', 'MR'],
              ['left', 'bottom', 'BL'],
              ['center', 'bottom', 'BC'],
              ['right', 'bottom', 'BR'],
            ] as const).map(([h, v, label]) => {
              const active = currentHAlign === h && currentVAlign === v;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setAlignBoth(h, v)}
                  title={`${v} ${h} (${label === 'MC' ? 'Full Center' : label === 'BC' ? 'Bottom Center' : label})`}
                  className={`w-6 h-5 rounded text-[9px] font-mono font-bold transition-colors ${
                    active
                      ? 'bg-[#f4902c] text-black shadow-sm'
                      : 'bg-[#252526] text-[#888] hover:bg-[#333] hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Horizontal Alignment */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#888]">Horizontal:</span>
          <div className="flex rounded border border-[#333] overflow-hidden">
            {(['left', 'center', 'right'] as const).map((al) => (
              <button
                key={al}
                type="button"
                onClick={() => handleUpdate((t) => { t.align = al; })}
                className={`px-2 py-0.5 text-[10px] capitalize transition-colors ${
                  currentHAlign === al
                    ? 'bg-[#0e639c] text-white font-semibold'
                    : 'bg-[#252526] text-[#888] hover:bg-[#333] hover:text-white'
                }`}
              >
                {al}
              </button>
            ))}
          </div>
        </div>

        {/* Vertical Alignment */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#888]">Vertical:</span>
          <div className="flex rounded border border-[#333] overflow-hidden">
            {(['top', 'middle', 'baseline', 'bottom'] as const).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleUpdate((t) => { t.vAlign = val; })}
                className={`px-1.5 py-0.5 text-[10px] capitalize transition-colors ${
                  currentVAlign === val
                    ? 'bg-[#0e639c] text-white font-semibold'
                    : 'bg-[#252526] text-[#888] hover:bg-[#333] hover:text-white'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Height and Rotation */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-[#888]">Height (Size):</label>
          <input
            type="number"
            step="0.05"
            min="0.01"
            value={Number(textEntity.height.toFixed(3))}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) handleUpdate((t) => { t.height = val; });
            }}
            className="w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 text-xs text-white font-mono focus:border-[#0e639c] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] text-[#888]">Rotation (°):</label>
          <input
            type="number"
            step="15"
            value={textEntity.rotation ?? 0}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) handleUpdate((t) => { t.rotation = val; });
            }}
            className="w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 text-xs text-white font-mono focus:border-[#0e639c] focus:outline-none"
          />
        </div>
      </div>

      {/* Quick Rotation Buttons */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-[#888]">Quick Rot:</span>
        {[0, 90, 180, 270].map((deg) => (
          <button
            key={deg}
            onClick={() => handleUpdate((t) => { t.rotation = deg; })}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
              (textEntity.rotation ?? 0) === deg
                ? 'bg-[#0e639c] text-white font-semibold'
                : 'bg-[#252526] text-[#888] hover:text-white'
            }`}
          >
            {deg}°
          </button>
        ))}
      </div>

      {/* Layer Selection */}
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-[#888]">Layer:</label>
        <select
          value={textEntity.layerId}
          onChange={(e) => {
            const val = e.target.value;
            handleUpdate((t) => {
              t.layerId = val;
            });
          }}
          className="rounded border border-[#3c3c3c] bg-[#141414] px-2 py-0.5 text-xs text-white focus:border-[#0e639c] focus:outline-none"
        >
          {layers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
