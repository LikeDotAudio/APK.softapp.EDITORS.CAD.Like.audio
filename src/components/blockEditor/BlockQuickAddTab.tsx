// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** BlockQuickAddTab.tsx — Inspector tab Quick Add: pin / lead, box, line, circle, arc, text and fill tools.
 *  Part of BlockEditorModal; reads the editor's state and handlers from `ed`. */
import type { BlockEditorState } from './useBlockEditor';

export function BlockQuickAddTab({ ed }: { ed: BlockEditorState }) {
  const {
    activeTab, lineX1, setLineX1, lineY1, setLineY1, lineX2, setLineX2, lineY2,
    setLineY2, boxX, setBoxX, boxY, setBoxY, boxW, setBoxW, boxH,
    setBoxH, circleCx, setCircleCx, circleCy, setCircleCy, circleR, setCircleR, arcCx,
    setArcCx, arcCy, setArcCy, arcR, setArcR, arcA1, setArcA1, arcA2,
    setArcA2, textStr, setTextStr, textX, setTextX, textY, setTextY, textH,
    setTextH, textRot, setTextRot, pinX, setPinX, pinY, setPinY, pinLen,
    setPinLen, pinDir, setPinDir, pinLabel, setPinLabel, fillW, setFillW, fillH,
    setFillH, fillColor, setFillColor, fillOpacity, setFillOpacity, handleAddLine, handleAddBox, handleAddCircle,
    handleAddArc, handleAddText, handleAddTerminalPin, handleAddFillBox,
  } = ed;
  return (
    <>
      {/* TAB: Quick Add Tools */}
      {activeTab === 'quickAdd' && (
        <div className="space-y-4">
          {/* Pin / Port Tool (Essential for CAD Schematics) */}
          <div className="rounded border border-[#333] bg-[#252526] p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>🔌</span> Pin / Terminal Lead
              </span>
              <button
                onClick={handleAddTerminalPin}
                className="rounded bg-[#0e639c] px-2 py-0.5 text-xs text-white hover:bg-[#1177bb]"
              >
                + Add Pin
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-[#888]">Start X, Y</label>
                <div className="flex gap-1 mt-0.5">
                  <input
                    type="number"
                    step="0.5"
                    value={pinX}
                    onChange={(e) => setPinX(e.target.value)}
                    className="w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5"
                  />
                  <input
                    type="number"
                    step="0.5"
                    value={pinY}
                    onChange={(e) => setPinY(e.target.value)}
                    className="w-full rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#888]">Length & Dir</label>
                <div className="flex gap-1 mt-0.5">
                  <input
                    type="number"
                    step="0.5"
                    value={pinLen}
                    onChange={(e) => setPinLen(e.target.value)}
                    className="w-14 rounded border border-[#3c3c3c] bg-[#141414] px-1.5 py-0.5"
                  />
                  <select
                    value={pinDir}
                    onChange={(e) => setPinDir(e.target.value as any)}
                    className="flex-1 rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5 text-xs"
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="up">Up</option>
                    <option value="down">Down</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#888]">Port Label</label>
              <input
                type="text"
                value={pinLabel}
                onChange={(e) => setPinLabel(e.target.value)}
                placeholder="e.g. IN, OUT, VCC, GND"
                className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-2 py-0.5 text-xs"
              />
            </div>
          </div>

          {/* Rectangle / Box Tool */}
          <div className="rounded border border-[#333] bg-[#252526] p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>▭</span> Box / Body Outline
              </span>
              <button
                onClick={handleAddBox}
                className="rounded bg-[#0e639c] px-2 py-0.5 text-xs text-white hover:bg-[#1177bb]"
              >
                + Add Box
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              <div>
                <label className="text-[10px] text-[#888]">X</label>
                <input
                  type="number"
                  step="0.5"
                  value={boxX}
                  onChange={(e) => setBoxX(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">Y</label>
                <input
                  type="number"
                  step="0.5"
                  value={boxY}
                  onChange={(e) => setBoxY(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">Width</label>
                <input
                  type="number"
                  step="0.5"
                  value={boxW}
                  onChange={(e) => setBoxW(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">Height</label>
                <input
                  type="number"
                  step="0.5"
                  value={boxH}
                  onChange={(e) => setBoxH(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
            </div>
          </div>

          {/* Quick Line Tool */}
          <div className="rounded border border-[#333] bg-[#252526] p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>📏</span> Single Line
              </span>
              <button
                onClick={handleAddLine}
                className="rounded bg-[#0e639c] px-2 py-0.5 text-xs text-white hover:bg-[#1177bb]"
              >
                + Add Line
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              <div>
                <label className="text-[10px] text-[#888]">X1</label>
                <input
                  type="number"
                  step="0.5"
                  value={lineX1}
                  onChange={(e) => setLineX1(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">Y1</label>
                <input
                  type="number"
                  step="0.5"
                  value={lineY1}
                  onChange={(e) => setLineY1(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">X2</label>
                <input
                  type="number"
                  step="0.5"
                  value={lineX2}
                  onChange={(e) => setLineX2(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">Y2</label>
                <input
                  type="number"
                  step="0.5"
                  value={lineY2}
                  onChange={(e) => setLineY2(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
            </div>
          </div>

          {/* Quick Circle Tool */}
          <div className="rounded border border-[#333] bg-[#252526] p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>⭕</span> Circle
              </span>
              <button
                onClick={handleAddCircle}
                className="rounded bg-[#0e639c] px-2 py-0.5 text-xs text-white hover:bg-[#1177bb]"
              >
                + Add Circle
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <div>
                <label className="text-[10px] text-[#888]">Center X</label>
                <input
                  type="number"
                  step="0.5"
                  value={circleCx}
                  onChange={(e) => setCircleCx(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">Center Y</label>
                <input
                  type="number"
                  step="0.5"
                  value={circleCy}
                  onChange={(e) => setCircleCy(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">Radius</label>
                <input
                  type="number"
                  step="0.25"
                  value={circleR}
                  onChange={(e) => setCircleR(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
            </div>
          </div>

          {/* Quick Arc Tool */}
          <div className="rounded border border-[#333] bg-[#252526] p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>⌒</span> Arc
              </span>
              <button
                onClick={handleAddArc}
                className="rounded bg-[#0e639c] px-2 py-0.5 text-xs text-white hover:bg-[#1177bb]"
              >
                + Add Arc
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-xs">
              <div>
                <label className="text-[10px] text-[#888]">Center X</label>
                <input
                  type="number"
                  step="0.5"
                  value={arcCx}
                  onChange={(e) => setArcCx(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">Center Y</label>
                <input
                  type="number"
                  step="0.5"
                  value={arcCy}
                  onChange={(e) => setArcCy(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">Radius</label>
                <input
                  type="number"
                  step="0.25"
                  value={arcR}
                  onChange={(e) => setArcR(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">Start °</label>
                <input
                  type="number"
                  step="15"
                  value={arcA1}
                  onChange={(e) => setArcA1(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">End °</label>
                <input
                  type="number"
                  step="15"
                  value={arcA2}
                  onChange={(e) => setArcA2(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
            </div>
          </div>

          {/* Quick Text Tool */}
          <div className="rounded border border-[#333] bg-[#252526] p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>🔤</span> Text Label
              </span>
              <button
                onClick={handleAddText}
                className="rounded bg-[#0e639c] px-2 py-0.5 text-xs text-white hover:bg-[#1177bb]"
              >
                + Add Text
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              <div className="col-span-4">
                <label className="text-[10px] text-[#888]">Label Text</label>
                <input
                  type="text"
                  value={textStr}
                  onChange={(e) => setTextStr(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-2 py-0.5 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">X</label>
                <input
                  type="number"
                  step="0.5"
                  value={textX}
                  onChange={(e) => setTextX(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">Y</label>
                <input
                  type="number"
                  step="0.5"
                  value={textY}
                  onChange={(e) => setTextY(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">Height</label>
                <input
                  type="number"
                  step="0.1"
                  value={textH}
                  onChange={(e) => setTextH(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">Rot (°)</label>
                <input
                  type="number"
                  step="15"
                  value={textRot}
                  onChange={(e) => setTextRot(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
            </div>
          </div>

          {/* Quick Fill Box Tool */}
          <div className="rounded border border-[#333] bg-[#252526] p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>🎨</span> Fill / Hatch Box
              </span>
              <button
                onClick={handleAddFillBox}
                className="rounded bg-[#0e639c] px-2 py-0.5 text-xs text-white hover:bg-[#1177bb]"
              >
                + Add Fill
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              <div>
                <label className="text-[10px] text-[#888]">W</label>
                <input
                  type="number"
                  step="0.5"
                  value={fillW}
                  onChange={(e) => setFillW(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">H</label>
                <input
                  type="number"
                  step="0.5"
                  value={fillH}
                  onChange={(e) => setFillH(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">Opacity</label>
                <input
                  type="number"
                  step="0.05"
                  value={fillOpacity}
                  onChange={(e) => setFillOpacity(e.target.value)}
                  className="mt-0.5 w-full rounded border border-[#3c3c3c] bg-[#141414] px-1 py-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#888]">Color</label>
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="mt-0.5 h-6 w-full rounded border border-[#3c3c3c] bg-[#141414] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
