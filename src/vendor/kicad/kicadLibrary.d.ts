// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/* Types for the vendored kicadLibrary.js (a byte copy of DATATYPE.KiCad js/kicadLibrary.js, vendored.test.ts):
   only what this app calls. */
export type KicadTarget = 'kicad9' | 'kicad10';
export interface KicadPin { unit: number; style: number; type: string; shape: string; at: [number, number, number]; length: number; hide: boolean; name: string; number: string }
export interface KicadProperty { name: string; value: string; at: [number, number, number]; size: number | null; hide: boolean; justify: string[] }
export interface KicadUnit { unit: number; style: number; name: string; graphics: unknown[]; pins: KicadPin[] }
export interface KicadSymbol { name: string; library: string; extends: string | null; properties: KicadProperty[]; pins: KicadPin[]; units: KicadUnit[]; [k: string]: unknown }
export interface KlcFinding { rule: string; level: 'error' | 'warning' | 'info'; message: string; pin?: string }
export interface BimPortRow { group?: string; terminal?: string; side?: string; domain?: string; connector?: string; block?: string; count?: number; labels?: string[] }
export interface BimPartLike {
  id?: string; manufacturer?: string; model?: string; name?: string; description?: string; category?: string; class?: string; stage?: string;
  datasheet?: string; ifcType?: string; ports?: BimPortRow[];
}
export function symbolFromPart(part: BimPartLike, opts?: { library?: string | null; footprint?: string; datasheet?: string | null; ifcType?: string | null; fpFilters?: string; panel?: unknown }): KicadSymbol;
export function panelPages(panel: unknown, vars?: Record<string, string | undefined>): { name: string; blocks: { name: string; controls: { key: string; name: string; type: string; side: 'input' | 'output'; command?: string }[] }[] }[];
export function writeSymbolLib(symbols: KicadSymbol[], opts?: { upstream?: boolean; generator?: string; target?: KicadTarget }): string;
export function klcCheck(sym: KicadSymbol): KlcFinding[];
export function defaultLibrary(part: BimPartLike): string;
export function safeName(s: string): string;
export function writeSchematic(opts: {
  title?: string; project?: string; symbols: KicadSymbol[]; target?: KicadTarget; comment?: string;
  instances: { libId: string; ref: string; unit?: number; at: [number, number]; rotation?: number; uuidKey?: string; fields?: Record<string, string>; shown?: Record<string, string> }[];
  wires?: boolean; spread?: boolean; groups?: { name: string; refs: string[] }[];
  nets: { name: string; nodes: { ref: string; pin: string }[] }[];
}): { text: string; placed: number; labelled: number; wired: number; skipped: string[] };
export function projectSymLibTable(libraries: string[]): string;
export function stableUuid(key: string): string;
export function zipFiles(files: Record<string, string>): Uint8Array;
