// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useEffect, useRef } from 'react';
import { useEntrance } from '../shell/EntranceContext';
import { useStore } from '../state/useStore';
import { ContextMenu } from './contextmenu/ContextMenu';
import { DynInput } from './DynInput';
import { Hint } from './Hint';
import { ScaleBox } from './ScaleBox';

/**
 * Hosts the canvas and the overlays anchored to it. All pointer and keyboard
 * handling lives in the store; React only owns mounting and sizing.
 */
export function DrawingCanvas() {
  const store = useStore();
  const { title, hint } = useEntrance();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const detach = store.attach(canvas);
    const observer = new ResizeObserver(() => {
      const r = wrap.getBoundingClientRect();
      store.resize(r.width, r.height);
    });
    observer.observe(wrap);

    return () => {
      observer.disconnect();
      detach();
    };
  }, [store]);

  return (
    <div ref={wrapRef} className="relative flex-1 overflow-hidden bg-[#1e1e1e]">
      {/*
        The drawing surface has no DOM to describe it -- everything on it is
        painted. `aria-label` names it, and `aria-describedby` points at the
        entrance's own `hint`, which is the one sentence this app already
        writes to say what THIS door is for. `role="img"` is deliberate: the
        canvas is not focusable and the interaction model is pointer-on-canvas,
        so claiming `application` would promise keyboard operation that does
        not exist. See PLAN-111.02 step 6.
      */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${title} — drawing surface`}
        aria-describedby="kad-entrance-hint"
        className="absolute left-0 top-0"
      />
      <p id="kad-entrance-hint" className="sr-only">
        {hint}
      </p>
      <Hint />
      <ScaleBox />
      <DynInput />
      <ContextMenu />
    </div>
  );
}
