// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SavedSession } from '@io/browserStorage/SavedSession';
import { handoverFromHash, type HandoverChannel, type HandoverMessage, offerHandover, receiveHandover } from './hostHandover';

/** A BroadcastChannel bus: what one end posts, every OTHER open end hears (not itself), asynchronously. */
function bus() {
  const ends = new Set<HandoverChannel>();
  const log: HandoverMessage[] = [];
  const channel = (): HandoverChannel => {
    const end: HandoverChannel = {
      onmessage: null,
      postMessage(m) {
        log.push(m);
        const data = structuredClone(m);
        for (const other of ends) if (other !== end) queueMicrotask(() => other.onmessage?.({ data }));
      },
      close() {
        ends.delete(end);
      },
    };
    ends.add(end);
    return end;
  };
  return { channel, log, open: () => ends.size };
}

const drawing = (name: string) => ({ version: 1, timestamp: 1, currentFileName: name, userAuth: { user: 'me' }, docSnapshot: { edges: [{ id: 1 }] } }) as unknown as SavedSession;
const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

describe('the pop-out handover is CAD to CAD', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('reads the token from the address', () => {
    expect(handoverFromHash('#/drawing?host=acoustic&resume&handover=k3x9q2')).toBe('k3x9q2');
    expect(handoverFromHash('#/drawing?host=acoustic&resume')).toBeNull();
    expect(handoverFromHash('#/drawing?host=acoustic&handover=bad<tag>')).toBeNull();
  });

  it('the window gets the drawing whether the docked CAD speaks first or second, without the sign-in', async () => {
    for (const dockedFirst of [true, false]) {
      const b = bus();
      let got: Promise<SavedSession | null>;
      if (dockedFirst) {
        offerHandover('t1', () => drawing('Studio A.cad'), { channel: b.channel });
        got = receiveHandover('t1', { channel: b.channel });
      } else {
        got = receiveHandover('t1', { channel: b.channel });
        offerHandover('t1', () => drawing('Studio A.cad'), { channel: b.channel });
      }
      await flush();
      const s = await got;
      expect(s?.currentFileName).toBe('Studio A.cad');
      expect(s?.userAuth).toBeUndefined();
      await flush();
      expect(b.log.some((m) => m.kind === 'taken')).toBe(true);
      expect(b.open(), 'both ends closed once it is taken').toBe(0);
    }
  });

  it('a token pairs one docked CAD with one window: another host\'s drawing is not taken', async () => {
    const b = bus();
    offerHandover('other', () => drawing('Someone else.cad'), { channel: b.channel });
    offerHandover('mine', () => drawing('Mine.cad'), { channel: b.channel });
    const got = receiveHandover('mine', { channel: b.channel });
    await flush();
    expect((await got)?.currentFileName).toBe('Mine.cad');
  });

  it('nobody answers: null after the wait, and the window falls back to the autosave', async () => {
    const b = bus();
    const got = receiveHandover('t2', { channel: b.channel, ms: 4000 });
    vi.advanceTimersByTime(4000);
    expect(await got).toBeNull();
    expect(b.open()).toBe(0);
  });

  it('a docked CAD nobody takes from stops offering', () => {
    const b = bus();
    offerHandover('t3', () => drawing('A.cad'), { channel: b.channel, ms: 15000 });
    expect(b.open()).toBe(1);
    vi.advanceTimersByTime(15000);
    expect(b.open()).toBe(0);
  });
});
