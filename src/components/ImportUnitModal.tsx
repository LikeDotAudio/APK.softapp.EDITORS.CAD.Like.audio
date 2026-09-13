// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useState } from 'react';
import type { Units } from '../core/types';
import { unitFactor } from '../model/units/unitFactor';

interface ImportUnitModalProps {
  filename: string;
  detectedUnit?: Units;
  onConfirm: (sourceUnit: Units, targetUnit: Units) => void;
  onCancel: () => void;
}

const UNIT_OPTIONS: { id: Units; label: string; desc: string }[] = [
  { id: 'mm', label: 'Millimeters (mm)', desc: 'Metric - 1/1000 m' },
  { id: 'cm', label: 'Centimeters (cm)', desc: 'Metric - 1/100 m' },
  { id: 'm', label: 'Meters (m)', desc: 'Metric Base - 1 m' },
  { id: 'in', label: 'Inches (in)', desc: 'Imperial - 25.4 mm' },
  { id: 'ft', label: 'Feet (ft)', desc: 'Imperial - 12 inches' },
];

export function ImportUnitModal({
  filename,
  detectedUnit = 'mm',
  onConfirm,
  onCancel,
}: ImportUnitModalProps) {
  const [sourceUnit, setSourceUnit] = useState<Units>(detectedUnit);
  const [targetUnit, setTargetUnit] = useState<Units>(detectedUnit);

  const factor = unitFactor(sourceUnit, targetUnit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs select-none">
      <div className="w-full max-w-md rounded-xl border border-[#454545] bg-[#252526] p-5 text-xs text-[#cccccc] shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3c3c3c] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📐</span>
            <div>
              <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                Drawing Unit Conversion
              </h2>
              <p className="text-[11px] text-[#888] truncate max-w-[280px]">
                File: <span className="text-white font-mono">{filename}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-base text-[#888] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Source Unit Selection */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#aaa]">
            1. What unit is the drawing in? (Source Unit)
          </label>
          <select
            value={sourceUnit}
            onChange={(e) => setSourceUnit(e.target.value as Units)}
            className="w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2 text-xs text-white focus:border-[#f4902c] focus:outline-none"
          >
            {UNIT_OPTIONS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label} — {u.desc}
              </option>
            ))}
          </select>
        </div>

        {/* Target Base Unit Selection */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#aaa]">
            2. What base unit would you like to work in? (Base Unit)
          </label>
          <select
            value={targetUnit}
            onChange={(e) => setTargetUnit(e.target.value as Units)}
            className="w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2 text-xs text-white focus:border-[#f4902c] focus:outline-none"
          >
            {UNIT_OPTIONS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label} — {u.desc}
              </option>
            ))}
          </select>
        </div>

        {/* Conversion Scale Ratio Preview Box */}
        <div className="rounded-lg border border-[#f4902c]/40 bg-[rgba(244,144,44,0.18)] p-3 text-[11px] space-y-1">
          <div className="flex justify-between font-mono font-semibold text-white">
            <span>Scale Ratio:</span>
            <span className="text-[#38bdf8]">
              1.0 {sourceUnit} = {factor} {targetUnit}
            </span>
          </div>
          <p className="text-[#aaa] text-[10px]">
            {factor === 1
              ? 'Geometry will be imported 1:1 without scaling.'
              : `All coordinates will be scaled by ${factor} to convert from ${sourceUnit} to ${targetUnit}.`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3c3c3c]">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-4 py-1.5 text-xs text-[#aaa] hover:bg-[#383838] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(sourceUnit, targetUnit)}
            className="rounded bg-[#f4902c] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#ffa552] transition-colors shadow-sm"
          >
            Convert & Open Drawing
          </button>
        </div>
      </div>
    </div>
  );
}
