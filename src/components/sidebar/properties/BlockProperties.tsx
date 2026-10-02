// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useState } from 'react';
import type { CadBlockInstance } from '../../../core/types';
import { useStore } from '../../../state/useStore';
import { useUi } from '../../../state/useUi';

interface BlockPropertiesProps {
  instance: CadBlockInstance;
}

export function BlockProperties({ instance }: BlockPropertiesProps) {
  const store = useStore();
  const { layers } = useUi();
  const [copied, setCopied] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  const handleCopyUuid = async () => {
    try {
      await navigator.clipboard.writeText(instance.uuid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      store.showHint('Copied Block UUID to clipboard.', 2000);
    } catch {
      // fallback
    }
  };

  const handleUpdate = (mutator: (inst: CadBlockInstance) => void) => {
    store.history.push(store.doc.snapshot());
    store.edit(() => {
      const live = store.doc.blockInstances.get(instance.id);
      if (live) {
        mutator(live);
      }
      return true;
    });
  };

  const handleAddAttribute = () => {
    const k = newKey.trim();
    if (!k) return;
    handleUpdate((inst) => {
      inst.attributes = { ...(inst.attributes ?? {}), [k]: newVal.trim() };
    });
    setNewKey('');
    setNewVal('');
  };

  const handleDeleteAttribute = (key: string) => {
    handleUpdate((inst) => {
      if (inst.attributes) {
        const next = { ...inst.attributes };
        delete next[key];
        inst.attributes = next;
      }
    });
  };

  const handleAttrChange = (key: string, value: string) => {
    handleUpdate((inst) => {
      inst.attributes = { ...(inst.attributes ?? {}), [key]: value };
    });
  };

  const attributes = Object.entries(instance.attributes ?? {});

  return (
    <div className="space-y-3 rounded border border-[#38bdf8]/40 bg-[#16202c] p-2.5 text-xs text-[#cccccc]">
      <div className="flex items-center justify-between border-b border-[#38bdf8]/20 pb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🧱</span>
          <span className="font-semibold text-white">CAD Block Instance</span>
        </div>
        <span className="font-mono text-[11px] font-bold text-[#f4902c]">{instance.blockName}</span>
      </div>

      {/* UUID */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-[#38bdf8]">
          Block UUID
        </label>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            readOnly
            value={instance.uuid}
            title={instance.uuid}
            className="flex-1 rounded border border-[#3c3c3c] bg-[#141414] px-2 py-1 font-mono text-[10px] text-[#93c5fd] select-all"
          />
          <button
            onClick={handleCopyUuid}
            className="rounded bg-[#0e639c] px-2 py-1 text-[10px] font-semibold text-white hover:bg-[#1177bb] transition-colors"
            title="Copy UUID to clipboard"
          >
            {copied ? '✓' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Transforms (X, Y, Scale, Rotation) */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <label className="text-[10px] text-[#888]">Position X</label>
          <input
            type="number"
            step="0.5"
            value={instance.x}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              handleUpdate((inst) => (inst.x = val));
            }}
            className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 text-white"
          />
        </div>
        <div>
          <label className="text-[10px] text-[#888]">Position Y</label>
          <input
            type="number"
            step="0.5"
            value={instance.y}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              handleUpdate((inst) => (inst.y = val));
            }}
            className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 text-white"
          />
        </div>
        <div>
          <label className="text-[10px] text-[#888]">Scale</label>
          <input
            type="number"
            step="0.1"
            value={instance.scale}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 1;
              handleUpdate((inst) => (inst.scale = val));
            }}
            className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 text-white"
          />
        </div>
        <div>
          <label className="text-[10px] text-[#888]">Rotation (°)</label>
          <input
            type="number"
            step="15"
            value={instance.rotation}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              handleUpdate((inst) => (inst.rotation = val));
            }}
            className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 text-white"
          />
        </div>
      </div>

      {/* Layer */}
      <div>
        <label className="text-[10px] text-[#888]">Layer</label>
        <select
          value={instance.layerId}
          onChange={(e) => {
            const val = e.target.value;
            handleUpdate((inst) => (inst.layerId = val));
          }}
          className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-2 py-0.5 text-white text-xs"
        >
          {Array.from(layers.values()).map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Attributes */}
      <div className="space-y-1.5 border-t border-[#333] pt-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#38bdf8]">
            Attributes ({attributes.length})
          </label>
        </div>

        {attributes.length > 0 ? (
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {attributes.map(([k, v]) => (
              <div key={k} className="flex items-center gap-1 text-[11px]">
                <span className="w-20 truncate font-mono text-[10px] text-[#aaa]" title={k}>
                  {k}:
                </span>
                <input
                  type="text"
                  value={v}
                  onChange={(e) => handleAttrChange(k, e.target.value)}
                  className="flex-1 rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 text-white text-[11px]"
                />
                <button
                  onClick={() => handleDeleteAttribute(k)}
                  className="text-red-400 hover:text-red-200 px-1"
                  title="Remove attribute"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-[#666] italic">No custom attributes assigned.</p>
        )}

        {/* Add new attribute */}
        <div className="flex items-center gap-1 pt-1">
          <input
            type="text"
            placeholder="Key (e.g. Tag)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="w-20 rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 text-[10px] text-white"
          />
          <input
            type="text"
            placeholder="Value"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            className="flex-1 rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5 text-[10px] text-white"
          />
          <button
            onClick={handleAddAttribute}
            disabled={!newKey.trim()}
            className="rounded bg-[#0e639c] px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-[#1177bb] disabled:opacity-40"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Block Actions */}
      <div className="flex items-center gap-2 border-t border-[#333] pt-2">
        <button
          onClick={() => store.triggerOpenBlockEditor(instance.blockName)}
          className="flex-1 rounded bg-[#2ea043] py-1 text-center font-semibold text-white hover:bg-[#3fb950] transition-colors"
        >
          🧱 Edit Definition
        </button>
        <button
          onClick={() => {
            store.history.push(store.doc.snapshot());
            store.edit(() => store.doc.explodeBlockInstance(instance.id));
            store.showHint(`Exploded block instance #${instance.id}.`, 2000);
          }}
          className="rounded border border-[#444] bg-[#2a2a2a] px-2 py-1 text-white hover:bg-[#383838] transition-colors"
          title="Explode into editable lines and arcs"
        >
          💥 Explode
        </button>
      </div>
    </div>
  );
}
