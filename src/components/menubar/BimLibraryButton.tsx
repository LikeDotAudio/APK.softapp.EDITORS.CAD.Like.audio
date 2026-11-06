// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * 🏗 BIM — the device library in the CAD (ROAD-3509). Opens the shared picker
 * DATABASE.server.BIM serves (`/api/bim/ui/picker.js`); the chosen part becomes a
 * block definition and the Flow tool is armed to place it. When a device of that
 * model is on the bench and presents its own panel, that panel — its default GUI —
 * opens in the OS shell ("connected, discovered, known, a panel: go for it").
 * A host without the library (the published static site) shows no button.
 */
import { useEffect, useState } from 'react';
import { useStore } from '@state/useStore';
import { liveBoxesOf, partToDefinition, type BimInstance, type BimPart } from '../../flow/bimPart';

interface PickerModule {
  pickPart(opts: { title?: string }): Promise<BimPart | null>;
  defaultGuiFor(partId: string): Promise<{ name?: string; panel?: { prefix?: string } } | null>;
  liveDevices?(partId: string): Promise<BimInstance[]>;
  openDefaultGui(device: unknown, label?: string): boolean;
}

const PICKER_URL = '/api/bim/ui/picker.js';

export function BimLibraryButton() {
  const store = useStore();
  const [lib, setLib] = useState<PickerModule | null>(null);
  useEffect(() => {
    let live = true;
    import(/* @vite-ignore */ PICKER_URL).then((m: PickerModule) => { if (live) setLib(m); }).catch(() => { /* no library here */ });
    return () => { live = false; };
  }, []);
  if (!lib) return null;

  const pick = async () => {
    const part = await lib.pickPart({ title: 'Place a device from the BIM library' });
    if (!part) return;
    const def = partToDefinition(part);
    /* The boxes of this model on the bench now: each placement takes the next
       one, so a filed Big Picture names the real box (ROAD-3537). */
    const live = lib.liveDevices ? await lib.liveDevices(part.id).catch(() => []) : [];
    /* The library's online instances follow the boxes presenting a panel (ROAD-3549),
       so the OS's /api/os/devices fallback is gone (ROAD-3552). */
    const boxes = liveBoxesOf(live);
    const known = store.schematic.definitions.find((d) => d.id === def.id);
    if (known) known.liveBoxes = boxes;
    else store.schematic.definitions.push({ ...def, liveBoxes: boxes });
    store.setFlowDefinition(def.id);
    const device = await lib.defaultGuiFor(part.id);
    if (device) lib.openDefaultGui(device, device.name);
  };

  return (
    <button
      onClick={() => { void pick(); }}
      className="flex items-center gap-1.5 rounded bg-go px-2.5 py-1 text-xs font-semibold text-white hover:bg-go-hover transition-colors font-mono tracking-wide"
      title="Place any device from the BIM library (DATABASE.server.BIM); its own panel opens when it is on the bench"
    >
      <span>🏗</span>
      <span>BIM</span>
    </button>
  );
}
