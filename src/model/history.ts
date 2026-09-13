// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { MAX_HISTORY } from '../core/constants';
import type { DocSnapshot } from './Doc';

/** Bounded undo stack of whole-document snapshots. */
export class History {
  private stack: DocSnapshot[] = [];

  push(snapshot: DocSnapshot): void {
    this.stack.push(snapshot);
    if (this.stack.length > MAX_HISTORY) this.stack.shift();
  }

  pop(): DocSnapshot | undefined {
    return this.stack.pop();
  }

  get canUndo(): boolean {
    return this.stack.length > 0;
  }

  clear(): void {
    this.stack = [];
  }
}
