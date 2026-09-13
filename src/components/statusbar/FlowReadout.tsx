// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useUi } from '../../state/useUi';

/**
 * What the sheet holds that is a thing rather than a stroke. It reads the
 * connector COUNT rather than counting drawn lines, which is the visible proof
 * that a connection is a fact in the model and not an appearance on the canvas.
 */
export function FlowReadout() {
  const { flow } = useUi();
  if (flow.placements === 0 && flow.connectors === 0 && flow.groups === 0) return null;

  return (
    <span className="tracking-[0.04em] text-[#aaa]">
      {flow.placements} block{flow.placements === 1 ? '' : 's'} · {flow.connectors} connection
      {flow.connectors === 1 ? '' : 's'}
      {flow.groups > 0 && ` · ${flow.groups} group${flow.groups === 1 ? '' : 's'}`}
    </span>
  );
}
