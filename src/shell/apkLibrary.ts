// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * THE ONE PICKER, FOR WHAT THE SASH DOES NOT DRAW (ROAD-3596). The 📚 Library sash embeds
 * the BIM library app itself; what a pick then asks of the BENCH — which boxes of this
 * part are on it, and the panel one presents (its default GUI) — comes from the same
 * script every editor loads, DATABASE.server.BIM's picker (window.APKLibrary:
 * liveDevices / defaultGuiFor / openDefaultGui). It replaces the old /api/bim/ui/picker.js
 * module the 🏗 BIM button imported. Loaded from the copy published with the OS, by its
 * root path (/APK%3AOS/…, :8080, the gateway, apk.audio), else apk.audio's; a page with
 * neither has no bench, and every answer is empty.
 */
import type { BimInstance } from '../flow/bimPart';

export const PICKER_URLS = ['/APK%3AOS/system/bim/library/picker.js',
  'https://apk.audio/APK%3AOS/system/bim/library/picker.js'];

export interface LiveDevice extends BimInstance { name?: string; panel?: (BimInstance['panel'] & { prefix?: string }) | null }
export interface ApkLibrary {
  liveDevices(partId: string, api?: string): Promise<LiveDevice[]>;
  defaultGuiFor(partId: string, api?: string): Promise<LiveDevice | null>;
  openDefaultGui(device: unknown, label?: string): boolean;
}

let loading: Promise<ApkLibrary> | null = null;

function loadScript(src: string): Promise<ApkLibrary> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = new URL(src, document.baseURI).href;
    s.async = true;
    s.onload = () => {
      const lib = (window as unknown as { APKLibrary?: ApkLibrary }).APKLibrary;
      if (lib && typeof lib.liveDevices === 'function') resolve(lib); else reject(new Error(`${src}: no APKLibrary.liveDevices`));
    };
    s.onerror = () => { s.remove(); reject(new Error(`${src} did not load`)); };
    document.head.append(s);
  });
}

/** window.APKLibrary, loading the picker the first time; rejects where there is none. */
export function loadApkLibrary(urls: readonly string[] = PICKER_URLS): Promise<ApkLibrary> {
  const have = (window as unknown as { APKLibrary?: ApkLibrary }).APKLibrary;
  if (have && typeof have.liveDevices === 'function') return Promise.resolve(have);
  loading ??= urls.reduce<Promise<ApkLibrary>>((p, url) => p.catch(() => loadScript(url)), Promise.reject(new Error('no picker')))
    .catch((err: unknown) => { loading = null; throw err; });
  return loading;
}
