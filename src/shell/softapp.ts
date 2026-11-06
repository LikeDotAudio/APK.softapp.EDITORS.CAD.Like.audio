// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * THE SOFTAPP CLIENT, FROM THE CAD'S SIDE.
 *
 * public/vendor/apk-softapp/apk-softapp.js (FrontEnd/shared, vendored; drift
 * lane check.sh webshared) is a classic script index.html loads before the
 * bundle: window.APKSoftapp. Two things are used here — describe(), the ?
 * button (F1) listing what the CAD takes in, puts out and lets you control,
 * and showProblem(), an error drawn as what happened / why / do this with
 * Retry (codes: contracts/problems/problems.json). The CAD is also served on
 * its own; without the client a problem is still said, as a plain alert.
 */

export interface ProblemOptions {
  subject?: string;
  detail?: string;
  fix?: string[];
  onRetry?: () => void;
}

interface SoftappClient {
  describe(d: unknown): unknown;
  showProblem(what: unknown, opts?: ProblemOptions): unknown;
}

function client(): SoftappClient | undefined {
  return (window as unknown as { APKSoftapp?: SoftappClient }).APKSoftapp;
}

/** `what` is a problem code, an Error, or anything thrown. */
export function showProblem(what: unknown, opts: ProblemOptions = {}): void {
  const S = client();
  if (S) {
    S.showProblem(what, opts);
    return;
  }
  const head = typeof what === 'string' ? what.replace(/_/g, ' ') : String((what as Error)?.message ?? what);
  window.alert([head, opts.subject, opts.detail, ...(opts.fix ?? [])].filter(Boolean).join('\n'));
}

/** Once, at start-up: the ? panel. */
export function describeCad(): void {
  client()?.describe({
    name: 'CAD.Like.audio',
    does: 'A 2-D CAD: draw, dimension and lay out sheets in mm; the drawing board every APK.audio editor and softapp opens its blocks on.',
    inputs: [
      { name: 'DXF drawing', from: 'File ▸ Open... (Ctrl+O), or a recent file this browser cached', kind: 'file' },
      { name: 'Image to trace', from: 'File ▸ Import Image...', kind: 'file' },
      { name: 'Clipboard', from: 'File ▸ Create from Clipboard' },
      { name: 'Working session', from: 'this browser (restored on reload)' },
      { name: 'Host and block editors', from: 'a page that frames the CAD, or an editor opened on a block (cad.like.audio/host@1)' },
      { name: 'Big Picture sheet', from: 'the APK:OS server, at the Big Picture entrance (File ▸ Open Big Picture)' },
    ],
    outputs: [
      { name: 'DXF drawing', to: 'File ▸ Download DXF (Ctrl+S): a save dialog, or a download', kind: 'file' },
      { name: 'Big Picture sheet', to: 'File ▸ Save to Big Picture: the APK:OS server' },
      { name: 'Working session', to: 'this browser, saved as you go' },
      { name: 'View, geometry, mirror', to: 'the framing host (cad.like.audio/host@1); a block an editor saves lands back on the drawing' },
    ],
    controls: [
      { name: 'Menus', how: 'File, Edit, Drawing, Modify, Dimension' },
      { name: 'Ctrl+N / Ctrl+O / Ctrl+S / Ctrl+W', how: 'new, open, download DXF, close file' },
      { name: 'Typed commands', how: 'the menu shortcuts (AL, AW, BE, CB, FH, FV, MM, MR, RM, SA, SYM, Y ...) and typed distances in the dynamic input' },
      { name: 'Mouse', how: 'click to pick and draw, double-click to edit, wheel to zoom' },
      { name: 'Wire tool (W) on a wire', how: 'click a drawn wire to make it a cable: its BIM part (📚 library), label, length mm, colour, status; Not a cable clears it' },
    ],
    problems: ['bad_input', 'file_unreadable', 'save_failed', 'http_forbidden', 'storage_full', 'fetch_failed', 'script_error'],
  });
}
