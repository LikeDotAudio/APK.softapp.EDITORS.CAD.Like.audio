// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useState } from 'react';
import { useStore } from '../../../state/useStore';

/** Inline "new layer" field under the layer toolbar. */
export function AddLayerForm() {
  const store = useStore();
  const [name, setName] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        store.addLayer(name.trim());
        setName('');
      }}
      className="flex gap-1 border-b border-[#333] bg-[#252526] p-1.5"
    >
      <input
        type="text"
        placeholder="Layer name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-0.5 text-[11px] text-white focus:border-[#f4902c] focus:outline-none"
      />
      <button
        type="submit"
        disabled={!name.trim()}
        className="rounded bg-[#f4902c] px-2 py-0.5 text-[11px] text-white hover:bg-[#ffa552] disabled:opacity-40"
      >
        +
      </button>
    </form>
  );
}
