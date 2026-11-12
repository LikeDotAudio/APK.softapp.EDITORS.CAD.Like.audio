// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** BlockPreviewCanvas.tsx — The centre: the preview canvas with its toolbar, the base-point banner and the status readout.
 *  Part of BlockEditorModal; reads the editor's state and handlers from `ed`. */
import type { BlockEditorState } from './useBlockEditor';

export function BlockPreviewCanvas({ ed }: { ed: BlockEditorState }) {
  const {
    currentBlock, pickingBasePoint, setPickingBasePoint, canvasRef, zoom, setZoom, setPan, hoverWorld,
    handleZoomToFit, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel,
  } = ed;
  return (
    <>
      {/* 2. Center CAD Interactive Preview Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#141416] relative">
        {/* Canvas Toolbar Overlays */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-md border border-[#333] bg-[#1e1e1e]/90 p-1 backdrop-blur-xs">
          <button
            onClick={handleZoomToFit}
            className="rounded bg-[#2a2a2a] px-2 py-0.5 text-xs text-[#ccc] hover:bg-[#383838] hover:text-white"
            title="Zoom to Fit block geometry"
          >
            ⛶ Fit
          </button>
          <button
            onClick={() => {
              setZoom(30);
              setPan({ x: 0, y: 0 });
            }}
            className="rounded bg-[#2a2a2a] px-2 py-0.5 text-xs text-[#ccc] hover:bg-[#383838] hover:text-white"
            title="Reset View to 1:1 Origin"
          >
            ⌂ 1:1
          </button>
          <div className="h-4 w-px bg-[#444] mx-1" />
          <button
            onClick={() => setPickingBasePoint(!pickingBasePoint)}
            className={`rounded px-2.5 py-0.5 text-xs font-semibold transition-colors ${
              pickingBasePoint
                ? 'bg-[#eab308] text-black animate-pulse'
                : 'bg-[#333] text-[#ccc] hover:bg-[#444] hover:text-white'
            }`}
            title="Click on the canvas to set the block insertion base point"
          >
            ⊕ {pickingBasePoint ? 'Click to Set Base Point...' : 'Pick Base Point'}
          </button>
        </div>

        {/* Instruction Banner when picking base point */}
        {pickingBasePoint && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 rounded bg-[#eab308] px-4 py-1 text-xs font-bold text-black shadow-lg">
            Click anywhere on the preview canvas to set the insertion base point (snaps to 0.25)
          </div>
        )}

        {/* Canvas element */}
        <div className="flex-1 w-full h-full relative cursor-crosshair">
          <canvas
            ref={canvasRef}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onWheel={handleWheel}
            className="w-full h-full block"
          />
        </div>

        {/* Bottom status readout */}
        <div className="flex items-center justify-between border-t border-[#2d2d2d] bg-[#1a1a1a] px-3 py-1 text-[11px] text-[#888]">
          <div className="flex items-center gap-4">
            <span>
              Cursor: {hoverWorld ? `X: ${hoverWorld.x.toFixed(2)}, Y: ${hoverWorld.y.toFixed(2)}` : '—'}
            </span>
            <span>Zoom: {Math.round(zoom)} px/unit</span>
            <span>Base Point: ({currentBlock.basePoint.x.toFixed(2)}, {currentBlock.basePoint.y.toFixed(2)})</span>
          </div>
          <div className="text-[10px] text-[#666]">
            Wheel = Zoom • Drag = Pan • Red = X Axis • Green = Y Axis • Yellow = Base Point
          </div>
        </div>
      </div>
    </>
  );
}
