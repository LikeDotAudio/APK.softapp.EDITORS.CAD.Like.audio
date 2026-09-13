// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * Shared Tailwind class recipes for the editor chrome.
 *
 * Colour utilities are kept out of `BTN_BASE` and split into the variant
 * strings — two competing utilities for the same property (bg-paper vs bg-ink)
 * would otherwise be resolved by stylesheet order, not by which one we meant.
 */

export const BTN_BASE =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-[7px] ' +
  'text-[13px] font-medium transition-colors ' +
  '[&_svg]:h-[13px] [&_svg]:w-[13px] [&_svg]:shrink-0';

export const BTN_IDLE = 'border-rule-2 bg-paper text-ink hover:border-ink';

export const BTN_ACTIVE = 'border-ink bg-ink text-paper hover:border-black hover:bg-black';

/** Default (inactive) button. */
export const BTN = `${BTN_BASE} ${BTN_IDLE}`;

export const NUMBER_INPUT =
  'w-[72px] rounded-lg border border-rule-2 bg-paper px-2 py-1.5 text-center ' +
  'font-mono text-xs text-ink transition-colors focus:border-ink focus:outline-none';

export const LABEL_CAPS =
  'font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3';

export const SEPARATOR = 'h-[22px] w-px shrink-0 bg-rule';
